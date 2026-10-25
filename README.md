# Apartman Aidat Takip

Tek apartmanı yöneten kişi için Türkçe, mobil uyumlu web uygulaması. Sakin girişi yoktur. Lacivert ve turkuaz yönetici paneli; gerçek kayıtlarla çalışan sekiz ekran.

## Telefon düzeni ve tema

Telefonda arayüz en fazla 480 px genişliğinde ortalanır. 960 px ve üzerindeki bilgisayar ekranlarında tam genişlikli panel, sabit sol menü ve yan yana özet kartları gösterilir. Üst çubuktaki ay/güneş düğmesi açık ve koyu tema arasında geçiş yapar. İlk açılışta sistem tercihi kullanılır; seçiminiz bu tarayıcıda saklanır. Menü kısa ekranlarda kaydırılabilir; Escape veya kapat düğmesiyle kapanır.

## Ücretsiz internet sürümü

Ücretsiz statik sürüm GitHub Pages için hazırlanmıştır. Parola, sunucu veya ücretli disk gerekmez. **Mali kayıtlar yalnızca kullandığınız cihazdaki tarayıcıda IndexedDB içinde saklanır; cihazlar arasında otomatik eşitlenmez.** Siteyi başka cihazda açınca ayrı, boş kayıt alanı görülür. Gizli gezinme kullanmayın; tarayıcı/site verilerini temizlemek kayıtları siler.

Ayarlar → **Yedek İndir** ile JSON yedeğini düzenli olarak saklayın. Yeni cihazda aynı siteyi açıp Ayarlar → **Yedek Yükle** kullanın. Yükleme mevcut kayıtların yerine geçer; işlem öncesinde eski kayıtlarınızın kopyası indirilir. Geçersiz yedek kaydedilmez. Veriler ve yedekler GitHub'a veya yayın sunucusuna gönderilmez.

Statik dosyaları üretmek için `npm run build:free` çalıştırın. `npm run prepare:pages` komutu aynı dosyaları `main` dalının köküne de kopyalar; arayüzü değiştirdikten sonra yayın dosyalarını bu komutla güncelleyin. Düzenlemeleri kökteki üretilmiş dosyalar yerine `public/` altında yapın. `dist/` içeriği GitHub Pages'te alt dizinde çalışacak biçimdedir; Pages için `.nojekyll` bulunur. Uygulama açıldıktan sonra bağlantı kesilirse açık panelde kayıt yapabilirsiniz; çevrimdışı yeniden açılış garantisi yoktur.

GitHub Pages kurulumu: ücretsiz GitHub hesabında depo herkese açık olmalı; Settings → Pages → Deploy from a branch → `main` / `(root)` → Save. `gh-pages` dalı da aynı statik sürümü içerir. `gh-pages` dalı yalnızca üretilmiş statik uygulama dosyalarını içerir. Kaynak depo görünürlüğü kullanıcı onayı olmadan değiştirilmez. Henüz doğrulanmamış bir yayın adresi canlı site olarak sunulmaz.

Aşağıdaki Node.js/SQLite talimatları yerel sunucu sürümü içindir; ücretsiz statik yayında uygulanmaz.

## Otomatik yedekleme — ücretsiz internet sürümü

Otomatik tarayıcı yedeği varsayılan olarak açıktır. Her başarılı değişiklikte işlem öncesi sürüm ve güncel günlük sürüm, asıl kayıtla aynı işlemde saklanır. Son 30 günlük yedek ve son 10 işlem öncesi sürüm korunur; gün sınırı İstanbul saatidir. Program yeni bir günde açıldığında da günlük sürüm alınır. **Ayarlar → Otomatik Yedekleme → Yedek Geçmişini Aç** bölümünden indirebilir veya geri yükleyebilirsiniz. Geri yükleme öncesi mevcut durum ayrıca korunur.

Tarayıcı içi yedek, site verileri temizlenirse asıl kayıtlarla birlikte silinir. Bilgisayarda Chrome/Edge gibi destekleyen tarayıcılarda dosya yedeğini de açın:

1. **Ayarlar → Yedek Klasörü Seç** düğmesine basın.
2. Bilgisayarda bir klasör seçip tarayıcının yazma iznini onaylayın.
3. Program, bu klasörde `TROCKI-Aidat-Yedekleri` alt klasörünü oluşturur. Her kayıt değişikliğinde `trocki-aidat-son-yedek.json` ve günün JSON dosyası otomatik güncellenir. En son 30 günlük dosya korunur; ilgisiz dosyalara dokunulmaz.

Klasör izni her açılışta tarayıcı tarafından yeniden istenebilir. Program izin penceresini kendiliğinden açmaz; uyarı çıkarsa **Klasöre Yeniden İzin Ver** düğmesine basın. Dosya yazılamazsa mali kayıt ve tarayıcı içi yedek korunur; ekranda yedek hatası görünür. Birden fazla açık sekmenin dosya yazımları sıraya alınır. Klasör bağlantısını kaldırmak yedek dosyalarını silmez.

**Program kapalıyken zamanlanmış işlem ve bulut eşitleme yoktur.** Klasöre otomatik yazma desteklenmeyen tarayıcılarda iç yedekleme devam eder; dış dosya için Yedek İndir kullanılır. Yerel klasör tanıtıcısı sadece bu tarayıcıda saklanır, GitHub'a veya JSON dosyasına aktarılmaz. Mevcut tarayıcı kayıtları sürüm güncellemesinde korunur.

## Yerel sunucu: hızlı başlangıç

**Gereken:** Node.js 24 veya üzeri. Normal kullanımda npm paketi yüklemek gerekmez; uygulamanın üretim bağımlılığı yoktur.

```bash
npm start
```

Tarayıcıda **http://127.0.0.1:3000** adresini açın. Panel doğrudan açılır; parola veya ilk kurulum girişi gerekmez. Örnek mali kayıtlar eklenmez. **Uygulamaya ulaşabilen herkes kayıtları görüntüleyebilir ve değiştirebilir.**

`index.html` dosyasını çift tıklayarak açmak yeterli değildir; uygulama sunucusunun çalışması gerekir.

İlk kullanım sırası:

1. Ayarlar'dan apartman adını, adresini, varsayılan aidatı ve son ödeme gününü girin.
2. Daireler'den daire numarası, malik/sakin ve aylık aidat tutarını ekleyin.
3. Eski borçlar için Aidatlar → Ek / Devir Borcu; mevcut para için Kasa ve Banka → Açılış Bakiyesi kullanın.
4. Aidatlar → Aidat Oluştur ile ay ve son ödeme tarihini kontrol ederek borçlandırın.
5. Ödemeleri Tahsilatlar'dan, masrafları Giderler'den kaydedin.
6. Raporlar'dan CSV alın veya Yazdır / PDF kullanın.

## Özellikler

- Genel bakış: seçili dönem tahakkuku, tahsilatı, açık borcu, altı aylık gelir/gider grafiği; tüm zamanlar kasa/banka toplamı.
- Daireler: malik, sakin, isteğe bağlı telefon, daireye özel aidat, arşivleme ve hesap dökümü.
- Aidatlar: aylık toplu borçlandırma, aynı daire/dönemde tekrar engeli, ek borç ve devir borcu.
- Tahsilatlar: kısmi ödeme, belirli borca öncelik, en eski borçtan dağıtım ve avans; yazdırılabilir makbuz.
- Giderler: kategori, tarih, ödeme hesabı ve açıklama.
- Kasa ve banka: iki hesap, ayrı açılış bakiyeleri ve hesaplar arası transfer.
- Raporlar: borçlu daireler, tahsilatlar, giderler ve güncel daire bakiyeleri; dönem/daire filtreleri ve Excel uyumlu CSV.
- Ayarlar: apartman bilgileri, erişim modu, JSON veri dışa aktarımı ve son 500 işlemin listesi. Parola değiştirme yalnızca isteğe bağlı parola modu açıkken görünür.
- Mali iptaller: kayıt silinmez, gerekçe saklanır; bakiye ve ödeme dağılımları yeniden hesaplanır.

## Para ve borç kuralları

Tüm tutarlar veritabanında **kuruş cinsinden tamsayı** tutulur. Formlarda `1.234,56` veya `1234,56` biçimi kullanın; ondalık ayırıcı virgüldür.

Tahakkuk kasayı artırmaz. Tahsilat kasayı artırır, gider azaltır. Açılış bakiyesi gelir sayılmaz; devir borcu kasayı etkilemez. Transfer toplam varlığı değiştirmez.

Tahsilat önce seçilen açık borca, sonra en eski açık borca uygulanır. Artan tutar avans olarak kalır ve yeni borçlara otomatik uygulanır. Geçmiş kayıt iptal edildiğinde aktif tahsilatlar yeniden dağıtılır. Tahsilat tekrar gönderilirse aynı işlem anahtarı ikinci kez kaydedilmesini engeller.

Aidat dönemindeki **Kalan Borç**, o dönemin borçlarının bugünkü açık kısmıdır; dönem sonu tarihsel bakiye değildir. Daire bakiyeleri ve kasa kartları tüm zamanların güncel durumudur. Gelir/gider grafiği tahsilat ve giderin işlem tarihini kullanır. Hesap dökümündeki borçlar son ödeme tarihine göre sıralanır.

Yeni dairenin varsayılan aidatı Ayarlar'dan gelir. Ayarlar'daki tutar değişikliği mevcut daireleri ve önceden oluşturulmuş borçları değiştirmez. Arşiv daireler yeni toplu aidatlara dahil edilmez; eski borç ve ödeme geçmişleri korunur.

## Veri kaydı ve yedekleme

Asıl kayıt dosyası varsayılan olarak `data/aidat.sqlite` dosyasıdır. Tarayıcı verilerini temizlemek bu kayıtları silmez. Sunucu yeniden başlatıldığında kayıtlar korunur. Barındırmada bu dizin **kalıcı diskte** olmalıdır; geçici dosya sisteminde çalıştırmayın. SQLite için tek sunucu ve yerel disk kullanın; ağ diski veya aynı dosyaya birden çok dağıtım bağlamayın.

Tutarlı bir SQLite yedeği oluşturmak için:

```bash
npm run backup
```

Dosya `outputs/` dizinine yazılır. Farklı bir hedef için:

```bash
npm run backup -- /guvenli-yedekler/aidat.sqlite
```

Bu komut SQLite `VACUUM INTO` kullanır; uygulama açıkken de tutarlı kopya oluşturur. Var olan hedefin üzerine yazmaz. Yedekler kişisel veriler ve parola özeti içerir; yalnızca yetkili kişilerin erişebildiği yerde tutun. Çıktıları GitHub'a yüklemeyin.

**Geri yükleme:** Uygulamayı durdurun. Mevcut `data/` dizininin ayrıca kopyasını alın. SQLite yedeğini `DB_PATH` ile gösterilen dosyanın yerine koyun. Önceki veritabanına ait `-wal` ve `-shm` dosyalarını canlı dizinden kaldırın; eski dizinin kopyasında muhafaza edin. Uygulamayı başlatıp kayıtları kontrol edin. Geri yüklenen dosyada eski oturumlar bulunabileceğinden yönetici parolasını sıfırlayarak oturumları sonlandırın.

Ayarlar'daki JSON dışa aktarımı mali verilerin inceleme kopyasıdır; parola ve oturum içermez, işlem geçmişi son 500 kayıtla sınırlıdır. **Tam yedek yerine geçmez ve JSON içe aktarma ekranı yoktur.** Otomatik zamanlanmış yedekleme bu sürümde kurulu değildir.

## Erişim ve isteğe bağlı parola

Varsayılan `PASSWORD_REQUIRED=false`: kullanıcı talebiyle parola girişi kapalıdır. Uygulamaya ulaşabilen herkes tüm mali verileri okuyabilir ve değiştirebilir. Anonim tarayıcı oturumu ve CSRF doğrulaması sürer; bunlar kullanıcı kimlik doğrulaması sağlamaz. Sunucu yeniden başlatıldığında oturumlar sıfırlanır; mali veriler korunur.

Parolayı yeniden etkinleştirmek için sunucuda `PASSWORD_REQUIRED=true` tanımlayıp yeniden başlatın. Aşağıdaki parola kuralları yalnızca bu mod için geçerlidir.

Parola scrypt ile tuzlanarak özetlenir; açık hali saklanmaz. Oturum çerezi HttpOnly ve SameSite=Strict'tir. Oturumlar 8 saat geçerlidir. Yazma işlemleri kaynak ve CSRF doğrulaması gerektirir; giriş 15 dakikada 10 başarısız denemeyle sınırlandırılır.

Parolanızı Ayarlar'dan değiştirebilirsiniz; bu işlem tüm açık oturumları sonlandırır. Unutulan parola için sunucuya yetkili erişimi olan kişi `RESET_ADMIN_PASSWORD` ortam değişkenini güvenli biçimde tanımlayıp aşağıdaki komutu çalıştırır:

```bash
npm run reset-password
```

Yeni parolayı komut satırı argümanına yazmayın veya kaynak koduna eklemeyin. İşlemden sonra ortam değişkenini kaldırın. `ADMIN_PASSWORD` yalnızca ilk kurulum içindir; mevcut parolayı otomatik değiştirmez.

## Yapılandırma

İsteğe bağlı `.env` dosyası için `.env.example` dosyasını kopyalayın. `npm start` ve yardımcı komutlar bu dosyayı okur. `.env` Git'e dahil edilmez.

| Değişken | Varsayılan / kullanım |
| --- | --- |
| `HOST` | `127.0.0.1`; yerel erişim |
| `PORT` | `3000` |
| `DB_PATH` | `./data/aidat.sqlite` |
| `PASSWORD_REQUIRED` | Varsayılan `false`; parola ile erişim için `true` |
| `ADMIN_PASSWORD` | Parola modu açıksa dış ağdaki ilk çalıştırmada en az 12 karakter |
| `PUBLIC_ORIGIN` | Dış yayındaki tam kaynak; ör. `https://aidat.example.com`, son `/` olmadan |
| `SECURE_COOKIE` | HTTPS yayında `true` olmalı |
| `RESET_ADMIN_PASSWORD` | Yalnızca yetkili parola sıfırlamada |

Parola modu açıkken ilk parolayı webden oluşturma yalnızca loopback adresinde çalışan yerel sunucuda açıktır. Parolasız modda parola kurulumu ve değiştirme uçları kapalıdır. Dış ağa parola ile açılırken ilk parola sunucunun ortam değişkeninden tanımlanır. Sunucu yöneticisinin dosya/ortam erişimi güvenilir kabul edilir.

## Sunucuda yayın

Node.js 24 destekli ve kalıcı diski olan bir sunucuda çalışır. Önüne HTTPS sağlayan bir reverse proxy koyun. `HOST=0.0.0.0`, `PUBLIC_ORIGIN=https://gercek-adresiniz` ve `SECURE_COOKIE=true` tanımlayın. `PASSWORD_REQUIRED=false` ile parola gerekmez. İsteğe bağlı parola modunda ilk dış ağ çalıştırmasında `ADMIN_PASSWORD` gerekir. Kaynak kontrolü, hatalı `PUBLIC_ORIGIN` tanımında giriş ve yazma işlemlerini reddeder.

Docker örneği; ortam değişkenleri önceden güvenli şekilde tanımlanmış olmalıdır:

```bash
docker build -t apartman-aidat-takip .
docker run -d --name aidat \
  -p 127.0.0.1:3000:3000 \
  -v aidat-data:/app/data \
  -e PUBLIC_ORIGIN \
  --restart unless-stopped \
  apartman-aidat-takip
```

Bu örnek HTTPS reverse proxy arkasında kullanım içindir. Üretim çerezi yalnızca HTTPS üzerinden gönderilir. SQLite dosyasını kalıcı volume'de tutun ve düzenli yedek alın. Docker imajının burada çalıştırılarak doğrulanmadığını dikkate alın.

### Ücretli dağıtım kapalı

Kullanıcının sıfır ücret talebi doğrultusunda ücretli Render blueprint'i kaldırılmıştır. Ücretsiz yayın, yukarıdaki tarayıcı kayıtlı statik sürümdür. Bu sürüm için Render, Neon veya başka bir veritabanı bağlantısı gerekmez.

Sites yardımcıları bu çalışma ortamında bulunmadığı için bu proje Sites'a yayımlanmadı. Henüz canlı yayın bağlantısı yoktur.

## GitHub

Kaynak deposu: [trocki59-byte/apartman-aidat-takip](https://github.com/trocki59-byte/apartman-aidat-takip). Depo özeldir; erişim yetkisi gerekir.

Kendi yetkili bilgisayarınıza indirmek için:

```bash
gh auth login
gh repo clone trocki59-byte/apartman-aidat-takip
cd apartman-aidat-takip
npm start
```

ZIP dosyası Git geçmişini içermez; güncel kod ve geçmiş için depoyu klonlayın.

Veri dosyaları, parolalar, yedekler ve test çıktıları depoya girmez. GitHub Pages depo kökündeki veya `gh-pages` dalındaki ücretsiz tarayıcı sürümünü çalıştırabilir; Node.js/SQLite sunucu sürümünü çalıştırmaz.

## Kontroller

Mali çekirdek, gerçek SQLite, sunucunun gerçek HTTP ayrıştırıcısı, oturum ve güvenlik kontrolleri:

```bash
npm test
npm run check
```

Test ortamı ağ portu açmayı engellediği için HTTP testleri sunucunun gerçek HTTP ayrıştırıcısına bellek içi bağlantı üzerinden istek verir. Üretim sunucusu normal Node HTTP sunucusudur; test için API yolları atlanmaz.

Son doğrulamada 35 test geçti; dış ağda sunucu başlatma alt süreç testi ortamın `EPERM` engeli nedeniyle atlandı. Sözdizimi kontrolleri geçti. Yedekleme ve parola sıfırlama gerçek SQLite dosyalarıyla test edildi.

Tarayıcı akış testleri için geliştirme bağımlılığını ve Chromium'u yükleyin:

```bash
npm install
npx playwright install chromium
npm run test:browser
```

Mevcut Chromium kullanılacaksa `CHROMIUM_PATH` değişkenini ayarlayın. Tarayıcı testi ilk kurulum, daire ekleme, borçlandırma, kısmi tahsilat, gider, makbuz, CSV indirme, yeniden açılış ve mobil menüyü kapsar. Bu ortamda Chromium ağ/soket izninde engellendiği için yeni telefon/tema testi herkese açık deponun ücretsiz GitHub Actions ortamında gerçek Chromium ile çalıştırıldı ve geçti. 1440, 480, 390 ve 320 px genişlik; kısa/yatay ekran menüsü; açık/koyu tercihinin yenilemede ve daire kayıtlarının korunması doğrulandı. Ayrıntılar `.github/workflows/mobile-ui.yml` ve `npm run test:ui` komutundadır. Otomatik yedek testleri ayrıca eski IndexedDB kaydının korunmasını, geçmişten geri yüklemeyi, geçersiz geri yüklemede atomikliği, gerçek OPFS dosya API'leriyle JSON yazımını, disk hatasını ve iki sekmenin eşzamanlı kaydını doğrular. İşletim sisteminin gerçek klasör seçme/izin penceresi kullanıcı tarafından tamamlanır. Önceki tam sunucu tarayıcı akışı ayrı bir testtir.

## Kapsam sınırları

Çoklu apartman, sakin hesabı, çevrimiçi tahsilat, banka bağlantısı, SMS/e-posta gönderimi, otomatik gecikme faizi ve resmi e-fatura yoktur. Makbuz uygulama içi tahsilat dökümüdür.

Kaynak incelemesinde belirlenen iki küçük kullanım sınırı: toplu borçlandırmada dönem değiştirilirse son ödeme tarihini de kontrol edin; formdayken 8 saatlik tarayıcı oturumu dolarsa sayfayı yenileyin (parolasız modda panel doğrudan yeniden açılır). Bu durumlar mali kaydın yetkisiz kaydedilmesine yol açmaz.
