/**
 * Test Script untuk Quiz Engine CAT KDKMP
 * Menguji fungsi-fungsi core quiz engine dengan data dummy
 */

const fs = require('fs');
const path = require('path');

// Import modules (simulasi untuk Node.js environment)
const QuestionService = require('../src/question-service.js');
const QuizSession = require('../src/quiz-engine.js');

class QuizEngineTest {
    constructor() {
        this.questionService = new QuestionService();
        this.testResults = {
            loadTest: false,
            tpkTest: false,
            tmkTest: false,
            mixedTest: false,
            errors: []
        };
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

    addError(test, error) {
        this.testResults.errors.push(`[${test}] ${error}`);
        this.log(`❌ ${test}: ${error}`, 'error');
    }

    // Simulasi fetch untuk Node.js environment
    async mockFetch(filePath) {
        return new Promise((resolve, reject) => {
            try {
                const fullPath = path.join(process.cwd(), filePath);
                const data = fs.readFileSync(fullPath, 'utf8');
                const jsonData = JSON.parse(data);
                
                resolve({
                    ok: true,
                    json: () => Promise.resolve(jsonData)
                });
            } catch (error) {
                reject(error);
            }
        });
    }

    // Override fetch untuk testing di Node.js
    setupNodeEnvironment() {
        global.fetch = this.mockFetch;
        global.console = console;
    }

    async testLoadQuestionBanks() {
        try {
            this.log('\n🔍 TEST 1: Loading Question Banks', 'info');
            
            // Setup environment untuk Node.js
            this.setupNodeEnvironment();
            
            const questionBanks = await this.questionService.loadQuestionBanks();
            
            if (!questionBanks) {
                throw new Error('Question banks tidak berhasil dimuat');
            }

            // Validasi struktur
            const expectedFiles = ['tpk_bahasa', 'tpk_hitungan', 'tpk_pengetahuan_umum', 'tpk_pola_gambar', 'tpk_abstraksi_ruang', 'tpk_bentuk', 'tmk'];
            
            expectedFiles.forEach(file => {
                if (!questionBanks[file]) {
                    throw new Error(`File ${file} tidak ditemukan dalam question banks`);
                }
                if (!questionBanks[file].questions || !Array.isArray(questionBanks[file].questions)) {
                    throw new Error(`File ${file} tidak memiliki array questions yang valid`);
                }
            });

            // Hitung statistik
            const stats = this.questionService.getStatistics();
            this.log(`   📊 Total soal: ${stats.totalQuestions}`, 'info');
            this.log(`   📘 Total TPK: ${stats.totalTPK}`, 'info');
            this.log(`   📕 Total TMK: ${stats.totalTMK}`, 'info');

            this.testResults.loadTest = true;
            this.log('✅ TEST 1 BERHASIL: Question banks berhasil dimuat', 'success');
            
            return questionBanks;
            
        } catch (error) {
            this.addError('LoadQuestionBanks', error.message);
            throw error;
        }
    }

    async testTPKQuiz() {
        try {
            this.log('\n🔍 TEST 2: TPK Quiz Session', 'info');
            
            // Ambil soal TPK
            const tpkQuestions = this.questionService.getTPKQuestions();
            
            if (tpkQuestions.length === 0) {
                throw new Error('Tidak ada soal TPK yang ditemukan');
            }

            this.log(`   📘 Soal TPK tersedia: ${tpkQuestions.length}`, 'info');

            // Shuffle dan ambil 5 soal untuk test
            const shuffledQuestions = this.questionService.shuffleQuestions(tpkQuestions);
            const selectedQuestions = this.questionService.selectQuestions(shuffledQuestions, 5);

            // Buat quiz session
            const quizSession = new QuizSession(selectedQuestions, 'tpk', 'practice');

            // Test navigasi
            this.log('   🧭 Testing navigasi...', 'info');
            const firstQuestion = quizSession.getCurrentQuestion();
            if (!firstQuestion) {
                throw new Error('Tidak bisa mendapatkan soal pertama');
            }

            // Test menjawab soal secara dummy
            this.log('   ✏️ Testing menjawab soal...', 'info');
            const dummyAnswers = ['A', 'B', 'C', 'A', 'B']; // Jawaban dummy
            
            selectedQuestions.forEach((question, index) => {
                const answer = dummyAnswers[index % dummyAnswers.length];
                const success = quizSession.answerQuestion(question.id, answer);
                if (!success) {
                    throw new Error(`Gagal menjawab soal ${question.id}`);
                }
            });

            // Test finish dan scoring
            this.log('   🏁 Testing finish dan scoring...', 'info');
            quizSession.finish();
            const scoreData = quizSession.calculateScore();
            
            if (!scoreData) {
                throw new Error('Gagal menghitung skor');
            }

            this.log(`   📊 Skor TPK dummy: ${scoreData.tpkScore}/${scoreData.tpkDetails.total}`, 'info');
            this.log(`   ✅ Benar: ${scoreData.tpkDetails.correct}, ❌ Salah: ${scoreData.tpkDetails.wrong}`, 'info');

            this.testResults.tpkTest = true;
            this.log('✅ TEST 2 BERHASIL: TPK Quiz Session berfungsi', 'success');
            
            return scoreData;
            
        } catch (error) {
            this.addError('TPKQuiz', error.message);
            throw error;
        }
    }

    async testTMKQuiz() {
        try {
            this.log('\n🔍 TEST 3: TMK Quiz Session', 'info');
            
            // Ambil soal TMK
            const tmkQuestions = this.questionService.getTMKQuestions();
            
            if (tmkQuestions.length === 0) {
                throw new Error('Tidak ada soal TMK yang ditemukan');
            }

            this.log(`   📕 Soal TMK tersedia: ${tmkQuestions.length}`, 'info');

            // Shuffle dan ambil 5 soal untuk test
            const shuffledQuestions = this.questionService.shuffleQuestions(tmkQuestions);
            const selectedQuestions = this.questionService.selectQuestions(shuffledQuestions, 5);

            // Buat quiz session
            const quizSession = new QuizSession(selectedQuestions, 'tmk', 'practice');

            // Test menjawab soal secara dummy
            this.log('   ✏️ Testing menjawab soal...', 'info');
            const dummyAnswers = ['C', 'D', 'E', 'A', 'B']; // Jawaban dummy berbeda
            
            selectedQuestions.forEach((question, index) => {
                const answer = dummyAnswers[index % dummyAnswers.length];
                const success = quizSession.answerQuestion(question.id, answer);
                if (!success) {
                    throw new Error(`Gagal menjawab soal ${question.id}`);
                }
            });

            // Test finish dan scoring
            this.log('   🏁 Testing finish dan scoring...', 'info');
            quizSession.finish();
            const scoreData = quizSession.calculateScore();
            
            if (!scoreData) {
                throw new Error('Gagal menghitung skor');
            }

            this.log(`   📊 Skor TMK dummy: ${scoreData.tmkScore}/${scoreData.tmkDetails.total * 5}`, 'info');
            this.log(`   ✅ Benar: ${scoreData.tmkDetails.correct}, ❌ Salah: ${scoreData.tmkDetails.wrong}`, 'info');

            this.testResults.tmkTest = true;
            this.log('✅ TEST 3 BERHASIL: TMK Quiz Session berfungsi', 'success');
            
            return scoreData;
            
        } catch (error) {
            this.addError('TMKQuiz', error.message);
            throw error;
        }
    }

    async testMixedQuiz() {
        try {
            this.log('\n🔍 TEST 4: Mixed Quiz Session (TPK + TMK)', 'info');
            
            // Ambil soal campuran
            const tpkQuestions = this.questionService.getTPKQuestions();
            const tmkQuestions = this.questionService.getTMKQuestions();
            
            // Ambil 3 TPK + 2 TMK untuk test
            const selectedTPK = this.questionService.selectQuestions(
                this.questionService.shuffleQuestions(tpkQuestions), 3
            );
            const selectedTMK = this.questionService.selectQuestions(
                this.questionService.shuffleQuestions(tmkQuestions), 2
            );
            
            const mixedQuestions = [...selectedTPK, ...selectedTMK];
            const shuffledMixed = this.questionService.shuffleQuestions(mixedQuestions);

            this.log(`   🔀 Soal campuran: ${selectedTPK.length} TPK + ${selectedTMK.length} TMK`, 'info');

            // Buat quiz session
            const quizSession = new QuizSession(shuffledMixed, 'mixed', 'practice');

            // Test menjawab soal secara dummy
            this.log('   ✏️ Testing menjawab soal campuran...', 'info');
            const dummyAnswers = ['A', 'C', 'E', 'B', 'D'];
            
            shuffledMixed.forEach((question, index) => {
                const answer = dummyAnswers[index % dummyAnswers.length];
                const success = quizSession.answerQuestion(question.id, answer);
                if (!success) {
                    throw new Error(`Gagal menjawab soal ${question.id}`);
                }
            });

            // Test finish dan scoring
            this.log('   🏁 Testing finish dan scoring campuran...', 'info');
            quizSession.finish();
            const scoreData = quizSession.calculateScore();
            
            if (!scoreData) {
                throw new Error('Gagal menghitung skor campuran');
            }

            this.log(`   📊 Skor TPK: ${scoreData.tpkScore}/${scoreData.tpkDetails.total}`, 'info');
            this.log(`   📊 Skor TMK: ${scoreData.tmkScore}/${scoreData.tmkDetails.total * 5}`, 'info');
            this.log(`   📊 Total: ${scoreData.totalScore}`, 'info');

            this.testResults.mixedTest = true;
            this.log('✅ TEST 4 BERHASIL: Mixed Quiz Session berfungsi', 'success');
            
            return scoreData;
            
        } catch (error) {
            this.addError('MixedQuiz', error.message);
            throw error;
        }
    }

    async runAllTests() {
        this.log('🚀 MEMULAI QUIZ ENGINE TEST', 'info');
        this.log('=' .repeat(50), 'info');

        try {
            // Test 1: Load question banks
            await this.testLoadQuestionBanks();
            
            // Test 2: TPK Quiz
            await this.testTPKQuiz();
            
            // Test 3: TMK Quiz
            await this.testTMKQuiz();
            
            // Test 4: Mixed Quiz
            await this.testMixedQuiz();
            
            // Summary
            this.showSummary();
            
        } catch (error) {
            this.log(`\n💥 TEST GAGAL: ${error.message}`, 'error');
            this.showSummary();
            process.exit(1);
        }
    }

    showSummary() {
        this.log('\n' + '='.repeat(50), 'info');
        this.log('📋 RINGKASAN TEST RESULTS:', 'info');
        
        const tests = [
            { name: 'Load Question Banks', result: this.testResults.loadTest },
            { name: 'TPK Quiz Session', result: this.testResults.tpkTest },
            { name: 'TMK Quiz Session', result: this.testResults.tmkTest },
            { name: 'Mixed Quiz Session', result: this.testResults.mixedTest }
        ];

        tests.forEach(test => {
            const status = test.result ? '✅ PASS' : '❌ FAIL';
            this.log(`   ${status} ${test.name}`, test.result ? 'success' : 'error');
        });

        if (this.testResults.errors.length > 0) {
            this.log('\n🚨 ERRORS DITEMUKAN:', 'error');
            this.testResults.errors.forEach(error => {
                this.log(`   • ${error}`, 'error');
            });
        }

        const allPassed = tests.every(test => test.result);
        
        this.log('\n' + '='.repeat(50), 'info');
        if (allPassed) {
            this.log('🎉 QUIZ ENGINE TEST BERHASIL!', 'success');
            this.log('Semua komponen quiz engine berfungsi dengan baik.', 'success');
        } else {
            this.log('❌ QUIZ ENGINE TEST GAGAL!', 'error');
            this.log('Beberapa komponen tidak berfungsi dengan baik.', 'error');
        }
    }
}

// Jalankan test jika file dijalankan langsung
if (require.main === module) {
    const tester = new QuizEngineTest();
    tester.runAllTests();
}

module.exports = QuizEngineTest;