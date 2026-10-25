export const money = value => new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY', maximumFractionDigits: 2 }).format(value / 100);
export const numberInput = value => (value / 100).toFixed(2).replace('.', ',');
export const displayDate = value => value ? new Date(value.slice(0, 10) + 'T12:00:00').toLocaleDateString('tr-TR') : '—';
export function today() { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; }
export function parseMoney(value, signed = false) {
  const s = String(value).trim();
  if (!/^-?(?:\d+|\d{1,3}(?:\.\d{3})+)(?:,\d{1,2})?$/.test(s) || (!signed && s.startsWith('-'))) throw new Error('Tutarı 1.234,56 biçiminde girin.');
  const [whole, fraction = ''] = s.replaceAll('.', '').replace('-', '').split(',');
  const result = (Number(whole) * 100 + Number(fraction.padEnd(2, '0'))) * (s.startsWith('-') ? -1 : 1);
  if (!Number.isSafeInteger(result) || Math.abs(result) > 100000000000) throw new Error('Tutar en fazla 1 milyar TL olabilir.');
  return result;
}
export function csv(rows) {
  return '\uFEFF' + rows.map(row => row.map(cell => {
    let s = String(cell ?? ''); if (/^[\s]*[=+@\-]/.test(s)) s = "'" + s;
    return '"' + s.replaceAll('"', '""') + '"';
  }).join(';')).join('\r\n');
}
export function overview(data, month) {
  const sum = (rows, key = 'amountCents') => rows.reduce((s, row) => s + row[key], 0);
  const charges = data.charges.filter(c => !c.voidReason && (c.period || c.dueDate.slice(0, 7)) === month);
  return { charged: sum(charges), collected: sum(data.payments.filter(p => !p.voidReason && p.date.startsWith(month))), outstanding: charges.reduce((s, c) => s + c.amountCents - c.paidCents, 0), balance: sum(data.accounts, 'balanceCents'), spent: sum(data.expenses.filter(e => !e.voidReason && e.date.startsWith(month))) };
}
export function reportRows(data, type, month, unitId = '') {
  const unit = id => data.units.find(u => u.id === id);
  const account = id => data.accounts.find(a => a.id === id)?.name || '—';
  const matchesUnit = row => !unitId || String(row.unitId) === String(unitId);
  if (type === 'debts') return [['Daire', 'Sakin', 'Dönem', 'Son ödeme', 'Borç', 'Ödenen', 'Kalan'], ...data.charges.filter(c => !c.voidReason && c.amountCents > c.paidCents && (!month || (c.period || c.dueDate.slice(0, 7)) === month) && matchesUnit(c)).map(c => [unit(c.unitId)?.number, unit(c.unitId)?.resident || unit(c.unitId)?.owner, c.period || 'Ek/Devir', displayDate(c.dueDate), money(c.amountCents), money(c.paidCents), money(c.amountCents - c.paidCents)])];
  if (type === 'payments') return [['Makbuz', 'Tarih', 'Daire', 'Hesap', 'Tutar', 'Açıklama'], ...data.payments.filter(p => !p.voidReason && (!month || p.date.startsWith(month)) && matchesUnit(p)).map(p => ['#' + p.id, displayDate(p.date), unit(p.unitId)?.number, account(p.accountId), money(p.amountCents), p.note])];
  if (type === 'expenses') return [['Kayıt', 'Tarih', 'Kategori', 'Hesap', 'Tutar', 'Açıklama'], ...data.expenses.filter(e => !e.voidReason && (!month || e.date.startsWith(month))).map(e => ['#' + e.id, displayDate(e.date), e.category, account(e.accountId), money(e.amountCents), e.note])];
  return [['Daire', 'Malik', 'Sakin', 'Güncel borç', 'Avans'], ...data.units.filter(u => !unitId || String(u.id) === String(unitId)).map(u => [u.number, u.owner, u.resident, money(u.debtCents), money(u.advanceCents)])];
}
