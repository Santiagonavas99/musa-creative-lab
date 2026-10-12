const assert = require("node:assert/strict");
const fs = require("node:fs");
const vm = require("node:vm");
const path = require("node:path");

const root = path.resolve(__dirname, "..");
const html = fs.readFileSync(path.join(root, "index.html"), "utf8");
const api = fs.readFileSync(path.join(root, "api/inspiration.js"), "utf8");
const showcaseJS = fs.readFileSync(path.join(root, "public/showcase-controller.js"), "utf8");
const inline = [...html.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/g)];
assert.ok(inline.length > 0, "MUSA must contain client application JavaScript");
for (const [, source] of inline) new vm.Script(source, {filename: "index.html"});
new vm.Script(api, {filename: "api/inspiration.js"});
new vm.Script(showcaseJS, {filename: "showcase-controller.js"});
const reactIsland = fs.readFileSync(path.join(root, "src/circular-carousel-entry.jsx"), "utf8");
const bitsComponent = fs.readFileSync(path.join(root, "src/components/CircularCarousel/CircularCarousel.jsx"), "utf8");
const showcaseCSS = fs.readFileSync(path.join(root, "public/showcase.css"), "utf8");
assert.match(reactIsland, /<CircularCarousel/, "React Bits CircularCarousel must be mounted");
assert.match(reactIsland, /preset="cylinder"/, "Use the supplied cylinder preset");
assert.match(reactIsland, /intro="rise"/, "Keep the intended rise intro");
assert.match(reactIsland, /speed=\{14\}/, "Use supplied motion speed");
assert.match(reactIsland, /testImage\(item\.image\)/, "Broken image URLs must not be placed in 3D cards");
assert.match(bitsComponent, /circular-carousel__card/, "Use official HTML and CSS3D implementation");
assert.match(showcaseCSS, /\.musa-carousel-html/, "Show images before the 3D component is ready");
assert.match(showcaseJS, /Math\.random\(\)/, "Shuffle references every page load");
assert.match(showcaseJS, /source=all/, "Pull from the real provider gateway");
assert.match(showcaseJS, /musa-circular-carousel-root/, "Expected circular carousel mount point");
assert.ok(!('ogl' in require('../package.json').dependencies), 'WebGL dependencies should be removed');
assert.match(html, /renderShowcase\(\)/, "Explore must place the carousel under its heading");
assert.match(html, /\/src\/circular-carousel-entry\.jsx/, "React Bits entry point should be built by Vite");
assert.match(html, /renderInspiration\(\)/, "Explore page should embed real search interface");
assert.doesNotMatch(html, /Las integraciones visuales dentro de la app llegarán en una próxima versión/);
console.log("✓ Both JavaScript files parse correctly");

const privacy = fs.readFileSync(path.join(root, "politica-de-privacidad/index.html"), "utf8");
const terms = fs.readFileSync(path.join(root, "terminos-de-uso/index.html"), "utf8");
const legalCSS = fs.readFileSync(path.join(root, "legal.css"), "utf8");
assert.ok(legalCSS.includes(".hero"), "Legal design styles should be available");
assert.match(privacy, /<title>Política de Privacidad — MUSA Creative Laboratory<\/title>/);
assert.match(privacy, /musacreativelaboratory@gmail\.com/);
assert.match(privacy, /localStorage/);
assert.match(privacy, /Unsplash/);
assert.match(privacy, /Pinterest/);
assert.match(terms, /<title>Términos de Uso — MUSA Creative Laboratory<\/title>/);
assert.match(terms, /musacreativelaboratory@gmail\.com/);
assert.match(terms, /\/politica-de-privacidad\//);
assert.match(html, /href="\/politica-de-privacidad\/"/);
assert.match(html, /href="\/terminos-de-uso\/"/);
assert.match(html, /aria-label="Información legal"/);
console.log("✓ Legal pages, contact email, data disclosures and footer links verified");


const nodes = new Map();
const fakeElement = () => ({
  innerHTML: "", value: "", textContent: "", classList:{add(){},remove(){}}
});
const ctx = vm.createContext({
  document: {getElementById(id){if(!nodes.has(id)){const node=fakeElement();if(id==="query")node.value="collage experimental";nodes.set(id,node)}return nodes.get(id)}},
  localStorage: {getItem(){return null},setItem(){}},
  window: {scrollTo(){},addEventListener(){}},
  console,
  URL,
  setTimeout(){return 1},clearTimeout(){},
  setInterval(){return 1},clearInterval(){},
  crypto:{randomUUID(){return "test-uuid"}},
  fetch:async()=>({ok:true,json:async()=>({results:[{
    id:"1",source:"unsplash",title:"Abstract lines",creator:"Jane Doe",
    image:"https://images.unsplash.com/example.jpg",
    link:"https://unsplash.com/photos/example",
    creatorUrl:"https://unsplash.com/@jane",
    sourceUrl:"https://unsplash.com",
    license:"Licencia Unsplash"
  }]})}),
});
vm.runInContext(inline[0][1], ctx, {filename:"MUSA.inline.js"});
vm.runInContext(showcaseJS, ctx, {filename:"showcase-controller.js"});
assert.match(nodes.get("app").innerHTML,/NO NECESITAS UNA GRAN IDEA/);
vm.runInContext('page="explorar";render()',ctx);
assert.match(nodes.get("app").innerHTML,/BUSCA REFERENCIAS/);
assert.match(nodes.get("app").innerHTML,/⌕ Buscar imágenes/);
assert.match(nodes.get("app").innerHTML,/UNA CHISPA VISUAL AL AZAR/);
assert.ok(nodes.get("app").innerHTML.indexOf("UNA CHISPA VISUAL AL AZAR") <
  nodes.get("app").innerHTML.indexOf("GENERADOR MUSA"), "Carousel must precede Explore cards");
console.log("✓ MUSA boots and renders Explore with search controls");

(async()=>{
  await vm.runInContext("lookupInspiration()",ctx);
  await new Promise(resolve => setImmediate(resolve));
  const results=nodes.get("app").innerHTML;
  assert.match(results, /musa-circular-carousel-root/, "Randomized API references should populate the carousel");
  assert.match(results,/Abstract lines/);
  assert.match(results,/Foto de/);
  assert.match(results,/Jane Doe/);
  vm.runInContext("saveVisualReference(0)",ctx);
  assert.match(nodes.get("app").innerHTML,/REFERENCIAS GUARDADAS/);
  console.log("✓ Results, photographer credits and saved references work");
  console.log("All checks passed.");
})().catch(err=>{console.error(err);process.exitCode=1});
