/* MUSA private accounts — Supabase Auth + per-user RLS workspace */
(function(){
'use strict';
const REMEMBER_KEY='musa-remember-v1';
const AUTH_KEY='musa-auth-v1';
const LEGACY_KEY='musa-v1';
const REDIRECT_PATH='/auth/callback';
const routeModes={'/login':'login','/signup':'signup','/auth/check-email':'verify','/auth/callback':'callback','/auth/success':'success','/auth/error':'confirmation-error','/auth/recover':'recover','/auth/reset':'reset','/auth/reset-success':'reset-success'};
const modeRoutes={login:'/login',signup:'/signup',verify:'/auth/check-email',callback:'/auth/callback',success:'/auth/success','confirmation-error':'/auth/error',recover:'/auth/recover',reset:'/auth/reset','reset-success':'/auth/reset-success'};
function routeMode(){return routeModes[location.pathname||'/']||'login'}
function updateRoute(next,replace=false){
  const target=modeRoutes[next];
  if(target&&location.pathname!==target){
    const action=replace?'replaceState':'pushState';
    window.history?.[action]?.({},'',target);
  }
}

let remember=localStorage.getItem(REMEMBER_KEY)!=='0';
let client=null,user=null,loaded=false,mode='login',notice='',problem='',busy=false,loadToken=0,saveTimer=null,saveChain=Promise.resolve(),saveError='';
const images=new Map();
const blank=()=>({favorites:[],artworks:[],sessions:[],references:[],searches:[],savedChallenges:[],acceptedChallenges:[],boards:[],projects:[],journalEntries:[],calendarEvents:[],active:null});
const clean=raw=>{
  const source=raw&&typeof raw==='object'?raw:{};
  const result=blank();
  for(const key of ['favorites','artworks','sessions','references','searches','savedChallenges','acceptedChallenges','boards','projects','journalEntries','calendarEvents'])
    result[key]=Array.isArray(source[key])?source[key]:[];
  result.active=source.active&&typeof source.active==='object'?source.active:null;
  return result;
};
const html=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;','>':'&gt;',"'":'&#39;'}[c]));
const storage={
  getItem(k){return remember?localStorage.getItem(k):sessionStorage.getItem(k)},
  setItem(k,v){if(remember){sessionStorage.removeItem(k);localStorage.setItem(k,v)}else{localStorage.removeItem(k);sessionStorage.setItem(k,v)}},
  removeItem(k){localStorage.removeItem(k);sessionStorage.removeItem(k)}
};
function rememberChoice(enabled){
  remember=Boolean(enabled);
  localStorage.setItem(REMEMBER_KEY,remember?'1':'0');
  // Supabase writes the next session into the chosen storage when logging in.
  if(!remember)localStorage.removeItem(AUTH_KEY);
  else sessionStorage.removeItem(AUTH_KEY);
}
function legacyData(){
  try{
    const raw=JSON.parse(localStorage.getItem(LEGACY_KEY)||'null');
    if(!raw||typeof raw!=='object')return null;
    const doc=clean(raw);
    return doc.favorites.length||doc.artworks.length||doc.sessions.length||doc.references.length||doc.savedChallenges.length||doc.acceptedChallenges.length||doc.boards.length||doc.projects.length||doc.journalEntries.length||doc.calendarEvents.length||doc.active?doc:null;
  }catch{return null}
}
function renderGate(){
  document.body?.classList?.add?.('auth-locked');
  const nav=document.getElementById('nav');if(nav)nav.innerHTML='';
  const mobile=document.getElementById('mobile-menu');if(mobile){mobile.innerHTML='';mobile.hidden=true;}
  const toggle=document.getElementById('mobile-menu-toggle');toggle?.setAttribute?.('aria-expanded','false');
  const account=document.getElementById('account-menu');
  if(account)account.innerHTML='';
  let title='',subtitle='',form='',foot='';
  if(mode==='loading'){
    title='PREPARANDO TU ESPACIO.';subtitle='Conectando tu laboratorio creativo de forma segura…';
    form='<p class="auth-message" role="status">Un momento, estamos cargando tu estudio.</p>';
  } else if(mode==='callback'){
    title='CONFIRMANDO TU CUENTA…';subtitle='Estamos verificando el enlace y preparando tu acceso.';
    form='<p class="auth-message" role="status">Un momento, estamos comprobando tu correo con Supabase.</p>';
  } else if(mode==='success'){
    title='TU CUENTA YA ESTÁ LISTA.';subtitle='Tu correo fue confirmado correctamente. ¡Ya puedes crear sin límites!';
    form='<button class="btn secondary auth-submit" type="button" onclick="MusaAuth.enter(\'inicio\')">Entrar a mi estudio ↗</button><button class="auth-link" type="button" onclick="MusaAuth.enter(\'explorar\')">Explorar MUSA →</button>';
  } else if(mode==='confirmation-error'){
    title='NO PUDIMOS CONFIRMAR TU CUENTA.';subtitle='El enlace puede haber expirado o no es válido. Puedes solicitar uno nuevo.';
    form='<form onsubmit="MusaAuth.resend(event)"><div class="field"><label for="auth-email">Correo para reenviar confirmación</label><input id="auth-email" type="email" autocomplete="email" required placeholder="tu@email.com" value="'+html(sessionStorage.getItem('musa-pending-email')||'')+'"></div><button class="btn secondary auth-submit" type="submit">Reenviar confirmación ↗</button><p id="auth-submit-status" class="auth-small" role="status" aria-live="polite"></p></form>';
    foot='<button class="auth-link" type="button" onclick="MusaAuth.show(\'login\')">← Volver al acceso</button>';
  } else if(mode==='reset-success'){
    title='CONTRASEÑA ACTUALIZADA.';subtitle='Ya puedes iniciar sesión con tu nueva contraseña.';
    form='<button class="btn secondary auth-submit" type="button" onclick="MusaAuth.show(\'login\')">Iniciar sesión ↗</button>';
  } else if(mode==='error'){
    title='NO PUDIMOS CONECTAR.';subtitle='Las cuentas de MUSA no están disponibles por el momento.';
    form='<p class="auth-error" role="alert">'+html(problem)+'</p><button class="btn secondary" onclick="MusaAuth.retry()">Reintentar conexión ↻</button>';
  } else if(mode==='verify'){
    title='REVISA TU CORREO.';subtitle='Te enviamos un enlace para verificar tu dirección y activar tu cuenta.';
    form='<p class="auth-message">Abre el mensaje de MUSA, confirma tu correo y vuelve aquí. Si no lo ves, revisa Spam o Promociones.</p><form onsubmit="MusaAuth.resend(event)"><div class="field"><label for="auth-email">¿No llegó el mensaje? Introduce tu correo</label><input id="auth-email" type="email" autocomplete="email" required value="'+html(sessionStorage.getItem('musa-pending-email')||'')+'" placeholder="tu@email.com"></div><button class="btn secondary auth-submit" type="submit">Reenviar confirmación ↗</button></form><button class="auth-link" type="button" onclick="MusaAuth.show(\'login\')">Volver a iniciar sesión →</button>';
  } else if(mode==='recover'){
    title='RECUPERA TU CHISPA.';subtitle='Te enviaremos un enlace seguro para establecer una nueva contraseña.';
    form='<form onsubmit="MusaAuth.submit(event)"><div class="field"><label for="auth-email">Correo electrónico</label><input type="email" id="auth-email" autocomplete="email" required placeholder="tu@email.com"></div><button class="btn secondary auth-submit" type="submit" '+(busy?'disabled':'')+'>Enviar enlace →</button><p id="auth-submit-status" class="auth-small" role="status" aria-live="polite"></p></form>';
    foot='<button class="auth-link" onclick="MusaAuth.show(\'login\')">← Volver a entrar</button>';
  } else if(mode==='reset'){
    title='CREA TU NUEVA CLAVE.';subtitle='Elige una contraseña segura para recuperar tu acceso.';
    form='<form onsubmit="MusaAuth.submit(event)"><div class="field"><label for="auth-password">Nueva contraseña</label><input type="password" id="auth-password" autocomplete="new-password" minlength="8" required></div><div class="field"><label for="auth-password-confirm">Confirmar contraseña</label><input type="password" id="auth-password-confirm" autocomplete="new-password" minlength="8" required></div><button class="btn secondary auth-submit" type="submit" '+(busy?'disabled':'')+'>Guardar nueva contraseña →</button><p id="auth-submit-status" class="auth-small" role="status" aria-live="polite"></p></form>';
  } else {
    const signup=mode==='signup';
    title=signup?'TU HISTORIA CREATIVA EMPIEZA AQUÍ.':'TU MUNDO CREATIVO TE ESPERA.';
    subtitle=signup?'Una cuenta privada para tus ideas, obras y desafíos.':'Entra y continúa desde donde lo dejaste.';
    form='<form onsubmit="MusaAuth.submit(event)">'+
      (signup?'<div class="field"><label for="auth-name">Nombre creativo (opcional)</label><input id="auth-name" type="text" maxlength="60" autocomplete="nickname" placeholder="¿Cómo te llamamos?"></div>':'')+
      '<div class="field"><label for="auth-email">Correo electrónico</label><input type="email" id="auth-email" required autocomplete="email" placeholder="tu@email.com"></div>'+
      '<div class="field"><label for="auth-password">Contraseña</label><input id="auth-password" type="password" required minlength="8" autocomplete="'+(signup?'new-password':'current-password')+'" placeholder="Mínimo 8 caracteres"></div>'+
      (!signup?'<div class="auth-options"><label class="auth-remember"><input type="checkbox" id="auth-remember" '+(remember?'checked':'')+'> Recordarme</label><button type="button" class="auth-link" onclick="MusaAuth.show(\'recover\')">¿Olvidaste tu contraseña?</button></div>':'<p class="auth-small">Al crear tu cuenta aceptas los <a href="/terminos-de-uso/" target="_blank" rel="noopener">Términos de uso</a> y puedes consultar nuestra <a href="/politica-de-privacidad/" target="_blank" rel="noopener">Política de privacidad</a>.</p>')+
      '<button class="btn secondary auth-submit" type="submit" '+(busy?'disabled':'')+'>'+(signup?'Crear mi cuenta ↗':'Entrar a MUSA ↗')+'</button><p id="auth-submit-status" class="auth-small" role="status" aria-live="polite"></p></form>';
    foot=signup?'<span>¿Ya tienes cuenta?</span> <button class="auth-link" onclick="MusaAuth.show(\'login\')">Iniciar sesión</button>':'<span>¿Tu primera vez?</span> <button class="auth-link" onclick="MusaAuth.show(\'signup\')">Crear cuenta</button>';
  }
  document.getElementById('app').innerHTML='<div class="auth-shell"><div class="auth-art"><div class="eyebrow">MUSA / TU ESPACIO PERSONAL</div><h1>NO NECESITAS UNA GRAN IDEA.<br>SOLO EMPEZAR.</h1><p>Sin likes. Sin presión. Todo lo que creas es tuyo.</p><img src="/musa-asterisk.svg" class="auth-star" alt="" aria-hidden="true"></div>'+
    '<section class="auth-card"><div class="eyebrow">CREATIVE LAB / CUENTAS</div><h2>'+title+'</h2><p class="muted">'+subtitle+'</p>'+
    (problem&&mode!=='error'?'<p class="auth-error" role="alert">'+html(problem)+'</p>':'')+
    (notice?'<p class="auth-message" role="status">'+html(notice)+'</p>':'')+
    form+'<div class="auth-footer">'+foot+'</div></section></div>'+
    '<footer class="foot"><div>MUSA® / Cada estudio es privado y personal.</div><nav class="legal-links"><a href="/politica-de-privacidad/">Privacidad</a><a href="/terminos-de-uso/">Términos</a></nav></footer>';
}
function show(next){mode=next;updateRoute(next);problem='';notice='';busy=false;renderGate()}
async function enter(target){
  if(!client)return show('login');
  if(!user){
    const {data:session,error}=await client.auth.getUser();
    if(error||!session?.user)return show('login');
    user=session.user;
  }
  window.history?.replaceState?.({},'','/');
  if(!loaded)await loadWorkspace(user);
  if(loaded&&target==='explorar')go('explorar');
}
async function resend(event){
  event.preventDefault();
  if(!client||busy)return;
  const email=event.currentTarget.querySelector('#auth-email')?.value.trim().toLowerCase();
  if(!email)return;
  busy=true;problem='';notice='';
  const submit=event.currentTarget.querySelector('button[type="submit"]');
  if(submit){submit.disabled=true;submit.textContent='Reenviando…';}
  try{
    const {error}=await client.auth.resend({type:'signup',email,options:{emailRedirectTo:location.origin+REDIRECT_PATH}});
    if(error)throw error;
    sessionStorage.setItem('musa-pending-email',email);
    mode='verify';updateRoute('verify');notice='Si el correo está pendiente de confirmar, te llegará un enlace nuevo.';
  }catch(e){mode='confirmation-error';problem=message(e);}
  finally{busy=false;renderGate();}
}

function message(err){
  const msg=String(err?.message||err||'Error desconocido');
  if(/invalid login credentials/i.test(msg))return 'Correo o contraseña incorrectos, o todavía no confirmaste tu correo.';
  if(/email not confirmed/i.test(msg))return 'Debes confirmar tu correo antes de entrar.';
  if(/email address not authorized/i.test(msg))return 'Todavía no está configurado el correo saliente de MUSA para usuarios externos. Contacta con musacreativelaboratory@gmail.com.';
  if(/user already registered/i.test(msg))return 'Esta dirección ya está registrada. Inicia sesión o recupera tu contraseña.';
  if(/password should be at least|weak password/i.test(msg))return 'Utiliza una contraseña de al menos 8 caracteres y evita claves fáciles de adivinar.';
  if(/rate limit|security purposes/i.test(msg))return 'Demasiados intentos. Espera un momento antes de volver a probar.';
  if(/failed to fetch|network/i.test(msg))return 'No pudimos contactar con Supabase. Comprueba tu conexión a internet.';
  if(/context deadline|gateway timeout|504|tiempo de espera|timed? ?out/i.test(msg))return 'Supabase recibió la solicitud, pero está tardando demasiado en responder. Revisa tu correo y la carpeta Spam; espera al menos un minuto antes de intentar de nuevo. Si continúa, revisaremos la configuración SMTP.';
  return msg;
}
async function handle(event){
  event.preventDefault();
  if(busy||!client)return;
  const form=event.currentTarget;
  const email=form.querySelector('#auth-email')?.value.trim().toLowerCase();
  const password=form.querySelector('#auth-password')?.value;
  const passwordConfirmation=form.querySelector('#auth-password-confirm')?.value;
  const displayName=form.querySelector('#auth-name')?.value.trim();
  const choice=form.querySelector('#auth-remember')?.checked;
  const currentMode=mode;
  busy=true;problem='';notice='';
  const button=form.querySelector('button[type="submit"]');
  const status=document.getElementById('auth-submit-status');
  const labels={signup:'Creando tu cuenta…',login:'Iniciando sesión…',recover:'Enviando enlace…',reset:'Actualizando contraseña…'};
  if(button){button.disabled=true;button.textContent=labels[currentMode]||'Procesando…';}
  if(status)status.textContent='Conectando con Supabase, espera un momento…';
  const delayMessage=setTimeout(()=>{
    if(busy&&status)status.textContent='Supabase sigue procesando la solicitud. El envío del correo puede tardar un poco; no vuelvas a pulsar el botón.';
  },12000);
  const waitForReply=async action=>{
    let timeout;
    try{
      return await Promise.race([
        action,
        new Promise((_,reject)=>{timeout=setTimeout(()=>reject(new Error('Tiempo de espera agotado en Supabase.')),45000);})
      ]);
    }finally{clearTimeout(timeout)}
  };
  try{
    if(currentMode==='signup'){
      if(password.length<8)throw Error('La contraseña debe tener al menos 8 caracteres.');
      const {data:result,error}=await waitForReply(client.auth.signUp({email,password,options:{emailRedirectTo:location.origin+REDIRECT_PATH,data:{display_name:displayName||email.split('@')[0]}}}));
      if(error)throw error;
      if(result.session){await loadWorkspace(result.user);notice='Cuenta creada correctamente.';}
      else{sessionStorage.setItem('musa-pending-email',email);mode='verify';updateRoute('verify');notice='Te enviamos las instrucciones a '+email+'.';}
    }else if(currentMode==='login'){
      rememberChoice(choice);
      const {data:result,error}=await waitForReply(client.auth.signInWithPassword({email,password}));
      if(error)throw error;
      await loadWorkspace(result.user);
    }else if(currentMode==='recover'){
      const {error}=await waitForReply(client.auth.resetPasswordForEmail(email,{redirectTo:location.origin+REDIRECT_PATH}));
      if(error)throw error;
      mode='verify';updateRoute('verify');notice='Si existe una cuenta con ese correo, llegará un enlace de recuperación.';
    }else if(currentMode==='reset'){
      if(password.length<8)throw Error('La contraseña debe tener al menos 8 caracteres.');
      if(password!==passwordConfirmation)throw Error('Las contraseñas no coinciden.');
      const {error}=await waitForReply(client.auth.updateUser({password}));
      if(error)throw error;
      await client.auth.signOut();
      mode='reset-success';updateRoute('reset-success');notice='Contraseña actualizada correctamente.';
    }
  }catch(e){problem=message(e);if(currentMode!=='reset')mode=currentMode}
  finally{clearTimeout(delayMessage);busy=false;if(!loaded)renderGate();else render();}
}
function renderAccount(){
  document.body?.classList?.remove?.('auth-locked');
  const el=document.getElementById('account-menu');
  if(!el)return;
  if(!user){el.innerHTML='';return}
  const email=html(user.email||'');
  const alias=html(user.user_metadata?.display_name||user.email?.split('@')[0]||'Mi estudio');
  el.innerHTML='<div class="account-holder"><span class="account-dot" aria-hidden="true"><img src="/musa-asterisk.svg" alt=""></span><span class="account-info"><strong>'+alias+'</strong><small title="'+email+'">'+email+'</small></span><button class="account-logout" type="button" onclick="MusaAuth.logout()" title="Cerrar sesión">Salir ↗</button></div>';
}
async function loadArtworkImages(){
  images.clear();
  const list=data.artworks.filter(a=>a.imagePath).slice(0,150);
  await Promise.all(list.map(async a=>{
    const {data:result,error}=await client.storage.from('musa-artworks').createSignedUrl(a.imagePath,3600);
    if(!error&&result?.signedUrl)images.set(a.imagePath,result.signedUrl);
  }));
}
let currentLoad=null;
async function loadWorkspace(identity){
  if(!identity?.id)return;
  if(loaded&&user?.id===identity.id)return;
  if(currentLoad?.id===identity.id)return currentLoad.promise;
  const token=++loadToken;
  const promise=(async()=>{
    mode='loading';renderGate();
    const {data:row,error}=await client.from('musa_workspaces').select('document').eq('user_id',identity.id).maybeSingle();
    if(error)throw error;
    if(token!==loadToken)return;
    user=identity;data=clean(row?.document);loaded=true;
    window.MusaCreativeHub?.reset?.();
    initBoards(); // Restore each user's board memberships after fetching their private workspace.
    currentIdea=window.MusaMoodboards.nextIdea(prompts,currentIdea);seconds=data.active?.elapsed||0;paused=true;page='inicio';
    inspiration={query:'collage experimental',source:'unsplash',items:[],loading:false,error:'',searched:false,partial:false,requestId:0};
    await loadArtworkImages();
    if(token!==loadToken)return;
    problem='';render();
  })();
  currentLoad={id:identity.id,promise};
  try{return await promise}catch(e){
    if(token===loadToken){user=null;loaded=false;mode='error';problem='No pudimos cargar tu espacio personal: '+message(e);renderGate();}
  }finally{if(currentLoad?.promise===promise)currentLoad=null}
}
function queueSave(){
  if(!loaded||!user)return;
  clearTimeout(saveTimer);
  saveTimer=setTimeout(()=>{void flush()},550);
}
function flush(){
  clearTimeout(saveTimer);saveTimer=null;
  if(!loaded||!user)return Promise.resolve(true);
  const uid=user.id;
  const snapshot=JSON.parse(JSON.stringify(clean(data)));
  saveChain=saveChain.catch(()=>{}).then(async()=>{
    if(!user||user.id!==uid)return false;
    const {error}=await client.from('musa_workspaces').upsert({user_id:uid,document:snapshot},{onConflict:'user_id'});
    if(error)throw error;
    saveError='';return true;
  });
  return saveChain.catch(e=>{saveError=message(e);toast('No se pudo sincronizar tu estudio. Se reintentará al guardar.');return false});
}
async function logout(){
  if(!client)return;
  const success=await flush();
  if(!success){toast('No se pudo guardar tu último cambio. Revisa tu conexión antes de salir.');return}
  const {error}=await client.auth.signOut();
  if(error){toast('No se pudo cerrar la sesión: '+message(error));return}
  reset();
}
function reset(){
  clearTimeout(saveTimer);loadToken++;user=null;loaded=false;data=blank();currentIdea=null;
  selectedBoardId='';boardEditor=null;boardDeleteId='';searchHistoryDeleteOpen=false;document.getElementById('search-history-dialog-root')?.replaceChildren?.();window.MusaMoodboards?.close?.();window.MusaCreativeHub?.reset?.();
  images.clear();inspiration.items=[];inspiration.query='collage experimental';inspiration.searched=false;inspiration.requestId++;
  page='inicio';mode='login';renderGate();
}
async function uploadArtwork(artId,blob){
  if(!user||!loaded)throw Error('Inicia sesión para guardar tu creación.');
  if(!blob||blob.size>6291456)throw Error('La foto supera el límite de 6 MB.');
  const path=user.id+'/'+artId+'.jpg';
  const {error}=await client.storage.from('musa-artworks').upload(path,blob,{upsert:false,contentType:'image/jpeg',cacheControl:'3600'});
  if(error)throw Error('No se pudo subir la foto: '+message(error));
  const {data:result}=await client.storage.from('musa-artworks').createSignedUrl(path,3600);
  if(result?.signedUrl)images.set(path,result.signedUrl);
  return path;
}
function artworkImage(art){
  return art?.imagePath?images.get(art.imagePath)||'':art?.image||'';
}
async function removeArtworkFile(path){
  if(!path||!user||!path.startsWith(user.id+'/'))return;
  const {error}=await client.storage.from('musa-artworks').remove([path]);
  if(error)toast('La obra se eliminó, pero la foto pendiente no se pudo limpiar.');
  images.delete(path);
}
function importAvailable(){return Boolean(loaded&&legacyData()&&!data.artworks.length&&!data.sessions.length&&!data.favorites.length&&!data.references.length&&!data.savedChallenges.length&&!data.acceptedChallenges.length&&!data.boards.length&&!data.projects.length&&!data.journalEntries.length&&!data.calendarEvents.length)}
function importBanner(){
  if(!importAvailable())return'';
  return '<div class="legacy-banner"><strong>¿TENÍAS CREACIONES EN ESTE NAVEGADOR?</strong><p>Encontramos trabajos antiguos guardados aquí. Impórtalos <strong>solo si son tuyos</strong>. No se copiarán automáticamente a ninguna cuenta.</p><button class="btn secondary" type="button" onclick="MusaAuth.importLegacy()">Importar mis trabajos →</button><button class="auth-link" type="button" onclick="MusaAuth.dismissImport()">Ahora no</button></div>';
}
let dismissed=false,importBusy=false;
function hasImport(){return !dismissed&&importAvailable()}
function dismissImport(){dismissed=true;render()}
async function importLegacy(){
  if(importBusy||!importAvailable())return;
  if(!confirm('Importaremos las ideas, referencias, sesiones y obras de este navegador a tu cuenta de MUSA. ¿Confirmas que son tuyas?'))return;
  importBusy=true;
  const legacy=legacyData();
  const previous=data;
  try{
    for(const art of legacy.artworks){
      if(art.image&&art.image.startsWith('data:image/')){
        const blob=await(await fetch(art.image)).blob();
        if(blob.size>6291456)throw Error('Una fotografía antigua supera el tamaño permitido.');
        let converted=blob;
        if(blob.type!=='image/jpeg'){
          // Existing local photos are normally JPEG; unsupported types must be converted before upload.
          throw Error('Una foto antigua no es JPEG. Contacta con soporte para importarla.');
        }
        art.imagePath=await uploadArtwork(art.id,converted);
        art.image='';
      }
    }
    data=legacy;
    initBoards();
    const saved=await flush();
    if(!saved)throw Error('No pudimos sincronizar los datos importados.');
    localStorage.removeItem(LEGACY_KEY);
    dismissed=true;toast('¡Tus trabajos antiguos ya están en tu cuenta!');render();
  }catch(e){data=previous;toast('No se pudo importar: '+message(e));}
  finally{importBusy=false}
}
async function init(){
  const requested=routeMode();
  const urlParams=new URLSearchParams((location.hash||'').replace(/^#/,''));
  const queryParams=new URLSearchParams((location.search||'').replace(/^\?/,''));
  const callbackError=urlParams.get('error_description')||queryParams.get('error_description')||urlParams.get('error')||queryParams.get('error');
  const recoveryLink=urlParams.get('type')==='recovery'||queryParams.get('type')==='recovery';
  mode=requested==='callback'?'callback':'loading';renderGate();
  try{
    if(!window.supabase?.createClient)throw Error('No se pudo cargar el sistema de cuentas. Comprueba tu conexión.');
    const response=await fetch('/api/auth-config',{headers:{Accept:'application/json'}});
    const config=await response.json();
    if(!response.ok||!config.url||!config.publishableKey)throw Error(config.error||'Configuración de cuentas incompleta.');
    client=window.supabase.createClient(config.url,config.publishableKey,{
      auth:{storage,storageKey:AUTH_KEY,persistSession:true,autoRefreshToken:true,detectSessionInUrl:true}
    });
    client.auth.onAuthStateChange((event,session)=>{
      if(event==='PASSWORD_RECOVERY'){
        user=session?.user||null;mode='reset';loaded=false;updateRoute('reset',true);renderGate();return;
      }
      if(event==='SIGNED_OUT'){reset();return}
      if(event==='SIGNED_IN'&&session?.user&&!loaded&&!['callback','success','reset','reset-success'].includes(requested)&&!['reset','success'].includes(mode)){
        setTimeout(()=>{if(!loaded&&!['reset','success','callback','reset-success'].includes(mode))void loadWorkspace(session.user)},0);
      }
    });
    if(requested==='callback'&&callbackError){
      mode='confirmation-error';problem='Este enlace de confirmación ha expirado o no es válido. Solicita uno nuevo.';
      updateRoute(mode,true);renderGate();return;
    }
    const {data:result,error}=await client.auth.getSession();
    if(error)throw error;
    if(mode==='reset')return;
    if(requested==='callback'){
      if(!result?.session?.user){
        mode='confirmation-error';problem='No encontramos una sesión válida para ese enlace. Solicita una nueva confirmación.';
        updateRoute(mode,true);renderGate();return;
      }
      const verified=await client.auth.getUser();
      if(verified.error||!verified.data?.user)throw verified.error||Error('No pudimos verificar el acceso.');
      user=verified.data.user;
      sessionStorage.removeItem('musa-pending-email');
      mode=recoveryLink?'reset':'success';
      updateRoute(mode,true);renderGate();return;
    }
    if(result?.session?.user){
      const verified=await client.auth.getUser();
      if(verified.error||!verified.data?.user)throw verified.error||Error('La sesión ha caducado.');
      if(requested==='success'){user=verified.data.user;mode='success';renderGate()}
      else if(requested==='reset'){user=verified.data.user;mode='reset';renderGate()}
      else await loadWorkspace(verified.data.user);
    } else{
      mode=['signup','login','recover','verify','confirmation-error'].includes(requested)?requested:'login';
      renderGate();
    }
  }catch(e){
    mode=requested==='callback'?'confirmation-error':'error';
    problem=message(e);updateRoute(mode,requested==='callback');renderGate();
  }
}
window.addEventListener?.('popstate',()=>{if(!loaded){mode=routeMode();problem='';notice='';renderGate()}});
window.MusaAuth={init,retry:init,show,handle,submit:handle,logout,enter,resend,renderGate,renderAccount,isAuthenticated:()=>Boolean(user&&loaded),queueSave,flush,artworkImage,uploadArtwork,removeArtworkFile,hasImport,importBanner,importLegacy,dismissImport};
void init();
})();