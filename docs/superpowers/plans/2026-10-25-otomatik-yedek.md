# Otomatik Yedekleme

Amaç: ücretsiz GitHub Pages sürümünde her mali değişiklikte otomatik yedek, geçmişten geri yükleme ve destekleyen masaüstü Chrome'da kullanıcı tarafından bir kez seçilen klasöre dosya yedeği.

- IndexedDB v2 geçişi: mevcut records korunur; backups mağazası eklenir. Mali işlem + önceki sürüm + günlük son sürüm tek transaction içinde.
- Son 30 gün ve son 10 işlem öncesi sürüm tutulur. Gün sınırı Europe/Istanbul. Açılışta gün değişmişse yeni günlük sürüm alınır. Geri yükleme öncesi mevcut veriler korunur.
- Klasör seçimi zorunlu kullanıcı hareketiyle yapılır. Yerel handle yalnızca IndexedDB'de saklanır; JSON'a veya GitHub'a yazılmaz. İzin durumu otomatik sorgulanır; arka planda izin penceresi açılmaz.
- Seçilen klasörde TROCKI-Aidat-Yedekleri alt klasörü, son yedek ve 30 günlük JSON dosyası. Uygulama açıkken kayıt sonrası çalışır; kapalı tarayıcıda zamanlanmış işlem veya bulut eşitleme iddiası yok.
- navigator.locks ile sekmeler arası dosya yazımı sıraya alınır ve yazımdan önce en yeni kayıt tekrar okunur. Disk hatası mali kaydı geri almaz; görünür durum mesajı verilir. Tarayıcı içi transaction başarısızsa eski veriler korunur.
- Ayarlar: son yedek durumu, klasör bağla/izin yenile/kaldır, geçmişi incele/indir/geri yükle. Desteksiz tarayıcıda iç yedek devam eder; dış dosya indirme manueldir.
- Testler: saf politika/retention/tarih, gerçek dosyalı yazar; Chromium'da v1 geçişi, geçmiş restore, OPFS gerçek dosya API'siyle klasör yazımı simülasyonu, bozuk restore atomikliği. Mevcut responsive/tema testleri de geçmeli.
