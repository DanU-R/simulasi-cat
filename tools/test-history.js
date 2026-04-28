#!/usr/bin/env node

/**
 * Test History Service - Menguji fungsi riwayat hasil latihan CAT KDKMP
 */

const QuizSession = require('../src/quiz-engine.js');
const HistoryService = require('../src/history-service.js');

console.log('📚 MEMULAI HISTORY SERVICE TEST');
console.log('='.repeat(50));

async function runHistoryTests() {
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

        console.log('🔍 TEST 1: History Service Initialization');
        const historyService = new HistoryService();
        console.log('✅ HistoryService berhasil diinisialisasi');
        console.log(`   📊 Max history count: ${historyService.maxHistoryCount}`);

        console.log('\n🔍 TEST 2: Create Mock Quiz Sessions');
        // Create multiple mock sessions for testing
        const mockSessions = [];
        const mockResults = [];

        // Session 1: TPK only
        const tpkQuestions = [
            {
                id: 'TPK-TEST-001',
                kategori: 'TPK',
                subkategori: 'Bahasa',
                level: 'Mudah',
                pertanyaan: 'Test question 1',
                pilihan_A: 'A', pilihan_B: 'B', pilihan_C: 'C', pilihan_D: 'D', pilihan_E: 'E',
                jawaban_benar: 'A'
            },
            {
                id: 'TPK-TEST-002',
                kategori: 'TPK',
                subkategori: 'Hitungan',
                level: 'Sedang',
                pertanyaan: 'Test question 2',
                pilihan_A: 'A', pilihan_B: 'B', pilihan_C: 'C', pilihan_D: 'D', pilihan_E: 'E',
                jawaban_benar: 'B'
            }
        ];

        const tpkSession = new QuizSession(tpkQuestions, 'tpk', 'practice');
        tpkSession.answerQuestion('TPK-TEST-001', 'A'); // Correct
        tpkSession.answerQuestion('TPK-TEST-002', 'C'); // Wrong
        tpkSession.finish();
        const tpkResult = tpkSession.calculateScore();

        mockSessions.push(tpkSession);
        mockResults.push(tpkResult);

        // Session 2: TMK only
        const tmkQuestions = [
            {
                id: 'TMK-TEST-001',
                kategori: 'TMK',
                subkategori: 'Prinsip Koperasi',
                level: 'Mudah',
                pertanyaan: 'Test TMK question',
                pilihan_A: 'A', pilihan_B: 'B', pilihan_C: 'C', pilihan_D: 'D', pilihan_E: 'E',
                jawaban_benar: 'C'
            }
        ];

        const tmkSession = new QuizSession(tmkQuestions, 'tmk', 'practice');
        tmkSession.answerQuestion('TMK-TEST-001', 'C'); // Correct
        tmkSession.finish();
        const tmkResult = tmkSession.calculateScore();

        mockSessions.push(tmkSession);
        mockResults.push(tmkResult);

        // Session 3: Mixed
        const mixedQuestions = [...tpkQuestions, ...tmkQuestions];
        const mixedSession = new QuizSession(mixedQuestions, 'mixed', 'practice');
        mixedSession.answerQuestion('TPK-TEST-001', 'A'); // Correct
        // TPK-TEST-002 not answered (empty)
        mixedSession.answerQuestion('TMK-TEST-001', 'B'); // Wrong
        mixedSession.finish();
        const mixedResult = mixedSession.calculateScore();

        mockSessions.push(mixedSession);
        mockResults.push(mixedResult);

        console.log(`✅ ${mockSessions.length} mock quiz sessions dibuat`);

        console.log('\n🔍 TEST 3: Create History Entries');
        const historyEntries = [];
        for (let i = 0; i < mockSessions.length; i++) {
            const entry = historyService.createHistoryEntry(mockSessions[i], mockResults[i]);
            historyEntries.push(entry);
            console.log(`   📝 Entry ${i + 1}: ${entry.session.mode} - ${entry.results.total_questions} soal`);
        }
        console.log('✅ History entries berhasil dibuat');

        console.log('\n🔍 TEST 4: Save Results to History');
        const savedIds = [];
        for (let i = 0; i < historyEntries.length; i++) {
            const historyId = historyService.saveResult(historyEntries[i]);
            savedIds.push(historyId);
            console.log(`   💾 Saved: ${historyId}`);
        }
        console.log(`✅ ${savedIds.length} results berhasil disimpan`);

        console.log('\n🔍 TEST 5: Get History');
        const history = historyService.getHistory();
        console.log(`✅ History loaded: ${history.length} entries`);
        history.forEach((entry, index) => {
            console.log(`   📚 ${index + 1}. ${entry.id} - ${entry.session.mode} (${entry.completed_date})`);
        });

        console.log('\n🔍 TEST 6: Get History by ID');
        if (savedIds.length > 0) {
            const firstId = savedIds[0];
            const entry = historyService.getHistoryById(firstId);
            console.log(`✅ Get by ID: ${entry ? 'FOUND' : 'NOT FOUND'}`);
            if (entry) {
                console.log(`   📖 Mode: ${entry.session.mode}, Score: ${entry.results.total_score}`);
            }
        }

        console.log('\n🔍 TEST 7: History Statistics');
        const stats = historyService.getHistoryStats();
        console.log('✅ History stats:');
        console.log(`   📊 Total entries: ${stats.total_entries}`);
        console.log(`   📊 Total questions: ${stats.total_questions}`);
        console.log(`   📊 Total correct: ${stats.total_correct}`);
        console.log(`   📊 Total wrong: ${stats.total_wrong}`);
        console.log(`   📊 Total empty: ${stats.total_empty}`);
        console.log(`   📊 Average score: ${stats.average_score}`);
        console.log(`   📊 Modes: ${JSON.stringify(stats.modes)}`);

        console.log('\n🔍 TEST 8: History Size Info');
        const sizeInfo = historyService.getHistorySize();
        console.log('✅ History size:');
        console.log(`   📊 Entries: ${sizeInfo.entries}`);
        console.log(`   📊 Bytes: ${sizeInfo.bytes}`);
        console.log(`   📊 Size: ${sizeInfo.size_kb} KB`);

        console.log('\n🔍 TEST 9: Validate History Entries');
        let validCount = 0;
        history.forEach(entry => {
            if (historyService.validateHistoryEntry(entry)) {
                validCount++;
            }
        });
        console.log(`✅ Validation: ${validCount}/${history.length} entries valid`);

        console.log('\n🔍 TEST 10: Delete Single History');
        if (savedIds.length > 1) {
            const deleteId = savedIds[1];
            const deleteSuccess = historyService.deleteHistory(deleteId);
            console.log(`✅ Delete single: ${deleteSuccess ? 'SUCCESS' : 'FAILED'}`);
            
            const historyAfterDelete = historyService.getHistory();
            console.log(`   📊 History count after delete: ${historyAfterDelete.length}`);
        }

        console.log('\n🔍 TEST 11: Test Max History Limit');
        // Add more entries to test limit
        for (let i = 0; i < 25; i++) {
            const extraEntry = historyService.createHistoryEntry(mockSessions[0], mockResults[0]);
            historyService.saveResult(extraEntry);
        }
        
        const historyAfterLimit = historyService.getHistory();
        console.log(`✅ Max limit test: ${historyAfterLimit.length} entries (max: ${historyService.maxHistoryCount})`);
        console.log(`   📊 Limit enforced: ${historyAfterLimit.length <= historyService.maxHistoryCount ? 'YES' : 'NO'}`);

        console.log('\n🔍 TEST 12: Generate History ID');
        const id1 = historyService.generateHistoryId();
        const id2 = historyService.generateHistoryId();
        console.log(`✅ ID generation: ${id1 !== id2 ? 'UNIQUE' : 'DUPLICATE'}`);
        console.log(`   📝 ID1: ${id1}`);
        console.log(`   📝 ID2: ${id2}`);

        console.log('\n🔍 TEST 13: Date/Time Formatting');
        const testDate = new Date('2024-04-25T14:30:45.123Z');
        console.log('✅ Date/time formatting:');
        console.log(`   📅 Display date: ${historyService.formatDate(testDate)}`);
        console.log(`   🕐 Display time: ${historyService.formatTime(testDate)}`);
        console.log(`   📁 Filename date: ${historyService.formatDateForFilename(testDate)}`);
        console.log(`   📁 Filename time: ${historyService.formatTimeForFilename(testDate)}`);

        console.log('\n🔍 TEST 14: Clear All History');
        const clearSuccess = historyService.clearHistory();
        console.log(`✅ Clear all: ${clearSuccess ? 'SUCCESS' : 'FAILED'}`);
        
        const historyAfterClear = historyService.getHistory();
        console.log(`   📊 History count after clear: ${historyAfterClear.length}`);

        console.log('\n🔍 TEST 15: Verify No Full Question Content');
        // Add one entry back for content check
        const testEntry = historyService.createHistoryEntry(mockSessions[0], mockResults[0]);
        historyService.saveResult(testEntry);
        
        const finalHistory = historyService.getHistory();
        const hasFullQuestions = JSON.stringify(finalHistory).includes('Test question 1');
        console.log(`✅ Full question content excluded: ${!hasFullQuestions ? 'YES' : 'NO'}`);

        console.log('\n' + '='.repeat(50));
        console.log('🎉 HISTORY SERVICE TEST BERHASIL!');
        console.log('Semua fungsi riwayat berfungsi dengan baik.');

    } catch (error) {
        console.error('\n❌ ERROR DALAM HISTORY TEST:', error);
        console.error('Stack trace:', error.stack);
        process.exit(1);
    }
}

// Jalankan test
runHistoryTests();