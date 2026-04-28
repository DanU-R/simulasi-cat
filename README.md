# Simulasi CAT KDKMP

Aplikasi simulasi Computer Assisted Test (CAT) untuk latihan mandiri TPK dan TMK KDKMP. Aplikasi ini berjalan sebagai web app ringan dengan bank soal lokal, timer, review jawaban, riwayat latihan, progress tracking, dan opsi membuat soal latihan baru menggunakan AI melalui SwiftRouter.

## Disclaimer Penting

**Semua soal dalam aplikasi ini adalah materi latihan/prediksi orisinal. Soal bukan soal resmi, bukan bocoran ujian, dan tidak berafiliasi dengan panitia atau instansi penyelenggara ujian.**

Sebagian soal dapat dibuat atau dikembangkan dengan bantuan AI untuk kebutuhan latihan mandiri. Soal AI bersifat generatif, dapat mengandung kekeliruan, dan sebaiknya ditinjau kembali sebelum dipakai sebagai referensi belajar utama.

Skor yang ditampilkan adalah skor latihan internal aplikasi. Skor tersebut **bukan nilai resmi**, bukan indikator kelulusan, dan tidak menjamin hasil ujian sebenarnya.

## Fitur Utama

- Mode latihan TPK, TMK, dan gabungan.
- Latihan bebas TPK berdasarkan subkategori.
- Timer otomatis dan durasi custom.
- Review jawaban dengan pembahasan dan alasan opsi.
- Riwayat latihan lokal di browser.
- Progress soal yang pernah dikerjakan.
- Export hasil dan progress ke JSON.
- Generator soal AI berbasis SwiftRouter API.
- UI modern dan responsive untuk desktop/mobile.

## Menjalankan Aplikasi

### Prasyarat

- Node.js
- Browser modern seperti Chrome, Edge, Firefox, atau Safari

### Instalasi

```bash
npm start
```

Lalu buka:

```text
http://localhost:4173
```

## Konfigurasi AI SwiftRouter

Fitur **Buat Soal AI** membutuhkan API key SwiftRouter dan hanya berjalan lewat server lokal/app server. Jangan menaruh API key langsung di kode frontend.

1. Salin contoh environment:

```bash
cp .env.example .env
```

2. Isi `.env`:

```env
SWIFTROUTER_API_KEY=isi_key_swiftrouter
SWIFTROUTER_MODEL=gpt-5.4-mini
PORT=4173
```

3. Restart server setelah mengubah `.env`:

```bash
npm start
```

Catatan: `.env` sudah masuk `.gitignore` dan tidak boleh dipush ke GitHub.

## Testing

Validasi bank soal:

```bash
npm run validate:questions
```

Jalankan semua test:

```bash
npm run test:all
```

Test individual:

```bash
npm run test:quiz
npm run test:storage
npm run test:export
npm run test:history
npm run test:progress
npm run test:unseen
npm run test:subcategory
```

## Mode Latihan

- **Latihan Bebas TPK**: pilih subkategori dan jumlah soal TPK.
- **Simulasi TPK**: 85 soal TPK lengkap.
- **Simulasi TMK**: 20 soal TMK lengkap.
- **Simulasi Gabungan**: TPK + TMK.
- **Soal AI**: pilih kategori, subkategori, dan jumlah soal untuk membuat latihan baru.

## Aturan Skor Latihan

### TPK

- Benar: +1 poin
- Salah: 0 poin
- Kosong: 0 poin

### TMK

- Benar: +5 poin
- Salah: 0 poin
- Kosong: 0 poin

## Bank Soal Lokal

### TPK

- Bahasa/Verbal: 15 soal
- Hitungan/Numerik: 20 soal
- Pengetahuan Umum: 15 soal
- Pola Gambar: 15 soal
- Abstraksi Ruang: 10 soal
- Bentuk/Menentukan Bentuk: 10 soal

### TMK

- Prinsip Koperasi: 3 soal
- Tata Kelola: 5 soal
- Pengelolaan Usaha: 4 soal
- Pengelolaan Keuangan: 3 soal
- Pelayanan Anggota: 3 soal
- Pengembangan Kelembagaan: 2 soal

## Struktur Folder

```text
simulasi-cat-kdkmp/
├── data/questions/          # Bank soal JSON
├── src/                     # Source code aplikasi
│   ├── app.js
│   ├── quiz-engine.js
│   ├── quiz-ui.js
│   ├── question-service.js
│   ├── mode-config.js
│   ├── storage-service.js
│   ├── export-service.js
│   ├── history-service.js
│   ├── progress-service.js
│   └── styles.css
├── tools/                   # Script validasi dan testing
├── index.html
├── server.js
├── package.json
└── README.md
```

## Teknologi

- Frontend: HTML5, CSS3, Vanilla JavaScript
- Server lokal/API proxy: Node.js
- Storage: localStorage browser
- AI provider: SwiftRouter API
- Testing: custom Node.js scripts

## Deploy ke Vercel

Saat deploy ke Vercel, tambahkan environment variable berikut di dashboard Vercel:

```text
SWIFTROUTER_API_KEY
SWIFTROUTER_MODEL
```

Pastikan API key tidak ditulis di file publik atau repository.

## Lisensi

MIT License. Aplikasi ini dibuat untuk kebutuhan edukasi dan latihan mandiri.
