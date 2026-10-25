import './build-free.js';
import { readdirSync, copyFileSync } from 'node:fs';
const dist=new URL('../dist/',import.meta.url), root=new URL('../',import.meta.url);
for(const name of readdirSync(dist))copyFileSync(new URL(name,dist),new URL(name,root));
console.log('GitHub Pages main / (root) yayın dosyaları güncellendi.');
