import { backupDay } from './backup-policy.js';
import { snapshotLocal } from './local-store.js';
export async function folderPermission(handle) {
  if(!handle || handle.kind!=='directory')return 'denied';
  try {return typeof handle.queryPermission==='function' ? await handle.queryPermission({mode:'readwrite'}) : 'granted';}
  catch {return 'denied';}
}
async function writeJson(directory,name,content) {
  const file=await directory.getFileHandle(name,{create:true});
  const stream=await file.createWritable();
  try {await stream.write(content);await stream.close();}
  catch(error){try{await stream.abort();}catch{}throw error;}
}
export async function writeFolderBackup(handle,data,{now=new Date()}={}) {
  if(await folderPermission(handle)!=='granted')return {state:'permission',message:'Yedek klasörüne yeniden izin verin. Tarayıcı içi yedekler devam ediyor.'};
  try {
    const folder=await handle.getDirectoryHandle('TROCKI-Aidat-Yedekleri',{create:true});
    const exportedAt=new Date(now).toISOString();
    const content=JSON.stringify({exportedAt,...snapshotLocal(data)},null,2);
    await writeJson(folder,'trocki-aidat-son-yedek.json',content);
    await writeJson(folder,`trocki-aidat-${backupDay(now)}.json`,content);
    const names=[];
    for await(const [name,entry] of folder.entries())if(entry.kind==='file'&&/^trocki-aidat-\d{4}-\d{2}-\d{2}\.json$/.test(name))names.push(name);
    for(const name of names.sort().reverse().slice(30))await folder.removeEntry(name);
    return {state:'ok',lastSavedAt:exportedAt,message:'Klasöre otomatik yedeklendi.'};
  } catch(error) {return {state:'error',message:`Dosya yedeği kaydedilemedi: ${error.message || 'Klasör erişimini kontrol edin.'}`};}
}
