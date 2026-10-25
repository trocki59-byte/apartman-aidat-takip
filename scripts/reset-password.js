import { DatabaseSync } from 'node:sqlite';
import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { passwordHash } from '../src/auth.js';
const path = resolve(process.env.DB_PATH || 'data/aidat.sqlite');
if (!existsSync(path)) { console.error('Veritabanı bulunamadı.'); process.exit(1); }
let hash;
try { hash = passwordHash(process.env.RESET_ADMIN_PASSWORD); }
catch { console.error('RESET_ADMIN_PASSWORD ortam değişkeninde 12–200 karakterlik yeni parola tanımlayın.'); process.exit(1); }
const db = new DatabaseSync(path);
try {
  db.exec('PRAGMA busy_timeout=5000; BEGIN IMMEDIATE');
  db.prepare('INSERT INTO admin(id,passwordHash) VALUES(1,?) ON CONFLICT(id) DO UPDATE SET passwordHash=excluded.passwordHash').run(hash);
  db.prepare('DELETE FROM sessions').run();
  db.prepare('INSERT INTO audit(action,payload) VALUES(?,?)').run('admin.password.reset', '{}');
  db.exec('COMMIT'); console.log('Yönetici parolası sıfırlandı; tüm oturumlar sonlandırıldı.');
} catch (e) { db.exec('ROLLBACK'); console.error('Parola sıfırlanamadı:', e.message); process.exitCode = 1; }
finally { db.close(); }
