/**
 * Quiz UI - Interface untuk pengerjaan soal CAT KDKMP
 * Mengelola tampilan soal, navigasi, dan interaksi user
 */

class QuizUI {
    constructor() {
        this.quizSession = null;
        this.isQuizActive = false;
        document.body.classList.remove('quiz-active');
        this.currentQuestionElement = null;
        this.navigationElement = null;
        this.questionNumbersElement = null;
    }

    /**
     * Inisialisasi quiz UI dengan session
     */
    initialize(quizSession) {
        if (!quizSession) {
            throw new Error('Quiz session harus disediakan');
        }

        this.quizSession = quizSession;
        this.isQuizActive = true;
        this.storageService = window.storageService;
        this.exportService = new ExportService();
        this.historyService = new HistoryService();
        this.autoSaveInterval = null;
        
        console.log('🎮 Quiz UI diinisialisasi');
        this.renderQuizInterface();
        this.setupEventListeners();
        this.setupTimer();
        this.updateDisplay();
        this.startQuizTimer();
        this.startAutoSave();
        document.body.classList.add('quiz-active');
    }

    /**
     * Render interface quiz lengkap
     */
    renderQuizInterface() {
        // Hide other sections
        this.hideOtherSections();

        // Create quiz interface
        const quizSection = this.createQuizSection();
        
        // Insert into main container
        const main = document.querySelector('.main');
        if (main) {
            main.appendChild(quizSection);
        }

        console.log('🖥️ Quiz interface berhasil dirender');
    }

    /**
     * Sembunyikan section lain
     */
    hideOtherSections() {
        const sectionsToHide = [
            'mode-selection-section',
            'config-section', 
            'session-summary-section',
            'summary-section',
            'validation-section'
        ];

        sectionsToHide.forEach(sectionId => {
            const section = document.getElementById(sectionId);
            if (section) {
                section.style.display = 'none';
            }
        });
    }

    /**
     * Buat section quiz
     */
    createQuizSection() {
        const section = document.createElement('section');
        section.id = 'quiz-section';
        section.className = 'quiz-section';

        // Get mode name for header
        const modeName = this.quizSession.mode === 'tpk' ? 'Latihan TPK' :
                        this.quizSession.mode === 'tmk' ? 'Latihan TMK' :
                        this.quizSession.mode === 'mixed' ? 'Latihan Gabungan' :
                        'Latihan Bebas TPK';

        section.innerHTML = `
            <div class="quiz-header">
                <div class="quiz-title-block">
                    <span class="quiz-kicker">Ruang Latihan</span>
                    <h2>${modeName}</h2>
                </div>
                <div class="quiz-info">
                    <div class="quiz-progress">
                        <span id="progress-text">Soal 1 dari ${this.quizSession.questions.length}</span>
                        <div class="progress-stats">
                            <span class="stat answered">Terjawab: <span id="answered-count">0</span></span>
                            <span class="stat unanswered">Belum: <span id="unanswered-count">${this.quizSession.questions.length}</span></span>
                        </div>
                        <div class="progress-bar-container">
                            <div class="progress-bar">
                                <div id="progress-bar-fill" class="progress-bar-fill"></div>
                            </div>
                        </div>
                    </div>
                    <div class="quiz-timer">
                        <div id="timer-display" class="timer-display">
                            <span class="timer-label">Waktu</span>
                            <span id="timer-text" class="timer-text">--:--</span>
                        </div>
                    </div>
                    <div class="quiz-actions">
                        <button id="clear-progress-btn" class="btn-danger-small">Hapus Progres</button>
                    </div>
                </div>
            </div>

            <div class="quiz-content">
                <div class="question-panel">
                    <div id="current-question" class="current-question">
                        <!-- Question content akan diisi oleh JavaScript -->
                    </div>
                    
                    <div class="quiz-navigation">
                        <button id="prev-btn" class="nav-btn btn-secondary">← Sebelumnya</button>
                        <button id="next-btn" class="nav-btn btn-secondary">Berikutnya →</button>
                        <button id="finish-btn" class="nav-btn btn-primary">Selesai Latihan</button>
                    </div>
                </div>

                <div class="question-numbers-panel">
                    <div class="question-numbers-header">
                        <span>Navigasi</span>
                        <h3>Nomor Soal</h3>
                    </div>
                    <div id="question-numbers" class="question-numbers">
                        <!-- Question numbers akan diisi oleh JavaScript -->
                    </div>
                    <div class="question-legend">
                        <div class="legend-item">
                            <div class="legend-color active"></div>
                            <span>Aktif</span>
                        </div>
                        <div class="legend-item">
                            <div class="legend-color answered"></div>
                            <span>Terjawab</span>
                        </div>
                        <div class="legend-item">
                            <div class="legend-color unanswered"></div>
                            <span>Belum</span>
                        </div>
                    </div>
                </div>
            </div>
        `;

        return section;
    }

    /**
     * Setup timer functionality
     */
    setupTimer() {
        // Set timer callbacks
        this.quizSession.setTimerUpdateCallback((timeRemaining) => {
            this.updateTimerDisplay(timeRemaining);
        });

        this.quizSession.setTimerExpiredCallback(() => {
            this.handleTimerExpired();
        });
    }

    /**
     * Start quiz timer
     */
    startQuizTimer() {
        if (this.quizSession.timerDurationSeconds > 0) {
            this.quizSession.startTimer();
            console.log('⏱️ Timer quiz dimulai');
        } else {
            // Hide timer if no duration set
            const timerDisplay = document.getElementById('timer-display');
            if (timerDisplay) {
                timerDisplay.style.display = 'none';
            }
        }
    }

    /**
     * Update timer display
     */
    updateTimerDisplay(timeRemainingSeconds) {
        const timerText = document.getElementById('timer-text');
        const timerDisplay = document.getElementById('timer-display');
        
        if (!timerText || !timerDisplay) return;

        const formatted = this.formatTime(timeRemainingSeconds);
        timerText.textContent = formatted;

        // Add warning style if time is running low (60 seconds or less)
        if (timeRemainingSeconds <= 60) {
            timerDisplay.classList.add('timer-warning');
        } else {
            timerDisplay.classList.remove('timer-warning');
        }

        // Add critical style if time is very low (10 seconds or less)
        if (timeRemainingSeconds <= 10) {
            timerDisplay.classList.add('timer-critical');
        } else {
            timerDisplay.classList.remove('timer-critical');
        }
    }

    /**
     * Format time in MM:SS
     */
    formatTime(seconds) {
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = seconds % 60;
        return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
    }

    /**
     * Handle timer expired
     */
    handleTimerExpired() {
        // Prevent double submission
        if (this.quizSession.isQuizFinished()) {
            return;
        }

        console.log('⏰ Waktu habis! Auto-finishing quiz...');
        
        // Stop auto-save
        this.stopAutoSave();
        
        // Finish quiz automatically
        this.quizSession.finish();
        
        // Calculate score
        const scoreData = this.quizSession.calculateScore();
        
        // Mark session as finished in storage
        if (this.storageService) {
            this.storageService.markSessionFinished(scoreData);
        }

        // Mark questions as seen in progress service
        if (typeof markSessionQuestionsAsSeen === 'function') {
            markSessionQuestionsAsSeen(this.quizSession);
        }

        // Save to history
        this.saveToHistory(scoreData);
        
        // Show results with timer expired message
        this.showResults(scoreData, true);
    }
    setupEventListeners() {
        // Navigation buttons
        document.getElementById('prev-btn')?.addEventListener('click', () => this.goToPreviousQuestion());
        document.getElementById('next-btn')?.addEventListener('click', () => this.goToNextQuestion());
        document.getElementById('finish-btn')?.addEventListener('click', () => this.showFinishConfirmation());

        // Clear progress button
        document.getElementById('clear-progress-btn')?.addEventListener('click', () => this.showClearProgressConfirmation());

        // Answer selection (delegated event)
        document.addEventListener('change', (e) => {
            if (e.target.name === 'answer') {
                this.selectAnswer(e.target.value);
            }
        });

        // Question number clicks (delegated event)
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('question-number-btn')) {
                const questionIndex = parseInt(e.target.dataset.questionIndex);
                this.goToQuestion(questionIndex);
            }
        });

        console.log('🎛️ Event listeners berhasil disetup');
    }

    /**
     * Update tampilan keseluruhan
     */
    updateDisplay() {
        this.renderCurrentQuestion();
        this.renderQuestionNumbers();
        this.updateProgress();
        this.updateNavigation();
    }

    /**
     * Render soal saat ini
     */
    renderCurrentQuestion() {
        const question = this.quizSession.getCurrentQuestion();
        const questionElement = document.getElementById('current-question');
        
        if (!question || !questionElement) return;

        const userAnswer = this.quizSession.getAnswer(question.id);

        questionElement.innerHTML = `
            <div class="question-header">
                <div class="question-number-label">Pertanyaan ${this.quizSession.currentIndex + 1}</div>
                <div class="question-meta">
                    <span class="badge question-id">${question.id}</span>
                    <span class="badge question-category">${question.kategori}</span>
                    <span class="badge question-subcategory">${question.subkategori}</span>
                    <span class="badge question-level ${question.level.toLowerCase()}">${question.level}</span>
                </div>
            </div>

            <div class="question-content">
                <div class="question-text">
                    ${this.formatQuestionText(question.pertanyaan)}
                </div>

                ${question.gambar ? `
                    <div class="question-image">
                        <img src="${question.gambar}" alt="Gambar soal" />
                    </div>
                ` : ''}

                <div class="answer-options">
                    ${this.renderAnswerOptions(question, userAnswer)}
                </div>
            </div>
        `;
    }

    /**
     * Format teks pertanyaan (handle line breaks)
     */
    formatQuestionText(text) {
        return text.replace(/\n/g, '<br>');
    }

    /**
     * Render pilihan jawaban
     */
    renderAnswerOptions(question, selectedAnswer) {
        const options = ['A', 'B', 'C', 'D', 'E'];
        
        return options.map(option => {
            const optionText = question[`pilihan_${option}`];
            const isSelected = selectedAnswer === option;
            
            return `
                <label class="answer-option ${isSelected ? 'selected' : ''}">
                    <input type="radio" name="answer" value="${option}" ${isSelected ? 'checked' : ''}>
                    <span class="option-letter">${option}</span>
                    <span class="option-text">${this.formatQuestionText(optionText)}</span>
                </label>
            `;
        }).join('');
    }

    /**
     * Render nomor-nomor soal
     */
    renderQuestionNumbers() {
        const numbersElement = document.getElementById('question-numbers');
        if (!numbersElement) return;

        const currentIndex = this.quizSession.currentIndex;
        
        numbersElement.innerHTML = this.quizSession.questions.map((question, index) => {
            const userAnswer = this.quizSession.getAnswer(question.id);
            const isAnswered = userAnswer !== null;
            const isCurrent = index === currentIndex;
            
            let className = 'question-number-btn';
            if (isCurrent) className += ' current';
            if (isAnswered) className += ' answered';
            
            return `
                <button class="${className}" data-question-index="${index}">
                    ${index + 1}
                </button>
            `;
        }).join('');
    }

    /**
     * Update progress info
     */
    updateProgress() {
        const currentNumber = this.quizSession.currentIndex + 1;
        const totalQuestions = this.quizSession.questions.length;
        const answeredCount = this.quizSession.getAnsweredCount();
        const unansweredCount = this.quizSession.getUnansweredCount();

        // Update progress text
        const progressText = document.getElementById('progress-text');
        if (progressText) {
            progressText.textContent = `Soal ${currentNumber} dari ${totalQuestions}`;
        }

        // Update stats
        const answeredElement = document.getElementById('answered-count');
        const unansweredElement = document.getElementById('unanswered-count');
        
        if (answeredElement) answeredElement.textContent = answeredCount;
        if (unansweredElement) unansweredElement.textContent = unansweredCount;

        // Update progress bar
        const progressBarFill = document.getElementById('progress-bar-fill');
        if (progressBarFill) {
            const progressPercentage = (answeredCount / totalQuestions) * 100;
            progressBarFill.style.width = `${progressPercentage}%`;
        }
    }

    /**
     * Update status tombol navigasi
     */
    updateNavigation() {
        const prevBtn = document.getElementById('prev-btn');
        const nextBtn = document.getElementById('next-btn');
        const finishBtn = document.getElementById('finish-btn');

        const currentIndex = this.quizSession.currentIndex;
        const totalQuestions = this.quizSession.questions.length;

        // Previous button
        if (prevBtn) {
            prevBtn.disabled = currentIndex === 0;
        }

        // Next button
        if (nextBtn) {
            nextBtn.disabled = currentIndex === totalQuestions - 1;
        }

        // Finish button - selalu aktif tapi dengan konfirmasi
        if (finishBtn) {
            finishBtn.disabled = false;
        }
    }

    /**
     * Pilih jawaban
     */
    selectAnswer(answer) {
        const currentQuestion = this.quizSession.getCurrentQuestion();
        if (!currentQuestion) return;

        const success = this.quizSession.answerQuestion(currentQuestion.id, answer);
        
        if (success) {
            // Update visual selection
            document.querySelectorAll('.answer-option').forEach(option => {
                option.classList.remove('selected');
            });
            
            const selectedOption = document.querySelector(`input[value="${answer}"]`)?.closest('.answer-option');
            if (selectedOption) {
                selectedOption.classList.add('selected');
            }

            // Update progress dan question numbers
            this.updateProgress();
            this.renderQuestionNumbers();
            
            // Auto-save progress
            this.saveProgress();
            
            console.log(`✏️ Jawaban dipilih: ${answer} untuk soal ${currentQuestion.id}`);
        }
    }

    /**
     * Pindah ke soal sebelumnya
     */
    goToPreviousQuestion() {
        if (this.quizSession.prevQuestion()) {
            this.updateDisplay();
            this.saveProgress();
            console.log('⬅️ Pindah ke soal sebelumnya');
        }
    }

    /**
     * Pindah ke soal berikutnya
     */
    goToNextQuestion() {
        if (this.quizSession.nextQuestion()) {
            this.updateDisplay();
            this.saveProgress();
            console.log('➡️ Pindah ke soal berikutnya');
        }
    }

    /**
     * Pindah ke soal dengan index tertentu
     */
    goToQuestion(index) {
        if (this.quizSession.goToQuestion(index)) {
            this.updateDisplay();
            this.saveProgress();
            console.log(`📍 Pindah ke soal ${index + 1}`);
        }
    }

    /**
     * Tampilkan konfirmasi selesai
     */
    async showFinishConfirmation() {
        const unansweredCount = this.quizSession.getUnansweredCount();
        
        let message = 'Selesaikan latihan?';
        if (unansweredCount > 0) {
            message += ` Masih ada ${unansweredCount} soal yang belum dijawab. Jawaban yang kosong akan dihitung 0.`;
        }

        const confirmed = typeof showConfirmDialog === 'function'
            ? await showConfirmDialog({
                title: 'Selesaikan latihan?',
                message,
                confirmText: 'Selesai Latihan',
                cancelText: 'Lanjut Mengerjakan',
                variant: 'info'
            })
            : confirm(message);

        if (confirmed) {
            this.finishQuiz();
        }
    }

    /**
     * Selesaikan quiz
     */
    finishQuiz() {
        try {
            // Stop auto-save
            this.stopAutoSave();
            
            // Finish quiz session
            this.quizSession.finish();
            
            // Calculate score
            const scoreData = this.quizSession.calculateScore();
            
            // Mark session as finished in storage
            if (this.storageService) {
                this.storageService.markSessionFinished(scoreData);
            }

            // Mark questions as seen in progress service
            if (typeof markSessionQuestionsAsSeen === 'function') {
                markSessionQuestionsAsSeen(this.quizSession);
            }

            // Save to history
            this.saveToHistory(scoreData);
            
            // Show results
            this.showResults(scoreData);
            
            console.log('🏁 Quiz selesai');
            
        } catch (error) {
            console.error('Error finishing quiz:', error);
            alert('Error menyelesaikan quiz: ' + error.message);
        }
    }

    /**
     * Tampilkan hasil sederhana
     */
    showResults(scoreData, isTimerExpired = false) {
        // Hide quiz section
        const quizSection = document.getElementById('quiz-section');
        if (quizSection) {
            quizSection.style.display = 'none';
        }

        // Create results section
        const resultsSection = this.createResultsSection(scoreData, isTimerExpired);
        
        // Insert into main container
        const main = document.querySelector('.main');
        if (main) {
            main.appendChild(resultsSection);
        }

        this.isQuizActive = false;
        console.log('📊 Hasil quiz ditampilkan');
    }

    /**
     * Buat section hasil
     */
    createResultsSection(scoreData, isTimerExpired = false) {
        const section = document.createElement('section');
        section.id = 'results-section';
        section.className = 'results-section';

        // Determine mode for display
        const hasTPK = scoreData.tpkDetails.total > 0;
        const hasTMK = scoreData.tmkDetails.total > 0;
        const isMixed = hasTPK && hasTMK;

        let modeDisplay = '';
        if (isMixed) {
            modeDisplay = 'Simulasi Gabungan (TPK + TMK)';
        } else if (hasTPK) {
            modeDisplay = 'TPK';
        } else if (hasTMK) {
            modeDisplay = 'TMK';
        }

        // Timer expired message
        const timerMessage = isTimerExpired ? `
            <div class="timer-expired-message">
                ⏰ Waktu habis. Latihan otomatis diselesaikan.
            </div>
        ` : '';

        section.innerHTML = `
            <div class="results-dashboard">
                <div class="results-header">
                    <h2>Hasil Latihan</h2>
                    ${timerMessage}
                    <div class="results-disclaimer">
                        Skor ini adalah skor latihan internal, bukan nilai resmi.
                    </div>
                </div>

                <div class="results-main">
                    <div class="score-display">
                        ${this.renderMainScore(scoreData, isMixed)}
                    </div>
                    
                    <div class="results-stats">
                        <div class="stat-card correct">
                            <div class="stat-icon">✓</div>
                            <div class="stat-content">
                                <div class="stat-number">${scoreData.tpkDetails.correct + scoreData.tmkDetails.correct}</div>
                                <div class="stat-label">Benar</div>
                            </div>
                        </div>
                        <div class="stat-card wrong">
                            <div class="stat-icon">✗</div>
                            <div class="stat-content">
                                <div class="stat-number">${scoreData.tpkDetails.wrong + scoreData.tmkDetails.wrong}</div>
                                <div class="stat-label">Salah</div>
                            </div>
                        </div>
                        <div class="stat-card empty">
                            <div class="stat-icon">○</div>
                            <div class="stat-content">
                                <div class="stat-number">${scoreData.unansweredCount}</div>
                                <div class="stat-label">Kosong</div>
                            </div>
                        </div>
                    </div>

                    ${isMixed ? this.renderMixedScoreBreakdown(scoreData) : ''}
                </div>

                <div class="results-actions">
                    <div class="primary-actions">
                        <button id="review-answers-btn" class="btn-primary btn-large">📝 Lihat Review Jawaban</button>
                    </div>
                    <div class="secondary-actions">
                        <button id="print-results-btn" class="btn-secondary">🖨️ Cetak Hasil</button>
                        <button id="download-results-btn" class="btn-secondary">📥 Download JSON</button>
                        <button id="back-to-modes-result-btn" class="btn-secondary">← Kembali ke Beranda</button>
                    </div>
                </div>
            </div>
        `;

        // Setup event listeners
        setTimeout(() => {
            const backBtn = document.getElementById('back-to-modes-result-btn');
            if (backBtn) {
                backBtn.addEventListener('click', () => {
                    this.backToModeSelection();
                });
            }

            const reviewBtn = document.getElementById('review-answers-btn');
            if (reviewBtn) {
                reviewBtn.addEventListener('click', () => {
                    this.showAnswerReview();
                });
            }

            const printBtn = document.getElementById('print-results-btn');
            if (printBtn) {
                printBtn.addEventListener('click', () => {
                    this.printResults();
                });
            }

            const downloadBtn = document.getElementById('download-results-btn');
            if (downloadBtn) {
                downloadBtn.addEventListener('click', () => {
                    this.downloadResults();
                });
            }
        }, 100);

        return section;
    }

    /**
     * Render main score display
     */
    renderMainScore(scoreData, isMixed) {
        if (isMixed) {
            return `
                <div class="main-score mixed">
                    <div class="score-title">Skor Gabungan</div>
                    <div class="score-value">${scoreData.totalScore}</div>
                    <div class="score-subtitle">${scoreData.totalQuestions} soal</div>
                </div>
            `;
        } else {
            const isTPK = scoreData.tpkDetails.total > 0;
            const score = isTPK ? scoreData.tpkScore : scoreData.tmkScore;
            const type = isTPK ? 'TPK' : 'TMK';
            
            return `
                <div class="main-score single">
                    <div class="score-title">Skor ${type}</div>
                    <div class="score-value">${score}</div>
                    <div class="score-subtitle">${scoreData.totalQuestions} soal</div>
                </div>
            `;
        }
    }

    /**
     * Render mixed mode score breakdown
     */
    renderMixedScoreBreakdown(scoreData) {
        return `
            <div class="score-breakdown">
                <h3>Breakdown Skor</h3>
                <div class="breakdown-grid">
                    <div class="breakdown-item tpk">
                        <div class="breakdown-header">
                            <span class="breakdown-type">TPK</span>
                            <span class="breakdown-count">${scoreData.tpkDetails.total} soal</span>
                        </div>
                        <div class="breakdown-score">${scoreData.tpkScore}</div>
                        <div class="breakdown-detail">${scoreData.tpkDetails.correct} benar</div>
                    </div>
                    <div class="breakdown-item tmk">
                        <div class="breakdown-header">
                            <span class="breakdown-type">TMK</span>
                            <span class="breakdown-count">${scoreData.tmkDetails.total} soal</span>
                        </div>
                        <div class="breakdown-score">${scoreData.tmkScore}</div>
                        <div class="breakdown-detail">${scoreData.tmkDetails.correct} benar</div>
                    </div>
                </div>
            </div>
        `;
    }

    /**
     * Render breakdown skor
     */
    renderScoreBreakdown(scoreData, isMixed) {
        if (isMixed) {
            return `
                <div class="score-breakdown">
                    <h3>Breakdown Skor</h3>
                    <div class="score-grid">
                        <div class="score-item tpk">
                            <h4>TPK</h4>
                            <div class="score-value">${scoreData.tpkScore}</div>
                            <div class="score-detail">${scoreData.tpkDetails.correct}/${scoreData.tpkDetails.total} benar</div>
                        </div>
                        <div class="score-item tmk">
                            <h4>TMK</h4>
                            <div class="score-value">${scoreData.tmkScore}</div>
                            <div class="score-detail">${scoreData.tmkDetails.correct}/${scoreData.tmkDetails.total} benar</div>
                        </div>
                        <div class="score-item total">
                            <h4>Total</h4>
                            <div class="score-value">${scoreData.totalScore}</div>
                            <div class="score-detail">Skor Gabungan</div>
                        </div>
                    </div>
                </div>
            `;
        } else {
            const isTPK = scoreData.tpkDetails.total > 0;
            const details = isTPK ? scoreData.tpkDetails : scoreData.tmkDetails;
            const score = isTPK ? scoreData.tpkScore : scoreData.tmkScore;
            
            return `
                <div class="score-breakdown">
                    <h3>Skor Total</h3>
                    <div class="single-score">
                        <div class="score-value large">${score}</div>
                        <div class="score-detail">${details.correct}/${details.total} benar</div>
                    </div>
                </div>
            `;
        }
    }

    /**
     * Tampilkan review jawaban detail
     */
    showAnswerReview() {
        try {
            const reviewData = this.quizSession.getReviewData();
            if (!reviewData) {
                throw new Error('Data review tidak tersedia');
            }

            // Hide results section
            const resultsSection = document.getElementById('results-section');
            if (resultsSection) {
                resultsSection.style.display = 'none';
            }

            // Create review section
            const reviewSection = this.createReviewSection(reviewData);
            
            // Insert into main container
            const main = document.querySelector('.main');
            if (main) {
                main.appendChild(reviewSection);
            }

            console.log('📝 Answer review ditampilkan');
            
        } catch (error) {
            console.error('Error showing answer review:', error);
            alert('Error menampilkan review jawaban: ' + error.message);
        }
    }

    /**
     * Buat section review jawaban
     */
    createReviewSection(reviewData) {
        const section = document.createElement('section');
        section.id = 'review-section';
        section.className = 'review-section';

        const scoreData = reviewData.score;
        const questions = reviewData.questions;

        section.innerHTML = `
            <div class="review-dashboard">
                <div class="review-header">
                    <div class="review-title">
                        <h2>Review Jawaban</h2>
                        <button id="back-to-results-btn" class="btn-secondary btn-back">← Kembali ke Hasil</button>
                    </div>
                    
                    <div class="review-summary-compact">
                        <div class="summary-stat correct">
                            <span class="stat-number">${scoreData.tpkDetails.correct + scoreData.tmkDetails.correct}</span>
                            <span class="stat-label">Benar</span>
                        </div>
                        <div class="summary-stat wrong">
                            <span class="stat-number">${scoreData.tpkDetails.wrong + scoreData.tmkDetails.wrong}</span>
                            <span class="stat-label">Salah</span>
                        </div>
                        <div class="summary-stat empty">
                            <span class="stat-number">${scoreData.unansweredCount}</span>
                            <span class="stat-label">Kosong</span>
                        </div>
                        <div class="summary-stat total">
                            <span class="stat-number">${scoreData.totalScore}</span>
                            <span class="stat-label">Skor Total</span>
                        </div>
                    </div>
                </div>

                <div class="review-filters">
                    <div class="filter-segmented">
                        <button class="filter-segment active" data-filter="all">
                            <span class="filter-label">Semua</span>
                            <span class="filter-count">${questions.length}</span>
                        </button>
                        <button class="filter-segment" data-filter="correct">
                            <span class="filter-label">Benar</span>
                            <span class="filter-count">${scoreData.tpkDetails.correct + scoreData.tmkDetails.correct}</span>
                        </button>
                        <button class="filter-segment" data-filter="wrong">
                            <span class="filter-label">Salah</span>
                            <span class="filter-count">${scoreData.tpkDetails.wrong + scoreData.tmkDetails.wrong}</span>
                        </button>
                        <button class="filter-segment" data-filter="empty">
                            <span class="filter-label">Kosong</span>
                            <span class="filter-count">${scoreData.unansweredCount}</span>
                        </button>
                    </div>
                </div>

                <div class="review-content">
                    <div id="review-questions" class="review-questions">
                        ${this.renderReviewQuestions(questions)}
                    </div>
                </div>

                <div class="review-actions">
                    <button id="back-to-modes-review-btn" class="btn-secondary">← Kembali ke Beranda</button>
                </div>
            </div>
        `;

        // Setup event listeners
        setTimeout(() => {
            this.setupReviewEventListeners();
        }, 100);

        return section;
    }

    /**
     * Render semua pertanyaan review
     */
    renderReviewQuestions(questions) {
        return questions.map((question, index) => {
            const userAnswer = question.userAnswer;
            const correctAnswer = question.jawaban_benar;
            const isAnswered = question.isAnswered;
            const isCorrect = question.isCorrect;
            
            let statusClass = '';
            let statusText = '';
            let statusIcon = '';
            
            if (!isAnswered) {
                statusClass = 'empty';
                statusText = 'Kosong';
                statusIcon = '○';
            } else if (isCorrect) {
                statusClass = 'correct';
                statusText = 'Benar';
                statusIcon = '✓';
            } else {
                statusClass = 'wrong';
                statusText = 'Salah';
                statusIcon = '✗';
            }

            return `
                <div class="review-question-card ${statusClass}" data-status="${statusClass}">
                    <div class="question-card-header">
                        <div class="question-info">
                            <div class="question-number">Soal ${index + 1}</div>
                            <div class="question-meta-badges">
                                <span class="meta-badge id">${question.id}</span>
                                <span class="meta-badge category">${question.kategori}</span>
                                <span class="meta-badge subcategory">${question.subkategori}</span>
                                <span class="meta-badge level level-${question.level.toLowerCase()}">${question.level}</span>
                            </div>
                        </div>
                        <div class="question-status-badge status-${statusClass}">
                            <span class="status-icon">${statusIcon}</span>
                            <span class="status-text">${statusText}</span>
                        </div>
                    </div>

                    <div class="question-card-content">
                        <div class="question-text-review">
                            ${this.formatQuestionText(question.pertanyaan)}
                        </div>

                        ${question.gambar ? `
                            <div class="question-image-review">
                                <img src="${question.gambar}" alt="Gambar soal" />
                            </div>
                        ` : ''}

                        <div class="answer-options-review">
                            ${this.renderReviewOptions(question, userAnswer, correctAnswer)}
                        </div>

                        <div class="answer-summary-review">
                            ${this.renderAnswerSummaryCard(userAnswer, correctAnswer, isAnswered, isCorrect)}
                        </div>

                        <div class="explanation-sections">
                            <div class="explanation-main">
                                <h4>📖 Pembahasan</h4>
                                <div class="explanation-content">
                                    ${this.formatQuestionText(question.pembahasan)}
                                </div>
                            </div>

                            <div class="option-explanations">
                                <h4>💡 Penjelasan Setiap Opsi</h4>
                                <div class="explanations-grid">
                                    ${['A', 'B', 'C', 'D', 'E'].map(option => `
                                        <div class="option-explanation ${option === correctAnswer ? 'correct-option' : ''}">
                                            <div class="option-letter-exp">${option}</div>
                                            <div class="option-explanation-text">
                                                ${this.formatQuestionText(question[`alasan_opsi_${option}`])}
                                            </div>
                                        </div>
                                    `).join('')}
                                </div>
                            </div>

                            ${question.cara_cepat ? `
                                <div class="quick-method">
                                    <h4>⚡ Cara Cepat</h4>
                                    <div class="quick-method-content">
                                        ${this.formatQuestionText(question.cara_cepat)}
                                    </div>
                                </div>
                            ` : ''}
                        </div>
                    </div>
                </div>
            `;
        }).join('');
    }

    /**
     * Render answer summary card
     */
    renderAnswerSummaryCard(userAnswer, correctAnswer, isAnswered, isCorrect) {
        if (!isAnswered) {
            return `
                <div class="answer-summary-card empty">
                    <div class="summary-icon">○</div>
                    <div class="summary-content">
                        <div class="summary-status">Tidak dijawab</div>
                        <div class="summary-detail">Jawaban benar: <strong>${correctAnswer}</strong></div>
                    </div>
                </div>
            `;
        } else if (isCorrect) {
            return `
                <div class="answer-summary-card correct">
                    <div class="summary-icon">✓</div>
                    <div class="summary-content">
                        <div class="summary-status">Jawaban Benar</div>
                        <div class="summary-detail">Anda menjawab: <strong>${userAnswer}</strong></div>
                    </div>
                </div>
            `;
        } else {
            return `
                <div class="answer-summary-card wrong">
                    <div class="summary-icon">✗</div>
                    <div class="summary-content">
                        <div class="summary-status">Jawaban Salah</div>
                        <div class="summary-detail">
                            Anda menjawab: <strong>${userAnswer}</strong><br>
                            Jawaban benar: <strong>${correctAnswer}</strong>
                        </div>
                    </div>
                </div>
            `;
        }
    }

    /**
     * Render pilihan jawaban untuk review
     */
    renderReviewOptions(question, userAnswer, correctAnswer) {
        const options = ['A', 'B', 'C', 'D', 'E'];
        
        return options.map(option => {
            const optionText = question[`pilihan_${option}`];
            const isUserAnswer = userAnswer === option;
            const isCorrectAnswer = correctAnswer === option;
            
            let optionClass = 'review-option-card';
            let indicators = [];
            
            if (isCorrectAnswer) {
                optionClass += ' correct-answer';
                indicators.push('<span class="option-indicator correct">✓ Jawaban Benar</span>');
            }
            
            if (isUserAnswer && !isCorrectAnswer) {
                optionClass += ' user-wrong';
                indicators.push('<span class="option-indicator user-wrong">← Jawaban Anda</span>');
            }
            
            if (isUserAnswer && isCorrectAnswer) {
                optionClass += ' user-correct';
                indicators.push('<span class="option-indicator user-correct">✓ Jawaban Anda</span>');
            }
            
            return `
                <div class="${optionClass}">
                    <div class="option-content">
                        <div class="option-letter-review">${option}</div>
                        <div class="option-text-review">${this.formatQuestionText(optionText)}</div>
                    </div>
                    ${indicators.length > 0 ? `<div class="option-indicators">${indicators.join('')}</div>` : ''}
                </div>
            `;
        }).join('');
    }

    /**
     * Render ringkasan jawaban
     */
    renderAnswerSummary(userAnswer, correctAnswer, isAnswered, isCorrect) {
        if (!isAnswered) {
            return `
                <div class="answer-summary-item empty">
                    <strong>Status:</strong> Tidak dijawab
                    <br><strong>Jawaban Benar:</strong> ${correctAnswer}
                </div>
            `;
        } else if (isCorrect) {
            return `
                <div class="answer-summary-item correct">
                    <strong>Status:</strong> Benar ✓
                    <br><strong>Jawaban Anda:</strong> ${userAnswer}
                </div>
            `;
        } else {
            return `
                <div class="answer-summary-item wrong">
                    <strong>Status:</strong> Salah ✗
                    <br><strong>Jawaban Anda:</strong> ${userAnswer}
                    <br><strong>Jawaban Benar:</strong> ${correctAnswer}
                </div>
            `;
        }
    }

    /**
     * Setup event listeners untuk review
     */
    setupReviewEventListeners() {
        // Filter segments
        document.querySelectorAll('.filter-segment').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const filter = e.target.closest('.filter-segment').dataset.filter;
                this.filterReviewQuestions(filter);
                
                // Update active segment
                document.querySelectorAll('.filter-segment').forEach(b => b.classList.remove('active'));
                e.target.closest('.filter-segment').classList.add('active');
            });
        });

        // Back buttons
        const backToResultsBtn = document.getElementById('back-to-results-btn');
        if (backToResultsBtn) {
            backToResultsBtn.addEventListener('click', () => {
                this.backToResults();
            });
        }

        const backToModesBtn = document.getElementById('back-to-modes-review-btn');
        if (backToModesBtn) {
            backToModesBtn.addEventListener('click', () => {
                this.backToModeSelection();
            });
        }
    }

    /**
     * Filter pertanyaan berdasarkan status
     */
    filterReviewQuestions(filter) {
        const questions = document.querySelectorAll('.review-question-card');
        
        questions.forEach(question => {
            const status = question.dataset.status;
            
            if (filter === 'all') {
                question.style.display = 'block';
            } else if (filter === status) {
                question.style.display = 'block';
            } else {
                question.style.display = 'none';
            }
        });

        console.log(`🔍 Filter applied: ${filter}`);
    }

    /**
     * Kembali ke hasil
     */
    backToResults() {
        const reviewSection = document.getElementById('review-section');
        const resultsSection = document.getElementById('results-section');
        
        if (reviewSection) reviewSection.remove();
        if (resultsSection) resultsSection.style.display = 'block';
        
        console.log('🔙 Kembali ke hasil');
    }

    /**
     * Kembali ke mode selection
     */
    backToModeSelection() {
        // Remove quiz and results sections
        const quizSection = document.getElementById('quiz-section');
        const resultsSection = document.getElementById('results-section');
        const reviewSection = document.getElementById('review-section');
        
        if (quizSection) quizSection.remove();
        if (resultsSection) resultsSection.remove();
        if (reviewSection) reviewSection.remove();

        // Reset quiz state
        this.quizSession = null;
        this.isQuizActive = false;
        document.body.classList.remove('quiz-active');
        window.activeQuizSession = null;

        // Show mode selection
        if (typeof showModeSelection === 'function') {
            showModeSelection();
        }

        console.log('🔄 Kembali ke mode selection');
    }

    /**
     * Cek apakah quiz sedang aktif
     */
    isActive() {
        return this.isQuizActive;
    }

    /**
     * Cleanup quiz UI
     */
    cleanup() {
        const quizSection = document.getElementById('quiz-section');
        const resultsSection = document.getElementById('results-section');
        const reviewSection = document.getElementById('review-section');
        
        if (quizSection) quizSection.remove();
        if (resultsSection) resultsSection.remove();
        if (reviewSection) reviewSection.remove();
        document.body.classList.remove('quiz-active');

        // Stop auto-save
        this.stopAutoSave();

        this.quizSession = null;
        this.isQuizActive = false;
        
        console.log('🧹 Quiz UI dibersihkan');
    }

    /**
     * Start auto-save functionality
     */
    startAutoSave() {
        if (!this.storageService) {
            console.log('⚠️ Storage service tidak tersedia, auto-save dinonaktifkan');
            return;
        }

        // Save immediately
        this.saveProgress();

        // Set up periodic auto-save (every 5 seconds)
        this.autoSaveInterval = setInterval(() => {
            this.saveProgress();
        }, 5000);

        console.log('💾 Auto-save dimulai (setiap 5 detik)');
    }

    /**
     * Stop auto-save functionality
     */
    stopAutoSave() {
        if (this.autoSaveInterval) {
            clearInterval(this.autoSaveInterval);
            this.autoSaveInterval = null;
            console.log('🛑 Auto-save dihentikan');
        }
    }

    /**
     * Save current progress to localStorage
     */
    saveProgress() {
        if (!this.storageService || !this.quizSession) {
            return;
        }

        try {
            const success = this.storageService.saveSession(this.quizSession);
            if (success) {
                console.log('💾 Progres disimpan');
            }
        } catch (error) {
            console.error('❌ Error saving progress:', error);
        }
    }

    /**
     * Show clear progress confirmation
     */
    async showClearProgressConfirmation() {
        const message = 'Semua jawaban dan progres latihan ini akan dihapus. Anda akan kembali ke pilihan mode.';
        
        const confirmed = typeof showConfirmDialog === 'function'
            ? await showConfirmDialog({
                title: 'Hapus progres latihan?',
                message,
                confirmText: 'Hapus Progres',
                cancelText: 'Batal',
                variant: 'danger'
            })
            : confirm(message);

        if (confirmed) {
            this.clearProgress();
        }
    }

    /**
     * Clear progress and return to mode selection
     */
    clearProgress() {
        try {
            // Stop auto-save
            this.stopAutoSave();
            
            // Clear from storage
            if (this.storageService) {
                this.storageService.clearSession();
            }
            
            // Return to mode selection
            this.backToModeSelection();
            
            console.log('🗑️ Progres dihapus, kembali ke mode selection');
            
        } catch (error) {
            console.error('Error clearing progress:', error);
            alert('Error menghapus progres: ' + error.message);
        }
    }

    /**
     * Print hasil latihan
     */
    printResults() {
        try {
            if (!this.exportService) {
                throw new Error('Export service tidak tersedia');
            }

            this.exportService.printResults();
            console.log('🖨️ Print hasil latihan');
            
        } catch (error) {
            console.error('Error printing results:', error);
            alert('Error mencetak hasil: ' + error.message);
        }
    }

    /**
     * Download hasil sebagai JSON
     */
    downloadResults() {
        try {
            if (!this.exportService || !this.quizSession) {
                throw new Error('Export service atau quiz session tidak tersedia');
            }

            // Get current score data
            const scoreData = this.quizSession.calculateScore();
            
            // Download JSON
            this.exportService.downloadResultsJSON(this.quizSession, scoreData);
            console.log('📥 Download hasil JSON');
            
        } catch (error) {
            console.error('Error downloading results:', error);
            alert('Error mendownload hasil: ' + error.message);
        }
    }

    /**
     * Simpan hasil ke riwayat
     */
    saveToHistory(scoreData) {
        try {
            if (!this.historyService || !this.quizSession) {
                console.warn('⚠️ History service atau quiz session tidak tersedia');
                return;
            }

            // Create history entry
            const historyEntry = this.historyService.createHistoryEntry(this.quizSession, scoreData);
            
            // Save to history
            const historyId = this.historyService.saveResult(historyEntry);
            
            if (historyId) {
                console.log('📚 Hasil disimpan ke riwayat:', historyId);
            } else {
                console.warn('⚠️ Gagal menyimpan ke riwayat');
            }
            
        } catch (error) {
            console.error('Error saving to history:', error);
            // Don't show alert for history errors, just log
        }
    }
}

// Global quiz UI instance
let quizUI = null;

// Function untuk memulai quiz UI
function startQuizUI(quizSession) {
    try {
        if (!quizSession) {
            throw new Error('Quiz session tidak tersedia');
        }

        // Cleanup existing quiz UI
        if (quizUI) {
            quizUI.cleanup();
        }

        // Create new quiz UI
        quizUI = new QuizUI();
        quizUI.initialize(quizSession);
        
        // Store globally
        window.quizUI = quizUI;
        
        console.log('🎮 Quiz UI berhasil dimulai');
        return quizUI;
        
    } catch (error) {
        console.error('Error starting quiz UI:', error);
        throw error;
    }
}

// Export untuk penggunaan di Node.js dan browser
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { QuizUI, startQuizUI };
} else if (typeof window !== 'undefined') {
    window.QuizUI = QuizUI;
    window.startQuizUI = startQuizUI;
}
