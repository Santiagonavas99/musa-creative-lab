/* Replace legacy text arrows on MUSA action controls with the approved SVG chevron.
   Handles initial render, authentication screens, SPA rerenders, modal controls and content loaded later. */
(function(){
 'use strict';
 const controlSelector='button,a,[role="button"]';
 const trailingArrow=/[↗→]\s*$/u;
 const arrowWithSpace=/\s*[↗→]\s*$/u;
 function upgradeControl(el){
   if(el.querySelector?.('.musa-cta-chevron'))return false;
   if(!trailingArrow.test(el.textContent||''))return false;
   const walker=document.createTreeWalker(el,NodeFilter.SHOW_TEXT);
   let node,last=null;
   while((node=walker.nextNode()))if(trailingArrow.test(node.nodeValue||''))last=node;
   if(!last)return false;
   last.nodeValue=last.nodeValue.replace(arrowWithSpace,'');
   const icon=document.createElement('span');
   icon.className='musa-cta-chevron';
   icon.setAttribute('aria-hidden','true');
   last.parentNode.insertBefore(icon,last.nextSibling);
   return true;
 }
 function upgrade(root){
   if(!root)return;
   if(root.matches?.(controlSelector))upgradeControl(root);
   root.querySelectorAll?.(controlSelector).forEach(upgradeControl);
 }
 function begin(){
   upgrade(document.body);
   const observer=new MutationObserver(()=>upgrade(document.body));
   observer.observe(document.body,{childList:true,characterData:true,subtree:true});
 }
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',begin,{once:true});
 else begin();
})();
