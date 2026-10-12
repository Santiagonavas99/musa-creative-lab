/* Curated random carousel from the real MUSA image providers.
   Filter images BEFORE building the ring. Never leave broken 3D slots. */
const showcaseTopics=['abstract art','sculpture','architecture','color','nature','portrait','modern art','textures'];
const showcase={topic:showcaseTopics[Math.floor(Math.random()*showcaseTopics.length)],
 items:[],spares:[],loading:false,loaded:false,error:'',requestId:0};
const showcaseSources=new Set(['unsplash','met','artic','wikimedia']);
function shuffled(list){
 const copy=[...list];
 for(let i=copy.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[copy[i],copy[j]]=[copy[j],copy[i]]}
 return copy;
}
function chooseShowcaseItems(results){
 const valid=results.filter(r=>r&&showcaseSources.has(r.source)&&safeHref(r.image)&&safeHref(r.link));
 const unique=new Map();
 for(const item of valid)unique.set(item.source+':'+item.id,item);
 const groups=new Map();
 for(const ref of unique.values()){if(!groups.has(ref.source))groups.set(ref.source,[]);groups.get(ref.source).push(ref)}
 const first=shuffled([...groups.values()].map(group=>shuffled(group)[0]));
 const chosen=new Set(first.map(r=>r.source+':'+r.id));
 return [...first,...shuffled([...unique.values()].filter(r=>!chosen.has(r.source+':'+r.id)))].slice(0,18);
}
function preloadShowcaseImage(ref){
 return new Promise(resolve=>{
  const image=new Image();
  let settled=false;
  const settle=ok=>{
   if(settled)return;
   settled=true;
   clearTimeout(timeout);
   image.onload=null;image.onerror=null;
   resolve(ok?ref:null);
  };
  const timeout=setTimeout(()=>settle(false),2600);
  image.decoding='async';
  image.onload=()=>settle(image.naturalWidth>0&&image.naturalHeight>0);
  image.onerror=()=>settle(false);
  image.src=ref.image;
 });
}
async function usableShowcaseItems(results){
 const candidates=chooseShowcaseItems(results);
 // Show the first six usable photographs as soon as they are ready.
 // A broken/slow museum image must NOT delay the whole carousel.
 return new Promise(resolve=>{
  if(!candidates.length){resolve([]);return}
  const valid=[];
  let completed=0;
  let finished=false;
  let deadline=0;
  const finalize=()=>{
   if(finished)return;
   finished=true;
   clearTimeout(deadline);
   resolve(shuffled(valid));
  };
  deadline=setTimeout(finalize,2500);
  candidates.forEach(ref=>{
   preloadShowcaseImage(ref).then(ok=>{
    if(finished)return;
    completed++;
    if(ok)valid.push(ok);
    if(valid.length>=6||completed===candidates.length)finalize();
   });
  });
 });
}
function renderShowcase(){
 const head='<section class="musa-showcase" aria-label="Inspiración aleatoria de fuentes conectadas">'+
 '<div class="musa-showcase-head"><div><div class="eyebrow">MUSA / INSPIRACIÓN ALEATORIA ✳</div>'+
 '<h2>UNA CHISPA VISUAL AL AZAR.</h2></div><span class="musa-showcase-tag">FUENTES CONECTADAS · REFERENCIAS REALES</span></div>';
 if(showcase.error)return head+'<div class="musa-showcase-status" role="alert"><p>'+esc(showcase.error)+'</p>'+
 '<button class="btn secondary" onclick="retryShowcase()">Volver a intentar ↻</button></div></section>';
 if(!showcase.items.length)return head+'<div class="musa-showcase-status" role="status">'+
 '<p>Buscando fotografías disponibles para tu próxima inspiración...</p></div></section>';
 const items=showcase.items;
 const n=items.length;
 const radius=Math.round((220+25)/(2*Math.sin(Math.PI/Math.max(3,n))));
 const cards=items.map((r,i)=>
  '<a class="musa-native-card" style="--angle:'+(360*i/n).toFixed(3)+'deg" href="'+esc(safeHref(r.link))+
  '" target="_blank" rel="noopener noreferrer" aria-label="Ver '+esc(r.title)+' en la fuente original">'+
  '<img src="'+esc(safeHref(r.image))+'" loading="eager" decoding="async" alt="'+esc(r.title)+
  '" onerror="repairShowcase('+i+')"></a>'
 ).join('');
 return head+'<div class="musa-carousel-frame">'+
 '<div id="musa-native-cylinder" class="musa-native-cylinder" style="--card-count:'+n+';--ring-radius:'+radius+'px">'+
 '<div class="musa-native-scene"><div class="musa-native-ring">'+cards+'</div></div>'+
 '<span class="musa-native-hint">GIRA PARA EXPLORAR · '+n+' REFERENCIAS VERIFICADAS</span></div>'+
 '<div id="musa-circular-carousel-root" class="musa-react-cylinder"></div></div>'+
 '<div class="musa-carousel-detail"><span id="musa-carousel-current">Explora, arrastra y descubre.</span>'+
 '<a id="musa-carousel-original" href="#" target="_blank" rel="noopener noreferrer" hidden>Ver obra original ↗</a></div></section>';
}
function repairShowcase(index){
 if(!showcase.items[index])return;
 if(showcase.spares.length)showcase.items[index]=showcase.spares.shift();
 else showcase.items.splice(index,1);
 if(showcase.items.length<3){
  showcase.error='Las fotografías disponibles son insuficientes. Vuelve a intentar.';
  showcase.items=[];
 }
 if(page==='explorar')render();
}
function retryShowcase(){
 showcase.requestId++;
 showcase.loaded=false;showcase.loading=false;showcase.error='';
 showcase.items=[];showcase.spares=[];
 showcase.topic=showcaseTopics[Math.floor(Math.random()*showcaseTopics.length)];
 render();
}
async function loadShowcase(){
 if(showcase.loading||showcase.loaded)return;
 showcase.loading=true;
 const requestId=++showcase.requestId;
 let error='';
 for(const topic of [showcase.topic,'art']){
  try{
   const response=await fetch('/api/inspiration?q='+encodeURIComponent(topic)+'&source=all&quick=1',
    {headers:{Accept:'application/json'}});
   if(!response.ok)throw Error('Las fuentes no respondieron a tiempo.');
   const payload=await response.json();
   const verified=await usableShowcaseItems(Array.isArray(payload.results)?payload.results:[]);
   if(requestId!==showcase.requestId)return;
   if(verified.length>=3){
    showcase.items=verified.slice(0,6);
    showcase.spares=verified.slice(6);
    break;
   }
   error='No encontramos suficientes imágenes disponibles. Intenta otra mezcla.';
  }catch(e){error=e?.message||'No pudimos cargar fotografías.'}
  if(requestId!==showcase.requestId)return;
 }
 showcase.loading=false;showcase.loaded=true;
 showcase.error=showcase.items.length?'':error||'No hay fotografías disponibles ahora.';
 if(page==='explorar')render();
}
function mountShowcase(){
 if(page!=='explorar')return;
 if(showcase.items.length&&window.musaCircularCarousel?.mount)window.musaCircularCarousel.mount(showcase.items);
 else if(!showcase.loaded&&!showcase.loading)void loadShowcase();
}
window.addEventListener('musa-circular-ready',()=>{if(page==='explorar')mountShowcase()});
