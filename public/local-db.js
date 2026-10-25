import { initialData, snapshotLocal, executeLocal, restoreBackup } from './local-store.js';
let opened;
function open() {
  if (opened) return opened;
  opened = new Promise((resolve,reject) => {
    if (!globalThis.indexedDB) { reject(new Error('Bu tarayıcı kayıt saklamayı desteklemiyor. Güncel Safari, Chrome veya Firefox kullanın.')); return; }
    const request = indexedDB.open('apartman-aidat-takip',1);
    request.onupgradeneeded=()=>request.result.createObjectStore('records');
    request.onerror=()=>reject(new Error('Tarayıcı depolaması açılamadı. Gizli gezinmeyi kapatıp tekrar deneyin.'));
    request.onblocked=()=>reject(new Error('Diğer açık uygulama sekmelerini kapatıp tekrar deneyin.'));
    request.onsuccess=()=>{const db=request.result;db.onversionchange=()=>{db.close();opened=null;};resolve(db);};
  }).catch(error=>{opened=null;throw error;});
  return opened;
}
async function transaction(callback,write=false) {
  const db=await open();
  return new Promise((resolve,reject)=>{
    let output,failed;
    const tx=db.transaction('records',write?'readwrite':'readonly');
    const store=tx.objectStore('records'), get=store.get('main');
    tx.oncomplete=()=>resolve(output);
    tx.onerror=()=>{failed ||= tx.error;};
    tx.onabort=()=>reject(failed || new Error('Kayıt saklanamadı. Tarayıcı depolama alanını ve izinlerini kontrol edin.'));
    get.onsuccess=()=>{
      try {const result=callback(get.result || initialData());output=result.value;if(write)store.put(result.data,'main');}
      catch(error){failed=error;tx.abort();}
    };
  });
}
export async function browserRequest(path,body) {
  if(path==='session')return {authenticated:true,passwordRequired:false,csrf:'browser-local',setupRequired:false,storageMode:'browser'};
  if(path==='data')return transaction(data=>({value:snapshotLocal(data)}));
  if(path==='actions')return transaction(data=>{const result=executeLocal(data,body.action,body.payload);return {data:result.data,value:{ok:true,result:result.result}};},true);
  if(path==='restore')return transaction(()=>({data:restoreBackup(body.backup),value:{ok:true}}),true);
  throw new Error('Bu işlem ücretsiz tarayıcı sürümünde kullanılamaz.');
}
