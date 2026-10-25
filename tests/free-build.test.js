import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
test('statik paket GitHub Pages alt yolunda bütün modüllerini bulur', async () => {
  await import('../scripts/build-free.js');
  const base = new URL('../dist/', import.meta.url);
  const html = readFileSync(new URL('index.html', base), 'utf8');
  for (const [, ref] of html.matchAll(/(?:src|href)="([^"]+)"/g)) {
    assert.ok(new URL(ref, 'https://example.github.io/apartman-aidat-takip/').pathname.startsWith('/apartman-aidat-takip/'));
    assert.ok(existsSync(new URL(ref, base)), 'Missing HTML asset: ' + ref);
  }
  for (const name of ['app.js','transport.js','local-db.js','local-store.js','reports.js']) {
    const source=readFileSync(new URL(name,base),'utf8');
    for(const [, ref] of source.matchAll(/from ['"]([^'"]+)['"]/g)) assert.ok(existsSync(new URL(ref,base)),'Missing module: '+ref);
  }
  assert.ok(existsSync(new URL('.nojekyll',base)));
});
