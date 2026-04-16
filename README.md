# Cek Kecocokan AI

Aplikasi analisis kecocokan (chemistry) antara dua orang menggunakan Google Gemini AI. Didesain khusus untuk Gen Z dengan gaya bahasa yang sassy dan informatif.

## Struktur Project

- **/frontend**: Aplikasi React + Vite + Tailwind CSS v4.
- **/backend**: Server Node.js + Express + SQLite + Gemini AI.

## Fitur Utama

- **Analisis Mendalam**: Menghitung skor kecocokan berdasarkan Kepribadian, Sifat, Hobi, dan Kebiasaan.
- **Smart Suggestions**: Memudahkan pengisian data dengan saran hobi, sifat, dan kebiasaan yang populer.
- **Wizard Flow**: Antarmuka langkah-demi-langkah (Person 1 -> Person 2) yang bersih dan tidak membingungkan.
- **Riwayat Rahasia**: Semua hasil analisis disimpan di database lokal (SQLite) dan dapat diakses melalui rute rahasia `#/history` dengan password.
- **Desain Premium**: Menggunakan Framer Motion untuk animasi halus dan desain glassmorphism yang modern.

## Cara Menjalankan

### Backend
1. Masuk ke folder `backend`.
2. Install dependensi: `npm install`.
3. Buat file `.env` dan tambahkan `GEMINI_API_KEY`.
4. Jalankan server: `node index.js`.

### Frontend
1. Masuk ke folder `frontend`.
2. Install dependensi: `npm install`.
3. Jalankan aplikasi: `npm run dev`.

## Rahasia
- **Akses History**: Tambahkan `#/history` pada URL aplikasi di browser.
- **Password History**: `izar261008`.

---
Dibuat dengan ❤️ untuk kecocokan yang lebih baik.
