const fs = require('fs');
const path = require('path');

const rootDir = path.resolve(__dirname, '..');
const distDir = path.join(rootDir, 'dist');
const publicDir = path.join(rootDir, 'public');

const entriesToCopy = [
    'index.html',
    'src',
    'data'
];

fs.rmSync(distDir, { recursive: true, force: true });
fs.rmSync(publicDir, { recursive: true, force: true });
fs.mkdirSync(distDir, { recursive: true });
fs.mkdirSync(publicDir, { recursive: true });

for (const entry of entriesToCopy) {
    const source = path.join(rootDir, entry);
    const distTarget = path.join(distDir, entry);
    const publicTarget = path.join(publicDir, entry);

    if (!fs.existsSync(source)) {
        throw new Error(`Build source tidak ditemukan: ${entry}`);
    }

    fs.cpSync(source, distTarget, { recursive: true });
    fs.cpSync(source, publicTarget, { recursive: true });
}

console.log('Vercel static build siap di folder public');
