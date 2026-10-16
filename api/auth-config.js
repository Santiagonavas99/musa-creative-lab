'use strict';
module.exports = function handler(req,res){
  if(req.method!=='GET'){res.setHeader('Allow','GET');return res.status(405).json({error:'Método no permitido'});}
  const url=process.env.MUSA_SUPABASE_URL;
  const publishableKey=process.env.MUSA_SUPABASE_PUBLISHABLE_KEY;
  if(!url||!publishableKey){res.setHeader('Cache-Control','no-store');return res.status(503).json({error:'Configuración de cuentas no disponible'});}
  res.setHeader('Cache-Control','public, max-age=60, s-maxage=60');
  return res.status(200).json({url,publishableKey});
};
