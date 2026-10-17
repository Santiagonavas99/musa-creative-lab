const assert = require("node:assert/strict");
const fs = require("node:fs");
const vm = require("node:vm");
const path = require("node:path");

const root = path.resolve(__dirname, "..");
const html = fs.readFileSync(path.join(root, "index.html"), "utf8");
const favoriteCSS = fs.readFileSync(path.join(root, "public/favorite-ideas.css"), "utf8");
const homeActivitiesCSS = fs.readFileSync(path.join(root, "public/home-activities.css"), "utf8");
const stepsCSS = fs.readFileSync(path.join(root, "public/steps-editorial.css"), "utf8");
const stepsJS = fs.readFileSync(path.join(root, "public/steps-editorial.js"), "utf8");

const ctaSVG = fs.readFileSync(path.join(root, "public/musa-cta-chevron.svg"), "utf8");
const ctaCSS = fs.readFileSync(path.join(root, "public/cta-chevron.css"), "utf8");
const ctaJS = fs.readFileSync(path.join(root, "public/cta-chevron.js"), "utf8");
assert.match(html,/href="\/cta-chevron\.css"/,"Shared chevron styling must load");
assert.match(html,/src="\/cta-chevron\.js" defer/,"CTA arrows must be upgraded after parsing the page");
assert.match(ctaSVG,/viewBox="0 0 512 512"/,"Use the exact viewBox supplied for MUSA's chevron");
assert.match(ctaSVG,/m114\.94 493\.53c12\.31 12\.31/,"Use the supplied solid right chevron, not a generic arrow");
assert.match(ctaSVG,/l148\.34 148\.34-148\.34 148\.34c-24\.63 24\.63/,"Preserve the full supplied arrow silhouette");
assert.match(ctaCSS,/background-color:currentColor/,"Arrow colors inherit from the CTA's text color");
assert.match(ctaCSS,/mask:url\('\/musa-cta-chevron\.svg'\)/,"All controls share the approved SVG file");
assert.match(ctaCSS,/prefers-reduced-motion:reduce/,"Respect reduced motion");
new vm.Script(ctaJS,{filename:"cta-chevron.js"});
// A lightweight DOM simulation verifies both existing buttons and newly rendered modal actions.
{
 const controls=[];
 const fakeButton=(label)=>{
   const parent={inserted:null,insertBefore(node){this.inserted=node}};
   const text={nodeValue:label,parentNode:parent,nextSibling:null};
   return {text,parent,
     get textContent(){return text.nodeValue;},
     querySelector(sel){return sel==='.musa-cta-chevron'?parent.inserted:null;}
   };
 };
 const sample=fakeButton("Ver ejercicios ↗");
 const secondary=fakeButton("Ver mi estudio →");
 const back=fakeButton("← Mi estudio");
 controls.push(sample,secondary,back);
 const mockDocument={readyState:"complete",
   body:{querySelectorAll:()=>controls},
   createElement:()=>({className:"",setAttribute(k,v){this[k]=v}}),
   createTreeWalker(el){let once=false;return {nextNode(){if(once)return null;once=true;return el.text;}};}
 };
 let onMutation;
 class TestObserver {constructor(fn){onMutation=fn;}observe(){}}
 vm.runInNewContext(ctaJS,{document:mockDocument,MutationObserver:TestObserver,NodeFilter:{SHOW_TEXT:4}});
 assert.equal(sample.text.nodeValue,"Ver ejercicios");
 assert.equal(secondary.text.nodeValue,"Ver mi estudio");
 assert.equal(sample.parent.inserted.className,"musa-cta-chevron");
 assert.equal(sample.parent.inserted["aria-hidden"],"true");
 assert.equal(secondary.parent.inserted.className,"musa-cta-chevron");
 assert.equal(back.text.nodeValue,"← Mi estudio","Back navigation must keep its left arrow");
 assert.equal(back.parent.inserted,null,"Back icon must not become a right-facing chevron");
 const newlyRendered=fakeButton("Aceptar reto ↗");
 controls.push(newlyRendered);
 onMutation();
 assert.equal(newlyRendered.text.nodeValue,"Aceptar reto","Dynamic modal actions should use the same chevron");
 assert.equal(newlyRendered.parent.inserted.className,"musa-cta-chevron");
 onMutation();
 assert.equal(sample.parent.inserted.className,"musa-cta-chevron","Repeated observation must not create duplicate arrows");
}
console.log("✓ CTA arrow styling, source SVG and dynamic action conversion verified");

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
assert.equal((html.match(/<li class="how-step how-step--/g)||[]).length, 3,
 "The explanation must have exactly three clear steps");
const introHero = html.match(/<section class="hero musa-intro-hero"[\s\S]*?<\/section>/)?.[0] || "";
assert.ok(introHero, "Intro hero should exist");
assert.doesNotMatch(introHero, /IDEA PARA CREAR/,
 "Home hero must not duplicate Explore's generated-idea preview");
// The three steps are compact editorial cards with animated pointer hover.
assert.match(html,/href="\/steps-editorial\.css"/,"Editorial card styles load on home");
assert.match(html,/src="\/steps-editorial\.js"/,"Visual references controller loads on home");
assert.match(html,/window\.MusaStepCards\?\.hydrate\?\.\(\)/,"Home cards hydrate photos after render");
assert.equal((html.match(/<li class="how-step how-step--/g)||[]).length,3,"Home contains exactly three designed step cards");
for(const step of ["inspire","create","save"]){
 assert.match(html,new RegExp('data-musa-step-photo="'+step+'"'),"Each step has independent photo matching");
}
assert.match(stepsCSS,/\.how-step:hover\{/,"Card hover enlarges on desktop");
assert.match(stepsCSS,/transform:translateY\(-7px\) scale\(1\.025\)/,"Card grows smoothly by 2.5 percent");
assert.match(stepsCSS,/transition:transform 320ms/,"Card settles back smoothly when pointer leaves");
assert.match(stepsCSS,/@media \(hover:hover\) and \(pointer:fine\)/,"Hover only animates with a real pointer");
assert.match(stepsCSS,/prefers-reduced-motion:reduce/,"Respect reduced-motion preference");

assert.match(stepsCSS,/Content-safe editorial layout/,"Text and imagery must have dedicated lanes");
assert.match(stepsCSS,/grid-template-columns:minmax\(0,56%\) minmax\(0,44%\)/,"Desktop reserves independent columns for copy and imagery");
assert.match(stepsCSS,/\.how-step-number\{grid-column:1;grid-row:1\}/,"Step numbers stay in the text lane");
assert.match(stepsCSS,/\.how-step-copy\{[\s\S]*?grid-column:1;[\s\S]*?grid-row:2;[\s\S]*?max-width:none;/,"The copy stays in column one without artificial width clipping");
assert.match(stepsCSS,/\.how-step-art\{[\s\S]*?grid-column:2;[\s\S]*?grid-row:1 \/ span 2;[\s\S]*?overflow:hidden;/,"The artwork stays entirely in a clipped second column");
assert.match(stepsCSS,/grid-template-columns:minmax\(0,57%\) minmax\(0,43%\)/,"Mobile reserves separate photo space too");

assert.match(stepsCSS,/@media \(max-width:770px\)/,"Three cards stack on mobile");
assert.match(stepsJS,/\/api\/inspiration\?source=all&quick=1/,"Step images come from MUSA image repository");
const pastTopics=new Map();
function refreshSteps(){
 const scope={window:{sessionStorage:{
  getItem:key=>pastTopics.has(key)?pastTopics.get(key):null,
  setItem:(key,value)=>pastTopics.set(key,String(value))
 }},URL,Math:Object.assign(Object.create(Math),{random:()=>0})};
 vm.runInNewContext(stepsJS,scope,{filename:"steps-editorial.js"});
 return scope.window.MusaStepCards.selected;
}
const stepsFirst=refreshSteps(),stepsSecond=refreshSteps();
for(const step of ["inspire","create","save"]){
 assert.notEqual(stepsFirst[step],stepsSecond[step],"Every refresh should rotate the "+step+" photographic reference query");
}

assert.match(html, /href="\/home-activities\.css"/,"The home banner must load its responsive styles");
assert.match(html, /DOS FORMAS DE CREAR, UN MISMO LABORATORIO\./,"The banner uses the approved option 2 copy");
assert.match(html, /Explora propuestas para escribir, imaginar, dibujar y experimentar visualmente, todo dentro de MUSA\./,"The banner explains the two types of creation");
assert.match(html, /class="musa-home-activities-art" aria-hidden="true"/,"Home must include the dynamic editorial illustration");
assert.match(homeActivitiesCSS, /@media\(max-width:480px\)/,"Home artwork stacks on mobile");
assert.doesNotMatch(html, /¿QUÉ HACEMOS HOY\?|01 \/ IDEAS|02 \/ RETOS|UNA IDEA INESPERADA|ROMPE LA RUTINA/,"Remove the redundant home card pair");


const claimTag = '<meta name="p:domain_verify" content="2f5d9a91026ee62077c40f6bd9da04c7">';
assert.equal(html.split(claimTag).length-1,1,"Pinterest verification token must be present exactly once");
assert.ok(html.indexOf(claimTag)>html.indexOf('<head>') && html.indexOf(claimTag)<html.indexOf('</head>'),
  "Pinterest must find its claim tag in the actual document head");

const api = fs.readFileSync(path.join(root, "api/inspiration.js"), "utf8");
const authScript = fs.readFileSync(path.join(root, "public/auth.js"), "utf8");
const authConfig = fs.readFileSync(path.join(root, "api/auth-config.js"), "utf8");
const showcaseJS = fs.readFileSync(path.join(root, "public/showcase-controller.js"), "utf8");
const boardsJS = fs.readFileSync(path.join(root, "public/boards.js"), "utf8");
const hubJS = fs.readFileSync(path.join(root, "public/creative-hub.js"), "utf8");
const hubCSS = fs.readFileSync(path.join(root, "public/creative-hub.css"), "utf8");
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
new vm.Script(authScript,{filename:"public/auth.js"});
assert.match(html,/id="search-history-dialog-root"/,"The history confirmation dialog has an independent mount");
assert.match(html,/class="search-history-clear"/,"A visible action clears the search list");
assert.match(html,/function openSearchHistoryDelete\(\)/);
assert.match(html,/function confirmClearSearchHistory\(\)/);
assert.match(html,/searchHistoryClearEpoch\+\+/,"Clearing history must invalidate old in-flight search records");
assert.match(html,/role="alertdialog" aria-modal="true"/,"A destructive action should ask for confirmation");
assert.match(html,/search-history-dialog-confirm/,"Confirming history deletion is explicit");
assert.match(html,/\.search-history-backdrop\{/,"History confirmation is visually styled");
assert.match(html,/\.search-history-dialog-actions button\{width:100%\}/,"Dialog controls adapt to mobile");
assert.match(authScript,/searchHistoryDeleteOpen=false;document\.getElementById\('search-history-dialog-root'\)/,"Logging out dismisses any deletion confirmation");

assert.match(authScript,/currentIdea=window\.MusaMoodboards\.nextIdea\(prompts,currentIdea\);seconds=data\.active\?\.elapsed/,"Logging in should initialize a drawing prompt");
assert.doesNotMatch(html,/Generar idea ↗|Tu próxima idea visual te espera/,"The preliminary illustration state must be removed");

new vm.Script(authConfig,{filename:"api/auth-config.js"});
assert.match(html,/src="\/auth\.js"/,"MUSA must load the private account manager");
new vm.Script(showcaseJS, {filename: "showcase-controller.js"});
new vm.Script(boardsJS, {filename: "boards.js"});
new vm.Script(hubJS, {filename:"creative-hub.js"});
assert.match(html,/src="\/creative-hub\.js"/,"Creative hub controller must be installed");
assert.match(html,/href="\/creative-hub\.css"/,"Creative hub styles must be installed");
assert.match(hubCSS,/@media\(max-width:600px\)/,"Projects and calendar are designed for mobile");
assert.match(hubJS,/function sessionList\(\)/,"My Studio exposes a list of previous sessions");
assert.match(hubJS,/function editSession\(index\)/,"Historic sessions support editing");
assert.match(hubJS,/function saveSession\(event\)/,"Session editing updates saved content");
assert.match(hubJS,/kind==='session-edit'/,"Editing is distinct from read-only session summary");
assert.match(hubJS,/record\.notes=notes/,"Older sessions without artwork keep reflections");
assert.match(hubCSS,/\.mc-session-history-item/,"Session list styling exists");
assert.match(html,/Editar sesión ↗/,"Gallery includes direct edit link for associated sessions");
new vm.Script(moodboardJS, {filename: "moodboards.js"});
new vm.Script(bannerJS, {filename: "challenge-banner.js"});
new vm.Script(writingJS, {filename:"creative-writing.js"});
new vm.Script(stepsJS, {filename:"steps-editorial.js"});
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
assert.match(activitiesCSS,/\.musa-activity-grid\{[^}]*grid-auto-rows:1fr/,"Desktop cards must continue to match height");
const mobileActivityStyles = activitiesCSS.slice(activitiesCSS.indexOf("@media(max-width:680px){"));
assert.ok(mobileActivityStyles.startsWith("@media(max-width:680px){"),"Expected mobile breakpoint for creative activities");
assert.match(mobileActivityStyles,/\.musa-activity-grid\{[^}]*grid-template-columns:1fr;grid-auto-rows:auto;/,"Mobile cards must size independently, not share tallest row height");
assert.match(mobileActivityStyles,/\.musa-activity-grid>\.card\{[^}]*min-height:0;height:auto;align-self:start;/,"Stacked cards must not stretch to another card's height");
assert.match(mobileActivityStyles,/\.musa-activity-grid \.ma-content\{flex:0 1 auto\}/,"Card content must not stretch buttons away from the explanation on mobile");
assert.match(mobileActivityStyles,/\.ma-writing-quote,\.ma-writing-reference\{min-height:148px\}/,"Question and image modes remain visible at mobile widths");
assert.match(mobileActivityStyles,/\.ma-drawing-card \.musa-challenge-banner\{min-height:210px\}/,"Drawing still has its editorial collage");
assert.match(html, /class="btn ma-drawing-refresh" onclick="randomIdea\(\)"/,"Drawing another idea has a distinctive primary style");
assert.match(activitiesCSS, /\.ma-drawing-card \.ma-drawing-refresh\{[\s\S]*?background:#3926ce;[\s\S]*?color:#fff;/,"The drawing refresh button contrasts in MUSA purple");

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
assert.match(boardsJS,/function openBoardDeleteConfirm\(boardId\)/,"Board owners can request deletion");
assert.match(boardsJS,/function confirmDeleteBoard\(\)/,"Board deletion is implemented");
assert.match(boardsJS,/role="alertdialog"/,"Deletion requires a distinct, accessible confirmation");
assert.match(boardsJS,/if \(!save\(\)\) \{/,"A failed save must leave board data untouched");
assert.match(boardsJS,/remaining.push\(unclassified.id\)/,"Deleting a board rehomes orphaned references");
assert.match(boardsCSS,/\.board-confirm-delete\{/,"Destructive action is visually distinguished");
assert.match(boardsCSS,/\.board-view-actions\{/,"Delete action is beside rename in board detail");

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
  window: {scrollTo(){},addEventListener(){},MusaAuth:{isAuthenticated:()=>true,queueSave(){},renderAccount(){},importBanner(){return ""},artworkImage:a=>a?.image||""}},
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
vm.runInContext(hubJS, ctx, {filename:"creative-hub.js"});
vm.runInContext(moodboardJS, ctx, {filename:"moodboards.js"});
vm.runInContext(bannerJS, ctx, {filename:"challenge-banner.js"});
vm.runInContext(writingJS, ctx, {filename:"creative-writing.js"});
vm.runInContext(stepsJS, ctx, {filename:"steps-editorial.js"});
vm.runInContext(inline[0][1], ctx, {filename:"MUSA.inline.js"});
vm.runInContext(showcaseJS, ctx, {filename:"showcase-controller.js"});
vm.runInContext("render()",ctx);
assert.match(nodes.get("app").innerHTML,/TU PRÓXIMA IDEA EMPIEZA AQUÍ/);
assert.match(nodes.get("app").innerHTML,/DE LA CHISPA A LA CREACIÓN/);

for(const step of ["inspire","create","save"]){
 assert.match(nodes.get("app").innerHTML,new RegExp('how-step--'+step),"The "+step+" card renders");
 assert.match(nodes.get("app").innerHTML,new RegExp('data-musa-step-photo="'+step+'"'),"The "+step+" image can hydrate");
}
assert.equal((nodes.get("app").innerHTML.match(/how-step-number/g)||[]).length,3,"All three steps have their numbers");

assert.doesNotMatch(nodes.get("app").innerHTML,/Descubre cómo funciona|musa-intro-how-link/);
const homeScreen = nodes.get("app").innerHTML;
assert.match(homeScreen,/DOS FORMAS DE CREAR, UN MISMO LABORATORIO\./);
// Previous sessions can be found from My Studio AND Calendar, and edited in place.
vm.runInContext("window.__sessionFixtureBackup={sessions:data.sessions,artworks:data.artworks};"+
"data.sessions=[{id:'old-session',title:'¿Cómo sería la alegría sin rostros?',type:'writing',elapsed:0,createdAt:'2026-10-15T13:30:00.000Z',artworkId:'art-1'}];"+
"data.artworks=[{id:'art-1',title:'Mi obra original',notes:'Texto inicial',createdAt:'2026-10-15T13:30:00.000Z',imagePath:'user/image-original.jpg'}];"+
"page='estudio';render()",ctx);
let studioSessionHTML=nodes.get("app").innerHTML;
assert.match(studioSessionHTML,/TUS SESIONES\./,"Studio includes a session archive");
assert.match(studioSessionHTML,/Explorar sesiones anteriores/);
assert.match(studioSessionHTML,/MusaCreativeHub\.editSession\(0\)/,"Studio and artwork expose editing");
vm.runInContext("MusaCreativeHub.openSession(0)",ctx);
assert.match(nodes.get("app").innerHTML,/ASÍ FUE TU SESIÓN/,"Studio can open session summary");
assert.match(nodes.get("app").innerHTML,/Sin tiempo registrado/,"Historical zero-duration sessions still display correctly");
assert.match(nodes.get("app").innerHTML,/Texto inicial/,"Existing creative text is visible");
assert.match(nodes.get("app").innerHTML,/Editar sesión ↗/);
vm.runInContext("MusaCreativeHub.editSession(0)",ctx);
const editSessionHTML=nodes.get("app").innerHTML;
assert.match(editSessionHTML,/EDITAR ESTA SESIÓN/);
assert.match(editSessionHTML,/Tu texto creativo/);
assert.match(editSessionHTML,/Texto inicial/);
assert.match(editSessionHTML,/Guardar cambios/);
assert.match(editSessionHTML,/imagen original se conservarán/);
const form={querySelector(sel){if(sel==='[name="title"]')return {value:"Sesión con título actualizado"};if(sel==='[name="notes"]')return {value:"Nueva versión de mi texto creativo"};return null}};
ctx.testSessionEditForm=form;
vm.runInContext("MusaCreativeHub.saveSession({preventDefault(){},currentTarget:testSessionEditForm})",ctx);
assert.equal(vm.runInContext("data.sessions.length",ctx),1,"Editing must not create a duplicate session");
assert.equal(vm.runInContext("data.sessions[0].title",ctx),"Sesión con título actualizado");
assert.equal(vm.runInContext("data.sessions[0].notes",ctx),"Nueva versión de mi texto creativo");
assert.equal(vm.runInContext("data.sessions[0].elapsed",ctx),0,"Duration is immutable in the edit");
assert.equal(vm.runInContext("data.sessions[0].id",ctx),"old-session","Original session identifier persists");
assert.equal(vm.runInContext("data.artworks[0].notes",ctx),"Nueva versión de mi texto creativo","Linked artwork reflects edited content");
assert.equal(vm.runInContext("data.artworks[0].title",ctx),"Sesión con título actualizado");
assert.equal(vm.runInContext("data.artworks[0].imagePath",ctx),"user/image-original.jpg","Original uploaded image is preserved");
assert.match(nodes.get("app").innerHTML,/ASÍ FUE TU SESIÓN/,"After editing, return to the updated summary");
vm.runInContext("MusaCreativeHub.close();go('calendario');MusaCreativeHub.select('2026-10-15')",ctx);
assert.match(nodes.get("app").innerHTML,/MusaCreativeHub\.openSession\(0\)/);
assert.match(nodes.get("app").innerHTML,/MusaCreativeHub\.editSession\(0\)/);
vm.runInContext("MusaCreativeHub.editSession(0)",ctx);
assert.match(nodes.get("app").innerHTML,/EDITAR ESTA SESIÓN/,"Calendar opens the same edit form");
vm.runInContext("MusaCreativeHub.close();data.sessions=[{id:'legacy',title:'Ejercicio anterior',type:'challenge',elapsed:0,createdAt:'2026-10-15T10:00:00.000Z'}];data.artworks=[];go('estudio');MusaCreativeHub.editSession(0)",ctx);
assert.match(nodes.get("app").innerHTML,/Editar esta sesión|EDITAR ESTA SESIÓN/);
ctx.testSessionEditForm={querySelector(sel){return {value:sel==='[name="title"]'?"Ejercicio anterior editado":"Reflexión de archivo antiguo"}}};
vm.runInContext("MusaCreativeHub.saveSession({preventDefault(){},currentTarget:testSessionEditForm})",ctx);
assert.equal(vm.runInContext("data.sessions.length",ctx),1);
assert.equal(vm.runInContext("data.sessions[0].notes",ctx),"Reflexión de archivo antiguo","Legacy sessions without linked artworks remain editable");
vm.runInContext("MusaCreativeHub.close();data.sessions=window.__sessionFixtureBackup.sessions;data.artworks=window.__sessionFixtureBackup.artworks;go('inicio')",ctx);
console.log("✓ Session route and editable content work from calendar, studio, and linked gallery without duplication");
assert.match(homeScreen,/Ver ejercicios ↗/);
assert.match(homeScreen,/musa-home-activities-art/);
assert.equal((homeScreen.match(/musa-home-activities-art/g)||[]).length,1,"Exactly one editorial banner on home");
assert.ok(homeScreen.includes(vm.runInContext("window.MusaChallengeBanner.render()",ctx)),"The home banner must show the selected rotating composition");
assert.match(homeScreen,/onclick="go\('explorar'\)">Ver ejercicios/,"Home CTA must open the actual Explore section");

// Search history: confirm-only deletion, no changes to boards, favorites or saved references.
vm.runInContext("data.searches=[{id:'search-1',query:'collage experimental',source:'unsplash'},{id:'search-2',query:'arte geométrico',source:'met'}];"+
  "data.references=[{id:'reference-safe',title:'Guardada'}];"+
  "data.boards=[{id:'board-safe',name:'Mi tablero'}];"+
  "page='explorar';render()",ctx);
assert.match(nodes.get("app").innerHTML,/Mis búsquedas anteriores \(2\)/);
assert.match(nodes.get("app").innerHTML,/Borrar historial/);
vm.runInContext("openSearchHistoryDelete()",ctx);
const historyDialogRoot=nodes.get("search-history-dialog-root");
assert.match(historyDialogRoot.innerHTML,/¿BORRAR EL HISTORIAL\?/);
assert.match(historyDialogRoot.innerHTML,/2 búsquedas guardadas/);
assert.match(historyDialogRoot.innerHTML,/Tus tableros, referencias e ideas guardadas no se eliminarán/);
assert.equal(vm.runInContext("data.searches.length",ctx),2,"Opening confirmation must not delete anything");
vm.runInContext("closeSearchHistoryDelete()",ctx);
assert.equal(historyDialogRoot.innerHTML,"","Cancel closes the modal");
assert.equal(vm.runInContext("data.searches.length",ctx),2,"Cancel preserves all searches");
vm.runInContext("openSearchHistoryDelete()",ctx);
documentListeners.keydown({key:"Escape",preventDefault(){}});
assert.equal(historyDialogRoot.innerHTML,"","Escape should dismiss confirmation");
assert.equal(vm.runInContext("data.searches.length",ctx),2,"Escape must never delete searches");
vm.runInContext("openSearchHistoryDelete();confirmClearSearchHistory()",ctx);
assert.equal(vm.runInContext("data.searches.length",ctx),0,"Confirmation removes the search history");
assert.equal(historyDialogRoot.innerHTML,"","Successful deletion closes modal");
assert.doesNotMatch(nodes.get("app").innerHTML,/Mis búsquedas anteriores \(/,"Empty search history disappears from Explore");
assert.equal(vm.runInContext("data.references[0].id",ctx),"reference-safe","Saved references must survive");
assert.equal(vm.runInContext("data.boards[0].id",ctx),"board-safe","Boards must survive");
const clearEpoch=vm.runInContext("searchHistoryClearEpoch",ctx);
assert.ok(clearEpoch>0,"Search clear generation increases after deletion");
vm.runInContext("data.searches=[{id:'new-entry',query:'pintura',source:'artic'}];"+
  "window.__historySave=save;save=()=>false;openSearchHistoryDelete();confirmClearSearchHistory()",ctx);
assert.equal(vm.runInContext("data.searches.length",ctx),1,"Failed save restores the prior history");
assert.equal(vm.runInContext("searchHistoryClearEpoch",ctx),clearEpoch,"A failed deletion cannot advance the clear generation");
vm.runInContext("save=window.__historySave;data.searches=[];data.references=[];data.boards=[];page='inicio';render()",ctx);
console.log("✓ Search history supports confirmation, cancel, Escape, rollback and safe saved references");


// The initial illustration render must be complete even after an auth reset.
vm.runInContext("currentIdea=null;page='explorar';render()",ctx);
const firstDrawing=nodes.get("app").innerHTML;
const firstTitle=vm.runInContext("currentIdea.title",ctx);
assert.ok(firstTitle.length>2);
assert.match(firstDrawing,/PROPUESTA PARA DIBUJAR/);
assert.match(firstDrawing,/EL EJERCICIO/);
assert.match(firstDrawing,/musa-challenge-banner/);
assert.match(firstDrawing,/onclick="openMoodboard\('idea'\)"/);
assert.match(firstDrawing,/onclick="fav\(\)"/);
assert.match(firstDrawing,/onclick="start\(currentIdea\)"/);
assert.doesNotMatch(firstDrawing,/Generar idea|Tu próxima idea visual te espera/);
vm.runInContext("page='inicio';render();page='explorar';render()",ctx);
assert.equal(vm.runInContext("currentIdea.title",ctx),firstTitle,"Navigate away and back without losing the current drawing prompt");
vm.runInContext("randomIdea()",ctx);
assert.notEqual(vm.runInContext("currentIdea.title",ctx),firstTitle,"Another idea should replace the prompt");

vm.runInContext('page="explorar";render()',ctx);
vm.runInContext("currentIdea={id:'test-palette',title:'Dibuja una ciudad que respira',emotion:'Asombro',technique:'Dibujo',theme:'Arquitectura',colors:['#F4B633','#9D53BB','#373578'],type:'idea'};render()",ctx);
const initialActivities=nodes.get("app").innerHTML;
assert.match(initialActivities,/ESCRITURA CREATIVA/);
assert.match(initialActivities,/ILUSTRACIÓN Y DIBUJO/);
assert.match(initialActivities,/class="btn ma-drawing-refresh" onclick="randomIdea\(\)"/,"The refresh button has the purple treatment");
assert.doesNotMatch(initialActivities,/musa-home-activities/,"The home banner is not duplicated in Explore");

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
for(const section of ["Inicio","Explorar","Mi estudio"]) {
  assert.ok(mobileNav.includes(">"+section+"</button>"), section+" must appear in mobile menu");
}
assert.equal((mobileNav.match(/mobile-menu-link/g)||[]).length,3,"Exactly three mobile sections");
assert.doesNotMatch(mobileNav,/>Actividad<\/button>/,"Activity link removed");
assert.match(mobileNav,/01 \/ 03/,"Mobile count displays three items");
assert.doesNotMatch(html,/else if\(page===\x27actividad\x27\)/,"Old Activity page removed");
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
assert.match(nodes.get('app').innerHTML,/PROYECTOS/,'Studio offers creative projects');
assert.match(nodes.get('app').innerHTML,/CALENDARIO/,'Studio offers creative calendar');
assert.match(nodes.get('app').innerHTML,/DIARIO/,'Studio offers creative journal');
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
  assert.match(results,/Mis búsquedas anteriores/,'Private search history is shown after a query');
  vm.runInContext("openBoardEditor('',0)",ctx);
  assert.match(nodes.get("app").innerHTML,/CREAR UN TABLERO/);
  vm.runInContext("closeBoardEditor()",ctx);
  assert.match(nodes.get("app").innerHTML,/TUS TABLEROS DE INSPIRACIÓN/);
  assert.match(results,/GUARDAR EN TABLERO/);
  // Deletion is opt-in. Cancel is safe; a confirmed deletion preserves all saved references.
  vm.runInContext("window.__boardBackup = JSON.stringify({boards:data.boards,references:data.references});"+
    "data.boards=[{id:'board-alpha',name:'Ejemplo'},{id:'board-beta',name:'Segundo tablero'}];"+
    "data.references=["+
    "{id:'ref-one',title:'Única',boardIds:['board-alpha'],source:'unsplash',image:'https://example.com/1.jpg',link:'https://example.com/1'},"+
    "{id:'ref-two',title:'Compartida',boardIds:['board-alpha','board-beta'],source:'unsplash',image:'https://example.com/2.jpg',link:'https://example.com/2'}"+
    "];selectedBoardId='board-alpha';render()",ctx);
  assert.match(nodes.get("app").innerHTML,/Renombrar tablero/);
  assert.match(nodes.get("app").innerHTML,/Eliminar tablero/);
  vm.runInContext("openBoardDeleteConfirm('board-alpha')",ctx);
  assert.match(nodes.get("app").innerHTML,/¿ELIMINAR ESTE TABLERO\?/);
  assert.match(nodes.get("app").innerHTML,/«Ejemplo»/);
  assert.match(nodes.get("app").innerHTML,/Sus 2 referencias guardadas no se perderán/);
  assert.match(nodes.get("app").innerHTML,/role="alertdialog"/);
  vm.runInContext("closeBoardDeleteConfirm()",ctx);
  assert.equal(vm.runInContext("data.boards.length",ctx),2,"Cancel never deletes any board");
  assert.equal(vm.runInContext("selectedBoardId",ctx),"board-alpha","Cancel keeps the board open");
  vm.runInContext("openBoardDeleteConfirm('board-alpha');confirmDeleteBoard()",ctx);
  assert.equal(vm.runInContext("data.boards.some(b=>b.id==='board-alpha')",ctx),false);
  assert.equal(vm.runInContext("selectedBoardId",ctx),"","Deleting an open board returns to gallery");
  assert.equal(vm.runInContext("data.references.length",ctx),2,"Deleting a board never destroys references");
  assert.equal(vm.runInContext("data.references.find(r=>r.id==='ref-one').boardIds.length",ctx),1);
  assert.equal(vm.runInContext("data.boards.find(b=>b.id===data.references.find(r=>r.id==='ref-one').boardIds[0]).name",ctx),"Sin clasificar","Unshared images go to default board");
  assert.equal(vm.runInContext("data.references.find(r=>r.id==='ref-two').boardIds.join(',')",ctx),"board-beta","Shared images remain in other boards");
  assert.doesNotMatch(nodes.get("app").innerHTML,/¿ELIMINAR ESTE TABLERO\?/,"Confirmation closes once complete");
  // Remove an empty board, without creating an unnecessary default.
  vm.runInContext("data.boards.push({id:'board-empty',name:'Vacío'});openBoardDeleteConfirm('board-empty')",ctx);
  assert.match(nodes.get("app").innerHTML,/Este tablero no tiene referencias guardadas/);
  vm.runInContext("confirmDeleteBoard()",ctx);
  assert.equal(vm.runInContext("data.boards.some(b=>b.id==='board-empty')",ctx),false);
  // Failure to persist must roll back membership and board removal.
  vm.runInContext("window.__boardSave = save;"+
    "data.boards.push({id:'board-fail',name:'No borrar'});"+
    "selectedBoardId='board-fail';"+
    "save = ()=>false;openBoardDeleteConfirm('board-fail');confirmDeleteBoard()",ctx);
  assert.equal(vm.runInContext("data.boards.some(b=>b.id==='board-fail')",ctx),true,"Save errors must restore board");
  assert.equal(vm.runInContext("selectedBoardId",ctx),"board-fail","Failed removal keeps current board");
  vm.runInContext("save=window.__boardSave;boardDeleteId='';selectedBoardId='';"+
    "Object.assign(data,JSON.parse(window.__boardBackup));render()",ctx);
  console.log("✓ Board deletion confirmation, cancel, preservation and rollback verified");

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
