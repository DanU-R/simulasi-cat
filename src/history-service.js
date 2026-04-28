/**
 * History Service - Layanan riwayat hasil latihan CAT KDKMP
 * Mengelola penyimpanan dan pengelolaan riwayat hasil latihan di localStorage
 */

class HistoryService {
    constructor() {
        this.historyKey = 'cat_kdkmp_history';
        this.version = '1.0';
        this.maxHistoryCount = 20; // Maksimal 20 riwayat
    }

    /**
     * Simpan hasil latihan ke riwayat
     */
    saveResult(resultData) {
        try {
            if (!resultData) {
                throw new Error('Result data tidak tersedia');
            }

            // Generate unique ID
            const historyId = this.generateHistoryId();
            
            // Create history entry
            const historyEntry = {
                id: historyId,
                version: this.version,
                saved_at: new Date().toISOString(),
                ...resultData
            };

            // Get existing history
            const history = this.getHistory();
            
            // Add new entry at the beginning
            history.unshift(historyEntry);
            
            // Keep only last 20 entries
            if (history.length > this.maxHistoryCount) {
                history.splice(this.maxHistoryCount);
            }
            
            // Save back to localStorage
            localStorage.setItem(this.historyKey, JSON.stringify(history));
            
            console.log(`📚 Hasil latihan disimpan ke riwayat: ${historyId}`);
            return historyId;
            
        } catch (error) {
            console.error('❌ Error saving result to history:', error);
            return null;
        }
    }

    /**
     * Ambil semua riwayat
     */
    getHistory() {
        try {
            const data = localStorage.getItem(this.historyKey);
            if (!data) {
                return [];
            }

            const history = JSON.parse(data);
            
            // Validate and filter valid entries
            return Array.isArray(history) ? history.filter(entry => this.validateHistoryEntry(entry)) : [];
            
        } catch (error) {
            console.error('❌ Error loading history:', error);
            return [];
        }
    }

    /**
     * Ambil riwayat berdasarkan ID
     */
    getHistoryById(historyId) {
        try {
            const history = this.getHistory();
            return history.find(entry => entry.id === historyId) || null;
            
        } catch (error) {
            console.error('❌ Error getting history by ID:', error);
            return null;
        }
    }

    /**
     * Hapus riwayat berdasarkan ID
     */
    deleteHistory(historyId) {
        try {
            const history = this.getHistory();
            const filteredHistory = history.filter(entry => entry.id !== historyId);
            
            if (filteredHistory.length === history.length) {
                console.warn('⚠️ History ID tidak ditemukan:', historyId);
                return false;
            }
            
            localStorage.setItem(this.historyKey, JSON.stringify(filteredHistory));
            console.log(`🗑️ Riwayat dihapus: ${historyId}`);
            return true;
            
        } catch (error) {
            console.error('❌ Error deleting history:', error);
            return false;
        }
    }

    /**
     * Hapus semua riwayat
     */
    clearHistory() {
        try {
            localStorage.removeItem(this.historyKey);
            console.log('🧹 Semua riwayat dihapus');
            return true;
            
        } catch (error) {
            console.error('❌ Error clearing history:', error);
            return false;
        }
    }

    /**
     * Download riwayat sebagai JSON
     */
    downloadHistoryJSON() {
        try {
            const history = this.getHistory();
            
            const exportData = {
                version: this.version,
                exported_at: new Date().toISOString(),
                export_date: this.formatDate(new Date()),
                export_time: this.formatTime(new Date()),
                total_entries: history.length,
                max_entries: this.maxHistoryCount,
                history: history,
                disclaimer: "Riwayat ini berisi hasil latihan internal berdasarkan soal prediksi orisinal, bukan hasil resmi ujian CAT KDKMP.",
                note: "Data ini disimpan secara lokal di browser untuk keperluan belajar pribadi."
            };

            const jsonString = JSON.stringify(exportData, null, 2);
            
            // Generate filename
            const now = new Date();
            const filename = `riwayat-latihan-cat-kdkmp-${this.formatDateForFilename(now)}-${this.formatTimeForFilename(now)}.json`;
            
            // Trigger download
            this.triggerDownload(jsonString, filename, 'application/json');
            
            console.log('📥 Riwayat berhasil didownload:', filename);
            return true;
            
        } catch (error) {
            console.error('❌ Error downloading history:', error);
            return false;
        }
    }

    /**
     * Buat entry riwayat dari quiz session dan result summary
     */
    createHistoryEntry(quizSession, scoreData) {
        try {
            if (!quizSession || !scoreData) {
                throw new Error('Quiz session atau score data tidak tersedia');
            }

            const now = new Date();
            
            return {
                // Metadata
                completed_at: quizSession.endTime ? quizSession.endTime.toISOString() : now.toISOString(),
                completed_date: this.formatDate(quizSession.endTime || now),
                completed_time: this.formatTime(quizSession.endTime || now),
                
                // Session info
                session: {
                    mode: quizSession.mode,
                    scoring_type: quizSession.scoringType,
                    started_at: quizSession.startTime.toISOString(),
                    finished_at: quizSession.endTime ? quizSession.endTime.toISOString() : now.toISOString(),
                    duration_seconds: quizSession.duration ? Math.round(quizSession.duration / 1000) : 0,
                    timer_duration_seconds: quizSession.timerDurationSeconds || 0
                },
                
                // Results summary
                results: {
                    total_questions: scoreData.totalQuestions,
                    answered_count: scoreData.answeredCount,
                    unanswered_count: scoreData.unansweredCount,
                    
                    // Scores
                    total_score: scoreData.totalScore,
                    tpk_score: scoreData.tpkScore,
                    tmk_score: scoreData.tmkScore,
                    
                    // Details
                    tpk_details: {
                        total: scoreData.tpkDetails.total,
                        correct: scoreData.tpkDetails.correct,
                        wrong: scoreData.tpkDetails.wrong
                    },
                    tmk_details: {
                        total: scoreData.tmkDetails.total,
                        correct: scoreData.tmkDetails.correct,
                        wrong: scoreData.tmkDetails.wrong
                    }
                },
                
                // Answer summary (ringkas, tanpa isi soal penuh)
                answers: this.generateAnswerSummary(quizSession),
                
                // Disclaimer
                disclaimer: scoreData.disclaimer
            };
            
        } catch (error) {
            console.error('❌ Error creating history entry:', error);
            throw error;
        }
    }

    /**
     * Generate ringkasan jawaban untuk riwayat
     */
    generateAnswerSummary(quizSession) {
        return quizSession.questions.map((question, index) => {
            const userAnswer = quizSession.getAnswer(question.id);
            const isAnswered = userAnswer !== null;
            const isCorrect = isAnswered && userAnswer === question.jawaban_benar;
            
            let status = 'kosong';
            if (isAnswered) {
                status = isCorrect ? 'benar' : 'salah';
            }

            return {
                question_number: index + 1,
                question_id: question.id,
                kategori: question.kategori,
                subkategori: question.subkategori,
                level: question.level,
                jawaban_user: userAnswer,
                jawaban_benar: question.jawaban_benar,
                status: status,
                is_answered: isAnswered,
                is_correct: isCorrect
            };
        });
    }

    /**
     * Generate unique history ID
     */
    generateHistoryId() {
        const timestamp = Date.now();
        const random = Math.random().toString(36).substr(2, 5);
        return `hist_${timestamp}_${random}`;
    }

    /**
     * Validasi entry riwayat
     */
    validateHistoryEntry(entry) {
        const requiredFields = ['id', 'completed_at', 'session', 'results'];
        return requiredFields.every(field => field in entry) &&
               typeof entry.session === 'object' &&
               typeof entry.results === 'object';
    }

    /**
     * Trigger download file
     */
    triggerDownload(content, filename, mimeType) {
        const blob = new Blob([content], { type: mimeType });
        const url = URL.createObjectURL(blob);
        
        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        link.style.display = 'none';
        
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        // Clean up
        setTimeout(() => {
            URL.revokeObjectURL(url);
        }, 100);
    }

    /**
     * Format date untuk display (DD/MM/YYYY)
     */
    formatDate(date) {
        const day = date.getDate().toString().padStart(2, '0');
        const month = (date.getMonth() + 1).toString().padStart(2, '0');
        const year = date.getFullYear();
        return `${day}/${month}/${year}`;
    }

    /**
     * Format time untuk display (HH:MM:SS)
     */
    formatTime(date) {
        const hours = date.getHours().toString().padStart(2, '0');
        const minutes = date.getMinutes().toString().padStart(2, '0');
        const seconds = date.getSeconds().toString().padStart(2, '0');
        return `${hours}:${minutes}:${seconds}`;
    }

    /**
     * Format date untuk filename (YYYYMMDD)
     */
    formatDateForFilename(date) {
        const year = date.getFullYear();
        const month = (date.getMonth() + 1).toString().padStart(2, '0');
        const day = date.getDate().toString().padStart(2, '0');
        return `${year}${month}${day}`;
    }

    /**
     * Format time untuk filename (HHMMSS)
     */
    formatTimeForFilename(date) {
        const hours = date.getHours().toString().padStart(2, '0');
        const minutes = date.getMinutes().toString().padStart(2, '0');
        const seconds = date.getSeconds().toString().padStart(2, '0');
        return `${hours}${minutes}${seconds}`;
    }

    /**
     * Get statistics riwayat
     */
    getHistoryStats() {
        try {
            const history = this.getHistory();
            
            if (history.length === 0) {
                return {
                    total_entries: 0,
                    total_questions: 0,
                    total_correct: 0,
                    total_wrong: 0,
                    total_empty: 0,
                    average_score: 0,
                    modes: {}
                };
            }

            let totalQuestions = 0;
            let totalCorrect = 0;
            let totalWrong = 0;
            let totalEmpty = 0;
            let totalScore = 0;
            const modes = {};

            history.forEach(entry => {
                totalQuestions += entry.results.total_questions;
                totalCorrect += entry.results.tpk_details.correct + entry.results.tmk_details.correct;
                totalWrong += entry.results.tpk_details.wrong + entry.results.tmk_details.wrong;
                totalEmpty += entry.results.unanswered_count;
                totalScore += entry.results.total_score;

                const mode = entry.session.mode;
                modes[mode] = (modes[mode] || 0) + 1;
            });

            return {
                total_entries: history.length,
                total_questions: totalQuestions,
                total_correct: totalCorrect,
                total_wrong: totalWrong,
                total_empty: totalEmpty,
                average_score: history.length > 0 ? Math.round(totalScore / history.length * 100) / 100 : 0,
                modes: modes
            };
            
        } catch (error) {
            console.error('❌ Error getting history stats:', error);
            return null;
        }
    }

    /**
     * Get ukuran storage riwayat
     */
    getHistorySize() {
        try {
            const data = localStorage.getItem(this.historyKey);
            return {
                entries: this.getHistory().length,
                bytes: data ? data.length : 0,
                size_kb: data ? Math.round(data.length / 1024 * 100) / 100 : 0
            };
        } catch (error) {
            return { entries: 0, bytes: 0, size_kb: 0 };
        }
    }
}

// Export untuk penggunaan di Node.js dan browser
if (typeof module !== 'undefined' && module.exports) {
    module.exports = HistoryService;
} else if (typeof window !== 'undefined') {
    window.HistoryService = HistoryService;
}