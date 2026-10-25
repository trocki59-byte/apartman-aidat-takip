import { mkdirSync, rmSync, copyFileSync, writeFileSync } from 'node:fs';
const target=new URL('../dist/',import.meta.url), source=new URL('../public/',import.meta.url);
rmSync(target,{recursive:true,force:true});mkdirSync(target,{recursive:true});
for(const name of ['index.html','app.js','theme.js','styles.css','mobile-theme.css','desktop.css','favicon.svg','reports.js','validation.js','local-store.js','local-db.js','backup-policy.js','folder-backup.js'])copyFileSync(new URL(name,source),new URL(name,target));
copyFileSync(new URL('transport-browser.js',source),new URL('transport.js',target));
writeFileSync(new URL('vercel.json',target),JSON.stringify({version:2,headers:[{source:'/(.*)',headers:[{key:'X-Content-Type-Options',value:'nosniff'},{key:'Referrer-Policy',value:'same-origin'},{key:'X-Frame-Options',value:'DENY'},{key:'Content-Security-Policy',value:"default-src 'self'; script-src 'self'; style-src 'self'; img-src 'self' data:; connect-src 'self'; frame-ancestors 'none'; base-uri 'none'; form-action 'self'"},{key:'Cache-Control',value:'no-cache'}]}]},null,2));
writeFileSync(new URL('.nojekyll',target),'');
console.log('Ücretsiz tarayıcı sürümü dist/ içine hazırlandı. Veriler yalnızca ziyaretçinin tarayıcısında tutulur.');
