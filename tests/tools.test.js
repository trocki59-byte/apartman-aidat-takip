import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { spawnSync } from 'node:child_process';
import { DatabaseSync } from 'node:sqlite';
import { createStore } from '../src/store.js';
import { passwordHash, verifyPassword } from '../src/auth.js';

const project = new URL('../', import.meta.url);
function fixture(t) {
  const dir = mkdtempSync(join(tmpdir(), 'aidat-tools-'));
  t.after(() => rmSync(dir, { recursive: true, force: true }));
  return { dir, path: join(dir, 'aidat.sqlite') };
}
function run(script, path, args = [], env = {}) {
  return spawnSync(process.execPath, [script, ...args], { cwd: project, env: { ...process.env, DB_PATH: path, ...env }, encoding: 'utf8' });
}
test('yedek aracı açık SQLite veritabanından tutarlı kopya alır ve üzerine yazmaz', t => {
  const { dir, path } = fixture(t), store = createStore(path); t.after(() => store.close());
  store.execute('unit.save', { number: '1', owner: 'Ayşe', resident: '', phone: '', monthlyCents: 200000, active: true });
  const target = join(dir, 'backup.sqlite');
  const result = run('scripts/backup.js', path, [target]);
  assert.equal(result.status, 0, result.stderr);
  const backup = new DatabaseSync(target); t.after(() => backup.close());
  assert.equal(backup.prepare('SELECT owner FROM units WHERE id=1').get().owner, 'Ayşe');
  assert.equal(run('scripts/backup.js', path, [target]).status, 1);
});
test('parola kurtarma eski oturumları siler ve yeni özeti kaydeder', t => {
  const { path } = fixture(t), store = createStore(path); t.after(() => store.close());
  store.db.prepare('INSERT INTO admin VALUES(1,?)').run(passwordHash('Eski-Parola-2026!'));
  store.db.prepare('INSERT INTO sessions VALUES(?,?,?)').run('old-session-hash', 'csrf', Date.now() + 60000);
  const result = run('scripts/reset-password.js', path, [], { RESET_ADMIN_PASSWORD: 'Yeni-Parola-2026!' });
  assert.equal(result.status, 0, result.stderr);
  assert.equal(store.db.prepare('SELECT COUNT(*) AS count FROM sessions').get().count, 0);
  assert.equal(verifyPassword('Yeni-Parola-2026!', store.db.prepare('SELECT passwordHash FROM admin').get().passwordHash), true);
  assert.equal(run('scripts/reset-password.js', path, [], { RESET_ADMIN_PASSWORD: 'short' }).status, 1);
});
test('dış ağda ilk parola eksikken sunucu port açmadan durur', t => {
  const { path } = fixture(t);
  const result = run('src/server.js', path, [], { HOST: '0.0.0.0', ADMIN_PASSWORD: '', PASSWORD_REQUIRED: 'true' });
  if (result.error?.code === 'EPERM') { t.skip('Ortam dış ağ dinleyici yapılandırmalı alt süreç başlatmayı engelliyor.'); return; }
  assert.equal(result.status, 1); assert.match(result.stderr, /ADMIN_PASSWORD/);
});
