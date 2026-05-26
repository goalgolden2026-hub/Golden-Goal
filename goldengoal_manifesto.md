# Golden Goal Manifesto

*Sürüm: 1.1.0*  
*Son Güncelleme: 22 Mayıs 2026*  

Bu belge, Golden Goal platformunun mimarisini, ekonomisini ve özellik setini yasal uyumluluk ve beceri temelli simülasyon ilkeleri çerçevesinde açıklayan ana referans dokümanıdır.

## 1. Temel Mekanikler & Ekonomi

### 1.1 Altın Puanlar (XP) ve Token Yapısı
Platformun temel etkileşim ve beceri ölçeğidir.
- **Kazanım:** Kullanıcılar ücretsiz bir başlangıç kotası ile başlarlar. Sosyal görevleri tamamlayarak, isabetli tahminler yaparak ve arkadaşlarını platforma davet ederek XP (Deneyim Puanı) kazanırlar.
- **Kullanım:** Becerilerini test etmek amacıyla tahminlerde bulunmak, günlük Ödül Kutusu (Rewards Box) açmak ve staking mekanizmasıyla VIP ayrıcalıklar elde etmek.

### 1.2 Tahmin Sistemi (Prediction System)
- **Marketler:** Kullanıcılar Maç Sonucu (Ev Sahibi, Beraberlik, Deplasman), Karşılıklı Gol Var/Yok, 2.5 Alt/Üst ve Çifte Şans gibi standart spor analiz pazarlarında tahminler gerçekleştirebilir.
- **Kısıtlamalar:** Tahminler, ilgili maçın başlama saatine 5 dakika kalana kadar değiştirilebilir veya iptal edilebilir. Tahmin değişikliği 100 Altın Token, tahmin iptali ise 200 Altın Token işlem ücretine tabidir (Bu ücretlerin yarısı yakılır, diğer yarısı ödül havuzuna aktarılır).

## 2. Staking Kademeleri & Ayrıcalıklar

Kullanıcılar, Golden Token'larını belirli sürelerle kilitleyerek (Staking) VIP analiz seviyelerine yükselebilir ve günlük tahmin limitlerini artırabilirler.
- **Tier 1 (Soft Stake):** 75 XP Ödül Kutusu maliyeti, günlük +1 Ek Tahmin Limiti.
- **Tier 2 (7 Günlük Kilit):** 50 XP Ödül Kutusu maliyeti, günlük +3 Ek Tahmin Limiti.
- **Tier 3 (15 Günlük Kilit):** 25 XP Ödül Kutusu maliyeti, günlük +5 Ek Tahmin Limiti.
- **Tier 4 (1 Aylık Kilit):** Her gün ilk Ödül Kutusu açımı TAMAMEN ÜCRETSİZ, sonraki açımlar 25 XP, günlük +10 Ek Tahmin Limiti.

*Not: Herhangi bir staking işlemi yapmayan kullanıcılar (Tier 0), standart günlük 5 tahmin hakkına sahiptir ve Ödül Kutusu açımları için 100 XP öderler.*

## 3. Sosyal Büyüme & Oyunlaştırma

### 3.1 Ödül Kutusu (Rewards Box - Sadakat Modülü)
- Şans faktöründen uzak, tamamen kullanıcı bağlılığı ve XP ödüllendirmesine dayalı, neon/altın temalı görsel efektler ve konfeti animasyonları içeren premium bir sadakat modülüdür.
- Kutu açım maliyetleri kullanıcının Staking kademesine göre dinamik olarak azalır.
- **Ödüller:** Ek tahmin limitleri veya doğrudan profil puanına eklenen XP Puanları (+100, +250, +500, +1000 XP) matematiksel oranlara göre dağıtılır.

### 3.2 Sınırsız Sosyal Görevler (Twitter Farming)
- Kullanıcılar X (Twitter) platformunda `#GoldenGoal` etiketi ile paylaşımlar yaparak topluluk puanı toplayabilirler.
- **Ödül:** Geçerli paylaşım başına 25 Sosyal Puan.
- **Güvenlik Kısıtlamaları:** Spam önlemek amacıyla gönderimler arası 60 saniye bekleme süresi uygulanır. Küresel düzeyde daha önce kullanılan URL'ler sistem tarafından reddedilir.

### 3.3 Liderlik Tabloları (Leaderboards)
- **Sosyal Liderlik:** Kullanıcıları tamamen sosyal paylaşımlardan kazandıkları Sosyal Puanlara göre sıralar.
- **Uzman Analistler Liderlik Tablosu:** Kullanıcıları yaptıkları isabetli tahmin oranlarına ve puanlarına göre sıralar.
  - Toplam Tahmin (TP), Başarılı Tahmin (WP) ve Başarı Oranı (WR) gibi tamamen analitik verileri sergiler.
  - Giriş yapmış kullanıcılar için sayfanın en altında kişiselleştirilmiş "Sıralamanız" kartı yer alır.

## 4. Teknik Mimari & Canlıya Alım

### 4.1 Teknoloji Yığını
- **Önyüz:** Next.js (App Router), Vanilla CSS, Solana Web3 Cüzdan Bağlantısı.
- **Arkayüz:** Next.js Sunucusuz (Serverless) API Rotaları.
- **Veritabanı:** Vercel Postgres SQL (`@vercel/postgres`).

### 4.2 Canlıya Alım & Entegrasyon İş Akışı
- **GitHub Deposu:** [https://github.com/goalgolden2026-hub/Golden-Goal.git](https://github.com/goalgolden2026-hub/Golden-Goal.git)
- **Vercel Projesi:** GitHub `main` dalına otomatik bağlıdır.
- **Canlı Adres:** [https://golden-goal-five.vercel.app](https://golden-goal-five.vercel.app)

**Çalışma Döngüsü:**
1. Kod geliştirmeleri yerel olarak `/scratch/golden-goal` dizininde yapılır.
2. Değişiklikler Git aracılığıyla (`git add .`, `git commit -m "..."`, `git push`) GitHub `main` dalına gönderilir.
3. Vercel değişikliği anında algılayıp otomatik derleme ve dağıtım sürecini başlatır.
4. Çevre değişkenleri (örn. `POSTGRES_URL`) Vercel arayüzünde güvenli bir şekilde saklanır ve yerelde `.env.local` dosyasıyla eşleştirilir.
