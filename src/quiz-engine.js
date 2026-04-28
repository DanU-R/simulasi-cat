/**
 * Quiz Engine - Core engine untuk menjalankan sesi quiz CAT KDKMP
 * Mengelola state quiz, navigasi soal, jawaban, dan scoring
 */

class QuizSession {
    constructor(questions, mode = 'mixed', scoringType = 'practice') {
        if (!Array.isArray(questions) || questions.length === 0) {
            throw new Error('Questions harus berupa array yang tidak kosong');
        }

        // Konfigurasi sesi
        this.questions = [...questions]; // Copy untuk tidak mengubah data asli
        this.mode = mode; // 'tpk', 'tmk', 'mixed'
        this.scoringType = scoringType; // 'practice', 'simulation'

        // State navigasi
        this.currentIndex = 0;
        this.isFinished = false;

        // State jawaban - menggunakan Map untuk performa lebih baik
        this.answers = new Map(); // questionId -> answer ('A', 'B', 'C', 'D', 'E')

        // State waktu
        this.startTime = new Date();
        this.endTime = null;
        this.duration = null; // dalam milidetik

        // Timer state
        this.timerDurationSeconds = 0; // durasi timer dalam detik
        this.timerStartTime = null;
        this.timerInterval = null;
        this.isTimerActive = false;
        this.timeRemainingSeconds = 0;
        this.onTimerUpdate = null; // callback untuk update UI
        this.onTimerExpired = null; // callback saat waktu habis

        // Validasi soal
        this.validateQuestions();

        console.log(`🎯 Quiz session dimulai: ${this.questions.length} soal, mode: ${this.mode}`);
    }

    /**
     * Validasi struktur soal
     */
    validateQuestions() {
        const requiredFields = ['id', 'kategori', 'pertanyaan', 'pilihan_A', 'pilihan_B', 'pilihan_C', 'pilihan_D', 'pilihan_E', 'jawaban_benar'];
        
        this.questions.forEach((question, index) => {
            requiredFields.forEach(field => {
                if (!question[field]) {
                    throw new Error(`Soal index ${index} tidak memiliki field '${field}'`);
                }
            });

            if (!['A', 'B', 'C', 'D', 'E'].includes(question.jawaban_benar)) {
                throw new Error(`Soal ${question.id} memiliki jawaban_benar tidak valid: ${question.jawaban_benar}`);
            }
        });
    }

    /**
     * Mendapatkan soal saat ini
     * @returns {Object|null} Soal saat ini atau null jika tidak ada
     */
    getCurrentQuestion() {
        try {
            if (this.currentIndex < 0 || this.currentIndex >= this.questions.length) {
                return null;
            }
            return this.questions[this.currentIndex];
        } catch (error) {
            console.error('❌ Error getting current question:', error);
            return null;
        }
    }

    /**
     * Pindah ke soal dengan index tertentu
     * @param {number} index - Index soal tujuan
     * @returns {boolean} True jika berhasil pindah
     */
    goToQuestion(index) {
        try {
            if (typeof index !== 'number') {
                throw new Error('Index harus berupa number');
            }

            if (index < 0 || index >= this.questions.length) {
                console.warn(`⚠️ Index ${index} di luar range (0-${this.questions.length - 1})`);
                return false;
            }

            this.currentIndex = index;
            console.log(`📍 Pindah ke soal ${index + 1}/${this.questions.length}`);
            return true;
        } catch (error) {
            console.error('❌ Error going to question:', error);
            return false;
        }
    }

    /**
     * Pindah ke soal berikutnya
     * @returns {boolean} True jika berhasil pindah
     */
    nextQuestion() {
        return this.goToQuestion(this.currentIndex + 1);
    }

    /**
     * Pindah ke soal sebelumnya
     * @returns {boolean} True jika berhasil pindah
     */
    prevQuestion() {
        return this.goToQuestion(this.currentIndex - 1);
    }

    /**
     * Menjawab soal
     * @param {string} questionId - ID soal
     * @param {string} answer - Jawaban ('A', 'B', 'C', 'D', 'E')
     * @returns {boolean} True jika berhasil menjawab
     */
    answerQuestion(questionId, answer) {
        try {
            if (!questionId) {
                throw new Error('Question ID harus disediakan');
            }

            if (!['A', 'B', 'C', 'D', 'E'].includes(answer)) {
                throw new Error(`Jawaban tidak valid: ${answer}. Harus A, B, C, D, atau E`);
            }

            // Cek apakah soal dengan ID tersebut ada
            const question = this.questions.find(q => q.id === questionId);
            if (!question) {
                throw new Error(`Soal dengan ID ${questionId} tidak ditemukan`);
            }

            this.answers.set(questionId, answer);
            console.log(`✏️ Soal ${questionId} dijawab: ${answer}`);
            return true;
            
        } catch (error) {
            console.error('❌ Error answering question:', error);
            return false;
        }
    }

    /**
     * Menghapus jawaban soal
     * @param {string} questionId - ID soal
     * @returns {boolean} True jika berhasil menghapus
     */
    clearAnswer(questionId) {
        try {
            if (!questionId) {
                throw new Error('Question ID harus disediakan');
            }

            const deleted = this.answers.delete(questionId);
            if (deleted) {
                console.log(`🗑️ Jawaban soal ${questionId} dihapus`);
            }
            return deleted;
            
        } catch (error) {
            console.error('❌ Error clearing answer:', error);
            return false;
        }
    }

    /**
     * Mendapatkan jawaban untuk soal tertentu
     * @param {string} questionId - ID soal
     * @returns {string|null} Jawaban atau null jika belum dijawab
     */
    getAnswer(questionId) {
        try {
            return this.answers.get(questionId) || null;
        } catch (error) {
            console.error('❌ Error getting answer:', error);
            return null;
        }
    }

    /**
     * Mendapatkan jumlah soal yang sudah dijawab
     * @returns {number} Jumlah soal yang sudah dijawab
     */
    getAnsweredCount() {
        return this.answers.size;
    }

    /**
     * Mendapatkan jumlah soal yang belum dijawab
     * @returns {number} Jumlah soal yang belum dijawab
     */
    getUnansweredCount() {
        return this.questions.length - this.answers.size;
    }

    /**
     * Menyelesaikan quiz
     * @returns {boolean} True jika berhasil menyelesaikan
     */
    finish() {
        try {
            if (this.isFinished) {
                console.warn('⚠️ Quiz sudah selesai sebelumnya');
                return false;
            }

            this.stopTimer();
            this.endTime = new Date();
            this.duration = this.endTime.getTime() - this.startTime.getTime();
            this.isFinished = true;

            console.log(`🏁 Quiz selesai! Durasi: ${Math.round(this.duration / 1000)} detik`);
            return true;
            
        } catch (error) {
            console.error('❌ Error finishing quiz:', error);
            return false;
        }
    }

    /**
     * Set durasi timer dalam detik
     */
    setTimerDuration(seconds) {
        if (typeof seconds !== 'number' || seconds <= 0) {
            throw new Error('Durasi timer harus berupa number positif');
        }
        
        this.timerDurationSeconds = seconds;
        this.timeRemainingSeconds = seconds;
        console.log(`⏱️ Timer duration set: ${seconds} detik (${Math.round(seconds/60)} menit)`);
    }

    /**
     * Mulai timer
     */
    startTimer() {
        if (this.timerDurationSeconds <= 0) {
            console.warn('⚠️ Timer duration belum diset');
            return false;
        }

        if (this.isTimerActive) {
            console.warn('⚠️ Timer sudah aktif');
            return false;
        }

        this.timerStartTime = new Date();
        this.isTimerActive = true;
        
        // Update timer setiap detik
        this.timerInterval = setInterval(() => {
            this.updateTimer();
        }, 1000);

        console.log(`⏱️ Timer dimulai: ${this.timerDurationSeconds} detik`);
        return true;
    }

    /**
     * Update timer dan cek apakah waktu habis
     */
    updateTimer() {
        if (!this.isTimerActive || !this.timerStartTime) {
            return;
        }

        const now = new Date();
        const elapsedSeconds = Math.floor((now.getTime() - this.timerStartTime.getTime()) / 1000);
        this.timeRemainingSeconds = Math.max(0, this.timerDurationSeconds - elapsedSeconds);

        // Callback untuk update UI
        if (this.onTimerUpdate) {
            this.onTimerUpdate(this.timeRemainingSeconds);
        }

        // Cek apakah waktu habis
        if (this.timeRemainingSeconds <= 0) {
            this.handleTimerExpired();
        }
    }

    /**
     * Handle saat timer habis
     */
    handleTimerExpired() {
        console.log('⏰ Waktu habis! Auto-finishing quiz...');
        
        this.stopTimer();
        
        // Callback untuk UI
        if (this.onTimerExpired) {
            this.onTimerExpired();
        }
    }

    /**
     * Stop timer
     */
    stopTimer() {
        if (this.timerInterval) {
            clearInterval(this.timerInterval);
            this.timerInterval = null;
        }
        
        this.isTimerActive = false;
        console.log('⏱️ Timer dihentikan');
    }

    /**
     * Mendapatkan waktu tersisa dalam detik
     */
    getTimeRemainingSeconds() {
        return this.timeRemainingSeconds;
    }

    /**
     * Mendapatkan waktu tersisa dalam format MM:SS
     */
    getTimeRemainingFormatted() {
        const minutes = Math.floor(this.timeRemainingSeconds / 60);
        const seconds = this.timeRemainingSeconds % 60;
        return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }

    /**
     * Cek apakah timer aktif
     */
    isTimerRunning() {
        return this.isTimerActive;
    }

    /**
     * Set callback untuk update timer
     */
    setTimerUpdateCallback(callback) {
        this.onTimerUpdate = callback;
    }

    /**
     * Set callback untuk timer expired
     */
    setTimerExpiredCallback(callback) {
        this.onTimerExpired = callback;
    }

    /**
     * Menghitung skor berdasarkan aturan CAT KDKMP
     * @returns {Object} Object berisi detail skor
     */
    calculateScore() {
        try {
            const scoreData = {
                totalQuestions: this.questions.length,
                answeredCount: this.getAnsweredCount(),
                unansweredCount: this.getUnansweredCount(),
                tpkScore: 0,
                tmkScore: 0,
                totalScore: 0,
                tpkDetails: {
                    total: 0,
                    correct: 0,
                    wrong: 0,
                    unanswered: 0,
                    score: 0
                },
                tmkDetails: {
                    total: 0,
                    correct: 0,
                    wrong: 0,
                    unanswered: 0,
                    score: 0
                },
                details: []
            };

            // Hitung skor per soal
            this.questions.forEach(question => {
                const userAnswer = this.getAnswer(question.id);
                const isCorrect = userAnswer === question.jawaban_benar;
                const isAnswered = userAnswer !== null;

                let points = 0;
                if (isAnswered && isCorrect) {
                    // Aturan scoring CAT KDKMP
                    points = question.kategori === 'TPK' ? 1 : 5;
                }

                const detail = {
                    questionId: question.id,
                    kategori: question.kategori,
                    subkategori: question.subkategori,
                    correctAnswer: question.jawaban_benar,
                    userAnswer: userAnswer,
                    isAnswered: isAnswered,
                    isCorrect: isCorrect,
                    points: points
                };

                scoreData.details.push(detail);

                // Update statistik per kategori
                if (question.kategori === 'TPK') {
                    scoreData.tpkDetails.total++;
                    scoreData.tpkScore += points;
                    
                    if (isAnswered) {
                        if (isCorrect) {
                            scoreData.tpkDetails.correct++;
                        } else {
                            scoreData.tpkDetails.wrong++;
                        }
                    } else {
                        scoreData.tpkDetails.unanswered++;
                    }
                } else if (question.kategori === 'TMK') {
                    scoreData.tmkDetails.total++;
                    scoreData.tmkScore += points;
                    
                    if (isAnswered) {
                        if (isCorrect) {
                            scoreData.tmkDetails.correct++;
                        } else {
                            scoreData.tmkDetails.wrong++;
                        }
                    } else {
                        scoreData.tmkDetails.unanswered++;
                    }
                }
            });

            // Update skor detail
            scoreData.tpkDetails.score = scoreData.tpkScore;
            scoreData.tmkDetails.score = scoreData.tmkScore;
            scoreData.totalScore = scoreData.tpkScore + scoreData.tmkScore;

            // Tambahkan disclaimer
            scoreData.disclaimer = "Skor ini adalah skor latihan internal berdasarkan soal prediksi orisinal, bukan skor resmi dan tidak menjamin kelulusan.";

            console.log(`📊 Skor dihitung - TPK: ${scoreData.tpkScore}, TMK: ${scoreData.tmkScore}, Total: ${scoreData.totalScore}`);
            
            return scoreData;
            
        } catch (error) {
            console.error('❌ Error calculating score:', error);
            return null;
        }
    }

    /**
     * Mendapatkan data untuk review jawaban
     * @returns {Object} Data review lengkap
     */
    getReviewData() {
        try {
            const scoreData = this.calculateScore();
            
            const reviewData = {
                sessionInfo: {
                    mode: this.mode,
                    scoringType: this.scoringType,
                    startTime: this.startTime,
                    endTime: this.endTime,
                    duration: this.duration,
                    isFinished: this.isFinished
                },
                score: scoreData,
                questions: this.questions.map(question => {
                    const userAnswer = this.getAnswer(question.id);
                    return {
                        ...question,
                        userAnswer: userAnswer,
                        isAnswered: userAnswer !== null,
                        isCorrect: userAnswer === question.jawaban_benar
                    };
                })
            };

            return reviewData;
            
        } catch (error) {
            console.error('❌ Error getting review data:', error);
            return null;
        }
    }

    /**
     * Mendapatkan progress quiz
     * @returns {Object} Data progress
     */
    getProgress() {
        return {
            currentIndex: this.currentIndex,
            currentNumber: this.currentIndex + 1,
            totalQuestions: this.questions.length,
            answeredCount: this.getAnsweredCount(),
            unansweredCount: this.getUnansweredCount(),
            progressPercentage: Math.round((this.getAnsweredCount() / this.questions.length) * 100)
        };
    }

    /**
     * Cek apakah quiz sudah selesai
     * @returns {boolean} True jika sudah selesai
     */
    isQuizFinished() {
        return this.isFinished;
    }

    /**
     * Reset quiz ke kondisi awal (tanpa mengubah soal)
     */
    reset() {
        this.stopTimer();
        this.currentIndex = 0;
        this.answers.clear();
        this.isFinished = false;
        this.startTime = new Date();
        this.endTime = null;
        this.duration = null;
        this.timeRemainingSeconds = this.timerDurationSeconds;
        
        console.log('🔄 Quiz direset ke kondisi awal');
    }
}

// Export untuk penggunaan di Node.js dan browser
if (typeof module !== 'undefined' && module.exports) {
    module.exports = QuizSession;
} else if (typeof window !== 'undefined') {
    window.QuizSession = QuizSession;
}