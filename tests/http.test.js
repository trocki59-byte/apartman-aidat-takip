import test from 'node:test';
import assert from 'node:assert/strict';
import { createApplication } from '../src/server.js';
import { inject } from './inject.js';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

async function fixture(t, options = {}) {
  const app = createApplication({ dbPath: ':memory:', passwordRequired: true, ...options });
  const origin = 'http://127.0.0.1';
  t.after(() => { app.store.close(); });
  let cookie = '', csrf = '';
  async function request(path, body, headers = {}) {
    const r = await inject(app.server, { path, method: body === undefined ? 'GET' : 'POST', headers: { Origin: origin, 'Content-Type': 'application/json', Cookie: cookie, 'X-CSRF-Token': csrf, ...headers }, payload: body === undefined ? '' : JSON.stringify(body) });
    const c = r.headers.get('set-cookie'); if (c) cookie = c.split(';')[0];
    const data = JSON.parse(r.body); if (data.csrf) csrf = data.csrf;
    return { status: r.status, data, headers: r.headers };
  }
  return { ...app, request };
}
const password = 'Guvenli-Parola-2026!';
test('ilk kurulum, yetkisiz erişim, güvenli oturum ve çıkış', async t => {
  const { request } = await fixture(t);
  assert.equal((await request('/api/data')).status, 401);
  assert.equal((await request('/api/session')).data.setupRequired, true);
  assert.equal((await request('/api/setup', { password: 'short' })).status, 400);
  const r = await request('/api/setup', { password });
  assert.equal(r.status, 200); assert.match(r.headers.get('set-cookie'), /HttpOnly/); assert.match(r.headers.get('set-cookie'), /SameSite=Strict/);
  assert.equal((await request('/api/data')).status, 200);
  assert.equal((await request('/api/setup', { password })).status, 403);
  assert.equal((await request('/api/logout', {})).status, 200);
  assert.equal((await request('/api/data')).status, 401);
  assert.equal((await request('/api/login', { password: 'wrong' })).status, 401);
  assert.equal((await request('/api/login', { password })).status, 200);
});
test('üretim ilk kurulumu web üzerinden ele geçirilemez', async t => {
  const { request } = await fixture(t, { allowSetup: false });
  assert.equal((await request('/api/setup', { password })).status, 403);
});
test('sunucu başlangıç parolasıyla erişim ve CSRF koruması', async t => {
  const { request } = await fixture(t, { adminPassword: password, allowSetup: false });
  await request('/api/login', { password });
  assert.equal((await request('/api/actions', { action: 'settings.save', payload: {} }, { Origin: 'https://evil.example' })).status, 403);
  assert.equal((await request('/api/actions', { action: 'settings.save', payload: {} }, { 'X-CSRF-Token': '' })).status, 403);
  const saved = await request('/api/actions', { action: 'unit.save', payload: { number: '1', owner: 'Özlem', resident: '', phone: '', monthlyCents: 200000, active: true } });
  assert.equal(saved.status, 200);
  assert.equal((await request('/api/data')).data.units[0].owner, 'Özlem');
  assert.equal((await request('/api/actions', { action: 'expense.add', payload: { amountCents: -1 } })).status, 400);
});
test('giriş denemeleri sınırlandırılır', async t => {
  const { request } = await fixture(t, { adminPassword: password });
  for (let i = 0; i < 10; i++) assert.equal((await request('/api/login', { password: 'wrong' })).status, 401);
  assert.equal((await request('/api/login', { password })).status, 429);
});
test('parola değiştirme eski parolayı ve mevcut oturumları geçersiz kılar', async t => {
  const { request } = await fixture(t, { adminPassword: password });
  await request('/api/login', { password });
  assert.equal((await request('/api/password', { currentPassword: 'wrong', newPassword: 'Yeni-Guvenli-Parola!' })).status, 401);
  assert.equal((await request('/api/password', { currentPassword: password, newPassword: 'Yeni-Guvenli-Parola!' })).status, 200);
  assert.equal((await request('/api/data')).status, 401);
  assert.equal((await request('/api/login', { password })).status, 401);
  assert.equal((await request('/api/login', { password: 'Yeni-Guvenli-Parola!' })).status, 200);
});
test('var olmayan takvim ayı kontrollü 400 yanıtı verir', async t => {
  const { request } = await fixture(t, { adminPassword: password });
  await request('/api/login', { password });
  const response = await request('/api/actions', { action: 'expense.add', payload: { date: '2026-13-01', accountId: 1, category: 'Su', amountCents: 100, note: '' } });
  assert.equal(response.status, 400);
});
test('HTML, modül, stil ve simge doğru içerik türleriyle sunulur', async t => {
  const app = createApplication({ dbPath: ':memory:' }); t.after(() => app.store.close());
  for (const [path, type] of [['/', 'text/html'], ['/app.js', 'text/javascript'], ['/reports.js', 'text/javascript'], ['/styles.css', 'text/css'], ['/favicon.svg', 'image/svg+xml']]) {
    const r = await inject(app.server, { path });
    assert.equal(r.status, 200); assert.ok(r.headers.get('content-type').startsWith(type));
    assert.ok(r.body.length > 50); assert.ok(r.headers.get('content-security-policy').includes("script-src 'self'"));
  }
  assert.equal((await inject(app.server, { path: '/src/server.js' })).status, 404);
});
test('varsayılan açılış parola istemez ve doğrudan panel oturumu verir', async t => {
  const app = createApplication({ dbPath: ':memory:' }); t.after(() => app.store.close());
  const r = await inject(app.server, { path: '/api/session' });
  const session = JSON.parse(r.body);
  assert.equal(session.passwordRequired, false);
  assert.equal(session.authenticated, true);
  assert.equal(session.setupRequired, false);
  assert.ok(session.csrf);
  assert.match(r.headers.get('set-cookie'), /HttpOnly/);
});
test('parolasız modda kayıt yapılır; kaynak ve CSRF kontrolü devam eder', async t => {
  const { request } = await fixture(t, { passwordRequired: false, allowSetup: false });
  await request('/api/session');
  assert.equal((await request('/api/data')).status, 200);
  const payload = { action: 'unit.save', payload: { number: '1', owner: '', resident: '', phone: '', monthlyCents: 200000, active: true } };
  assert.equal((await request('/api/actions', payload, { 'X-CSRF-Token': '' })).status, 403);
  assert.equal((await request('/api/actions', payload, { Origin: 'https://evil.example' })).status, 403);
  assert.equal((await request('/api/actions', payload)).status, 200);
  assert.equal((await request('/api/data')).data.units.length, 1);
  for (const path of ['setup', 'login', 'password']) assert.equal((await request('/api/' + path, { password: 'unused' })).status, 404);
});
test('parola tekrar etkinleşince önceki parolasız oturum giriş yapmış sayılmaz', async t => {
  const dir = mkdtempSync(join(tmpdir(), 'aidat-mode-')); t.after(() => rmSync(dir, { recursive: true, force: true }));
  const dbPath = join(dir, 'aidat.sqlite');
  const first = createApplication({ dbPath });
  const session = await inject(first.server, { path: '/api/session' });
  const cookie = session.headers.get('set-cookie').split(';')[0]; first.store.close();
  const second = createApplication({ dbPath, passwordRequired: true, adminPassword: password }); t.after(() => second.store.close());
  const check = await inject(second.server, { path: '/api/session', headers: { Cookie: cookie } });
  assert.equal(JSON.parse(check.body).authenticated, false);
  assert.equal((await inject(second.server, { path: '/api/data', headers: { Cookie: cookie } })).status, 401);
});
