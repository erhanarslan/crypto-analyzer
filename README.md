# 🚀 Crypto Analyzer

A production-style crypto market analysis dashboard built with a clean monorepo architecture.

---

## 🌐 Live Demo

- **Web App:** https://bucolic-pithivier-1a67e1.netlify.app/
- **API:** https://crypto-analyzer-api-nikp.onrender.com

---

## 📌 Overview

Crypto Analyzer is a **technical analysis and market scanning tool** that helps identify:

- high-score trading candidates
- breakout / momentum coins
- multi-timeframe alignment
- risk-aware decision zones

This project is intentionally designed as a **portfolio-grade product demo**, focusing on:

- real-time market data
- structured technical analysis
- clean UI/UX
- scalable architecture

> This is not a toy project — it's a **mini product foundation**.

---

## 🎯 Why This Project Exists

Most crypto dashboards:

- overwhelm users with raw data
- repeat the same signals
- lack decision clarity

Crypto Analyzer solves that by:

- summarizing signals into **actionable insights**
- scoring coins with a consistent model
- reducing noise into **clear decision outputs**

---

## ✨ Features

### 📊 Market Analysis

- Live Binance market data
- EMA overlays (20 / 50 / 200)
- Support / resistance zones
- Volume-based signals

### ⚡ Scanner Engine

- Batch scanning across coins
- Score-based ranking
- Spike detection:
  - breakout
  - momentum
  - overheated

### 🧠 Decision Panel

- structured analysis output
- one-line verdicts
- risk zones (confirm / invalidation)
- multi-timeframe consistency

### 🔍 Multi-Timeframe View

- 15m / 30m / 1h / 4h
- quick alignment checks
- fast context switching

### ⭐ Favorites

- local watchlist
- drop detection
- quick access panel

---

## 🧱 Monorepo Structure

```
crypto-analyzer/
│
├── apps/
│   ├── web/        → React frontend (Vite + Tailwind)
│   └── api/        → Fastify backend
│
├── packages/
│   ├── analysis-core/ → scoring & analysis engine
│   └── shared/        → shared types
│
├── turbo.json
├── pnpm-workspace.yaml
└── README.md
```

---

## ⚙️ Tech Stack

### Frontend

- React
- TypeScript
- Vite
- Tailwind CSS

### Backend

- Fastify
- TypeScript
- In-memory cache
- Binance API integration

### Architecture

- Monorepo (pnpm + turbo)
- Shared domain logic
- Separation of concerns

---

## 🧠 Architecture Overview

```
Frontend (React)
   ↓
Fastify API
   ↓
Market Service → Binance API
   ↓
Scan Engine
   ↓
Analysis Core (shared package)
```

---

## 🚀 Getting Started

### 1. Install dependencies

From root:

```bash
pnpm install
```

---

### 2. Run Backend

```bash
cd apps/api
pnpm dev
```

Backend runs on:

```
http://localhost:3001
```

---

### 3. Run Frontend

```bash
cd apps/web
cp .env.example .env
pnpm dev
```

Frontend runs on:

```
http://localhost:5173
```

---

## 🔐 Environment Variables

### apps/web/.env

```env
VITE_API_BASE_URL=http://localhost:3001
```

---

### apps/api/.env

```env
PORT=3001
```

---

## 🌍 Deployment

### Frontend → Vercel

- Root directory: `apps/web`
- Build command:

```bash
pnpm install && pnpm build
```

- Output:

```
dist
```

---

### Backend → Render

- Root directory: `apps/api`
- Build:

```bash
pnpm install
```

- Start:

```bash
pnpm start
```

---

## 📸 Screenshots

_(add screenshots here later)_

- Dashboard
- Scanner
- Multi-timeframe
- Favorites

---

## 🧩 Key Design Decisions

### 1. Monorepo

- shared logic reuse
- scalable architecture
- mobile-ready foundation

### 2. No Database (for v1)

- faster iteration
- demo-focused
- avoids premature complexity

### 3. Local Favorites

- reduces backend dependency
- keeps UX fast

---

## ⚠️ Known Limitations

- no authentication
- no persistent user data
- no alert system (yet)
- no mobile app

---

## 🛣️ Roadmap

### Phase 2

- backend alert engine
- Telegram / email notifications
- user-based rules

### Phase 3

- React Native mobile app
- shared core logic reuse
- push notifications

### Phase 4

- user accounts
- cloud persistence
- portfolio tracking

---

## 💡 What This Project Demonstrates

- clean architecture thinking
- frontend/backend separation
- real-world data handling
- scalable monorepo design
- product-level UI decisions

---

## 📄 License

MIT

---

## 👤 Author

Built as a portfolio project focused on **real product thinking**, not just coding.

---
