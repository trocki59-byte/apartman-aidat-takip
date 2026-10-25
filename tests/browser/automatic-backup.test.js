import test from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { readFileSync } from 'node:fs';
import { resolve, extname } from 'node:path';
import { initialData, executeLocal } from '../../public/local-store.js';
const require=createRequire(import.meta.url),{chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
async function fixture(t,{folder=false,legacy=false}={}) {
  const browser=await chromium.launch({headless:true,...(process.env.CHROMIUM_PATH?{executablePath:process.env.CHROMIUM_PATH}:{}),args:['--no-sandbox','--disable-dev-shm-usage']});t.after(()=>browser.close());
  const context=await browser.newContext({viewport:{width:1440,height:1000},locale:'tr-TR'});
  if(folder)await context.addInitScript(()=>{window.showDirectoryPicker=()=>navigator.storage.getDirectory();});
  const page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
  await context.route('https://backups.test/**',async route=>{
    const path=new URL(route.request().url()).pathname.replace('/app/','');
    if(path==='bootstrap'){await route.fulfill({status:200,contentType:'text/html',body:'<!doctype html><title>Bootstrap</title>'});return;}
    const file=resolve('dist',path||'index.html'),types={'.html':'text/html','.js':'text/javascript','.css':'text/css','.svg':'image/svg+xml'};
    try{await route.fulfill({status:200,contentType:types[extname(file)]||'text/plain',body:readFileSync(file)});}catch{await route.fulfill({status:404,body:'not found'});}
  });
  if(legacy){
    await page.goto('https://backups.test/app/bootstrap');
    const seed=executeLocal(initialData(),'unit.save',{number:'9',owner:'Eski kayıt',resident:'',phone:'',monthlyCents:200000,active:true}).data;
    await page.evaluate(seed=>new Promise((resolve,reject)=>{const r=indexedDB.open('apartman-aidat-takip',1);r.onupgradeneeded=()=>r.result.createObjectStore('records');r.onerror=()=>reject(r.error);r.onsuccess=()=>{const db=r.result,tx=db.transaction('records','readwrite');tx.objectStore('records').put(seed,'main');tx.oncomplete=()=>{db.close();resolve();};tx.onerror=()=>reject(tx.error);};}),seed);
  }
  await page.goto('https://backups.test/app/#units');
  await page.getByRole('button',{name:'Devam et',exact:true}).click();
  await page.getByRole('heading',{name:'Daireler',exact:true}).waitFor();
  return {page,errors};
}
async function addUnit(page,number){await page.getByRole('button',{name:'Daire Ekle',exact:true}).click();await page.getByLabel('Daire numarası',{exact:true}).fill(number);await page.getByRole('button',{name:'Kaydet',exact:true}).click();await page.getByRole('cell',{name:'Daire '+number,exact:true}).waitFor();}

test('otomatik geçmişten geri yükleme ve bozuk yedekte atomiklik',async t=>{
  const {page,errors}=await fixture(t);await addUnit(page,'1');await addUnit(page,'2');
  await page.getByRole('link',{name:'Ayarlar',exact:true}).click();
  await page.getByRole('heading',{name:'Otomatik Yedekleme',exact:true}).waitFor();
  await page.getByRole('button',{name:'Yedek Geçmişini Aç',exact:true}).click();
  const row=page.locator('dialog tr').filter({hasText:'1 daire · 0 tahsilat · 0 gider'});
  await row.getByRole('button',{name:'Bu yedeği geri yükle',exact:true}).click();
  await page.getByRole('button',{name:'Geri Yükle',exact:true}).click();
  await page.getByRole('link',{name:'Daireler',exact:true}).click();
  await page.getByRole('cell',{name:'Daire 1',exact:true}).waitFor();
  assert.equal(await page.getByRole('cell',{name:'Daire 2',exact:true}).count(),0);
  const result=await page.evaluate(async()=>{
    const {browserRequest:req}=await import('./local-db.js');const before=await req('data');
    let rejected=false;try{await req('restore',{backup:{bad:true}});}catch{rejected=true;}
    const after=await req('data');
    return {rejected,units:after.units.length,unchanged:JSON.stringify(before)===JSON.stringify(after),hasBeforeRestore:after.backups.some(b=>b.kind==='recent'&&b.units===2)};
  });
  assert.deepEqual(result,{rejected:true,units:1,unchanged:true,hasBeforeRestore:true});
  await page.reload();await page.getByRole('cell',{name:'Daire 1',exact:true}).waitFor();assert.deepEqual(errors,[]);
});

test('önceki IndexedDB v1 kayıtları korunarak otomatik yedeğe geçilir',async t=>{
  const {page,errors}=await fixture(t,{legacy:true});await page.getByRole('cell',{name:'Daire 9',exact:true}).waitFor();
  const info=await page.evaluate(async()=>{const {browserRequest:req}=await import('./local-db.js');const data=await req('data');return {owner:data.units[0].owner,backups:data.backups.length};});
  assert.equal(info.owner,'Eski kayıt');assert.equal(info.backups,1);assert.deepEqual(errors,[]);
});

test('klasöre otomatik JSON yazılır; disk hatasında mali kayıt korunur',async t=>{
  const {page,errors}=await fixture(t,{folder:true});
  await page.getByRole('link',{name:'Ayarlar',exact:true}).click();
  await page.getByRole('button',{name:'Yedek Klasörü Seç',exact:true}).click();
  await page.getByText('Klasöre otomatik yedekleme açıldı.',{exact:true}).waitFor();
  await page.getByRole('link',{name:'Daireler',exact:true}).click();await addUnit(page,'1');
  const file=await page.evaluate(async()=>{const root=await navigator.storage.getDirectory(),dir=await root.getDirectoryHandle('TROCKI-Aidat-Yedekleri'),f=await dir.getFileHandle('trocki-aidat-son-yedek.json');return JSON.parse(await (await f.getFile()).text());});
  assert.equal(file.units.length,1);assert.equal(file.units[0].number,'1');assert.equal(file.backupFormat,'aidat-browser-v1');
  const failure=await page.evaluate(async()=>{
    const {browserRequest:req}=await import('./local-db.js');
    const original=FileSystemDirectoryHandle.prototype.getDirectoryHandle;
    FileSystemDirectoryHandle.prototype.getDirectoryHandle=function(name,options){if(name==='TROCKI-Aidat-Yedekleri')return Promise.reject(new Error('Disk testi'));return original.call(this,name,options);};
    try{const result=await req('actions',{action:'unit.save',payload:{id:1,number:'1',owner:'Değişen malik',resident:'',phone:'',monthlyCents:200000,active:true}});const data=await req('data');return {ok:result.ok,owner:data.units[0].owner,fileState:data.backupInfo.fileInfo.state,internal:data.backups.length>1};}
    finally{FileSystemDirectoryHandle.prototype.getDirectoryHandle=original;}
  });
  assert.deepEqual(failure,{ok:true,owner:'Değişen malik',fileState:'error',internal:true});assert.deepEqual(errors,[]);
});

test('eşzamanlı iki sekme kaydı ve dosya yedeği en son sürümü korur',async t=>{
  const {page,errors}=await fixture(t,{folder:true});
  await page.getByRole('link',{name:'Ayarlar',exact:true}).click();await page.getByRole('button',{name:'Yedek Klasörü Seç',exact:true}).click();await page.getByText('Klasöre otomatik yedekleme açıldı.',{exact:true}).waitFor();
  const other=await page.context().newPage();other.on('pageerror',e=>errors.push(e.message));
  await other.goto('https://backups.test/app/#units');await other.getByRole('heading',{name:'Daireler',exact:true}).waitFor();
  const create=async(page,prefix)=>page.evaluate(async prefix=>{
    const {browserRequest:req}=await import('./local-db.js');
    await Promise.all(Array.from({length:6},(_,i)=>req('actions',{action:'unit.save',payload:{number:prefix+(i+1),owner:'',resident:'',phone:'',monthlyCents:200000,active:true}})));
  },prefix);
  await Promise.all([create(page,'A'),create(other,'B')]);
  const result=await page.evaluate(async()=>{
    const {browserRequest:req}=await import('./local-db.js');const data=await req('data');const root=await navigator.storage.getDirectory(),dir=await root.getDirectoryHandle('TROCKI-Aidat-Yedekleri'),file=await dir.getFileHandle('trocki-aidat-son-yedek.json');const backup=JSON.parse(await (await file.getFile()).text());
    return {units:data.units.length,unique:new Set(data.units.map(u=>u.id)).size,fileUnits:backup.units.length,recent:data.backupInfo.recentCount};
  });
  assert.deepEqual(result,{units:12,unique:12,fileUnits:12,recent:10});assert.deepEqual(errors,[]);
});
