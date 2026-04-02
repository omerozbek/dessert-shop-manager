# Dulci 🍰
### Tatlı Dükkanı Yönetim Uygulaması

Tariflerinizi, malzemelerinizi, siparişlerinizi ve kârınızı yönetmek için tasarlanmış, **tamamen çevrimdışı çalışan** Türkçe Progressive Web App.

---

## Özellikler

### 🍰 Tarif Yönetimi
- Tarif ekle, düzenle, sil
- Her tarife malzeme ve miktar ekle
- **Maliyet otomatik hesaplanır** — malzeme fiyatı değişince tarif maliyeti anında güncellenir
- Önerilen satış fiyatı kâr oranına göre hesaplanır

### 🛒 Malzeme Yönetimi
- Malzeme ekle, düzenle, sil
- 12 farklı birim desteği (kg, g, L, ml, adet, vb.)
- **Fiyat geçmişi** — her fiyat değişikliği kayıt altında tutulur
- **İnternetten fiyat çekme** — Migros ve Altınogulları'ndan otomatik fiyat güncelleme

### 📋 Sipariş Sistemi
- Yeni sipariş oluştur (tariflerden seç + miktar belirle)
- **Satış fiyatı sipariş anında belirlenir** — tarife bağlı değil
- Durum takibi: Beklemede → Satıldı / İptal Edildi
- **Fiyat kilidi** — sipariş oluşturulduğunda fiyat ve maliyet kilitlenir, sonraki malzeme fiyat değişikliklerinden etkilenmez

### 📊 Sipariş Geçmişi & Kâr Takibi
- Tamamlanan siparişlerin listesi
- Her sipariş için gelir, maliyet ve kâr gösterimi
- Genel toplam gelir, maliyet, net kâr ve kâr marjı

### ⚙️ Ayarlar
- Kâr oranı (sınırsız — %0'dan başlar)
- Para birimi seçimi (TRY, USD, EUR ve daha fazlası)
- Toplu fiyat güncelleme modalı
- Tüm verileri temizleme

---

## Kurulum

### Gereksinimler
- Node.js 18 veya üzeri
- npm 9 veya üzeri

### Adımlar

```bash
# 1. Bağımlılıkları yükle
npm install

# 2. Geliştirme sunucusunu başlat
npm run dev
# → http://localhost:5173

# 3. Üretim için derle
npm run build

# 4. Üretim derlemesini önizle
npm run preview
```

---

## Mobil Kurulum (PWA)

Uygulama bir Progressive Web App'tir — tarayıcıdan **ana ekrana eklenebilir**:

- **Android (Chrome):** Tarayıcı menüsü → "Ana ekrana ekle"
- **iOS (Safari):** Paylaş butonu → "Ana Ekrana Ekle"
- **Desktop (Chrome/Edge):** Adres çubuğundaki yükle ikonuna tıkla

Kurulumdan sonra uygulama **internetsiz tam olarak çalışır.**

---

## Teknik Detaylar

| | |
|---|---|
| Framework | React 18 + Vite 5 |
| Veritabanı | IndexedDB (Dexie.js) — tüm veriler cihazda saklanır |
| PWA | Workbox service worker (tüm assets önbelleğe alınır) |
| Stil | Tailwind CSS 3 |
| İnternet fiyat çekme | CORS proxy (allorigins.win) üzerinden Migros & Altınogulları |

---

## Veri Güvenliği

- Tüm veriler **yalnızca cihazınızda** saklanır (IndexedDB)
- Hiçbir veri sunucuya gönderilmez
- Fiyat çekme özelliği opsiyoneldir; devre dışı bırakılabilir
- Sipariş fiyatları ve maliyetleri oluşturulma anında kilitlenir — sonradan değiştirilemez

---

## Geliştirme Notları

Kod yapısı ve mimari kararlar için `CLAUDE.md` dosyasına bakın.
Planlanan özellikler için `TODOS.md` dosyasına bakın.
