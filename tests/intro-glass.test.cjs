"use strict";
const assert=require("node:assert/strict");
const fs=require("node:fs");
const path=require("node:path");
const test=require("node:test");
const root=path.join(__dirname,"..");
const html=fs.readFileSync(path.join(root,"index.html"),"utf8");
const css=fs.readFileSync(path.join(root,"public/intro-glass.css"),"utf8");
const collage=fs.readFileSync(path.join(root,"public/intro-collage.svg"),"utf8");
const art=fs.readFileSync(path.join(root,"public/intro-hand.webp"));

test("the MUSA intro keeps its exact approved copy and working action",()=>{
  assert.match(html, /TU PRÓXIMA IDEA EMPIEZA AQUÍ\./);
  assert.match(html, /MUSA es un laboratorio creativo digital donde encuentras ideas, exploras inspiración visual y descubres retos para crear algo nuevo\./);
  assert.match(html, /Experimenta, crea y guarda tus proyectos\. A tu ritmo, sin presión\./);
  assert.match(html, /onclick="go\(\\'explorar\\'\)">EMPEZAR A CREAR ↗/);
  assert.match(html, /id="musa-intro-title"/);
});
test("the responsive glass hero has accessible independent decorative media",()=>{
  assert.match(html, /musa-hero-glass/);
  assert.match(html, /musa-hero-copy/);
  assert.match(html, /class="musa-hero-art" aria-hidden="true"/);
  assert.match(html, /src="\/intro-hand\.webp" alt=""/);
  assert.match(html, /href="\/intro-glass\.css"/);
  assert.match(css, /backdrop-filter:blur\(18px\)/);
  assert.match(css, /\.musa-hero-glass/);
  assert.match(css, /@media\(max-width:680px\)/);
  assert.match(css, /prefers-reduced-motion:reduce/);
  assert.match(collage, /<svg/);
  assert.match(collage, /#d7ff42/);
  assert.match(collage, /#8f4aff/);
});
test("the approved illustration is bundled locally and is a complete WebP asset",()=>{
  assert.equal(art.toString("ascii",0,4),"RIFF");
  assert.equal(art.toString("ascii",8,12),"WEBP");
  assert.equal(art.readUInt32LE(4)+8,art.length,"No partial upload or corrupted RIFF length");
  assert.ok(art.length>3500);
});
