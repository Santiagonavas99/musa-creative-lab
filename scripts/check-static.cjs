const assert = require("node:assert/strict");
const fs = require("node:fs");
const vm = require("node:vm");
const path = require("node:path");

const root = path.resolve(__dirname, "..");
const html = fs.readFileSync(path.join(root, "index.html"), "utf8");
const favoriteCSS = fs.readFileSync(path.join(root, "public/favorite-ideas.css"), "utf8");
assert.match(html, /\.swatch\{[^}]*border:1px solid rgba\(255,255,255,\.92\)/,
 "Suggested idea colors should have a thin white border");
assert.match(favoriteCSS, /\.idea-glass-palette \.swatch\{[^}]*border:1px solid rgba\(255,255,255,\.92\)/,
 "Saved idea colors should have the same white border");
assert.match(html, /palette\(f\.colors,'favorite'\)/, "Favorites must reuse the original palette renderer");

// Home onboarding explains MUSA before repeating any specific Explore interaction.
assert.match(html, /id="musa-intro-title">TU PRÓXIMA IDEA EMPIEZA AQUÍ\./,
 "Home hero must clearly introduce MUSA");
assert.match(html, /MUSA es un laboratorio creativo digital donde encuentras ideas/,
 "Hero should explain what the product actually does");
assert.match(html, /EMPEZAR A CREAR ↗/,
 "Home must have an obvious primary action");
assert.doesNotMatch(html, /Descubre cómo funciona|musa-intro-how-link/,
 "Hero should not show the secondary how-it-works link");
assert.match(html, /id="como-funciona" aria-labelledby="como-funciona-title"/,
 "How it works section must remain on the homepage");
assert.match(html, /DE LA CHISPA A LA CREACIÓN\./,
 "Home onboarding must carry MUSA's personality");
assert.equal((html.match(/<li class="how-step">/g)||[]).length, 3,
 "The explanation must have exactly three clear steps");
const introHero = html.match(/<section class="hero musa-intro-hero"[\s\S]*?<\/section>/)?.[0] || "";
assert.ok(introHero, "Intro hero should exist");
assert.doesNotMatch(introHero, /IDEA PARA CREAR/,
 "Home hero must not duplicate Explore's generated-idea preview");

const claimTag = '<meta name="p:domain_verify" content="2f5d9a91026ee62077c40f6bd9da04c7">';
assert.equal(html.split(claimTag).length-1,1,"Pinterest verification token must be present exactly once");
assert.ok(html.indexOf(claimTag)>html.indexOf('<head>') && html.indexOf(claimTag)<html.indexOf('</head>'),
  "Pinterest must find its claim tag in the actual document head");

const api = fs.readFileSync(path.join(root, "api/inspiration.js"), "utf8");
const showcaseJS = fs.readFileSync(path.join(root, "public/showcase-controller.js"), "utf8");
const boardsJS = fs.readFileSync(path.join(root, "public/boards.js"), "utf8");
const moodboardJS = fs.readFileSync(path.join(root, "public/moodboards.js"), "utf8");
const moodboardCSS = fs.readFileSync(path.join(root, "public/moodboards.css"), "utf8");
const bannerJS = fs.readFileSync(path.join(root, "public/challenge-banner.js"), "utf8");
const bannerCSS = fs.readFileSync(path.join(root, "public/challenge-banner.css"), "utf8");
const writingJS = fs.readFileSync(path.join(root, "public/creative-writing.js"), "utf8");
const activitiesCSS = fs.readFileSync(path.join(root, "public/creative-activities.css"), "utf8");
const boardsCSS = fs.readFileSync(path.join(root, "public/boards.css"), "utf8");
const inline = [...html.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/g)].filter(([,source])=>source.trim());
assert.ok(inline.length > 0, "MUSA must contain client application JavaScript");
for (const [, source] of inline) new vm.Script(source, {filename: "index.html"});
new vm.Script(api, {filename: "api/inspiration.js"});
new vm.Script(showcaseJS, {filename: "showcase-controller.js"});
new vm.Script(boardsJS, {filename: "boards.js"});
new vm.Script(moodboardJS, {filename: "moodboards.js"});
new vm.Script(bannerJS, {filename: "challenge-banner.js"});
new vm.Script(writingJS, {filename:"creative-writing.js"});
// The Explore challenge banner is decorative, responsive and refresh-driven.
assert.match(html, /src="\/challenge-banner\.js"/, "The random artwork controller must load before the app");
assert.match(html, /href="\/challenge-banner\.css"/, "The challenge collage stylesheet must load");
assert.match(html, /class="card ma-drawing-card"/, "The lime drawing card hosts the editorial artwork");
assert.match(html, /window\.MusaChallengeBanner\.render\(\)/, "Banner is rendered with drawing activity without replacing the CTA");
assert.match(bannerCSS, /\.mcb-mosaic\{/, "Banner has its own responsive mosaic layout");
assert.match(bannerCSS, /@media\(max-width:480px\)/, "Editorial banner remains compact on mobile");
assert.match(bannerJS, /sessionStorage\.setItem\('musa-explore-art-last'/, "Consecutive refreshes track the last composition");
const artStorage={
  value:null,
  getItem(){return this.value;},
  setItem(_key,value){this.value=String(value)}
};
const fixedRandom=Object.create(Math);
fixedRandom.random=()=>0;
function renderFreshBanner(){
  const pageWindow={};
  vm.runInNewContext(bannerJS,{window:pageWindow,sessionStorage:artStorage,Math:fixedRandom});
  return pageWindow.MusaChallengeBanner.render();
}
const firstBanner=renderFreshBanner();
const secondBanner=renderFreshBanner();
assert.notEqual(firstBanner,secondBanner,"Consecutive refreshes must not immediately repeat the same banner");
for(const markup of [firstBanner,secondBanner]){
  assert.match(markup, /musa-challenge-banner/, "Rendered banner keeps its layout");
  assert.match(markup, /mcb-caption/, "Each visual has an editorial title");
  assert.match(markup, /<svg/, "Banner is self-contained SVG geometry");
  assert.match(markup, /#musa-mark-icon/, "Banner reuses the user's official MUSA asterisk");
}


// Independent writing and illustration activities are aligned without duplicated palettes.
assert.match(html,/src="\/creative-writing\.js"/,"Writing activities controller must load");
assert.match(html,/href="\/creative-activities\.css"/,"Two-activity styles must load");
assert.match(html,/function renderWritingActivity\(\)/,"Explore includes a distinct writing activity");
assert.match(html,/function renderDrawingActivity\(\)/,"Explore includes a drawing activity");
assert.match(html,/function renderExploreActivities\(\)/,"Two activities share one grid");
assert.doesNotMatch(html,/ma-challenge-entry|¿TE APETECE UN RETO CREATIVO\?|Explora desafíos con tiempo y moodboards de referencia/,"Remove duplicate challenges banner from Explore");
assert.doesNotMatch(activitiesCSS,/\.ma-challenge-entry/,"Remove obsolete banner styling");
assert.match(activitiesCSS,/\.musa-activity-grid\{align-items:stretch/,"Both cards should align to equal height");
assert.match(activitiesCSS,/\.musa-activity-grid>.card\{display:flex;flex-direction:column/,"Both activities stretch naturally");
assert.match(activitiesCSS,/grid-auto-rows:1fr/,"Both card heights must remain equal even when stacked");
assert.match(writingJS,/\/api\/inspiration\?q=/,"Image writing prompts use existing visual repository API");
assert.match(html,/function saveWriting\(\)/,"Writing ideas can be saved independently");
assert.match(html,/function updateWritingDraft\(text\)/,"The writing editor persists its text");

// Experimental moodboards keep the existing app navigation and original palettes intact.
assert.match(html, /href="\/moodboards\.css"/,"The editorial layouts must be styled");
assert.match(html, /src="\/moodboards\.js"/,"Moodboard controller must load synchronously before app");
assert.match(html, /id="musa-moodboard-root"/,"The dialog mounts outside the rerendered page");
assert.match(moodboardCSS, /\.mb-editorial-grid/,"Moodboards should have an asymmetric collage layout");
assert.match(moodboardCSS, /\.mb-is-accepted/,"Accepted challenges get an expanded visual state");
assert.match(html, /window\.MusaMoodboards\.nextIdea\(prompts,null\)/,"Ideas rotate on a new page load");
assert.match(html, /window\.MusaMoodboards\.initialChallenges\(challenges\)/,"Challenges rotate on each load");
assert.match(html, /function acceptChallenge\(index,fromModal\)/,"Accepting a challenge should expand its card, not immediately navigate away");
assert.match(moodboardJS, /\/api\/inspiration\?q=/,"Reference photography should come from connected visual providers");
assert.doesNotMatch(moodboardJS, /source\.unsplash\.com|images\.pexels\.com/,"Do not invent unrelated photo sources");

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
const inlineStar = html.match(/<symbol id="musa-mark-icon"[^>]*><path fill="currentColor" d="([^"]+)"/)?.[1];
const maskStar = vectorStar.match(/<path id="mark" fill="#000" d="([^"]+)"/)?.[1];
const faviconStar = favicon.match(/<g transform="[^"]+"><path fill="#ff7049" d="([^"]+)"/)?.[1];
assert.ok(inlineStar && maskStar && faviconStar, "New MUSA asterisk must appear as shared symbol, mask and favicon");
assert.equal(inlineStar, maskStar, "Hero and UI must use identical asterisk silhouettes");
assert.equal(maskStar, faviconStar, "Favicon should use the same original user-provided asterisk shape");
assert.ok(inlineStar.startsWith("M421.833,285.36c-2.573-9.801"), "All stars should use the new Illustrator geometry");
assert.ok(inlineStar.endsWith("C423.212,304.438,424.4,295.161,421.833,285.36z"), "The icon outline should be complete");
assert.match(favicon, /<path fill="#d7ff42"/, "Keep the existing lime M in the favicon");
assert.match(html, /\.brand \.musa-mark-brand\{[^}]*color:#ff7049/, "Keep the header mark orange");
assert.ok(html.includes("background-color:#d7ff42;-webkit-mask:url('/musa-asterisk.svg')"), "Keep the hero asterisk lime");
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
vm.runInContext(moodboardJS, ctx, {filename:"moodboards.js"});
vm.runInContext(bannerJS, ctx, {filename:"challenge-banner.js"});
vm.runInContext(writingJS, ctx, {filename:"creative-writing.js"});
vm.runInContext(inline[0][1], ctx, {filename:"MUSA.inline.js"});
vm.runInContext(showcaseJS, ctx, {filename:"showcase-controller.js"});
assert.match(nodes.get("app").innerHTML,/TU PRÓXIMA IDEA EMPIEZA AQUÍ/);
assert.match(nodes.get("app").innerHTML,/DE LA CHISPA A LA CREACIÓN/);
assert.doesNotMatch(nodes.get("app").innerHTML,/Descubre cómo funciona|musa-intro-how-link/);
vm.runInContext('page="explorar";render()',ctx);
vm.runInContext("currentIdea={id:'test-palette',title:'Dibuja una ciudad que respira',emotion:'Asombro',technique:'Dibujo',theme:'Arquitectura',colors:['#F4B633','#9D53BB','#373578'],type:'idea'};render()",ctx);
const initialActivities=nodes.get("app").innerHTML;
assert.match(initialActivities,/ESCRITURA CREATIVA/);
assert.match(initialActivities,/ILUSTRACIÓN Y DIBUJO/);
assert.doesNotMatch(initialActivities,/¿TE APETECE UN RETO CREATIVO\?|ma-challenge-entry/,"Explore must display only the two creative activity cards");
assert.match(initialActivities,/Frase o pregunta/);
assert.match(initialActivities,/Con una imagen/);
assert.match(initialActivities,/EL EJERCICIO/);
assert.match(initialActivities,/Ver moodboard/);
assert.doesNotMatch(initialActivities,/class="swatch"/,"The palette should no longer appear inside the generated illustration card");
assert.match(initialActivities,/musa-challenge-banner/);
vm.runInContext("fav()",ctx);
const savedPalette = nodes.get("app").innerHTML;
assert.match(savedPalette,/class="palette idea-glass-palette"/,"Saved favorites reuse the palette markup");
assert.match(savedPalette,/background-color:#F4B633/);
assert.match(savedPalette,/background-color:#9D53BB/);
assert.match(savedPalette,/background-color:#373578/);
assert.deepEqual(Array.from(vm.runInContext("data.favorites[0].colors",ctx)),['#F4B633','#9D53BB','#373578'],
 "All three colors must be stored with the saved idea");
vm.runInContext("data.favorites.push({id:'legacy-fav',title:'Una idea antigua'});render()",ctx);
assert.match(nodes.get("app").innerHTML,/Una idea antigua/,"Older saved ideas without palette still render");
assert.equal((nodes.get("app").innerHTML.match(/idea-glass-palette/g)||[]).length,1,
 "Legacy saved ideas without colors should not display invented palettes");
vm.runInContext("data.favorites=[];currentIdea=null;render()",ctx);
console.log("✓ The illustration card hides its palette while saved ideas keep original swatches");
// Writing prompts can switch between question/image without affecting the illustration.
vm.runInContext("randomWriting()",ctx);
const firstWriting=vm.runInContext("currentWriting.id",ctx);
vm.runInContext("randomWriting()",ctx);
const secondWriting=vm.runInContext("currentWriting.id",ctx);
assert.notEqual(firstWriting,secondWriting,"Another writing idea must differ from the last");
assert.match(nodes.get("app").innerHTML,/ma-writing-quote/);
vm.runInContext("changeWritingMode('image')",ctx);
assert.match(nodes.get("app").innerHTML,/ma-writing-reference|ma-writing-photo/);
assert.match(nodes.get("app").innerHTML,/aria-pressed="true"/);
vm.runInContext("changeWritingMode('question');saveWriting()",ctx);
assert.equal(vm.runInContext("data.favorites[0].type",ctx),"writing");
assert.match(nodes.get("app").innerHTML,/ESCRITURA GUARDADA/);
const writingId=vm.runInContext("data.favorites[0].id",ctx);
vm.runInContext("startFavorite("+JSON.stringify(writingId)+")",ctx);
assert.match(nodes.get("app").innerHTML,/ma-writing-editor/);
assert.doesNotMatch(nodes.get("app").innerHTML,/mb-session-preview/,"Writing sessions should never display the drawing moodboard");
vm.runInContext("updateWritingDraft('Texto creativo de prueba que debe conservarse.')",ctx);
assert.equal(vm.runInContext("data.active.item.draft",ctx),"Texto creativo de prueba que debe conservarse.");
vm.runInContext("endSession()",ctx);
assert.match(nodes.get("app").innerHTML,/Texto creativo de prueba que debe conservarse/,"Written text should carry into the saving screen");
vm.runInContext("data.active=null;data.favorites=[];page='explorar';render()",ctx);

assert.match(nodes.get("app").innerHTML,/BUSCA REFERENCIAS/);
assert.match(nodes.get("app").innerHTML,/⌕ Buscar imágenes/);
assert.match(nodes.get("app").innerHTML,/UNA CHISPA VISUAL AL AZAR/);
assert.match(nodes.get("app").innerHTML,/musa-challenge-banner/);
const currentBanner=vm.runInContext("window.MusaChallengeBanner.render()",ctx);
assert.ok(nodes.get("app").innerHTML.includes(currentBanner),"Explore displays the selected banner");
vm.runInContext("randomIdea()",ctx);
assert.ok(nodes.get("app").innerHTML.includes(currentBanner),"Generating a new idea should not swap the banner until refresh");
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
vm.runInContext("go('retos')",ctx);
assert.match(nodes.get("app").innerHTML,/RETOS PARA EXPLORAR/);
assert.match(nodes.get("app").innerHTML,/Ver moodboard/);
vm.runInContext("acceptChallenge(0)",ctx);
assert.match(nodes.get("app").innerHTML,/Reto aceptado/);
assert.match(nodes.get("app").innerHTML,/mb-mini-collage/,"Accepted challenges must show a mini moodboard directly in the card");
assert.match(nodes.get("app").innerHTML,/Continuar reto/);
vm.runInContext("openMoodboard('challenge',0)",ctx);
assert.match(nodes.get("musa-moodboard-root").innerHTML,/role="dialog" aria-modal="true"/);
assert.match(nodes.get("musa-moodboard-root").innerHTML,/mb-editorial-grid/);
assert.match(nodes.get("musa-moodboard-root").innerHTML,/#D7FF42/);
vm.runInContext("window.MusaMoodboards.close()",ctx);
assert.equal(nodes.get("musa-moodboard-root").innerHTML,"","Closing the dialog should preserve the main page");
vm.runInContext("continueChallenge(0)",ctx);
assert.match(nodes.get("app").innerHTML,/mb-session-preview/,"Active challenges retain their mini-moodboard");
vm.runInContext('page="explorar";render()',ctx);
console.log("✓ Modal, challenge acceptance, embedded moodboard and session continuation work");
vm.runInContext('page="explorar";render()',ctx);
console.log("✓ Mobile dropdown opens, dismisses with Escape, navigates, and preserves Explore");

assert.ok(nodes.get("app").innerHTML.indexOf("UNA CHISPA VISUAL AL AZAR") <
  nodes.get("app").innerHTML.indexOf("ESCRITURA CREATIVA"), "Carousel must precede the writing and illustration cards");
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
