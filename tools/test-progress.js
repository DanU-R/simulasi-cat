/**
 * Test Progress Service
 * Menguji fungsi tracking soal yang pernah dikerjakan
 */

const ProgressService = require('../src/progress-service.js');

// Mock localStorage untuk testing
global.localStorage = {
    data: {},
    getItem: function(key) {
        return this.data[key] || null;
    },
    setItem: function(key, value) {
        this.data[key] = value;
    },
    removeItem: function(key) {
        delete this.data[key];
    },
    clear: function() {
        this.data = {};
    }
};

// Mock console untuk testing
const originalConsole = console;
global.console = {
    log: (msg) => originalConsole.log(msg),
    error: (msg) => originalConsole.error(msg),
    warn: (msg) => originalConsole.warn(msg)
};

function createMockQuestions() {
    return [
        { id: 'TPK-BAH-001', kategori: 'TPK', subkategori: 'Bahasa' },
        { id: 'TPK-BAH-002', kategori: 'TPK', subkategori: 'Bahasa' },
        { id: 'TPK-HIT-001', kategori: 'TPK', subkategori: 'Hitungan' },
        { id: 'TPK-HIT-002', kategori: 'TPK', subkategori: 'Hitungan' },
        { id: 'TPK-PU-001', kategori: 'TPK', subkategori: 'Pengetahuan Umum' },
        { id: 'TMK-001', kategori: 'TMK', subkategori: 'Prinsip Koperasi' },
        { id: 'TMK-002', kategori: 'TMK', subkategori: 'Prinsip Koperasi' },
        { id: 'TMK-003', kategori: 'TMK', subkategori: 'Tata Kelola' }
    ];
}

function createMockSession(questionIds) {
    return {
        questions: questionIds.map(id => ({ id: id }))
    };
}

function runTests() {
    console.log('📊 MEMULAI PROGRESS SERVICE TEST');
    console.log('================================================');
    
    let testCount = 0;
    let passCount = 0;
    
    function test(name, testFn) {
        testCount++;
        try {
            // Clear localStorage before each test
            localStorage.clear();
            console.log(`🔍 TEST ${testCount}: ${name}`);
            testFn();
            passCount++;
            console.log(`✅ TEST ${testCount} BERHASIL: ${name}`);
        } catch (error) {
            console.log(`❌ TEST ${testCount} GAGAL: ${name}`);
            console.log(`   Error: ${error.message}`);
        }
        console.log('');
    }
    
    function assert(condition, message) {
        if (!condition) {
            throw new Error(message);
        }
    }
    
    // Clear localStorage sebelum test
    localStorage.clear();
    
    test('Progress Service Initialization', () => {
        const progressService = new ProgressService();
        assert(progressService instanceof ProgressService, 'ProgressService harus berhasil diinisialisasi');
        assert(progressService.getSeenCount() === 0, 'Progress awal harus kosong');
        console.log('✅ ProgressService berhasil diinisialisasi');
    });
    
    test('Mark Questions as Seen', () => {
        const progressService = new ProgressService();
        const questionIds = ['TPK-BAH-001', 'TPK-HIT-001', 'TMK-001'];
        
        const result = progressService.markQuestionsAsSeen(questionIds);
        assert(result === true, 'markQuestionsAsSeen harus return true');
        assert(progressService.getSeenCount() === 3, 'Jumlah seen harus 3');
        
        questionIds.forEach(id => {
            assert(progressService.isQuestionSeen(id), `Soal ${id} harus ditandai seen`);
        });
        
        console.log('✅ Mark questions as seen: BERHASIL');
        console.log(`   📊 Seen count: ${progressService.getSeenCount()}`);
    });
    
    test('Duplicate IDs Not Counted Twice', () => {
        const progressService = new ProgressService();
        
        // Mark pertama kali
        progressService.markQuestionsAsSeen(['TPK-BAH-001', 'TPK-HIT-001']);
        const firstCount = progressService.getSeenCount();
        
        // Mark lagi dengan ID yang sama
        const result = progressService.markQuestionsAsSeen(['TPK-BAH-001', 'TPK-HIT-001']);
        const secondCount = progressService.getSeenCount();
        
        assert(result === false, 'Duplikat ID tidak boleh menambah count');
        assert(firstCount === secondCount, 'Count harus tetap sama');
        assert(firstCount === 2, 'Count harus 2');
        
        console.log('✅ Duplicate handling: BERHASIL');
        console.log(`   📊 Count tetap: ${secondCount}`);
    });
    
    test('Mark Session Questions as Seen', () => {
        const progressService = new ProgressService();
        const session = createMockSession(['TPK-PU-001', 'TMK-002', 'TMK-003']);
        
        const result = progressService.markSessionQuestionsAsSeen(session);
        assert(result === true, 'markSessionQuestionsAsSeen harus berhasil');
        assert(progressService.getSeenCount() === 3, 'Jumlah seen harus 3');
        
        session.questions.forEach(q => {
            assert(progressService.isQuestionSeen(q.id), `Soal ${q.id} harus ditandai seen`);
        });
        
        console.log('✅ Mark session questions: BERHASIL');
        console.log(`   📊 Session questions marked: ${session.questions.length}`);
    });
    
    test('Get Seen Stats', () => {
        const progressService = new ProgressService();
        const mockQuestions = createMockQuestions();
        
        // Mark beberapa soal sebagai seen
        progressService.markQuestionsAsSeen(['TPK-BAH-001', 'TPK-HIT-001', 'TMK-001', 'TMK-002']);
        
        const stats = progressService.getSeenStats(mockQuestions);
        
        assert(stats.total === 8, 'Total soal harus 8');
        assert(stats.seen === 4, 'Seen soal harus 4');
        assert(stats.unseen === 4, 'Unseen soal harus 4');
        assert(stats.percentage === 50, 'Persentase harus 50%');
        
        assert(stats.tpk.total === 5, 'Total TPK harus 5');
        assert(stats.tpk.seen === 2, 'Seen TPK harus 2');
        assert(stats.tmk.total === 3, 'Total TMK harus 3');
        assert(stats.tmk.seen === 2, 'Seen TMK harus 2');
        
        console.log('✅ Stats calculation: BERHASIL');
        console.log(`   📊 Total: ${stats.total}, Seen: ${stats.seen}, Percentage: ${stats.percentage}%`);
        console.log(`   📘 TPK: ${stats.tpk.seen}/${stats.tpk.total}`);
        console.log(`   📕 TMK: ${stats.tmk.seen}/${stats.tmk.total}`);
    });
    
    test('Get Unseen Questions', () => {
        const progressService = new ProgressService();
        const mockQuestions = createMockQuestions();
        
        // Mark beberapa soal sebagai seen
        progressService.markQuestionsAsSeen(['TPK-BAH-001', 'TMK-001']);
        
        const unseenAll = progressService.getUnseenQuestions(mockQuestions);
        const unseenTPK = progressService.getUnseenQuestionsByCategory(mockQuestions, 'TPK');
        const unseenTMK = progressService.getUnseenQuestionsByCategory(mockQuestions, 'TMK');
        const unseenBahasa = progressService.getUnseenQuestionsBySubcategory(mockQuestions, 'Bahasa');
        
        assert(unseenAll.length === 6, 'Unseen all harus 6');
        assert(unseenTPK.length === 4, 'Unseen TPK harus 4');
        assert(unseenTMK.length === 2, 'Unseen TMK harus 2');
        assert(unseenBahasa.length === 1, 'Unseen Bahasa harus 1');
        
        console.log('✅ Get unseen questions: BERHASIL');
        console.log(`   📊 Unseen all: ${unseenAll.length}`);
        console.log(`   📘 Unseen TPK: ${unseenTPK.length}`);
        console.log(`   📕 Unseen TMK: ${unseenTMK.length}`);
        console.log(`   📝 Unseen Bahasa: ${unseenBahasa.length}`);
    });
    
    test('Reset Seen Progress', () => {
        const progressService = new ProgressService();
        
        // Mark beberapa soal sebagai seen
        progressService.markQuestionsAsSeen(['TPK-BAH-001', 'TPK-HIT-001', 'TMK-001']);
        assert(progressService.getSeenCount() === 3, 'Seen count harus 3 sebelum reset');
        
        const result = progressService.resetSeenProgress();
        assert(result === true, 'Reset harus berhasil');
        assert(progressService.getSeenCount() === 0, 'Seen count harus 0 setelah reset');
        
        console.log('✅ Reset progress: BERHASIL');
        console.log(`   📊 Count after reset: ${progressService.getSeenCount()}`);
    });
    
    test('Export Progress JSON', () => {
        const progressService = new ProgressService();
        
        // Mark beberapa soal sebagai seen
        progressService.markQuestionsAsSeen(['TPK-BAH-001', 'TPK-HIT-001', 'TMK-001']);
        
        const exportData = progressService.exportSeenProgressJSON();
        
        assert(exportData.version === '1.0', 'Version harus 1.0');
        assert(exportData.progress.total_seen_questions === 3, 'Total seen harus 3');
        assert(Array.isArray(exportData.progress.seen_question_ids), 'Seen IDs harus array');
        assert(exportData.progress.seen_question_ids.length === 3, 'Seen IDs length harus 3');
        assert(exportData.disclaimer, 'Disclaimer harus ada');
        assert(exportData.note, 'Note harus ada');
        
        // Pastikan tidak ada isi soal penuh
        const jsonString = JSON.stringify(exportData);
        assert(!jsonString.includes('pertanyaan'), 'Export tidak boleh berisi isi soal');
        assert(!jsonString.includes('pilihan_A'), 'Export tidak boleh berisi pilihan jawaban');
        
        console.log('✅ Export JSON: BERHASIL');
        console.log(`   📊 Export version: ${exportData.version}`);
        console.log(`   📊 Seen questions: ${exportData.progress.total_seen_questions}`);
        console.log(`   ✅ No full question content: YES`);
    });
    
    test('Storage Info', () => {
        const progressService = new ProgressService();
        
        // Mark beberapa soal sebagai seen
        progressService.markQuestionsAsSeen(['TPK-BAH-001', 'TPK-HIT-001']);
        
        const info = progressService.getStorageInfo();
        
        assert(typeof info.seenCount === 'number', 'seenCount harus number');
        assert(typeof info.bytes === 'number', 'bytes harus number');
        assert(typeof info.size === 'string', 'size harus string');
        assert(info.seenCount === 2, 'seenCount harus 2');
        assert(info.bytes > 0, 'bytes harus > 0');
        
        console.log('✅ Storage info: BERHASIL');
        console.log(`   📊 Seen count: ${info.seenCount}`);
        console.log(`   📊 Storage size: ${info.size}`);
    });
    
    test('Persistence Test', () => {
        // Test 1: Buat service dan mark questions
        const progressService1 = new ProgressService();
        progressService1.markQuestionsAsSeen(['TPK-BAH-001', 'TPK-HIT-001', 'TMK-001']);
        
        // Test 2: Buat service baru (simulasi reload)
        const progressService2 = new ProgressService();
        
        assert(progressService2.getSeenCount() === 3, 'Data harus persist setelah reload');
        assert(progressService2.isQuestionSeen('TPK-BAH-001'), 'TPK-BAH-001 harus tetap seen');
        assert(progressService2.isQuestionSeen('TMK-001'), 'TMK-001 harus tetap seen');
        
        console.log('✅ Persistence: BERHASIL');
        console.log(`   📊 Data persisted: ${progressService2.getSeenCount()} questions`);
    });
    
    test('Invalid Input Handling', () => {
        const progressService = new ProgressService();
        
        // Test invalid inputs
        const result1 = progressService.markQuestionsAsSeen(null);
        const result2 = progressService.markQuestionsAsSeen('not-array');
        const result3 = progressService.markSessionQuestionsAsSeen(null);
        const result4 = progressService.markSessionQuestionsAsSeen({});
        
        assert(result1 === false, 'Null input harus return false');
        assert(result2 === false, 'String input harus return false');
        assert(result3 === false, 'Null session harus return false');
        assert(result4 === false, 'Invalid session harus return false');
        
        const stats = progressService.getSeenStats(null);
        assert(stats.total === 0, 'Null questions harus return empty stats');
        
        const unseen = progressService.getUnseenQuestions(null);
        assert(Array.isArray(unseen) && unseen.length === 0, 'Null questions harus return empty array');
        
        console.log('✅ Invalid input handling: BERHASIL');
    });
    
    // Restore console
    global.console = originalConsole;
    
    console.log('================================================');
    console.log('📋 RINGKASAN TEST RESULTS:');
    
    for (let i = 1; i <= testCount; i++) {
        console.log(`   ${i <= passCount ? '✅ PASS' : '❌ FAIL'} Test ${i}`);
    }
    
    console.log('');
    console.log('================================================');
    
    if (passCount === testCount) {
        console.log('🎉 PROGRESS SERVICE TEST BERHASIL!');
        console.log('Semua fungsi progress tracking berfungsi dengan baik.');
    } else {
        console.log(`❌ ${testCount - passCount} dari ${testCount} test gagal.`);
        process.exit(1);
    }
}

// Jalankan tests
runTests();