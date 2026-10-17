const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const path=require('node:path');
const root=path.resolve(__dirname,'..');
const html=fs.readFileSync(path.join(root,'index.html'),'utf8');
const inline=[...html.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/g)].map(m=>m[1]).find(Boolean);
const auth=fs.readFileSync(path.join(root,'public/auth.js'),'utf8');
const boards=fs.readFileSync(path.join(root,'public/boards.js'),'utf8');
const moodboards=fs.readFileSync(path.join(root,'public/moodboards.js'),'utf8');
const writing=fs.readFileSync(path.join(root,'public/creative-writing.js'),'utf8');
const challengeBanner=fs.readFileSync(path.join(root,'public/challenge-banner.js'),'utf8');
function makeStorage(initial={}){
  const m=new Map(Object.entries(initial));
  return {getItem:k=>m.get(k)||null,setItem:(k,v)=>m.set(k,String(v)),removeItem:k=>m.delete(k),has:k=>m.has(k)};
}
const sleep=ms=>new Promise(resolve=>setTimeout(resolve,ms));
test('private account data does not leak across sign-in, sign-out and Remember me',async()=>{
  const nodes=new Map();
  const getNode=id=>{if(!nodes.has(id))nodes.set(id,{innerHTML:'',value:id==='query'?'collage experimental':'',textContent:'',hidden:false,attrs:{},setAttribute(k,v){this.attrs[k]=v},getAttribute(k){return this.attrs[k]||null},classList:{add(){},remove(){},toggle(){}},querySelector(){return null},querySelectorAll(){return[]}});return nodes.get(id)};
  const local=makeStorage({'musa-v1':JSON.stringify({favorites:[{id:'OLD',title:'Legacy work'}],artworks:[],sessions:[],references:[]})});
  const sessionStorage=makeStorage();
  const workspaces=new Map();
  let current=null,listener=null,options=null;
  let signupCount=0,signupResolve=null;
  const accounts={
    a:{id:'00000000-0000-4000-8000-000000000001',email:'loto1998k@gmail.com',user_metadata:{display_name:'MUSA Uno'}},
    b:{id:'00000000-0000-4000-8000-000000000002',email:'dos@example.com',user_metadata:{}}
  };
  const client={
    auth:{
      onAuthStateChange(fn){listener=fn;return{data:{subscription:{unsubscribe(){}}}}},
      signUp({email,password,options}){signupCount++;assert.equal(email,'loto1998k@gmail.com');assert.equal(options.emailRedirectTo,'https://musa-creative-lab.vercel.app/auth/callback');assert.ok(password.length>=8);return new Promise(resolve=>{signupResolve=resolve})},
      async getSession(){return{data:{session:current?{user:current}:null},error:null}},
      async getUser(){return{data:{user:current},error:null}},
      async signInWithPassword({email}){
        current=Object.values(accounts).find(u=>u.email===email);
        if(!current)return{error:Error('Invalid login credentials')};
        options.auth.storage.setItem(options.auth.storageKey,'fake-session-'+current.id);
        listener?.('SIGNED_IN',{user:current});
        return{data:{user:current},error:null};
      },
      async signOut(){current=null;options.auth.storage.removeItem(options.auth.storageKey);listener?.('SIGNED_OUT',null);return{error:null}}
    },
    from(table){
      assert.equal(table,'musa_workspaces');
      return{
        select(cols){assert.equal(cols,'document');return{eq(field,uid){assert.equal(field,'user_id');return{async maybeSingle(){return{data:workspaces.has(uid)?{document:JSON.parse(JSON.stringify(workspaces.get(uid)))}:null,error:null}}}}}},
        async upsert(row){assert.equal(row.user_id,current?.id);workspaces.set(row.user_id,JSON.parse(JSON.stringify(row.document)));return{error:null}}
      };
    },
    storage:{from(){return{async createSignedUrl(){return{data:{signedUrl:'https://example.com/image'},error:null}}}}}
  };
  const window={scrollTo(){},addEventListener(){},supabase:{createClient(url,key,opts){assert.match(url,/supabase\.co/);assert.match(key,/sb_publishable_/);options=opts;return client}}};
  const ctx=vm.createContext({console,window,URLSearchParams,document:{getElementById:getNode,addEventListener(){},body:{classList:{add(){},remove(){},toggle(){}}}},localStorage:local,sessionStorage,location:{origin:'https://musa-creative-lab.vercel.app',pathname:'/',hash:'',search:''},URL,crypto:{randomUUID:()=>String(Math.random())},Image:class{},setTimeout,clearTimeout,setInterval,clearInterval,confirm:()=>true,
    fetch:async(url)=>{assert.equal(url,'/api/auth-config');return{ok:true,json:async()=>({url:'https://musa.supabase.co',publishableKey:'sb_publishable_testing'})}}
  });
  for(const [name,source] of [['boards',boards],['moodboards',moodboards],['writing',writing],['banner',challengeBanner]])vm.runInContext(source,ctx,{filename:name+'.js'});
  vm.runInContext(inline,ctx);
  vm.runInContext(auth,ctx);
  await sleep(30);
  assert.match(getNode('app').innerHTML,/TU MUNDO CREATIVO TE ESPERA/);
  assert.doesNotMatch(getNode('app').innerHTML,/Legacy work/);
  ctx.window.MusaAuth.show('signup');
  assert.match(getNode('app').innerHTML,/Crear mi cuenta/);
  const submitButton={disabled:false,textContent:''};
  const signupForm={querySelector(selector){
    return ({'#auth-email':{value:'loto1998k@gmail.com'},'#auth-password':{value:'password-segura-123'},'#auth-name':{value:'MUSA Tester'},'button[type="submit"]':submitButton})[selector]||null;
  }};
  const submitSignup=()=>ctx.window.MusaAuth.submit({preventDefault(){},currentTarget:signupForm});
  const submitPromise=submitSignup();
  assert.equal(signupCount,1,'Signup must invoke Supabase once');
  assert.equal(submitButton.disabled,true,'Signup button must disable during SMTP delay');
  assert.match(submitButton.textContent,/Creando tu cuenta/,'Signup must visibly announce progress');
  await submitSignup();
  assert.equal(signupCount,1,'Repeated clicks must not register duplicate accounts');
  signupResolve({data:{user:accounts.a,session:null},error:null});
  await submitPromise;
  assert.match(getNode('app').innerHTML,/REVISA TU CORREO/,'Successful signup shows email verification screen');
  ctx.window.MusaAuth.show('login');

  const signIn=async(email,remember)=>ctx.window.MusaAuth.handle({
    preventDefault(){},
    currentTarget:{querySelector(selector){
      const fields={'#auth-email':{value:email},'#auth-password':{value:'secure-pass-123'},'#auth-remember':{checked:remember}};
      return fields[selector]||null;
    }}
  });
  await signIn(accounts.a.email,true);
  assert.equal(vm.runInContext('data.favorites.length',ctx),0,'legacy favorites are not silently assigned to account A');
  vm.runInContext('randomIdea();fav()',ctx);
  vm.runInContext("data.projects.push({id:'p-a',title:'Mi proyecto privado'});data.journalEntries.push({id:'j-a',date:'2026-10-16',title:'Mi diario privado',body:'Proceso A'});data.calendarEvents.push({id:'e-a',date:'2026-10-17',title:'Mi actividad privada'});save()",ctx);
  assert.equal(await ctx.window.MusaAuth.flush(),true);
  assert.equal(workspaces.get(accounts.a.id).favorites.length,1);
  assert.equal(workspaces.get(accounts.a.id).projects.length,1);
  assert.equal(workspaces.get(accounts.a.id).journalEntries.length,1);
  assert.equal(workspaces.get(accounts.a.id).calendarEvents.length,1);
  assert.equal(local.has('musa-auth-v1'),true,'Remember me stores token persistently');
  await ctx.window.MusaAuth.logout();
  assert.equal(local.has('musa-auth-v1'),false,'logout clears persistent token');
  assert.match(getNode('app').innerHTML,/TU MUNDO CREATIVO TE ESPERA/);
  await signIn(accounts.b.email,false);
  assert.equal(vm.runInContext('data.favorites.length',ctx),0,'account B sees a clean private workspace');
  assert.equal(vm.runInContext('data.projects.length+data.journalEntries.length+data.calendarEvents.length',ctx),0,'account B must not see projects, diary or events from account A');
  assert.equal(sessionStorage.has('musa-auth-v1'),true,'unchecked Remember me uses tab session storage');
  assert.equal(local.has('musa-auth-v1'),false,'unchecked Remember me must not persist the session');
  await ctx.window.MusaAuth.logout();
  await signIn(accounts.a.email,true);
  assert.equal(vm.runInContext('data.favorites.length',ctx),1,'account A restores only its own favorites');
  assert.equal(vm.runInContext('data.projects.length+data.journalEntries.length+data.calendarEvents.length',ctx),3,'account A restores all three creative collections');
  assert.equal(vm.runInContext('data.favorites[0].id',ctx),workspaces.get(accounts.a.id).favorites[0].id);
  assert.equal(workspaces.has(accounts.b.id),true);
});
