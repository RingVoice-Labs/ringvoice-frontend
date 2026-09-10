# 👁 RingVoice — Live Doorbell Captions

> **Amazon Developer Hackathon 2026 — Build, Ship & Shape**
>
> *Never miss who's at the door.*

RingVoice streams **real-time captions** from your Ring doorbell camera directly to your phone — so deaf and hard-of-hearing residents know exactly who's there and what they're saying, without missing a moment.

---

## 🎯 The Problem

Over **11 million adults** in the US are deaf or hard of hearing. Standard Ring doorbells rely entirely on audio — a live speaker from the device, two-way talk, and chime sounds. For HoH residents, these features are completely inaccessible.

RingVoice fixes that.

---

## ✨ Features

| Feature | Description |
|---|---|
| 🔔 **Live Ring Alerts** | Instant visual banner when someone presses the bell or motion is detected |
| 📝 **Real-Time Captions** | Visitor speech streams word-by-word at 36px — readable at a glance |
| 📋 **Quick Replies** | Tap to log your response (Leaving now / Leave at door / One moment / Wrong address) |
| ✏️ **Custom Notes** | Free-text note for any visit |
| 📚 **Visit History** | Full log of every visit with transcript + your logged response |
| ♿ **Accessibility-first** | AAA contrast, ARIA live regions, screen reader support, reduced-motion support |
| 📱 **Installable PWA** | Works offline, installs to home screen like a native app |

---

## 🚀 Live Demo

**[→ Open RingVoice on Vercel](https://ringvoice.vercel.app)**

On load, tap **▶ Watch Demo** (or wait 4 seconds) to see a full live walkthrough — ring event fires, captions stream in, and the quick-reply panel lights up.

---

## 🏗 Architecture

```
Frontend (this repo)          Backend (teammate)
─────────────────────         ─────────────────────────────
React 19 + TypeScript         REST API  +  WebSocket / SSE
Vite 8 + Tailwind 4           Ring API integration
Vercel (hosting)              Caption transcription service
```

**Swap points** — when the backend is ready, only these files change:

| File | What changes |
|---|---|
| `src/mock/mockRingEvent.ts` | Replace `subscribeMockRingEvent` with WebSocket listener |
| `src/mock/mockCaptionStream.ts` | Replace with WebSocket/SSE stream |
| `src/screens/ResidentScreen.tsx` | Uncomment `POST /visits/{id}/response` |
| `src/screens/HistoryScreen.tsx` | Replace mock data with `GET /visits` |

See [`API_CONTRACT.md`](./API_CONTRACT.md) for the full backend spec.

---

## 🛠 Local Development

```bash
# Install
npm install

# Dev server (hot reload)
npm run dev

# Production build
npm run build

# Preview production build
npm run preview
```

**Environment variables** (optional — defaults to mock data):

```
VITE_USE_MOCK_DATA=false   # Set to false to use the real backend
```

---

## 🧑‍💻 Tech Stack

- **React 19** — concurrent features, `useCallback`, `useRef`
- **TypeScript 6** — strict mode, `verbatimModuleSyntax`
- **Tailwind CSS v4** — CSS-first config with `@theme` design tokens
- **Vite 8** — sub-second HMR, optimised production bundles
- **Vercel** — zero-config deployment with SPA routing

---

## 👥 Team

| Role | Name |
|---|---|
| Frontend | RingVoice Labs |
| Backend | *(teammate)* |

---

## 📄 License

MIT — see [`LICENSE`](./LICENSE)
