/* MUSA · Safe, minimal rich text for creative writing.
 * Persist both plain text (legacy compatibility) and a small allowlisted HTML fragment.
 * No external editor, credentials, or remote content.
 */
(function(){
'use strict';
const MAX_TEXT=50000;
const MAX_HTML=150000;
const SAFE_TAGS=new Set(['STRONG','EM','UL','OL','LI','P','DIV','BR','B','I']);
const SKIP_TAGS=new Set(['SCRIPT','STYLE','SVG','MATH','IFRAME','OBJECT','EMBED','IMG','LINK','META','FORM','TEMPLATE','VIDEO','AUDIO','INPUT','BUTTON']);
const htmlEscape=v=>String(v??'').replace(/[&<>"']/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
function sanitize(markup){
  const source=String(markup??'').slice(0,MAX_HTML);
  if(!source)return '';
  // Inert HTML parsing plus reconstruction: no attributes, styles, links, or events survive.
  if(typeof DOMParser==='undefined')return htmlEscape(source);
  const parsed=new DOMParser().parseFromString('<div>'+source+'</div>','text/html');
  const root=parsed.body.firstElementChild||parsed.body;
  let remaining=MAX_TEXT;
  const visit=(node,depth)=>{
    if(remaining<=0||depth>30)return '';
    if(node.nodeType===3){const value=String(node.nodeValue||'').slice(0,remaining);remaining-=value.length;return htmlEscape(value);}
    if(node.nodeType!==1||SKIP_TAGS.has(node.tagName))return '';
    const tag=node.tagName;
    const content=Array.from(node.childNodes).map(child=>visit(child,depth+1)).join('');
    if(tag==='BR')return '<br>';
    if(!SAFE_TAGS.has(tag))return content;
    const normalized=tag==='B'?'strong':tag==='I'?'em':tag==='DIV'?'p':tag.toLowerCase();
    return '<'+normalized+'>'+content+'</'+normalized+'>';
  };
  return Array.from(root.childNodes).map(node=>visit(node,0)).join('');
}
function renderDraft(item){
  const rich=String(item?.draftHtml||'');
  return rich?sanitize(rich):htmlEscape(item?.draft||'').replace(/\r\n?|\n/g,'<br>');
}
function renderEditor(item){
  return '<div class="ma-writing-editor-group">'+
    '<div class="ma-writing-editor-heading"><label id="ma-editor-label" for="ma-writing-editor">TU TEXTO · BORRADOR PRIVADO</label>'+
    '<span>Se guarda en tu cuenta de MUSA</span></div>'+
    '<div class="ma-writing-toolbar" role="toolbar" aria-label="Formato de texto">'+
    '<button type="button" aria-label="Negrita" title="Negrita (Ctrl/Cmd + B)" onmousedown="event.preventDefault()" onclick="MusaWritingEditor.format(\'bold\')"><strong>B</strong></button>'+
    '<button type="button" aria-label="Cursiva" title="Cursiva (Ctrl/Cmd + I)" onmousedown="event.preventDefault()" onclick="MusaWritingEditor.format(\'italic\')"><em>I</em></button>'+
    '<span class="ma-toolbar-separator" aria-hidden="true"></span>'+
    '<button type="button" aria-label="Lista con viñetas" title="Lista con viñetas" onmousedown="event.preventDefault()" onclick="MusaWritingEditor.format(\'insertUnorderedList\')"><span aria-hidden="true">• ≡</span></button>'+
    '</div>'+
    '<div id="ma-writing-editor" class="ma-rich-editor" role="textbox" aria-labelledby="ma-editor-label" aria-multiline="true"'+
    ' contenteditable="true" spellcheck="true" data-placeholder="Empieza con una frase. No hace falta que sea perfecta..."'+
    ' oninput="MusaWritingEditor.sync(this)" onpaste="MusaWritingEditor.paste(event)"'+
    ' onbeforeinput="MusaWritingEditor.limit(event)">'+renderDraft(item)+'</div>'+
    '</div>';
}
function limit(event){
  if(!event.inputType||event.inputType.startsWith('delete')||event.inputType==='historyUndo'||event.inputType==='historyRedo')return;
  if((event.currentTarget?.innerText||event.currentTarget?.textContent||'').length>=MAX_TEXT)event.preventDefault();
}
function sync(editor){
  if(!editor)return;
  let text=String(editor.innerText??editor.textContent??'');
  if(text.length>MAX_TEXT){text=text.slice(0,MAX_TEXT);editor.textContent=text;}
  const rich=sanitize(editor.innerHTML||'');
  if(typeof updateWritingDraft==='function')updateWritingDraft({text,html:rich});
  return {text,html:rich};
}
function format(action){
  if(!['bold','italic','insertUnorderedList'].includes(action))return;
  const editor=document.getElementById('ma-writing-editor');
  if(!editor)return;
  editor.focus();
  // Contenteditable's native editing commands preserve the current selection and undo stack.
  if(document.execCommand)document.execCommand(action,false,null);
  sync(editor);
}
function paste(event){
  const plain=event.clipboardData?.getData('text/plain');
  if(typeof plain!=='string')return;
  event.preventDefault();
  const editor=event.currentTarget;
  const existing=(editor.innerText||editor.textContent||'').length;
  const insert=plain.slice(0,Math.max(0,MAX_TEXT-existing));
  if(!insert)return;
  if(document.execCommand){document.execCommand('insertText',false,insert);}
  else {
    const selection=window.getSelection?.();
    const range=selection?.rangeCount?selection.getRangeAt(0):null;
    if(range&&editor.contains(range.commonAncestorContainer)){
      range.deleteContents();
      const node=document.createTextNode(insert);
      range.insertNode(node);
      range.setStartAfter(node);range.collapse(true);
      selection.removeAllRanges();selection.addRange(range);
    }
  }
  sync(editor);
}
window.MusaWritingEditor={sanitize,renderDraft,renderEditor,sync,format,paste,limit,escape:htmlEscape};
})();
