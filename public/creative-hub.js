/* MUSA — Proyectos, diario y calendario personal */
(function(){
'use strict';
const escHtml=v=>esc(String(v??''));
const param=v=>escHtml(JSON.stringify(String(v)));
const arr=k=>Array.isArray(data[k])?data[k]:[];
const iso=d=>d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0');
const now=()=>iso(new Date());
const parse=s=>{
  if(!/^\d{4}-\d{2}-\d{2}$/.test(String(s||'')))return null;
  const [y,m,d]=s.split('-').map(Number),dt=new Date(y,m-1,d);
  return dt.getFullYear()===y&&dt.getMonth()===m-1&&dt.getDate()===d?dt:null;
};
const dateLabel=s=>parse(s)?.toLocaleDateString('es-CO',{day:'numeric',month:'long',year:'numeric'})||'Sin fecha';
const shortDate=s=>parse(s)?.toLocaleDateString('es-CO',{day:'numeric',month:'short'})||'Sin fecha';
const fromTimestamp=s=>{const d=new Date(s||'');return Number.isNaN(d.getTime())?null:iso(d)};
const getProject=id=>arr('projects').find(x=>x.id===id);
const getInput=(f,n)=>f.querySelector('[name="'+n+'"]')?.value||'';
const states={idea:'En ideas',active:'En proceso',done:'Terminado'};
const disciplines=['Diseño','Ilustración','Fotografía','Escritura','Arte','Otro'];
const options=(items,value)=>items.map(([id,title])=>'<option value="'+escHtml(id)+'"'+(id===value?' selected':'')+'>'+escHtml(title)+'</option>').join('');
const projectOptions=value=>options([['','Sin proyecto'],...arr('projects').map(x=>[x.id,x.title])],value||'');
const choices=[['favorite','favorites','Ideas guardadas'],['artwork','artworks','Obras creadas'],['board','boards','Tableros de inspiración']];
const field=(title,name,value='',attributes='')=>'<label class="mc-field"><span>'+escHtml(title)+'</span><input name="'+name+'" value="'+escHtml(value)+'" '+attributes+'></label>';
const sessionByIndex=index=>Number.isInteger(index)&&index>=0?arr('sessions')[index]:null;
const sessionArtwork=record=>record?.artworkId?arr('artworks').find(a=>a.id===record.artworkId):null;
const sessionType=record=>({challenge:'Reto creativo',writing:'Escritura creativa',drawing:'Ilustración',idea:'Ilustración'})[record?.type]||'Sesión creativa';
function sessionList(){
 const sessions=arr('sessions');
 if(!sessions.length)return '';
 return '<section class="mc-session-list-section" aria-labelledby="mc-sessions-heading">'+
   '<div class="mc-session-list-heading"><div><span class="mc-eyebrow">MUSA / ARCHIVO PERSONAL</span><h2 id="mc-sessions-heading">TUS SESIONES.</h2>'+
   '<p>Vuelve a tus ejercicios y edita lo que creaste, sin buscar en el calendario.</p></div><span class="mc-chip">'+sessions.length+' guardadas</span></div>'+
   '<details class="mc-session-history"><summary>Explorar sesiones anteriores <span aria-hidden="true">⌄</span></summary>'+
   '<div class="mc-session-history-items">'+sessions.map((record,index)=>'<article class="mc-session-history-item">'+
     '<div><span class="mc-eyebrow">'+escHtml(sessionType(record))+' · '+escHtml(dateLabel(fromTimestamp(record.createdAt)))+'</span>'+
     '<h3>'+escHtml(record.title||'Sesión sin título')+'</h3></div>'+
     '<div class="mc-session-history-actions"><button type="button" class="btn outline" onclick="MusaCreativeHub.openSession('+index+')">Ver sesión</button>'+
     '<button type="button" class="btn secondary" onclick="MusaCreativeHub.editSession('+index+')">Editar sesión ↗</button>'+ '<button type="button" class="mc-delete-link" onclick="MusaCreativeHub.requestDeleteSession('+index+')">Eliminar</button></div></article>').join('')+
   '</div></details></section>';
}

let selected=now(),month=selected.slice(0,7),modal=null;

function nav(active){
  return '<nav class="mc-tabs" aria-label="Mi espacio creativo">'+[
    ['estudio','Mi galería'],['proyectos','Proyectos'],['diario','Diario'],['calendario','Calendario']
  ].map(([route,label])=>'<button type="button" class="mc-tab'+(active===route?' is-active':'')+'" aria-current="'+(active===route?'page':'false')+'" onclick="go(\''+route+'\')">'+label+'</button>').join('')+'</nav>';
}
function heading(active){
  return '<div class="mc-hero"><div><span class="mc-eyebrow">MUSA / MI ESPACIO CREATIVO</span><h1>TODO EMPIEZA <em>CON UNA IDEA.</em></h1><p>Organiza tus proyectos, escribe tu proceso y descubre cuándo y cómo creas.</p></div><img src="/musa-asterisk.svg" aria-hidden="true" alt=""></div>'+nav(active);
}
function renderStudioLinks(){
  return heading('estudio')+'<div class="mc-quick-links">'+[
    ['proyectos','PROYECTOS',arr('projects').length,'Ideas conectadas, de principio a fin'],
    ['diario','DIARIO',arr('journalEntries').length,'Tu proceso merece ser recordado'],
    ['calendario','CALENDARIO',arr('calendarEvents').filter(e=>!e.completed).length,'Planea tu próxima exploración']
  ].map(([route,label,count,desc],i)=>'<button class="mc-quick mc-q'+i+'" type="button" onclick="go(\''+route+'\')"><span>'+label+' ↗</span><strong>'+count+'</strong><small>'+escHtml(desc)+'</small></button>').join('')+'</div>'+sessionList()+(modal?renderModal():'');
}
function blank(title,desc,button,action){
  return '<div class="mc-empty"><span class="mc-empty-symbol" aria-hidden="true">✳</span><h3>'+escHtml(title)+'</h3><p>'+escHtml(desc)+'</p><button class="btn secondary" type="button" onclick="'+action+'">'+escHtml(button)+' ↗</button></div>';
}
function projectStats(p){
  return '<span class="mc-chip">'+escHtml(p.discipline||'Arte')+'</span><span class="mc-chip mc-state-'+escHtml(p.status||'idea')+'">'+escHtml(states[p.status]||states.idea)+'</span>'+(p.dueDate?'<span class="mc-chip">Para '+escHtml(shortDate(p.dueDate))+'</span>':'');
}
function linkedCount(p){return Object.values(p.linked||{}).reduce((n,x)=>n+(Array.isArray(x)?x.length:0),0)}
function projects(){
  const items=arr('projects').slice().sort((a,b)=>String(b.updatedAt||'').localeCompare(a.updatedAt||''));
  return '<section class="mc-main"><div class="mc-heading"><div><span class="mc-eyebrow">01 / UN UNIVERSO DE IDEAS</span><h2>PROYECTOS CREATIVOS.</h2><p>Une en un solo lugar ideas, obras, tableros y notas.</p></div><button class="btn" type="button" onclick="MusaCreativeHub.newProject()">+ Nuevo proyecto ↗</button></div>'+
    '<div class="mc-numbers"><div><strong>'+items.length+'</strong><span>Proyectos</span></div><div><strong>'+items.filter(x=>x.status==='active').length+'</strong><span>En marcha</span></div><div><strong>'+items.filter(x=>x.status==='done').length+'</strong><span>Terminados</span></div></div>'+
    (items.length?'<div class="mc-project-grid">'+items.map(p=>'<article class="mc-project"><span class="mc-eyebrow">MUSA / PROYECTO</span><h3>'+escHtml(p.title)+'</h3><p>'+escHtml(p.description||'Una idea que espera su siguiente paso.')+'</p><div class="mc-chip-row">'+projectStats(p)+'</div><div class="mc-project-bottom"><small>'+linkedCount(p)+' elementos asociados</small><button type="button" class="mc-text-button" onclick="MusaCreativeHub.openProject('+param(p.id)+')">Ver proyecto ↗</button><button type="button" class="mc-delete-link" onclick="MusaCreativeHub.requestDeleteProject('+param(p.id)+')">Eliminar</button></div></article>').join('')+'</div>':
    blank('TU PRIMER PROYECTO EMPIEZA AQUÍ.','Dale un nombre a esa idea que no deja de rondarte.','Crear un proyecto','MusaCreativeHub.newProject()'))+'</section>';
}
function journal(){
  const entries=arr('journalEntries').slice().sort((a,b)=>String(b.date||'').localeCompare(a.date||'')||String(b.createdAt||'').localeCompare(a.createdAt||''));
  return '<section class="mc-main"><div class="mc-heading"><div><span class="mc-eyebrow">02 / LA HISTORIA DETRÁS DE CADA IDEA</span><h2>DIARIO CREATIVO.</h2><p>Registra avances, bloqueos, descubrimientos y pequeñas victorias. Tus notas son privadas.</p></div><button class="btn" type="button" onclick="MusaCreativeHub.newJournal()">+ Nueva entrada ↗</button></div>'+
    (entries.length?'<div class="mc-journal-list">'+entries.map(e=>'<article class="mc-journal"><div class="mc-journal-top"><span class="mc-eyebrow">'+escHtml(dateLabel(e.date))+'</span><button type="button" class="mc-text-button" onclick="MusaCreativeHub.editJournal('+param(e.id)+')">Editar ↗</button></div><h3>'+escHtml(e.title)+'</h3><p>'+escHtml(e.body)+'</p>'+(getProject(e.projectId)?'<span class="mc-chip">Proyecto: '+escHtml(getProject(e.projectId).title)+'</span>':'')+'</article>').join('')+'</div>':
    blank('HAY HISTORIAS QUE MERECEN QUEDARSE.','Anota lo que intentaste, descubriste o quieres explorar mañana.','Escribir una entrada','MusaCreativeHub.newJournal()'))+'</section>';
}
function activities(){
  const map=new Map();
  const add=(date,kind,title,extra={})=>{
    if(!parse(date))return;
    if(!map.has(date))map.set(date,[]);
    map.get(date).push({kind,title,...extra});
  };
  arr('calendarEvents').forEach(e=>add(e.date,'plan',e.title,{id:e.id,completed:e.completed,notes:e.notes}));
  arr('journalEntries').forEach(e=>add(e.date,'journal',e.title,{id:e.id}));
  arr('projects').forEach(p=>add(p.dueDate,'due',p.title,{id:p.id,completed:p.status==='done'}));
  arr('sessions').forEach((session,index)=>add(fromTimestamp(session.createdAt),'session',session.title,{index,id:session.id,artworkId:session.artworkId,elapsed:session.elapsed,type:session.type}));
  arr('artworks').forEach(a=>add(fromTimestamp(a.createdAt),'artwork',a.title,{id:a.id}));
  return map;
}
function calendar(){
  const first=parse(month+'-01')||parse(now().slice(0,7)+'-01');
  const y=first.getFullYear(),m=first.getMonth(),offset=(first.getDay()+6)%7,days=new Date(y,m+1,0).getDate();
  const activity=activities(),cells=Array.from({length:offset},()=>'<span aria-hidden="true"></span>');
  for(let i=1;i<=days;i++){
    const date=iso(new Date(y,m,i)),count=(activity.get(date)||[]).length;
    cells.push('<button class="mc-day'+(selected===date?' selected':'')+(date===now()?' today':'')+'" type="button" aria-pressed="'+(selected===date)+'" aria-label="'+escHtml(dateLabel(date))+'; '+count+' actividades" onclick="MusaCreativeHub.select('+param(date)+')"><span>'+i+'</span>'+(count?'<i aria-hidden="true"></i>':'')+'</button>');
  }
  const events=activity.get(selected)||[];
  const type={plan:'PLAN',journal:'DIARIO',due:'FECHA OBJETIVO',session:'SESIÓN REALIZADA',artwork:'OBRA GUARDADA'};
  const item=e=>'<article class="mc-calendar-entry"><div><span class="mc-eyebrow">'+type[e.kind]+'</span><h4>'+escHtml(e.title||'Sin título')+'</h4>'+(e.notes?'<p>'+escHtml(e.notes)+'</p>':'')+(e.completed?'<small class="mc-done">Completado</small>':'')+'</div><div class="mc-entry-actions">'+(e.kind==='plan'?'<button type="button" class="mc-text-button" onclick="MusaCreativeHub.toggleEvent('+param(e.id)+')">'+(e.completed?'Reabrir':'Completar')+'</button><button class="mc-text-button" type="button" onclick="MusaCreativeHub.editEvent('+param(e.id)+')">Editar</button>':e.kind==='journal'?'<button type="button" class="mc-text-button" onclick="MusaCreativeHub.editJournal('+param(e.id)+')">Abrir ↗</button>':e.kind==='due'?'<button type="button" class="mc-text-button" onclick="MusaCreativeHub.openProject('+param(e.id)+')">Ver proyecto ↗</button>':e.kind==='session'?'<button type="button" class="mc-text-button" onclick="MusaCreativeHub.openSession('+Number(e.index)+')">Ver sesión ↗</button><button type="button" class="mc-text-button" onclick="MusaCreativeHub.editSession('+Number(e.index)+')">Editar sesión ↗</button><button type="button" class="mc-delete-link" onclick="MusaCreativeHub.requestDeleteSession('+Number(e.index)+')">Eliminar</button>':e.kind==='artwork'&&e.id?'<button type="button" class="mc-text-button" onclick="MusaCreativeHub.viewArtwork('+param(e.id)+')">Ver obra ↗</button>':'')+'</div></article>';
  return '<section class="mc-main"><div class="mc-heading"><div><span class="mc-eyebrow">03 / CREA A TU RITMO</span><h2>CALENDARIO CREATIVO.</h2><p>Consulta tus sesiones y obras anteriores, lee tu diario y organiza tus próximos pasos en un solo lugar.</p></div><button class="btn" type="button" onclick="MusaCreativeHub.newEvent()">+ Planear actividad ↗</button></div>'+
    '<div class="mc-calendar-toolbar"><span>HISTORIAL Y ACTIVIDADES POR FECHA</span><button type="button" class="mc-text-button" onclick="MusaCreativeHub.today()">Ir a hoy ↗</button></div>'+
    '<div class="mc-calendar-layout"><div class="mc-calendar-sheet"><div class="mc-month"><button type="button" aria-label="Mes anterior" onclick="MusaCreativeHub.move(-1)">‹</button><h3>'+escHtml(first.toLocaleDateString('es-CO',{month:'long',year:'numeric'}))+'</h3><button type="button" aria-label="Mes siguiente" onclick="MusaCreativeHub.move(1)">›</button></div>'+
    '<div class="mc-calendar-grid mc-weekdays">'+['L','M','X','J','V','S','D'].map(d=>'<span>'+d+'</span>').join('')+'</div><div class="mc-calendar-grid">'+cells.join('')+'</div><p class="mc-legend"><i></i> Día con actividad · Selecciona una fecha</p></div>'+
    '<aside class="mc-day-panel"><span class="mc-eyebrow">HISTORIAL Y PLANES DEL DÍA</span><h3>'+escHtml(dateLabel(selected))+'</h3>'+(events.length?events.map(item).join(''):'<p class="mc-no-events">Un lienzo en blanco. ¿Qué te gustaría crear este día?</p>')+
    '<div class="mc-day-buttons"><button type="button" class="btn secondary" onclick="MusaCreativeHub.newEvent()">+ Planear</button><button type="button" class="btn outline" onclick="MusaCreativeHub.newJournal()">Escribir ↗</button></div></aside></div></section>';
}
function renderPage(page){return heading(page)+(page==='proyectos'?projects():page==='diario'?journal():calendar())+(modal?renderModal():'')}
function linkPicker(p){
  const sections=choices.map(([kind,key,title])=>{
    if(!arr(key).length)return '';
    return '<fieldset class="mc-linked"><legend>'+title+'</legend><div>'+arr(key).slice(0,80).map(item=>'<label><input type="checkbox" name="ref_'+kind+'" value="'+escHtml(item.id)+'"'+((p.linked?.[kind]||[]).includes(item.id)?' checked':'')+'><span>'+escHtml(item.title||item.name||'Elemento')+'</span></label>').join('')+'</div></fieldset>';
  }).filter(Boolean);
  return sections.length?'<details class="mc-picker"><summary>Conectar ideas, obras o tableros</summary>'+sections.join('')+'</details>':'<p class="mc-tip">Cuando tengas obras, ideas o tableros guardados podrás conectarlos a tu proyecto.</p>';
}
function projectDetail(p){
  const groups=choices.map(([kind,key,label])=>{
    const ids=Array.isArray(p.linked?.[kind])?p.linked[kind]:[];
    const items=arr(key).filter(item=>ids.includes(item.id));
    return items.length?'<div class="mc-detail-group"><h3>'+label+'</h3><div class="mc-detail-items">'+items.map(item=>'<span>'+escHtml(item.title||item.name||'Elemento')+'</span>').join('')+'</div></div>':'';
  }).join('');
  const notes=arr('journalEntries').filter(e=>e.projectId===p.id).slice(0,5);
  return '<div class="mc-chip-row">'+projectStats(p)+'</div><p class="mc-detail-description">'+escHtml(p.description||'Agrega una descripción para contar cómo nació este proyecto.')+'</p>'+groups+
    (notes.length?'<div class="mc-detail-group"><h3>Diario del proyecto</h3>'+notes.map(e=>'<div class="mc-detail-note"><strong>'+escHtml(e.title)+'</strong><small>'+escHtml(shortDate(e.date))+'</small></div>').join('')+'</div>':'')+
    '<div class="mc-modal-footer"><button type="button" class="btn outline" onclick="MusaCreativeHub.close()">Cerrar</button><button class="btn secondary" type="button" onclick="MusaCreativeHub.editProject('+param(p.id)+')">Editar proyecto ↗</button><button type="button" class="mc-delete-link mc-delete-modal-link" onclick="MusaCreativeHub.requestDeleteProject('+param(p.id)+')">Eliminar proyecto</button></div>';
}
function renderModal(){
  const kind=modal.kind,id=modal.id;
  let title='',body='';
  if(kind==='detail'){const p=getProject(id);if(!p)return '';title=p.title;body=projectDetail(p);}
  if(kind==='session'){
    const record=sessionByIndex(Number(id));
    if(!record)return '';
    const seconds=Number(record.elapsed);
    const duration=Number.isFinite(seconds)&&seconds>0?String(Math.floor(seconds/60)).padStart(2,'0')+':'+String(Math.floor(seconds%60)).padStart(2,'0'):'Sin tiempo registrado';
    const artwork=sessionArtwork(record);
    const note=artwork?.notes??record.notes??'';
    title='ASÍ FUE TU SESIÓN.';
    body='<div class="mc-session-summary"><span class="mc-eyebrow">'+escHtml(sessionType(record))+'</span>'+
      '<h3>'+escHtml(record.title||'Sesión sin título')+'</h3>'+
      '<p><strong>Fecha:</strong> '+escHtml(dateLabel(fromTimestamp(record.createdAt)))+'</p>'+
      '<p><strong>Tiempo de exploración:</strong> '+escHtml(duration)+'</p>'+
      (note?'<div class="mc-session-note"><strong>'+(record.type==='writing'?'Tu escritura':'Tu creación o reflexión')+'</strong><p>'+escHtml(note)+'</p></div>':'')+
      '</div><div class="mc-modal-footer"><button class="btn outline" type="button" onclick="MusaCreativeHub.close()">Cerrar</button>'+
      (artwork?'<button class="btn outline" type="button" onclick="MusaCreativeHub.viewArtwork('+param(artwork.id)+')">Ver obra creada ↗</button>':'')+
      '<button class="btn secondary" type="button" onclick="MusaCreativeHub.editSession('+Number(id)+')">Editar sesión ↗</button><button type="button" class="mc-delete-link mc-delete-modal-link" onclick="MusaCreativeHub.requestDeleteSession('+Number(id)+')">Eliminar sesión</button></div>';
  }
  if(kind==='session-edit'){
    const record=sessionByIndex(Number(id));
    if(!record)return '';
    const artwork=sessionArtwork(record);
    title='EDITAR ESTA SESIÓN.';
    body='<form id="mc-edit" onsubmit="MusaCreativeHub.saveSession(event)">'+
      '<div class="mc-session-edit-hint"><span class="mc-eyebrow">'+escHtml(sessionType(record))+' · '+escHtml(dateLabel(fromTimestamp(record.createdAt)))+'</span>'+
      '<p>Actualiza esta sesión sin crear otra. La fecha, la duración y la imagen original se conservarán.</p></div>'+
      field('Título de la sesión *','title',record.title||artwork?.title||'','required maxlength="130"')+
      '<label class="mc-field"><span>'+(record.type==='writing'?'Tu texto creativo':'Tu creación o reflexión')+'</span>'+
      '<textarea name="notes" rows="7" maxlength="50000" placeholder="Lo que creaste, aprendiste o quieres recordar…">'+escHtml(artwork?.notes??record.notes??'')+'</textarea></label>'+
      (artwork?.imagePath||artwork?.image?'<p class="mc-tip">La fotografía asociada permanece guardada en Mi galería.</p>':'')+
      '<div class="mc-modal-footer"><button type="button" class="mc-delete-link mc-delete-modal-link" onclick="MusaCreativeHub.requestDeleteSession('+Number(id)+')">Eliminar sesión</button><button type="button" class="btn outline" onclick="MusaCreativeHub.openSession('+Number(id)+')">Cancelar</button>'+
      '<button type="submit" class="btn secondary">Guardar cambios ↗</button></div></form>';
  }
  if(kind==='delete'){
    const target=modal.target;
    const original=target==='session'?sessionByIndex(Number(id)):getProject(id);
    if(!original)return '';
    const isSession=target==='session',artwork=isSession?sessionArtwork(original):null;
    const journalCount=isSession?0:arr('journalEntries').filter(x=>x.projectId===id).length;
    const eventCount=isSession?0:arr('calendarEvents').filter(x=>x.projectId===id).length;
    title=isSession?'¿ELIMINAR ESTA SESIÓN?':'¿ELIMINAR ESTE PROYECTO?';
    body='<div class="mc-delete-warning" role="alert"><span class="mc-eyebrow">ACCIÓN IRREVERSIBLE</span>'+
      '<h3>«'+escHtml(original.title||'Sin título')+'»</h3>'+
      '<p>'+(isSession?
       'Se borrará el registro de esta sesión del calendario y de tu historial. '+(artwork?'La obra y su fotografía seguirán en Mi galería.':'No se borrarán otras creaciones de tu estudio.') :
       'Se eliminará el proyecto de tu listado. Las obras, ideas y tableros vinculados se conservarán. '+
       (journalCount||eventCount?'Las '+journalCount+' entradas del diario y '+eventCount+' actividades asociadas permanecerán guardadas, sin proyecto vinculado.':'Tus notas y actividades no se eliminarán.')
      )+'</p><p class="mc-delete-final">Esta acción no se puede deshacer.</p></div>'+
      '<div class="mc-modal-footer mc-delete-actions"><button type="button" class="btn outline" onclick="MusaCreativeHub.cancelDelete()">Cancelar</button>'+
      '<button type="button" class="btn mc-confirm-delete" onclick="MusaCreativeHub.confirmDelete()">Sí, eliminar '+(isSession?'sesión':'proyecto')+'</button></div>';
  }
  if(kind==='project'){
    const p=getProject(id)||{};
    title=id?'EDITAR MI PROYECTO.':'UNA NUEVA IDEA EMPIEZA AQUÍ.';
    body='<form id="mc-edit" onsubmit="MusaCreativeHub.saveProject(event)">'+field('Nombre del proyecto *','title',p.title,'required maxlength="110" placeholder="Mi proyecto creativo"')+
      '<label class="mc-field"><span>Descripción</span><textarea name="description" maxlength="1200" rows="4" placeholder="¿Qué quieres experimentar?">'+escHtml(p.description||'')+'</textarea></label>'+
      '<div class="mc-form-columns"><label class="mc-field"><span>Disciplina</span><select name="discipline">'+options(disciplines.map(x=>[x,x]),p.discipline||'Arte')+'</select></label><label class="mc-field"><span>Estado</span><select name="status">'+options(Object.entries(states),p.status||'idea')+'</select></label></div>'+
      field('Fecha objetivo (opcional)','dueDate',p.dueDate,'type="date"')+linkPicker(p)+
      '<div class="mc-modal-footer">'+(id?'<button type="button" class="mc-remove" onclick="MusaCreativeHub.requestDeleteProject('+param(id)+')">Eliminar proyecto</button>':'')+'<button class="btn secondary" type="submit">Guardar proyecto ↗</button></div></form>';
  }
  if(kind==='journal'){
    const e=arr('journalEntries').find(x=>x.id===id)||{};
    title=id?'EDITAR MI DIARIO.':'UNA IDEA MERECE SER ESCRITA.';
    body='<form id="mc-edit" onsubmit="MusaCreativeHub.saveJournal(event)">'+field('Fecha *','date',e.date||selected,'type="date" required')+
      field('Título *','title',e.title,'required maxlength="130" placeholder="Lo que descubrí hoy"')+
      '<label class="mc-field"><span>Tu proceso creativo *</span><textarea name="body" rows="7" required maxlength="10000" placeholder="Una idea, un aprendizaje, una reflexión…">'+escHtml(e.body||'')+'</textarea></label>'+
      '<label class="mc-field"><span>Proyecto relacionado</span><select name="projectId">'+projectOptions(e.projectId)+'</select></label>'+
      '<div class="mc-modal-footer">'+(id?'<button type="button" class="mc-remove" onclick="MusaCreativeHub.removeJournal('+param(id)+')">Eliminar</button>':'')+'<button class="btn secondary" type="submit">Guardar entrada ↗</button></div></form>';
  }
  if(kind==='event'){
    const e=arr('calendarEvents').find(x=>x.id===id)||{};
    title=id?'EDITAR ESTA ACTIVIDAD.':'RESERVA TIEMPO PARA CREAR.';
    body='<form id="mc-edit" onsubmit="MusaCreativeHub.saveEvent(event)">'+field('Fecha *','date',e.date||selected,'type="date" required')+
      field('Actividad *','title',e.title,'required maxlength="130" placeholder="Explorar colores y formas"')+
      '<label class="mc-field"><span>Notas</span><textarea name="notes" maxlength="1800" rows="4" placeholder="Materiales, ideas u objetivos…">'+escHtml(e.notes||'')+'</textarea></label>'+
      '<label class="mc-field"><span>Proyecto relacionado</span><select name="projectId">'+projectOptions(e.projectId)+'</select></label>'+
      '<div class="mc-modal-footer">'+(id?'<button type="button" class="mc-remove" onclick="MusaCreativeHub.removeEvent('+param(id)+')">Eliminar</button>':'')+'<button class="btn secondary" type="submit">Guardar actividad ↗</button></div></form>';
  }
  return '<div class="mc-backdrop" onclick="MusaCreativeHub.close()" role="presentation"><div class="mc-dialog" role="'+(kind==='delete'?'alertdialog':'dialog')+'" aria-modal="true" aria-labelledby="mc-modal-title" onclick="event.stopPropagation()"><div class="mc-dialog-header"><div><span class="mc-eyebrow">MUSA / '+(kind==='delete'?(modal.target==='project'?'PROYECTOS':'SESIONES'):kind==='project'||kind==='detail'?'PROYECTOS':kind==='journal'?'DIARIO':'CALENDARIO')+'</span><h2 id="mc-modal-title">'+escHtml(title)+'</h2></div><button type="button" class="mc-close" aria-label="Cerrar" onclick="MusaCreativeHub.close()">×</button></div>'+body+'</div></div>';
}
function open(kind,id=null){if(!window.MusaAuth?.isAuthenticated())return;modal={kind,id};render();document.getElementById('mc-modal-title')?.focus?.();}
function close(){modal=null;render();}
function openSession(index){
  if(!sessionByIndex(index))return;
  open('session',index);
}
function editSession(index){
  if(!sessionByIndex(index))return;
  open('session-edit',index);
}
function requestDelete(target,id){
 if(!window.MusaAuth?.isAuthenticated()||!['session','project'].includes(target))return;
 const record=target==='session'?sessionByIndex(id):getProject(id);
 if(!record)return;
 modal={kind:'delete',target,id,expected:record,previous:modal?{kind:modal.kind,id:modal.id}:null};
 render();
 document.querySelector?.('.mc-confirm-delete')?.focus?.();
}
function cancelDelete(){
 if(modal?.kind!=='delete')return;
 modal=modal.previous||null;
 render();
}
function confirmDelete(){
 if(!window.MusaAuth?.isAuthenticated()||modal?.kind!=='delete')return;
 const {target,id,expected}=modal;
 // A delayed click cannot delete another record if the workspace has changed.
 const current=target==='session'?sessionByIndex(id):getProject(id);
 if(!current||current!==expected)return cancelDelete();
 const backup={
  sessions:data.sessions,projects:data.projects,
  journalEntries:arr('journalEntries').map(x=>({...x})),
  calendarEvents:arr('calendarEvents').map(x=>({...x}))
 };
 if(target==='session'){
  // Artwork and its uploaded image remain independent assets in My Gallery.
  data.sessions=arr('sessions').filter((x,i)=>i!==id);
 }else if(target==='project'){
  data.projects=arr('projects').filter(x=>x.id!==id);
  arr('journalEntries').forEach(x=>{if(x.projectId===id)x.projectId='';});
  arr('calendarEvents').forEach(x=>{if(x.projectId===id)x.projectId='';});
 }else return;
 try{
  if(!save())throw Error('Could not queue workspace save');
 }catch(e){
  data.sessions=backup.sessions;
  data.projects=backup.projects;
  data.journalEntries=backup.journalEntries;
  data.calendarEvents=backup.calendarEvents;
  modal=null;render();
  toast('No pudimos eliminar el elemento. Inténtalo nuevamente.');
  return;
 }
 modal=null;
 render();
 toast(target==='session'?'Sesión eliminada. Tus obras siguen guardadas.':'Proyecto eliminado. Tus elementos vinculados se conservaron.');
}
function saveSession(event){
  event.preventDefault();
  if(!window.MusaAuth?.isAuthenticated()||modal?.kind!=='session-edit')return;
  const index=Number(modal.id),record=sessionByIndex(index);
  if(!record)return;
  const form=event.currentTarget;
  const title=getInput(form,'title').trim().slice(0,130);
  const notes=getInput(form,'notes').trim().slice(0,50000);
  if(!title){toast('Escribe un título para guardar la sesión.');return;}
  // One-to-one update: never create a duplicate session or replace its image.
  record.title=title;
  record.notes=notes;
  record.updatedAt=new Date().toISOString();
  const artwork=sessionArtwork(record);
  if(artwork){
    artwork.title=title;
    artwork.notes=notes;
    artwork.updatedAt=record.updatedAt;
  }
  modal={kind:'session',id:index};
  save();render();toast('Sesión actualizada. Sincronizando…');
}
function viewArtwork(id){
  if(!window.MusaAuth?.isAuthenticated()||!arr('artworks').some(art=>art.id===id))return;
  modal=null;
  openArt(id,'calendario');
}

function saveProject(event){
  event.preventDefault();if(!window.MusaAuth?.isAuthenticated())return;
  const f=event.currentTarget,t=getInput(f,'title').trim().slice(0,110),date=getInput(f,'dueDate');
  if(!t||date&&!parse(date)){toast('Revisa el nombre y la fecha.');return;}
  const old=getProject(modal?.id),time=new Date().toISOString(),discipline=getInput(f,'discipline'),status=getInput(f,'status'),linked={};
  choices.forEach(([kind])=>{linked[kind]=Array.from(f.querySelectorAll('[name="ref_'+kind+'"]:checked')).map(e=>e.value).slice(0,80)});
  const entry={id:old?.id||crypto.randomUUID(),title:t,description:getInput(f,'description').trim().slice(0,1200),discipline:disciplines.includes(discipline)?discipline:'Otro',status:states[status]?status:'idea',dueDate:date||'',linked,createdAt:old?.createdAt||time,updatedAt:time};
  if(old)Object.assign(old,entry);else arr('projects').unshift(entry);
  modal=null;save();render();toast('Proyecto guardado.');
}
function saveJournal(event){
  event.preventDefault();if(!window.MusaAuth?.isAuthenticated())return;
  const f=event.currentTarget,date=getInput(f,'date'),title=getInput(f,'title').trim().slice(0,130),body=getInput(f,'body').trim().slice(0,10000);
  if(!parse(date)||!title||!body){toast('Completa la fecha, el título y el texto.');return;}
  const old=arr('journalEntries').find(x=>x.id===modal?.id),time=new Date().toISOString(),ref=getInput(f,'projectId');
  const entry={id:old?.id||crypto.randomUUID(),date,title,body,projectId:getProject(ref)?ref:'',createdAt:old?.createdAt||time,updatedAt:time};
  if(old)Object.assign(old,entry);else arr('journalEntries').unshift(entry);
  selected=date;month=date.slice(0,7);modal=null;save();render();toast('Entrada guardada.');
}
function saveEvent(event){
  event.preventDefault();if(!window.MusaAuth?.isAuthenticated())return;
  const f=event.currentTarget,date=getInput(f,'date'),title=getInput(f,'title').trim().slice(0,130);
  if(!parse(date)||!title){toast('Completa la fecha y el título.');return;}
  const old=arr('calendarEvents').find(x=>x.id===modal?.id),time=new Date().toISOString(),ref=getInput(f,'projectId');
  const entry={id:old?.id||crypto.randomUUID(),date,title,notes:getInput(f,'notes').trim().slice(0,1800),projectId:getProject(ref)?ref:'',completed:old?.completed||false,createdAt:old?.createdAt||time,updatedAt:time};
  if(old)Object.assign(old,entry);else arr('calendarEvents').unshift(entry);
  selected=date;month=date.slice(0,7);modal=null;save();render();toast('Actividad guardada.');
}
function remove(key,id){
  if(!window.MusaAuth?.isAuthenticated()||!confirm('¿Eliminar este elemento? Esta acción no se puede deshacer.'))return;
  const collection={project:'projects',journal:'journalEntries',event:'calendarEvents'}[key];
  if(!collection||!arr(collection).some(x=>x.id===id))return;
  data[collection]=arr(collection).filter(x=>x.id!==id);
  if(key==='project'){
    arr('journalEntries').forEach(x=>{if(x.projectId===id)x.projectId=''});
    arr('calendarEvents').forEach(x=>{if(x.projectId===id)x.projectId=''});
  }
  modal=null;save();render();
}
function toggleEvent(id){
  if(!window.MusaAuth?.isAuthenticated())return;
  const e=arr('calendarEvents').find(x=>x.id===id);if(!e)return;
  e.completed=!e.completed;e.updatedAt=new Date().toISOString();save();render();
}
function select(date){if(!parse(date))return;selected=date;month=date.slice(0,7);render();}
function move(offset){const dt=parse(month+'-01');if(!dt)return;const next=new Date(dt.getFullYear(),dt.getMonth()+offset,1);selected=iso(next);month=selected.slice(0,7);render();}
function today(){selected=now();month=selected.slice(0,7);render();}
function reset(){modal=null;selected=now();month=selected.slice(0,7);}
document.addEventListener?.('keydown',e=>{if(e.key==='Escape'&&modal){e.preventDefault();close();}});
window.MusaCreativeHub={renderPage,renderStudioLinks,reset,close,newProject:()=>open('project'),editProject:id=>open('project',id),openProject:id=>open('detail',id),newJournal:()=>open('journal'),editJournal:id=>open('journal',id),newEvent:()=>open('event'),editEvent:id=>open('event',id),openSession,editSession,viewArtwork,saveSession,requestDeleteSession:id=>requestDelete('session',id),requestDeleteProject:id=>requestDelete('project',id),cancelDelete,confirmDelete,saveProject,saveJournal,saveEvent,removeProject:id=>requestDelete('project',id),removeJournal:id=>remove('journal',id),removeEvent:id=>remove('event',id),toggleEvent,select,move,today};
})();
