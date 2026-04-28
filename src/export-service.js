/**
 * Export Service - Layanan export dan cetak hasil latihan CAT KDKMP
 * Mengelola export JSON dan print functionality
 */

class ExportService {
    constructor() {
        this.version = '1.0';
    }

    /**
     * Generate export data dari quiz session dan score data
     */
    generateExportData(quizSession, scoreData) {
        try {
            if (!quizSession || !scoreData) {
                throw new Error('Quiz session atau score data tidak tersedia');
            }

            const now = new Date();
            const exportData = {
                // Metadata
                version: this.version,
                exported_at: now.toISOString(),
                export_date: this.formatDate(now),
                export_time: this.formatTime(now),
                
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
                disclaimer: scoreData.disclaimer,
                note: "Hasil ini adalah skor latihan internal untuk keperluan belajar, bukan nilai resmi ujian CAT KDKMP."
            };

            return exportData;
            
        } catch (error) {
            console.error('Error generating export data:', error);
            throw error;
        }
    }

    /**
     * Generate ringkasan jawaban tanpa isi soal penuh
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
     * Download hasil sebagai file JSON
     */
    downloadResultsJSON(quizSession, scoreData) {
        try {
            const exportData = this.generateExportData(quizSession, scoreData);
            const jsonString = JSON.stringify(exportData, null, 2);
            
            // Generate filename
            const now = new Date();
            const filename = `hasil-latihan-cat-kdkmp-${this.formatDateForFilename(now)}-${this.formatTimeForFilename(now)}.json`;
            
            // Create and trigger download
            this.triggerDownload(jsonString, filename, 'application/json');
            
            console.log('📥 Hasil berhasil didownload:', filename);
            return true;
            
        } catch (error) {
            console.error('Error downloading results:', error);
            throw error;
        }
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
     * Print hasil latihan
     */
    printResults() {
        try {
            // Add print class to body for styling
            document.body.classList.add('printing');
            
            // Trigger print
            window.print();
            
            // Remove print class after print dialog
            setTimeout(() => {
                document.body.classList.remove('printing');
            }, 1000);
            
            console.log('🖨️ Print dialog dibuka');
            return true;
            
        } catch (error) {
            console.error('Error printing results:', error);
            document.body.classList.remove('printing');
            throw error;
        }
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
     * Get file size info untuk debugging
     */
    getExportSize(quizSession, scoreData) {
        try {
            const exportData = this.generateExportData(quizSession, scoreData);
            const jsonString = JSON.stringify(exportData, null, 2);
            
            return {
                questions: exportData.answers.length,
                characters: jsonString.length,
                bytes: new Blob([jsonString]).size,
                size_kb: Math.round(new Blob([jsonString]).size / 1024 * 100) / 100
            };
            
        } catch (error) {
            console.error('Error calculating export size:', error);
            return { questions: 0, characters: 0, bytes: 0, size_kb: 0 };
        }
    }

    /**
     * Validate export data structure
     */
    validateExportData(exportData) {
        const requiredFields = [
            'version', 'exported_at', 'session', 'results', 'answers', 'disclaimer'
        ];

        return requiredFields.every(field => field in exportData) &&
               Array.isArray(exportData.answers) &&
               typeof exportData.results === 'object' &&
               typeof exportData.session === 'object';
    }
}

// Export untuk penggunaan di Node.js dan browser
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ExportService;
} else if (typeof window !== 'undefined') {
    window.ExportService = ExportService;
}