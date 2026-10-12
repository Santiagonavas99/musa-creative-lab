/* MUSA private accounts — Supabase Auth + per-user RLS workspace */
(function(){
'use strict';
const REMEMBER_KEY='musa-remember-v1';
const AUTH_KEY='musa-auth-v1';
const LEGACY_KEY='musa-v1';
let remember=localStorage.getItem(REMEMBER_KEY)!=='0';
let client=null,user=null,loaded=false,mode='login',notice='',problem='',busy=false,loadToken=0,saveTimer=null,saveChain=Promise.resolve(),saveError='';
const images=new Map();
const blank=()=>({favorites:[],artworks:[],sessions:[],references:[],searches:[],active:null});
const clean=raw=>{
  const source=raw&&typeof raw==='object'?raw:{};
  const result=blank();
  for(const key of ['favorites','artworks','sessions','references','searches'])
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
    return doc.favorites.length||doc.artworks.length||doc.sessions.length||doc.references.length||doc.active?doc:null;
  }catch{return null}
}
function renderGate(){
  document.getElementById('nav').innerHTML='';
  document.getElementById('bottom').innerHTML='';
  const account=document.getElementById('account-menu');
  if(account)account.innerHTML='';
  let title='',subtitle='',form='',foot='';
  if(mode==='loading'){
    title='PREPARANDO TU ESPACIO.';subtitle='Conectando tu laboratorio creativo de forma segura…';
    form='<p class="auth-message" role="status">Un momento, estamos cargando tu estudio.</p>';
  } else if(mode==='error'){
    title='NO PUDIMOS CONECTAR.';subtitle='Las cuentas de MUSA no están disponibles por el momento.';
    form='<p class="auth-error" role="alert">'+html(problem)+'</p><button class="btn secondary" onclick="MusaAuth.retry()">Reintentar conexión ↻</button>';
  } else if(mode==='verify'){
    title='REVISA TU CORREO.';subtitle='Te enviamos un enlace para verificar tu dirección y activar tu cuenta.';
    form='<p class="auth-message">Abre el mensaje de Supabase, confirma tu correo y vuelve a MUSA. Si no aparece, revisa Spam.</p><button class="btn secondary" onclick="MusaAuth.show(\'login\')">Volver a iniciar sesión →</button>';
  } else if(mode==='recover'){
    title='RECUPERA TU CHISPA.';subtitle='Te enviaremos un enlace seguro para establecer una nueva contraseña.';
    form='<form onsubmit="MusaAuth.submit(event)"><div class="field"><label for="auth-email">Correo electrónico</label><input type="email" id="auth-email" autocomplete="email" required placeholder="tu@email.com"></div><button class="btn secondary auth-submit" type="submit" '+(busy?'disabled':'')+'>Enviar enlace →</button></form>';
    foot='<button class="auth-link" onclick="MusaAuth.show(\'login\')">← Volver a entrar</button>';
  } else if(mode==='reset'){
    title='CREA TU NUEVA CLAVE.';subtitle='Elige una contraseña segura para recuperar tu acceso.';
    form='<form onsubmit="MusaAuth.submit(event)"><div class="field"><label for="auth-password">Nueva contraseña</label><input type="password" id="auth-password" autocomplete="new-password" minlength="8" required></div><button class="btn secondary auth-submit" type="submit" '+(busy?'disabled':'')+'>Guardar nueva contraseña →</button></form>';
  } else {
    const signup=mode==='signup';
    title=signup?'TU HISTORIA CREATIVA EMPIEZA AQUÍ.':'TU MUNDO CREATIVO TE ESPERA.';
    subtitle=signup?'Una cuenta privada para tus ideas, obras y desafíos.':'Entra y continúa desde donde lo dejaste.';
    form='<form onsubmit="MusaAuth.submit(event)">'+
      (signup?'<div class="field"><label for="auth-name">Nombre creativo (opcional)</label><input id="auth-name" type="text" maxlength="60" autocomplete="nickname" placeholder="¿Cómo te llamamos?"></div>':'')+
      '<div class="field"><label for="auth-email">Correo electrónico</label><input type="email" id="auth-email" required autocomplete="email" placeholder="tu@email.com"></div>'+
      '<div class="field"><label for="auth-password">Contraseña</label><input id="auth-password" type="password" required minlength="8" autocomplete="'+(signup?'new-password':'current-password')+'" placeholder="Mínimo 8 caracteres"></div>'+
      (!signup?'<div class="auth-options"><label class="auth-remember"><input type="checkbox" id="auth-remember" '+(remember?'checked':'')+'> Recordarme</label><button type="button" class="auth-link" onclick="MusaAuth.show(\'recover\')">¿Olvidaste tu contraseña?</button></div>':'<p class="auth-small">Al crear tu cuenta aceptas los <a href="/terminos-de-uso/" target="_blank" rel="noopener">Términos de uso</a> y puedes consultar nuestra <a href="/politica-de-privacidad/" target="_blank" rel="noopener">Política de privacidad</a>.</p>')+
      '<button class="btn secondary auth-submit" type="submit" '+(busy?'disabled':'')+'>'+(signup?'Crear mi cuenta ↗':'Entrar a MUSA ↗')+'</button></form>';
    foot=signup?'<span>¿Ya tienes cuenta?</span> <button class="auth-link" onclick="MusaAuth.show(\'login\')">Iniciar sesión</button>':'<span>¿Tu primera vez?</span> <button class="auth-link" onclick="MusaAuth.show(\'signup\')">Crear cuenta</button>';
  }
  document.getElementById('app').innerHTML='<div class="auth-shell"><div class="auth-art"><div class="eyebrow">MUSA / TU ESPACIO PERSONAL</div><h1>NO NECESITAS UNA GRAN IDEA.<br>SOLO EMPEZAR.</h1><p>Sin likes. Sin presión. Todo lo que creas es tuyo.</p><span class="auth-star" aria-hidden="true">✳</span></div>'+
    '<section class="auth-card"><div class="eyebrow">CREATIVE LAB / CUENTAS</div><h2>'+title+'</h2><p class="muted">'+subtitle+'</p>'+
    (problem&&mode!=='error'?'<p class="auth-error" role="alert">'+html(problem)+'</p>':'')+
    (notice?'<p class="auth-message" role="status">'+html(notice)+'</p>':'')+
    form+'<div class="auth-footer">'+foot+'</div></section></div>'+
    '<footer class="foot"><div>MUSA® / Cada estudio es privado y personal.</div><nav class="legal-links"><a href="/politica-de-privacidad/">Privacidad</a><a href="/terminos-de-uso/">Términos</a></nav></footer>';
}
function show(next){mode=next;problem='';notice='';busy=false;renderGate()}
function message(err){
  const msg=String(err?.message||err||'Error desconocido');
  if(/invalid login credentials/i.test(msg))return 'Correo o contraseña incorrectos, o todavía no confirmaste tu correo.';
  if(/email not confirmed/i.test(msg))return 'Debes confirmar tu correo antes de entrar.';
  if(/user already registered/i.test(msg))return 'Esta dirección ya está registrada. Inicia sesión o recupera tu contraseña.';
  if(/password should be at least|weak password/i.test(msg))return 'Utiliza una contraseña de al menos 8 caracteres y evita claves fáciles de adivinar.';
  if(/rate limit|security purposes/i.test(msg))return 'Demasiados intentos. Espera un momento antes de volver a probar.';
  if(/failed to fetch|network/i.test(msg))return 'No pudimos contactar con Supabase. Comprueba tu conexión a internet.';
  return msg;
}
async function submit(event){
  event.preventDefault();
  if(busy||!client)return;
  busy=true;problem='';notice='';renderGate();
  // Re-render removes the form, so retain the submitted fields first through event.
}
async function handle(event){
  event.preventDefault();
  if(busy||!client)return;
  const form=event.currentTarget;
  const email=form.querySelector('#auth-email')?.value.trim().toLowerCase();
  const password=form.querySelector('#auth-password')?.value;
  const displayName=form.querySelector('#auth-name')?.value.trim();
  const choice=form.querySelector('#auth-remember')?.checked;
  const currentMode=mode;
  busy=true;problem='';notice='';
  try{
    if(currentMode==='signup'){
      if(password.length<8)throw Error('La contraseña debe tener al menos 8 caracteres.');
      const {data:result,error}=await client.auth.signUp({email,password,options:{emailRedirectTo:location.origin+'/',data:{display_name:displayName||email.split('@')[0]}}});
      if(error)throw error;
      if(result.session){await loadWorkspace(result.user);notice='Cuenta creada correctamente.';}
      else{mode='verify';notice='Te enviamos las instrucciones a '+email+'.';}
    }else if(currentMode==='login'){
      rememberChoice(choice);
      const {data:result,error}=await client.auth.signInWithPassword({email,password});
      if(error)throw error;
      await loadWorkspace(result.user);
    }else if(currentMode==='recover'){
      const {error}=await client.auth.resetPasswordForEmail(email,{redirectTo:location.origin+'/'});
      if(error)throw error;
      mode='verify';notice='Si existe una cuenta con ese correo, llegará un enlace de recuperación.';
    }else if(currentMode==='reset'){
      if(password.length<8)throw Error('La contraseña debe tener al menos 8 caracteres.');
      const {error}=await client.auth.updateUser({password});
      if(error)throw error;
      await client.auth.signOut();
      mode='login';notice='Contraseña actualizada. Entra con tu nueva clave.';
    }
  }catch(e){problem=message(e);if(currentMode!=='reset')mode=currentMode}
  finally{busy=false;if(!loaded)renderGate();else render();}
}
function renderAccount(){
  const el=document.getElementById('account-menu');
  if(!el)return;
  if(!user){el.innerHTML='';return}
  const email=html(user.email||'');
  const alias=html(user.user_metadata?.display_name||user.email?.split('@')[0]||'Mi estudio');
  el.innerHTML='<div class="account-holder"><span class="account-dot" aria-hidden="true">✳</span><span class="account-info"><strong>'+alias+'</strong><small title="'+email+'">'+email+'</small></span><button class="account-logout" type="button" onclick="MusaAuth.logout()" title="Cerrar sesión">Salir ↗</button></div>';
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
    currentIdea=null;seconds=data.active?.elapsed||0;paused=true;page='inicio';
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
function importAvailable(){return Boolean(loaded&&legacyData()&&!data.artworks.length&&!data.sessions.length&&!data.favorites.length&&!data.references.length)}
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
    const saved=await flush();
    if(!saved)throw Error('No pudimos sincronizar los datos importados.');
    localStorage.removeItem(LEGACY_KEY);
    dismissed=true;toast('¡Tus trabajos antiguos ya están en tu cuenta!');render();
  }catch(e){data=previous;toast('No se pudo importar: '+message(e));}
  finally{importBusy=false}
}
async function init(){
  mode='loading';renderGate();
  try{
    if(!window.supabase?.createClient)throw Error('No se pudo cargar el sistema de cuentas. Comprueba tu conexión.');
    const response=await fetch('/api/auth-config',{headers:{Accept:'application/json'}});
    const config=await response.json();
    if(!response.ok||!config.url||!config.publishableKey)throw Error(config.error||'Configuración de cuentas incompleta.');
    client=window.supabase.createClient(config.url,config.publishableKey,{
      auth:{storage,storageKey:AUTH_KEY,persistSession:true,autoRefreshToken:true,detectSessionInUrl:true}
    });
    client.auth.onAuthStateChange((event,session)=>{
      if(event==='PASSWORD_RECOVERY'){mode='reset';loaded=false;renderGate();return}
      if(event==='SIGNED_OUT'){reset();return}
      if(event==='SIGNED_IN'&&session?.user&&!loaded){
        // Avoid re-entering Supabase methods from the auth callback.
        setTimeout(()=>{if(!loaded)void loadWorkspace(session.user)},0);
      }
    });
    const {data:result,error}=await client.auth.getSession();
    if(error)throw error;
    if(mode==='reset')return;
    if(result?.session?.user){
      const verified=await client.auth.getUser();
      if(verified.error||!verified.data.user)throw verified.error||Error('La sesión ha caducado.');
      await loadWorkspace(verified.data.user);
    } else {mode='login';renderGate()}
  }catch(e){mode='error';problem=message(e);renderGate()}
}
window.MusaAuth={init,retry:init,show,handle,submit:handle,logout,renderGate,renderAccount,isAuthenticated:()=>Boolean(user&&loaded),queueSave,flush,artworkImage,uploadArtwork,removeArtworkFile,hasImport,importBanner,importLegacy,dismissImport};
void init();
})();