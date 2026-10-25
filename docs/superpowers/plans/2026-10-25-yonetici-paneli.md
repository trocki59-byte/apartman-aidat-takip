# Apartman Aidat Takip Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox syntax for tracking.

**Goal:** Tek apartman yöneticisi için kalıcı kayıtlı, Türkçe web uygulaması.
**Architecture:** Node HTTP sunucusu, SQLite üzerinde atomik mali işlemler, bağımsız HTML/CSS/JS arayüz. Tek yönetici, hashlenmiş parola ve sunucu oturumları. Yeni proje ayrı dizin ve özellik dalında.
**Tech Stack:** Node.js 24+, node:sqlite, node:test, standart Web API'leri; üretimde çalışma zamanı bağımlılığı yok.
**Spec:** ../specs/2026-10-25-apartman-aidat-takip-design.md

## Global Constraints
Tek apartman, yalnızca yönetici, Türkçe ve mobil uyumlu. Tutarlar kuruş tamsayısı; tahakkuk kasayı artırmaz. Aynı daire/ay aidatı tekrarlanamaz. Başlangıç borcu ve kasa açılışı ayrıdır. Mali iptaller iz bırakır. Gizli bilgi Git'e girmez.

## Review Focus
- Yeniden başlatmada kayıt ve yönetici korunmalı.
- Eşzamanlı/tekrarlı tahsilat iki kez işlenmemeli.
- Bozuk tarih/tutar ve negatif değerler reddedilmeli.
- Arşiv daire yeni toplu borç dışında, eski raporlar içinde kalmalı.
- Yetkisiz ve başka kaynaktan yazma istekleri reddedilmeli.

## Task 1: Mali çekirdek ve SQLite
Files: src/store.js, src/validation.js, tests/store.test.js.
Interfaces: createStore(path) -> {db, snapshot(), execute(action, payload), close()}.
- [ ] Gerçek SQLite ile daire, toplu tahakkuk, tekrar engeli, kısmi ödeme, avans, gider, transfer, iptal ve yeniden açılış testlerini yaz; `node --test tests/store.test.js` başarısız olmalı.
- [ ] Şemayı ve tek transaction içinde execute işlemlerini uygula. Ödemeler FIFO ile aktif borçlara dağıtılır, fazla tutar avans olur; yeni borç avansı tüketir. Raporlar snapshot kayıtlarından hesaplanır.
- [ ] Aynı komutla tüm testlerin geçtiğini doğrula ve commit oluştur.

## Task 2: HTTP ve yönetici erişimi
Files: src/server.js, src/auth.js, tests/http.test.js, package.json.
Interfaces: createApplication({dbPath, adminPassword?, host?}) -> {server, store}; API GET /api/session, POST /api/setup, /api/login, /api/logout, GET /api/data, POST /api/actions.
- [ ] Gerçek HTTP testlerinde yetkisiz erişim, kurulum, giriş, çıkış, CSRF, oturum, kalıcı kayıt ve yinelenen istekleri sınayan testleri önce çalıştır.
- [ ] Parolaları scrypt ile hashle; rastgele HttpOnly SameSite oturumları, süre aşımı, CSRF belirteci ve giriş sınırı uygula. Üretimde bootstrap ADMIN_PASSWORD gerektir; ilk yerel kurulum yalnızca loopback dinleyicide.
- [ ] `npm test` yeşil olmalı; commit oluştur.

## Task 3: Yönetici arayüzü
Files: public/index.html, public/app.js, public/styles.css, tests/browser.test.js.
Interfaces: yukarıdaki API, JSON snapshot: settings, units, charges, payments, allocations, expenses, accounts, transfers, audit.
- [ ] Tarayıcı testini kurulum, daire, aidat, tahsilat, gider, rapor indirme ve mobil gezinme için önce çalıştır.
- [ ] Onaylanan lacivert/turkuaz görünüm; sekiz ekran; gerçek veriyle grafik ve tablolar; boş durumlar, form hataları, filtreler, makbuz ve yazdırılabilir hesap dökümü, CSV, veri JSON dışa aktarımı.
- [ ] Tam akışı test et; commit oluştur.

## Task 4: Teslim ve bağımsız inceleme
Files: README.md, Dockerfile, .env.example, .gitignore, docs/PROGRESS.md.
- [ ] Kurulum, yedek ve geri yükleme, TLS reverse proxy, yönetici parolası, veri modeli ve sınırları Türkçe belgeye yaz.
- [ ] Tüm testleri ve sözdizimi kontrollerini çalıştır. Yeni inceleyici ile kodu kontrol ettir; önemli bulguları regresyon testiyle düzelt.
- [ ] GitHub özel depo oluşturma/yükleme yetkisini doğrula; engel varsa ZIP ve yerel Git deposunu teslim et, uzak deponun oluşturulmadığını açıkla.

## Ortam kararları
Kullanıcının “yapmaya başla” talimatı uygulamaya geçiş yetkisidir; plan için tekrar onay istenmez. Sites kurulum ve paketleme yardımcıları bu ortamda bulunamadığından yayımlama uydurulmaz; taşınabilir tam uygulama hazırlanır. GitHub connector profil okuyor fakat depo oluşturma aracı yok; gh kimlik doğrulaması başarısız. Bu engeller uygulamayı durdurmaz.
