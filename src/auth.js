import { randomBytes, scryptSync, timingSafeEqual, createHash } from 'node:crypto';
import { ensure } from './validation.js';

export function passwordHash(password) {
  ensure(typeof password === 'string' && password.length >= 12 && password.length <= 200, 'Parola 12–200 karakter olmalı.');
  const salt = randomBytes(16).toString('hex');
  return salt + ':' + scryptSync(password, salt, 64).toString('hex');
}
export function verifyPassword(password, stored) {
  if (typeof password !== 'string' || password.length > 200 || !stored) return false;
  const [salt, hash] = stored.split(':');
  const actual = scryptSync(password, salt, 64);
  const expected = Buffer.from(hash, 'hex');
  return actual.length === expected.length && timingSafeEqual(actual, expected);
}
const hashToken = token => createHash('sha256').update(token).digest('hex');
export function createAuth(db, secureCookie = false) {
  const cookie = (value, maxAge) => `aidat_session=${value}; Path=/; HttpOnly; SameSite=Strict; Max-Age=${maxAge}${secureCookie ? '; Secure' : ''}`;
  function session(req) {
    const token = /(?:^|;\s*)aidat_session=([a-f0-9]{64})(?:;|$)/.exec(req.headers.cookie || '')?.[1];
    if (!token) return null;
    return db.prepare('SELECT * FROM sessions WHERE tokenHash=? AND expiresAt>?').get(hashToken(token), Date.now());
  }
  function start(res) {
    db.prepare('DELETE FROM sessions WHERE expiresAt<=?').run(Date.now());
    const token = randomBytes(32).toString('hex'), csrf = randomBytes(24).toString('hex');
    db.prepare('INSERT INTO sessions(tokenHash,csrf,expiresAt) VALUES(?,?,?)').run(hashToken(token), csrf, Date.now() + 8 * 60 * 60 * 1000);
    res.setHeader('Set-Cookie', cookie(token, 8 * 60 * 60)); return { authenticated: true, csrf };
  }
  function end(req, res) { const s = session(req); if (s) db.prepare('DELETE FROM sessions WHERE tokenHash=?').run(s.tokenHash); res.setHeader('Set-Cookie', cookie('', 0)); }
  return { session, start, end };
}
