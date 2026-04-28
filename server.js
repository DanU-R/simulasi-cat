const http = require('http');
const fs = require('fs');
const path = require('path');

const ROOT_DIR = __dirname;
loadDotEnv();

const PORT = Number(process.env.PORT || 4173);
const SWIFTROUTER_BASE_URL = 'https://api.swiftrouter.com/v1';
const DEFAULT_MODEL = process.env.SWIFTROUTER_MODEL || 'gpt-5.4-mini';

const MIME_TYPES = {
    '.html': 'text/html; charset=utf-8',
    '.css': 'text/css; charset=utf-8',
    '.js': 'application/javascript; charset=utf-8',
    '.json': 'application/json; charset=utf-8',
    '.md': 'text/markdown; charset=utf-8',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.svg': 'image/svg+xml',
    '.ico': 'image/x-icon'
};

const REQUIRED_QUESTION_FIELDS = [
    'id',
    'kategori',
    'subkategori',
    'level',
    'pertanyaan',
    'pilihan_A',
    'pilihan_B',
    'pilihan_C',
    'pilihan_D',
    'pilihan_E',
    'jawaban_benar',
    'pembahasan',
    'alasan_opsi_A',
    'alasan_opsi_B',
    'alasan_opsi_C',
    'alasan_opsi_D',
    'alasan_opsi_E'
];

const VALID_SUBCATEGORIES = new Set([
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
]);

const server = http.createServer(async (req, res) => {
    try {
        const url = new URL(req.url, `http://${req.headers.host || 'localhost'}`);

        if (req.method === 'POST' && url.pathname === '/api/generate-questions') {
            await handleGenerateQuestions(req, res);
            return;
        }

        if (req.method === 'GET' || req.method === 'HEAD') {
            serveStatic(url.pathname, req, res);
            return;
        }

        sendJson(res, 405, { error: 'Method not allowed' });
    } catch (error) {
        console.error('Server error:', error);
        sendJson(res, 500, { error: 'Server error' });
    }
});

server.listen(PORT, () => {
    console.log(`Simulasi CAT KDKMP ready at http://localhost:${PORT}`);
});

function loadDotEnv() {
    const envPath = path.join(ROOT_DIR, '.env');
    if (!fs.existsSync(envPath)) return;

    const lines = fs.readFileSync(envPath, 'utf8').split(/\r?\n/);
    for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith('#')) continue;

        const equalIndex = trimmed.indexOf('=');
        if (equalIndex === -1) continue;

        const key = trimmed.slice(0, equalIndex).trim();
        let value = trimmed.slice(equalIndex + 1).trim();
        if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
            value = value.slice(1, -1);
        }

        if (key && process.env[key] === undefined) {
            process.env[key] = value;
        }
    }
}

function serveStatic(requestPath, req, res) {
    let decodedPath;
    try {
        decodedPath = decodeURIComponent(requestPath);
    } catch {
        sendText(res, 400, 'Bad request');
        return;
    }

    const relativePath = decodedPath === '/'
        ? 'index.html'
        : path.normalize(decodedPath).replace(/^(\.\.[/\\])+/, '').replace(/^[/\\]/, '');
    const filePath = path.resolve(ROOT_DIR, relativePath);

    if (!filePath.startsWith(ROOT_DIR)) {
        sendText(res, 403, 'Forbidden');
        return;
    }

    if (!isPublicStaticPath(relativePath)) {
        sendText(res, 404, 'Not found');
        return;
    }

    fs.stat(filePath, (statError, stat) => {
        if (statError || !stat.isFile()) {
            sendText(res, 404, 'Not found');
            return;
        }

        const ext = path.extname(filePath).toLowerCase();
        res.writeHead(200, {
            'Content-Type': MIME_TYPES[ext] || 'application/octet-stream',
            'Content-Length': stat.size
        });

        if (req.method === 'HEAD') {
            res.end();
            return;
        }

        fs.createReadStream(filePath).pipe(res);
    });
}

function isPublicStaticPath(relativePath) {
    const normalized = relativePath.replace(/\\/g, '/');
    if (normalized === 'index.html') return true;
    return normalized.startsWith('src/')
        || normalized.startsWith('data/')
        || normalized.startsWith('assets/');
}

async function handleGenerateQuestions(req, res) {
    const apiKey = process.env.SWIFTROUTER_API_KEY || process.env.OPENAI_API_KEY;
    if (!apiKey) {
        sendJson(res, 500, {
            error: 'SWIFTROUTER_API_KEY belum diset di server. Buat file .env atau set environment variable.'
        });
        return;
    }

    let body;
    try {
        body = await readJsonBody(req);
    } catch (error) {
        sendJson(res, 400, { error: error.message });
        return;
    }

    const count = clampInteger(body.count, 1, 20, 10);
    const kategori = normalizeKategori(body.kategori);
    const subkategori = normalizeSubkategori(body.subkategori, kategori);
    const existingIds = Array.isArray(body.existingIds) ? body.existingIds.slice(0, 250) : [];
    const seenQuestionIds = Array.isArray(body.seenQuestionIds) ? body.seenQuestionIds.slice(0, 250) : [];

    const prompt = buildQuestionPrompt({
        count,
        kategori,
        subkategori,
        existingIds,
        seenQuestionIds
    });

    try {
        const upstream = await fetch(`${SWIFTROUTER_BASE_URL}/chat/completions`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                model: process.env.SWIFTROUTER_MODEL || DEFAULT_MODEL,
                temperature: 0.75,
                max_tokens: Math.min(12000, Math.max(2400, count * 950)),
                response_format: { type: 'json_object' },
                messages: [
                    {
                        role: 'system',
                        content: 'Anda adalah pembuat bank soal CAT KDKMP. Output harus JSON valid saja, tanpa markdown.'
                    },
                    {
                        role: 'user',
                        content: prompt
                    }
                ]
            })
        });

        const raw = await upstream.text();
        if (!upstream.ok) {
            sendJson(res, upstream.status, normalizeUpstreamError(raw));
            return;
        }

        const payload = JSON.parse(raw);
        const content = payload.choices?.[0]?.message?.content;
        const parsed = parseModelJson(content);
        const questions = normalizeGeneratedQuestions(parsed.questions, {
            kategori,
            subkategori
        });

        sendJson(res, 200, {
            source: 'swiftrouter',
            model: payload.model || DEFAULT_MODEL,
            generated_at: new Date().toISOString(),
            disclaimer: 'Soal ini dibuat AI untuk latihan mandiri. Bukan soal resmi, bukan bocoran, dan wajib ditinjau bila dipakai sebagai bank soal permanen.',
            questions
        });
    } catch (error) {
        console.error('Generate questions error:', error);
        sendJson(res, 500, { error: 'Gagal membuat soal AI', details: error.message });
    }
}

function readJsonBody(req) {
    return new Promise((resolve, reject) => {
        let data = '';
        req.on('data', chunk => {
            data += chunk;
            if (data.length > 1024 * 1024) {
                reject(new Error('Request terlalu besar'));
                req.destroy();
            }
        });
        req.on('end', () => {
            try {
                resolve(data ? JSON.parse(data) : {});
            } catch {
                reject(new Error('Body harus JSON valid'));
            }
        });
        req.on('error', reject);
    });
}

function buildQuestionPrompt({ count, kategori, subkategori, existingIds, seenQuestionIds }) {
    const now = new Date().toISOString().replace(/[-:.TZ]/g, '').slice(0, 12);
    const target = kategori === 'MIXED' ? 'campuran TPK dan TMK' : kategori;
    const subcategoryLine = subkategori ? `Fokus subkategori: ${subkategori}.` : 'Sebarkan subkategori secara wajar.';

    return `Buat ${count} soal baru untuk simulasi CAT KDKMP kategori ${target}.
${subcategoryLine}

Aturan penting:
- Soal harus orisinal untuk latihan, bukan soal resmi dan bukan bocoran.
- Jangan mengulang gagasan soal lama. Hindari ID berikut: ${[...existingIds, ...seenQuestionIds].slice(0, 120).join(', ') || '-'}.
- Bahasa Indonesia jelas dan profesional.
- Pilihan A-E harus masuk akal, hanya satu jawaban benar.
- Untuk kategori TPK gunakan poin latihan +1 jika benar. Untuk TMK gunakan +5 jika benar.
- Jangan gunakan gambar. Isi field gambar dengan null jika perlu.
- Field kategori hanya "TPK" atau "TMK".
- Field jawaban_benar hanya "A", "B", "C", "D", atau "E".
- Field level hanya "Mudah", "Sedang", atau "Sulit".
- Gunakan id unik dengan prefix AI-${now}-001 dan seterusnya.

Output JSON wajib berbentuk:
{
  "questions": [
    {
      "id": "AI-${now}-001",
      "kategori": "TPK",
      "subkategori": "Bahasa",
      "level": "Sedang",
      "pertanyaan": "...",
      "pilihan_A": "...",
      "pilihan_B": "...",
      "pilihan_C": "...",
      "pilihan_D": "...",
      "pilihan_E": "...",
      "jawaban_benar": "A",
      "pembahasan": "...",
      "alasan_opsi_A": "...",
      "alasan_opsi_B": "...",
      "alasan_opsi_C": "...",
      "alasan_opsi_D": "...",
      "alasan_opsi_E": "...",
      "cara_cepat": "...",
      "tags": ["ai-generated", "latihan"],
      "estimasi_waktu": 60
    }
  ]
}`;
}

function normalizeGeneratedQuestions(questions, defaults) {
    if (!Array.isArray(questions) || questions.length === 0) {
        throw new Error('Respons AI tidak berisi array questions');
    }

    return questions.map((question, index) => {
        const normalized = { ...question };
        for (const field of REQUIRED_QUESTION_FIELDS) {
            if (normalized[field] === undefined || normalized[field] === null || normalized[field] === '') {
                throw new Error(`Soal AI index ${index} tidak memiliki field ${field}`);
            }
        }

        normalized.id = String(normalized.id || `AI-${Date.now()}-${index + 1}`).trim();
        normalized.kategori = normalizeKategori(normalized.kategori || defaults.kategori);
        if (normalized.kategori === 'MIXED') normalized.kategori = index % 5 === 0 ? 'TMK' : 'TPK';

        normalized.subkategori = String(normalized.subkategori || defaults.subkategori || '').trim();
        if (!VALID_SUBCATEGORIES.has(normalized.subkategori)) {
            normalized.subkategori = normalized.kategori === 'TMK' ? 'Tata Kelola' : 'Pengetahuan Umum';
        }

        normalized.level = ['Mudah', 'Sedang', 'Sulit'].includes(normalized.level) ? normalized.level : 'Sedang';
        normalized.jawaban_benar = String(normalized.jawaban_benar).trim().toUpperCase();
        if (!['A', 'B', 'C', 'D', 'E'].includes(normalized.jawaban_benar)) {
            throw new Error(`Soal AI ${normalized.id} memiliki jawaban_benar tidak valid`);
        }

        normalized.gambar = normalized.gambar || null;
        normalized.tags = Array.isArray(normalized.tags) ? normalized.tags : ['ai-generated', 'latihan'];
        normalized.estimasi_waktu = Number.isFinite(Number(normalized.estimasi_waktu)) ? Number(normalized.estimasi_waktu) : 60;

        return normalized;
    });
}

function normalizeKategori(value) {
    const upper = String(value || 'TPK').trim().toUpperCase();
    return ['TPK', 'TMK', 'MIXED'].includes(upper) ? upper : 'TPK';
}

function normalizeSubkategori(value, kategori) {
    const trimmed = String(value || '').trim();
    if (VALID_SUBCATEGORIES.has(trimmed)) return trimmed;
    if (kategori === 'TMK') return 'Tata Kelola';
    if (kategori === 'TPK') return 'Pengetahuan Umum';
    return '';
}

function clampInteger(value, min, max, fallback) {
    const number = Number.parseInt(value, 10);
    if (!Number.isFinite(number)) return fallback;
    return Math.min(max, Math.max(min, number));
}

function parseModelJson(content) {
    if (!content || typeof content !== 'string') {
        throw new Error('Respons AI kosong');
    }

    try {
        return JSON.parse(content);
    } catch {
        const match = content.match(/\{[\s\S]*\}/);
        if (!match) throw new Error('Respons AI bukan JSON');
        return JSON.parse(match[0]);
    }
}

function normalizeUpstreamError(raw) {
    try {
        const parsed = JSON.parse(raw);
        return {
            error: parsed.error?.message || parsed.error || 'SwiftRouter error',
            code: parsed.error?.code || parsed.code,
            details: parsed
        };
    } catch {
        return { error: raw || 'SwiftRouter error' };
    }
}

function sendJson(res, status, body) {
    const payload = JSON.stringify(body);
    res.writeHead(status, {
        'Content-Type': 'application/json; charset=utf-8',
        'Content-Length': Buffer.byteLength(payload)
    });
    res.end(payload);
}

function sendText(res, status, body) {
    res.writeHead(status, {
        'Content-Type': 'text/plain; charset=utf-8',
        'Content-Length': Buffer.byteLength(body)
    });
    res.end(body);
}
