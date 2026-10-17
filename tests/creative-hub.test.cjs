'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const root=path.resolve(__dirname,'..');
const hub=fs.readFileSync(path.join(root,'public/creative-hub.js'),'utf8');
const auth=fs.readFileSync(path.join(root,'public/auth.js'),'utf8');
const index=fs.readFileSync(path.join(root,'index.html'),'utf8');
const css=fs.readFileSync(path.join(root,'public/creative-hub.css'),'utf8');
const empty=()=>({favorites:[],boards:[],artworks:[],sessions:[],projects:[],journalEntries:[],calendarEvents:[]});
const escapes=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function createHarness(){
  let counter=0,saved=0,rendered='',authenticated=true,opened=null;
  let records=empty();
  const notification=[];
  const win={MusaAuth:{isAuthenticated:()=>authenticated}};
  const context=vm.createContext({
    window:win,data:records,esc:escapes,crypto:{randomUUID:()=>('uuid-'+(++counter))},
    document:{addEventListener(){},getElementById(){return null}},
    render(){rendered=win.MusaCreativeHub.renderPage('proyectos')},
    openArt(id,origin){opened={id,origin}},
    save(){saved++;return true},toast(msg){notification.push(msg)},confirm(){return true},
    Date,Set,Array
  });
  vm.runInContext(hub,context,{filename:'creative-hub.js'});
  const fields=(values,checkboxes={})=>({
    querySelector(sel){
      const name=sel.match(/^\[name="([^"]+)"\]$/)?.[1];
      return name?{value:values[name]||''}:null;
    },
    querySelectorAll(sel){
      const name=sel.match(/^\[name="([^"]+)"\]:checked$/)?.[1];
      return (checkboxes[name]||[]).map(value=>({value}));
    }
  });
  const submit=(kind,values,checkboxes)=>{
    win.MusaCreativeHub[kind]({preventDefault(){},currentTarget:fields(values,checkboxes)});
  };
  return{win,context,submit,get data(){return records},get saved(){return saved},
    get screen(){return rendered},get opened(){return opened},notifications:notification,setAccount(next){records=next;context.data=next;win.MusaCreativeHub.reset()},
    setAuthenticated(v){authenticated=v}
  };
}
test('three functions load from the current MUSA application and stay within protected account document',()=>{
  assert.match(index,/creative-hub\.js/);
  assert.match(index,/creative-hub\.css/);
  assert.match(index,/\['proyectos','diario','calendario'\]\.includes\(page\)/);
  assert.match(auth,/projects:\[\],journalEntries:\[\],calendarEvents:\[\]/);
  assert.match(auth,/'projects','journalEntries','calendarEvents'/);
  assert.match(css,/@media\(max-width:600px\)/);
});
test('creative project can be created, linked to existing saved ideas/artwork/boards and edited',()=>{
  const h=createHarness();
  h.data.favorites.push({id:'idea-1',title:'Arte cinético'});
  h.data.artworks.push({id:'art-1',title:'Boceto original',createdAt:'2026-10-15T12:00:00Z'});
  h.data.boards.push({id:'board-1',name:'Mi inspiración'});
  h.win.MusaCreativeHub.newProject();
  assert.match(h.screen,/UNA NUEVA IDEA EMPIEZA AQUÍ/);
  assert.match(h.screen,/Arte cinético/);
  h.submit('saveProject',{
    title:'Explorar tipografías',description:'Mi primer proyecto privado',discipline:'Diseño',status:'active',dueDate:'2026-10-25'
  },{'ref_favorite':['idea-1'],'ref_artwork':['art-1'],'ref_board':['board-1']});
  assert.equal(h.data.projects.length,1);
  const project=h.data.projects[0];
  assert.equal(project.status,'active');
  assert.equal(project.linked.favorite[0],'idea-1');
  assert.equal(project.linked.artwork[0],'art-1');
  assert.equal(project.linked.board[0],'board-1');
  assert.ok(h.saved>0);
  h.win.MusaCreativeHub.openProject(project.id);
  assert.match(h.screen,/Mi primer proyecto privado/);
  assert.match(h.screen,/Arte cinético/);
  assert.match(h.screen,/Mi inspiración/);
  h.win.MusaCreativeHub.editProject(project.id);
  h.submit('saveProject',{title:'Proyecto revisado',description:'Nuevo texto',discipline:'Arte',status:'done',dueDate:''});
  assert.equal(h.data.projects[0].title,'Proyecto revisado');
  assert.equal(h.data.projects[0].status,'done');
});
test('journal and calendar connect to an existing project, and activity is grouped by day',()=>{
  const h=createHarness();
  h.win.MusaCreativeHub.newProject();
  h.submit('saveProject',{title:'Collage editorial',discipline:'Arte',status:'active',dueDate:'2026-11-04'});
  const id=h.data.projects[0].id;
  h.win.MusaCreativeHub.newJournal();
  h.submit('saveJournal',{date:'2026-11-02',title:'Primeros trazos',body:'Probé papel y texturas.',projectId:id});
  h.win.MusaCreativeHub.newEvent();
  h.submit('saveEvent',{date:'2026-11-02',title:'Probar recortes',notes:'Buscar hojas usadas',projectId:id});
  assert.equal(h.data.journalEntries.length,1);
  assert.equal(h.data.calendarEvents.length,1);
  assert.equal(h.data.journalEntries[0].projectId,id);
  h.win.MusaCreativeHub.select('2026-11-02');
  const c=h.win.MusaCreativeHub.renderPage('calendario');
  assert.match(c,/noviembre de 2026/i);
  assert.match(c,/Primeros trazos/);
  assert.match(c,/Probar recortes/);
  assert.match(c,/Día con actividad/);
  h.win.MusaCreativeHub.toggleEvent(h.data.calendarEvents[0].id);
  assert.equal(h.data.calendarEvents[0].completed,true);
  h.win.MusaCreativeHub.select('2026-11-04');
  assert.match(h.win.MusaCreativeHub.renderPage('calendario'),/Collage editorial/);
  assert.match(h.win.MusaCreativeHub.renderPage('diario'),/Probé papel y texturas/);
});
test('account switching hides old projects and prevents unauthenticated modifications',()=>{
  const h=createHarness();
  h.win.MusaCreativeHub.newProject();
  h.submit('saveProject',{title:'Creación privada de A',status:'active'});
  assert.equal(h.data.projects.length,1);
  const previousSaves=h.saved;
  h.setAccount(empty());
  assert.equal(h.data.projects.length,0);
  assert.doesNotMatch(h.win.MusaCreativeHub.renderPage('proyectos'),/Creación privada de A/);
  h.setAuthenticated(false);
  h.win.MusaCreativeHub.newProject();
  h.submit('saveProject',{title:'No permitido'});
  assert.equal(h.data.projects.length,0);
  assert.equal(h.saved,previousSaves);
});
test('editing and deleting a linked project preserves journal and event content',()=>{
  const h=createHarness();
  h.win.MusaCreativeHub.newProject();
  h.submit('saveProject',{title:'Proyecto borrable'});
  const id=h.data.projects[0].id;
  h.win.MusaCreativeHub.newJournal();
  h.submit('saveJournal',{date:'2026-10-16',title:'Entrada persistente',body:'Mi aprendizaje',projectId:id});
  h.win.MusaCreativeHub.newEvent();
  h.submit('saveEvent',{date:'2026-10-16',title:'Actividad persistente',projectId:id});
  h.win.MusaCreativeHub.removeProject(id);
  assert.equal(h.data.projects.length,0);
  assert.equal(h.data.journalEntries.length,1);
  assert.equal(h.data.calendarEvents.length,1);
  assert.equal(h.data.journalEntries[0].projectId,'');
  assert.equal(h.data.calendarEvents[0].projectId,'');
});
test('user input is HTML escaped rather than interpreted as markup',()=>{
  const h=createHarness();
  h.win.MusaCreativeHub.newProject();
  h.submit('saveProject',{title:'<img src=x onerror=alert(1)>',description:'<script>not allowed</script>'});
  const output=h.win.MusaCreativeHub.renderPage('proyectos');
  assert.doesNotMatch(output,/<script>not allowed<\/script>/);
  assert.match(output,/&lt;script&gt;/);
  assert.match(output,/&lt;img/);
});

test('main navigation has three destinations and no redundant Activity page',()=>{
  assert.match(index,/const items=\[\['inicio','Inicio'\],\['explorar','Explorar'\],\['estudio','Mi estudio'\]\]/);
  assert.doesNotMatch(index,/\['actividad','Actividad'\]/);
  assert.doesNotMatch(index,/else if\(page==='actividad'\)/);
  assert.doesNotMatch(index,/Sesiones completadas|Ver actividad →/,'Remove empty statistics cards and obsolete CTA from Inicio');
  assert.match(index,/01 \/ 03/);
  assert.match(index,/p==='actividad'\?'calendario':p/,'legacy Activity requests should open calendar');
  assert.match(index,/go\(window\.musaArtworkReturn/,'return link keeps original calendar context');
  assert.match(auth,/sessions:\[\]/,'prior sessions remain part of per-user workspace');
});
test('calendar shows historical sessions and artworks as actionable entries, keeping all saved data',()=>{
  const h=createHarness();
  h.data.sessions.push({id:'s-100',title:'¿Cómo se vería la alegría sin rostros?',type:'drawing',elapsed:125,createdAt:'2026-10-15T14:00:00Z',artworkId:'art-100'});
  h.data.artworks.push({id:'art-100',title:'Mi alegría abstracta',createdAt:'2026-10-15T14:00:00Z'});
  h.win.MusaCreativeHub.select('2026-10-15');
  const html=h.win.MusaCreativeHub.renderPage('calendario');
  assert.match(html,/SESIÓN REALIZADA/);
  assert.match(html,/OBRA GUARDADA/);
  assert.match(html,/Ver sesión ↗/);
  assert.match(html,/Ver obra ↗/);
  assert.match(html,/Mi alegría abstracta/);
  assert.doesNotMatch(html,/class="mc-cal-stats"/,'obsolete decorative stats should be absent');
  const beforeSaves=h.saved;
  h.win.MusaCreativeHub.openSession(0);
  assert.match(h.screen,/ASÍ FUE TU SESIÓN/);
  assert.match(h.screen,/02:05/,'show actual elapsed time in session details');
  assert.match(h.screen,/Ver obra creada/);
  h.win.MusaCreativeHub.viewArtwork('art-100');
  assert.equal(h.opened.id,'art-100');
  assert.equal(h.opened.origin,'calendario');
  assert.equal(h.data.sessions.length,1);
  assert.equal(h.data.artworks.length,1);
  assert.equal(h.saved,beforeSaves,'viewing history must not mutate or resave user data');
});
test('older zero-length sessions have an honest detail view and do not imply a linked artwork',()=>{
  const h=createHarness();
  h.data.sessions.push({id:'s-legacy',title:'Boceto antiguo',type:'challenge',elapsed:0,createdAt:'2026-10-15T14:00:00Z'});
  h.win.MusaCreativeHub.select('2026-10-15');
  assert.match(h.win.MusaCreativeHub.renderPage('calendario'),/Boceto antiguo/);
  h.win.MusaCreativeHub.openSession(0);
  assert.match(h.screen,/Sin tiempo registrado/);
  assert.doesNotMatch(h.screen,/Ver obra creada/);
  h.win.MusaCreativeHub.viewArtwork('not-found');
  assert.equal(h.opened,null,'missing artwork cannot navigate');
});

test('Mi estudio counts saved creative sessions separately from projects and explains why',()=>{
  const h=createHarness();
  h.data.sessions.push({id:'writing-1',type:'writing',title:'Un poema',createdAt:'2026-10-16T18:00:00Z'});
  const markup=h.win.MusaCreativeHub.renderStudioLinks();
  assert.equal((markup.match(/class="mc-quick mc-q/g)||[]).length,4,'Four quick access cards');
  assert.match(markup,/SESIONES: 1/,'One saved session must be counted');
  assert.match(markup,/PROYECTOS: 0/,'No project is automatically created');
  assert.match(markup,/¿SESIÓN O PROYECTO\?/);
  assert.match(markup,/Hacer una sesión no crea un proyecto automáticamente/);
  assert.match(markup,/onclick="go\('calendario'\)"/,'Sessions open their history in the calendar');
});
