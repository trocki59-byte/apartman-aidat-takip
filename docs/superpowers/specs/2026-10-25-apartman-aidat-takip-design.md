# Apartman Aidat Takip — Tasarım

Durum: Kullanıcı onayı bekleyen öneri.

## Amaç ve onaylanan kapsam
Yeni, detaylı, Türkçe bir web uygulaması; tek apartman için yalnızca yönetici kullanacak. Kaynak kodu GitHub deposunda tutulacak. Sakin hesabı veya sakin giriş ekranı olmayacak. Daire sayısı ve tutarlar kullanıcıdan uygulama içinde alınacak.

## Yaklaşımlar
1. Yalnızca yönetici paneli: kullanıcı bunu seçti. Daire, borç, ödeme, gider ve rapor işlemleri tek panelde.
2. Yönetici ve sakin paneli: kullanıcı istemedi; kapsam dışı.
Teknik öneri: sunucu tarafında kalıcı veritabanı ve korumalı yönetici erişimi. Tarayıcıda saklanan tek cihazlık uygulama, mali kayıtların farklı cihazlarda yönetilmesi ve korunması açısından tercih edilmiyor. Teknik seçim henüz kullanıcı tarafından onaylanmadı.

## Önerilen ekranlar
- Özet: seçilen dönemin toplam aidat borcu, tahsilatı, kalan borcu, gelir/gideri ve kasa bakiyesi; gecikmiş borçlar ve son işlemler.
- Daireler: daire numarası, malik/kiracı adı, isteğe bağlı iletişim bilgisi, aktiflik, aylık aidat tutarı. İşlem geçmişi olan daireler silinmek yerine arşivlenir.
- Aidatlar: ay ve yıl seçerek aktif dairelere toplu borç oluşturma, tutar kontrolü, ek borç ve başlangıç borcu kaydı. Aynı daire ve dönem için standart aidat iki kez oluşturulamaz.
- Tahsilatlar: daire, tarih, tutar, nakit/banka yöntemi ve açıklama. Kısmi ödeme ve borca ödeme dağılımı; makbuz ve daire hesap dökümü. Fazla ödeme avans olarak açıkça gösterilir.
- Giderler: tarih, kategori, tutar, ödeme kaynağı ve açıklama. Varsayılan kategoriler elektrik, su, temizlik, bakım ve diğer.
- Kasa ve banka: hesap bazında açılış bakiyesi ve hareketler; hesaplar arası transfer toplam geliri artırmaz.
- Raporlar: dönem ve daire filtreleri, borçlu daireler, tahsilat ve gider listeleri; CSV indirme ve yazdırılabilir dökümler.
- Ayarlar: apartman adı/adresi, varsayılan aidat, son ödeme günü ve yönetici erişimi.

## Mali kurallar
Tutarlar kuruş cinsinden tamsayı olarak tutulur ve Türk lirası biçiminde gösterilir. Aidat tahakkuku kasaya gelir yazmaz; sadece tahsilat kasayı artırır. Başlangıç borcu ve hesap açılış bakiyesi ayrıdır. Tahsilat önce seçilen borca, tercih yapılmadıysa en eski borca dağıtılır; avans ayrıca izlenir. İptal ve düzeltmeler iz bırakır; mali hareketler sessizce silinmez. İlk sürüm otomatik gecikme faizi hesaplamaz.

## Veri ve erişim
Tek apartman ayarları, yönetici kimliği, daireler, kişiler, hesaplar, tahakkuklar, tahsilatlar, ödeme dağılımları, giderler ve işlem geçmişi ayrı kayıtlardır. Tahsilat ve borç dağılımı atomik kaydedilir. Sunucu her veri işleminde yönetici yetkisini doğrular. Kalıcı veritabanı asıl veri kaynağıdır; örnek veriler gerçek kayıt gibi sunulmaz. Veri dışa aktarımı sağlanır; otomatik yedekleme kapsamı barındırma seçiminden sonra netleştirilir.

## Arayüz
Türkçe, masaüstü ve telefona uyumlu; okunaklı tablolar, filtreler, boş durum açıklamaları ve açık form hataları. Silme/iptal gibi işlemler anlaşılır onay gerektirir. Tüm işlemler klavye ile erişilebilir olmalı.

## Sınırlar
Çoklu apartman, sakin hesabı, çevrimiçi ödeme, banka entegrasyonu, SMS/e-posta gönderimi ve resmi e-fatura kapsam dışıdır. Makbuz uygulama içi tahsilat dökümüdür.

## GitHub ve uygulama kararları
Önerilen depo adı `apartman-aidat-takip`; varsayılan görünürlük özel. Depo henüz oluşturulmadı. GitHub bağlantısında depo oluşturma aracı görünmüyor; uygulamadan önce mevcut yetkilendirilmiş alternatif kontrol edilecek. Kaynak kodu, Türkçe kurulum belgesi ve uygun kontroller depoda bulunacak. Gizli anahtarlar depoya yazılmaz. Barındırma ve teknoloji önerileri uygulama planında mevcut ortam olanaklarına göre kesinleştirilecek.

## Kabul ölçütleri
Daire oluşturma, aylık borçlandırma, tekrar borçlandırmayı engelleme, kısmi ve tam ödeme, avans, gider kaydı, doğru kasa bakiyesi, filtreli rapor ve CSV akışları doğrulanır. Yetkisiz veri erişimi reddedilir. Kayıtlar yeniden açılışta korunur. GitHub deposu ve yayın bağlantıları yalnızca gerçekten oluşturulup doğrulandıktan sonra paylaşılır.
