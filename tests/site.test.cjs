"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");
const vm = require("node:vm");

const root = path.resolve(__dirname, "..");
const read = (file) => fs.readFileSync(path.join(root, file), "utf8");

test("MUSA has a Spanish HTML entry point and PWA manifest", () => {
  const html = read("index.html");
  const manifest = JSON.parse(read("manifest.webmanifest"));

  assert.match(html, /<html\b[^>]*lang="es"/i);
  assert.match(html, /<meta\s+name="viewport"/i);
  assert.match(html, /<link\s+rel="manifest"\s+href="\/manifest\.webmanifest"/i);
  assert.equal(manifest.short_name, "MUSA");
  assert.equal(manifest.start_url, "/");
  assert.equal(manifest.display, "standalone");
});

test("privacy and terms pages are reachable from the app", () => {
  const html = read("index.html");
  const privacy = read("politica-de-privacidad/index.html");
  const terms = read("terminos-de-uso/index.html");

  assert.match(html, /href="\/politica-de-privacidad\/"/);
  assert.match(html, /href="\/terminos-de-uso\/"/);
  assert.match(privacy, /musacreativelaboratory@gmail\.com/);
  assert.match(terms, /musacreativelaboratory@gmail\.com/);
});

test("the image search credentials are not embedded in the client", () => {
  const html = read("index.html");
  assert.doesNotMatch(html, /UNSPLASH_ACCESS_KEY/);
  assert.match(read("api/inspiration.js"), /process\.env\.UNSPLASH_ACCESS_KEY/);
});


test("failed previews attempt a backup then remove broken search cards without leaving gaps", () => {
  const inline = read("index.html");
  const handler = inline.match(/function repairReferenceImage\(img\)\{[\s\S]*?\n\}/)?.[0];
  assert.ok(handler, "A shared image recovery handler must exist");
  assert.match(inline, /onerror="repairReferenceImage\(this\)"/);
  const failures = new Set();
  const badge = { textContent: "1 referencias" };
  const grid = { outerHTML: "", querySelectorAll: () => [] };
  let removed = false;
  const card = { isConnected: true, dataset: { refKey: "artic:18", savedMode: "false" },
    remove() { removed = true; } };
  const cover = { classList: { add() {} }, innerHTML: "" };
  const image = {
    src: "https://www.artic.edu/iiif/2/first/full/843,/0/default.jpg",
    dataset: { backup: "https://www.artic.edu/iiif/2/second/full/843,/0/default.jpg" },
    closest(selector) { return selector === ".ref-card" ? card : cover; },
  };
  const ctx = {
    testImage: image, unavailableReferenceKeys: failures,
    safeHref(raw) { try { const url = new URL(raw); return url.protocol === "https:" ? url.href : ""; }
      catch { return ""; } },
    document: { querySelector(selector) {
      return selector === ".inspire-results .ref-grid" ? grid :
        selector === ".inspire-results .badge" ? badge : null;
    } },
    referencePlaceholder() { return "No preview"; },
  };
  vm.runInNewContext(handler + "; repairReferenceImage(testImage)", ctx);
  assert.equal(image.src, image.dataset.backup, "Try the alternate real photograph first");
  assert.equal(removed, false, "Do not discard a reference before fallback is attempted");
  vm.runInNewContext(handler + "; repairReferenceImage(testImage)", ctx);
  assert.equal(removed, true, "A permanently unavailable search result must disappear");
  assert.equal(failures.has("artic:18"), true, "Track failures across subsequent renders");
  assert.equal(badge.textContent, "0 referencias");
  assert.match(grid.outerHTML, /NO HAY IMÁGENES DISPONIBLES/);
});

test("saved references retain their original link and receive a branded placeholder when images fail", () => {
  const inline = read("index.html");
  const handler = inline.match(/function repairReferenceImage\(img\)\{[\s\S]*?\n\}/)?.[0];
  const failures = new Set();
  let removed = false;
  const card = { isConnected: true, dataset: { refKey: "met:123", savedMode: "true" },
    remove() { removed = true; } };
  let styleAdded = false;
  const cover = { innerHTML: "", classList: { add() { styleAdded = true; } } };
  const image = {
    src: "https://images.metmuseum.org/broken.jpg",
    dataset: { backup: "" },
    closest(selector) { return selector === ".ref-card" ? card : cover; },
  };
  vm.runInNewContext(handler + "; repairReferenceImage(testImage)", {
    testImage: image, unavailableReferenceKeys: failures,
    safeHref() { return ""; }, referencePlaceholder() { return "Vista previa no disponible"; },
  });
  assert.equal(removed, false, "Saved references must not be deleted");
  assert.equal(cover.innerHTML, "Vista previa no disponible");
  assert.equal(styleAdded, true);
  assert.equal(failures.has("met:123"), true);
});
