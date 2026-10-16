/* MUSA · Editorial moodboards. Reference images come from the existing /api/inspiration gateway. */
(function () {
  'use strict';
  const themes={
    'Tres colores, un universo':['Geométrico',['formas','contraste','equilibrio'],['#D7FF42','#211B36','#E8E6DE','#8AA5F7'],'geometric abstract architecture forms'],
    'El objeto imposible':['Surreal',['objeto','imposible','escultura'],['#EF8BBA','#34205C','#E7D5C7','#87C4C5'],'surreal objects sculpture art'],
    'Sin levantar el lápiz':['Línea continua',['dibujo','gesto','trazo'],['#1E254A','#F0C781','#F5ECE2','#B78DB8'],'continuous line drawing abstract'],
    'Un recuerdo en pedazos':['Collage',['memoria','archivo','textura'],['#E9A18C','#493A5B','#EADBC2','#8694A1'],'vintage collage paper cutout'],
    'Texturas de tu mundo':['Texturas',['superficie','material','detalle'],['#C0A482','#2A4A4A','#EDE0CE','#B8D48D'],'material texture macro photography'],
    'Lo que no tiene nombre':['Abstracto',['emoción','color','expresión'],['#BE8EE6','#32225C','#F7C5A9','#B4D7C4'],'abstract emotional painting shapes'],
    'Sombras que dibujan':['Luz y sombra',['arquitectura','siluetas','contraste'],['#8DA4F5','#211B36','#EFEBDF','#C8D7ED'],'abstract architecture light shadow'],
    'Naturaleza en código':['Orgánico',['botánica','ritmo','naturaleza'],['#C7F16E','#124A39','#E9E6CE','#97C1A1'],'organic botanical shapes graphic design'],
    'Un universo de papel':['Papercut',['recortes','capas','volumen'],['#F8B06A','#B34A6E','#E8DCEB','#304C75'],'paper cutout sculpture colorful'],
    'El color del movimiento':['Movimiento',['velocidad','ritmo','color'],['#F8A040','#3926CE','#D7FF42','#E8E6DE'],'kinetic art movement colorful'],
    'Ciudades imaginarias':['Arquitectura',['futuro','ciudad','formas'],['#8AA5F7','#292450','#F4CA95','#D9E0F0'],'brutalist architecture colorful surreal'],
    'Objetos fuera de escala':['Surrealismo',['escala','objeto','perspectiva'],['#ED8FBD','#211B36','#D7FF42','#EDE8DF'],'surreal giant objects photography'],
    'La música tiene textura':['Sonido',['ondas','vibración','material'],['#BBA5EF','#241D49','#EEAD8F','#E7E3D4'],'sound waves art installation abstract'],
    'Arte hecho de sombras':['Sombras',['fotografía','silueta','minimal'],['#F1DAA5','#211B36','#A8B6C6','#E7DCD0'],'shadows minimal photography geometric'],
    'Una forma, mil versiones':['Minimal',['repetición','forma','variaciones'],['#D7FF42','#3926CE','#F5F0E7','#FF7049'],'minimal graphic design repeating shapes']
  };
  const ideaThemes={
    'Representa la nostalgia sin dibujar personas':['Nostalgia',['memoria','collage','objetos'],'nostalgic vintage still life collage'],
    '¿De qué color es el silencio?':['Silencio',['calma','abstracción','color'],'minimal abstract calm pastel art'],
    'Inventa un recuerdo del futuro':['Futurismo',['futuro','memoria','ficción'],'retro futuristic collage'],
    'Dibuja una ciudad que respira':['Arquitectura',['ciudad','naturaleza','línea'],'organic architecture future city'],
    'Haz un autorretrato sin mostrar tu rostro':['Identidad',['símbolos','fotografía','textura'],'identity conceptual photography still life'],
    'Convierte un error en una obra':['Experimentación',['error','materia','collage'],'experimental mixed media abstract art'],
    'Crea un paisaje con objetos cotidianos':['Objetos',['paisaje','composición','juego'],'surreal still life ordinary objects'],
    'Representa el sonido de tu infancia':['Sonido',['memoria','color','vibración'],'sound visualization abstract art'],
    'Diseña un planeta hecho de papel':['Papercut',['formas','espacio','volumen'],'paper cut collage planet sculpture'],
    '¿Cómo se vería la alegría sin rostros?':['Alegría',['color','ritmo','abstracción'],'playful colorful abstract painting'],
    'Crea una criatura usando solo líneas':['Línea',['ilustración','gesto','movimiento'],'minimal line illustration creature'],
    'Transforma una sombra en un paisaje':['Sombras',['paisaje','luz','contraste'],'abstract shadow light landscape'],
    'Inventa un alfabeto de formas':['Geometría',['símbolos','tipografía','sistema'],'geometric symbols experimental typography'],
    'Diseña una portada para un sueño':['Surrealismo',['sueño','collage','editorial'],'dreamlike surreal editorial collage'],
    'Convierte un sonido en textura':['Textura',['sonido','material','arte'],'sound texture abstract macro'],
    'Construye una ciudad con recortes':['Collage',['arquitectura','papel','composición'],'architecture collage paper cut']
  };
  const extraChallenges=[
    {title:'Sombras que dibujan',time:20,level:'Fácil',text:'Encuentra formas inesperadas en las sombras y crea una composición.'},
    {title:'Naturaleza en código',time:30,level:'Medio',text:'Traduce una planta o textura natural en un patrón visual.'},
    {title:'Un universo de papel',time:15,level:'Fácil',text:'Construye una imagen con recortes y capas de papel.'},
    {title:'El color del movimiento',time:20,level:'Medio',text:'Representa velocidad y ritmo sin dibujar personas.'},
    {title:'Ciudades imaginarias',time:45,level:'Medio',text:'Diseña una ciudad imposible mezclando arquitectura y fantasía.'},
    {title:'Objetos fuera de escala',time:30,level:'Medio',text:'Haz que un objeto diminuto parezca gigantesco.'},
    {title:'La música tiene textura',time:15,level:'Fácil',text:'Convierte una canción en texturas y formas abstractas.'},
    {title:'Arte hecho de sombras',time:5,level:'Fácil',text:'Crea algo nuevo únicamente con luz y sombra.'},
    {title:'Una forma, mil versiones',time:60,level:'Avanzado',text:'Repite una sola forma hasta inventar un lenguaje visual.'}
  ];
  const extraIdeas=[
    ['Diseña un planeta hecho de papel','Curiosidad','Collage','Universo',['#d7ff42','#3926ce','#f4e8dc']],
    ['¿Cómo se vería la alegría sin rostros?','Alegría','Abstracción','Sensaciones',['#ff7049','#d7ff42','#8aa5f7']],
    ['Crea una criatura usando solo líneas','Asombro','Ilustración','Animales',['#38235d','#d5a2df','#f5eee5']],
    ['Transforma una sombra en un paisaje','Calma','Fotografía','Luz',['#a6b7d3','#282342','#e6d7bb']],
    ['Inventa un alfabeto de formas','Curiosidad','Diseño','Símbolos',['#d7ff42','#211b36','#8aa5f7']],
    ['Diseña una portada para un sueño','Misterio','Collage','Sueños',['#8a79c8','#ffab8d','#e8e6de']],
    ['Convierte un sonido en textura','Sorpresa','Técnica mixta','Sonido',['#a9c3c9','#34337c','#f6d7a3']],
    ['Construye una ciudad con recortes','Juego','Collage','Arquitectura',['#ff7049','#3926ce','#d7ff42']]
  ];
  const cache=new Map();
  let modal=null;
  let opener=null;
  let previousOverflow='';
  const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  function href(s){try{const u=new URL(s);return u.protocol==='https:'?u.href:''}catch{return ''}}
  function key(item){return String(item?.title||'').trim();}
  function enrichChallenge(c){const theme=themes[key(c)]||['Creatividad',['explorar','crear','arte'],['#D7FF42','#211B36','#E8E6DE','#8AA5F7'],'creative abstract art'];
    return {...c,id:c.id||'reto-'+key(c).toLocaleLowerCase('es').normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,''),type:'challenge',description:c.text,keyword:theme[0],tags:theme[1],colors:theme[2],searchTerms:theme[3]};}
  function enrichIdea(p){const title=p[0],theme=ideaThemes[title]||['Creatividad',[p[2],p[3]],p[3]+' '+p[2]+' art'];
    return {id:'idea-'+Math.random().toString(36).slice(2),title,emotion:p[1],technique:p[2],theme:p[3],colors:p[4],type:'idea',keyword:theme[0],tags:theme[1],searchTerms:theme[2]};}
  function sanitizeRefs(items){
    const seen=new Set();
    return (Array.isArray(items)?items:[]).map(r=>({
      image:href(r?.image),link:href(r?.link),creator:String(r?.creator||'Autor no indicado').slice(0,120),
      source:String(r?.source||'').slice(0,30),title:String(r?.title||'Referencia visual').slice(0,160),
      license:String(r?.license||'Consultar licencia en origen').slice(0,160)
    })).filter(r=>r.image&&r.link&&!seen.has(r.image)&&seen.add(r.image)).slice(0,7);
  }
  function getRefs(item){const s=cache.get(key(item));return s?.items?.length?s.items:sanitizeRefs(item?.moodboardRefs);}
  function getPalette(item){let c=(Array.isArray(item?.colors)?item.colors:[]).filter(s=>/^#[0-9a-fA-F]{6}$/.test(s)).slice(0,4);return c.length?c:['#D7FF42','#211B36','#E8E6DE','#8AA5F7'];}
  async function load(item,force=false){
    const k=key(item);
    if(!force&&cache.has(k)){const value=cache.get(k);return value.promise||value.items||[];}
    const job=(async()=>{
      const terms=String(item.searchTerms||[item.keyword,...(item.tags||[])].join(' '));
      let refs=[];
      for(const q of [terms,item.keyword+' abstract art design']){
        try{
          const res=await fetch('/api/inspiration?q='+encodeURIComponent(q)+'&source=all',{headers:{Accept:'application/json'}});
          if(!res.ok)continue;
          const payload=await res.json();
          refs=sanitizeRefs([...refs,...(Array.isArray(payload?.results)?payload.results:[])]);
          if(refs.length>=4)break;
        }catch(_e){/* Surface an honest empty-state instead of substituting unrelated imagery. */}
      }
      const items=refs.length?refs:sanitizeRefs(item?.moodboardRefs);
      cache.set(k,{items});
      return items;
    })();
    cache.set(k,{promise:job});
    return job;
  }
  function shuffle(items){
    const a=items.slice();for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]];}return a;
  }
  function initialChallenges(items){
    const candidates=shuffle(items);
    let recent=[];
    try{recent=JSON.parse(sessionStorage.getItem('musa-recent-retos')||'[]')}catch(_e){}
    const fresh=candidates.filter(c=>!recent.includes(key(c)));
    const chosen=[...fresh,...candidates.filter(c=>recent.includes(key(c)))].slice(0,6);
    try{sessionStorage.setItem('musa-recent-retos',JSON.stringify(chosen.map(key)))}catch(_e){}
    return chosen.map(key);
  }
  function nextIdea(items,last){
    let previous=last?.title||'';
    try{if(!previous)previous=sessionStorage.getItem('musa-last-idea')||''}catch(_e){}
    const options=items.filter(p=>p[0]!==previous);
    const chosen=(options.length?options:items)[Math.floor(Math.random()*(options.length||items.length))];
    try{sessionStorage.setItem('musa-last-idea',chosen[0])}catch(_e){}
    return enrichIdea(chosen);
  }
  function palette(item,compact=false){
    return '<div class="'+(compact?'mb-mini-palette':'mb-palette')+'" role="group" aria-label="Paleta sugerida con códigos HEX">'+getPalette(item).map(c=>
      '<div class="mb-color"><span class="mb-color-chip" style="background:'+c+'"></span>'+(compact?'':'<code>'+c.toUpperCase()+'</code>')+'</div>').join('')+'</div>';
  }
  function tile(ref,index,mini=false){
    if(!ref)return '<div class="mb-art-block mb-art-block--'+(index%3)+'" aria-label="Composición gráfica de MUSA"><span></span><i></i></div>';
    const source={unsplash:'Unsplash',met:'The Met',artic:'Art Institute',wikimedia:'Wikimedia'}[ref.source]||ref.source;
    return '<a class="mb-picture" href="'+esc(ref.link)+'" target="_blank" rel="noopener noreferrer" title="Ver referencia original en '+esc(source)+'"><img src="'+esc(ref.image)+'" alt="'+esc(ref.title)+'" loading="'+(mini?'lazy':'eager')+'" referrerpolicy="no-referrer" onerror="this.parentElement.classList.add(\'mb-image-failed\')"><span class="mb-credit">'+esc(source)+' · '+esc(ref.creator)+'</span></a>';
  }
  function mini(item){
    const refs=getRefs(item);
    return '<div class="mb-mini"><div class="mb-mini-collage">'+[0,1,2].map(i=>tile(refs[i],i,true)).join('')+'</div>'+palette(item,true)+'</div>';
  }
  function challengeCard(item,index,accepted,saved){
    const c=enrichChallenge(item),isAccepted=Boolean(accepted),isSaved=Boolean(saved);
    return '<article class="card mb-challenge-card'+(isAccepted?' mb-is-accepted':'')+'">'+
      (isAccepted?'<div class="mb-status">✓ Reto aceptado</div>':'')+
      '<div class="mb-challenge-meta">'+c.time+' MIN · '+esc(c.level.toUpperCase())+'</div>'+
      '<h3>'+esc(c.title)+'</h3><p>'+esc(c.text)+'</p>'+
      '<span class="mb-keyword">'+esc(c.keyword)+'</span>'+
      (isAccepted?mini({...c,moodboardRefs:accepted.moodboardRefs}):'')+
      '<div class="mb-card-actions">'+
      '<button type="button" class="btn secondary" onclick="'+(isAccepted?'continueChallenge('+index+')':'acceptChallenge('+index+')')+'">'+(isAccepted?'Continuar reto':'Aceptar reto')+' ↗</button>'+
      '<button type="button" class="mb-outline-button" onclick="openMoodboard(\'challenge\','+index+')">▧ Ver moodboard</button>'+
      (isAccepted?'<button type="button" class="mb-quiet-save" onclick="saveChallenge('+index+')">'+(isSaved?'✓ Guardado':'♡ Guardar reto')+'</button>':'')+
      '</div></article>';
  }
  function modalHTML(item){
    const refs=getRefs(item),challenge=item.type==='challenge';
    const collage='<div class="mb-editorial-grid">'+
      '<div class="mb-tile mb-tile--hero">'+tile(refs[0],0)+'</div>'+
      '<div class="mb-tile mb-tile--second">'+tile(refs[1],1)+'</div>'+
      '<div class="mb-tile mb-tile--third">'+tile(refs[2],2)+'</div>'+
      '<div class="mb-tile mb-tile--label"><span>INSPIRACIÓN / MUSA</span><strong>'+esc(item.keyword||'Creatividad')+'</strong><small>'+esc((item.tags||[]).join(' · '))+'</small></div>'+
      '<div class="mb-tile mb-tile--fourth">'+tile(refs[3],3)+'</div>'+
      '<div class="mb-tile mb-tile--fifth">'+tile(refs[4],4)+'</div>'+
      '</div>';
    const loading=cache.get(key(item))?.promise&&!refs.length;
    const message=loading?'<p class="mb-reference-note" role="status">Buscando referencias auténticas por «'+esc(item.keyword)+'»...</p>':
      !refs.length?'<p class="mb-reference-note" role="status">Las fuentes no devolvieron imágenes esta vez. Puedes explorar la composición gráfica o intentar de nuevo.</p>':
      '<p class="mb-reference-note">Referencias de fuentes conectadas. Abre cada fotografía para ver autoría y condiciones de uso.</p>';
    return '<div class="mb-backdrop" role="presentation" onclick="window.MusaMoodboards.close()"></div>'+
      '<section class="mb-dialog" role="dialog" aria-modal="true" aria-labelledby="mb-dialog-title" tabindex="-1">'+
      '<button type="button" class="mb-close" aria-label="Cerrar moodboard" onclick="window.MusaMoodboards.close()">×</button>'+
      '<div class="mb-dialog-head"><span class="mb-dialog-overline">'+(challenge?esc(item.time)+' MIN · '+esc(item.level):'MUSA / IDEA PARA CREAR')+'</span>'+
      '<h2 id="mb-dialog-title">'+esc(item.title)+'</h2><p>'+esc(item.text||item.description||'Una idea para empezar a crear.')+'</p>'+
      '<span class="mb-keyword">'+esc(item.keyword||'Creatividad')+'</span></div>'+
      collage+message+
      '<div class="mb-palette-head"><h3>Paleta sugerida</h3><button type="button" class="mb-copy" onclick="window.MusaMoodboards.copyPalette()">Copiar códigos HEX ↗</button></div>'+
      palette(item)+
      '<div class="mb-dialog-actions"><button type="button" class="mb-outline-button" onclick="window.MusaMoodboards.saveCurrent()">♡ Guardar '+(challenge?'reto':'idea')+'</button>'+
      '<button type="button" class="btn secondary" onclick="window.MusaMoodboards.acceptCurrent()">'+(challenge?'Aceptar reto':'Crear con esta idea')+' ↗</button></div></section>';
  }
  function paint(){
    if(!modal)return;
    const host=document.getElementById('musa-moodboard-root');
    if(host)host.innerHTML=modalHTML(modal.item);
  }
  function open(item,actions){
    if(!item)return;
    close();
    opener=document.activeElement;
    previousOverflow=document.body?.style?.overflow||'';
    if(document.body?.style)document.body.style.overflow='hidden';
    modal={item,actions};
    paint();
    document.querySelector?.('.mb-close')?.focus?.();
    load(item).then(()=>{if(modal?.item===item){paint();document.querySelector?.('.mb-close')?.focus?.();}}).catch(()=>{if(modal?.item===item)paint()});
  }
  function close(){
    if(!modal)return;
    modal=null;
    const host=document.getElementById('musa-moodboard-root');
    if(host)host.innerHTML='';
    if(document.body?.style)document.body.style.overflow=previousOverflow;
    opener?.focus?.();
    opener=null;
  }
  function acceptCurrent(){if(!modal)return;const {item,actions}=modal;actions?.accept?.({...item,moodboardRefs:getRefs(item)});close();}
  function saveCurrent(){if(!modal)return;modal.actions?.save?.({...modal.item,moodboardRefs:getRefs(modal.item)});paint();}
  function copyPalette(){
    if(!modal)return;
    const value=getPalette(modal.item).join(', ');
    if(navigator?.clipboard?.writeText)navigator.clipboard.writeText(value).catch(()=>{});
  }
  document.addEventListener?.('keydown',e=>{
    if(!modal)return;
    if(e.key==='Escape'){e.preventDefault();close();return;}
    if(e.key!=='Tab')return;
    const dialog=document.querySelector?.('.mb-dialog');
    const items=dialog?.querySelectorAll?.('button:not([disabled]), a[href]')||[];
    if(!items.length)return;
    if(e.shiftKey&&document.activeElement===items[0]){e.preventDefault();items[items.length-1].focus();}
    if(!e.shiftKey&&document.activeElement===items[items.length-1]){e.preventDefault();items[0].focus();}
  });
  window.MusaMoodboards={extraChallenges,extraIdeas,enrichChallenge,enrichIdea,nextIdea,initialChallenges,getRefs,getPalette,load,mini,challengeCard,open,close,saveCurrent,acceptCurrent,copyPalette};
})();