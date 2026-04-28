/**
 * Test Subcategory Mapping Fix
 * Memverifikasi bahwa mapping subkategori TPK berfungsi dengan benar
 */

// Import modules (untuk Node.js environment)
const fs = require('fs');
const path = require('path');

console.log('🧪 MEMULAI TEST SUBCATEGORY MAPPING');
console.log('================================================');

// Test 1: Verifikasi nilai subkategori di file JSON
console.log('🔍 TEST 1: Verifikasi nilai subkategori di file JSON');

const jsonFiles = [
    'data/questions/tpk_bahasa.json',
    'data/questions/tpk_hitungan.json',
    'data/questions/tpk_pengetahuan_umum.json',
    'data/questions/tpk_pola_gambar.json',
    'data/questions/tpk_abstraksi_ruang.json',
    'data/questions/tpk_bentuk.json'
];

const actualSubcategories = {};

jsonFiles.forEach(filePath => {
    try {
        const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
        if (data.length > 0) {
            const subcategory = data[0].subkategori;
            actualSubcategories[path.basename(filePath, '.json')] = subcategory;
            console.log(`   ✓ ${path.basename(filePath)}: "${subcategory}"`);
        }
    } catch (error) {
        console.log(`   ❌ Error reading ${filePath}: ${error.message}`);
    }
});

console.log('\n📊 Nilai subkategori aktual di JSON:');
Object.entries(actualSubcategories).forEach(([file, subcategory]) => {
    console.log(`   • ${file}: "${subcategory}"`);
});

// Test 2: Verifikasi mapping di mode-config.js
console.log('\n🔍 TEST 2: Verifikasi mapping di mode-config.js');

try {
    const modeConfigContent = fs.readFileSync('src/mode-config.js', 'utf8');
    
    // Extract TPK_SUBCATEGORIES object
    const subcategoriesMatch = modeConfigContent.match(/const TPK_SUBCATEGORIES = \{([\s\S]*?)\};/);
    
    if (subcategoriesMatch) {
        console.log('   ✓ TPK_SUBCATEGORIES object ditemukan');
        
        // Check for 'value' fields
        const valueMatches = modeConfigContent.match(/value: '([^']+)'/g);
        if (valueMatches) {
            console.log('   ✓ Field "value" ditemukan dalam mapping');
            valueMatches.forEach(match => {
                const value = match.match(/value: '([^']+)'/)[1];
                console.log(`     • value: "${value}"`);
            });
        } else {
            console.log('   ❌ Field "value" tidak ditemukan dalam mapping');
        }
    } else {
        console.log('   ❌ TPK_SUBCATEGORIES object tidak ditemukan');
    }
} catch (error) {
    console.log(`   ❌ Error reading mode-config.js: ${error.message}`);
}

// Test 3: Verifikasi mapping yang benar
console.log('\n🔍 TEST 3: Verifikasi mapping yang benar');

const expectedMapping = {
    'Bahasa/Verbal': 'Bahasa',
    'Hitungan/Numerik': 'Hitungan',
    'Pengetahuan Umum': 'Pengetahuan Umum',
    'Pola Gambar': 'Pola Gambar',
    'Abstraksi Ruang': 'Abstraksi Ruang',
    'Bentuk/Menentukan Bentuk': 'Bentuk/Menentukan Bentuk'
};

console.log('📋 Mapping yang diperlukan:');
Object.entries(expectedMapping).forEach(([label, value]) => {
    console.log(`   • label: "${label}" → value: "${value}"`);
});

// Test 4: Simulasi filtering
console.log('\n🔍 TEST 4: Simulasi filtering soal');

// Load all questions
const allQuestions = [];
jsonFiles.forEach(filePath => {
    try {
        const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
        allQuestions.push(...data);
    } catch (error) {
        console.log(`   ❌ Error loading ${filePath}: ${error.message}`);
    }
});

console.log(`📚 Total soal dimuat: ${allQuestions.length}`);

// Test filtering dengan nilai yang benar
Object.entries(expectedMapping).forEach(([label, value]) => {
    const filtered = allQuestions.filter(q => q.subkategori === value);
    const status = filtered.length > 0 ? '✅' : '❌';
    console.log(`   ${status} "${label}" (value: "${value}"): ${filtered.length} soal`);
});

// Test 5: Verifikasi unique subcategories
console.log('\n🔍 TEST 5: Verifikasi unique subcategories');

const uniqueSubcategories = [...new Set(allQuestions.map(q => q.subkategori))];
console.log('📂 Subkategori unik yang ditemukan:');
uniqueSubcategories.forEach(sub => {
    const count = allQuestions.filter(q => q.subkategori === sub).length;
    console.log(`   • "${sub}": ${count} soal`);
});

console.log('\n================================================');
console.log('🎉 TEST SUBCATEGORY MAPPING SELESAI');

// Summary
const totalExpected = Object.keys(expectedMapping).length;
const totalFound = uniqueSubcategories.length;
const allMapped = Object.values(expectedMapping).every(value => 
    uniqueSubcategories.includes(value)
);

console.log('\n📊 RINGKASAN:');
console.log(`   • Expected subcategories: ${totalExpected}`);
console.log(`   • Found subcategories: ${totalFound}`);
console.log(`   • All mapped correctly: ${allMapped ? 'YES' : 'NO'}`);

if (allMapped) {
    console.log('✅ MAPPING SUBCATEGORY: BERHASIL');
} else {
    console.log('❌ MAPPING SUBCATEGORY: GAGAL');
    process.exit(1);
}