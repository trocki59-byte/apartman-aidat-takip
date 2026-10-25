import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createStore } from '../src/store.js';

const unit = { number: '1', owner: 'Ayşe Yılmaz', resident: 'Ali Kaya', phone: '', monthlyCents: 200000, active: true };
function fixture(t) { const s = createStore(':memory:'); t.after(() => s.close()); return s; }
function addUnit(s, fields = {}) { return s.execute('unit.save', { ...unit, ...fields }); }
function pay(s, unitId, amountCents, key = crypto.randomUUID()) {
  return s.execute('payment.add', { unitId, amountCents, date: '2026-10-25', accountId: 1, note: '', requestKey: key });
}
test('aidat tahakkuku kasaya girmez; arşiv daire atlanır ve tekrar önlenir', t => {
  const s = fixture(t); addUnit(s); addUnit(s, { number: '2', active: false });
  s.execute('charge.batch', { period: '2026-10', dueDate: '2026-10-31' });
  assert.equal(s.snapshot().charges.length, 1);
  assert.equal(s.snapshot().accounts[0].balanceCents, 0);
  assert.throws(() => s.execute('charge.batch', { period: '2026-10', dueDate: '2026-10-31' }), /zaten/);
  assert.equal(s.snapshot().charges.length, 1);
});
test('kısmi ödeme en eski borca gider, fazla ödeme yeni borcu karşılar', t => {
  const s = fixture(t); const u = addUnit(s);
  s.execute('charge.batch', { period: '2026-09', dueDate: '2026-09-30' });
  pay(s, u.id, 50000);
  assert.equal(s.snapshot().charges[0].paidCents, 50000);
  pay(s, u.id, 200000);
  assert.equal(s.snapshot().units[0].advanceCents, 50000);
  s.execute('charge.batch', { period: '2026-10', dueDate: '2026-10-31' });
  assert.equal(s.snapshot().charges[1].paidCents, 50000);
  assert.equal(s.snapshot().units[0].debtCents, 150000);
  assert.equal(s.snapshot().units[0].advanceCents, 0);
});
test('tahsilat tekrarı ikinci kez kaydedilmez; değişen istek reddedilir', t => {
  const s = fixture(t); const u = addUnit(s); const k = crypto.randomUUID();
  pay(s, u.id, 12345, k); pay(s, u.id, 12345, k);
  assert.equal(s.snapshot().payments.length, 1);
  assert.equal(s.snapshot().accounts[0].balanceCents, 12345);
  assert.throws(() => pay(s, u.id, 12346, k), /farklı/);
});
test('başlangıç borcu ve kasa açılışı ayrı; gider ve transfer bakiyeleri doğru', t => {
  const s = fixture(t); const u = addUnit(s);
  s.execute('charge.add', { unitId: u.id, kind: 'opening', amountCents: 100000, dueDate: '2026-10-01', note: 'Devir borcu' });
  assert.equal(s.snapshot().accounts[0].balanceCents, 0);
  s.execute('account.opening', { id: 1, openingCents: 500000 });
  s.execute('expense.add', { amountCents: 25000, date: '2026-10-25', accountId: 1, category: 'Temizlik', note: 'Temizlik' });
  s.execute('transfer.add', { fromId: 1, toId: 2, amountCents: 100000, date: '2026-10-25', note: '' });
  assert.deepEqual(s.snapshot().accounts.map(a => a.balanceCents), [375000, 100000]);
});
test('iptal gerekçe ve iz bırakır; dağılım geri alınır', t => {
  const s = fixture(t); const u = addUnit(s);
  s.execute('charge.batch', { period: '2026-10', dueDate: '2026-10-31' });
  const p = pay(s, u.id, 50000);
  assert.throws(() => s.execute('record.void', { type: 'payments', id: p.id, reason: '' }), /gerekçe/i);
  s.execute('record.void', { type: 'payments', id: p.id, reason: 'Hatalı kayıt' });
  const data = s.snapshot();
  assert.equal(data.charges[0].paidCents, 0);
  assert.equal(data.accounts[0].balanceCents, 0);
  assert.equal(data.payments[0].voidReason, 'Hatalı kayıt');
  assert.ok(data.audit.some(a => a.action === 'record.void'));
});
test('bozuk tarih, tutar, daire, dönem ve id atomik olarak reddedilir', t => {
  const s = fixture(t); const u = addUnit(s);
  for (const amountCents of [-1, 0, 1.3, NaN, 100000000001]) assert.throws(() => pay(s, u.id, amountCents));
  assert.throws(() => pay(s, 999, 1000));
  assert.throws(() => s.execute('charge.batch', { period: '2026-13', dueDate: '2026-10-31' }));
  assert.throws(() => s.execute('charge.add', { unitId: u.id, kind: 'extra', amountCents: 100, dueDate: '2026-02-30', note: 'Ek' }));
  assert.throws(() => addUnit(s, { number: '1' }));
  assert.equal(s.snapshot().payments.length, 0);
  assert.equal(s.snapshot().charges.length, 0);
});
test('seçilen borca ödeme uygulanır; kalanı en eskiye gider', t => {
  const s = fixture(t); const u = addUnit(s);
  s.execute('charge.batch', { period: '2026-09', dueDate: '2026-09-30' });
  s.execute('charge.batch', { period: '2026-10', dueDate: '2026-10-31' });
  const c = s.snapshot().charges[1];
  s.execute('payment.add', { unitId: u.id, chargeId: c.id, amountCents: 250000, date: '2026-10-25', accountId: 1, requestKey: crypto.randomUUID() });
  assert.deepEqual(s.snapshot().charges.map(c => c.paidCents), [50000, 200000]);
});
test('dosya yeniden açıldığında kayıtlar korunur', t => {
  const dir = mkdtempSync(join(tmpdir(), 'aidat-')); t.after(() => rmSync(dir, { recursive: true, force: true }));
  const path = join(dir, 'db.sqlite'); let s = createStore(path); const u = addUnit(s); pay(s, u.id, 98765); s.close();
  s = createStore(path); t.after(() => s.close());
  assert.equal(s.snapshot().payments[0].amountCents, 98765);
  assert.equal(s.snapshot().units[0].number, '1');
});
