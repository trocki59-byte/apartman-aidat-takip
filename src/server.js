import http from 'node:http';
import { readFile } from 'node:fs/promises';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { resolve } from 'node:path';
import { createStore } from './store.js';
import { createAuth, passwordHash, verifyPassword } from './auth.js';
import { ensure, InputError } from './validation.js';

const publicDir = fileURLToPath(new URL('../public/', import.meta.url));
const assets = new Map([['/', ['index.html', 'text/html; charset=utf-8']], ['/app.js', ['app.js', 'text/javascript; charset=utf-8']], ['/reports.js', ['reports.js', 'text/javascript; charset=utf-8']], ['/styles.css', ['styles.css', 'text/css; charset=utf-8']], ['/favicon.svg', ['favicon.svg', 'image/svg+xml']]]);
export function createApplication({ dbPath = resolve('data/aidat.sqlite'), adminPassword, allowSetup = true, publicOrigin, secureCookie = false, passwordRequired = false } = {}) {
  const store = createStore(dbPath), { db } = store;
  // A restart may change the access mode; never reuse public sessions as logins.
  db.prepare('DELETE FROM sessions').run();
  if (passwordRequired && adminPassword && !db.prepare('SELECT id FROM admin WHERE id=1').get()) db.prepare('INSERT INTO admin(id,passwordHash) VALUES(1,?)').run(passwordHash(adminPassword));
  const auth = createAuth(db, secureCookie), attempts = new Map();
  const hasAdmin = () => !!db.prepare('SELECT id FROM admin WHERE id=1').get();
  function localSetupAllowed(req) {
    const host = req.headers.host?.split(':')[0];
    return allowSetup && ['127.0.0.1', 'localhost'].includes(host) && ['127.0.0.1', '::1', '::ffff:127.0.0.1'].includes(req.socket.localAddress);
  }
  function json(res, status, value) { res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8' }); res.end(JSON.stringify(value)); }
  async function body(req) {
    ensure(req.headers['content-type']?.split(';')[0] === 'application/json', 'JSON isteği bekleniyor.', 415);
    const chunks = []; let size = 0;
    for await (const chunk of req) { size += chunk.length; ensure(size <= 65536, 'İstek çok büyük.', 413); chunks.push(chunk); }
    try { const p = JSON.parse(Buffer.concat(chunks).toString('utf8')); ensure(p && typeof p === 'object' && !Array.isArray(p), 'Geçersiz JSON.'); return p; }
    catch (e) { if (e instanceof InputError) throw e; throw new InputError('Geçersiz JSON.'); }
  }
  const server = http.createServer(async (req, res) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('Referrer-Policy', 'same-origin');
    res.setHeader('Cache-Control', 'no-store');
    res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
    res.setHeader('Content-Security-Policy', "default-src 'self'; script-src 'self'; style-src 'self'; img-src 'self' data:; connect-src 'self'; frame-ancestors 'none'; base-uri 'none'; form-action 'self'");
    try {
      const url = new URL(req.url, 'http://localhost');
      const path = url.pathname;
      if (!path.startsWith('/api/')) {
        ensure(req.method === 'GET' || req.method === 'HEAD', 'Yöntem desteklenmiyor.', 405);
        const asset = assets.get(path); ensure(asset, 'Sayfa bulunamadı.', 404);
        const content = await readFile(resolve(publicDir, asset[0]));
        res.writeHead(200, { 'Content-Type': asset[1] }); res.end(req.method === 'HEAD' ? undefined : content); return;
      }
      if (req.method === 'POST') {
        const expected = publicOrigin || `${secureCookie ? 'https' : 'http'}://${req.headers.host}`;
        ensure(req.headers.origin === expected, 'Bu kaynaktan işlem yapılamaz.', 403);
      }
      if (path === '/api/session' && req.method === 'GET') {
        const session = auth.session(req);
        if (!passwordRequired) {
          const ready = session ? { authenticated: true, csrf: session.csrf } : auth.start(res);
          json(res, 200, { ...ready, passwordRequired: false, setupRequired: false, setupAllowed: false }); return;
        }
        json(res, 200, { authenticated: !!session, csrf: session?.csrf, passwordRequired: true, setupRequired: !hasAdmin(), setupAllowed: localSetupAllowed(req) }); return;
      }
      if (!passwordRequired && ['/api/setup', '/api/login', '/api/password'].includes(path)) throw new InputError('Parola ile giriş devre dışı.', 404);
      if (path === '/api/setup' && req.method === 'POST') {
        ensure(!hasAdmin() && localSetupAllowed(req), 'Kurulum sunucu üzerinden yapılmalıdır.', 403);
        const p = await body(req);
        db.prepare('INSERT INTO admin(id,passwordHash) VALUES(1,?)').run(passwordHash(p.password));
        json(res, 200, auth.start(res)); return;
      }
      if (path === '/api/login' && req.method === 'POST') {
        const key = req.socket.remoteAddress;
        for (const [k, v] of attempts) if (v.until < Date.now()) attempts.delete(k);
        let rate = attempts.get(key); if (!rate) { rate = { count: 0, until: Date.now() + 900000 }; attempts.set(key, rate); }
        ensure(rate.count < 10, 'Çok fazla giriş denemesi. 15 dakika sonra tekrar deneyin.', 429);
        const p = await body(req); rate.count++;
        ensure(verifyPassword(p.password, db.prepare('SELECT passwordHash FROM admin WHERE id=1').get()?.passwordHash), 'Parola hatalı.', 401);
        attempts.delete(key); json(res, 200, auth.start(res)); return;
      }
      const session = auth.session(req); ensure(session, 'Oturum açmanız gerekiyor.', 401);
      if (req.method === 'POST') ensure(req.headers['x-csrf-token'] === session.csrf, 'Güvenlik doğrulaması başarısız. Sayfayı yenileyin.', 403);
      if (path === '/api/data' && req.method === 'GET') { json(res, 200, store.snapshot()); return; }
      if (path === '/api/logout' && req.method === 'POST') { auth.end(req, res); json(res, 200, { ok: true }); return; }
      if (path === '/api/password' && req.method === 'POST') {
        const p = await body(req);
        ensure(verifyPassword(p.currentPassword, db.prepare('SELECT passwordHash FROM admin WHERE id=1').get()?.passwordHash), 'Mevcut parola hatalı.', 401);
        const nextHash = passwordHash(p.newPassword);
        db.prepare('UPDATE admin SET passwordHash=? WHERE id=1').run(nextHash);
        db.prepare('DELETE FROM sessions').run(); auth.end(req, res); json(res, 200, { ok: true }); return;
      }
      if (path === '/api/actions' && req.method === 'POST') {
        const p = await body(req); const result = store.execute(p.action, p.payload);
        json(res, 200, { ok: true, result }); return;
      }
      throw new InputError('İşlem bulunamadı.', 404);
    } catch (e) {
      const status = e instanceof InputError ? e.status : 500;
      if (status === 500) console.error('İstek hatası:', e.message);
      if (!res.headersSent) json(res, status, { error: status === 500 ? 'İşlem tamamlanamadı. Lütfen tekrar deneyin.' : e.message });
      else res.end();
    }
  });
  server.requestTimeout = 30000; server.headersTimeout = 10000;
  return { server, store };
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  const host = process.env.HOST || '127.0.0.1', port = Number(process.env.PORT || 3000);
  const allowSetup = host === '127.0.0.1';
  const passwordRequired = process.env.PASSWORD_REQUIRED === 'true';
  const app = createApplication({ dbPath: process.env.DB_PATH || resolve('data/aidat.sqlite'), adminPassword: process.env.ADMIN_PASSWORD, allowSetup, publicOrigin: process.env.PUBLIC_ORIGIN, secureCookie: process.env.SECURE_COOKIE === 'true', passwordRequired });
  if (passwordRequired && !allowSetup && !app.store.db.prepare('SELECT id FROM admin WHERE id=1').get()) {
    console.error('Dış ağda ilk çalıştırma için ADMIN_PASSWORD (en az 12 karakter) ayarlayın.'); app.store.close(); process.exit(1);
  }
  app.server.listen(port, host, () => console.log(`Apartman Aidat Takip: http://${host}:${port}`));
  const stop = () => { app.server.close(() => { app.store.close(); process.exit(0); }); };
  process.on('SIGTERM', stop); process.on('SIGINT', stop);
}
