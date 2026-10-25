import { DatabaseSync } from 'node:sqlite';
import { mkdirSync } from 'node:fs';
import { dirname } from 'node:path';
import { ensure, cents, id, text, date, period, InputError } from './validation.js';

export function createStore(path) {
  if (path !== ':memory:') mkdirSync(dirname(path), { recursive: true, mode: 0o700 });
  const db = new DatabaseSync(path);
  db.exec(`PRAGMA foreign_keys=ON; PRAGMA journal_mode=WAL; PRAGMA busy_timeout=5000;
    CREATE TABLE IF NOT EXISTS settings (id INTEGER PRIMARY KEY CHECK(id=1), name TEXT NOT NULL DEFAULT 'Apartman Yönetimi', address TEXT NOT NULL DEFAULT '', monthlyCents INTEGER NOT NULL DEFAULT 200000, dueDay INTEGER NOT NULL DEFAULT 10);
    INSERT OR IGNORE INTO settings(id) VALUES(1);
    CREATE TABLE IF NOT EXISTS units(id INTEGER PRIMARY KEY, number TEXT NOT NULL UNIQUE, owner TEXT NOT NULL, resident TEXT NOT NULL, phone TEXT NOT NULL, monthlyCents INTEGER NOT NULL CHECK(monthlyCents>=0), active INTEGER NOT NULL DEFAULT 1);
    CREATE TABLE IF NOT EXISTS accounts(id INTEGER PRIMARY KEY, name TEXT NOT NULL, openingCents INTEGER NOT NULL DEFAULT 0);
    INSERT OR IGNORE INTO accounts(id,name) VALUES(1,'Nakit Kasa'),(2,'Banka');
    CREATE TABLE IF NOT EXISTS charges(id INTEGER PRIMARY KEY, unitId INTEGER NOT NULL REFERENCES units(id), kind TEXT NOT NULL, period TEXT, dueDate TEXT NOT NULL, amountCents INTEGER NOT NULL CHECK(amountCents>0), note TEXT NOT NULL DEFAULT '', voidReason TEXT, createdAt TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP);
    CREATE UNIQUE INDEX IF NOT EXISTS unique_dues ON charges(unitId,period) WHERE kind='dues' AND voidReason IS NULL;
    CREATE TABLE IF NOT EXISTS payments(id INTEGER PRIMARY KEY, unitId INTEGER NOT NULL REFERENCES units(id), accountId INTEGER NOT NULL REFERENCES accounts(id), chargeId INTEGER REFERENCES charges(id), date TEXT NOT NULL, amountCents INTEGER NOT NULL CHECK(amountCents>0), note TEXT NOT NULL DEFAULT '', requestKey TEXT NOT NULL UNIQUE, fingerprint TEXT NOT NULL, voidReason TEXT, createdAt TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP);
    CREATE TABLE IF NOT EXISTS allocations(paymentId INTEGER NOT NULL REFERENCES payments(id), chargeId INTEGER NOT NULL REFERENCES charges(id), amountCents INTEGER NOT NULL CHECK(amountCents>0), PRIMARY KEY(paymentId,chargeId));
    CREATE TABLE IF NOT EXISTS expenses(id INTEGER PRIMARY KEY, accountId INTEGER NOT NULL REFERENCES accounts(id), date TEXT NOT NULL, category TEXT NOT NULL, amountCents INTEGER NOT NULL CHECK(amountCents>0), note TEXT NOT NULL DEFAULT '', voidReason TEXT, createdAt TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP);
    CREATE TABLE IF NOT EXISTS transfers(id INTEGER PRIMARY KEY, fromId INTEGER NOT NULL REFERENCES accounts(id), toId INTEGER NOT NULL REFERENCES accounts(id), date TEXT NOT NULL, amountCents INTEGER NOT NULL CHECK(amountCents>0), note TEXT NOT NULL DEFAULT '', voidReason TEXT, createdAt TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP);
    CREATE TABLE IF NOT EXISTS audit(id INTEGER PRIMARY KEY, action TEXT NOT NULL, payload TEXT NOT NULL, createdAt TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP);
    CREATE TABLE IF NOT EXISTS admin(id INTEGER PRIMARY KEY CHECK(id=1), passwordHash TEXT NOT NULL);
    CREATE TABLE IF NOT EXISTS sessions(tokenHash TEXT PRIMARY KEY, csrf TEXT NOT NULL, expiresAt INTEGER NOT NULL);
    CREATE TABLE IF NOT EXISTS schema_version(version INTEGER PRIMARY KEY);
    INSERT OR IGNORE INTO schema_version VALUES(1);`);
  const all = (sql, ...params) => db.prepare(sql).all(...params).map(r => ({ ...r }));
  const get = (sql, ...params) => db.prepare(sql).get(...params);
  const run = (sql, ...params) => db.prepare(sql).run(...params);
  function exists(table, value) { id(value); ensure(get(`SELECT id FROM ${table} WHERE id=?`, value), 'Kayıt bulunamadı.', 404); return value; }
  function insert(table, values) {
    const keys = Object.keys(values);
    const result = run(`INSERT INTO ${table}(${keys.join(',')}) VALUES(${keys.map(() => '?').join(',')})`, ...Object.values(values));
    return { id: Number(result.lastInsertRowid), ...values };
  }
  function allocate() {
    run('DELETE FROM allocations');
    const charges = all('SELECT * FROM charges WHERE voidReason IS NULL ORDER BY dueDate,id').map(c => ({ ...c, remaining: c.amountCents }));
    for (const p of all('SELECT * FROM payments WHERE voidReason IS NULL ORDER BY date,id')) {
      let remaining = p.amountCents;
      const eligible = charges.filter(c => c.unitId === p.unitId);
      if (p.chargeId) eligible.sort((a, b) => Number(b.id === p.chargeId) - Number(a.id === p.chargeId));
      for (const c of eligible) {
        const amount = Math.min(remaining, c.remaining);
        if (amount > 0) { insert('allocations', { paymentId: p.id, chargeId: c.id, amountCents: amount }); c.remaining -= amount; remaining -= amount; }
        if (remaining === 0) break;
      }
    }
  }
  function snapshot() {
    const allocations = all('SELECT * FROM allocations');
    const charges = all('SELECT * FROM charges ORDER BY dueDate,id').map(c => ({ ...c, paidCents: allocations.filter(a => a.chargeId === c.id).reduce((s, a) => s + a.amountCents, 0) }));
    const payments = all('SELECT * FROM payments ORDER BY date,id').map(({ fingerprint, ...p }) => p);
    const expenses = all('SELECT * FROM expenses ORDER BY date,id');
    const transfers = all('SELECT * FROM transfers ORDER BY date,id');
    const units = all('SELECT * FROM units ORDER BY id').map(u => {
      const own = charges.filter(c => c.unitId === u.id && !c.voidReason);
      const paid = payments.filter(p => p.unitId === u.id && !p.voidReason).reduce((s, p) => s + p.amountCents, 0);
      const allocated = own.reduce((s, c) => s + c.paidCents, 0);
      return { ...u, active: !!u.active, debtCents: own.reduce((s, c) => s + c.amountCents - c.paidCents, 0), advanceCents: paid - allocated };
    });
    const accounts = all('SELECT * FROM accounts ORDER BY id').map(a => ({ ...a, balanceCents: a.openingCents
      + payments.filter(p => !p.voidReason && p.accountId === a.id).reduce((s, p) => s + p.amountCents, 0)
      - expenses.filter(e => !e.voidReason && e.accountId === a.id).reduce((s, e) => s + e.amountCents, 0)
      + transfers.filter(x => !x.voidReason).reduce((s, x) => s + (x.toId === a.id ? x.amountCents : 0) - (x.fromId === a.id ? x.amountCents : 0), 0) }));
    return { settings: { ...get('SELECT * FROM settings WHERE id=1') }, units, charges, payments, allocations, expenses, accounts, transfers, audit: all('SELECT * FROM audit ORDER BY id DESC LIMIT 500') };
  }
  function perform(action, p) {
    switch (action) {
      case 'unit.save': {
        ensure(typeof p.active === 'boolean', 'Daire durumu geçersiz.');
        const values = { number: text(p.number, 'Daire numarası', 20, true), owner: text(p.owner, 'Malik', 100), resident: text(p.resident, 'Sakin', 100), phone: text(p.phone, 'Telefon', 30), monthlyCents: cents(p.monthlyCents, true), active: p.active ? 1 : 0 };
        ensure(!get('SELECT id FROM units WHERE number=? AND id!=?', values.number, p.id || 0), 'Bu daire numarası zaten kayıtlı.');
        if (p.id) { exists('units', p.id); run(`UPDATE units SET ${Object.keys(values).map(k => k + '=?').join(',')} WHERE id=?`, ...Object.values(values), p.id); return { id: p.id, ...values }; }
        return insert('units', values);
      }
      case 'charge.batch': {
        period(p.period); date(p.dueDate);
        const units = all("SELECT * FROM units WHERE active=1 AND monthlyCents>0 AND id NOT IN (SELECT unitId FROM charges WHERE kind='dues' AND period=? AND voidReason IS NULL)", p.period);
        ensure(units.length > 0, 'Bu dönem aidatlar zaten oluşturulmuş veya aidatı olan aktif daire yok.');
        let totalCents = 0;
        for (const u of units) { insert('charges', { unitId: u.id, kind: 'dues', period: p.period, dueDate: p.dueDate, amountCents: u.monthlyCents, note: 'Aylık aidat' }); totalCents += u.monthlyCents; }
        return { count: units.length, totalCents };
      }
      case 'charge.add':
        ensure(['extra', 'opening'].includes(p.kind), 'Borç türü geçersiz.');
        return insert('charges', { unitId: exists('units', p.unitId), kind: p.kind, dueDate: date(p.dueDate), amountCents: cents(p.amountCents), note: text(p.note, 'Açıklama', 300, true) });
      case 'payment.add': {
        const values = { unitId: exists('units', p.unitId), accountId: exists('accounts', p.accountId), chargeId: p.chargeId ? exists('charges', p.chargeId) : null, date: date(p.date), amountCents: cents(p.amountCents), note: text(p.note || '', 'Açıklama', 300), requestKey: text(p.requestKey, 'İşlem anahtarı', 100, true) };
        if (values.chargeId) { const c = get('SELECT * FROM charges WHERE id=?', values.chargeId); ensure(c.unitId === values.unitId && !c.voidReason, 'Seçilen borç bu daireye ait değil veya iptal edilmiş.'); }
        const fingerprint = JSON.stringify(values);
        const previous = get('SELECT * FROM payments WHERE requestKey=?', values.requestKey);
        if (previous) { ensure(previous.fingerprint === fingerprint, 'Aynı işlem anahtarı farklı bilgilerle kullanılamaz.'); return { id: previous.id, duplicate: true }; }
        return insert('payments', { ...values, fingerprint });
      }
      case 'expense.add':
        return insert('expenses', { accountId: exists('accounts', p.accountId), date: date(p.date), category: text(p.category, 'Kategori', 80, true), amountCents: cents(p.amountCents), note: text(p.note || '', 'Açıklama', 300) });
      case 'transfer.add':
        ensure(p.fromId !== p.toId, 'Kaynak ve hedef hesap farklı olmalı.');
        return insert('transfers', { fromId: exists('accounts', p.fromId), toId: exists('accounts', p.toId), date: date(p.date), amountCents: cents(p.amountCents), note: text(p.note || '', 'Açıklama', 300) });
      case 'account.opening':
        exists('accounts', p.id); run('UPDATE accounts SET openingCents=? WHERE id=?', cents(p.openingCents, true, true), p.id); return { id: p.id };
      case 'record.void': {
        ensure(['charges', 'payments', 'expenses', 'transfers'].includes(p.type), 'Kayıt türü geçersiz.');
        exists(p.type, p.id); const reason = text(p.reason, 'İptal gerekçesi', 300, true);
        ensure(!get(`SELECT voidReason FROM ${p.type} WHERE id=?`, p.id).voidReason, 'Kayıt zaten iptal edilmiş.');
        run(`UPDATE ${p.type} SET voidReason=? WHERE id=?`, reason, p.id); return { id: p.id };
      }
      case 'settings.save':
        ensure(Number.isInteger(p.dueDay) && p.dueDay >= 1 && p.dueDay <= 28, 'Son ödeme günü 1–28 arasında olmalı.');
        run('UPDATE settings SET name=?,address=?,monthlyCents=?,dueDay=? WHERE id=1', text(p.name, 'Apartman adı', 100, true), text(p.address, 'Adres', 300), cents(p.monthlyCents, true), p.dueDay); return {};
      default: throw new InputError('İşlem bulunamadı.', 404);
    }
  }
  function execute(action, payload) {
    ensure(payload && typeof payload === 'object' && !Array.isArray(payload), 'İşlem bilgileri geçersiz.');
    db.exec('BEGIN IMMEDIATE');
    try {
      const result = perform(action, payload);
      if (!result.duplicate) { allocate(); insert('audit', { action, payload: JSON.stringify({ ...payload, requestKey: undefined }) }); }
      db.exec('COMMIT'); return result;
    } catch (e) { db.exec('ROLLBACK'); throw e; }
  }
  return { db, snapshot, execute, close() { db.close(); } };
}
