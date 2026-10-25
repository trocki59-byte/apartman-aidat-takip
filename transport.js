import { browserRequest } from './local-db.js';
export const storageMode = 'browser';
export async function request(path,body) {
  try {return new Response(JSON.stringify(await browserRequest(path,body)),{status:200,headers:{'Content-Type':'application/json'}});}
  catch(error){return new Response(JSON.stringify({error:error.message || 'Kayıt tamamlanamadı.'}),{status:error.status || 400,headers:{'Content-Type':'application/json'}});}
}
