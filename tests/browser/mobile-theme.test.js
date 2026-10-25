import test from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { readFileSync, mkdirSync } from 'node:fs';
import { resolve, extname } from 'node:path';
const require=createRequire(import.meta.url);
const {chromium}=require(process.env.PLAYWRIGHT_MODULE || 'playwright');

test('telefon genişliği ve açık/koyu tercih sayfa yenilemede korunur',async t=>{
  const browser=await chromium.launch({headless:true,...(process.env.CHROMIUM_PATH?{executablePath:process.env.CHROMIUM_PATH}:{}),args:['--no-sandbox','--disable-dev-shm-usage']});
  t.after(()=>browser.close());
  const context=await browser.newContext({viewport:{width:1440,height:1000},colorScheme:'light',locale:'tr-TR'});
  const page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
  await context.route('https://aidat.test/**',async route=>{
    const path=new URL(route.request().url()).pathname.replace('/apartman-aidat-takip/','');
    const file=resolve('dist',path || 'index.html');
    const types={'.html':'text/html','.js':'text/javascript','.css':'text/css','.svg':'image/svg+xml'};
    try {await route.fulfill({status:200,contentType:types[extname(file)]||'text/plain',body:readFileSync(file)});} catch {await route.fulfill({status:404,body:'Not found'});}
  });
  await page.goto('https://aidat.test/apartman-aidat-takip/');
  await page.getByRole('heading',{name:'Genel Bakış',exact:true}).waitFor();
  assert.ok(await page.evaluate(()=>document.body.getBoundingClientRect().width<=480));
  assert.ok(await page.getByRole('button',{name:'Menüyü aç'}).isVisible());
  const lightBackground=await page.locator('body').evaluate(e=>getComputedStyle(e).backgroundColor);
  await page.getByRole('button',{name:'Koyu temayı aç'}).click();
  assert.equal(await page.locator('html').getAttribute('data-theme'),'dark');
  const darkBackground=await page.locator('body').evaluate(e=>getComputedStyle(e).backgroundColor);
  assert.notEqual(darkBackground,lightBackground);
  mkdirSync('test-results',{recursive:true});
  await page.screenshot({path:'test-results/phone-dark-desktop.png',fullPage:true});
  await page.reload();await page.getByRole('heading',{name:'Genel Bakış',exact:true}).waitFor();
  assert.equal(await page.locator('html').getAttribute('data-theme'),'dark');
  await page.getByRole('button',{name:'Menüyü aç'}).click();
  await page.getByRole('link',{name:'Daireler',exact:true}).click();
  await page.getByRole('heading',{name:'Daireler',exact:true}).waitFor();
  await page.getByRole('button',{name:'Daire Ekle',exact:true}).click();
  await page.getByLabel('Daire numarası',{exact:true}).fill('1');
  await page.getByRole('button',{name:'Kaydet',exact:true}).click();
  await page.getByRole('cell',{name:'Daire 1',exact:true}).waitFor();
  await page.getByRole('button',{name:'Açık temayı aç'}).click();
  await page.reload();await page.getByRole('heading',{name:'Daireler',exact:true}).waitFor();
  assert.equal(await page.locator('html').getAttribute('data-theme'),'light');
  await page.getByRole('cell',{name:'Daire 1',exact:true}).waitFor();
  for(const width of [320,390,480]){
    await page.setViewportSize({width,height:844});
    assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth),`viewport overflow at ${width}`);
  }
  await page.setViewportSize({width:390,height:844});
  await page.screenshot({path:'test-results/phone-light-mobile.png',fullPage:true});
  for(const viewport of [{width:390,height:600},{width:667,height:390}]) {
    await page.setViewportSize(viewport);
    const trigger=page.getByRole('button',{name:'Menüyü aç'}); await trigger.click();
    const close=page.getByRole('button',{name:'Menüyü kapat'});
    try { await page.waitForFunction(() => document.activeElement?.getAttribute('aria-label') === 'Menüyü kapat', null, {timeout:3000}); }
    catch(error) { console.log('DRAWER_DIAGNOSTIC',JSON.stringify(await page.evaluate(() => { const s=document.querySelector('.sidebar'),c=document.querySelector('.drawer-close');return {viewport:{width:innerWidth,height:innerHeight},active:document.activeElement?.outerHTML,sidebarClass:s.className,sidebarVisibility:getComputedStyle(s).visibility,closeVisibility:getComputedStyle(c).visibility,closeRect:c.getBoundingClientRect().toJSON(),sidebarScroll:s.scrollTop,modalOpen:document.querySelector('dialog').open};})));throw error; }
    assert.equal(await close.evaluate(e=>e===document.activeElement),true,JSON.stringify(viewport));
    const settings=page.getByRole('link',{name:'Ayarlar',exact:true}); await settings.scrollIntoViewIfNeeded();
    const box=await settings.boundingBox(); assert.ok(box.y>=0&&box.y+box.height<=viewport.height,'drawer item outside short viewport');
    await page.keyboard.press('Escape');
    assert.equal(await trigger.evaluate(e=>e===document.activeElement),true);
    assert.equal(await trigger.getAttribute('aria-expanded'),'false');
  }
  assert.deepEqual(errors,[]);
});
