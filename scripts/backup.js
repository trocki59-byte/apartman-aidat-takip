import { DatabaseSync } from 'node:sqlite';
import { existsSync, mkdirSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
const source = resolve(process.env.DB_PATH || 'data/aidat.sqlite');
if (!existsSync(source)) { console.error('Veritabanı bulunamadı. Önce uygulamayı çalıştırın.'); process.exit(1); }
const target = resolve(process.argv[2] || `outputs/aidat-backup-${new Date().toISOString().replaceAll(':', '-')}.sqlite`);
if (existsSync(target)) { console.error('Hedef dosya mevcut; üzerine yazılmadı.'); process.exit(1); }
mkdirSync(dirname(target), { recursive: true, mode: 0o700 });
const db = new DatabaseSync(source);
try { db.exec('PRAGMA busy_timeout=5000'); db.prepare('VACUUM INTO ?').run(target); console.log(`Tutarlı SQLite yedeği oluşturuldu: ${target}`); }
finally { db.close(); }
