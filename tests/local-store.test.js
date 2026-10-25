import test from 'node:test';
import assert from 'node:assert/strict';
import { createStore } from '../src/store.js';
import { initialData, executeLocal, snapshotLocal, restoreBackup } from '../public/local-store.js';
const unit = { number: '1', owner: 'Ayşe', resident: 'Ali', phone: '', monthlyCents: 200000, active: true };
function createPair(t) {
  const server = createStore(':memory:'); t.after(() => server.close());
  let local = initialData();
  return { run(action,payload) { const result=executeLocal(local,action,payload); server.execute(action,payload); local=result.data; return result.result; }, local:()=>snapshotLocal(local), server:()=>server.snapshot(), raw:()=>local };
}
function financial(d) { return { debts:d.units.map(u=>u.debtCents), advances:d.units.map(u=>u.advanceCents), charges:d.charges.map(c=>[c.id,c.amountCents,c.paidCents,c.voidReason||null]), accounts:d.accounts.map(a=>a.balanceCents), allocations:d.allocations }; }
const payment=(unitId,amountCents,requestKey='payment-1')=>({unitId,amountCents,accountId:1,date:'2026-10-25',note:'',requestKey});
test('tarayıcı mali sonuçları SQLite ile eşleşir: borç, avans, transfer ve iptal', t=>{
  const s=createPair(t); const u=s.run('unit.save',unit);
  s.run('charge.batch',{period:'2026-09',dueDate:'2026-09-10'});
  s.run('charge.batch',{period:'2026-10',dueDate:'2026-10-10'});
  s.run('payment.add',{...payment(u.id,250000),chargeId:2});
  assert.deepEqual(financial(s.local()),financial(s.server()));
  s.run('payment.add',payment(u.id,200000,'payment-2'));
  assert.equal(s.local().units[0].advanceCents,50000);
  s.run('expense.add',{accountId:1,date:'2026-10-25',category:'Su',amountCents:10000,note:''});
  s.run('transfer.add',{fromId:1,toId:2,date:'2026-10-25',amountCents:100000,note:''});
  s.run('record.void',{type:'payments',id:1,reason:'Hatalı ödeme'});
  assert.deepEqual(financial(s.local()),financial(s.server()));
});
test('tekrar ödeme engellenir ve hata önceki tarayıcı verisini değiştirmez',()=>{
  let d=executeLocal(initialData(),'unit.save',unit).data;
  d=executeLocal(d,'payment.add',payment(1,10000)).data;
  const retry=executeLocal(d,'payment.add',payment(1,10000));
  assert.equal(retry.result.duplicate,true);assert.equal(retry.data.payments.length,1);
  const original=structuredClone(d);
  assert.throws(()=>executeLocal(d,'payment.add',payment(1,-1,'bad')));
  assert.deepEqual(d,original);
});
test('arşiv daire atlanır ve aynı dönem tekrar aidatı reddedilir',()=>{
  let d=executeLocal(initialData(),'unit.save',unit).data;
  d=executeLocal(d,'unit.save',{...unit,number:'2',active:false}).data;
  d=executeLocal(d,'charge.batch',{period:'2026-10',dueDate:'2026-10-10'}).data;
  assert.equal(d.charges.length,1);
  assert.throws(()=>executeLocal(d,'charge.batch',{period:'2026-10',dueDate:'2026-10-10'}));
});
test('JSON yedek geri yüklenir; bozuk tutar veya kırık referans kabul edilmez',()=>{
  let d=executeLocal(initialData(),'unit.save',unit).data;
  d=executeLocal(d,'payment.add',payment(1,12345)).data;
  const backup={...snapshotLocal(d),backupFormat:'aidat-browser-v1'};
  assert.equal(snapshotLocal(restoreBackup(backup)).units[0].advanceCents,12345);
  const bad=structuredClone(backup);bad.payments[0].amountCents=-1;
  assert.throws(()=>restoreBackup(bad));
  const broken=structuredClone(backup);broken.payments[0].unitId=999;
  assert.throws(()=>restoreBackup(broken));
  assert.throws(()=>restoreBackup({}));
});
