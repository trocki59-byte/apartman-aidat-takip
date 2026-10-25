# Ücretsiz Yayın Implementation Plan

> **For agentic workers:** Use superpowers:executing-plans inline. User repeatedly instructed to execute and specified zero paid plans.

**Goal:** Onaylı arayüzü ücretsiz Vercel Hobby planında çalışan, parolasız tek yönetici uygulaması olarak yayımlamak.
**Architecture:** Sunucu veritabanı bağlantısı olmadan IndexedDB ile aynı tarayıcıda kalıcı kayıt. JSON yedek indirme ve doğrulanmış geri yükleme; mali işlemler tek IndexedDB transaction içinde. Mevcut Node/SQLite sürümü korunur. Ücretsiz sürümün aynı cihaz/tarayıcı sınırı kullanıcıya ilerleme mesajında ve arayüzde açıkça belirtilir.
**Tech Stack:** ES modules, IndexedDB, Node test runner, GitHub Pages; Vercel yalnızca alternatif.
**Spec:** Önceki tasarım + kullanıcının ücretsiz ve parolasız yayın talebi. Cihazlar arası otomatik eşitleme bu sürümde yok.

## Global Constraints
Ücretli kaynak oluşturulmaz. Özel GitHub deposu özel kalır. Tutarlar kuruş tamsayısı; aynı mali kurallar ve ekranlar korunur. Veriler yayın dosyalarına veya GitHub'a konmaz.

## Review Focus
Başarısız işlem önceki veriyi değiştirmemeli. Sekmeler arası eşzamanlı yazım kayıp yaratmamalı. Yedek türleri ve referanslar doğrulanmalı. Depolama hatası başarı gibi gösterilmemeli. Yerel ve sunucu hesaplamaları eşleşmeli.

## Tasks
- [ ] public/local-store.js: initialData(), executeLocal(data,action,payload), snapshotLocal(data), restoreBackup(data). Önce test; SQLite sonuçlarıyla borç, kısmi ödeme, avans, transfer, iptal ve tekrarları karşılaştır.
- [ ] public/transport.js sunucu adaptörü; public/transport-browser.js ve public/local-db.js IndexedDB adaptörü. Yazım tek transaction; otomatik bellek fallback yok.
- [ ] Arayüzde tarayıcı kayıt sınırını açık göster; yedek indir/yükle ekle. scripts/build-free.js ile dist üret; yalnızca statik dosyalar dağıt.
- [ ] npm test/check/build; bağımsız inceleme; özel GitHub'a yükle. Kullanıcının açık isteği doğrultusunda GitHub Pages için gh-pages dalını hazırla. Depo herkese açılmadan önce kullanıcıdan görünürlük onayı al. Pages etkinleşince gerçek yayını doğrula.
