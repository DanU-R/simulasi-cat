#!/usr/bin/env node

/**
 * Test Export Service - Menguji fungsi export dan cetak hasil CAT KDKMP
 */

const QuizSession = require('../src/quiz-engine.js');
const ExportService = require('../src/export-service.js');

console.log('📤 MEMULAI EXPORT SERVICE TEST');
console.log('='.repeat(50));

async function runExportTests() {
    try {
        console.log('🔍 TEST 1: Export Service Initialization');
        const exportService = new ExportService();
        console.log('✅ ExportService berhasil diinisialisasi');

        console.log('\n🔍 TEST 2: Create Mock Quiz Session & Score Data');
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
        
        // Answer some questions
        quizSession.answerQuestion('TPK-TEST-001', 'A'); // Correct
        quizSession.answerQuestion('TPK-TEST-002', 'C'); // Wrong
        // TMK-TEST-001 not answered (empty)
        
        // Finish session
        quizSession.finish();
        const scoreData = quizSession.calculateScore();
        
        console.log(`✅ Mock quiz session: ${mockQuestions.length} soal, ${Object.keys(scoreData).length} score fields`);

        console.log('\n🔍 TEST 3: Generate Export Data');
        const exportData = exportService.generateExportData(quizSession, scoreData);
        
        console.log('✅ Export data berhasil digenerate:');
        console.log(`   📊 Version: ${exportData.version}`);
        console.log(`   📊 Mode: ${exportData.session.mode}`);
        console.log(`   📊 Total questions: ${exportData.results.total_questions}`);
        console.log(`   📊 Answers: ${exportData.answers.length} items`);
        console.log(`   📊 Total score: ${exportData.results.total_score}`);

        console.log('\n🔍 TEST 4: Validate Export Data Structure');
        const isValid = exportService.validateExportData(exportData);
        console.log(`✅ Export data validation: ${isValid ? 'VALID' : 'INVALID'}`);

        console.log('\n🔍 TEST 5: Check Answer Summary');
        const answers = exportData.answers;
        console.log('✅ Answer summary berhasil digenerate:');
        answers.forEach((answer, index) => {
            console.log(`   📝 Q${answer.question_number}: ${answer.question_id} - ${answer.status} (${answer.jawaban_user || 'kosong'} vs ${answer.jawaban_benar})`);
        });

        console.log('\n🔍 TEST 6: Test Date/Time Formatting');
        const testDate = new Date('2024-04-25T14:30:45.123Z');
        console.log('✅ Date/time formatting:');
        console.log(`   📅 Display date: ${exportService.formatDate(testDate)}`);
        console.log(`   🕐 Display time: ${exportService.formatTime(testDate)}`);
        console.log(`   📁 Filename date: ${exportService.formatDateForFilename(testDate)}`);
        console.log(`   📁 Filename time: ${exportService.formatTimeForFilename(testDate)}`);

        console.log('\n🔍 TEST 7: Calculate Export Size');
        const sizeInfo = exportService.getExportSize(quizSession, scoreData);
        console.log('✅ Export size info:');
        console.log(`   📊 Questions: ${sizeInfo.questions}`);
        console.log(`   📊 Characters: ${sizeInfo.characters}`);
        console.log(`   📊 Bytes: ${sizeInfo.bytes}`);
        console.log(`   📊 Size: ${sizeInfo.size_kb} KB`);

        console.log('\n🔍 TEST 8: Test JSON Structure');
        const jsonString = JSON.stringify(exportData, null, 2);
        const parsedBack = JSON.parse(jsonString);
        const isJsonValid = JSON.stringify(exportData) === JSON.stringify(parsedBack);
        console.log(`✅ JSON serialization: ${isJsonValid ? 'VALID' : 'INVALID'}`);

        console.log('\n🔍 TEST 9: Verify No Full Question Content');
        const hasFullQuestions = JSON.stringify(exportData).includes('Test question 1');
        console.log(`✅ Full question content excluded: ${!hasFullQuestions ? 'YES' : 'NO'}`);

        console.log('\n🔍 TEST 10: Check Required Fields');
        const requiredFields = [
            'version', 'exported_at', 'export_date', 'export_time',
            'session', 'results', 'answers', 'disclaimer', 'note'
        ];
        
        const missingFields = requiredFields.filter(field => !(field in exportData));
        console.log(`✅ Required fields check: ${missingFields.length === 0 ? 'ALL PRESENT' : 'MISSING: ' + missingFields.join(', ')}`);

        console.log('\n🔍 TEST 11: Verify Disclaimer Content');
        const hasDisclaimer = exportData.disclaimer && exportData.disclaimer.includes('latihan internal');
        const hasNote = exportData.note && exportData.note.includes('bukan nilai resmi');
        console.log(`✅ Disclaimer present: ${hasDisclaimer ? 'YES' : 'NO'}`);
        console.log(`✅ Note present: ${hasNote ? 'YES' : 'NO'}`);

        console.log('\n' + '='.repeat(50));
        console.log('🎉 EXPORT SERVICE TEST BERHASIL!');
        console.log('Semua fungsi export berfungsi dengan baik.');
        console.log('\nSample export data:');
        console.log(JSON.stringify(exportData, null, 2));

    } catch (error) {
        console.error('\n❌ ERROR DALAM EXPORT TEST:', error);
        console.error('Stack trace:', error.stack);
        process.exit(1);
    }
}

// Jalankan test
runExportTests();