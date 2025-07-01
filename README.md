# 🔍 SEO Tools Web Uygulaması

Bu proje, çeşitli SEO analiz araçlarını bir araya getiren Node.js tabanlı bir web uygulamasıdır. Kullanıcılar sayfa başlığı, meta açıklama, Google SERP analizi gibi araçlarla web sitelerini kolayca analiz edebilir.

---

## 🚀 Kurulum

### Reponun Klonlanması

```bash
git clone https://github.com/RessKok/seotool.git
cd seotool
```

### Gerekli Bağımlılıklar

Aşağıdaki paketlerin kurulu olması gereklidir:

- **axios** – HTTP istekleri için
- **canvas** – Görsel işlemler için
- **cheerio** – HTML parse işlemleri için
- **express** – Web sunucusu
- **puppeteer** – Headless browser işlemleri (Google SERP çekimi vb.)

Bağımlılıkları yüklemek için:

```bash
npm install
```

---

## 🧪 Kullanım

Uygulamayı başlatmak için terminalde aşağıdaki komutu çalıştırın:

```bash
node server.js
```

Tarayıcınızdan şu adrese gidin:

```
http://localhost:3000
```

---

## 🔧 Özellikler

- ✅ Meta Başlık uzunluk ve piksel genişlik kontrolü
- ✅ Meta Açıklama uzunluk ve piksel genişlik kontrolü
- ✅ Google SERP Analizi (Başlık, Açıklama, URL, Canonical, H1-H2 Etiketleri)
- ✅ Mobil ve masaüstü uyumlu kullanıcı arayüzü (OPSİYONEL)
- ✅ Dropdown menü ile SEO araçları arasında animasyonlu geçiş (buda opsiyonel)

---

## 📜 Lisans

Bu proje [MIT Lisansı](LICENSE) ile lisanslanmıştır. (opsiyonel)


## API

- **Size bedava serp apisi verdim çünkü onun için kod yazmaya üşendim yakında yazarım**