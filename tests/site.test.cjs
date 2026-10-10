"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");

const root = path.resolve(__dirname, "..");
const read = (file) => fs.readFileSync(path.join(root, file), "utf8");

test("MUSA has a Spanish HTML entry point and PWA manifest", () => {
  const html = read("index.html");
  const manifest = JSON.parse(read("manifest.webmanifest"));

  assert.match(html, /<html\\b[^>]*lang="es"/i);
  assert.match(html, /<meta\\s+name="viewport"/i);
  assert.match(html, /<link\\s+rel="manifest"\\s+href="\\/manifest\\.webmanifest"/i);
  assert.equal(manifest.short_name, "MUSA");
  assert.equal(manifest.start_url, "/");
  assert.equal(manifest.display, "standalone");
});

test("privacy and terms pages are reachable from the app", () => {
  const html = read("index.html");
  const privacy = read("politica-de-privacidad/index.html");
  const terms = read("terminos-de-uso/index.html");

  assert.match(html, /href="\\/politica-de-privacidad\\/"/);
  assert.match(html, /href="\\/terminos-de-uso\\/"/);
  assert.match(privacy, /musacreativelaboratory@gmail\\.com/);
  assert.match(terms, /musacreativelaboratory@gmail\\.com/);
});

test("the image search credentials are not embedded in the client", () => {
  const html = read("index.html");
  assert.doesNotMatch(html, /UNSPLASH_ACCESS_KEY/);
  assert.match(read("api/inspiration.js"), /process\\.env\\.UNSPLASH_ACCESS_KEY/);
});
