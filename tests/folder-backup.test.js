import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, mkdir, writeFile, readFile, readdir, rm } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { initialData } from '../public/local-store.js';
import { writeFolderBackup } from '../public/folder-backup.js';
function directory(path) {
  return {kind:'directory',name:'Yedekler',queryPermission:async()=> 'granted',async getDirectoryHandle(name){const p=join(path,name);await mkdir(p,{recursive:true});return directory(p);},async getFileHandle(name){return {async createWritable(){let content;return {async write(value){content=value;},async close(){await writeFile(join(path,name),content);},async abort(){}};}};},async *entries(){for(const name of await readdir(path))yield [name,{kind:'file'}];},async removeEntry(name){await rm(join(path,name));}};
}
test('otomatik dosya yedeği son sürümü ve İstanbul gününe ait JSONu yazar',async t=>{
  const path=await mkdtemp(join(tmpdir(),'aidat-folder-'));t.after(()=>rm(path,{recursive:true,force:true}));
  const result=await writeFolderBackup(directory(path),initialData(),{now:'2026-10-25T21:01:00Z'});
  assert.equal(result.state,'ok');
  const content=JSON.parse(await readFile(join(path,'TROCKI-Aidat-Yedekleri','trocki-aidat-son-yedek.json'),'utf8'));
  assert.equal(content.backupFormat,'aidat-browser-v1');
  assert.equal(content.exportedAt,'2026-10-25T21:01:00.000Z');
  assert.deepEqual(await readdir(join(path,'TROCKI-Aidat-Yedekleri')),['trocki-aidat-2026-10-26.json','trocki-aidat-son-yedek.json']);
});
test('günlük dosya geçmişi 30 ile sınırlıdır ve ilgisiz dosyalara dokunulmaz',async t=>{
  const path=await mkdtemp(join(tmpdir(),'aidat-folder-'));t.after(()=>rm(path,{recursive:true,force:true}));
  const handle=directory(path);const folder=join(path,'TROCKI-Aidat-Yedekleri');await mkdir(folder);await writeFile(join(folder,'notlar.txt'),'koru');
  for(let i=0;i<35;i++)assert.equal((await writeFolderBackup(handle,initialData(),{now:new Date(Date.UTC(2026,8,i+1,12))})).state,'ok');
  const files=await readdir(folder);assert.equal(files.filter(f=>/^trocki-aidat-\d{4}-\d{2}-\d{2}\.json$/.test(f)).length,30);
  assert.equal(await readFile(join(folder,'notlar.txt'),'utf8'),'koru');
});
test('izin yokken otomatik pencere açılmaz; dosya hatası açık durum döndürür',async()=>{
  const h={kind:'directory',queryPermission:async()=> 'prompt',getDirectoryHandle(){assert.fail('İzinsiz dosya yazımı');}};
  assert.equal((await writeFolderBackup(h,initialData())).state,'permission');
  const bad={kind:'directory',queryPermission:async()=> 'granted',async getDirectoryHandle(){throw new Error('Disk dolu');}};
  assert.equal((await writeFolderBackup(bad,initialData())).state,'error');
});
