/**
 * Mode Configuration - Konfigurasi mode latihan CAT KDKMP
 * Mengelola pilihan mode, subkategori, dan validasi konfigurasi sesi
 */

// Konfigurasi mode latihan
const TRAINING_MODES = {
    'latihan-bebas-tpk': {
        id: 'latihan-bebas-tpk',
        name: 'Latihan Bebas TPK',
        description: 'Pilih subkategori TPK dan jumlah soal sesuai kebutuhan',
        icon: '📘',
        scoringType: 'TPK',
        allowSubcategorySelection: true,
        allowCustomCount: true,
        allowCustomDuration: true,
        allowNoTimer: true,
        defaultCount: 10,
        maxCount: null, // akan diset berdasarkan subkategori
        kategori: 'TPK',
        defaultDurationPerQuestion: 1, // menit per soal
        getDurationMinutes: function(questionCount) {
            return questionCount * this.defaultDurationPerQuestion;
        }
    },
    'simulasi-tpk': {
        id: 'simulasi-tpk',
        name: 'Simulasi TPK',
        description: 'Simulasi lengkap TPK dengan semua subkategori (85 soal)',
        icon: '🎯',
        scoringType: 'TPK',
        allowSubcategorySelection: false,
        allowCustomCount: false,
        allowCustomDuration: true,
        defaultCount: 85,
        maxCount: 85,
        kategori: 'TPK',
        defaultDurationMinutes: 85,
        getDurationMinutes: function() {
            return this.defaultDurationMinutes;
        }
    },
    'simulasi-tmk': {
        id: 'simulasi-tmk',
        name: 'Simulasi TMK',
        description: 'Simulasi lengkap TMK dengan semua soal (20 soal)',
        icon: '📕',
        scoringType: 'TMK',
        allowSubcategorySelection: false,
        allowCustomCount: false,
        allowCustomDuration: true,
        defaultCount: 20,
        maxCount: 20,
        kategori: 'TMK',
        defaultDurationMinutes: 20,
        getDurationMinutes: function() {
            return this.defaultDurationMinutes;
        }
    },
    'simulasi-gabungan': {
        id: 'simulasi-gabungan',
        name: 'Simulasi Gabungan',
        description: 'Simulasi lengkap TPK + TMK (85 TPK + 20 TMK = 105 soal)',
        icon: '🎪',
        scoringType: 'MIXED',
        allowSubcategorySelection: false,
        allowCustomCount: false,
        allowCustomDuration: true,
        defaultCount: 105,
        maxCount: 105,
        kategori: 'MIXED',
        defaultDurationMinutes: 105,
        getDurationMinutes: function() {
            return this.defaultDurationMinutes;
        }
    }
};

// Subkategori TPK yang tersedia
// PENTING: 'value' harus sesuai dengan nilai 'subkategori' di file JSON
const TPK_SUBCATEGORIES = {
    'Bahasa/Verbal': {
        id: 'Bahasa/Verbal',
        name: 'Bahasa/Verbal',
        value: 'Bahasa', // Nilai sebenarnya di JSON
        description: 'Soal bahasa, sinonim, antonim, dan pemahaman teks',
        maxQuestions: 15
    },
    'Hitungan/Numerik': {
        id: 'Hitungan/Numerik',
        name: 'Hitungan/Numerik',
        value: 'Hitungan', // Nilai sebenarnya di JSON
        description: 'Soal matematika, aritmatika, dan logika numerik',
        maxQuestions: 20
    },
    'Pengetahuan Umum': {
        id: 'Pengetahuan Umum',
        name: 'Pengetahuan Umum',
        value: 'Pengetahuan Umum', // Nilai sebenarnya di JSON
        description: 'Soal pengetahuan umum dan wawasan kebangsaan',
        maxQuestions: 15
    },
    'Pola Gambar': {
        id: 'Pola Gambar',
        name: 'Pola Gambar',
        value: 'Pola Gambar', // Nilai sebenarnya di JSON
        description: 'Soal pola, deret, dan hubungan gambar',
        maxQuestions: 15
    },
    'Abstraksi Ruang': {
        id: 'Abstraksi Ruang',
        name: 'Abstraksi Ruang',
        value: 'Abstraksi Ruang', // Nilai sebenarnya di JSON
        description: 'Soal visualisasi ruang dan rotasi objek',
        maxQuestions: 10
    },
    'Bentuk/Menentukan Bentuk': {
        id: 'Bentuk/Menentukan Bentuk',
        name: 'Bentuk/Menentukan Bentuk',
        value: 'Bentuk/Menentukan Bentuk', // Nilai sebenarnya di JSON
        description: 'Soal identifikasi dan analisis bentuk',
        maxQuestions: 10
    }
};

class ModeConfigManager {
    constructor() {
        this.selectedMode = null;
        this.selectedSubcategory = null;
        this.questionCount = 0;
        this.durationMinutes = 0;
        this.useCustomDuration = false;
        this.useNoTimer = false;
        this.prioritizeUnseen = true; // Default aktif untuk Latihan Bebas TPK
        this.questionService = null;
        this.progressService = null;
    }

    /**
     * Inisialisasi dengan question service dan progress service
     */
    initialize(questionService, progressService = null) {
        this.questionService = questionService;
        this.progressService = progressService;
        console.log('🎛️ Mode Config Manager diinisialisasi');
    }

    /**
     * Mendapatkan semua mode yang tersedia
     */
    getAvailableModes() {
        return Object.values(TRAINING_MODES);
    }

    /**
     * Mendapatkan subkategori TPK yang tersedia
     */
    getTPKSubcategories() {
        return Object.values(TPK_SUBCATEGORIES);
    }

    /**
     * Mendapatkan konfigurasi mode berdasarkan ID
     */
    getModeConfig(modeId) {
        return TRAINING_MODES[modeId] || null;
    }

    /**
     * Mendapatkan konfigurasi subkategori berdasarkan ID
     */
    getSubcategoryConfig(subcategoryId) {
        return TPK_SUBCATEGORIES[subcategoryId] || null;
    }

    /**
     * Memilih mode latihan
     */
    selectMode(modeId) {
        const mode = this.getModeConfig(modeId);
        if (!mode) {
            throw new Error(`Mode ${modeId} tidak ditemukan`);
        }

        this.selectedMode = mode;
        this.selectedSubcategory = null;
        this.questionCount = mode.defaultCount;
        this.useCustomDuration = false;
        this.useNoTimer = false;
        this.updateDuration();

        console.log(`🎯 Mode dipilih: ${mode.name}`);
        return mode;
    }

    /**
     * Memilih subkategori (untuk Latihan Bebas TPK)
     */
    selectSubcategory(subcategoryId) {
        if (!this.selectedMode || !this.selectedMode.allowSubcategorySelection) {
            throw new Error('Mode saat ini tidak mendukung pemilihan subkategori');
        }

        const subcategory = this.getSubcategoryConfig(subcategoryId);
        if (!subcategory) {
            throw new Error(`Subkategori ${subcategoryId} tidak ditemukan`);
        }

        this.selectedSubcategory = subcategory;
        this.questionCount = Math.min(this.questionCount, subcategory.maxQuestions);

        console.log(`📂 Subkategori dipilih: ${subcategory.name}`);
        return subcategory;
    }

    /**
     * Mengatur jumlah soal
     */
    setQuestionCount(count) {
        if (!this.selectedMode) {
            throw new Error('Mode belum dipilih');
        }

        if (!this.selectedMode.allowCustomCount) {
            throw new Error('Mode ini tidak mengizinkan perubahan jumlah soal');
        }

        const maxCount = this.getMaxQuestionCount();
        if (count > maxCount) {
            throw new Error(`Jumlah soal maksimal untuk konfigurasi ini adalah ${maxCount}`);
        }

        if (count < 1) {
            throw new Error('Jumlah soal minimal adalah 1');
        }

        this.questionCount = count;
        this.updateDuration();
        console.log(`🔢 Jumlah soal diatur: ${count}`);
        return count;
    }

    /**
     * Update durasi berdasarkan konfigurasi saat ini
     */
    updateDuration() {
        if (!this.selectedMode || this.useCustomDuration || this.useNoTimer) {
            return;
        }

        if (this.selectedMode.getDurationMinutes) {
            this.durationMinutes = this.selectedMode.getDurationMinutes(this.questionCount);
        } else {
            this.durationMinutes = this.questionCount; // fallback 1 menit per soal
        }

        console.log(`⏱️ Durasi diupdate: ${this.durationMinutes} menit`);
    }

    /**
     * Mengatur penggunaan durasi custom
     */
    setUseCustomDuration(useCustom) {
        this.useCustomDuration = useCustom;
        if (useCustom) {
            this.useNoTimer = false;
        }
        if (!useCustom) {
            this.updateDuration();
        }
        console.log(`⚙️ Custom duration: ${useCustom ? 'aktif' : 'nonaktif'}`);
    }

    /**
     * Mengatur latihan tanpa batas waktu
     */
    setUseNoTimer(useNoTimer) {
        if (!this.selectedMode || !this.selectedMode.allowNoTimer) {
            throw new Error('Mode ini tidak mengizinkan latihan tanpa waktu');
        }

        this.useNoTimer = useNoTimer;
        if (useNoTimer) {
            this.useCustomDuration = false;
            this.durationMinutes = 0;
        } else {
            this.updateDuration();
        }

        console.log(`Latihan tanpa waktu: ${useNoTimer ? 'aktif' : 'nonaktif'}`);
    }

    /**
     * Mengatur durasi custom
     */
    setCustomDuration(minutes) {
        if (!this.selectedMode) {
            throw new Error('Mode belum dipilih');
        }

        if (!this.selectedMode.allowCustomDuration) {
            throw new Error('Mode ini tidak mengizinkan durasi custom');
        }

        if (minutes < 1) {
            throw new Error('Durasi minimal adalah 1 menit');
        }

        if (minutes > 180) {
            throw new Error('Durasi maksimal adalah 180 menit');
        }

        this.durationMinutes = minutes;
        console.log(`⏱️ Durasi custom diatur: ${minutes} menit`);
        return minutes;
    }

    /**
     * Mengatur prioritas soal yang belum pernah dikerjakan
     */
    setPrioritizeUnseen(prioritize) {
        this.prioritizeUnseen = prioritize;
        console.log(`📊 Prioritas soal belum dikerjakan: ${prioritize ? 'aktif' : 'nonaktif'}`);
    }

    /**
     * Mendapatkan informasi soal berdasarkan subkategori dan status seen
     */
    getSubcategoryQuestionInfo(subcategoryValue) {
        if (!this.questionService || !subcategoryValue) {
            return {
                total: 0,
                seen: 0,
                unseen: 0,
                unseenQuestions: [],
                allQuestions: []
            };
        }

        try {
            // Dapatkan semua soal untuk subkategori
            const allQuestions = this.questionService.getQuestionsBySubcategory(null, subcategoryValue);
            
            if (!this.progressService) {
                return {
                    total: allQuestions.length,
                    seen: 0,
                    unseen: allQuestions.length,
                    unseenQuestions: allQuestions,
                    allQuestions: allQuestions
                };
            }

            // Dapatkan soal yang belum pernah dikerjakan
            const unseenQuestions = this.progressService.getUnseenQuestionsBySubcategory(allQuestions, subcategoryValue);
            
            return {
                total: allQuestions.length,
                seen: allQuestions.length - unseenQuestions.length,
                unseen: unseenQuestions.length,
                unseenQuestions: unseenQuestions,
                allQuestions: allQuestions
            };
        } catch (error) {
            console.error('Error getting subcategory question info:', error);
            return {
                total: 0,
                seen: 0,
                unseen: 0,
                unseenQuestions: [],
                allQuestions: []
            };
        }
    }

    /**
     * Memilih soal dengan prioritas unseen jika diaktifkan
     */
    selectQuestionsWithUnseenPriority(allQuestions, requestedCount) {
        if (!this.prioritizeUnseen || !this.progressService || !Array.isArray(allQuestions)) {
            // Jika prioritas unseen nonaktif atau tidak ada progress service, gunakan semua soal
            const shuffled = this.questionService.shuffleQuestions(allQuestions);
            return {
                questions: this.questionService.selectQuestions(shuffled, requestedCount),
                messages: []
            };
        }

        try {
            // Dapatkan soal yang belum pernah dikerjakan
            const unseenQuestions = allQuestions.filter(q => !this.progressService.isQuestionSeen(q.id));
            
            let selectedQuestions = [];
            let messages = [];

            if (unseenQuestions.length >= requestedCount) {
                // Cukup soal belum dikerjakan
                const shuffledUnseen = this.questionService.shuffleQuestions(unseenQuestions);
                selectedQuestions = this.questionService.selectQuestions(shuffledUnseen, requestedCount);
                console.log(`📊 Menggunakan ${requestedCount} soal belum dikerjakan`);
            } else if (unseenQuestions.length > 0) {
                // Soal belum dikerjakan tidak cukup, campur dengan soal lama
                const seenQuestions = allQuestions.filter(q => this.progressService.isQuestionSeen(q.id));
                const neededFromSeen = requestedCount - unseenQuestions.length;
                
                const shuffledSeen = this.questionService.shuffleQuestions(seenQuestions);
                const selectedSeen = this.questionService.selectQuestions(shuffledSeen, neededFromSeen);
                
                selectedQuestions = [...unseenQuestions, ...selectedSeen];
                selectedQuestions = this.questionService.shuffleQuestions(selectedQuestions);
                
                messages.push(`Soal belum pernah dikerjakan hanya tersedia ${unseenQuestions.length} dari ${requestedCount}. Sisanya akan diambil dari soal yang sudah pernah dikerjakan.`);
                console.log(`📊 Menggunakan ${unseenQuestions.length} soal belum dikerjakan + ${neededFromSeen} soal lama`);
            } else {
                // Semua soal sudah pernah dikerjakan
                const shuffledAll = this.questionService.shuffleQuestions(allQuestions);
                selectedQuestions = this.questionService.selectQuestions(shuffledAll, requestedCount);
                
                messages.push('Semua soal pada subkategori ini sudah pernah dikerjakan. Latihan akan menggunakan soal lama.');
                console.log('📊 Semua soal sudah dikerjakan, menggunakan soal lama');
            }

            return {
                questions: selectedQuestions,
                messages: messages
            };
        } catch (error) {
            console.error('Error selecting questions with unseen priority:', error);
            // Fallback ke metode normal jika ada error
            const shuffled = this.questionService.shuffleQuestions(allQuestions);
            return {
                questions: this.questionService.selectQuestions(shuffled, requestedCount),
                messages: []
            };
        }
    }

    /**
     * Mendapatkan durasi default untuk mode saat ini
     */
    getDefaultDuration() {
        if (!this.selectedMode) {
            return 0;
        }

        if (this.selectedMode.getDurationMinutes) {
            return this.selectedMode.getDurationMinutes(this.questionCount);
        }

        return this.questionCount; // fallback
    }

    /**
     * Mendapatkan jumlah soal maksimal berdasarkan konfigurasi saat ini
     */
    getMaxQuestionCount() {
        if (!this.selectedMode) {
            return 0;
        }

        if (this.selectedMode.maxCount !== null) {
            return this.selectedMode.maxCount;
        }

        if (this.selectedSubcategory) {
            return this.selectedSubcategory.maxQuestions;
        }

        // Default untuk latihan bebas TPK tanpa subkategori
        return 85;
    }

    /**
     * Validasi konfigurasi saat ini
     */
    validateConfiguration() {
        const errors = [];

        if (!this.selectedMode) {
            errors.push('Mode latihan belum dipilih');
        }

        if (this.selectedMode && this.selectedMode.allowSubcategorySelection && !this.selectedSubcategory) {
            errors.push('Subkategori belum dipilih');
        }

        if (this.questionCount < 1) {
            errors.push('Jumlah soal harus minimal 1');
        }

        const maxCount = this.getMaxQuestionCount();
        if (this.questionCount > maxCount) {
            errors.push(`Jumlah soal maksimal adalah ${maxCount}`);
        }

        return {
            isValid: errors.length === 0,
            errors: errors
        };
    }

    /**
     * Membuat sesi quiz berdasarkan konfigurasi
     */
    async createQuizSession() {
        try {
            const validation = this.validateConfiguration();
            if (!validation.isValid) {
                throw new Error(`Konfigurasi tidak valid: ${validation.errors.join(', ')}`);
            }

            if (!this.questionService) {
                throw new Error('Question service belum diinisialisasi');
            }

            // Pastikan question banks sudah dimuat
            if (!this.questionService.isQuestionBanksLoaded()) {
                await this.questionService.loadQuestionBanks();
            }

            let questions = [];
            let selectionResult = null;

            // Ambil soal berdasarkan mode
            switch (this.selectedMode.id) {
                case 'latihan-bebas-tpk':
                    if (this.selectedSubcategory) {
                        // Gunakan 'value' untuk filter, bukan 'id'
                        const subcategoryValue = this.selectedSubcategory.value || this.selectedSubcategory.id;
                        console.log(`🔍 Filtering soal untuk subkategori: "${subcategoryValue}"`);
                        
                        const allSubcategoryQuestions = this.questionService.getQuestionsBySubcategory(null, subcategoryValue);
                        console.log(`📊 Hasil filter: ${allSubcategoryQuestions.length} soal ditemukan`);
                        
                        if (allSubcategoryQuestions.length === 0) {
                            throw new Error(`Tidak ada soal ditemukan untuk subkategori: "${subcategoryValue}". Periksa kesesuaian nilai subkategori dengan file JSON.`);
                        }

                        // Gunakan prioritas unseen jika diaktifkan
                        selectionResult = this.selectQuestionsWithUnseenPriority(allSubcategoryQuestions, this.questionCount);
                        questions = selectionResult.questions;
                        
                        // Tampilkan pesan jika ada
                        if (selectionResult.messages && selectionResult.messages.length > 0) {
                            // Store messages untuk ditampilkan di UI
                            this.lastSelectionMessages = selectionResult.messages;
                        }
                    } else {
                        const allTPKQuestions = this.questionService.getTPKQuestions();
                        selectionResult = this.selectQuestionsWithUnseenPriority(allTPKQuestions, this.questionCount);
                        questions = selectionResult.questions;
                    }
                    break;

                case 'simulasi-tpk':
                    questions = this.questionService.getTPKQuestions();
                    const shuffledTPK = this.questionService.shuffleQuestions(questions);
                    questions = this.questionService.selectQuestions(shuffledTPK, this.questionCount);
                    break;

                case 'simulasi-tmk':
                    questions = this.questionService.getTMKQuestions();
                    const shuffledTMK = this.questionService.shuffleQuestions(questions);
                    questions = this.questionService.selectQuestions(shuffledTMK, this.questionCount);
                    break;

                case 'simulasi-gabungan':
                    const tpkQuestions = this.questionService.getTPKQuestions();
                    const tmkQuestions = this.questionService.getTMKQuestions();
                    const allQuestions = [...tpkQuestions, ...tmkQuestions];
                    const shuffledAll = this.questionService.shuffleQuestions(allQuestions);
                    questions = this.questionService.selectQuestions(shuffledAll, this.questionCount);
                    break;

                default:
                    throw new Error(`Mode ${this.selectedMode.id} tidak didukung`);
            }

            // Validasi final: pastikan questions adalah array yang tidak kosong
            if (!Array.isArray(questions) || questions.length === 0) {
                throw new Error('Tidak ada soal yang dapat dipilih. Pastikan bank soal sudah dimuat dengan benar.');
            }

            // Buat quiz session
            const quizSession = new QuizSession(
                questions,
                this.selectedMode.kategori.toLowerCase(),
                this.selectedMode.scoringType.toLowerCase()
            );

            // Set timer duration. Durasi 0 berarti latihan tanpa batas waktu.
            if (this.durationMinutes > 0) {
                quizSession.setTimerDuration(this.durationMinutes * 60); // convert to seconds
            }

            console.log(`🎯 Quiz session berhasil dibuat: ${questions.length} soal, durasi: ${this.durationMinutes} menit`);
            return quizSession;

        } catch (error) {
            console.error('❌ Error creating quiz session:', error);
            throw error;
        }
    }

    /**
     * Mendapatkan ringkasan konfigurasi saat ini
     */
    getConfigurationSummary() {
        if (!this.selectedMode) {
            return null;
        }

        const summary = {
            mode: this.selectedMode.name,
            modeId: this.selectedMode.id,
            scoringType: this.selectedMode.scoringType,
            questionCount: this.questionCount,
            subcategory: this.selectedSubcategory ? this.selectedSubcategory.name : null,
            maxQuestions: this.getMaxQuestionCount(),
            durationMinutes: this.durationMinutes,
            useCustomDuration: this.useCustomDuration,
            useNoTimer: this.useNoTimer,
            defaultDuration: this.getDefaultDuration()
        };

        // Tambahan untuk mode gabungan
        if (this.selectedMode.id === 'simulasi-gabungan') {
            summary.tpkCount = 85;
            summary.tmkCount = 20;
        }

        return summary;
    }

    /**
     * Reset konfigurasi
     */
    reset() {
        this.selectedMode = null;
        this.selectedSubcategory = null;
        this.questionCount = 0;
        this.durationMinutes = 0;
        this.useCustomDuration = false;
        this.useNoTimer = false;
        this.prioritizeUnseen = true; // Reset ke default aktif
        this.lastSelectionMessages = [];
        console.log('🔄 Konfigurasi mode direset');
    }
}

// Export untuk penggunaan di Node.js dan browser
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { ModeConfigManager, TRAINING_MODES, TPK_SUBCATEGORIES };
} else if (typeof window !== 'undefined') {
    window.ModeConfigManager = ModeConfigManager;
    window.TRAINING_MODES = TRAINING_MODES;
    window.TPK_SUBCATEGORIES = TPK_SUBCATEGORIES;
}
