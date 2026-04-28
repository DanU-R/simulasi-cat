/**
 * ProgressService - Mengelola tracking soal yang pernah dikerjakan
 * Menyimpan data lokal menggunakan localStorage
 */
class ProgressService {
    constructor() {
        this.storageKey = 'cat_kdkmp_progress';
        this.data = this.loadProgress();
    }

    /**
     * Load progress data dari localStorage
     */
    loadProgress() {
        try {
            const stored = localStorage.getItem(this.storageKey);
            if (stored) {
                const data = JSON.parse(stored);
                return {
                    seenQuestionIds: new Set(data.seenQuestionIds || []),
                    lastUpdated: data.lastUpdated || null,
                    stats: data.stats || {}
                };
            }
        } catch (error) {
            console.error('Error loading progress:', error);
        }

        return {
            seenQuestionIds: new Set(),
            lastUpdated: null,
            stats: {}
        };
    }

    /**
     * Save progress data ke localStorage
     */
    saveProgress() {
        try {
            const dataToSave = {
                seenQuestionIds: Array.from(this.data.seenQuestionIds),
                lastUpdated: new Date().toISOString(),
                stats: this.data.stats
            };
            
            localStorage.setItem(this.storageKey, JSON.stringify(dataToSave));
            this.data.lastUpdated = dataToSave.lastUpdated;
            
            console.log('📊 Progress disimpan:', {
                seenCount: this.data.seenQuestionIds.size,
                lastUpdated: this.data.lastUpdated
            });
            
            return true;
        } catch (error) {
            console.error('Error saving progress:', error);
            return false;
        }
    }

    /**
     * Tandai daftar soal sebagai pernah dikerjakan
     * @param {Array} questionIds - Array ID soal
     */
    markQuestionsAsSeen(questionIds) {
        if (!Array.isArray(questionIds)) {
            console.warn('markQuestionsAsSeen: questionIds harus berupa array');
            return false;
        }

        let newCount = 0;
        questionIds.forEach(id => {
            if (id && !this.data.seenQuestionIds.has(id)) {
                this.data.seenQuestionIds.add(id);
                newCount++;
            }
        });

        if (newCount > 0) {
            this.saveProgress();
            console.log(`📝 ${newCount} soal baru ditandai sebagai pernah dikerjakan`);
        }

        return newCount > 0;
    }

    /**
     * Tandai semua soal dalam sesi sebagai pernah dikerjakan
     * @param {Object} session - Quiz session object
     */
    markSessionQuestionsAsSeen(session) {
        if (!session || !session.questions) {
            console.warn('markSessionQuestionsAsSeen: session tidak valid');
            return false;
        }

        const questionIds = session.questions.map(q => q.id);
        return this.markQuestionsAsSeen(questionIds);
    }

    /**
     * Dapatkan daftar ID soal yang pernah dikerjakan
     * @returns {Array} Array ID soal
     */
    getSeenQuestionIds() {
        return Array.from(this.data.seenQuestionIds);
    }

    /**
     * Cek apakah soal pernah dikerjakan
     * @param {string} questionId - ID soal
     * @returns {boolean}
     */
    isQuestionSeen(questionId) {
        return this.data.seenQuestionIds.has(questionId);
    }

    /**
     * Dapatkan jumlah soal yang pernah dikerjakan
     * @returns {number}
     */
    getSeenCount() {
        return this.data.seenQuestionIds.size;
    }

    /**
     * Dapatkan statistik soal yang pernah dikerjakan
     * @param {Array} allQuestions - Semua soal dari bank soal
     * @returns {Object} Statistik progress
     */
    getSeenStats(allQuestions) {
        if (!Array.isArray(allQuestions)) {
            return {
                total: 0,
                seen: 0,
                unseen: 0,
                percentage: 0,
                tpk: { total: 0, seen: 0, unseen: 0, percentage: 0 },
                tmk: { total: 0, seen: 0, unseen: 0, percentage: 0 },
                subcategories: {}
            };
        }

        const stats = {
            total: allQuestions.length,
            seen: 0,
            unseen: 0,
            percentage: 0,
            tpk: { total: 0, seen: 0, unseen: 0, percentage: 0 },
            tmk: { total: 0, seen: 0, unseen: 0, percentage: 0 },
            subcategories: {}
        };

        // Hitung per kategori dan subkategori
        allQuestions.forEach(question => {
            const isSeen = this.isQuestionSeen(question.id);
            
            if (isSeen) {
                stats.seen++;
            } else {
                stats.unseen++;
            }

            // Statistik TPK/TMK
            if (question.kategori === 'TPK') {
                stats.tpk.total++;
                if (isSeen) {
                    stats.tpk.seen++;
                } else {
                    stats.tpk.unseen++;
                }
            } else if (question.kategori === 'TMK') {
                stats.tmk.total++;
                if (isSeen) {
                    stats.tmk.seen++;
                } else {
                    stats.tmk.unseen++;
                }
            }

            // Statistik per subkategori
            const subcat = question.subkategori;
            if (!stats.subcategories[subcat]) {
                stats.subcategories[subcat] = { total: 0, seen: 0, unseen: 0, percentage: 0 };
            }
            
            stats.subcategories[subcat].total++;
            if (isSeen) {
                stats.subcategories[subcat].seen++;
            } else {
                stats.subcategories[subcat].unseen++;
            }
        });

        // Hitung persentase
        stats.percentage = stats.total > 0 ? Math.round((stats.seen / stats.total) * 100) : 0;
        stats.tpk.percentage = stats.tpk.total > 0 ? Math.round((stats.tpk.seen / stats.tpk.total) * 100) : 0;
        stats.tmk.percentage = stats.tmk.total > 0 ? Math.round((stats.tmk.seen / stats.tmk.total) * 100) : 0;

        Object.keys(stats.subcategories).forEach(subcat => {
            const sub = stats.subcategories[subcat];
            sub.percentage = sub.total > 0 ? Math.round((sub.seen / sub.total) * 100) : 0;
        });

        return stats;
    }

    /**
     * Dapatkan soal yang belum pernah dikerjakan
     * @param {Array} allQuestions - Semua soal dari bank soal
     * @returns {Array} Array soal yang belum pernah dikerjakan
     */
    getUnseenQuestions(allQuestions) {
        if (!Array.isArray(allQuestions)) {
            return [];
        }

        return allQuestions.filter(question => !this.isQuestionSeen(question.id));
    }

    /**
     * Dapatkan soal yang belum pernah dikerjakan berdasarkan kategori
     * @param {Array} allQuestions - Semua soal dari bank soal
     * @param {string} category - Kategori (TPK/TMK)
     * @returns {Array} Array soal yang belum pernah dikerjakan
     */
    getUnseenQuestionsByCategory(allQuestions, category) {
        if (!Array.isArray(allQuestions)) {
            return [];
        }

        return allQuestions.filter(question => 
            question.kategori === category && !this.isQuestionSeen(question.id)
        );
    }

    /**
     * Dapatkan soal yang belum pernah dikerjakan berdasarkan subkategori
     * @param {Array} allQuestions - Semua soal dari bank soal
     * @param {string} subcategory - Subkategori
     * @returns {Array} Array soal yang belum pernah dikerjakan
     */
    getUnseenQuestionsBySubcategory(allQuestions, subcategory) {
        if (!Array.isArray(allQuestions)) {
            return [];
        }

        return allQuestions.filter(question => 
            question.subkategori === subcategory && !this.isQuestionSeen(question.id)
        );
    }

    /**
     * Reset semua progress soal yang pernah dikerjakan
     */
    resetSeenProgress() {
        this.data.seenQuestionIds.clear();
        this.data.stats = {};
        
        const success = this.saveProgress();
        
        if (success) {
            console.log('🧹 Progress soal berhasil direset');
        }
        
        return success;
    }

    /**
     * Export progress data ke JSON
     * @returns {Object} Data progress untuk export
     */
    exportSeenProgressJSON() {
        const exportData = {
            version: '1.0',
            exported_at: new Date().toISOString(),
            export_date: new Date().toLocaleDateString('id-ID'),
            export_time: new Date().toLocaleTimeString('id-ID'),
            progress: {
                total_seen_questions: this.data.seenQuestionIds.size,
                seen_question_ids: Array.from(this.data.seenQuestionIds).sort(),
                last_updated: this.data.lastUpdated
            },
            disclaimer: 'Data ini adalah progress latihan internal untuk keperluan belajar, bukan data resmi ujian CAT KDKMP.',
            note: 'File ini berisi daftar ID soal yang pernah dikerjakan, tanpa menyertakan isi soal penuh.'
        };

        return exportData;
    }

    /**
     * Download progress data sebagai file JSON
     */
    downloadProgressJSON() {
        try {
            const data = this.exportSeenProgressJSON();
            const jsonString = JSON.stringify(data, null, 2);
            
            const blob = new Blob([jsonString], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            
            const now = new Date();
            const dateStr = now.toISOString().split('T')[0].replace(/-/g, '');
            const timeStr = now.toTimeString().split(' ')[0].replace(/:/g, '');
            const filename = `progress_soal_${dateStr}_${timeStr}.json`;
            
            const a = document.createElement('a');
            a.href = url;
            a.download = filename;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            
            console.log('📥 Progress berhasil didownload:', filename);
            return true;
        } catch (error) {
            console.error('Error downloading progress:', error);
            return false;
        }
    }

    /**
     * Dapatkan info ukuran storage progress
     * @returns {Object} Info ukuran storage
     */
    getStorageInfo() {
        try {
            const stored = localStorage.getItem(this.storageKey);
            const bytes = stored ? new Blob([stored]).size : 0;
            const kb = (bytes / 1024).toFixed(2);
            
            return {
                seenCount: this.data.seenQuestionIds.size,
                bytes: bytes,
                size: `${kb} KB`,
                lastUpdated: this.data.lastUpdated
            };
        } catch (error) {
            console.error('Error getting storage info:', error);
            return {
                seenCount: 0,
                bytes: 0,
                size: '0 KB',
                lastUpdated: null
            };
        }
    }
}

// Export untuk penggunaan di browser
if (typeof window !== 'undefined') {
    window.ProgressService = ProgressService;
}

// Export untuk Node.js testing
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ProgressService;
}