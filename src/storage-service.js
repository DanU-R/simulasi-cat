/**
 * Storage Service - Layanan penyimpanan progres quiz ke localStorage
 * Mengelola save/load session, validasi data, dan rekonstruksi sesi
 */

class StorageService {
    constructor() {
        this.storageKey = 'cat_kdkmp_session';
        this.resultKey = 'cat_kdkmp_last_result';
        this.version = '1.0';
    }

    /**
     * Simpan sesi quiz ke localStorage
     */
    saveSession(quizSession, extraState = {}) {
        try {
            if (!quizSession) {
                throw new Error('Quiz session tidak tersedia');
            }

            // Kumpulkan data sesi
            const sessionData = {
                version: this.version,
                timestamp: new Date().toISOString(),
                
                // Mode dan konfigurasi
                mode: quizSession.mode,
                scoringType: quizSession.scoringType,
                
                // Daftar ID soal (tidak simpan soal penuh)
                questionIds: quizSession.questions.map(q => q.id),
                totalQuestions: quizSession.questions.length,
                
                // State navigasi
                currentIndex: quizSession.currentIndex,
                isFinished: quizSession.isFinished,
                
                // Jawaban user (hanya ID soal dan jawaban)
                answers: {},
                
                // Timer state
                timerDurationSeconds: quizSession.timerDurationSeconds,
                timeRemainingSeconds: quizSession.timeRemainingSeconds,
                isTimerActive: quizSession.isTimerActive,
                
                // Waktu
                startTime: quizSession.startTime.toISOString(),
                endTime: quizSession.endTime ? quizSession.endTime.toISOString() : null,
                
                // Extra state dari UI
                ...extraState
            };

            // Convert Map answers ke object
            quizSession.answers.forEach((answer, questionId) => {
                sessionData.answers[questionId] = answer;
            });

            // Simpan ke localStorage
            localStorage.setItem(this.storageKey, JSON.stringify(sessionData));
            
            console.log('💾 Session berhasil disimpan ke localStorage');
            return true;
            
        } catch (error) {
            console.error('❌ Error saving session:', error);
            return false;
        }
    }

    /**
     * Load sesi dari localStorage
     */
    loadSession() {
        try {
            const data = localStorage.getItem(this.storageKey);
            if (!data) {
                return null;
            }

            const sessionData = JSON.parse(data);
            
            // Validasi versi
            if (sessionData.version !== this.version) {
                console.warn('⚠️ Session version mismatch, clearing old session');
                this.clearSession();
                return null;
            }

            // Validasi struktur data
            if (!this.validateSessionData(sessionData)) {
                console.warn('⚠️ Invalid session data, clearing session');
                this.clearSession();
                return null;
            }

            console.log('📂 Session berhasil dimuat dari localStorage');
            return sessionData;
            
        } catch (error) {
            console.error('❌ Error loading session:', error);
            this.clearSession(); // Clear corrupted data
            return null;
        }
    }

    /**
     * Validasi struktur data session
     */
    validateSessionData(data) {
        const requiredFields = [
            'mode', 'scoringType', 'questionIds', 'totalQuestions',
            'currentIndex', 'isFinished', 'answers', 'startTime'
        ];

        return requiredFields.every(field => field in data) &&
               Array.isArray(data.questionIds) &&
               data.questionIds.length > 0 &&
               typeof data.answers === 'object' &&
               typeof data.currentIndex === 'number' &&
               typeof data.isFinished === 'boolean';
    }

    /**
     * Hapus sesi dari localStorage
     */
    clearSession() {
        try {
            localStorage.removeItem(this.storageKey);
            console.log('🗑️ Session dihapus dari localStorage');
            return true;
        } catch (error) {
            console.error('❌ Error clearing session:', error);
            return false;
        }
    }

    /**
     * Cek apakah ada sesi aktif yang belum selesai
     */
    hasActiveSession() {
        const sessionData = this.loadSession();
        return sessionData && !sessionData.isFinished;
    }

    /**
     * Tandai sesi sebagai selesai
     */
    markSessionFinished(resultSummary = null) {
        try {
            const sessionData = this.loadSession();
            if (!sessionData) {
                return false;
            }

            sessionData.isFinished = true;
            sessionData.finishedAt = new Date().toISOString();
            
            if (resultSummary) {
                sessionData.result = resultSummary;
            }

            localStorage.setItem(this.storageKey, JSON.stringify(sessionData));
            
            // Simpan hasil terakhir secara terpisah
            if (resultSummary) {
                this.saveLastResult(resultSummary);
            }
            
            console.log('✅ Session ditandai sebagai selesai');
            return true;
            
        } catch (error) {
            console.error('❌ Error marking session finished:', error);
            return false;
        }
    }

    /**
     * Simpan hasil terakhir
     */
    saveLastResult(resultSummary) {
        try {
            const resultData = {
                timestamp: new Date().toISOString(),
                ...resultSummary
            };
            
            localStorage.setItem(this.resultKey, JSON.stringify(resultData));
            console.log('📊 Hasil terakhir disimpan');
            
        } catch (error) {
            console.error('❌ Error saving last result:', error);
        }
    }

    /**
     * Rekonstruksi sesi quiz dari data tersimpan
     */
    async reconstructSession(savedData, questionService) {
        try {
            if (!savedData || !questionService) {
                throw new Error('Data atau question service tidak tersedia');
            }

            console.log('🔄 Merekonstruksi sesi dari data tersimpan...');

            // Pastikan question banks sudah dimuat
            if (!questionService.isQuestionBanksLoaded()) {
                await questionService.loadQuestionBanks();
            }

            // Ambil semua soal
            const allQuestions = questionService.getAllQuestions();
            
            // Cari soal berdasarkan ID
            const sessionQuestions = [];
            const missingIds = [];
            
            savedData.questionIds.forEach(questionId => {
                const question = allQuestions.find(q => q.id === questionId);
                if (question) {
                    sessionQuestions.push(question);
                } else {
                    missingIds.push(questionId);
                }
            });

            // Validasi semua soal ditemukan
            if (missingIds.length > 0) {
                throw new Error(`Soal tidak ditemukan: ${missingIds.join(', ')}. Silakan hapus sesi dan mulai ulang.`);
            }

            if (sessionQuestions.length !== savedData.totalQuestions) {
                throw new Error(`Jumlah soal tidak sesuai. Expected: ${savedData.totalQuestions}, Found: ${sessionQuestions.length}`);
            }

            // Buat quiz session baru
            const quizSession = new QuizSession(
                sessionQuestions,
                savedData.mode,
                savedData.scoringType
            );

            // Restore state
            quizSession.currentIndex = savedData.currentIndex;
            quizSession.isFinished = savedData.isFinished;
            quizSession.startTime = new Date(savedData.startTime);
            
            if (savedData.endTime) {
                quizSession.endTime = new Date(savedData.endTime);
            }

            // Restore jawaban
            quizSession.answers.clear();
            Object.entries(savedData.answers).forEach(([questionId, answer]) => {
                quizSession.answers.set(questionId, answer);
            });

            // Restore timer
            if (savedData.timerDurationSeconds) {
                quizSession.setTimerDuration(savedData.timerDurationSeconds);
                quizSession.timeRemainingSeconds = savedData.timeRemainingSeconds || 0;
            }

            console.log('✅ Sesi berhasil direkonstruksi');
            console.log(`   📊 ${sessionQuestions.length} soal, ${Object.keys(savedData.answers).length} jawaban`);
            console.log(`   ⏱️ Timer: ${savedData.timerDurationSeconds}s, sisa: ${savedData.timeRemainingSeconds}s`);
            
            return quizSession;
            
        } catch (error) {
            console.error('❌ Error reconstructing session:', error);
            throw error;
        }
    }

    /**
     * Mendapatkan info sesi tersimpan
     */
    getSessionInfo() {
        const sessionData = this.loadSession();
        if (!sessionData) {
            return null;
        }

        return {
            mode: sessionData.mode,
            scoringType: sessionData.scoringType,
            totalQuestions: sessionData.totalQuestions,
            answeredCount: Object.keys(sessionData.answers).length,
            currentIndex: sessionData.currentIndex,
            isFinished: sessionData.isFinished,
            timestamp: sessionData.timestamp,
            timeRemaining: sessionData.timeRemainingSeconds,
            hasTimer: sessionData.timerDurationSeconds > 0
        };
    }

    /**
     * Mendapatkan ukuran data di localStorage (untuk debugging)
     */
    getStorageSize() {
        try {
            const sessionData = localStorage.getItem(this.storageKey);
            const resultData = localStorage.getItem(this.resultKey);
            
            return {
                session: sessionData ? sessionData.length : 0,
                result: resultData ? resultData.length : 0,
                total: (sessionData ? sessionData.length : 0) + (resultData ? resultData.length : 0)
            };
        } catch (error) {
            return { session: 0, result: 0, total: 0 };
        }
    }

    /**
     * Clear semua data storage
     */
    clearAllData() {
        try {
            localStorage.removeItem(this.storageKey);
            localStorage.removeItem(this.resultKey);
            console.log('🧹 Semua data storage dihapus');
            return true;
        } catch (error) {
            console.error('❌ Error clearing all data:', error);
            return false;
        }
    }
}

// Export untuk penggunaan di Node.js dan browser
if (typeof module !== 'undefined' && module.exports) {
    module.exports = StorageService;
} else if (typeof window !== 'undefined') {
    window.StorageService = StorageService;
}