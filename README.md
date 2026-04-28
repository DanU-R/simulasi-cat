# Simulasi CAT KDKMP

Aplikasi simulasi Computer Assisted Test (CAT) untuk Kementerian Desa, Pembangunan Daerah Tertinggal, dan Transmigrasi (KDKMP) berbasis web dengan fitur lengkap untuk latihan soal TPK dan TMK.

## ⚠️ DISCLAIMER PENTING

**SEMUA SOAL DALAM APLIKASI INI ADALAH SOAL PREDIKSI ORISINAL UNTUK KEPERLUAN LATIHAN, BUKAN SOAL RESMI DAN BUKAN BOCORAN UJIAN.**

Aplikasi ini dibuat untuk membantu persiapan ujian dengan menyediakan simulasi yang mirip dengan format CAT KDKMP. Skor yang diperoleh adalah skor latihan internal dan **BUKAN NILAI RESMI** ujian.

## 🚀 Cara Install dan Menjalankan

### Prasyarat
- Node.js (untuk menjalankan server lokal)
- Browser modern (Chrome, Firefox, Safari, Edge)

### Langkah Instalasi
1. Clone atau download repository ini
2. Buka terminal/command prompt di folder aplikasi
3. Jalankan perintah:
   ```bash
   npm start
   ```
4. Buka browser dan akses URL yang ditampilkan (biasanya `http://localhost:3000`)

### Alternatif Tanpa Node.js
Jika tidak memiliki Node.js, buka file `index.html` langsung di browser. Namun beberapa fitur mungkin tidak berfungsi optimal.

## 🧪 Cara Validasi dan Testing

### Validasi Bank Soal
```bash
npm run validate:questions
```

### Test Semua Komponen
```bash
npm run test:all
```

### Test Individual
```bash
npm run test:quiz      # Test quiz engine
npm run test:storage   # Test localStorage
npm run test:export    # Test export functionality
npm run test:history   # Test history management
```

## 🎯 Fitur Aplikasi

### 1. **Mode Latihan**
- **Latihan Bebas TPK**: Pilih subkategori dan jumlah soal TPK
- **Simulasi TPK**: 85 soal TPK lengkap (85 menit)
- **Simulasi TMK**: 20 soal TMK lengkap (20 menit)
- **Simulasi Gabungan**: TPK + TMK (105 menit)

### 2. **Pengerjaan Soal**
- Interface mirip CAT asli
- Navigasi antar soal dengan nomor
- Indikator soal terjawab/belum
- Konfirmasi sebelum selesai

### 3. **Timer Latihan**
- Timer otomatis sesuai mode
- Durasi custom (1-180 menit)
- Visual warning saat waktu hampir habis
- Auto-finish saat waktu habis

### 4. **Review Jawaban**
- Detail pembahasan setiap soal
- Penjelasan setiap opsi jawaban
- Filter jawaban (Semua/Benar/Salah/Kosong)
- Cara cepat mengerjakan

### 5. **Export dan Cetak**
- Cetak hasil dengan layout rapi
- Download hasil dalam format JSON
- Data ringkas tanpa isi soal penuh

### 6. **Riwayat Latihan Lokal**
- Simpan otomatis setiap latihan selesai
- Statistik performa keseluruhan
- Detail ringkas per latihan
- Download riwayat lengkap
- Maksimal 20 riwayat terakhir

### 7. **Lanjutkan Sesi**
- Auto-save progres setiap aksi
- Lanjutkan sesi setelah refresh browser
- Restore timer dan jawaban
- Hapus progres kapan saja

## 📊 Aturan Skor Latihan

### TPK (Tes Potensi Kognitif)
- **Benar**: +1 poin
- **Salah**: 0 poin
- **Kosong**: 0 poin

### TMK (Tes Manajerial Koperasi)
- **Benar**: +5 poin
- **Salah**: 0 poin
- **Kosong**: 0 poin

### Catatan Penting
- Skor ini adalah **skor latihan internal** untuk keperluan belajar
- **BUKAN nilai resmi** ujian CAT KDKMP
- Tidak ada status ambang batas atau prediksi kelulusan
- Tidak ada sistem ranking

## 📁 Struktur Folder Penting

```
simulasi-cat-kdkmp/
├── data/
│   └── questions/          # Bank soal JSON
│       ├── tpk_bahasa.json
│       ├── tpk_hitungan.json
│       ├── tpk_pengetahuan_umum.json
│       ├── tpk_pola_gambar.json
│       ├── tpk_abstraksi_ruang.json
│       ├── tpk_bentuk.json
│       ├── tmk.json
│       └── index.json
├── src/                    # Source code aplikasi
│   ├── app.js             # Main application
│   ├── quiz-engine.js     # Quiz logic
│   ├── quiz-ui.js         # User interface
│   ├── question-service.js # Question management
│   ├── mode-config.js     # Mode configuration
│   ├── storage-service.js # localStorage management
│   ├── export-service.js  # Export functionality
│   ├── history-service.js # History management
│   └── styles.css         # Styling
├── tools/                  # Testing tools
│   ├── validate-questions.js
│   ├── test-quiz-engine.js
│   ├── test-storage.js
│   ├── test-export.js
│   └── test-history.js
├── index.html             # Main HTML file
├── package.json           # NPM configuration
└── README.md             # This file
```

## 🎓 Bank Soal

### TPK (85 soal total)
- **Bahasa/Verbal**: 15 soal
- **Hitungan/Numerik**: 20 soal
- **Pengetahuan Umum**: 15 soal
- **Pola Gambar**: 15 soal
- **Abstraksi Ruang**: 10 soal
- **Bentuk/Menentukan Bentuk**: 10 soal

### TMK (20 soal total)
- **Prinsip Koperasi**: 3 soal
- **Tata Kelola**: 5 soal
- **Pengelolaan Usaha**: 4 soal
- **Pengelolaan Keuangan**: 3 soal
- **Pelayanan Anggota**: 3 soal
- **Pengembangan Kelembagaan**: 2 soal

## 🔧 Teknologi yang Digunakan

- **Frontend**: HTML5, CSS3, Vanilla JavaScript
- **Storage**: localStorage (browser)
- **Server**: Node.js serve (untuk development)
- **Testing**: Custom test scripts

## 📱 Kompatibilitas

- **Desktop**: Chrome, Firefox, Safari, Edge
- **Mobile**: Responsive design untuk tablet dan smartphone
- **Print**: Layout khusus untuk cetak hasil

## 🛠️ Development

### Menambah Soal Baru
1. Edit file JSON di folder `data/questions/`
2. Ikuti struktur schema yang ada
3. Jalankan validasi: `npm run validate:questions`

### Menjalankan Test
```bash
npm run test:all  # Test semua komponen
```

### Build untuk Production
Aplikasi ini adalah static web app, cukup copy semua file ke web server.

## 📞 Support

Untuk pertanyaan atau masalah teknis, silakan buat issue di repository ini.

## 📄 Lisensi

MIT License - Aplikasi ini dibuat untuk keperluan edukasi dan latihan.

---

**Selamat berlatih dan semoga sukses dalam ujian CAT KDKMP!** 🎯