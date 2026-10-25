import test from 'node:test';
import assert from 'node:assert/strict';
import { parseMoney, csv, overview, reportRows } from '../public/reports.js';
test('Türkçe para girişi kuruşa tam çevrilir; bozuk ve negatif değer reddedilir', () => {
  assert.equal(parseMoney('1.234,56'), 123456);
  assert.equal(parseMoney('2000'), 200000);
  assert.equal(parseMoney('0,01'), 1);
  for (const s of ['-1', '1,234', '1.23', '', 'NaN', '12abc', '1e3']) assert.throws(() => parseMoney(s));
});
test('CSV formül enjeksiyonu engellenir ve hücreler doğru kaçırılır', () => {
  const output = csv([['Ad', 'Tutar'], ['=HYPERLINK("x")', '1.000,00'], ['A;B\nC', 4]]);
  assert.ok(output.startsWith('\uFEFF'));
  assert.ok(output.includes(`"'=HYPERLINK(""x"")"`));
  assert.ok(output.includes('"A;B\nC"'));
});
const data = { units: [{ id: 1, number: '1', resident: 'Ayşe', owner: '', debtCents: 100000, advanceCents: 0 }], charges: [{ id: 1, unitId: 1, period: '2026-10', dueDate: '2026-10-10', amountCents: 200000, paidCents: 100000 }], payments: [{ id: 1, unitId: 1, date: '2026-10-12', amountCents: 100000, accountId: 1 }, { id: 2, unitId: 1, date: '2026-10-14', amountCents: 50000, accountId: 1, voidReason: 'Hata' }], expenses: [{ id: 1, date: '2026-10-15', category: 'Su', amountCents: 25000, accountId: 1 }], accounts: [{ id: 1, name: 'Nakit', balanceCents: 75000 }], transfers: [] };
test('dönem özeti iptalleri dışlar; borç ile nakdi karıştırmaz', () => {
  assert.deepEqual(overview(data, '2026-10'), { charged: 200000, collected: 100000, outstanding: 100000, balance: 75000, spent: 25000 });
  assert.equal(overview(data, '2026-09').collected, 0);
});
test('rapor dönem ve daire filtresi uygular; iptal kayıtlarını çıkarır', () => {
  const rows = reportRows(data, 'payments', '2026-10', '1');
  assert.equal(rows.length, 2); assert.equal(rows[1][0], '#1');
  assert.equal(reportRows(data, 'payments', '2026-09', '1').length, 1);
  assert.equal(reportRows(data, 'debts', '2026-10', '2').length, 1);
});
