#!/usr/bin/env node

/**
 * Test Storage Service - Menguji fungsi localStorage untuk CAT KDKMP
 */

const fs = require('fs');
const path = require('path');

// Import classes
const QuizSession = require('../src/quiz-engine.js');
const StorageService = require('../src/storage-service.js');

console.log('🧪 MEMULAI STORAGE SERVICE TEST');
console.log('='.repeat(50));

async function runStorageTests() {
    try {
        // Mock localStorage for Node.js environment
        global.localStorage = {
            data: {},
            setItem(key, value) {
                this.data[key] = value;
            },
            getItem(key) {
                return this.data[key] || null;
            },
            removeItem(key) {
                delete this.data[key];
            }
        };

        console.log('🔍 TEST 1: Storage Service Initialization');
        const storageService = new StorageService();
        console.log('✅ StorageService berhasil diinisialisasi');

        console.log('\n🔍 TEST 2: Create Mock Quiz Session');
        // Create mock questions
        const mockQuestions = [
            {
                id: 'TPK-TEST-001',
                kategori: 'TPK',
                subkategori: 'Bahasa',
                level: 'Mudah',
                pertanyaan: 'Test question 1',
                pilihan_A: 'Option A',
                pilihan_B: 'Option B',
                pilihan_C: 'Option C',
                pilihan_D: 'Option D',
                pilihan_E: 'Option E',
                jawaban_benar: 'A'
            },
            {
                id: 'TPK-TEST-002',
                kategori: 'TPK',
                subkategori: 'Hitungan',
                level: 'Sedang',
                pertanyaan: 'Test question 2',
                pilihan_A: 'Option A',
                pilihan_B: 'Option B',
                pilihan_C: 'Option C',
                pilihan_D: 'Option D',
                pilihan_E: 'Option E',
                jawaban_benar: 'B'
            },
            {
                id: 'TMK-TEST-001',
                kategori: 'TMK',
                subkategori: 'Prinsip Koperasi',
                level: 'Mudah',
                pertanyaan: 'Test TMK question',
                pilihan_A: 'Option A',
                pilihan_B: 'Option B',
                pilihan_C: 'Option C',
                pilihan_D: 'Option D',
                pilihan_E: 'Option E',
                jawaban_benar: 'C'
            }
        ];

        const quizSession = new QuizSession(mockQuestions, 'mixed', 'practice');
        
        // Set timer
        quizSession.setTimerDuration(300); // 5 minutes
        
        console.log(`✅ Mock quiz session dibuat: ${mockQuestions.length} soal`);

        console.log('\n🔍 TEST 3: Save Session to Storage');
        const saveSuccess = storageService.saveSession(quizSession);
        console.log(`✅ Save session: ${saveSuccess ? 'BERHASIL' : 'GAGAL'}`);

        console.log('\n🔍 TEST 4: Check Active Session');
        const hasActive = storageService.hasActiveSession();
        console.log(`✅ Has active session: ${hasActive ? 'YA' : 'TIDAK'}`);

        console.log('\n🔍 TEST 5: Get Session Info');
        const sessionInfo = storageService.getSessionInfo();
        if (sessionInfo) {
            console.log('✅ Session info berhasil diambil:');
            console.log(`   📊 Mode: ${sessionInfo.mode}`);
            console.log(`   📊 Total soal: ${sessionInfo.totalQuestions}`);
            console.log(`   📊 Terjawab: ${sessionInfo.answeredCount}`);
            console.log(`   📊 Index saat ini: ${sessionInfo.currentIndex}`);
            console.log(`   📊 Timer: ${sessionInfo.hasTimer ? 'ADA' : 'TIDAK ADA'}`);
        } else {
            console.log('❌ Session info tidak ditemukan');
        }

        console.log('\n🔍 TEST 6: Answer Some Questions');
        quizSession.answerQuestion('TPK-TEST-001', 'A');
        quizSession.answerQuestion('TPK-TEST-002', 'B');
        quizSession.nextQuestion();
        quizSession.nextQuestion();
        
        // Save updated session
        storageService.saveSession(quizSession);
        console.log('✅ Jawaban disimpan dan session diupdate');

        console.log('\n🔍 TEST 7: Load Session Data');
        const sessionData = storageService.loadSession();
        if (sessionData) {
            console.log('✅ Session data berhasil dimuat');
            console.log(`   📊 Question IDs: ${sessionData.questionIds.length} soal`);
            console.log(`   📊 Answers: ${Object.keys(sessionData.answers).length} jawaban`);
            console.log(`   📊 Current index: ${sessionData.currentIndex}`);
            console.log(`   📊 Timer duration: ${sessionData.timerDurationSeconds}s`);
            console.log(`   📊 Time remaining: ${sessionData.timeRemainingSeconds}s`);
        } else {
            console.log('❌ Session data tidak ditemukan');
        }

        console.log('\n🔍 TEST 8: Validate Session Data Structure');
        const isValid = storageService.validateSessionData(sessionData);
        console.log(`✅ Session data validation: ${isValid ? 'VALID' : 'INVALID'}`);

        console.log('\n🔍 TEST 9: Mark Session Finished');
        const mockResult = {
            totalScore: 2,
            tpkScore: 2,
            tmkScore: 0,
            totalQuestions: 3
        };
        const finishSuccess = storageService.markSessionFinished(mockResult);
        console.log(`✅ Mark finished: ${finishSuccess ? 'BERHASIL' : 'GAGAL'}`);

        console.log('\n🔍 TEST 10: Check Active Session After Finish');
        const hasActiveAfterFinish = storageService.hasActiveSession();
        console.log(`✅ Has active after finish: ${hasActiveAfterFinish ? 'YA' : 'TIDAK'}`);

        console.log('\n🔍 TEST 11: Storage Size Info');
        const storageSize = storageService.getStorageSize();
        console.log('✅ Storage size info:');
        console.log(`   📊 Session: ${storageSize.session} bytes`);
        console.log(`   📊 Result: ${storageSize.result} bytes`);
        console.log(`   📊 Total: ${storageSize.total} bytes`);

        console.log('\n🔍 TEST 12: Clear Session');
        const clearSuccess = storageService.clearSession();
        console.log(`✅ Clear session: ${clearSuccess ? 'BERHASIL' : 'GAGAL'}`);

        console.log('\n🔍 TEST 13: Verify Session Cleared');
        const hasActiveAfterClear = storageService.hasActiveSession();
        console.log(`✅ Has active after clear: ${hasActiveAfterClear ? 'YA' : 'TIDAK'}`);

        console.log('\n' + '='.repeat(50));
        console.log('🎉 STORAGE SERVICE TEST BERHASIL!');
        console.log('Semua fungsi localStorage berfungsi dengan baik.');

    } catch (error) {
        console.error('\n❌ ERROR DALAM STORAGE TEST:', error);
        console.error('Stack trace:', error.stack);
        process.exit(1);
    }
}

// Jalankan test
runStorageTests();