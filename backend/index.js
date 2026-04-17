import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { DatabaseSync } from 'node:sqlite';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
app.use(cors());
app.use(express.json());

const port = process.env.PORT || 5000;
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

// ========== DATABASE SETUP ==========
const db = new DatabaseSync(join(__dirname, 'kecocokan.db'));
db.exec('PRAGMA journal_mode = WAL');

db.exec(`
  CREATE TABLE IF NOT EXISTS history (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    mode TEXT NOT NULL,
    person_a_name TEXT NOT NULL,
    person_a_gender TEXT,
    person_a_personality TEXT,
    person_a_traits TEXT,
    person_a_hobbies TEXT,
    person_a_habits TEXT,
    person_a_description TEXT,
    person_b_name TEXT NOT NULL,
    person_b_gender TEXT,
    person_b_personality TEXT,
    person_b_traits TEXT,
    person_b_hobbies TEXT,
    person_b_habits TEXT,
    person_b_description TEXT,
    score INTEGER,
    badge TEXT,
    summary TEXT,
    result_json TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )
`);

const insertHistory = db.prepare(`
  INSERT INTO history (
    mode,
    person_a_name, person_a_gender, person_a_personality, person_a_traits, person_a_hobbies, person_a_habits, person_a_description,
    person_b_name, person_b_gender, person_b_personality, person_b_traits, person_b_hobbies, person_b_habits, person_b_description,
    score, badge, summary, result_json
  ) VALUES (
    @mode,
    @person_a_name, @person_a_gender, @person_a_personality, @person_a_traits, @person_a_hobbies, @person_a_habits, @person_a_description,
    @person_b_name, @person_b_gender, @person_b_personality, @person_b_traits, @person_b_hobbies, @person_b_habits, @person_b_description,
    @score, @badge, @summary, @result_json
  )
`);

// ========== HARDCODED PASSWORD ==========
const HISTORY_PASSWORD = 'izar261008';

// ========== ANALYZE ENDPOINT ==========
app.post('/api/analyze', async (req, res) => {
  try {
    const { mode, personA, personB } = req.body;

    if (!process.env.GEMINI_API_KEY) {
      return res.status(500).json({ error: 'GEMINI_API_KEY belum dikonfigurasi di server.' });
    }

    const getPersonality = (p) => p.personality === 'Lainnya' ? p.customPersonality : p.personality;
    const formatHobbies = (arr) => Array.isArray(arr) ? arr.join(', ') : arr;
    const formatHabits = (arr) => Array.isArray(arr) ? arr.join(', ') : arr;
    const formatTraits = (arr) => Array.isArray(arr) ? arr.join(', ') : arr;

    const modeLabels = {
      pacar: 'Pacar (hubungan romantis resmi)',
      teman: 'Teman / Sahabat',
      hts: 'HTS (Hubungan Tanpa Status)',
      ttm: 'TTM (Teman Tapi Mesra)',
      pdkt: 'PDKT (Pendekatan / sedang mendekati)',
      gebetan: 'Gebetan (sedang naksir)',
      fwb: 'FWB (Friends With Benefits)',
      situationship: 'Situationship (hubungan tanpa kejelasan)',
      mantan: 'Mantan (apakah cocok balikan)',
      rebound: 'Rebound (pelarian dari hubungan sebelumnya)',
    };

    const modeContext = modeLabels[mode] || mode;

    const prompt = `
Kamu adalah "Cek Kecocokan AI" — seorang analis hubungan yang SANGAT ahli, sassy, receh tapi cerdas, dan familiar banget dengan budaya Gen Z Indonesia. Gaya bahasamu gaul tapi tetap informatif dan berbobot.

TUGAS: Analisa kecocokan antara dua orang ini untuk konteks hubungan: "${modeContext}".

================================
ORANG A:
- Nama: ${personA.name}
- Gender: ${personA.gender || 'tidak disebutkan'}
- Kepribadian: ${getPersonality(personA) || 'tidak disebutkan'}
- Sifat: ${formatTraits(personA.traits) || 'tidak disebutkan'}
- Hobi: ${formatHobbies(personA.hobbies) || 'tidak disebutkan'}
- Kebiasaan: ${formatHabits(personA.habits) || 'tidak disebutkan'}
${personA.description ? `- Deskripsi tambahan: ${personA.description}` : ''}

ORANG B:
- Nama: ${personB.name}
- Gender: ${personB.gender || 'tidak disebutkan'}
- Kepribadian: ${getPersonality(personB) || 'tidak disebutkan'}
- Sifat: ${formatTraits(personB.traits) || 'tidak disebutkan'}
- Hobi: ${formatHobbies(personB.hobbies) || 'tidak disebutkan'}
- Kebiasaan: ${formatHabits(personB.habits) || 'tidak disebutkan'}
${personB.description ? `- Deskripsi tambahan: ${personB.description}` : ''}
================================

INSTRUKSI PENTING untuk menentukan SKOR:
1. Jangan selalu kasih skor di range 60-80. Berani kasih skor rendah (20-40) jika memang red flag banyak, dan skor tinggi (85-100) jika sangat cocok.
2. Pertimbangkan SEMUA aspek: kepribadian, sifat, hobi, kebiasaan, gender dynamics, dan konteks hubungan (${modeContext}).
3. Setiap aspek punya bobot:
   - Kepribadian cocok/clash: 25% dari skor total
   - Sifat yang kompatibel/clash: 20% dari skor total
   - Hobi yang sama/berbeda: 15% dari skor total
   - Kebiasaan yang kompatibel/konflik: 20% dari skor total
   - Dinamika hubungan (gender, konteks ${mode}): 20% dari skor total
4. Jika ada sifat yang bertentangan (misalnya satu penyabar satu temperamental, satu posesif satu cuek), itu harus menurunkan skor.
5. Jika ada kebiasaan buruk yang bertentangan (misalnya satu rapi satu berantakan), itu harus menurunkan skor.
6. Jika hobi sangat mirip, itu bonus besar.
7. Jika konteks hubungannya HTS/Situationship, perhatikan kecocokan emosional dan sifat mereka.

JAWAB dalam format JSON MENTAH (tanpa markdown, tanpa code block) dengan struktur PERSIS ini, GUNAKAN BAHASA INDONESIA:
{
  "score": angka 0-100 (harus bervariasi, jangan selalu 65-75!),
  "badge": "string: gelar lucu dan kreatif untuk hubungan mereka, maks 4 kata, harus unik dan beda tiap pasangan",
  "summary": "string: ringkasan singkat 2-3 kalimat yang catchy dan sassy tentang kecocokan mereka secara keseluruhan",
  "analysis": {
    "kepribadian": "string: analisis mendalam interaksi kepribadian mereka (2-3 kalimat)",
    "sifat": "string: analisis kecocokan atau clash sifat-sifat mereka (2-3 kalimat)",
    "hobi": "string: analisis kecocokan hobi mereka (2-3 kalimat)",
    "kebiasaan": "string: analisis konflik atau kecocokan kebiasaan mereka (2-3 kalimat)",
    "dinamika": "string: analisis dinamika hubungan berdasarkan gender dan konteks ${modeContext} (2-3 kalimat)"
  },
  "greenFlags": ["string", "string", "string", "string"],
  "redFlags": ["string", "string", "string"],
  "spicinessLevel": "string: satu kata level kepedasan hubungan ini (contoh: Hambar, Hangat, Pedas, Pedas Gila, Volcano)",
  "advice": "string: saran bijak tapi santai untuk mereka berdua mengenai hubungan ini (2-3 kalimat)"
}
`;

    // Daftar model yang akan dicoba secara berurutan (dari terbaik ke cadangan)
    const modelList = [
      'gemini-2.5-flash',
      'gemini-2.5-pro',
      'gemini-2.5-flash-lite',
      'gemini-2.0-flash',
      'gemini-2.0-flash-001',
      'gemini-2.0-flash-lite',
      'gemini-2.0-flash-lite-001',
      'gemini-3.1-pro-preview',
      'gemini-3-pro-preview',
      'gemini-3-flash-preview',
      'gemini-3.1-flash-lite-preview',
      'gemini-flash-latest',
      'gemini-flash-lite-latest',
      'gemini-pro-latest',
    ];
    const MAX_RETRIES = 3;
    const RETRY_DELAY_MS = 3000;

    let result;
    let lastError;

    for (const modelName of modelList) {
      const model = genAI.getGenerativeModel({ model: modelName });
      for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
        try {
          console.log(`Mencoba model ${modelName} (percobaan ${attempt}/${MAX_RETRIES})...`);
          result = await model.generateContent(prompt);
          break;
        } catch (err) {
          lastError = err;
          console.log(`${modelName} gagal: ${err.status} ${err.statusText}`);
          if (err.status === 503 && attempt < MAX_RETRIES) {
            console.log(`Menunggu ${RETRY_DELAY_MS / 1000} detik sebelum retry...`);
            await new Promise(r => setTimeout(r, RETRY_DELAY_MS));
          } else {
            break; // Lanjut ke model berikutnya
          }
        }
      }
      if (result) break; // Berhasil, keluar dari loop model
    }

    if (!result) {
      throw lastError || new Error('Semua model gagal merespon.');
    }

    const responseText = result.response.text();
    
    // Extract JSON safely in case the model adds markdown code blocks
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('Gagal membaca JSON dari respon AI');
    }
    
    const analysisData = JSON.parse(jsonMatch[0]);

    // Save to database
    try {
      insertHistory.run({
        mode,
        person_a_name: personA.name,
        person_a_gender: personA.gender || '',
        person_a_personality: getPersonality(personA) || '',
        person_a_traits: JSON.stringify(personA.traits || []),
        person_a_hobbies: JSON.stringify(personA.hobbies || []),
        person_a_habits: JSON.stringify(personA.habits || []),
        person_a_description: personA.description || '',
        person_b_name: personB.name,
        person_b_gender: personB.gender || '',
        person_b_personality: getPersonality(personB) || '',
        person_b_traits: JSON.stringify(personB.traits || []),
        person_b_hobbies: JSON.stringify(personB.hobbies || []),
        person_b_habits: JSON.stringify(personB.habits || []),
        person_b_description: personB.description || '',
        score: analysisData.score,
        badge: analysisData.badge,
        summary: analysisData.summary,
        result_json: JSON.stringify(analysisData),
      });
      console.log('✅ History saved to database');
    } catch (dbErr) {
      console.error('⚠️ Gagal simpan history:', dbErr.message);
      // Don't fail the response if DB save fails
    }

    res.json(analysisData);

  } catch (error) {
    console.error('Error in analyze endpoint:', error);
    res.status(500).json({ error: error.message || 'Terjadi kesalahan saat menghitung tingkat kecocokan.' });
  }
});

// ========== HISTORY AUTH ENDPOINT ==========
app.post('/api/history/auth', (req, res) => {
  const { password } = req.body;
  if (password === HISTORY_PASSWORD) {
    res.json({ success: true });
  } else {
    res.status(401).json({ success: false, error: 'Kata sandi salah.' });
  }
});

// ========== HISTORY LIST ENDPOINT ==========
app.get('/api/history', (req, res) => {
  const { password } = req.query;
  if (password !== HISTORY_PASSWORD) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    const rows = db.prepare('SELECT * FROM history ORDER BY created_at DESC').all();

    const history = rows.map(row => ({
      id: row.id,
      mode: row.mode,
      personA: {
        name: row.person_a_name,
        gender: row.person_a_gender,
        personality: row.person_a_personality,
        traits: JSON.parse(row.person_a_traits || '[]'),
        hobbies: JSON.parse(row.person_a_hobbies || '[]'),
        habits: JSON.parse(row.person_a_habits || '[]'),
        description: row.person_a_description,
      },
      personB: {
        name: row.person_b_name,
        gender: row.person_b_gender,
        personality: row.person_b_personality,
        traits: JSON.parse(row.person_b_traits || '[]'),
        hobbies: JSON.parse(row.person_b_hobbies || '[]'),
        habits: JSON.parse(row.person_b_habits || '[]'),
        description: row.person_b_description,
      },
      score: row.score,
      badge: row.badge,
      summary: row.summary,
      result: JSON.parse(row.result_json || '{}'),
      createdAt: row.created_at,
    }));

    res.json(history);
  } catch (err) {
    console.error('Error fetching history:', err);
    res.status(500).json({ error: 'Gagal mengambil history.' });
  }
});

// ========== DELETE HISTORY ENDPOINT ==========
app.delete('/api/history/:id', (req, res) => {
  const { password } = req.query;
  if (password !== HISTORY_PASSWORD) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    const stmt = db.prepare('DELETE FROM history WHERE id = ?');
    stmt.run(req.params.id);
    res.json({ success: true });
  } catch (err) {
    console.error('Error deleting history:', err);
    res.status(500).json({ error: 'Gagal menghapus history.' });
  }
});

app.listen(port, () => {
  console.log(`Backend is running on http://localhost:${port}`);
});
