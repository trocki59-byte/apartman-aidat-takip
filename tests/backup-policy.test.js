import test from 'node:test';
import assert from 'node:assert/strict';
import { initialData, executeLocal } from '../public/local-store.js';
import { createCheckpoint, backupDay, backupMetadata } from '../public/backup-policy.js';
const unit={number:'1',owner:'Ayşe',resident:'',phone:'',monthlyCents:200000,active:true};
test('otomatik yedek işlem öncesini ve güncel sürümü ayrı saklar',()=>{
  const before=initialData(), after=executeLocal(before,'unit.save',unit).data;
  const history=createCheckpoint([],after,{previous:before,reason:'Daire kaydedildi',now:'2026-10-25T19:00:00Z'});
  assert.equal(history.length,2);
  assert.equal(history.find(b=>b.kind==='daily').backup.units.length,1);
  assert.equal(history.find(b=>b.kind==='recent').backup.units.length,0);
  assert.equal(backupMetadata(history)[0].units,1);
  assert.ok(!('backup' in backupMetadata(history)[0]));
});
test('İstanbul gece yarısı günlük yedek tarihini değiştirir',()=>{
  assert.equal(backupDay('2026-10-25T20:59:59Z'),'2026-10-25');
  assert.equal(backupDay('2026-10-25T21:00:00Z'),'2026-10-26');
});
test('son 30 gün ve son 10 işlem öncesi korunur; günlük yedek aynı gün güncellenir',()=>{
  let history=[],data=initialData();
  for(let i=0;i<40;i++){
    const now=new Date(Date.UTC(2026,8,i+1,12)).toISOString();
    const next=executeLocal(data,'settings.save',{name:'Apartman '+i,address:'',monthlyCents:10000,dueDay:10}).data;
    history=createCheckpoint(history,next,{previous:data,reason:'Ayarlar',now});data=next;
  }
  assert.equal(history.filter(b=>b.kind==='daily').length,30);
  assert.equal(history.filter(b=>b.kind==='recent').length,10);
  const latest=history.find(b=>b.kind==='daily');
  assert.equal(latest.backup.settings.name,'Apartman 39');
  const updated=executeLocal(data,'unit.save',unit).data;
  history=createCheckpoint(history,updated,{previous:data,reason:'Daire',now:latest.createdAt});
  assert.equal(history.filter(b=>b.kind==='daily').length,30);
  assert.equal(history.find(b=>b.kind==='daily').backup.units.length,1);
});
