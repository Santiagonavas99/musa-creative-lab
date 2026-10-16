/* MUSA Creative Lab: activities for creative writing prompted by words or authentic reference photos. */
(function(){
'use strict';
const prompts=[
  {id:'carta-pendiente',title:'La carta que nunca envié',question:'¿Qué le dirías a alguien si no esperases una respuesta?',brief:'Escribe una carta de 8 a 12 líneas. No busques una historia perfecta: deja que aparezcan recuerdos, silencios y aquello que cuesta decir.',keyword:'Correspondencia',imageQuery:'vintage letter handwritten paper still life'},
  {id:'ciudad-memoria',title:'Una ciudad con memoria',question:'Si las calles pudieran hablar, ¿qué historia recordarían de ti?',brief:'Escribe un relato breve desde el punto de vista de una calle o un edificio. Incluye un sonido, un olor y un secreto.',keyword:'Ciudad',imageQuery:'quiet urban street architecture atmospheric photography'},
  {id:'objeto-secreto',title:'El secreto de un objeto',question:'¿Qué sabe de tu vida un objeto que siempre ha estado cerca?',brief:'Elige un objeto cotidiano y escribe un monólogo como si pudiera hablar. Dale una personalidad inesperada y una confesión.',keyword:'Objetos',imageQuery:'minimal still life everyday objects photography'},
  {id:'futuro-recuerdo',title:'Un recuerdo que aún no existe',question:'¿Cómo recordarías un día que todavía no ha pasado?',brief:'Narra un momento del futuro como si fuera un recuerdo antiguo. Mezcla detalles concretos con algo imposible.',keyword:'Futuro',imageQuery:'dreamy retrofuturist architecture abstract photography'},
  {id:'silencio-habla',title:'Cuando el silencio habla',question:'¿Qué sonido tiene un silencio que necesitas?',brief:'Escribe un texto de no más de 100 palabras en el que el silencio sea un personaje. Describe lo que cambia cuando llega.',keyword:'Silencio',imageQuery:'minimal quiet landscape fog empty room soft light photography'},
  {id:'puerta-extraña',title:'Detrás de esa puerta',question:'¿Qué encontrarías al abrir una puerta que ayer no existía?',brief:'Comienza con la frase «Nunca había visto esa puerta». Continúa con una escena que cambie de rumbo en el último párrafo.',keyword:'Misterio',imageQuery:'old door shadow mysterious cinematic architecture'},
  {id:'colores-emociones',title:'El color de lo que siento',question:'¿Y si una emoción no tuviera nombre, sino un color?',brief:'Elige una emoción y descríbela sin nombrarla. Usa sensaciones, temperatura, texturas y tres imágenes inesperadas.',keyword:'Sensaciones',imageQuery:'colorful abstract light texture close up'},
  {id:'fotografia-perdida',title:'La fotografía perdida',question:'¿Qué pasó justo antes de esta imagen?',brief:'Observa la escena o imagínala. Escribe qué ocurrió cinco minutos antes de la fotografía y por qué nadie volvió a hablar de ello.',keyword:'Fotografía',imageQuery:'analog film candid street documentary photography'},
  {id:'otro-yo',title:'El otro yo',question:'¿Qué versión de ti existiría en una ciudad desconocida?',brief:'Escribe una página de diario de alguien que comparte tu nombre, pero vive una vida totalmente diferente.',keyword:'Identidad',imageQuery:'cinematic portrait silhouette double exposure'},
  {id:'bosque-voz',title:'Las palabras del bosque',question:'¿Qué le pediría un árbol a quien pasa junto a él?',brief:'Cuenta una conversación imposible entre una persona y un elemento de la naturaleza. Deja que el paisaje cambie la decisión final.',keyword:'Naturaleza',imageQuery:'forest botanical mist sunlight trees photography'},
  {id:'noticia-imposible',title:'Una noticia del mañana',question:'¿Qué titular te gustaría leer mañana en un mundo más extraño?',brief:'Redacta un titular ficticio y una noticia breve que lo explique. Añade una cita de un testigo sorprendente.',keyword:'Imaginación',imageQuery:'surreal editorial news collage retro newspaper'},
  {id:'pequeñas-victorias',title:'Algo pequeño, enorme para mí',question:'¿Cuándo fue la última vez que algo diminuto cambió tu día?',brief:'Escribe una escena de 150 palabras sobre una victoria cotidiana. Haz que el lector la sienta sin explicar por qué era importante.',keyword:'Cotidiano',imageQuery:'warm sunlight coffee desk window everyday moments'}
];
const validUrl=s=>{try{const u=new URL(s);return u.protocol==='https:'?u.href:''}catch{return ''}};
const escapeHTML=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const cache=new Map();
function next(current){
  const prev=current?.id||(()=>{try{return sessionStorage.getItem('musa-last-writing')||''}catch{return ''}})();
  const candidates=prompts.filter(x=>x.id!==prev);
  const selected=candidates[Math.floor(Math.random()*candidates.length)]||prompts[0];
  try{sessionStorage.setItem('musa-last-writing',selected.id)}catch(_e){}
  return {...selected,type:'writing',writingMode:'question'};
}
function pickImage(items){
  if(!Array.isArray(items))return null;
  for(const item of items){
    const image=validUrl(item?.image),link=validUrl(item?.link);
    if(image&&link)return {image,link,title:String(item.title||'Referencia visual').slice(0,160),source:String(item.source||'Fuente visual').slice(0,50),creator:String(item.creator||'Autor no indicado').slice(0,120)};
  }
  return null;
}
async function loadImage(prompt,force=false){
  if(!prompt)return null;
  if(!force&&cache.has(prompt.id))return cache.get(prompt.id);
  const promise=(async()=>{
    for(const [query,quick] of [[prompt.imageQuery,true],[prompt.imageQuery,false],[prompt.keyword+' art photography',false]]){
      try{
        const response=await fetch('/api/inspiration?q='+encodeURIComponent(query)+'&source=all'+(quick?'&quick=1':''),{headers:{Accept:'application/json'}});
        if(!response.ok)continue;
        const payload=await response.json();
        const candidate=pickImage(payload.results);
        if(candidate){cache.set(prompt.id,Promise.resolve(candidate));return candidate}
      }catch(_e){/* Only show genuine references from MUSA sources; no synthetic photo fallback. */}
    }
    cache.set(prompt.id,Promise.resolve(null));return null;
  })();
  cache.set(prompt.id,promise);
  return promise;
}
function imageMarkup(reference,prompt,loading){
  if(loading)return '<div class="ma-writing-reference ma-loading" role="status">Buscando una fotografía relacionada con «'+escapeHTML(prompt.keyword)+'»…</div>';
  if(!reference)return '<div class="ma-writing-reference ma-unavailable" role="status"><span>Sin fotografía disponible por ahora.</span><span>Puedes probar otra idea o usar la pregunta.</span><button type="button" class="ma-link-retry" onclick="reloadWritingImage()">↻ Reintentar búsqueda</button></div>';
  return '<div class="ma-writing-photo"><img src="'+escapeHTML(reference.image)+'" alt="'+escapeHTML(reference.title)+'" loading="lazy" referrerpolicy="no-referrer" onerror="this.parentElement.classList.add(\'ma-photo-failed\')">'+
    '<a href="'+escapeHTML(reference.link)+'" target="_blank" rel="noopener noreferrer">Referencia: '+escapeHTML(reference.source)+' · '+escapeHTML(reference.creator)+' ↗</a></div>';
}
function questionMarkup(prompt){
 return '<blockquote class="ma-writing-quote"><span class="ma-quote-symbol" aria-hidden="true">“</span><p>'+escapeHTML(prompt.question)+'</p></blockquote>';
}
window.MusaWriting={prompts,next,loadImage,imageMarkup,questionMarkup,escapeHTML};
})();