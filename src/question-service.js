/**
 * Question Service - Layanan untuk mengelola bank soal CAT KDKMP
 * Menyediakan fungsi loading, filtering, dan manipulasi soal
 */

// Konfigurasi file bank soal
const QUESTION_FILES = {
    'tpk_bahasa': {
        path: 'data/questions/tpk_bahasa.json',
        name: 'TPK Bahasa/Verbal',
        kategori: 'TPK',
        subkategori: 'Bahasa/Verbal'
    },
    'tpk_hitungan': {
        path: 'data/questions/tpk_hitungan.json',
        name: 'TPK Hitungan/Numerik',
        kategori: 'TPK',
        subkategori: 'Hitungan/Numerik'
    },
    'tpk_pengetahuan_umum': {
        path: 'data/questions/tpk_pengetahuan_umum.json',
        name: 'TPK Pengetahuan Umum',
        kategori: 'TPK',
        subkategori: 'Pengetahuan Umum'
    },
    'tpk_pola_gambar': {
        path: 'data/questions/tpk_pola_gambar.json',
        name: 'TPK Pola Gambar',
        kategori: 'TPK',
        subkategori: 'Pola Gambar'
    },
    'tpk_abstraksi_ruang': {
        path: 'data/questions/tpk_abstraksi_ruang.json',
        name: 'TPK Abstraksi Ruang',
        kategori: 'TPK',
        subkategori: 'Abstraksi Ruang'
    },
    'tpk_bentuk': {
        path: 'data/questions/tpk_bentuk.json',
        name: 'TPK Bentuk/Menentukan Bentuk',
        kategori: 'TPK',
        subkategori: 'Bentuk/Menentukan Bentuk'
    },
    'tmk': {
        path: 'data/questions/tmk.json',
        name: 'TMK',
        kategori: 'TMK',
        subkategori: 'TMK'
    }
};

class QuestionService {
    constructor() {
        this.questionBanks = null;
        this.isLoaded = false;
    }

    /**
     * Memuat semua bank soal dari file JSON
     * @returns {Promise<Object>} Object berisi semua bank soal
     */
    async loadQuestionBanks() {
        try {
            console.log('📚 Memuat bank soal...');
            
            const loadPromises = Object.entries(QUESTION_FILES).map(async ([key, config]) => {
                try {
                    const response = await fetch(config.path);
                    
                    if (!response.ok) {
                        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
                    }

                    const data = await response.json();
                    
                    if (!Array.isArray(data)) {
                        throw new Error(`Data ${config.name} bukan array`);
                    }

                    console.log(`✅ ${config.name}: ${data.length} soal`);
                    
                    return {
                        key,
                        config,
                        data,
                        count: data.length
                    };
                    
                } catch (error) {
                    console.error(`❌ Error loading ${config.name}:`, error);
                    throw new Error(`Gagal memuat ${config.name}: ${error.message}`);
                }
            });

            const results = await Promise.all(loadPromises);
            
            // Konversi hasil ke object
            this.questionBanks = {};
            results.forEach(result => {
                this.questionBanks[result.key] = {
                    ...result.config,
                    questions: result.data,
                    count: result.count
                };
            });

            this.isLoaded = true;
            console.log('🎉 Semua bank soal berhasil dimuat');
            
            return this.questionBanks;
            
        } catch (error) {
            console.error('❌ Error loading question banks:', error);
            throw error;
        }
    }

    /**
     * Menggabungkan semua soal dari bank soal
     * @param {Object} questionBanks - Bank soal (opsional, gunakan yang sudah dimuat jika tidak disediakan)
     * @returns {Array} Array berisi semua soal
     */
    getAllQuestions(questionBanks = null) {
        try {
            const banks = questionBanks || this.questionBanks;
            
            if (!banks) {
                throw new Error('Bank soal belum dimuat. Panggil loadQuestionBanks() terlebih dahulu.');
            }

            const allQuestions = [];
            
            Object.values(banks).forEach(bank => {
                if (bank.questions && Array.isArray(bank.questions)) {
                    allQuestions.push(...bank.questions);
                }
            });

            console.log(`📋 Total ${allQuestions.length} soal digabungkan`);
            return allQuestions;
            
        } catch (error) {
            console.error('❌ Error getting all questions:', error);
            throw error;
        }
    }

    /**
     * Mengambil soal TPK saja
     * @param {Object} questionBanks - Bank soal (opsional)
     * @returns {Array} Array berisi soal TPK
     */
    getTPKQuestions(questionBanks = null) {
        try {
            const allQuestions = this.getAllQuestions(questionBanks);
            const tpkQuestions = allQuestions.filter(q => q.kategori === 'TPK');
            
            console.log(`📘 ${tpkQuestions.length} soal TPK ditemukan`);
            return tpkQuestions;
            
        } catch (error) {
            console.error('❌ Error getting TPK questions:', error);
            throw error;
        }
    }

    /**
     * Mengambil soal TMK saja
     * @param {Object} questionBanks - Bank soal (opsional)
     * @returns {Array} Array berisi soal TMK
     */
    getTMKQuestions(questionBanks = null) {
        try {
            const allQuestions = this.getAllQuestions(questionBanks);
            const tmkQuestions = allQuestions.filter(q => q.kategori === 'TMK');
            
            console.log(`📕 ${tmkQuestions.length} soal TMK ditemukan`);
            return tmkQuestions;
            
        } catch (error) {
            console.error('❌ Error getting TMK questions:', error);
            throw error;
        }
    }

    /**
     * Mengambil soal berdasarkan subkategori
     * @param {Object} questionBanks - Bank soal (opsional)
     * @param {string} subcategory - Nama subkategori
     * @returns {Array} Array berisi soal dari subkategori tertentu
     */
    getQuestionsBySubcategory(questionBanks = null, subcategory) {
        try {
            if (!subcategory) {
                throw new Error('Subkategori harus disediakan');
            }

            const allQuestions = this.getAllQuestions(questionBanks);
            console.log(`🔍 Mencari soal dengan subkategori: "${subcategory}"`);
            console.log(`📚 Total soal tersedia: ${allQuestions.length}`);
            
            // Debug: tampilkan beberapa subkategori yang ada
            const uniqueSubcategories = [...new Set(allQuestions.map(q => q.subkategori))];
            console.log(`📂 Subkategori yang tersedia: ${uniqueSubcategories.join(', ')}`);
            
            const filteredQuestions = allQuestions.filter(q => q.subkategori === subcategory);
            
            console.log(`📊 ${filteredQuestions.length} soal dari subkategori "${subcategory}" ditemukan`);
            
            if (filteredQuestions.length === 0) {
                console.warn(`⚠️ Tidak ada soal ditemukan untuk subkategori "${subcategory}"`);
                console.warn(`💡 Subkategori yang tersedia: ${uniqueSubcategories.join(', ')}`);
            }
            
            return filteredQuestions;
            
        } catch (error) {
            console.error('❌ Error getting questions by subcategory:', error);
            throw error;
        }
    }

    /**
     * Mengacak urutan soal (tidak mengubah data asli)
     * @param {Array} questions - Array soal yang akan diacak
     * @returns {Array} Array soal yang sudah diacak (copy baru)
     */
    shuffleQuestions(questions) {
        try {
            if (!Array.isArray(questions)) {
                throw new Error('Input harus berupa array');
            }

            // Buat copy untuk tidak mengubah data asli
            const shuffled = [...questions];
            
            // Fisher-Yates shuffle algorithm
            for (let i = shuffled.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
            }

            console.log(`🔀 ${shuffled.length} soal berhasil diacak`);
            return shuffled;
            
        } catch (error) {
            console.error('❌ Error shuffling questions:', error);
            throw error;
        }
    }

    /**
     * Mengambil sejumlah soal dari array (tidak mengubah data asli)
     * @param {Array} questions - Array soal sumber
     * @param {number} count - Jumlah soal yang diinginkan
     * @returns {Array} Array berisi soal yang dipilih
     */
    selectQuestions(questions, count) {
        try {
            if (!Array.isArray(questions)) {
                throw new Error('Input harus berupa array');
            }

            if (typeof count !== 'number' || count < 0) {
                throw new Error('Count harus berupa number positif');
            }

            if (count > questions.length) {
                console.warn(`⚠️ Diminta ${count} soal, tersedia ${questions.length}. Mengambil semua yang tersedia.`);
                return [...questions];
            }

            const selected = questions.slice(0, count);
            console.log(`✂️ ${selected.length} soal dipilih dari ${questions.length} soal tersedia`);
            
            return selected;
            
        } catch (error) {
            console.error('❌ Error selecting questions:', error);
            throw error;
        }
    }

    /**
     * Mendapatkan statistik bank soal
     * @param {Object} questionBanks - Bank soal (opsional)
     * @returns {Object} Statistik bank soal
     */
    getStatistics(questionBanks = null) {
        try {
            const banks = questionBanks || this.questionBanks;
            
            if (!banks) {
                throw new Error('Bank soal belum dimuat');
            }

            const stats = {
                totalQuestions: 0,
                totalTPK: 0,
                totalTMK: 0,
                bySubcategory: {}
            };

            Object.values(banks).forEach(bank => {
                const count = bank.count || 0;
                stats.totalQuestions += count;
                
                if (bank.kategori === 'TPK') {
                    stats.totalTPK += count;
                } else if (bank.kategori === 'TMK') {
                    stats.totalTMK += count;
                }

                stats.bySubcategory[bank.subkategori] = count;
            });

            return stats;
            
        } catch (error) {
            console.error('❌ Error getting statistics:', error);
            throw error;
        }
    }

    /**
     * Cek apakah bank soal sudah dimuat
     * @returns {boolean} True jika sudah dimuat
     */
    isQuestionBanksLoaded() {
        return this.isLoaded && this.questionBanks !== null;
    }
}

// Export untuk penggunaan di Node.js dan browser
if (typeof module !== 'undefined' && module.exports) {
    module.exports = QuestionService;
} else if (typeof window !== 'undefined') {
    window.QuestionService = QuestionService;
}