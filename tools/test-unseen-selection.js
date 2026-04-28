/**
 * Test Unseen Question Selection
 * Menguji fungsi pemilihan soal berdasarkan status seen/unseen
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

// Mock QuestionService methods
class MockQuestionService {
    shuffleQuestions(questions) {
        // Simple shuffle for testing
        const shuffled = [...questions];
        for (let i = shuffled.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
        }
        return shuffled;
    }
    
    selectQuestions(questions, count) {
        return questions.slice(0, count);
    }
}

// Mock ModeConfigManager methods
class MockModeConfigManager {
    constructor() {
        this.progressService = null;
        this.questionService = new MockQuestionService();
        this.prioritizeUnseen = true;
    }
    
    initialize(questionService, progressService) {
        this.questionService = questionService || this.questionService;
        this.progressService = progressService;
    }
    
    setPrioritizeUnseen(prioritize) {
        this.prioritizeUnseen = prioritize;
    }
    
    selectQuestionsWithUnseenPriority(allQuestions, requestedCount) {
        if (!this.prioritizeUnseen || !this.progressService || !Array.isArray(allQuestions)) {
            const shuffled = this.questionService.shuffleQuestions(allQuestions);
            return {
                questions: this.questionService.selectQuestions(shuffled, requestedCount),
                messages: []
            };
        }

        try {
            const unseenQuestions = allQuestions.filter(q => !this.progressService.isQuestionSeen(q.id));
            
            let selectedQuestions = [];
            let messages = [];

            if (unseenQuestions.length >= requestedCount) {
                const shuffledUnseen = this.questionService.shuffleQuestions(unseenQuestions);
                selectedQuestions = this.questionService.selectQuestions(shuffledUnseen, requestedCount);
            } else if (unseenQuestions.length > 0) {
                const seenQuestions = allQuestions.filter(q => this.progressService.isQuestionSeen(q.id));
                const neededFromSeen = requestedCount - unseenQuestions.length;
                
                const shuffledSeen = this.questionService.shuffleQuestions(seenQuestions);
                const selectedSeen = this.questionService.selectQuestions(shuffledSeen, neededFromSeen);
                
                selectedQuestions = [...unseenQuestions, ...selectedSeen];
                selectedQuestions = this.questionService.shuffleQuestions(selectedQuestions);
                
                messages.push(`Soal belum pernah dikerjakan hanya tersedia ${unseenQuestions.length} dari ${requestedCount}. Sisanya akan diambil dari soal yang sudah pernah dikerjakan.`);
            } else {
                const shuffledAll = this.questionService.shuffleQuestions(allQuestions);
                selectedQuestions = this.questionService.selectQuestions(shuffledAll, requestedCount);
                
                messages.push('Semua soal pada subkategori ini sudah pernah dikerjakan. Latihan akan menggunakan soal lama.');
            }

            return {
                questions: selectedQuestions,
                messages: messages
            };
        } catch (error) {
            console.error('Error selecting questions with unseen priority:', error);
            const shuffled = this.questionService.shuffleQuestions(allQuestions);
            return {
                questions: this.questionService.selectQuestions(shuffled, requestedCount),
                messages: []
            };
        }
    }
}

function createMockQuestions() {
    return [
        { id: 'TPK-BAH-001', kategori: 'TPK', subkategori: 'Bahasa' },
        { id: 'TPK-BAH-002', kategori: 'TPK', subkategori: 'Bahasa' },
        { id: 'TPK-BAH-003', kategori: 'TPK', subkategori: 'Bahasa' },
        { id: 'TPK-BAH-004', kategori: 'TPK', subkategori: 'Bahasa' },
        { id: 'TPK-BAH-005', kategori: 'TPK', subkategori: 'Bahasa' },
        { id: 'TPK-BAH-006', kategori: 'TPK', subkategori: 'Bahasa' },
        { id: 'TPK-BAH-007', kategori: 'TPK', subkategori: 'Bahasa' },
        { id: 'TPK-BAH-008', kategori: 'TPK', subkategori: 'Bahasa' }
    ];
}

function runTests() {
    console.log('🧪 MEMULAI UNSEEN SELECTION TEST');
    console.log('================================================');
    
    let testCount = 0;
    let passCount = 0;
    
    function test(name, testFn) {
        testCount++;
        try {
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
    
    test('Initial State - All Questions Unseen', () => {
        const progressService = new ProgressService();
        const modeConfig = new MockModeConfigManager();
        modeConfig.initialize(null, progressService);
        
        const mockQuestions = createMockQuestions();
        const result = modeConfig.selectQuestionsWithUnseenPriority(mockQuestions, 5);
        
        assert(Array.isArray(result.questions), 'Result questions harus berupa array');
        assert(result.questions.length === 5, 'Harus memilih 5 soal');
        assert(Array.isArray(result.messages), 'Result messages harus berupa array');
        assert(result.messages.length === 0, 'Tidak boleh ada pesan jika semua soal unseen');
        
        console.log('✅ Semua soal dianggap unseen pada awal');
        console.log(`   📊 Selected: ${result.questions.length} soal`);
    });
    
    test('Partial Seen - Mix Unseen and Seen', () => {
        const progressService = new ProgressService();
        const modeConfig = new MockModeConfigManager();
        modeConfig.initialize(null, progressService);
        
        const mockQuestions = createMockQuestions();
        
        // Mark beberapa soal sebagai seen (lebih dari setengah)
        progressService.markQuestionsAsSeen(['TPK-BAH-001', 'TPK-BAH-002', 'TPK-BAH-003', 'TPK-BAH-004', 'TPK-BAH-005']);
        
        const result = modeConfig.selectQuestionsWithUnseenPriority(mockQuestions, 5);
        
        assert(Array.isArray(result.questions), 'Result questions harus berupa array');
        assert(result.questions.length === 5, 'Harus memilih 5 soal');
        
        // Sekarang hanya ada 3 unseen, tapi butuh 5, jadi harus ada campuran
        assert(result.messages.length === 1, 'Harus ada 1 pesan tentang campuran');
        assert(result.messages[0].includes('Sisanya akan diambil'), 'Pesan harus menyebutkan campuran');
        
        console.log('✅ Campuran unseen dan seen berhasil');
        console.log(`   💬 Pesan: ${result.messages[0]}`);
    });
    
    test('All Seen - Use Old Questions', () => {
        const progressService = new ProgressService();
        const modeConfig = new MockModeConfigManager();
        modeConfig.initialize(null, progressService);
        
        const mockQuestions = createMockQuestions();
        
        // Mark semua soal sebagai seen
        const allIds = mockQuestions.map(q => q.id);
        progressService.markQuestionsAsSeen(allIds);
        
        const result = modeConfig.selectQuestionsWithUnseenPriority(mockQuestions, 5);
        
        assert(Array.isArray(result.questions), 'Result questions harus berupa array');
        assert(result.questions.length === 5, 'Harus memilih 5 soal');
        assert(result.messages.length === 1, 'Harus ada pesan tentang semua soal seen');
        assert(result.messages[0].includes('sudah pernah dikerjakan'), 'Pesan harus menyebutkan semua sudah dikerjakan');
        
        console.log('✅ Semua soal seen, menggunakan soal lama');
        console.log(`   💬 Pesan: ${result.messages[0]}`);
    });
    
    test('Prioritize Unseen Disabled', () => {
        const progressService = new ProgressService();
        const modeConfig = new MockModeConfigManager();
        modeConfig.initialize(null, progressService);
        
        const mockQuestions = createMockQuestions();
        
        // Mark beberapa soal sebagai seen
        progressService.markQuestionsAsSeen(['TPK-BAH-001', 'TPK-BAH-002']);
        
        // Disable prioritize unseen
        modeConfig.setPrioritizeUnseen(false);
        
        const result = modeConfig.selectQuestionsWithUnseenPriority(mockQuestions, 5);
        
        assert(Array.isArray(result.questions), 'Result questions harus berupa array');
        assert(result.questions.length === 5, 'Harus memilih 5 soal');
        assert(result.messages.length === 0, 'Tidak boleh ada pesan jika prioritas nonaktif');
        
        console.log('✅ Prioritas unseen nonaktif, gunakan semua soal');
        console.log(`   📊 Selected: ${result.questions.length} soal`);
    });
    
    test('Enough Unseen Questions Available', () => {
        const progressService = new ProgressService();
        const modeConfig = new MockModeConfigManager();
        modeConfig.initialize(null, progressService);
        
        const mockQuestions = createMockQuestions();
        
        // Mark hanya 2 soal sebagai seen, sisanya unseen
        progressService.markQuestionsAsSeen(['TPK-BAH-001', 'TPK-BAH-002']);
        
        const result = modeConfig.selectQuestionsWithUnseenPriority(mockQuestions, 5);
        
        assert(Array.isArray(result.questions), 'Result questions harus berupa array');
        assert(result.questions.length === 5, 'Harus memilih 5 soal');
        assert(result.messages.length === 0, 'Tidak boleh ada pesan jika unseen cukup');
        
        // Semua yang dipilih harus unseen
        const selectedIds = result.questions.map(q => q.id);
        const allUnseen = selectedIds.every(id => !progressService.isQuestionSeen(id));
        assert(allUnseen, 'Semua soal yang dipilih harus unseen');
        
        console.log('✅ Cukup soal unseen, semua dipilih dari unseen');
        console.log(`   📊 All selected are unseen: ${allUnseen}`);
    });
    
    test('Empty Questions Array Handling', () => {
        const progressService = new ProgressService();
        const modeConfig = new MockModeConfigManager();
        modeConfig.initialize(null, progressService);
        
        const result = modeConfig.selectQuestionsWithUnseenPriority([], 5);
        
        assert(Array.isArray(result.questions), 'Result questions harus berupa array');
        assert(result.questions.length === 0, 'Harus return array kosong');
        assert(Array.isArray(result.messages), 'Result messages harus berupa array');
        
        console.log('✅ Array kosong ditangani dengan benar');
    });
    
    test('No Progress Service Fallback', () => {
        const modeConfig = new MockModeConfigManager();
        modeConfig.initialize(null, null); // No progress service
        
        const mockQuestions = createMockQuestions();
        const result = modeConfig.selectQuestionsWithUnseenPriority(mockQuestions, 5);
        
        assert(Array.isArray(result.questions), 'Result questions harus berupa array');
        assert(result.questions.length === 5, 'Harus memilih 5 soal');
        assert(result.messages.length === 0, 'Tidak boleh ada pesan tanpa progress service');
        
        console.log('✅ Fallback tanpa progress service berhasil');
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
        console.log('🎉 UNSEEN SELECTION TEST BERHASIL!');
        console.log('Semua fungsi pemilihan soal unseen berfungsi dengan baik.');
    } else {
        console.log(`❌ ${testCount - passCount} dari ${testCount} test gagal.`);
        process.exit(1);
    }
}

// Jalankan tests
runTests();