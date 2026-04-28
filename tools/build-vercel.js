const fs = require('fs');
const path = require('path');

const rootDir = path.resolve(__dirname, '..');
const distDir = path.join(rootDir, 'dist');

const entriesToCopy = [
    'index.html',
    'src',
    'data'
];

fs.rmSync(distDir, { recursive: true, force: true });
fs.mkdirSync(distDir, { recursive: true });

for (const entry of entriesToCopy) {
    const source = path.join(rootDir, entry);
    const target = path.join(distDir, entry);

    if (!fs.existsSync(source)) {
        throw new Error(`Build source tidak ditemukan: ${entry}`);
    }

    fs.cpSync(source, target, { recursive: true });
}

console.log('Vercel static build siap di folder dist');
