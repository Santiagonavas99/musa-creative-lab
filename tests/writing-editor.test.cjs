'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const root=path.resolve(__dirname,'..');
const script=fs.readFileSync(path.join(root,'public/writing-editor.js'),'utf8');
const html=fs.readFileSync(path.join(root,'index.html'),'utf8');
const styles=fs.readFileSync(path.join(root,'public/writing-editor.css'),'utf8');
// Small test-only DOMParser double. Production uses the browser's inert DOMParser.
class FakeDOMParser {
 parseFromString(html){
  const root={nodeType:1,tagName:'ROOT',childNodes:[]};
  const stack=[root];
  for(const token of html.match(/<\/?[a-zA-Z][^>]*>|[^<]+/g)||[]){
   const close=token.match(/^<\/([a-zA-Z0-9]+)/);
   if(close){const tag=close[1].toUpperCase();while(stack.length>1){const top=stack.pop();if(top.tagName===tag)break;}continue;}
   const open=token.match(/^<([a-zA-Z0-9]+)/);
   if(open){
     const node={nodeType:1,tagName:open[1].toUpperCase(),childNodes:[]};
     stack[stack.length-1].childNodes.push(node);
     if(!['BR','IMG','INPUT','LINK','META'].includes(node.tagName)&&!token.endsWith('/>'))stack.push(node);
   }else stack[stack.length-1].childNodes.push({nodeType:3,nodeValue:token});
  }
  return {body:{firstElementChild:root.childNodes[0],childNodes:root.childNodes}};
 }
}
function init(){
 const writes=[],commands=[],elements={};
 const document={
  getElementById(id){return elements[id]||null},
  execCommand(...args){commands.push(args);return true}
 };
 const window={};
 const ctx=vm.createContext({
  window,document,DOMParser:FakeDOMParser,
  updateWritingDraft(value){writes.push(value)}
 });
 vm.runInContext(script,ctx,{filename:'writing-editor.js'});
 return {api:window.MusaWritingEditor,writes,commands,elements,ctx};
}
test('MUSA writing exercise exposes bold, italic, and bullet list formatting controls',()=>{
 const {api}=init();
 const output=api.renderEditor({draft:'Empieza con una frase'});
 assert.match(output,/contenteditable="true"/);
 assert.match(output,/role="toolbar"/);
 assert.match(output,/aria-label="Negrita"/);
 assert.match(output,/aria-label="Cursiva"/);
 assert.match(output,/aria-label="Lista con viñetas"/);
 assert.match(output,/Empieza con una frase/);
 assert.match(styles,/\.ma-rich-editor\{/);
 assert.match(styles,/@media\(max-width:680px\)/);
});
test('formatted content preserves only safe paragraphs, bold, italic, and lists',()=>{
 const {api}=init();
 const clean=api.sanitize('<p style="color:red">Hola <b onclick="evil()">mundo</b> <i class="x">creativo</i></p><ul style="x"><li>Idea uno</li><li><strong>Idea dos</strong></li></ul>');
 assert.match(clean,/<p>Hola <strong>mundo<\/strong> <em>creativo<\/em><\/p>/);
 assert.match(clean,/<ul><li>Idea uno<\/li><li><strong>Idea dos<\/strong><\/li><\/ul>/);
 assert.doesNotMatch(clean,/style=|onclick=|class=/);
});
test('rejects scripts, embedded content, dangerous links and unsafe HTML attributes',()=>{
 const {api}=init();
 const clean=api.sanitize('<script>alert(1)</script><img src=x onerror=alert(2)><svg onload=evil()></svg><a href="javascript:evil()">referencia</a><strong title="attack">seguro</strong>');
 assert.doesNotMatch(clean,/<script|<img|<svg|<a|onerror|javascript:|title=/i);
 assert.match(clean,/referencia/);
 assert.match(clean,/<strong>seguro<\/strong>/);
});
test('legacy plain drafts remain readable and HTML input is escaped',()=>{
 const {api}=init();
 const output=api.renderDraft({draft:'Uno\nDos <script>alert("X")</script>'});
 assert.match(output,/Uno<br>Dos/);
 assert.match(output,/&lt;script&gt;/);
 assert.doesNotMatch(output,/<script>/);
});
test('editing sync saves both legacy plain text and a safe formatted HTML version',()=>{
 const {api,writes,commands,elements}=init();
 const editor={innerHTML:'<strong style="background:red">Hola</strong><ul><li>Mi idea</li></ul>',
   innerText:'Hola\nMi idea',focus(){this.focused=true},contains(){return true}};
 elements['ma-writing-editor']=editor;
 const saved=api.sync(editor);
 assert.equal(saved.text,'Hola\nMi idea');
 assert.match(saved.html,/<strong>Hola<\/strong>/);
 assert.match(saved.html,/<ul><li>Mi idea<\/li><\/ul>/);
 assert.doesNotMatch(saved.html,/style=/);
 assert.equal(writes.length,1);
 api.format('bold');api.format('italic');api.format('insertUnorderedList');
 assert.deepEqual(commands.map(x=>x[0]),['bold','italic','insertUnorderedList']);
 assert.equal(writes.length,4);
 api.format('insertHTML');
 assert.equal(commands.length,3,'arbitrary formatting actions are not accepted');
});
test('pasting is plain-text-only and never inserts untrusted clipboard HTML',()=>{
 const {api,commands}=init();
 const event={currentTarget:{innerText:'',innerHTML:'',textContent:'',contains(){return true}},
  clipboardData:{getData(type){return type==='text/plain'?'texto seguro':'<img onerror=evil()>'}},
  preventDefault(){this.blocked=true}};
 api.paste(event);
 assert.equal(event.blocked,true);
 assert.equal(commands[0][0],'insertText');
 assert.equal(commands[0][2],'texto seguro');
});
test('finished writing artwork persists formatted content and reuses the sanitized renderer',()=>{
 assert.match(html,/writingHtml,image:'',imagePath/);
 assert.match(html,/window\.MusaWritingEditor\.renderDraft/);
 assert.match(html,/window\.MusaWritingEditor\.sanitize\(a\.writingHtml\)/);
 assert.match(html,/window\.MusaWritingEditor\.renderEditor\(data\.active\.item\)/);
 assert.match(html,/src="\/writing-editor\.js"/);
 assert.match(html,/href="\/writing-editor\.css"/);
});
