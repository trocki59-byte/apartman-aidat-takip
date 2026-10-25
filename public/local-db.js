import { initialData, snapshotLocal, executeLocal, restoreBackup } from './local-store.js';
import { createCheckpoint, backupDay, backupMetadata } from './backup-policy.js';
import { folderPermission, writeFolderBackup } from './folder-backup.js';
let opened;
function open() {
  if(opened)return opened;
  opened=new Promise((resolve,reject)=>{
    if(!globalThis.indexedDB){reject(new Error('Bu tarayıcı kayıt saklamayı desteklemiyor. Güncel Safari, Chrome veya Firefox kullanın.'));return;}
    const request=indexedDB.open('apartman-aidat-takip',2);
    request.onupgradeneeded=()=>{
      const db=request.result;
      if(!db.objectStoreNames.contains('records'))db.createObjectStore('records');
      if(!db.objectStoreNames.contains('backups'))db.createObjectStore('backups');
    };
    request.onerror=()=>reject(new Error('Tarayıcı depolaması açılamadı. Sayfayı yenileyip tekrar deneyin.'));
    request.onblocked=()=>reject(new Error('Güncelleme için diğer açık uygulama sekmelerini kapatıp tekrar deneyin.'));
    request.onsuccess=()=>{const db=request.result;db.onversionchange=()=>{db.close();opened=null;};resolve(db);};
  }).catch(error=>{opened=null;throw error;});
  return opened;
}
async function transaction(callback,write=false) {
  const db=await open();
  return new Promise((resolve,reject)=>{
    let output,failed,pending=4;
    const tx=db.transaction(['records','backups'],write?'readwrite':'readonly');
    const records=tx.objectStore('records'), backups=tx.objectStore('backups');
    const main=records.get('main'), history=backups.get('archive'), directory=records.get('backup-directory'), file=records.get('backup-file-status');
    tx.oncomplete=()=>resolve(output);
    tx.onerror=()=>{failed ||= tx.error;};
    tx.onabort=()=>reject(failed || new Error('Kayıt ve yedek saklanamadı. Tarayıcı alanını ve izinlerini kontrol edin.'));
    const ready=()=>{
      if(--pending)return;
      try {
        const result=callback({data:main.result||initialData(),archive:history.result||[],handle:directory.result?.handle||directory.result,directoryId:directory.result?.id,fileInfo:file.result||{}},records);
        output=result.value;
        if(write){if(result.data)records.put(result.data,'main');if(result.archive)backups.put(result.archive,'archive');}
      }catch(error){failed=error;tx.abort();}
    };
    for(const r of [main,history,directory,file])r.onsuccess=ready;
  });
}
const stored=()=>transaction(context=>({value:context}));
export function supportsFolderBackup() {return typeof globalThis.showDirectoryPicker==='function' && !!globalThis.navigator?.locks;}
async function saveFolderLatest() {
  const run=async()=>{
    const context=await stored();if(!context.handle)return;
    const result=await writeFolderBackup(context.handle,context.data);
    await transaction((current,records)=>{
      // Folder settings may have changed while a file was being written.
      if(current.handle && current.directoryId===context.directoryId)records.put(result,'backup-file-status');
      return {value:result};
    },true);
  };
  try {if(globalThis.navigator?.locks)await navigator.locks.request('apartman-aidat-file-backup',run);}
  catch(error){try{await transaction((context,records)=>{records.put({state:'error',message:'Dosya yedeği tamamlanamadı. Kayıtlar ve tarayıcı içi yedekler saklandı.'},'backup-file-status');return {value:null};},true);}catch{}}
}
async function getData() {
  let changed=false;
  let context=await transaction(c=>{
    let archive=c.archive;
    if(!archive.some(b=>b.id===`daily:${backupDay()}`)){archive=createCheckpoint(archive,c.data);changed=true;}
    return {archive:changed?archive:undefined,value:{...c,archive}};
  },true);
  if(changed&&context.handle){await saveFolderLatest();context=await stored();}
  const metadata=backupMetadata(context.archive);
  const permission=context.handle?await folderPermission(context.handle):null;
  const fileInfo=context.handle&&permission!=='granted'?{...context.fileInfo,state:'permission',message:'Yedek klasörüne yeniden izin verin. Tarayıcı içi yedekler devam ediyor.'}:context.fileInfo;
  return {...snapshotLocal(context.data),backups:metadata,backupInfo:{lastSavedAt:metadata[0]?.createdAt||null,dailyCount:metadata.filter(b=>b.kind==='daily').length,recentCount:metadata.filter(b=>b.kind==='recent').length,folderConfigured:!!context.handle,folderName:context.handle?.name||'Seçilen klasör',folderSupported:supportsFolderBackup(),fileInfo}};
}
function restoredData(backup,source) {
  const data=restoreBackup(backup);
  data.audit.push({id:data.audit.reduce((n,r)=>Math.max(n,r.id),0)+1,action:'backup.restore',payload:JSON.stringify({source}),createdAt:new Date().toISOString()});
  data.audit=data.audit.sort((a,b)=>a.id-b.id).slice(-500);return data;
}
export async function browserRequest(path,body) {
  if(path==='session')return {authenticated:true,passwordRequired:false,csrf:'browser-local',setupRequired:false,storageMode:'browser'};
  if(path==='data')return getData();
  if(path==='actions'){
    const value=await transaction(c=>{
      const result=executeLocal(c.data,body.action,body.payload);
      return {data:result.result.duplicate?undefined:result.data,archive:result.result.duplicate?undefined:createCheckpoint(c.archive,result.data,{previous:c.data,reason:'Kayıt değişikliği'}),value:{ok:true,result:result.result}};
    },true);
    await saveFolderLatest();return value;
  }
  if(path==='restore'||path==='backups.restore'){
    const result=await transaction(c=>{
      const backup=path==='restore'?body.backup:c.archive.find(b=>b.id===body.id)?.backup;
      if(!backup)throw new Error('Geri yüklenecek yedek bulunamadı.');
      const data=restoredData(backup,path==='restore'?'JSON dosyası':body.id);
      return {data,archive:createCheckpoint(c.archive,data,{previous:c.data,reason:'Geri yükleme'}),value:{ok:true}};
    },true);
    await saveFolderLatest();return result;
  }
  if(path==='backups.get')return transaction(c=>{const b=c.archive.find(r=>r.id===body.id);if(!b)throw new Error('Yedek bulunamadı.');return {value:{backup:{exportedAt:b.createdAt,...b.backup},createdAt:b.createdAt}};});
  if(path==='backups.directory'){
    if(!supportsFolderBackup())throw new Error('Bu tarayıcı otomatik klasör yedeğini desteklemiyor.');
    const handle=body.handle;
    if(!handle||handle.kind!=='directory'||await folderPermission(handle)!=='granted')throw new Error('Yazma izni olan bir klasör seçin.');
    await transaction((c,records)=>{records.put({id:crypto.randomUUID(),handle},'backup-directory');records.put({state:'pending',message:'İlk dosya yedeği hazırlanıyor.'},'backup-file-status');return {value:null};},true);
    await saveFolderLatest();return {ok:true};
  }
  if(path==='backups.permission'){
    const c=await stored();if(!c.handle)throw new Error('Önce bir yedek klasörü seçin.');
    if(typeof c.handle.requestPermission==='function'&&await c.handle.requestPermission({mode:'readwrite'})!=='granted')throw new Error('Klasör yazma izni verilmedi.');
    await saveFolderLatest();return {ok:true};
  }
  if(path==='backups.disconnect'){
    await transaction((c,records)=>{records.delete('backup-directory');records.delete('backup-file-status');return {value:null};},true);return {ok:true};
  }
  throw new Error('Bu işlem ücretsiz tarayıcı sürümünde kullanılamaz.');
}
