const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');

const root=path.resolve(__dirname,'..');
const html=fs.readFileSync(path.join(root,'index.html'),'utf8');
const inline=[...html.matchAll(/<script>([\s\S]*?)<\/script>/g)][0][1];
const auth=fs.readFileSync(path.join(root,'public/auth.js'),'utf8');
const makeStore=()=>{const m=new Map();return{getItem:k=>m.get(k)||null,setItem:(k,v)=>m.set(k,v),removeItem:k=>m.delete(k)}};
const account={id:'12345678-1234-4123-8123-123456789012',email:'test@example.com'};

async function runCallback({hash,withSession}){
  const location={origin:'https://preview.example',pathname:'/auth/callback',hash,search:''};
  const nodes=new Map();
  const document={getElementById(id){
    if(!nodes.has(id))nodes.set(id,{innerHTML:'',textContent:'',value:'',classList:{add(){},remove(){}}});
    return nodes.get(id);
  }};
  const client={auth:{
    onAuthStateChange(){return{}},
    async getSession(){return {data:{session:withSession?{user:account}:null},error:null}},
    async getUser(){return {data:{user:account},error:null}}
  }};
  const window={
    addEventListener(){},scrollTo(){},
    history:{
      replaceState(_state,_title,to){location.pathname=to;location.hash='';location.search=''},
      pushState(_state,_title,to){location.pathname=to}
    },
    supabase:{createClient(){return client}}
  };
  const context=vm.createContext({
    window,document,location,URLSearchParams,
    localStorage:makeStore(),sessionStorage:makeStore(),
    fetch:async()=>({ok:true,json:async()=>({url:'https://example.supabase.co',publishableKey:'sb_publishable_test'})}),
    crypto:{randomUUID:()=>'sample-id'},
    setTimeout,clearTimeout,setInterval,clearInterval,console
  });
  vm.runInContext(inline,context,{filename:'MUSA.inline.js'});
  vm.runInContext(auth,context,{filename:'MUSA.auth.js'});
  for(let i=0;i<15;i++)await Promise.resolve();
  return {route:location.pathname,hash:location.hash,screen:nodes.get('app').innerHTML};
}

test('a valid confirmation ends in a dedicated success screen and removes token from URL',async()=>{
  const result=await runCallback({hash:'#type=signup&access_token=placeholder',withSession:true});
  assert.equal(result.route,'/auth/success');
  assert.equal(result.hash,'');
  assert.match(result.screen,/TU CUENTA YA ESTÁ LISTA/);
  assert.match(result.screen,/Entrar a mi estudio/);
});
test('an expired link is routed to a recovery screen, not localhost',async()=>{
  const result=await runCallback({hash:'#error=access_denied&error_description=expired',withSession:false});
  assert.equal(result.route,'/auth/error');
  assert.match(result.screen,/NO PUDIMOS CONFIRMAR TU CUENTA/);
  assert.match(result.screen,/Reenviar confirmación/);
});
test('recovery links open the reset password form',async()=>{
  const result=await runCallback({hash:'#type=recovery&access_token=placeholder',withSession:true});
  assert.equal(result.route,'/auth/reset');
  assert.match(result.screen,/CREA TU NUEVA CLAVE/);
  assert.match(result.screen,/Confirmar contraseña/);
});
