"use strict";
const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const vm = require("node:vm");
const path = require("node:path");
const script = fs.readFileSync(path.join(__dirname,"../public/boards.js"),"utf8");

function harness(references = [], boards = []) {
  let index = 0, persists = 0, renders = 0, messages = [];
  let formInput = { value:"", focus(){} };
  const data = { references, boards, favorites:[] };
  const ctx = vm.createContext({
    data,
    inspiration:{items:[]},
    crypto:{randomUUID(){return "board-id-"+(++index)}},
    save(){persists++;return true},
    render(){renders++},
    toast(value){messages.push(value)},
    safeHref(raw){try{const url = new URL(raw);return url.protocol==="https:"?url.href:""}catch{return""}},
    esc(value){return String(value??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]))},
    referenceKey(ref){return String(ref.source)+":"+String(ref.id)},
    musaMark(){return "<svg></svg>"},
    document:{
      addEventListener(){},
      getElementById(id){if(id==="board-name")return formInput;return null},
    },
  });
  vm.runInContext(script,ctx);
  return {
    data,ctx,formInput,messages,
    get persists(){return persists},
    get renders(){return renders},
    call(code){return vm.runInContext(code,ctx)}
  };
}
function sample(id) {
  return {id,source:"met",title:"Study "+id,creator:"Artist",
    image:"https://images.metmuseum.org/"+id+".jpg",
    link:"https://www.metmuseum.org/art/collection/search/"+id};
}

test("older saved references migrate into Sin clasificar without data loss", () => {
  const h=harness([sample(1),sample(2)]);
  h.call("initBoards()");
  assert.equal(h.data.references.length,2);
  assert.equal(h.data.boards.length,1);
  assert.equal(h.data.boards[0].name,"Sin clasificar");
  assert.equal(h.data.references[0].boardIds[0],h.data.boards[0].id);
  assert.equal(h.data.references[1].boardIds[0],h.data.boards[0].id);
  assert.equal(h.persists,1);
  h.call("initBoards()");
  assert.equal(h.persists,1,"Migration is idempotent");
});

test("creating and renaming a board from the dialog validates and preserves reference links",()=>{
  const h=harness();
  h.ctx.inspiration.items=[sample(3)];
  h.call("initBoards();openBoardEditor('',0)");
  h.formInput.value="  Fotografía   de producto  ";
  h.call("submitBoardEditor({preventDefault(){}})");
  assert.equal(h.data.boards.length,1);
  assert.equal(h.data.boards[0].name,"Fotografía de producto");
  assert.equal(h.data.references.length,1);
  assert.equal(h.data.references[0].link,sample(3).link);
  assert.equal(h.data.references[0].boardIds[0],h.data.boards[0].id);
  h.call("openBoardEditor('board-id-1')");
  h.formInput.value="Moodboard editorial";
  h.call("submitBoardEditor({preventDefault(){}})");
  assert.equal(h.data.boards[0].name,"Moodboard editorial");
  assert.equal(h.data.references[0].boardIds[0],"board-id-1");
  assert.ok(h.messages.includes("Tablero actualizado"));
});

test("a saved reference can belong to multiple boards and is deduplicated by source and ID",()=>{
  const h=harness([],[
    {id:"a",name:"Marcas"},{id:"b",name:"Color"},
  ]);
  h.ctx.inspiration.items=[sample(4)];
  h.call("initBoards();saveReferenceToBoard(0,'a');saveReferenceToBoard(0,'b');saveReferenceToBoard(0,'b')");
  assert.equal(h.data.references.length,1);
  assert.deepEqual(Array.from(h.data.references[0].boardIds),["a","b"]);
  assert.equal(h.data.references[0].source,"met");
  h.call("removeReferenceFromBoard(0,'a')");
  assert.equal(h.data.references.length,1);
  assert.deepEqual(Array.from(h.data.references[0].boardIds),["b"]);
  h.call("removeReferenceFromBoard(0,'b')");
  assert.equal(h.data.references.length,0);
  assert.equal(h.data.boards.length,2,"Removing a pin should not delete its board");
});

test("board UI escapes custom titles and never exposes user names as markup",()=>{
  const h=harness();
  h.call("initBoards();openBoardEditor()");
  h.formInput.value='<img src=x onerror=alert(1)>';
  h.call("submitBoardEditor({preventDefault(){}})");
  const html = h.call("renderBoards()");
  assert.doesNotMatch(html, /<img src=x/);
  assert.match(html, /&lt;img src=x/);
  assert.match(html,/TUS TABLEROS DE INSPIRACIÓN/);
  assert.match(html,/Renombrar/);
});

test("an incomplete board name cannot create a board or lose the pending pin",()=>{
  const h=harness();
  h.ctx.inspiration.items=[sample(5)];
  h.call("openBoardEditor('',0)");
  h.formInput.value=" ";
  h.call("submitBoardEditor({preventDefault(){}})");
  assert.equal(h.data.boards.length,0);
  assert.equal(h.data.references.length,0);
  assert.match(h.call("renderBoardEditor()"),/CREAR UN TABLERO/);
});

test("legacy references with unknown board IDs are recovered in Sin clasificar",()=>{
  const orphan={...sample(6),boardIds:["deleted-board"]};
  const h=harness([orphan],[{id:"valid",name:"Identidad"}]);
  h.call("initBoards()");
  assert.equal(h.data.boards.length,2);
  assert.equal(h.data.references.length,1);
  assert.equal(h.data.references[0].boardIds.length,1);
  assert.equal(h.data.boards.find(b=>b.id===h.data.references[0].boardIds[0]).name,"Sin clasificar");
});
