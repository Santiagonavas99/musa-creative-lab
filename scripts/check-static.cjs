const assert = require("node:assert/strict");
const fs = require("node:fs");
const vm = require("node:vm");
const path = require("node:path");

const root = path.resolve(__dirname, "..");
const html = fs.readFileSync(path.join(root, "index.html"), "utf8");
const api = fs.readFileSync(path.join(root, "api/inspiration.js"), "utf8");
const showcaseJS = fs.readFileSync(path.join(root, "public/showcase-controller.js"), "utf8");
const boardsJS = fs.readFileSync(path.join(root, "public/boards.js"), "utf8");
const boardsCSS = fs.readFileSync(path.join(root, "public/boards.css"), "utf8");
const inline = [...html.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/g)].filter(([,source])=>source.trim());
assert.ok(inline.length > 0, "MUSA must contain client application JavaScript");
for (const [, source] of inline) new vm.Script(source, {filename: "index.html"});
new vm.Script(api, {filename: "api/inspiration.js"});
new vm.Script(showcaseJS, {filename: "showcase-controller.js"});
new vm.Script(boardsJS, {filename: "boards.js"});
assert.match(html, /src="\/boards\.js"/, "Board organizer must load before MUSA inline app");
assert.match(html, /href="\/boards\.css"/, "Board styling must ship with the site");
assert.match(boardsCSS, /@media\(max-width:480px\)/, "Boards must adapt to narrow mobile screens");
const reactIsland = fs.readFileSync(path.join(root, "src/circular-carousel-entry.jsx"), "utf8");
const bitsComponent = fs.readFileSync(path.join(root, "src/components/CircularCarousel/CircularCarousel.jsx"), "utf8");
const showcaseCSS = fs.readFileSync(path.join(root, "public/showcase.css"), "utf8");
const mobileMenuCSS = fs.readFileSync(path.join(root, "public/mobile-menu.css"), "utf8");
assert.doesNotMatch(html, /CREATIVE LAB \/ 01/, "Desktop and mobile must not display the old header tag");
assert.doesNotMatch(html, /id="bottom"/, "Mobile bottom navigation must be removed");
assert.match(html, /id="mobile-menu-toggle"[^>]*aria-controls="mobile-menu"[^>]*aria-expanded="false"/, "Accessible three-line menu toggle must be present");
assert.match(html, /id="mobile-menu"[^>]*hidden/, "Mobile navigation starts closed");
assert.match(html, /id="mobile-menu-scrim"[^>]*onclick="closeMobileMenu\(\)"/, "Outside tap closes the menu");
assert.match(html, /\/mobile-menu\.css/, "Responsive navigation styles are loaded");
assert.match(mobileMenuCSS, /@media\(max-width:680px\)/, "Hamburger only appears at mobile widths");
assert.match(mobileMenuCSS, /\.mobile-menu-toggle\s*\{/, "Header includes a mobile-only three-line trigger");
assert.match(mobileMenuCSS, /position:absolute;left:50%;transform:translateX\(-50%\)/, "Desktop navigation stays centered");
assert.match(mobileMenuCSS, /\.mobile-menu-link\.active/, "Active section has a distinct visual state");
assert.match(html, /event\.key==='Escape'/, "Escape closes dropdown");
assert.match(html, /event\.key!=='Tab'/, "Tab focus must be constrained to open menu");

const nativeCarouselJS = fs.readFileSync(path.join(root, "public/native-carousel.js"), "utf8");
const vectorStar = fs.readFileSync(path.join(root, "public/musa-asterisk.svg"), "utf8");
const favicon = fs.readFileSync(path.join(root, "favicon.svg"), "utf8");
new vm.Script(nativeCarouselJS, {filename:"native-carousel.js"});
assert.ok(!html.includes("✳"), "Replace every font asterisk in the app with SVG");
assert.ok(!showcaseJS.includes("✳"), "Replace every font asterisk in the showcase");
assert.match(html, /<symbol id="musa-mark-icon"/, "MUSA vector asterisk must be declared as an SVG symbol");
assert.match(html, /<use href="#musa-mark-icon"/, "App mark must use SVG, not text glyphs");
assert.match(html, /\/native-carousel\.js/, "Native carousel controller must be included");
assert.match(html, /musaNativeCarousel\?\.unmount/, "Native touch listeners must be released on navigation");
assert.match(html, /-webkit-mask:url\('\/musa-asterisk\.svg'\)/, "Hero asterisk must be vector, too");
assert.match(vectorStar, /<svg[^>]*viewBox=/, "SVG icon must have vector geometry");
const exactStar = favicon.match(/<path fill="#ff7049" d="([^"]+)"/)?.[1];
assert.ok(exactStar && vectorStar.includes(exactStar), "Keep the EXACT original favicon asterisk silhouette");
assert.match(reactIsland, /\(max-width: 760px\), \(pointer: coarse\)/, "Touch devices must use the lightweight carousel");
assert.match(showcaseCSS, /touch-action:pan-y/, "Horizontal swipes must preserve vertical page scrolling");
assert.match(nativeCarouselJS, /setPointerCapture/, "Horizontal gesture must capture the pointer");
assert.match(nativeCarouselJS, /stopImmediatePropagation/, "Dragging must not accidentally open an artwork");

assert.match(reactIsland, /<CircularCarousel/, "React Bits CircularCarousel must be mounted");
assert.match(reactIsland, /preset="cylinder"/, "Use the supplied cylinder preset");
assert.match(reactIsland, /fadeColor="#f5f0e7"/, "Depth fade must blend with MUSA's cream background");
assert.match(showcaseCSS, /\.musa-carousel-frame\{[^}]*background:transparent;color:#211b36;border:0;border-radius:0;box-shadow:none\}/, "Carousel panel must be invisible against the page");
assert.doesNotMatch(showcaseCSS, /background:radial-gradient\(/, "No purple panel gradient may remain");
assert.match(reactIsland, /intro="rise"/, "Keep the intended rise intro");
assert.match(reactIsland, /speed=\{14\}/, "Use supplied motion speed");
assert.doesNotMatch(reactIsland, /testImage\(/, "Do not fetch images twice before rendering");
assert.match(showcaseJS, /usableShowcaseItems/, "Only validated images should be added to the ring");
assert.match(showcaseJS, /verified\.slice\(0,6\)/, "Compact ring must avoid massive gaps");
assert.match(showcaseJS, /&quick=1/, "Carousel must use fast source lookup");
assert.match(api, /Promise\.race\(/, "Fast API must not wait for slow providers");
assert.match(api, /3200/, "Fast API response has a bounded deadline");
assert.match(showcaseJS, /repairShowcase\(/, "Broken images must be replaced or removed");
assert.match(bitsComponent, /circular-carousel__card/, "Use official HTML and CSS3D implementation");
assert.match(showcaseCSS, /\.musa-native-cylinder/, "Show an instant 3D cylinder");
assert.match(showcaseCSS, /@keyframes musa-native-orbit/, "CSS3D circular fallback must rotate");
assert.match(showcaseCSS, /rotateY\(var\(--angle\)\) translateZ\(var\(--ring-radius\)\)/, "Fallback cards must be placed on a 3D ring");
assert.match(reactIsland, /native\.dataset\.hidden = 'true'/, "Hide the fallback only after photos are visible");
assert.match(reactIsland, /getBoundingClientRect\(\)/, "A ready signal alone must not hide the visible fallback");
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
  innerHTML: "", value: "", textContent: "", hidden: false,
  attributes: {},
  classList:{add(){},remove(){},toggle(){}},
  setAttribute(name,value){this.attributes[name]=String(value)},
  getAttribute(name){return this.attributes[name]??null},
  focus(){},
  querySelector(){return {focus(){}}},
  querySelectorAll(){return []}
});
const documentListeners = {};
const ctx = vm.createContext({
  document: {
    body: {classList:{toggle(){}}},
    addEventListener(name,handler){documentListeners[name]=handler},
    getElementById(id){if(!nodes.has(id)){const node=fakeElement();if(id==="query")node.value="collage experimental";nodes.set(id,node)}return nodes.get(id)}
  },
  localStorage: {getItem(){return null},setItem(){}},
  window: {scrollTo(){},addEventListener(){}},
  Image: class {
    constructor(){this.naturalWidth=0;this.naturalHeight=0;}
    set src(url){
      const good=!url.includes("/broken.jpg");
      this.naturalWidth=good?400:0;this.naturalHeight=good?400:0;
      if(good)this.onload?.();else this.onerror?.();
    }
  },
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
  },
  ...[
    ["met","The Met","2"],["artic","Art Institute of Chicago","3"],
    ["wikimedia","Wikimedia Commons","4"],["unsplash","Another photo","5"],
    ["met","Broken image","broken"]
  ].map(([source,title,id])=>({
    id,source,title,creator:"Artist",image:"https://example.com/"+id+".jpg",
    link:"https://example.com/art/"+id
  }))]})}),
});
vm.runInContext(boardsJS, ctx, {filename:"boards.js"});
vm.runInContext(inline[0][1], ctx, {filename:"MUSA.inline.js"});
vm.runInContext(showcaseJS, ctx, {filename:"showcase-controller.js"});
assert.match(nodes.get("app").innerHTML,/NO NECESITAS UNA GRAN IDEA/);
vm.runInContext('page="explorar";render()',ctx);
assert.match(nodes.get("app").innerHTML,/BUSCA REFERENCIAS/);
assert.match(nodes.get("app").innerHTML,/⌕ Buscar imágenes/);
assert.match(nodes.get("app").innerHTML,/UNA CHISPA VISUAL AL AZAR/);
const mobileNav = nodes.get("mobile-menu").innerHTML;
for(const section of ["Inicio","Explorar","Mi estudio","Actividad"]) {
  assert.ok(mobileNav.includes(">"+section+"</button>"), section+" must appear in mobile menu");
}
assert.equal((mobileNav.match(/mobile-menu-link/g)||[]).length,4,"Exactly four mobile sections");
assert.match(mobileNav,/aria-current="page"[^>]*>Explorar<\/button>/, "Explore should be highlighted");
vm.runInContext("toggleMobileMenu()",ctx);
assert.equal(nodes.get("mobile-menu").hidden,false,"Hamburger opens navigation");
assert.equal(nodes.get("mobile-menu-scrim").hidden,false,"Backdrop appears behind open menu");
assert.equal(nodes.get("mobile-menu-toggle").getAttribute("aria-expanded"),"true");
let escapePrevented=false;
documentListeners.keydown({key:"Escape",preventDefault(){escapePrevented=true}});
assert.ok(escapePrevented,"Escape is handled");
assert.equal(nodes.get("mobile-menu").hidden,true,"Escape closes the mobile navigation");
vm.runInContext("toggleMobileMenu();go('estudio')",ctx);
assert.equal(nodes.get("mobile-menu").hidden,true,"Navigation to a page closes the dropdown");
assert.match(nodes.get("mobile-menu").innerHTML,/aria-current="page"[^>]*>Mi estudio<\/button>/,"Active page updates");
vm.runInContext('page="explorar";render()',ctx);
console.log("✓ Mobile dropdown opens, dismisses with Escape, navigates, and preserves Explore");

assert.ok(nodes.get("app").innerHTML.indexOf("UNA CHISPA VISUAL AL AZAR") <
  nodes.get("app").innerHTML.indexOf("GENERADOR MUSA"), "Carousel must precede Explore cards");
console.log("✓ MUSA boots and renders Explore with search controls");

(async()=>{
  await vm.runInContext("lookupInspiration()",ctx);
  await new Promise(resolve => setImmediate(resolve));
  const results=nodes.get("app").innerHTML;
  assert.match(results, /musa-circular-carousel-root/, "Randomized API references should populate the carousel");
  assert.equal(vm.runInContext('showcase.items.length',ctx),5,
    "Five good photographs should form the ring after one image fails");
  const cylinder=results.split('id="musa-native-cylinder"')[1].split('id="musa-circular-carousel-root"')[0];
  assert.doesNotMatch(cylinder, /broken\.jpg/, "Invalid image cannot leave an empty slot");
  assert.equal((cylinder.match(/class="musa-native-card"/g)||[]).length,5,
    "Exactly five intact slots, never six positions with one gap");
  assert.match(results, /id="musa-native-cylinder"/, "The immediate cylinder must be present without React");
  assert.match(results, /class="musa-native-ring"/, "The immediate backup must actually be circular");
  assert.match(results, /class="musa-native-card"/, "Source images must exist as 3D cards");
  assert.match(results, /rotateY|--angle:/, "Each card should have an explicit rotation angle");
  assert.match(results,/Abstract lines/);
  assert.match(results,/Foto de/);
  assert.match(results,/Jane Doe/);
  vm.runInContext("openBoardEditor('',0)",ctx);
  assert.match(nodes.get("app").innerHTML,/CREAR UN TABLERO/);
  vm.runInContext("closeBoardEditor()",ctx);
  assert.match(nodes.get("app").innerHTML,/TUS TABLEROS DE INSPIRACIÓN/);
  assert.match(results,/GUARDAR EN TABLERO/);
  console.log("✓ Search results, board picker, credits and board creation dialog work");
  console.log("All checks passed.");
})().catch(err=>{console.error(err);process.exitCode=1});

/* The fast Explore gateway must return ready providers without waiting for
   a stalled museum API. Full search requests are unchanged. */
(async () => {
  const moduleMock = { exports: {} };
  const fakeFetch = async url => {
    if (String(url).startsWith("https://api.unsplash.com/")) {
      return {
        ok: true,
        json: async () => ({results:[{
          id:"fast-photo", alt_description:"Verified test photograph",
          urls:{small:"https://images.unsplash.com/fast-photo.jpg"},
          links:{html:"https://unsplash.com/photos/fast-photo"},
          user:{name:"Author",links:{html:"https://unsplash.com/@author"}}
        }]})
      };
    }
    // Never answer the other providers: simulate upstream timeout.
    return new Promise(() => {});
  };
  const scope = vm.createContext({
    module:moduleMock, process:{env:{UNSPLASH_ACCESS_KEY:"test"}},
    fetch:fakeFetch, AbortSignal, URL, console,
    setTimeout:(fn) => setTimeout(fn, 15)
  });
  vm.runInContext(api, scope, {filename:"api/inspiration.js"});
  const res={
    code:200, payload:null,
    setHeader(){},
    status(code){this.code=code;return this;},
    json(value){this.payload=value;return this;}
  };
  const began=Date.now();
  await moduleMock.exports({method:"GET",query:{q:"art",source:"all",quick:"1"}},res);
  assert.equal(res.code,200,"Fast Explore API must return the usable provider");
  assert.equal(res.payload.results.length,1,"Use only genuine source records");
  assert.equal(res.payload.partial,true,"Report skipped slow providers");
  assert.ok(Date.now()-began<750,"Quick lookup cannot wait for stalled providers");
  console.log("✓ Quick Explore API returns usable imagery without blocking on slow providers");
})().catch(err=>{console.error(err);process.exitCode=1});

/* Simulate iPhone-style pointer gestures without a browser, including a
   horizontal swipe and a vertical page-scroll gesture. */
(() => {
 const listeners={};
 const ring={style:{transform:""}};
 const surface={
   dataset:{},
   style:{},
   querySelector(selector){return selector===".musa-native-ring"?ring:null},
   querySelectorAll(selector){return selector===".musa-native-card"?Array(6).fill({}):[]},
   addEventListener(name,handler){listeners[name]=handler},
   removeEventListener(name){delete listeners[name]},
   setPointerCapture(){},
   tabIndex:-1
 };
 let timestamp=100;
 const browser={
   window:{matchMedia:()=>({matches:false}),dispatchEvent(){}},
   document:{hidden:false,getElementById:()=>surface,addEventListener(){},removeEventListener(){}},
   performance:{now:()=>timestamp},
   requestAnimationFrame:()=>123,
   cancelAnimationFrame(){},
   Event:class {constructor(){}},
   console
 };
 vm.runInNewContext(nativeCarouselJS,browser,{filename:"native-carousel.js"});
 browser.window.musaNativeCarousel.mount();
 assert.equal(surface.dataset.interactive,"true");
 const touch=(x,y,kind)=>({pointerType:"touch",pointerId:1,clientX:x,clientY:y,
   cancelable:true,preventDefault(){this.prevented=true},button:0});
 listeners.pointerdown(touch(110,150));
 timestamp+=25;
 const drag=touch(220,153);
 listeners.pointermove(drag);
 assert.ok(drag.prevented,"Horizontal drag should take ownership of pointer events");
 assert.match(ring.style.transform,/rotateY\(/,"Horizontal touch moves the visible 3D cylinder");
 const before=ring.style.transform;
 timestamp+=50;
 listeners.pointerup(touch(220,153));
 assert.equal(surface.dataset.dragging,undefined,"Release clears dragging state");
 timestamp+=400;
 listeners.pointerdown(touch(110,150));
 timestamp+=10;
 listeners.pointermove(touch(112,220));
 assert.equal(ring.style.transform,before,"Vertical scrolling must not rotate the carousel");
 browser.window.musaNativeCarousel.unmount();
 assert.equal(listeners.pointerdown,undefined,"Listeners must be removed on navigation");
 console.log("✓ Mobile horizontal drag, vertical scrolling and cleanup verified");
})();
