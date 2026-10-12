/* Randomized references from the existing MUSA API. The regular search is independent. */
const showcaseTopics=['abstract art','sculpture','architecture','color','nature','portrait','modern art','textures'];
const showcase={topic:showcaseTopics[Math.floor(Math.random()*showcaseTopics.length)],items:[],loading:false,loaded:false,error:''};
const showcaseSources=new Set(['unsplash','met','artic','wikimedia']);
function shuffled(list){
 const copy=[...list];
 for(let i=copy.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[copy[i],copy[j]]=[copy[j],copy[i]]}
 return copy;
}
function chooseShowcaseItems(results){
 const valid=results.filter(r=>r&&showcaseSources.has(r.source)&&safeHref(r.image)&&safeHref(r.link));
 const groups=new Map();
 for(const ref of valid){if(!groups.has(ref.source))groups.set(ref.source,[]);groups.get(ref.source).push(ref)}
 const primary=shuffled([...groups.values()].map(group=>shuffled(group)[0]));
 const selected=new Set(primary.map(r=>r.source+':'+r.id));
 const remaining=shuffled(valid.filter(r=>!selected.has(r.source+':'+r.id)));
 return shuffled([...primary,...remaining.slice(0,Math.max(0,10-primary.length))]);
}
function renderShowcase(){
 const head='<section class="musa-showcase" aria-label="Inspiración aleatoria de fuentes conectadas">'+
  '<div class="musa-showcase-head"><div><div class="eyebrow">MUSA / INSPIRACIÓN ALEATORIA ✳</div>'+
  '<h2>UNA CHISPA VISUAL AL AZAR.</h2></div><span class="musa-showcase-tag">FUENTES CONECTADAS · REFERENCIAS REALES</span></div>';
 if(showcase.error)return head+'<div class="musa-showcase-status" role="alert"><p>'+esc(showcase.error)+'</p>'+
  '<button class="btn secondary" onclick="retryShowcase()">Volver a intentar ↻</button></div></section>';
 if(!showcase.items.length)return head+'<div class="musa-showcase-status" role="status"><p>Preparando una mezcla inesperada de imágenes...</p></div></section>';
 const limit=showcase.items.slice(0,10);
 const n=limit.length;
 const radius=Math.round((220+25)/(2*Math.sin(Math.PI/Math.max(3,n))));
 const cards=limit.map((r,i)=>
   '<a class="musa-native-card" style="--angle:'+(360*i/n).toFixed(3)+'deg" href="'+esc(safeHref(r.link))+
   '" target="_blank" rel="noopener noreferrer" aria-label="Ver '+esc(r.title)+' en la fuente original">'+
   '<img src="'+esc(safeHref(r.image))+'" loading="'+(i<5?'eager':'lazy')+'" alt="'+esc(r.title)+
   '" onerror="this.closest(\'a\').classList.add(\'failed\')"></a>'
 ).join('');
 return head+'<div class="musa-carousel-frame">'+
  '<div id="musa-native-cylinder" class="musa-native-cylinder" style="--card-count:'+n+';--ring-radius:'+radius+'px">'+
  '<div class="musa-native-scene"><div class="musa-native-ring">'+cards+'</div></div>'+
  '<span class="musa-native-hint">DESLIZA PARA EXPLORAR · '+n+' REFERENCIAS</span></div>'+
  '<div id="musa-circular-carousel-root" class="musa-react-cylinder"></div></div>'+
  '<div class="musa-carousel-detail"><span id="musa-carousel-current">Explora, arrastra y descubre.</span>'+
  '<a id="musa-carousel-original" href="#" target="_blank" rel="noopener noreferrer" hidden>Ver obra original ↗</a></div></section>';
}
function retryShowcase(){showcase.loaded=false;showcase.loading=false;showcase.error='';showcase.items=[];render()}
async function loadShowcase(){
 if(showcase.loading||showcase.loaded)return;
 showcase.loading=true;
 let error='';
 for(const topic of [showcase.topic,'art']){
  try{
   const response=await fetch('/api/inspiration?q='+encodeURIComponent(topic)+'&source=all',{headers:{Accept:'application/json'}});
   if(!response.ok)throw Error('No pudimos consultar los recursos ahora.');
   const payload=await response.json();
   const items=chooseShowcaseItems(Array.isArray(payload.results)?payload.results:[]);
   if(items.length){showcase.items=items;break}
   error='Las fuentes no devolvieron imágenes. Inténtalo de nuevo.';
  }catch(e){error=e?.message||'No pudimos cargar las imágenes.'}
 }
 showcase.loading=false;
 showcase.loaded=true;
 showcase.error=showcase.items.length?'':error||'No hay referencias disponibles por ahora.';
 if(page==='explorar')render();
}
function mountShowcase(){
 if(page!=='explorar')return;
 if(showcase.items.length && window.musaCircularCarousel?.mount){
  window.musaCircularCarousel.mount(showcase.items);
 }else if(!showcase.loaded&&!showcase.loading){void loadShowcase()}
}
window.addEventListener('musa-circular-ready',()=>{if(page==='explorar')mountShowcase()});
