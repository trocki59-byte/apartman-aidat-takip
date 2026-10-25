export class InputError extends Error {
  constructor(message, status = 400) { super(message); this.status = status; }
}
export function ensure(condition, message, status = 400) { if (!condition) throw new InputError(message, status); }
export function text(value, label, max = 200, required = false) {
  ensure(typeof value === 'string', `${label} metin olmalı.`);
  const result = value.trim();
  ensure(result.length <= max && (!required || result.length > 0), `${label} alanını kontrol edin (en fazla ${max} karakter).`);
  return result;
}
export function cents(value, allowZero = false, signed = false) {
  ensure(Number.isSafeInteger(value) && Math.abs(value) <= 100000000000 && (signed || value >= (allowZero ? 0 : 1)), 'Geçerli bir tutar girin (en fazla 1 milyar TL).');
  return value;
}
export function id(value) { ensure(Number.isSafeInteger(value) && value > 0, 'Geçerli bir kayıt seçin.'); return value; }
export function date(value) {
  ensure(typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value) && value >= '1900-01-01' && value <= '2199-12-31', 'Geçerli bir tarih girin.');
  const parsed = new Date(value + 'T12:00:00Z');
  ensure(Number.isFinite(parsed.getTime()) && parsed.toISOString().slice(0, 10) === value, 'Geçerli bir tarih girin.');
  return value;
}
export function period(value) { ensure(typeof value === 'string' && /^(19|20|21)\d{2}-(0[1-9]|1[0-2])$/.test(value), 'Geçerli bir dönem seçin.'); return value; }
