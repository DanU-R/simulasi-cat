// Global variables
let modeConfigManager = null;
let activeQuizSession = null;
let storageService = null;
let historyService = null;
let progressService = null;

const AI_SUBCATEGORIES = {
    MIXED: [
        '',
        'Bahasa',
        'Hitungan',
        'Pengetahuan Umum',
        'Pola Gambar',
        'Abstraksi Ruang',
        'Bentuk/Menentukan Bentuk',
        'Prinsip Koperasi',
        'Tata Kelola',
        'Pengelolaan Usaha',
        'Pengelolaan Keuangan',
        'Pelayanan Anggota',
        'Pengembangan Kelembagaan'
    ],
    TPK: [
        '',
        'Bahasa',
        'Hitungan',
        'Pengetahuan Umum',
        'Pola Gambar',
        'Abstraksi Ruang',
        'Bentuk/Menentukan Bentuk'
    ],
    TMK: [
        '',
        'Prinsip Koperasi',
        'Tata Kelola',
        'Pengelolaan Usaha',
        'Pengelolaan Keuangan',
        'Pelayanan Anggota',
        'Pengembangan Kelembagaan'
    ]
};

class QuestionBankLoader {
    constructor() {
        this.loadedData = {};
        this.errors = [];
        this.totalTPK = 0;
        this.totalTMK = 0;
        this.totalQuestions = 0;
        this.isLoadingComplete = false;
    }

    async loadAllFiles() {
        console.log('🔄 Memulai loading bank soal...');
        
        // Define file configuration locally
        const fileConfig = {
            'tpk_bahasa': {
                path: 'data/questions/tpk_bahasa.json',
                name: 'TPK Bahasa/Verbal',
                target: 15,
                kategori: 'TPK'
            },
            'tpk_hitungan': {
                path: 'data/questions/tpk_hitungan.json',
                name: 'TPK Hitungan/Numerik',
                target: 20,
                kategori: 'TPK'
            },
            'tpk_pengetahuan_umum': {
                path: 'data/questions/tpk_pengetahuan_umum.json',
                name: 'TPK Pengetahuan Umum',
                target: 15,
                kategori: 'TPK'
            },
            'tpk_pola_gambar': {
                path: 'data/questions/tpk_pola_gambar.json',
                name: 'TPK Pola Gambar',
                target: 15,
                kategori: 'TPK'
            },
            'tpk_abstraksi_ruang': {
                path: 'data/questions/tpk_abstraksi_ruang.json',
                name: 'TPK Abstraksi Ruang',
                target: 10,
                kategori: 'TPK'
            },
            'tpk_bentuk': {
                path: 'data/questions/tpk_bentuk.json',
                name: 'TPK Bentuk/Menentukan Bentuk',
                target: 10,
                kategori: 'TPK'
            },
            'tmk': {
                path: 'data/questions/tmk.json',
                name: 'TMK',
                target: 20,
                kategori: 'TMK'
            }
        };
        
        const loadPromises = Object.entries(fileConfig).map(([key, config]) => 
            this.loadFile(key, config)
        );

        try {
            await Promise.all(loadPromises);
            this.calculateTotals();
            this.displayResults();
        } catch (error) {
            console.error('❌ Error loading files:', error);
            this.displayErrors();
        }
    }

    async loadFile(key, config) {
        try {
            console.log(`📁 Loading ${config.name}...`);
            
            const response = await fetch(config.path);
            
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            const data = await response.json();
            
            // Validasi dasar
            if (!Array.isArray(data)) {
                throw new Error('Data bukan array');
            }

            if (data.length !== config.target) {
                console.warn(`⚠️ ${config.name}: Jumlah soal ${data.length}, target ${config.target}`);
            }

            this.loadedData[key] = {
                ...config,
                data: data,
                count: data.length,
                status: 'success'
            };

            console.log(`✅ ${config.name}: ${data.length} soal berhasil dimuat`);

        } catch (error) {
            console.error(`❌ Error loading ${config.name}:`, error);
            
            this.errors.push({
                file: config.name,
                path: config.path,
                error: error.message
            });

            this.loadedData[key] = {
                ...config,
                data: [],
                count: 0,
                status: 'error',
                error: error.message
            };
        }
    }

    calculateTotals() {
        this.totalTPK = 0;
        this.totalTMK = 0;
        this.totalQuestions = 0;

        Object.values(this.loadedData).forEach(item => {
            if (item.status === 'success') {
                if (item.kategori === 'TPK') {
                    this.totalTPK += item.count;
                } else if (item.kategori === 'TMK') {
                    this.totalTMK += item.count;
                }
                this.totalQuestions += item.count;
            }
        });

        console.log(`📊 Total TPK: ${this.totalTPK}, TMK: ${this.totalTMK}, Keseluruhan: ${this.totalQuestions}`);
    }

    displayResults() {
        // Update loading status to show success
        const loadingStatus = document.getElementById('loading-status');
        loadingStatus.className = 'loading-status loaded';
        loadingStatus.innerHTML = `
            <p><strong>✅ Bank soal berhasil dimuat: ${this.totalQuestions} soal</strong></p>
        `;
        
        if (this.errors.length > 0) {
            this.displayErrors();
        } else {
            // Tampilkan summary jika semua berhasil
            document.getElementById('summary-section').style.display = 'block';
            this.renderSummaryCards();
            this.renderTotalSummary();
            
            // Tampilkan progress section
            setTimeout(() => {
                if (typeof renderProgressSection === 'function') {
                    renderProgressSection();
                }
            }, 100);
            
            // Tampilkan mode selection setelah loading berhasil
            this.isLoadingComplete = true;
            this.showModeSelection();
        }
    }

    displayErrors() {
        document.getElementById('loading-status').style.display = 'none';
        document.getElementById('error-section').style.display = 'block';
        
        const errorDetails = document.getElementById('error-details');
        errorDetails.innerHTML = `
            <h3>Ditemukan ${this.errors.length} error saat loading:</h3>
            ${this.errors.map(error => `
                <div class="error-item">
                    <strong>${error.file}</strong><br>
                    <small>File: ${error.path}</small><br>
                    Error: ${error.error}
                </div>
            `).join('')}
        `;

        // Tetap tampilkan summary untuk file yang berhasil
        if (Object.values(this.loadedData).some(item => item.status === 'success')) {
            document.getElementById('summary-section').style.display = 'block';
            this.renderSummaryCards();
            this.renderTotalSummary();
            
            // Tampilkan progress section
            setTimeout(() => {
                if (typeof renderProgressSection === 'function') {
                    renderProgressSection();
                }
            }, 100);
            
            // Tampilkan mode selection meskipun ada error (jika ada file yang berhasil)
            this.isLoadingComplete = true;
            this.showModeSelection();
        }
    }

    renderSummaryCards() {
        const summaryGrid = document.getElementById('summary-grid');
        
        // Define the correct order for cards
        const cardOrder = [
            'tpk_bahasa',
            'tpk_hitungan', 
            'tpk_pengetahuan_umum',
            'tpk_pola_gambar',
            'tpk_abstraksi_ruang',
            'tpk_bentuk',
            'tmk'
        ];
        
        summaryGrid.innerHTML = cardOrder.map(key => {
            const item = this.loadedData[key];
            if (!item) return '';
            
            return `
                <div class="summary-card ${item.kategori.toLowerCase()}">
                    <h3>${item.name}</h3>
                    <div class="count">${item.count}</div>
                    <div class="label">${item.count} soal</div>
                    <div class="status ${item.status}">
                        ${item.status === 'success' ? 
                            `Berhasil dimuat` : 
                            `Error: ${item.error}`
                        }
                    </div>
                </div>
            `;
        }).filter(card => card !== '').join('');
    }

    renderTotalSummary() {
        const totalSummary = document.getElementById('total-summary');
        
        totalSummary.innerHTML = `
            <h3>Ringkasan Total</h3>
            <div class="total-grid">
                <div class="total-item">
                    <span class="number">${this.totalTPK}</span>
                    <span class="label">Total TPK</span>
                </div>
                <div class="total-item">
                    <span class="number">${this.totalTMK}</span>
                    <span class="label">Total TMK</span>
                </div>
                <div class="total-item">
                    <span class="number">${this.totalQuestions}</span>
                    <span class="label">Total Keseluruhan</span>
                </div>
            </div>
        `;
    }

    // Method untuk mendapatkan data yang sudah dimuat (untuk penggunaan selanjutnya)
    getLoadedData() {
        return this.loadedData;
    }

    // Method untuk mendapatkan soal berdasarkan kategori
    getQuestionsByCategory(category) {
        return Object.values(this.loadedData)
            .filter(item => item.kategori === category && item.status === 'success')
            .flatMap(item => item.data);
    }

    // Method untuk mendapatkan soal berdasarkan subkategori
    getQuestionsBySubcategory(subcategory) {
        return Object.values(this.loadedData)
            .filter(item => item.status === 'success')
            .flatMap(item => item.data)
            .filter(question => question.subkategori === subcategory);
    }

    // Method untuk menampilkan mode selection
    showModeSelection() {
        if (this.isLoadingComplete) {
            document.getElementById('mode-selection-section').style.display = 'block';
            console.log('🎯 Mode selection ditampilkan');
        }
    }
}

// Event Listeners dan Initialization
document.addEventListener('DOMContentLoaded', async () => {
    console.log('🚀 Aplikasi CAT KDKMP dimulai');
    
    // Inisialisasi loader
    window.questionLoader = new QuestionBankLoader();
    
    // Mulai loading
    await window.questionLoader.loadAllFiles();
    
    // Setup validation button
    setupValidationButton();
    setupLandingPanelAnchors();
    
    // Inisialisasi quiz engine components (jika tersedia)
    initializeQuizEngine();
    
    // Inisialisasi mode selection
    initializeModeSelection();
    
    // Inisialisasi storage service
    initializeStorageService();
    
    // Inisialisasi history service
    initializeHistoryService();
    
    // Inisialisasi progress service
    initializeProgressService();
});

function initializeQuizEngine() {
    try {
        // Cek apakah QuestionService dan QuizSession tersedia
        if (typeof QuestionService !== 'undefined' && typeof QuizSession !== 'undefined') {
            console.log('🎯 Quiz Engine components tersedia');
            
            // Inisialisasi question service untuk quiz engine
            window.questionService = new QuestionService();
            
            // Tambahkan utility functions untuk quiz
            window.quizUtils = {
                createTPKQuiz: async (count = 10) => {
                    try {
                        if (!window.questionService.isQuestionBanksLoaded()) {
                            await window.questionService.loadQuestionBanks();
                        }
                        const tpkQuestions = window.questionService.getTPKQuestions();
                        const shuffled = window.questionService.shuffleQuestions(tpkQuestions);
                        const selected = window.questionService.selectQuestions(shuffled, count);
                        return new QuizSession(selected, 'tpk', 'practice');
                    } catch (error) {
                        console.error('Error creating TPK quiz:', error);
                        return null;
                    }
                },
                createTMKQuiz: async (count = 10) => {
                    try {
                        if (!window.questionService.isQuestionBanksLoaded()) {
                            await window.questionService.loadQuestionBanks();
                        }
                        const tmkQuestions = window.questionService.getTMKQuestions();
                        const shuffled = window.questionService.shuffleQuestions(tmkQuestions);
                        const selected = window.questionService.selectQuestions(shuffled, count);
                        return new QuizSession(selected, 'tmk', 'practice');
                    } catch (error) {
                        console.error('Error creating TMK quiz:', error);
                        return null;
                    }
                },
                createMixedQuiz: async (tpkCount = 10, tmkCount = 5) => {
                    try {
                        if (!window.questionService.isQuestionBanksLoaded()) {
                            await window.questionService.loadQuestionBanks();
                        }
                        const tpkQuestions = window.questionService.getTPKQuestions();
                        const tmkQuestions = window.questionService.getTMKQuestions();
                        
                        const selectedTPK = window.questionService.selectQuestions(
                            window.questionService.shuffleQuestions(tpkQuestions), tpkCount
                        );
                        const selectedTMK = window.questionService.selectQuestions(
                            window.questionService.shuffleQuestions(tmkQuestions), tmkCount
                        );
                        
                        const mixed = [...selectedTPK, ...selectedTMK];
                        const shuffled = window.questionService.shuffleQuestions(mixed);
                        
                        return new QuizSession(shuffled, 'mixed', 'practice');
                    } catch (error) {
                        console.error('Error creating mixed quiz:', error);
                        return null;
                    }
                }
            };
            
            console.log('💡 Quiz utilities tersedia di window.quizUtils');
        } else {
            console.log('ℹ️ Quiz Engine components belum dimuat (normal untuk mode latihan)');
        }
    } catch (error) {
        console.warn('⚠️ Error initializing quiz engine:', error);
    }
}

function setupValidationButton() {
    const validationBtn = document.getElementById('validation-btn');
    if (!validationBtn) return;
    
    validationBtn.addEventListener('click', () => {
        showToast('Jalankan npm run validate:questions dari direktori root project. Alternatif langsung: node tools/validate-questions.js', 'info', 'Instruksi Validasi');
    });
}

function setupLandingPanelAnchors() {
    const openPanelFromHash = () => {
        const hash = window.location.hash.replace('#', '');
        if (!hash) return;

        const target = document.getElementById(hash);
        if (target && target.tagName.toLowerCase() === 'details') {
            target.open = true;
        }
    };

    window.addEventListener('hashchange', openPanelFromHash);
    openPanelFromHash();
}

// Utility functions untuk debugging
window.debugQuestionBank = {
    getLoader: () => window.questionLoader,
    getTPKQuestions: () => window.questionLoader?.getQuestionsByCategory('TPK') || [],
    getTMKQuestions: () => window.questionLoader?.getQuestionsByCategory('TMK') || [],
    getAllQuestions: () => {
        const loader = window.questionLoader;
        if (!loader) return [];
        return [...loader.getQuestionsByCategory('TPK'), ...loader.getQuestionsByCategory('TMK')];
    },
    getStats: () => {
        const loader = window.questionLoader;
        if (!loader) return null;
        return {
            totalTPK: loader.totalTPK,
            totalTMK: loader.totalTMK,
            totalQuestions: loader.totalQuestions,
            errors: loader.errors,
            loadedFiles: Object.keys(loader.loadedData).length
        };
    }
};

console.log('💡 Debug tools tersedia di window.debugQuestionBank');

// Mode Selection Functions
function initializeModeSelection() {
    try {
        if (typeof ModeConfigManager !== 'undefined') {
            modeConfigManager = new ModeConfigManager();
            console.log('🎛️ Mode Config Manager diinisialisasi');
            
            // Render mode cards
            renderModeCards();
            
            // Setup event listeners
            setupModeSelectionEvents();
            
            // Setup history events
            setupHistoryEvents();
        }
    } catch (error) {
        console.error('Error initializing mode selection:', error);
    }
}

function renderModeCards() {
    const modeGrid = document.getElementById('mode-grid');
    if (!modeGrid || !modeConfigManager) return;

    const modes = modeConfigManager.getAvailableModes();
    
    modeGrid.innerHTML = modes.map(mode => `
        <div class="mode-card" data-mode-id="${mode.id}">
            <span class="icon">${mode.icon}</span>
            <h3>${mode.name}</h3>
            <p>${mode.description}</p>
        </div>
    `).join('');
}

function setupModeSelectionEvents() {
    // Mode card click events
    document.addEventListener('click', (e) => {
        const modeCard = e.target.closest('.mode-card');
        if (modeCard) {
            const modeId = modeCard.dataset.modeId;
            selectMode(modeId);
        }
    });

    // Back to modes button
    const backBtn = document.getElementById('back-to-modes-btn');
    if (backBtn) {
        backBtn.addEventListener('click', () => {
            showModeSelection();
        });
    }
}

function selectMode(modeId) {
    try {
        const mode = modeConfigManager.selectMode(modeId);
        
        // Update UI
        document.querySelectorAll('.mode-card').forEach(card => {
            card.classList.remove('selected');
        });
        document.querySelector(`[data-mode-id="${modeId}"]`).classList.add('selected');
        
        // Show configuration panel
        showConfigurationPanel(mode);
        
    } catch (error) {
        console.error('Error selecting mode:', error);
        showError('Error memilih mode: ' + error.message);
    }
}

function showConfigurationPanel(mode) {
    const configSection = document.getElementById('config-section');
    const configPanel = document.getElementById('config-panel');
    
    if (!configSection || !configPanel) return;

    let configHTML = `
        <div class="config-group">
            <h3>Mode: ${mode.name}</h3>
            <p>${mode.description}</p>
        </div>
    `;

    // Subcategory selection for Latihan Bebas TPK
    if (mode.allowSubcategorySelection) {
        const subcategories = modeConfigManager.getTPKSubcategories();
        configHTML += `
            <div class="config-group">
                <label>Pilih Subkategori TPK:</label>
                <div class="subcategory-grid">
                    ${subcategories.map(sub => `
                        <div class="subcategory-option" data-subcategory-id="${sub.id}">
                            <h4>${sub.name}</h4>
                            <p>${sub.description}</p>
                            <div class="count">Maks: ${sub.maxQuestions} soal</div>
                        </div>
                    `).join('')}
                </div>
                
                <div id="subcategory-info" class="subcategory-info" style="display: none;">
                    <!-- Info soal akan ditampilkan setelah memilih subkategori -->
                </div>
                
                <div id="unseen-priority-section" class="unseen-priority-section" style="display: none;">
                    <div class="unseen-priority-card">
                        <div class="priority-header">
                            <span class="priority-icon">📊</span>
                            <span class="priority-title">Opsi Soal Belum Dikerjakan</span>
                        </div>
                        <label class="priority-checkbox-label">
                            <input type="checkbox" id="prioritize-unseen" checked>
                            <span class="priority-text">Prioritaskan soal yang belum pernah dikerjakan</span>
                        </label>
                        <div class="priority-description">
                            Jika diaktifkan, latihan akan mengutamakan soal yang belum pernah Anda kerjakan sebelumnya.
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    // Question count input
    if (mode.allowCustomCount) {
        configHTML += `
            <div class="config-group">
                <label for="question-count">Jumlah Soal:</label>
                <input type="number" id="question-count" min="1" max="${mode.maxCount || 85}" value="${mode.defaultCount}">
                <small>Maksimal: <span id="max-count-display">${mode.maxCount || 85}</span> soal</small>
            </div>
        `;
    } else {
        configHTML += `
            <div class="config-group">
                <label>Jumlah Soal:</label>
                <p><strong>${mode.defaultCount} soal</strong> (tetap)</p>
            </div>
        `;
    }

    // Timer configuration
    const defaultDuration = modeConfigManager.getDefaultDuration();
    configHTML += `
        <div class="config-group">
            <label>Durasi Latihan:</label>
            <div class="duration-config">
                <div class="duration-default">
                    <strong>Default: ${defaultDuration} menit</strong>
                    <small>(${mode.id === 'latihan-bebas-tpk' ? '1 menit per soal' : 'durasi standar'})</small>
                </div>

                ${mode.allowNoTimer ? `
                    <label class="checkbox-label no-timer-option">
                        <input type="checkbox" id="use-no-timer">
                        <span>Latihan santai tanpa batas waktu</span>
                    </label>
                    <small class="duration-hint">Cocok untuk belajar materi dan membaca pembahasan tanpa tekanan timer.</small>
                ` : ''}
                
                ${mode.allowCustomDuration ? `
                    <div class="custom-duration-option">
                        <label class="checkbox-label">
                            <input type="checkbox" id="use-custom-duration">
                            <span>Gunakan durasi custom</span>
                        </label>
                        <div id="custom-duration-input" class="custom-duration-input" style="display: none;">
                            <input type="number" id="custom-duration" min="1" max="180" value="${defaultDuration}">
                            <span>menit (1-180 menit)</span>
                        </div>
                    </div>
                ` : ''}
            </div>
        </div>
    `;

    configHTML += `
        <div class="config-actions">
            <button id="start-session-btn" class="btn-primary" disabled>Mulai Latihan</button>
        </div>
        <div id="config-error" class="error-message" style="display: none;"></div>
    `;

    configPanel.innerHTML = configHTML;
    hideLandingOnlySections();
    configSection.style.display = 'block';

    // Setup configuration events
    setupConfigurationEvents(mode);
}

function setupConfigurationEvents(mode) {
    // Subcategory selection
    document.addEventListener('click', (e) => {
        const subcategoryOption = e.target.closest('.subcategory-option');
        if (subcategoryOption) {
            const subcategoryId = subcategoryOption.dataset.subcategoryId;
            selectSubcategory(subcategoryId);
        }
    });

    // Question count input
    const questionCountInput = document.getElementById('question-count');
    if (questionCountInput) {
        questionCountInput.addEventListener('input', (e) => {
            const count = parseInt(e.target.value);
            updateQuestionCount(count);
        });
    }

    // Prioritize unseen checkbox
    const prioritizeUnseenCheckbox = document.getElementById('prioritize-unseen');
    if (prioritizeUnseenCheckbox) {
        prioritizeUnseenCheckbox.addEventListener('change', (e) => {
            const prioritize = e.target.checked;
            updatePrioritizeUnseen(prioritize);
        });
    }

    // Custom duration checkbox
    const useCustomDurationCheckbox = document.getElementById('use-custom-duration');
    if (useCustomDurationCheckbox) {
        useCustomDurationCheckbox.addEventListener('change', (e) => {
            const useCustom = e.target.checked;
            toggleCustomDuration(useCustom);
        });
    }

    // No timer checkbox
    const useNoTimerCheckbox = document.getElementById('use-no-timer');
    if (useNoTimerCheckbox) {
        useNoTimerCheckbox.addEventListener('change', (e) => {
            toggleNoTimer(e.target.checked);
        });
    }

    // Custom duration input
    const customDurationInput = document.getElementById('custom-duration');
    if (customDurationInput) {
        customDurationInput.addEventListener('input', (e) => {
            const duration = parseInt(e.target.value);
            updateCustomDuration(duration);
        });
    }

    // Start session button
    const startBtn = document.getElementById('start-session-btn');
    if (startBtn) {
        startBtn.addEventListener('click', createAndStartSession);
    }

    // Initial validation
    validateConfiguration();
}

function selectSubcategory(subcategoryId) {
    try {
        const subcategory = modeConfigManager.selectSubcategory(subcategoryId);
        
        // Update UI
        document.querySelectorAll('.subcategory-option').forEach(option => {
            option.classList.remove('selected');
        });
        document.querySelector(`[data-subcategory-id="${subcategoryId}"]`).classList.add('selected');
        
        // Update max count
        const maxCountDisplay = document.getElementById('max-count-display');
        const questionCountInput = document.getElementById('question-count');
        
        if (maxCountDisplay) {
            maxCountDisplay.textContent = subcategory.maxQuestions;
        }
        
        if (questionCountInput) {
            questionCountInput.max = subcategory.maxQuestions;
            if (parseInt(questionCountInput.value) > subcategory.maxQuestions) {
                questionCountInput.value = subcategory.maxQuestions;
                modeConfigManager.setQuestionCount(subcategory.maxQuestions);
            }
        }
        
        // Show subcategory info
        updateSubcategoryInfo(subcategory);
        
        validateConfiguration();
        
    } catch (error) {
        console.error('Error selecting subcategory:', error);
        showConfigError('Error memilih subkategori: ' + error.message);
    }
}

function updateSubcategoryInfo(subcategory) {
    const subcategoryInfoDiv = document.getElementById('subcategory-info');
    const unseenPrioritySection = document.getElementById('unseen-priority-section');
    
    if (!subcategoryInfoDiv || !subcategory) return;
    
    try {
        const subcategoryValue = subcategory.value || subcategory.id;
        const questionInfo = modeConfigManager.getSubcategoryQuestionInfo(subcategoryValue);
        
        subcategoryInfoDiv.innerHTML = `
            <div class="subcategory-stats-card">
                <div class="stats-header">
                    <span class="stats-icon">📊</span>
                    <span class="stats-title">Informasi Soal ${subcategory.name}</span>
                </div>
                <div class="stats-grid">
                    <div class="stat-item total">
                        <span class="stat-number">${questionInfo.total}</span>
                        <span class="stat-label">Total soal subkategori</span>
                    </div>
                    <div class="stat-item unseen">
                        <span class="stat-number">${questionInfo.unseen}</span>
                        <span class="stat-label">Belum pernah dikerjakan</span>
                    </div>
                    <div class="stat-item seen">
                        <span class="stat-number">${questionInfo.seen}</span>
                        <span class="stat-label">Pernah dikerjakan</span>
                    </div>
                </div>
            </div>
        `;
        
        // Show both subcategory info and unseen priority section
        subcategoryInfoDiv.style.display = 'block';
        if (unseenPrioritySection) {
            unseenPrioritySection.style.display = 'block';
        }
        
    } catch (error) {
        console.error('Error updating subcategory info:', error);
        subcategoryInfoDiv.style.display = 'none';
        if (unseenPrioritySection) {
            unseenPrioritySection.style.display = 'none';
        }
    }
}

function updatePrioritizeUnseen(prioritize) {
    try {
        modeConfigManager.setPrioritizeUnseen(prioritize);
        console.log(`📊 Prioritas soal belum dikerjakan: ${prioritize ? 'aktif' : 'nonaktif'}`);
    } catch (error) {
        console.error('Error updating prioritize unseen:', error);
        showConfigError('Error mengatur prioritas soal: ' + error.message);
    }
}

function updateQuestionCount(count) {
    try {
        modeConfigManager.setQuestionCount(count);
        validateConfiguration();
    } catch (error) {
        console.error('Error updating question count:', error);
        showConfigError('Error mengatur jumlah soal: ' + error.message);
    }
}

function toggleCustomDuration(useCustom) {
    try {
        modeConfigManager.setUseCustomDuration(useCustom);
        
        const customDurationInput = document.getElementById('custom-duration-input');
        if (customDurationInput) {
            customDurationInput.style.display = useCustom ? 'block' : 'none';
        }
        
        if (!useCustom) {
            // Reset to default duration
            const defaultDuration = modeConfigManager.getDefaultDuration();
            const customDurationField = document.getElementById('custom-duration');
            if (customDurationField) {
                customDurationField.value = defaultDuration;
            }
        }

        const useNoTimerCheckbox = document.getElementById('use-no-timer');
        if (useCustom && useNoTimerCheckbox) {
            useNoTimerCheckbox.checked = false;
        }
        
        validateConfiguration();
    } catch (error) {
        console.error('Error toggling custom duration:', error);
        showConfigError('Error mengatur durasi custom: ' + error.message);
    }
}

function toggleNoTimer(useNoTimer) {
    try {
        modeConfigManager.setUseNoTimer(useNoTimer);

        const useCustomDurationCheckbox = document.getElementById('use-custom-duration');
        const customDurationInput = document.getElementById('custom-duration-input');

        if (useCustomDurationCheckbox) {
            useCustomDurationCheckbox.checked = false;
            useCustomDurationCheckbox.disabled = useNoTimer;
        }

        if (customDurationInput) {
            customDurationInput.style.display = 'none';
        }

        validateConfiguration();
    } catch (error) {
        console.error('Error toggling no timer:', error);
        showConfigError('Error mengatur latihan tanpa waktu: ' + error.message);
    }
}

function updateCustomDuration(duration) {
    try {
        modeConfigManager.setCustomDuration(duration);
        validateConfiguration();
    } catch (error) {
        console.error('Error updating custom duration:', error);
        showConfigError('Error mengatur durasi: ' + error.message);
    }
}

function validateConfiguration() {
    const validation = modeConfigManager.validateConfiguration();
    const startBtn = document.getElementById('start-session-btn');
    const errorDiv = document.getElementById('config-error');
    
    if (validation.isValid) {
        if (startBtn) startBtn.disabled = false;
        if (errorDiv) errorDiv.style.display = 'none';
    } else {
        if (startBtn) startBtn.disabled = true;
        showConfigError(validation.errors.join(', '));
    }
}

function showConfigError(message) {
    const errorDiv = document.getElementById('config-error');
    if (errorDiv) {
        errorDiv.textContent = message;
        errorDiv.style.display = 'block';
    }
}

async function createAndStartSession() {
    try {
        const startBtn = document.getElementById('start-session-btn');
        if (startBtn) {
            startBtn.disabled = true;
            startBtn.textContent = 'Membuat Sesi...';
        }

        // Initialize question service if needed
        if (!modeConfigManager.questionService) {
            if (window.questionService) {
                modeConfigManager.initialize(window.questionService, progressService);
            } else {
                // Create new question service
                const questionService = new QuestionService();
                await questionService.loadQuestionBanks();
                modeConfigManager.initialize(questionService, progressService);
            }
        }

        // Create quiz session
        activeQuizSession = await modeConfigManager.createQuizSession();
        window.activeQuizSession = activeQuizSession;
        
        // Show session summary
        showSessionSummary();
        
    } catch (error) {
        console.error('Error creating session:', error);
        showConfigError('Error membuat sesi: ' + error.message);
        
        const startBtn = document.getElementById('start-session-btn');
        if (startBtn) {
            startBtn.disabled = false;
            startBtn.textContent = 'Mulai Latihan';
        }
    }
}

function showSessionSummary() {
    const summary = modeConfigManager.getConfigurationSummary();
    if (!summary) return;

    const sessionSummarySection = document.getElementById('session-summary-section');
    const sessionSummaryDiv = document.getElementById('session-summary');
    
    if (!sessionSummarySection || !sessionSummaryDiv) return;

    let summaryHTML = `
        <div class="success-message">
            Sesi berhasil dibuat. Klik "Mulai Pengerjaan" untuk memulai quiz.
        </div>
        <h3>Ringkasan Sesi</h3>
        <div class="summary-item">
            <span class="summary-label">Mode:</span>
            <span class="summary-value">${summary.mode}</span>
        </div>
        <div class="summary-item">
            <span class="summary-label">Jumlah Soal:</span>
            <span class="summary-value">${summary.questionCount} soal</span>
        </div>
        <div class="summary-item">
            <span class="summary-label">Scoring Type:</span>
            <span class="summary-value">${summary.scoringType}</span>
        </div>
        <div class="summary-item">
            <span class="summary-label">Durasi:</span>
            <span class="summary-value">${summary.useNoTimer ? 'Tanpa batas waktu' : `${summary.durationMinutes} menit${summary.useCustomDuration ? ' (custom)' : ' (default)'}`}</span>
        </div>
    `;

    if (summary.subcategory) {
        summaryHTML += `
            <div class="summary-item">
                <span class="summary-label">Subkategori:</span>
                <span class="summary-value">${summary.subcategory}</span>
            </div>
        `;
    }

    if (summary.tpkCount && summary.tmkCount) {
        summaryHTML += `
            <div class="summary-item">
                <span class="summary-label">Total TPK:</span>
                <span class="summary-value">${summary.tpkCount} soal</span>
            </div>
            <div class="summary-item">
                <span class="summary-label">Total TMK:</span>
                <span class="summary-value">${summary.tmkCount} soal</span>
            </div>
        `;
    }

    sessionSummaryDiv.innerHTML = summaryHTML;

    // Update session actions to include start quiz button
    const sessionActionsDiv = document.querySelector('#session-summary-section .session-actions');
    if (sessionActionsDiv) {
        sessionActionsDiv.innerHTML = `
            <button id="start-quiz-btn" class="btn-primary">Mulai Pengerjaan</button>
            <button id="back-to-modes-btn" class="btn-secondary">Kembali ke Pilihan Mode</button>
        `;

        // Setup start quiz button
        const startQuizBtn = document.getElementById('start-quiz-btn');
        if (startQuizBtn) {
            startQuizBtn.addEventListener('click', startQuizFromSession);
        }

        const backToModesBtn = document.getElementById('back-to-modes-btn');
        if (backToModesBtn) {
            backToModesBtn.addEventListener('click', showModeSelection);
        }
    }

    // Hide other sections and show summary
    hideLandingOnlySections();
    document.getElementById('mode-selection-section').style.display = 'none';
    document.getElementById('config-section').style.display = 'none';
    sessionSummarySection.style.display = 'block';

    console.log('🎉 Session summary ditampilkan');
}

function showModeSelection() {
    // Reset configuration
    if (modeConfigManager) {
        modeConfigManager.reset();
    }
    
    // Reset UI
    document.querySelectorAll('.mode-card').forEach(card => {
        card.classList.remove('selected');
    });
    
    // Hide history sections
    hideHistorySection();
    
    // Show landing sections
    showLandingSections();
    
    // Scroll to mode selection or top
    const modeSelectionSection = document.getElementById('mode-selection-section');
    if (modeSelectionSection) {
        modeSelectionSection.scrollIntoView({ behavior: 'smooth' });
    } else {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }
    
    console.log('🔄 Kembali ke mode selection');
}

function showError(message) {
    console.error(message);
    showToast(message, 'error');
}

function showToast(message, type = 'info', title = '') {
    const container = getToastContainer();
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;

    const toastTitle = title || getToastTitle(type);
    toast.innerHTML = `
        <div class="toast-icon" aria-hidden="true">${getToastIcon(type)}</div>
        <div class="toast-body">
            <strong>${toastTitle}</strong>
            <span>${escapeHtml(message)}</span>
        </div>
        <button type="button" class="toast-close" aria-label="Tutup notifikasi">x</button>
    `;

    const closeToast = () => {
        toast.classList.add('toast-leaving');
        setTimeout(() => toast.remove(), 180);
    };

    toast.querySelector('.toast-close').addEventListener('click', closeToast);
    container.appendChild(toast);
    requestAnimationFrame(() => toast.classList.add('toast-visible'));
    setTimeout(closeToast, type === 'error' ? 7000 : 4800);
}

function getToastContainer() {
    let container = document.getElementById('toast-container');
    if (!container) {
        container = document.createElement('div');
        container.id = 'toast-container';
        container.className = 'toast-container';
        container.setAttribute('aria-live', 'polite');
        container.setAttribute('aria-atomic', 'true');
        document.body.appendChild(container);
    }
    return container;
}

function getToastTitle(type) {
    if (type === 'success') return 'Berhasil';
    if (type === 'error') return 'Terjadi kendala';
    if (type === 'warning') return 'Perhatian';
    return 'Informasi';
}

function getToastIcon(type) {
    if (type === 'success') return '✓';
    if (type === 'error') return '!';
    if (type === 'warning') return '!';
    return 'i';
}

function escapeHtml(value) {
    return String(value)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}

function showConfirmDialog({
    title = 'Konfirmasi',
    message = 'Lanjutkan tindakan ini?',
    confirmText = 'Lanjutkan',
    cancelText = 'Batal',
    variant = 'danger'
} = {}) {
    const modal = document.getElementById('confirm-modal');
    const titleEl = document.getElementById('confirm-title');
    const messageEl = document.getElementById('confirm-message');
    const iconEl = document.getElementById('confirm-icon');
    const acceptBtn = document.getElementById('confirm-accept-btn');
    const cancelBtn = document.getElementById('confirm-cancel-btn');

    if (!modal || !titleEl || !messageEl || !acceptBtn || !cancelBtn) {
        return Promise.resolve(false);
    }

    titleEl.textContent = title;
    messageEl.textContent = message;
    acceptBtn.textContent = confirmText;
    cancelBtn.textContent = cancelText;
    iconEl.textContent = variant === 'danger' ? '!' : '?';

    modal.classList.remove('confirm-danger', 'confirm-info');
    modal.classList.add(variant === 'danger' ? 'confirm-danger' : 'confirm-info');
    modal.classList.add('is-open');
    modal.setAttribute('aria-hidden', 'false');

    return new Promise(resolve => {
        let settled = false;

        const cleanup = result => {
            if (settled) return;
            settled = true;
            modal.classList.remove('is-open');
            modal.setAttribute('aria-hidden', 'true');
            acceptBtn.removeEventListener('click', onAccept);
            cancelBtn.removeEventListener('click', onCancel);
            modal.removeEventListener('click', onBackdrop);
            document.removeEventListener('keydown', onKeydown);
            resolve(result);
        };

        const onAccept = () => cleanup(true);
        const onCancel = () => cleanup(false);
        const onBackdrop = event => {
            if (event.target?.dataset?.confirmAction === 'cancel') {
                cleanup(false);
            }
        };
        const onKeydown = event => {
            if (event.key === 'Escape') cleanup(false);
        };

        acceptBtn.addEventListener('click', onAccept);
        cancelBtn.addEventListener('click', onCancel);
        modal.addEventListener('click', onBackdrop);
        document.addEventListener('keydown', onKeydown);
        setTimeout(() => cancelBtn.focus(), 0);
    });
}

function startQuizFromSession() {
    try {
        if (!activeQuizSession) {
            throw new Error('Tidak ada sesi quiz aktif');
        }

        if (typeof startQuizUI !== 'function') {
            throw new Error('Quiz UI belum dimuat');
        }

        // Start quiz UI
        startQuizUI(activeQuizSession);
        
        console.log('🎮 Quiz UI dimulai dari session');
        
    } catch (error) {
        console.error('Error starting quiz UI:', error);
        showError('Error memulai quiz: ' + error.message);
    }
}

// Storage Service Functions
function initializeStorageService() {
    try {
        if (typeof StorageService !== 'undefined') {
            storageService = new StorageService();
            window.storageService = storageService;
            console.log('💾 Storage Service diinisialisasi');
            
            // Cek apakah ada sesi aktif
            checkForActiveSession();
        }
    } catch (error) {
        console.error('Error initializing storage service:', error);
    }
}

function checkForActiveSession() {
    try {
        if (!storageService || !storageService.hasActiveSession()) {
            return;
        }

        const sessionInfo = storageService.getSessionInfo();
        if (!sessionInfo) {
            return;
        }

        console.log('📂 Sesi aktif ditemukan:', sessionInfo);
        showSessionRestorePanel(sessionInfo);
        
    } catch (error) {
        console.error('Error checking active session:', error);
        // Clear corrupted session
        if (storageService) {
            storageService.clearSession();
        }
    }
}

function showSessionRestorePanel(sessionInfo) {
    const restoreSection = document.getElementById('session-restore-section');
    const restorePanel = document.getElementById('restore-panel');
    
    if (!restoreSection || !restorePanel) return;

    const timeRemainingText = sessionInfo.hasTimer ? 
        ` (sisa waktu: ${Math.floor(sessionInfo.timeRemaining / 60)}:${(sessionInfo.timeRemaining % 60).toString().padStart(2, '0')})` : 
        '';

    restorePanel.innerHTML = `
        <div class="restore-info">
            <div class="restore-message">
                <h3>Ada sesi latihan yang belum selesai</h3>
                <p>Ditemukan sesi latihan yang dapat dilanjutkan:</p>
            </div>
            
            <div class="session-details">
                <div class="detail-item">
                    <span class="label">Mode:</span>
                    <span class="value">${sessionInfo.mode}</span>
                </div>
                <div class="detail-item">
                    <span class="label">Soal:</span>
                    <span class="value">${sessionInfo.currentIndex + 1}/${sessionInfo.totalQuestions}</span>
                </div>
                <div class="detail-item">
                    <span class="label">Terjawab:</span>
                    <span class="value">${sessionInfo.answeredCount} soal</span>
                </div>
                <div class="detail-item">
                    <span class="label">Waktu:</span>
                    <span class="value">${new Date(sessionInfo.timestamp).toLocaleString()}${timeRemainingText}</span>
                </div>
            </div>
        </div>
        
        <div class="restore-actions">
            <button id="continue-session-btn" class="btn-primary">Lanjutkan Sesi</button>
            <button id="delete-session-btn" class="btn-secondary">Hapus Sesi</button>
        </div>
    `;

    // Setup event listeners
    setTimeout(() => {
        const continueBtn = document.getElementById('continue-session-btn');
        const deleteBtn = document.getElementById('delete-session-btn');
        
        if (continueBtn) {
            continueBtn.addEventListener('click', continueStoredSession);
        }
        
        if (deleteBtn) {
            deleteBtn.addEventListener('click', deleteStoredSession);
        }
    }, 100);

    // Hide other sections and show restore panel
    document.getElementById('mode-selection-section').style.display = 'none';
    document.getElementById('summary-section').style.display = 'none';
    restoreSection.style.display = 'block';
}

async function continueStoredSession() {
    try {
        const continueBtn = document.getElementById('continue-session-btn');
        if (continueBtn) {
            continueBtn.disabled = true;
            continueBtn.textContent = 'Memuat Sesi...';
        }

        // Load session data
        const sessionData = storageService.loadSession();
        if (!sessionData) {
            throw new Error('Data sesi tidak ditemukan');
        }

        // Initialize question service if needed
        if (!window.questionService) {
            window.questionService = new QuestionService();
        }

        // Reconstruct session
        activeQuizSession = await storageService.reconstructSession(sessionData, window.questionService);
        window.activeQuizSession = activeQuizSession;

        // Hide restore panel
        document.getElementById('session-restore-section').style.display = 'none';

        // Start quiz UI directly
        if (typeof startQuizUI === 'function') {
            startQuizUI(activeQuizSession);
        } else {
            throw new Error('Quiz UI tidak tersedia');
        }

        console.log('✅ Sesi berhasil dilanjutkan');
        
    } catch (error) {
        console.error('Error continuing session:', error);
        showError('Error melanjutkan sesi: ' + error.message + '\n\nSilakan hapus sesi dan mulai ulang.');
        
        // Reset button
        const continueBtn = document.getElementById('continue-session-btn');
        if (continueBtn) {
            continueBtn.disabled = false;
            continueBtn.textContent = 'Lanjutkan Sesi';
        }
    }
}

function deleteStoredSession() {
    if (confirm('Hapus sesi latihan yang tersimpan? Progres akan hilang dan tidak dapat dikembalikan.')) {
        try {
            storageService.clearSession();
            
            // Hide restore panel and show mode selection
            document.getElementById('session-restore-section').style.display = 'none';
            showModeSelection();
            
            console.log('🗑️ Sesi tersimpan dihapus');
            
        } catch (error) {
            console.error('Error deleting session:', error);
            showError('Error menghapus sesi: ' + error.message);
        }
    }
}

// History Service Functions
function initializeHistoryService() {
    try {
        if (typeof HistoryService !== 'undefined') {
            historyService = new HistoryService();
            window.historyService = historyService;
            console.log('📚 History Service diinisialisasi');
        }
    } catch (error) {
        console.error('Error initializing history service:', error);
    }
}

function setupHistoryEvents() {
    // History button
    const historyBtn = document.getElementById('history-btn');
    if (historyBtn) {
        historyBtn.addEventListener('click', showHistorySection);
    }

    // Back from history
    const backFromHistoryBtn = document.getElementById('back-from-history-btn');
    if (backFromHistoryBtn) {
        backFromHistoryBtn.addEventListener('click', () => {
            hideHistorySection();
            showLandingSections();
            
            // Scroll to mode selection
            const modeSelectionSection = document.getElementById('mode-selection-section');
            if (modeSelectionSection) {
                modeSelectionSection.scrollIntoView({ behavior: 'smooth' });
            } else {
                window.scrollTo({ top: 0, behavior: 'smooth' });
            }
            
            console.log('🔙 Kembali ke beranda dari riwayat');
        });
    }

    // Download history
    const downloadHistoryBtn = document.getElementById('download-history-btn');
    if (downloadHistoryBtn) {
        downloadHistoryBtn.addEventListener('click', downloadHistory);
    }

    // Clear all history
    const clearAllHistoryBtn = document.getElementById('clear-all-history-btn');
    if (clearAllHistoryBtn) {
        clearAllHistoryBtn.addEventListener('click', clearAllHistory);
    }

    // Back to history from detail
    const backToHistoryBtn = document.getElementById('back-to-history-btn');
    if (backToHistoryBtn) {
        backToHistoryBtn.addEventListener('click', () => {
            showHistorySection();
        });
    }

    // Delete this history
    const deleteThisHistoryBtn = document.getElementById('delete-this-history-btn');
    if (deleteThisHistoryBtn) {
        deleteThisHistoryBtn.addEventListener('click', deleteCurrentHistory);
    }

    console.log('📚 History events berhasil disetup');
}

function showHistorySection() {
    try {
        if (!historyService) {
            showError('History service tidak tersedia');
            return;
        }

        // Hide all landing sections
        hideLandingSections();

        // Show history section
        document.getElementById('history-section').style.display = 'block';

        // Render history content
        renderHistoryStats();
        renderHistoryList();

        // Scroll to top
        window.scrollTo(0, 0);

        console.log('📚 History section ditampilkan');

    } catch (error) {
        console.error('Error showing history section:', error);
        showError('Error menampilkan riwayat: ' + error.message);
    }
}

// Helper function to hide all landing sections
function hideLandingSections() {
    const landingSections = [
        'loading-section',
        'study-guide-section',
        'mode-selection-section',
        'config-section',
        'session-summary-section',
        'summary-section',
        'progress-section',
        'validation-section',
        'error-section',
        'session-restore-section'
    ];

    landingSections.forEach(sectionClass => {
        const section = document.querySelector(`.${sectionClass}`);
        if (section) {
            section.style.display = 'none';
        }
    });
}

// Helper function to show landing sections
function showLandingSections() {
    // Show main landing sections
    const insightStrip = document.querySelector('.insight-strip');
    const loadingSection = document.querySelector('.loading-section');
    const studyGuideSection = document.querySelector('.study-guide-section');
    const modeSelectionSection = document.getElementById('mode-selection-section');
    const summarySection = document.getElementById('summary-section');
    const validationSection = document.querySelector('.validation-section');

    if (insightStrip) showSectionElement(insightStrip, '');
    if (loadingSection) showSectionElement(loadingSection);
    if (studyGuideSection) showSectionElement(studyGuideSection);
    if (modeSelectionSection) showSectionElement(modeSelectionSection);
    if (summarySection) showSectionElement(summarySection);
    if (validationSection) showSectionElement(validationSection);

    // Keep these hidden until user interaction
    const configSection = document.getElementById('config-section');
    const sessionSummarySection = document.getElementById('session-summary-section');
    const errorSection = document.getElementById('error-section');
    const sessionRestoreSection = document.getElementById('session-restore-section');

    if (configSection) configSection.style.display = 'none';
    if (sessionSummarySection) sessionSummarySection.style.display = 'none';
    if (errorSection) errorSection.style.display = 'none';
    if (sessionRestoreSection) sessionRestoreSection.style.display = 'none';
}

function hideLandingOnlySections() {
    const landingOnlySelectors = [
        '.insight-strip',
        '.loading-section',
        '.study-guide-section',
        '#summary-section',
        '#progress-section',
        '#validation-section'
    ];

    landingOnlySelectors.forEach(selector => {
        const section = document.querySelector(selector);
        if (section) {
            hideSectionElement(section);
        }
    });
}

function showSectionElement(section, display = 'block') {
    section.hidden = false;
    section.removeAttribute('aria-hidden');
    section.style.display = display;
}

function hideSectionElement(section) {
    section.hidden = true;
    section.setAttribute('aria-hidden', 'true');
    section.style.display = 'none';
}

// Helper function to hide history section
function hideHistorySection() {
    const historySection = document.getElementById('history-section');
    const historyDetailSection = document.getElementById('history-detail-section');
    
    if (historySection) historySection.style.display = 'none';
    if (historyDetailSection) historyDetailSection.style.display = 'none';
}

function renderHistoryStats() {
    const statsElement = document.getElementById('history-stats');
    if (!statsElement || !historyService) return;

    const stats = historyService.getHistoryStats();
    const size = historyService.getHistorySize();

    if (!stats) {
        statsElement.innerHTML = '<p>Error memuat statistik riwayat</p>';
        return;
    }

    if (stats.total_entries === 0) {
        statsElement.innerHTML = `
            <div class="stats-empty">
                <p>📝 Belum ada riwayat latihan</p>
                <small>Selesaikan latihan untuk melihat riwayat</small>
            </div>
        `;
        return;
    }

    const modesList = Object.entries(stats.modes)
        .map(([mode, count]) => `${mode}: ${count}x`)
        .join(', ');

    statsElement.innerHTML = `
        <div class="stats-grid">
            <div class="stat-item">
                <span class="stat-number">${stats.total_entries}</span>
                <span class="stat-label">Total Latihan</span>
            </div>
            <div class="stat-item">
                <span class="stat-number">${stats.total_questions}</span>
                <span class="stat-label">Total Soal</span>
            </div>
            <div class="stat-item">
                <span class="stat-number">${stats.total_correct}</span>
                <span class="stat-label">Total Benar</span>
            </div>
            <div class="stat-item">
                <span class="stat-number">${stats.average_score}</span>
                <span class="stat-label">Rata-rata Skor</span>
            </div>
        </div>
        <div class="stats-details">
            <p><strong>Mode:</strong> ${modesList}</p>
            <p><strong>Storage:</strong> ${size.entries} entries, ${size.size_kb} KB</p>
        </div>
    `;
}

function renderHistoryList() {
    const listElement = document.getElementById('history-list');
    if (!listElement || !historyService) return;

    const history = historyService.getHistory();

    if (history.length === 0) {
        listElement.innerHTML = `
            <div class="history-empty">
                <p>📝 Belum ada riwayat latihan</p>
                <p>Selesaikan latihan untuk melihat riwayat di sini</p>
            </div>
        `;
        return;
    }

    listElement.innerHTML = history.map(entry => {
        const hasTPK = entry.results.tpk_details.total > 0;
        const hasTMK = entry.results.tmk_details.total > 0;
        const isMixed = hasTPK && hasTMK;

        let modeDisplay = entry.session.mode;
        if (isMixed) {
            modeDisplay = 'Mixed (TPK + TMK)';
        }

        const duration = entry.session.duration_seconds;
        const durationText = duration > 0 ? `${Math.floor(duration / 60)}:${(duration % 60).toString().padStart(2, '0')}` : '-';

        return `
            <div class="history-item" data-history-id="${entry.id}">
                <div class="history-item-header">
                    <div class="history-date">
                        <span class="date">${entry.completed_date}</span>
                        <span class="time">${entry.completed_time}</span>
                    </div>
                    <div class="history-mode">${modeDisplay}</div>
                </div>
                <div class="history-item-content">
                    <div class="history-summary">
                        <div class="summary-item">
                            <span class="label">Soal:</span>
                            <span class="value">${entry.results.total_questions}</span>
                        </div>
                        <div class="summary-item">
                            <span class="label">Skor:</span>
                            <span class="value">${entry.results.total_score}</span>
                        </div>
                        <div class="summary-item">
                            <span class="label">Benar:</span>
                            <span class="value correct">${entry.results.tpk_details.correct + entry.results.tmk_details.correct}</span>
                        </div>
                        <div class="summary-item">
                            <span class="label">Salah:</span>
                            <span class="value wrong">${entry.results.tpk_details.wrong + entry.results.tmk_details.wrong}</span>
                        </div>
                        <div class="summary-item">
                            <span class="label">Kosong:</span>
                            <span class="value empty">${entry.results.unanswered_count}</span>
                        </div>
                        <div class="summary-item">
                            <span class="label">Durasi:</span>
                            <span class="value">${durationText}</span>
                        </div>
                    </div>
                </div>
                <div class="history-item-actions">
                    <button class="btn-primary btn-small view-detail-btn" data-history-id="${entry.id}">
                        👁️ Lihat Detail Ringkas
                    </button>
                    <button class="btn-danger btn-small delete-history-btn" data-history-id="${entry.id}">
                        🗑️ Hapus
                    </button>
                </div>
            </div>
        `;
    }).join('');

    // Setup event listeners for history items
    setupHistoryItemEvents();
}

function setupHistoryItemEvents() {
    // View detail buttons
    document.querySelectorAll('.view-detail-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const historyId = e.target.dataset.historyId;
            showHistoryDetail(historyId);
        });
    });

    // Delete buttons
    document.querySelectorAll('.delete-history-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const historyId = e.target.dataset.historyId;
            deleteHistory(historyId);
        });
    });
}

function showHistoryDetail(historyId) {
    try {
        if (!historyService) {
            showError('History service tidak tersedia');
            return;
        }

        const entry = historyService.getHistoryById(historyId);
        if (!entry) {
            showError('Riwayat tidak ditemukan');
            return;
        }

        // Hide history list, show detail
        document.getElementById('history-section').style.display = 'none';
        document.getElementById('history-detail-section').style.display = 'block';

        // Store current history ID for delete action
        window.currentHistoryId = historyId;

        // Render detail
        renderHistoryDetail(entry);

        console.log('📖 History detail ditampilkan:', historyId);

    } catch (error) {
        console.error('Error showing history detail:', error);
        showError('Error menampilkan detail riwayat: ' + error.message);
    }
}

function renderHistoryDetail(entry) {
    const contentElement = document.getElementById('history-detail-content');
    if (!contentElement) return;

    const hasTPK = entry.results.tpk_details.total > 0;
    const hasTMK = entry.results.tmk_details.total > 0;
    const isMixed = hasTPK && hasTMK;

    let modeDisplay = entry.session.mode;
    if (isMixed) {
        modeDisplay = 'Mixed (TPK + TMK)';
    }

    const duration = entry.session.duration_seconds;
    const durationText = duration > 0 ? `${Math.floor(duration / 60)} menit ${duration % 60} detik` : 'Tidak tercatat';

    contentElement.innerHTML = `
        <div class="history-detail-header">
            <div class="detail-header-content">
                <h3>Detail Riwayat Latihan</h3>
                <button id="back-to-history-from-detail" class="btn-secondary detail-back-btn">← Kembali ke Riwayat</button>
            </div>
            <div class="detail-meta">
                <div class="meta-item">
                    <span class="meta-label">Mode:</span>
                    <span class="meta-value">${modeDisplay}</span>
                </div>
                <div class="meta-item">
                    <span class="meta-label">Tanggal:</span>
                    <span class="meta-value">${entry.completed_date} ${entry.completed_time}</span>
                </div>
                <div class="meta-item">
                    <span class="meta-label">Durasi:</span>
                    <span class="meta-value">${durationText}</span>
                </div>
            </div>
            <div class="detail-disclaimer">
                ${entry.disclaimer}
            </div>
        </div>

        <div class="detail-summary">
            <h4>Ringkasan Hasil</h4>
            <div class="summary-cards-grid">
                <div class="summary-card">
                    <div class="card-number">${entry.results.total_questions}</div>
                    <div class="card-label">Total Soal</div>
                </div>
                <div class="summary-card correct">
                    <div class="card-number">${entry.results.tpk_details.correct + entry.results.tmk_details.correct}</div>
                    <div class="card-label">Benar</div>
                </div>
                <div class="summary-card wrong">
                    <div class="card-number">${entry.results.tpk_details.wrong + entry.results.tmk_details.wrong}</div>
                    <div class="card-label">Salah</div>
                </div>
                <div class="summary-card empty">
                    <div class="card-number">${entry.results.unanswered_count}</div>
                    <div class="card-label">Kosong</div>
                </div>
                <div class="summary-card total">
                    <div class="card-number">${entry.results.total_score}</div>
                    <div class="card-label">Skor Total</div>
                </div>
            </div>
        </div>

        ${renderScoreBreakdown(entry.results, isMixed)}

        <div class="detail-answers">
            <h4>Ringkasan Jawaban</h4>
            <div class="answers-cards">
                ${renderAnswersCards(entry.answers)}
            </div>
        </div>
    `;

    // Setup event listener for back button
    const backBtn = document.getElementById('back-to-history-from-detail');
    if (backBtn) {
        backBtn.addEventListener('click', () => {
            showHistorySection();
        });
    }
}

function renderScoreBreakdown(results, isMixed) {
    if (isMixed) {
        return `
            <div class="score-breakdown">
                <h4>Skor TPK/TMK</h4>
                <div class="score-cards-grid">
                    <div class="score-card tpk">
                        <div class="score-header">Skor TPK</div>
                        <div class="score-value">${results.tpk_score}</div>
                        <div class="score-detail">${results.tpk_details.correct}/${results.tpk_details.total} benar</div>
                    </div>
                    <div class="score-card tmk">
                        <div class="score-header">Skor TMK</div>
                        <div class="score-value">${results.tmk_score}</div>
                        <div class="score-detail">${results.tmk_details.correct}/${results.tmk_details.total} benar</div>
                    </div>
                    <div class="score-card total">
                        <div class="score-header">Skor Gabungan</div>
                        <div class="score-value">${results.total_score}</div>
                        <div class="score-detail">Total Keseluruhan</div>
                    </div>
                </div>
            </div>
        `;
    } else {
        const isTPK = results.tpk_details.total > 0;
        const details = isTPK ? results.tpk_details : results.tmk_details;
        const score = isTPK ? results.tpk_score : results.tmk_score;
        
        return `
            <div class="score-breakdown">
                <h4>Skor ${isTPK ? 'TPK' : 'TMK'}</h4>
                <div class="score-cards-grid single">
                    <div class="score-card ${isTPK ? 'tpk' : 'tmk'}">
                        <div class="score-header">Skor ${isTPK ? 'TPK' : 'TMK'}</div>
                        <div class="score-value large">${score}</div>
                        <div class="score-detail">${details.correct}/${details.total} benar</div>
                    </div>
                </div>
            </div>
        `;
    }
}

function renderAnswersCards(answers) {
    return answers.map((answer, index) => {
        const statusClass = answer.status.toLowerCase();
        const statusText = answer.status.toUpperCase();
        const statusBadgeClass = statusClass === 'benar' ? 'correct' : statusClass === 'salah' ? 'wrong' : 'empty';
        
        return `
            <div class="answer-card">
                <div class="answer-card-header">
                    <div class="answer-number">Q${answer.question_number}</div>
                    <div class="answer-id">${answer.question_id}</div>
                    <div class="answer-status-badge ${statusBadgeClass}">${statusText}</div>
                </div>
                <div class="answer-card-content">
                    <div class="answer-meta">
                        <span class="answer-category">${answer.kategori}</span>
                        <span class="answer-separator">•</span>
                        <span class="answer-subcategory">${answer.subkategori}</span>
                        <span class="answer-separator">•</span>
                        <span class="answer-level">${answer.level}</span>
                    </div>
                    <div class="answer-details">
                        <div class="answer-row">
                            <span class="answer-label">Jawaban Anda:</span>
                            <span class="answer-value ${answer.is_answered ? 'answered' : 'not-answered'}">
                                ${answer.is_answered ? answer.jawaban_user : 'Tidak dijawab'}
                            </span>
                        </div>
                        <div class="answer-row">
                            <span class="answer-label">Jawaban Benar:</span>
                            <span class="answer-value correct-answer">${answer.jawaban_benar}</span>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }).join('');
}

function renderAnswersList(answers) {
    return answers.map(answer => `
        <div class="answer-item ${answer.status}">
            <div class="answer-number">Q${answer.question_number}</div>
            <div class="answer-info">
                <div class="answer-id">${answer.question_id}</div>
                <div class="answer-category">${answer.kategori} - ${answer.subkategori}</div>
                <div class="answer-level">${answer.level}</div>
            </div>
            <div class="answer-result">
                <div class="answer-status status-${answer.status}">${answer.status.toUpperCase()}</div>
                <div class="answer-details">
                    ${answer.is_answered ? 
                        `Jawaban: ${answer.jawaban_user} | Benar: ${answer.jawaban_benar}` : 
                        `Tidak dijawab | Benar: ${answer.jawaban_benar}`
                    }
                </div>
            </div>
        </div>
    `).join('');
}

function deleteHistory(historyId) {
    if (!historyService) {
        showError('History service tidak tersedia');
        return;
    }

    if (confirm('Hapus riwayat latihan ini?\n\nRiwayat yang dihapus tidak dapat dikembalikan.')) {
        try {
            const success = historyService.deleteHistory(historyId);
            if (success) {
                // Refresh history list
                renderHistoryList();
                renderHistoryStats();
                console.log('🗑️ Riwayat dihapus:', historyId);
            } else {
                showError('Gagal menghapus riwayat');
            }
        } catch (error) {
            console.error('Error deleting history:', error);
            showError('Error menghapus riwayat: ' + error.message);
        }
    }
}

function deleteCurrentHistory() {
    if (window.currentHistoryId) {
        if (confirm('Hapus riwayat latihan ini?\n\nRiwayat yang dihapus tidak dapat dikembalikan.')) {
            try {
                const success = historyService.deleteHistory(window.currentHistoryId);
                if (success) {
                    // Go back to history list
                    showHistorySection();
                    console.log('🗑️ Riwayat dihapus:', window.currentHistoryId);
                } else {
                    showError('Gagal menghapus riwayat');
                }
            } catch (error) {
                console.error('Error deleting current history:', error);
                showError('Error menghapus riwayat: ' + error.message);
            }
        }
    }
}

function clearAllHistory() {
    if (!historyService) {
        showError('History service tidak tersedia');
        return;
    }

    const history = historyService.getHistory();
    if (history.length === 0) {
        alert('Tidak ada riwayat untuk dihapus');
        return;
    }

    if (confirm(`Hapus semua ${history.length} riwayat latihan?\n\nSemua riwayat akan dihapus permanen dan tidak dapat dikembalikan.`)) {
        try {
            const success = historyService.clearHistory();
            if (success) {
                // Refresh display
                renderHistoryList();
                renderHistoryStats();
                console.log('🧹 Semua riwayat dihapus');
            } else {
                showError('Gagal menghapus semua riwayat');
            }
        } catch (error) {
            console.error('Error clearing all history:', error);
            showError('Error menghapus semua riwayat: ' + error.message);
        }
    }
}

function downloadHistory() {
    if (!historyService) {
        showError('History service tidak tersedia');
        return;
    }

    try {
        const success = historyService.downloadHistoryJSON();
        if (success) {
            console.log('📥 Riwayat berhasil didownload');
        } else {
            showError('Gagal mendownload riwayat');
        }
    } catch (error) {
        console.error('Error downloading history:', error);
        showError('Error mendownload riwayat: ' + error.message);
    }
}

// Progress Service Functions
function initializeProgressService() {
    try {
        if (typeof ProgressService !== 'undefined') {
            progressService = new ProgressService();
            console.log('📊 Progress Service diinisialisasi');
            
            // Setup progress events
            setupProgressEvents();
        }
    } catch (error) {
        console.error('Error initializing progress service:', error);
    }
}

function setupProgressEvents() {
    setupAiQuestionControls();

    // Download progress button
    const downloadProgressBtn = document.getElementById('download-progress-btn');
    if (downloadProgressBtn) {
        downloadProgressBtn.addEventListener('click', downloadProgress);
    }
    
    // Reset progress button
    const resetProgressBtn = document.getElementById('reset-progress-btn');
    if (resetProgressBtn) {
        resetProgressBtn.addEventListener('click', resetProgressWithDialog);
    }

    const generateAiQuestionsBtn = document.getElementById('generate-ai-questions-btn');
    if (generateAiQuestionsBtn) {
        generateAiQuestionsBtn.addEventListener('click', generateAiQuestions);
    }
}

function setupAiQuestionControls() {
    const categorySelect = document.getElementById('ai-category-select');
    if (!categorySelect) return;

    categorySelect.addEventListener('change', updateAiSubcategoryOptions);
    updateAiSubcategoryOptions();
}

function updateAiSubcategoryOptions() {
    const categorySelect = document.getElementById('ai-category-select');
    const subcategorySelect = document.getElementById('ai-subcategory-select');
    if (!categorySelect || !subcategorySelect) return;

    const selectedCategory = categorySelect.value || 'MIXED';
    const subcategories = AI_SUBCATEGORIES[selectedCategory] || AI_SUBCATEGORIES.MIXED;

    subcategorySelect.innerHTML = subcategories.map(subcategory => {
        const label = subcategory || 'Semua subkategori';
        return `<option value="${subcategory}">${label}</option>`;
    }).join('');
}

function renderProgressSection() {
    if (!progressService || !window.questionLoader) return;
    
    const progressSection = document.getElementById('progress-section');
    const progressContent = document.getElementById('progress-content');
    
    if (!progressSection || !progressContent) return;
    
    // Get all questions for stats
    const allQuestions = [
        ...window.questionLoader.getQuestionsByCategory('TPK'),
        ...window.questionLoader.getQuestionsByCategory('TMK')
    ];
    
    if (allQuestions.length === 0) return;
    
    const stats = progressService.getSeenStats(allQuestions);
    
    progressContent.innerHTML = `
        <div class="progress-overview">
            <div class="progress-summary">
                <div class="progress-main">
                    <div class="progress-numbers">
                        <div class="progress-item total">
                            <span class="progress-number">${stats.total}</span>
                            <span class="progress-label">Total Soal</span>
                        </div>
                        <div class="progress-item seen">
                            <span class="progress-number">${stats.seen}</span>
                            <span class="progress-label">Pernah Dikerjakan</span>
                        </div>
                        <div class="progress-item unseen">
                            <span class="progress-number">${stats.unseen}</span>
                            <span class="progress-label">Belum Pernah Dikerjakan</span>
                        </div>
                    </div>
                    
                    <div class="progress-bar-container">
                        <div class="progress-bar">
                            <div class="progress-fill" style="width: ${stats.percentage}%"></div>
                        </div>
                        <div class="progress-percentage">${stats.percentage}%</div>
                    </div>
                </div>
            </div>
            
            <div class="progress-breakdown">
                <h4>Breakdown per Kategori</h4>
                <div class="category-progress">
                    <div class="category-item tpk">
                        <div class="category-header">
                            <span class="category-name">TPK</span>
                            <span class="category-stats">${stats.tpk.seen}/${stats.tpk.total} (${stats.tpk.percentage}%)</span>
                        </div>
                        <div class="category-bar">
                            <div class="category-fill" style="width: ${stats.tpk.percentage}%"></div>
                        </div>
                    </div>
                    
                    <div class="category-item tmk">
                        <div class="category-header">
                            <span class="category-name">TMK</span>
                            <span class="category-stats">${stats.tmk.seen}/${stats.tmk.total} (${stats.tmk.percentage}%)</span>
                        </div>
                        <div class="category-bar">
                            <div class="category-fill" style="width: ${stats.tmk.percentage}%"></div>
                        </div>
                    </div>
                </div>
                
                <div class="subcategory-progress">
                    <h5>Per Subkategori</h5>
                    <div class="subcategory-grid">
                        ${Object.entries(stats.subcategories).map(([subcat, subcatStats]) => `
                            <div class="subcategory-item">
                                <div class="subcategory-name">${subcat}</div>
                                <div class="subcategory-stats">${subcatStats.seen}/${subcatStats.total}</div>
                                <div class="subcategory-bar">
                                    <div class="subcategory-fill" style="width: ${subcatStats.percentage}%"></div>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                </div>
            </div>
        </div>
    `;
    
    // Show progress section
    progressSection.style.display = 'block';
}

function downloadProgress() {
    if (!progressService) {
        showError('Progress service tidak tersedia');
        return;
    }

    try {
        const success = progressService.downloadProgressJSON();
        if (success) {
            console.log('📥 Progress berhasil didownload');
        } else {
            showError('Gagal mendownload progress');
        }
    } catch (error) {
        console.error('Error downloading progress:', error);
        showError('Error mendownload progress: ' + error.message);
    }
}

function resetProgress() {
    if (!progressService) {
        showError('Progress service tidak tersedia');
        return;
    }

    if (confirm('Reset semua progres soal yang pernah dikerjakan?\n\nProgres yang direset tidak dapat dikembalikan.\n\nCatatan: Riwayat latihan dan sesi aktif tidak akan terhapus.')) {
        try {
            const success = progressService.resetSeenProgress();
            if (success) {
                // Refresh progress display
                renderProgressSection();
                console.log('🧹 Progress berhasil direset');
            } else {
                showError('Gagal mereset progress');
            }
        } catch (error) {
            console.error('Error resetting progress:', error);
            showError('Error mereset progress: ' + error.message);
        }
    }
}

async function resetProgressWithDialog() {
    if (!progressService) {
        showError('Progress service tidak tersedia');
        return;
    }

    const confirmed = await showConfirmDialog({
        title: 'Reset progres soal?',
        message: 'Semua tanda soal yang pernah dikerjakan akan dihapus. Riwayat latihan dan sesi aktif tetap tersimpan.',
        confirmText: 'Reset Progres',
        cancelText: 'Batal',
        variant: 'danger'
    });

    if (!confirmed) return;

    try {
        const success = progressService.resetSeenProgress();
        if (success) {
            renderProgressSection();
            showToast('Progres soal berhasil direset. Riwayat latihan dan sesi aktif tetap tersimpan.', 'success', 'Progres direset');
            console.log('Progress berhasil direset');
        } else {
            showError('Gagal mereset progress');
        }
    } catch (error) {
        console.error('Error resetting progress:', error);
        showError('Error mereset progress: ' + error.message);
    }
}

async function generateAiQuestions() {
    const generateBtn = document.getElementById('generate-ai-questions-btn');
    const originalText = generateBtn ? generateBtn.textContent : '';
    const requestOptions = getAiQuestionRequestOptions();

    try {
        if (typeof QuizSession === 'undefined') {
            throw new Error('Quiz engine belum dimuat');
        }

        setAiGenerationLoading(true, requestOptions);

        const allQuestions = getAllLoadedQuestionsForAI();
        const response = await fetch('/api/generate-questions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                count: requestOptions.count,
                kategori: requestOptions.kategori,
                subkategori: requestOptions.subkategori,
                existingIds: allQuestions.map(question => question.id),
                seenQuestionIds: progressService ? progressService.getSeenQuestionIds() : []
            })
        });

        const payload = await response.json().catch(() => ({}));
        if (!response.ok) {
            throw new Error(payload.error || 'Gagal meminta soal dari SwiftRouter');
        }

        const questions = Array.isArray(payload.questions) ? payload.questions : [];
        if (questions.length === 0) {
            throw new Error('SwiftRouter tidak mengembalikan soal');
        }

        const sessionMode = requestOptions.kategori === 'TPK' ? 'tpk' : requestOptions.kategori === 'TMK' ? 'tmk' : 'mixed';
        activeQuizSession = new QuizSession(questions, sessionMode, 'practice');
        activeQuizSession.setTimerDuration(questions.length * 60);
        window.activeQuizSession = activeQuizSession;

        showToast(`${questions.length} soal latihan AI siap dikerjakan. Soal ini untuk latihan mandiri, bukan soal resmi atau bocoran.`, 'success', 'Soal AI berhasil dibuat');
        startQuizFromSession();
    } catch (error) {
        console.error('Error generating AI questions:', error);
        showError('Error membuat soal AI: ' + error.message);
    } finally {
        setAiGenerationLoading(false);
        if (generateBtn) {
            generateBtn.disabled = false;
            generateBtn.textContent = originalText || 'Buat Soal Baru AI';
        }
    }
}

function setAiGenerationLoading(isLoading, options = null) {
    const panel = document.querySelector('.ai-question-panel');
    const status = document.getElementById('ai-generation-status');
    const statusMessage = document.getElementById('ai-generation-message');
    const generateBtn = document.getElementById('generate-ai-questions-btn');
    const controls = [
        document.getElementById('ai-category-select'),
        document.getElementById('ai-subcategory-select'),
        document.getElementById('ai-count-input')
    ].filter(Boolean);

    if (panel) {
        panel.classList.toggle('is-generating', isLoading);
    }

    if (status) {
        status.style.display = isLoading ? 'flex' : 'none';
    }

    if (statusMessage && isLoading && options) {
        const category = options.kategori === 'MIXED' ? 'campuran' : options.kategori;
        const subcategory = options.subkategori ? ` ${options.subkategori}` : '';
        statusMessage.textContent = `Membuat ${options.count} soal ${category}${subcategory}. Biasanya selesai dalam beberapa detik.`;
    }

    controls.forEach(control => {
        control.disabled = isLoading;
    });

    if (generateBtn) {
        generateBtn.disabled = isLoading;
        generateBtn.innerHTML = isLoading
            ? '<span class="btn-loader" aria-hidden="true"></span><span>Membuat soal...</span>'
            : 'Buat Soal AI';
    }
}

function getAiQuestionRequestOptions() {
    const categorySelect = document.getElementById('ai-category-select');
    const subcategorySelect = document.getElementById('ai-subcategory-select');
    const countInput = document.getElementById('ai-count-input');

    const kategori = categorySelect ? categorySelect.value : 'MIXED';
    const subkategori = subcategorySelect ? subcategorySelect.value : '';
    const requestedCount = countInput ? Number.parseInt(countInput.value, 10) : 5;
    const count = Math.min(20, Math.max(1, Number.isFinite(requestedCount) ? requestedCount : 5));

    if (countInput) {
        countInput.value = String(count);
    }

    return {
        count,
        kategori,
        subkategori
    };
}

function getAllLoadedQuestionsForAI() {
    if (window.questionService && window.questionService.isQuestionBanksLoaded()) {
        try {
            return window.questionService.getAllQuestions();
        } catch (error) {
            console.warn('Gagal mengambil soal dari QuestionService:', error);
        }
    }

    if (!window.questionLoader) return [];

    return [
        ...window.questionLoader.getQuestionsByCategory('TPK'),
        ...window.questionLoader.getQuestionsByCategory('TMK')
    ];
}

function markSessionQuestionsAsSeen(session) {
    if (!progressService || !session) return;
    
    try {
        const success = progressService.markSessionQuestionsAsSeen(session);
        if (success) {
            console.log('📊 Soal sesi ditandai sebagai pernah dikerjakan');
            // Refresh progress display if visible
            const progressSection = document.getElementById('progress-section');
            if (progressSection && progressSection.style.display !== 'none') {
                renderProgressSection();
            }
        }
    } catch (error) {
        console.error('Error marking session questions as seen:', error);
    }
}
