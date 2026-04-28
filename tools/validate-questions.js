const fs = require('fs');
const path = require('path');

// Konfigurasi file dan target jumlah soal
const FILES_CONFIG = {
  'tpk_bahasa.json': { target: 15, kategori: 'TPK', subkategori: 'Bahasa/Verbal' },
  'tpk_hitungan.json': { target: 20, kategori: 'TPK', subkategori: 'Hitungan/Numerik' },
  'tpk_pengetahuan_umum.json': { target: 15, kategori: 'TPK', subkategori: 'Pengetahuan Umum' },
  'tpk_pola_gambar.json': { target: 15, kategori: 'TPK', subkategori: 'Pola Gambar' },
  'tpk_abstraksi_ruang.json': { target: 10, kategori: 'TPK', subkategori: 'Abstraksi Ruang' },
  'tpk_bentuk.json': { target: 10, kategori: 'TPK', subkategori: 'Bentuk/Menentukan Bentuk' },
  'tmk.json': { target: 20, kategori: 'TMK', subkategori: null }
};

// Field wajib untuk setiap soal
const REQUIRED_FIELDS = [
  'id', 'jenis_soal', 'klaim_resmi', 'kategori', 'subkategori', 'level',
  'pertanyaan', 'gambar', 'pilihan_A', 'pilihan_B', 'pilihan_C', 'pilihan_D', 'pilihan_E',
  'jawaban_benar', 'pembahasan', 'alasan_opsi_A', 'alasan_opsi_B', 'alasan_opsi_C',
  'alasan_opsi_D', 'alasan_opsi_E', 'cara_cepat', 'estimasi_waktu',
  'status_verifikasi_materi', 'sumber_referensi', 'tags'
];

// Nilai valid untuk field tertentu
const VALID_VALUES = {
  jenis_soal: ['prediksi_orisinal'],
  klaim_resmi: [false],
  kategori: ['TPK', 'TMK'],
  level: ['Mudah', 'Sedang', 'Sulit'],
  jawaban_benar: ['A', 'B', 'C', 'D', 'E']
};

// Kata/frasa terlarang
const FORBIDDEN_TERMS = [
  'TWK', 'TIU', 'TKP', 'soal resmi', 'bocoran', 'prediksi lolos', 
  'status ambang 110', 'ambang 110', 'soal asli', 'soal original'
];

class QuestionValidator {
  constructor() {
    this.errors = [];
    this.allIds = new Set();
    this.totalQuestions = 0;
    this.totalTPK = 0;
    this.totalTMK = 0;
    this.fileResults = {};
  }

  log(message, type = 'info') {
    const colors = {
      info: '\x1b[36m',    // cyan
      success: '\x1b[32m', // green
      warning: '\x1b[33m', // yellow
      error: '\x1b[31m',   // red
      reset: '\x1b[0m'     // reset
    };
    console.log(`${colors[type]}${message}${colors.reset}`);
  }

  addError(fileName, questionId, message) {
    this.errors.push(`[${fileName}] ${questionId ? `ID ${questionId}: ` : ''}${message}`);
  }

  validateFile(fileName) {
    const filePath = path.join('data', 'questions', fileName);
    
    this.log(`\n📁 Memvalidasi file: ${fileName}`);
    
    // Cek apakah file ada
    if (!fs.existsSync(filePath)) {
      this.addError(fileName, null, 'File tidak ditemukan');
      return null;
    }

    let data;
    try {
      const content = fs.readFileSync(filePath, 'utf8');
      data = JSON.parse(content);
    } catch (error) {
      this.addError(fileName, null, `Error parsing JSON: ${error.message}`);
      return null;
    }

    // Validasi root adalah array
    if (!Array.isArray(data)) {
      this.addError(fileName, null, 'Root JSON harus berupa array');
      return null;
    }

    const config = FILES_CONFIG[fileName];
    const actualCount = data.length;
    
    // Validasi jumlah soal
    if (actualCount !== config.target) {
      this.addError(fileName, null, `Jumlah soal tidak sesuai. Target: ${config.target}, Aktual: ${actualCount}`);
    }

    this.log(`   ✓ Jumlah soal: ${actualCount}/${config.target}`);
    
    // Validasi setiap soal
    data.forEach((question, index) => {
      this.validateQuestion(fileName, question, index + 1, config);
    });

    // Update statistik
    this.totalQuestions += actualCount;
    if (config.kategori === 'TPK') {
      this.totalTPK += actualCount;
    } else {
      this.totalTMK += actualCount;
    }

    this.fileResults[fileName] = {
      count: actualCount,
      target: config.target,
      kategori: config.kategori
    };

    return data;
  }

  validateQuestion(fileName, question, questionNumber, config) {
    if (!question || typeof question !== 'object') {
      this.addError(fileName, `Soal #${questionNumber}`, 'Soal harus berupa object');
      return;
    }

    const questionId = question.id || `Soal #${questionNumber}`;

    // Validasi field wajib
    REQUIRED_FIELDS.forEach(field => {
      if (!(field in question)) {
        this.addError(fileName, questionId, `Field '${field}' tidak ada`);
      }
    });

    // Validasi ID unik
    if (question.id) {
      if (this.allIds.has(question.id)) {
        this.addError(fileName, questionId, 'ID sudah digunakan di file lain');
      } else {
        this.allIds.add(question.id);
      }
    }

    // Validasi nilai field
    Object.entries(VALID_VALUES).forEach(([field, validValues]) => {
      if (question[field] !== undefined && !validValues.includes(question[field])) {
        this.addError(fileName, questionId, `Field '${field}' harus salah satu dari: ${validValues.join(', ')}`);
      }
    });

    // Validasi kategori sesuai file
    if (question.kategori && question.kategori !== config.kategori) {
      this.addError(fileName, questionId, `Kategori harus '${config.kategori}', bukan '${question.kategori}'`);
    }

    // Validasi pilihan tidak kosong
    ['pilihan_A', 'pilihan_B', 'pilihan_C', 'pilihan_D', 'pilihan_E'].forEach(pilihan => {
      if (question[pilihan] !== undefined && (!question[pilihan] || question[pilihan].trim() === '')) {
        this.addError(fileName, questionId, `${pilihan} tidak boleh kosong`);
      }
    });

    // Validasi tags adalah array
    if (question.tags !== undefined && !Array.isArray(question.tags)) {
      this.addError(fileName, questionId, 'Field tags harus berupa array');
    }

    // Validasi estimasi_waktu adalah number
    if (question.estimasi_waktu !== undefined && typeof question.estimasi_waktu !== 'number') {
      this.addError(fileName, questionId, 'Field estimasi_waktu harus berupa number');
    }

    // Validasi kata terlarang
    this.validateForbiddenTerms(fileName, questionId, question);
  }

  validateForbiddenTerms(fileName, questionId, question) {
    const textFields = [
      'pertanyaan', 'pilihan_A', 'pilihan_B', 'pilihan_C', 'pilihan_D', 'pilihan_E',
      'pembahasan', 'alasan_opsi_A', 'alasan_opsi_B', 'alasan_opsi_C', 'alasan_opsi_D',
      'alasan_opsi_E', 'cara_cepat', 'sumber_referensi'
    ];

    textFields.forEach(field => {
      if (question[field] && typeof question[field] === 'string') {
        const text = question[field].toLowerCase();
        FORBIDDEN_TERMS.forEach(term => {
          if (text.includes(term.toLowerCase())) {
            this.addError(fileName, questionId, `Field '${field}' mengandung istilah terlarang: '${term}'`);
          }
        });
      }
    });

    // Validasi tags
    if (Array.isArray(question.tags)) {
      question.tags.forEach(tag => {
        if (typeof tag === 'string') {
          const tagText = tag.toLowerCase();
          FORBIDDEN_TERMS.forEach(term => {
            if (tagText.includes(term.toLowerCase())) {
              this.addError(fileName, questionId, `Tag mengandung istilah terlarang: '${term}'`);
            }
          });
        }
      });
    }
  }

  validateTotals() {
    this.log('\n📊 RINGKASAN VALIDASI:');
    
    // Tampilkan hasil per file
    Object.entries(this.fileResults).forEach(([fileName, result]) => {
      const status = result.count === result.target ? '✓' : '✗';
      this.log(`   ${status} ${fileName}: ${result.count}/${result.target} soal (${result.kategori})`);
    });

    this.log(`\n📈 TOTAL STATISTIK:`);
    this.log(`   • Total TPK: ${this.totalTPK}/85`);
    this.log(`   • Total TMK: ${this.totalTMK}/20`);
    this.log(`   • Total Keseluruhan: ${this.totalQuestions}/105`);

    // Validasi total
    if (this.totalTPK !== 85) {
      this.addError('TOTAL', null, `Total TPK tidak sesuai. Target: 85, Aktual: ${this.totalTPK}`);
    }
    if (this.totalTMK !== 20) {
      this.addError('TOTAL', null, `Total TMK tidak sesuai. Target: 20, Aktual: ${this.totalTMK}`);
    }
    if (this.totalQuestions !== 105) {
      this.addError('TOTAL', null, `Total keseluruhan tidak sesuai. Target: 105, Aktual: ${this.totalQuestions}`);
    }
  }

  run() {
    this.log('🔍 MEMULAI VALIDASI BANK SOAL CAT KDKMP', 'info');
    this.log('=' .repeat(50));

    // Validasi setiap file
    Object.keys(FILES_CONFIG).forEach(fileName => {
      this.validateFile(fileName);
    });

    // Validasi total
    this.validateTotals();

    // Tampilkan hasil akhir
    this.log('\n' + '='.repeat(50));
    
    if (this.errors.length === 0) {
      this.log('🎉 VALIDASI BERHASIL!', 'success');
      this.log('Semua file bank soal valid dan siap digunakan.', 'success');
    } else {
      this.log(`❌ VALIDASI GAGAL! Ditemukan ${this.errors.length} error:`, 'error');
      this.log('');
      this.errors.forEach(error => {
        this.log(`   • ${error}`, 'error');
      });
      this.log('');
      this.log('Silakan perbaiki error di atas sebelum melanjutkan.', 'warning');
      process.exit(1);
    }
  }
}

// Jalankan validasi
if (require.main === module) {
  const validator = new QuestionValidator();
  validator.run();
}

module.exports = QuestionValidator;