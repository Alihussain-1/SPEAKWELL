# SPEAKWELL — Clean Text-to-Speech Web Application

SPEAKWELL is a minimal, production-ready Text-to-Speech (TTS) studio built with **Next.js (App Router)**, **TypeScript**, **Tailwind CSS**, and **Microsoft Edge TTS (`@andresaya/edge-tts`)**.

Designed for zero-latency in-memory synthesis and 100% compatibility with Vercel serverless functions (zero serverless file-system read-only errors).

---

## ✨ Features

- **In-Memory Audio Processing:** Synthesizes audio to Node.js buffers in memory and returns Base64 data URLs (`data:audio/mp3;base64,...`), completely eliminating `fs.writeFile` disk errors on Vercel and AWS Lambda.
- **300+ Edge Neural Voices:** High-fidelity, multi-language speech with realistic accents across 100+ locales.
- **Instant Voice Preview:** Fast voice testing modal with search, gender filtering (All, Female, Male), and one-click sample audition.
- **Speech Emotion & Tone Presets:** Neutral, Cheerful, Excited, Friendly, Serious, Sad, and Whispery styles.
- **Pitch & Speed Sliders:** Full dynamic control over speed (`0.5x` to `2.0x`) and pitch (`-50Hz` to `+50Hz`).
- **History Drawer with Safe Quota Pruning:** Keeps recent generation history in `localStorage` (`tts_history`) with automatic pruning on `QuotaExceededError` to prevent storage overflow.
- **Inline Audio Player & MP3 Export:** One-click playback, seeking, and direct MP3 file downloads.
- **Dark & Light Mode:** Seamless theme switching with modern SaaS aesthetics (`#111111`, `#181818`, `#202020`).

---

## 🛠️ Tech Stack

- **Framework:** Next.js 14+ (App Router)
- **Language:** TypeScript
- **Styling:** Tailwind CSS + `next-themes`
- **Icons:** `lucide-react`
- **TTS Engine:** `@andresaya/edge-tts` (Official Microsoft Edge Neural TTS)

---

## 🚀 Getting Started

### 1. Install Dependencies
```bash
npm install
```

### 2. Run the Development Server
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### 3. Production Build
```bash
npm run build
npm run start
```

---

## ☁️ Deploying to Vercel

SPEAKWELL is configured out-of-the-box for Vercel deployment:
- `export const maxDuration = 60;`
- `export const dynamic = 'force-dynamic';`
- Pure in-memory streaming with no serverless disk operations.
