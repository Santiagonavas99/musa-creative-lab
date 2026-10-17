"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");
const vm = require("node:vm");

const root = path.resolve(__dirname,"..");
const html = fs.readFileSync(path.join(root,"index.html"),"utf8");
const css = fs.readFileSync(path.join(root,"public/favorite-ideas.css"),"utf8");
const artwork = fs.readFileSync(path.join(root,"public/idea-glass-art.svg"),"utf8");
const render = html.match(/function renderFavoriteIdeaCard\(f\)\{[\s\S]*?\n\}/)?.[0];

function card(item) {
  assert.ok(render,"Favorite idea card renderer must exist");
  return vm.runInNewContext(render+";renderFavoriteIdeaCard(f)", {
    f:item,
    esc(value){return String(value??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]))}
  });
}

test("the favorite idea card uses MUSA glass layout and renders all three concept capsules",()=>{
  const result=card({id:"favorite-123",title:"Representa la nostalgia sin dibujar personas",
    technique:"Collage",emotion:"Nostalgia",theme:"Recuerdos"});
  assert.match(result,/class="idea-glass-card"/);
  assert.match(result,/class="idea-glass-panel"/);
  assert.match(result,/class="idea-glass-pill idea-glass-pill--technique">Collage/);
  assert.match(result,/class="idea-glass-pill idea-glass-pill--emotion">Nostalgia/);
  assert.match(result,/class="idea-glass-pill idea-glass-pill--theme">Recuerdos/);
  assert.match(result,/onclick="startFavorite\(&quot;favorite-123&quot;\)"/);
  assert.match(result,/onclick="removeFav\(&quot;favorite-123&quot;\)"/);
  assert.match(result,/Crear con esta idea/);
  assert.match(html,/data\.favorites\.map\(renderFavoriteIdeaCard\)/);
});

test("older favorite ideas without emotion or theme remain visible",()=>{
  const result=card({id:"legacy",title:"Mi idea",technique:"Collage"});
  assert.equal((result.match(/class="idea-glass-pill /g)||[]).length,1);
  assert.match(result,/Collage/);
  assert.match(result,/startFavorite/);
  assert.match(result,/removeFav/);
});

test("favorite idea titles, pills and event IDs remain encoded",()=>{
  const result=card({id:'a" onclick="alert(1)',title:'<img src=x onerror=alert(1)>',
    technique:'Collage & más',emotion:'"Inspiración"',theme:""});
  assert.doesNotMatch(result,/<img src=x/);
  assert.match(result,/&lt;img src=x onerror=alert\(1\)&gt;/);
  assert.match(result,/Collage &amp; más/);
  assert.match(result,/&quot;Inspiración&quot;/);
  assert.doesNotMatch(result,/onclick="alert\(1\)"/);
});

test("saved favorites omit duplicated color swatches and geometric preview",()=>{
  const item={id:"palette-favorite",title:"Dibuja una ciudad que respira",
    technique:"Dibujo",emotion:"Asombro",theme:"Arquitectura",keyword:"Geometría",
    colors:["#F4B633","#9D53BB","#373578"]};
  const result=card(item);
  assert.match(result,/class="idea-glass-card"/);
  assert.match(result,/idea-glass-pill--emotion/);
  assert.match(result,/Crear con esta idea/);
  assert.match(result,/openMoodboard\('favorite'/);
  assert.match(result,/Quitar/);
  assert.doesNotMatch(result,/idea-glass-palette|mb-mini|mb-favorite-moodboard|class="swatch"|background-color:#F4B633/);
  assert.deepEqual(item.colors,["#F4B633","#9D53BB","#373578"],"The underlying colors are untouched");
  assert.doesNotMatch(render,/MusaMoodboards\.mini\(f\)|palette\(f\.colors/);
});
test("older favorites remain compact with no invented swatches",()=>{
  const result=card({id:"old",title:"Idea antigua",technique:"Collage"});
  assert.doesNotMatch(result,/idea-glass-palette|mb-mini|class="swatch"/);
  assert.match(result,/Idea antigua/);
  assert.match(result,/openMoodboard\('favorite'/);
});
test("saved cards shrink vertically on desktop and mobile",()=>{
  assert.match(css,/min-height:0;align-self:start/);
  assert.match(css,/@media\(max-width:760px\)\{[\s\S]*?\.idea-glass-card\{min-height:0/);
  assert.match(css,/@media\(max-width:480px\)\{[\s\S]*?\.idea-glass-card\{min-height:0/);
});

test("glass styles use MUSA brand color, transparent panel and mobile layouts",()=>{
  assert.match(html,/href="\/favorite-ideas\.css"/);
  assert.match(css,/\.idea-glass-card\s*\{/);
  assert.match(css,/background:[^;]*url\('\/idea-glass-art\.svg'\)/);
  assert.match(css,/\.idea-glass-panel\s*\{[\s\S]*?backdrop-filter:blur\(24px\)/);
  assert.match(css,/\.idea-glass-pill--technique\{background:#ee8fbd\}/);
  assert.match(css,/\.idea-glass-pill--emotion\{background:#d7ff42\}/);
  assert.match(css,/\.idea-glass-actions \.idea-glass-cta\s*\{[\s\S]*?background:#d7ff42/);
  assert.match(css,/@media\(max-width:480px\)/);
  assert.match(css,/@media\(prefers-reduced-motion:reduce\)/);
  assert.match(artwork,/<svg/);
  assert.match(artwork,/#3926ce/);
  assert.match(artwork,/#ff7049/);
  assert.match(artwork,/#d7ff42/);
  assert.doesNotMatch(artwork,/<image\b|<script\b|xlink:href/);
});
