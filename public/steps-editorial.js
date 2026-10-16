/* MUSA / Inicio: photographic editorial step cards.
   Sources are the same authenticated public-provider gateway used by Explorar.
   Picks new related keywords and images on refresh; each in-app rerender is stable. */
(function(){
 'use strict';
 const topics={
  inspire:[
   'minimal arches architecture sun shadow',
   'geometric architecture warm beige arch',
   'architectural detail arch sunlight'
  ],
  create:[
   'artist hand drawing pencil sketch on paper',
   'closeup hand drawing art notebook',
   'graphic designer sketching on paper'
  ],
  save:[
   'sculptural orange ceramic vase still life',
   'art studio minimalist vase object photography',
   'orange pottery sculpture design still life'
  ]
 };
 function store(){try{return window.sessionStorage}catch(_e){return null}}
 function choose(kind,queries){
  const storage=store(),storageKey='musa-steps-photo-topic-'+kind;
  const previous=Number(storage?.getItem(storageKey)??-1);
  const options=queries.map((_q,i)=>i).filter(i=>i!==previous);
  const selection=options[Math.floor(Math.random()*options.length)]??0;
  try{storage?.setItem(storageKey,String(selection))}catch(_e){}
  return queries[selection];
 }
 const selected=Object.fromEntries(Object.entries(topics).map(([kind,queries])=>[kind,choose(kind,queries)]));
 const state=Object.create(null);
 const safeURL=value=>{try{const u=new URL(value);return u.protocol==='https:'?u.href:''} catch(_e){return ''}};
 const safeText=value=>String(value||'').replace(/<[^>]*>/g,'').trim().slice(0,150);
 function validRefs(refs){
  const seen=new Set();
  return (Array.isArray(refs)?refs:[])
   .map(x=>({image:safeURL(x?.image),link:safeURL(x?.link),source:safeText(x?.source||'Archivo visual'),creator:safeText(x?.creator||'Autor no indicado'),title:safeText(x?.title||'Fotografía artística')}))
   .filter(x=>x.image&&x.link&&!seen.has(x.image)&&seen.add(x.image))
   .slice(0,9);
 }
 function useImage(kind,ref){
  if(typeof document==='undefined'||!document.querySelectorAll)return;
  for(const frame of document.querySelectorAll('[data-musa-step-photo="'+kind+'"]')){
   const img=frame.querySelector('img.how-step-photograph');
   const link=frame.querySelector('a.how-step-source');
   if(!img)return;
   img.onload=()=>frame.classList.add('is-loaded');
   img.onerror=()=>frame.classList.remove('is-loaded');
   img.alt=ref.title;
   img.src=ref.image;
   if(img.complete&&img.naturalWidth>0)frame.classList.add('is-loaded');
   if(link){link.href=ref.link;link.textContent=(ref.source==='unsplash'?'Unsplash':ref.source)+' ↗';link.title='Referencia de '+ref.creator+' · '+ref.title;}
  }
 }
 function preload(ref){
  return new Promise(resolve=>{
   const img=new Image();
   let settled=false;
   const finish=ok=>{if(settled)return;settled=true;clearTimeout(timer);img.onload=null;img.onerror=null;resolve(ok);};
   const timer=setTimeout(()=>finish(false),4600);
   img.onload=()=>finish(img.naturalWidth>0);
   img.onerror=()=>finish(false);
   img.src=ref.image;
  });
 }
 async function query(kind){
  const q=selected[kind];
  // Fast all-source lookup is the existing MUSA reference repository.
  for(const endpoint of [
    '/api/inspiration?source=all&quick=1&q='+encodeURIComponent(q),
    '/api/inspiration?source=unsplash&q='+encodeURIComponent(q)
  ]){
   try{
    const res=await fetch(endpoint,{headers:{Accept:'application/json'}});
    if(!res.ok)continue;
    const data=await res.json();
    const refs=validRefs(data.results);
    const past=store()?.getItem('musa-steps-photo-last-'+kind);
    const available=refs.filter(r=>r.image!==past);
    const ranked=[...available,...refs.filter(r=>r.image===past)];
    // Rotate among top source matches, but never deliberately repeat the last photo.
    const top=ranked.slice(0,5);
    const first=top.length?Math.floor(Math.random()*Math.min(3,top.length)):0;
    if(top[first])ranked.splice(ranked.indexOf(top[first]),1),ranked.unshift(top[first]);
    for(const ref of ranked.slice(0,6)){
     if(await preload(ref)){
      try{store()?.setItem('musa-steps-photo-last-'+kind,ref.image)}catch(_e){}
      return ref;
     }
    }
   }catch(_e){/* Preserve the vector fallback if a reference provider is unavailable. */}
  }
  return null;
 }
 function hydrate(){
  if(typeof document==='undefined'||!document.querySelectorAll||typeof Image!=='function'||typeof fetch!=='function')return;
  for(const kind of Object.keys(topics)){
   if(!document.querySelector('[data-musa-step-photo="'+kind+'"]'))continue;
   if(state[kind]?.ready){useImage(kind,state[kind].ready);continue;}
   if(state[kind]?.pending)continue;
   const pending=query(kind).then(ref=>{
    state[kind]={ready:ref||null,pending:null};
    if(ref)useImage(kind,ref);
   }).catch(()=>{state[kind]={ready:null,pending:null};});
   state[kind]={ready:null,pending};
  }
 }
 window.MusaStepCards=Object.freeze({hydrate,selected});
})();