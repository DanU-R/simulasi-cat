# Manual Test Checklist - Simulasi CAT KDKMP

Checklist pengujian manual untuk memastikan semua fitur aplikasi berfungsi dengan baik.

## 📋 Pre-Test Setup

- [ ] Server berjalan dengan `npm start`
- [ ] Browser terbuka di URL lokal (biasanya `http://localhost:3000`)
- [ ] Console browser terbuka untuk melihat log (F12 → Console)

## 🚀 Test 1: Load Halaman Utama

- [ ] **Halaman utama terbuka tanpa error**
- [ ] **Loading spinner muncul saat memuat bank soal**
- [ ] **Disclaimer "soal prediksi orisinal" terlihat jelas**
- [ ] **Tidak ada error di console browser**

### Expected Result:
- Halaman menampilkan "Status Loading Bank Soal"
- Setelah loading selesai, muncul ringkasan bank soal
- Mode selection tersedia

## 📚 Test 2: Validasi Bank Soal

- [ ] **Semua 7 file soal berhasil dimuat**
- [ ] **Total TPK: 85 soal**
- [ ] **Total TMK: 20 soal**
- [ ] **Total keseluruhan: 105 soal**
- [ ] **Tidak ada error loading**

### Expected Result:
```
✅ TPK Bahasa/Verbal: 15 soal
✅ TPK Hitungan/Numerik: 20 soal
✅ TPK Pengetahuan Umum: 15 soal
✅ TPK Pola Gambar: 15 soal
✅ TPK Abstraksi Ruang: 10 soal
✅ TPK Bentuk/Menentukan Bentuk: 10 soal
✅ TMK: 20 soal
```

## 🎯 Test 3: Mode Selection

### 3.1 Latihan Bebas TPK
- [ ] **Klik card "Latihan Bebas TPK"**
- [ ] **Panel konfigurasi muncul**
- [ ] **6 subkategori TPK tersedia untuk dipilih**
- [ ] **Pilih "Bahasa/Verbal"**
- [ ] **Input jumlah soal (1-15)**
- [ ] **Tombol "Mulai Latihan" aktif setelah konfigurasi lengkap**

### 3.2 Simulasi TPK
- [ ] **Klik card "Simulasi TPK"**
- [ ] **Konfigurasi menampilkan 85 soal (tetap)**
- [ ] **Durasi default: 85 menit**
- [ ] **Opsi durasi custom tersedia**

### 3.3 Simulasi TMK
- [ ] **Klik card "Simulasi TMK"**
- [ ] **Konfigurasi menampilkan 20 soal (tetap)**
- [ ] **Durasi default: 20 menit**

### 3.4 Simulasi Gabungan
- [ ] **Klik card "Simulasi Gabungan"**
- [ ] **Konfigurasi menampilkan 105 soal (tetap)**
- [ ] **Durasi default: 105 menit**

## ⏱️ Test 4: Timer Custom

- [ ] **Pilih mode apa saja**
- [ ] **Centang "Gunakan durasi custom"**
- [ ] **Input 1 menit untuk testing**
- [ ] **Klik "Mulai Latihan"**
- [ ] **Timer menampilkan 01:00**

## 🎮 Test 5: Pengerjaan Soal

### 5.1 Interface Dasar
- [ ] **UI quiz muncul dengan soal pertama**
- [ ] **Nomor soal dan total soal terlihat (misal: "Soal 1 dari 10")**
- [ ] **Timer berjalan mundur**
- [ ] **5 pilihan jawaban (A, B, C, D, E) tersedia**
- [ ] **Panel nomor soal di samping menampilkan semua nomor**

### 5.2 Menjawab Soal
- [ ] **Klik pilihan jawaban (misal: A)**
- [ ] **Pilihan terpilih dengan visual feedback**
- [ ] **Counter "Terjawab" bertambah**
- [ ] **Counter "Belum" berkurang**
- [ ] **Nomor soal di panel berubah warna (sudah dijawab)**

### 5.3 Navigasi Soal
- [ ] **Klik "Berikutnya" → pindah ke soal 2**
- [ ] **Klik "Sebelumnya" → kembali ke soal 1**
- [ ] **Jawaban soal 1 masih tersimpan**
- [ ] **Klik nomor soal di panel → langsung ke soal tersebut**

### 5.4 Tombol Hapus Progres
- [ ] **Tombol "Hapus Progres" terlihat di header**
- [ ] **Klik tombol → muncul konfirmasi**
- [ ] **Klik "OK" → kembali ke mode selection**

## ⏰ Test 6: Auto-Finish Timer

- [ ] **Tunggu timer habis (1 menit)**
- [ ] **Peringatan visual muncul saat ≤60 detik**
- [ ] **Peringatan kritis muncul saat ≤10 detik**
- [ ] **Saat 00:00 → quiz otomatis selesai**
- [ ] **Pesan "Waktu habis. Latihan otomatis diselesaikan." muncul**
- [ ] **Halaman hasil ditampilkan**

## 📊 Test 7: Hasil dan Review

### 7.1 Halaman Hasil
- [ ] **Ringkasan hasil muncul**
- [ ] **Jumlah benar/salah/kosong benar**
- [ ] **Skor total sesuai aturan (TPK: benar=1, TMK: benar=5)**
- [ ] **Disclaimer "skor latihan internal" terlihat**
- [ ] **Tombol "Lihat Review Jawaban" tersedia**

### 7.2 Review Jawaban Detail
- [ ] **Klik "Lihat Review Jawaban"**
- [ ] **Daftar semua soal dengan status**
- [ ] **Filter "Semua/Benar/Salah/Kosong" berfungsi**
- [ ] **Pembahasan setiap soal lengkap**
- [ ] **Penjelasan setiap opsi A-E tersedia**
- [ ] **Cara cepat (jika ada) ditampilkan**

## 📤 Test 8: Export dan Cetak

### 8.1 Export JSON
- [ ] **Klik "📥 Download Hasil JSON"**
- [ ] **File JSON terdownload dengan nama format: hasil-latihan-cat-kdkmp-YYYYMMDD-HHMMSS.json**
- [ ] **Buka file JSON → struktur data lengkap**
- [ ] **Tidak ada isi soal penuh dalam JSON**
- [ ] **Disclaimer ada dalam JSON**

### 8.2 Print Hasil
- [ ] **Klik "🖨️ Cetak Hasil"**
- [ ] **Print dialog browser terbuka**
- [ ] **Preview print: layout hitam-putih, tanpa tombol**
- [ ] **Disclaimer tetap terlihat di print**
- [ ] **Bisa save as PDF atau print**

## 📚 Test 9: Riwayat Latihan

### 9.1 Akses Riwayat
- [ ] **Kembali ke mode selection**
- [ ] **Klik "📚 Riwayat Latihan"**
- [ ] **Halaman riwayat muncul**
- [ ] **Statistik riwayat terlihat (total latihan, rata-rata skor)**
- [ ] **Daftar riwayat menampilkan latihan yang baru selesai**

### 9.2 Detail Riwayat
- [ ] **Klik "👁️ Lihat Detail Ringkas" pada salah satu riwayat**
- [ ] **Detail lengkap muncul tanpa pembahasan soal**
- [ ] **Breakdown skor TPK/TMK (jika mixed)**
- [ ] **Ringkasan jawaban per soal**
- [ ] **Status benar/salah/kosong per soal**

### 9.3 Hapus Riwayat
- [ ] **Klik "🗑️ Hapus" pada salah satu riwayat**
- [ ] **Konfirmasi muncul**
- [ ] **Klik "OK" → riwayat terhapus dari daftar**

### 9.4 Download Riwayat
- [ ] **Klik "📥 Download Riwayat JSON"**
- [ ] **File riwayat terdownload dengan format: riwayat-latihan-cat-kdkmp-YYYYMMDD-HHMMSS.json**
- [ ] **File berisi semua riwayat dalam format terstruktur**

## 💾 Test 10: LocalStorage Session

### 10.1 Mulai Latihan Baru
- [ ] **Pilih mode apa saja**
- [ ] **Mulai latihan**
- [ ] **Jawab 2-3 soal**
- [ ] **Jangan selesaikan latihan**

### 10.2 Refresh Browser
- [ ] **Refresh halaman (F5 atau Ctrl+R)**
- [ ] **Panel "Ada sesi latihan yang belum selesai" muncul**
- [ ] **Info sesi menampilkan mode, progres, waktu**

### 10.3 Lanjutkan Sesi
- [ ] **Klik "Lanjutkan Sesi"**
- [ ] **Quiz UI muncul di soal yang sama**
- [ ] **Jawaban sebelumnya masih tersimpan**
- [ ] **Timer melanjutkan dari sisa waktu**
- [ ] **Progress counter sesuai**

### 10.4 Hapus Sesi
- [ ] **Refresh lagi untuk test hapus sesi**
- [ ] **Klik "Hapus Sesi"**
- [ ] **Konfirmasi muncul**
- [ ] **Klik "OK" → kembali ke mode selection normal**

## 🧹 Test 11: Hapus Semua Data

### 11.1 Hapus Semua Riwayat
- [ ] **Buka riwayat latihan**
- [ ] **Klik "🗑️ Hapus Semua Riwayat"**
- [ ] **Konfirmasi dengan jumlah riwayat**
- [ ] **Klik "OK" → semua riwayat terhapus**
- [ ] **Pesan "Belum ada riwayat latihan" muncul**

## 📱 Test 12: Responsive Design

### 12.1 Mobile View
- [ ] **Buka Developer Tools (F12)**
- [ ] **Toggle device toolbar (Ctrl+Shift+M)**
- [ ] **Pilih device mobile (iPhone/Android)**
- [ ] **Interface tetap usable di mobile**
- [ ] **Tombol tidak terpotong**
- [ ] **Text tetap readable**

## ⚠️ Test 13: Error Handling

### 13.1 Disconnect Test
- [ ] **Matikan server saat quiz berjalan**
- [ ] **Coba navigasi → error handling graceful**
- [ ] **Data lokal tetap tersimpan**

### 13.2 Invalid Data Test
- [ ] **Buka Developer Tools → Application → Local Storage**
- [ ] **Edit/corrupt data localStorage**
- [ ] **Refresh → aplikasi handle error dengan baik**

## ✅ Test Completion Checklist

- [ ] **Semua 13 test group berhasil**
- [ ] **Tidak ada error kritis di console**
- [ ] **Semua fitur utama berfungsi**
- [ ] **Data tersimpan dan terestore dengan benar**
- [ ] **Export/print berfungsi**
- [ ] **Responsive design OK**

## 📝 Notes

Catat di sini jika ada masalah atau perilaku tidak sesuai ekspektasi:

```
[Tanggal Test]: [Browser]: [OS]:
- Issue 1: ...
- Issue 2: ...
```

## 🎯 Success Criteria

Test dianggap **PASS** jika:
- ✅ Semua checklist item berhasil
- ✅ Tidak ada error JavaScript kritis
- ✅ Data localStorage berfungsi
- ✅ Export/print menghasilkan output yang benar
- ✅ Responsive design tidak broken
- ✅ Disclaimer selalu terlihat jelas