# Telefon Düzeni ve Tema

Kullanıcı isteği: tüm uygulama telefon ekranı genişliğinde ve açık/koyu seçilebilir olsun.
Uygulama kararı: en fazla 480 px ortalanmış panel; her genişlikte açılır gezinme; mobil formlar; taşan tablolar kendi içinde kayar. Üstte erişilebilir tema düğmesi; ilk tercihte sistem, sonrasında saklanan kullanıcı seçimi. Tema tercihi mali verilerden ayrı localStorage anahtarında; erişim kısıtlıysa tema yine çalışır. Açık/koyu renkler tüm kart, form, makbuz ve durum etiketlerine uygulanır; basılı çıktı açık kalır.
Doğrulama: gerçek Chromium ile 1440/480/390/320 px görünüm, tema değişimi, sayfa yenileme sonrası tercih ve mali kayıtların korunması. Ortam Chromium çalıştırmayı engellediği için herkese açık deponun ücretsiz standart GitHub Actions işinde bu test çalıştırılır. Sonra GitHub Pages dağıtımı doğrulanır.
