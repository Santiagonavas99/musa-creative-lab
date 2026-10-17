"use strict";
const assert = require("node:assert/strict");
const fs = require("node:fs");
const vm = require("node:vm");
const path = require("node:path");
const test = require("node:test");

const root = path.resolve(__dirname, "..");
const navJS = fs.readFileSync(path.join(root, "public/nav-motion.js"), "utf8");
const navCSS = fs.readFileSync(path.join(root, "public/nav-motion.css"), "utf8");
const html = fs.readFileSync(path.join(root, "index.html"), "utf8");
const config = JSON.parse(fs.readFileSync(path.join(root, "components.json"), "utf8"));

function simulate() {
  const listener = {};
  const navClasses = new Set();
  const underlineClasses = new Set();
  const underline = {
    classList: {
      add: (name) => underlineClasses.add(name),
      remove: (name) => underlineClasses.delete(name),
      contains: (name) => underlineClasses.has(name),
    },
    style: {},
  };
  const nav = {
    classList: { add: (name) => navClasses.add(name), contains: (name) => navClasses.has(name) },
    addEventListener: (event, fn) => listener[event] = fn,
    querySelector: (selector) => selector === ".nav-travel-indicator" ? underline : null,
    getBoundingClientRect: () => ({left: 100, width: 420}),
    contains: (node) => !!node?.insideNav,
  };
  const buttons = {};
  const button = (name,left,width,active=false) => ({
    insideNav: true,
    isConnected:true,
    name,
    matches: (query) => query === "button",
    classList: {contains: (value) => value === "active" && active},
    getAttribute: (name) => name === "aria-current" && active ? "page" : null,
    getBoundingClientRect: () => ({left,width}),
    closest: (selector) => selector === "button" ? buttons[name] : null,
  });
  buttons.Inicio=button("Inicio",115,70,true);
  buttons.Explorar=button("Explorar",190,98);
  buttons.Estudio=button("Estudio",294,100);
  buttons.Actividad=button("Actividad",401,100);
  const document = {readyState:"complete",getElementById:(name)=>name==="nav"?nav:null};
  const winListeners = {};
  const window = {addEventListener:(name,fn)=>winListeners[name]=fn};
  const scope=vm.createContext({document,window,console});
  vm.runInContext(navJS,scope);
  const hover = (name, pointerType = "mouse") =>
    listener.pointerover({pointerType,target:buttons[name]});
  const focus = (name) => listener.focusin({target:buttons[name]});
  return {window,listener,nav,buttons,hover,focus,underline,underlineClasses,navClasses,winListeners};
}

test("desktop underline travels only between inactive links and resets on exit", () => {
  const ctx=simulate();
  assert.ok(ctx.navClasses.has("nav-motion-ready"));
  assert.equal(ctx.underlineClasses.has("is-visible"),false);
  ctx.hover("Inicio");
  assert.equal(ctx.underlineClasses.has("is-visible"),false,"Active lime item has no underline");
  ctx.hover("Explorar");
  assert.equal(ctx.underline.style.left,"102px");
  assert.equal(ctx.underline.style.width,"74px");
  assert.equal(ctx.underlineClasses.has("is-visible"),true);
  ctx.hover("Estudio");
  assert.equal(ctx.underline.style.left,"206px","Same underline travels to the next item");
  assert.equal(ctx.underlineClasses.has("is-visible"),true);
  ctx.hover("Inicio");
  assert.equal(ctx.underlineClasses.has("is-visible"),false,"Active never becomes underlined");
  ctx.hover("Actividad");
  ctx.listener.pointerleave({});
  assert.equal(ctx.underlineClasses.has("is-visible"),false);
  ctx.window.musaNavMotion.reset();
  assert.equal(ctx.underlineClasses.has("is-visible"),false);
});

test("keyboard focus reveals the same traveling underline but never on active link", () => {
  const ctx=simulate();
  ctx.focus("Explorar");
  assert.equal(ctx.underlineClasses.has("is-visible"),true);
  ctx.listener.focusout({relatedTarget:ctx.buttons.Estudio});
  assert.equal(ctx.underline.style.left,"206px");
  ctx.focus("Inicio");
  assert.equal(ctx.underlineClasses.has("is-visible"),false);
  ctx.listener.focusout({relatedTarget:null});
  assert.equal(ctx.underlineClasses.has("is-visible"),false);
  ctx.hover("Explorar","touch");
  assert.equal(ctx.underlineClasses.has("is-visible"),false,"No touch hover ghost state");
});

test("menu labels and navigation calls are preserved while rerenders clear the indicator", () => {
  assert.match(html,/const items=\[\['inicio','Inicio'\],\['explorar','Explorar'\],\['estudio','Mi estudio'\]\]/);
  assert.doesNotMatch(html,/\['actividad','Actividad'\]/,'The inactive Activity link must not return');
  assert.match(html,/onclick="go/);
  assert.match(html,/class="nav-travel-indicator" aria-hidden="true"/);
  assert.match(html,/window\.musaNavMotion\?\.reset\?\.\(\)/);
  assert.match(html,/href="\/nav-motion\.css"/);
  assert.match(html,/src="\/nav-motion\.js" defer/);
  assert.match(html,/id="mobile-menu-toggle"/);
});

test("hover appearance remains light lime, selected stays brand lime and never underlined", () => {
  assert.match(navCSS,/header \.nav button\.active,[\s\S]*?background:#d7ff42/);
  assert.match(navCSS,/header \.nav button:not\(\.active\):not\(\[aria-current="page"\]\):hover,[\s\S]*?background:#efffd0/);
  assert.match(navCSS,/\.nav-travel-indicator\{/);
  assert.doesNotMatch(navCSS,/background:#3926ce/);
  assert.equal((navCSS.match(/background:#d7ff42;/g)||[]).length,3,"Selected pill, traveling underline and fallback must all use MUSA lime");
  assert.match(navCSS,/@media\(prefers-reduced-motion:reduce\)/);
  assert.doesNotMatch(navCSS,/\.mobile-menu-link\s*[:{]/,"Hamburger styling must stay untouched");
});

test("React Bits Pro registries are prepared without embedding any credential",()=>{
  for(const [id,segment] of [["@reactbits-starter","starter"],["@reactbits-pro","pro"]]){
    assert.equal(config.registries[id].url,"https://pro.reactbits.dev/api/r/"+segment+"/{name}.json");
    assert.equal(config.registries[id].headers.Authorization,"Bearer "+String.fromCharCode(36)+"{REACTBITS_LICENSE_KEY}");
  }
  assert.doesNotMatch(html,/REACTBITS_LICENSE_KEY/,"License cannot appear in frontend");
  assert.ok(fs.readFileSync(path.join(root,".gitignore"),"utf8").includes(".env.*"));
});
