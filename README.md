<p align="center">
  <strong>PCease</strong><br/>
  <em>India's open-source PC building platform</em>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/React-18-61dafb?style=flat&logo=react" alt="React 18" />
  <img src="https://img.shields.io/badge/FastAPI-0.110+-009688?style=flat&logo=fastapi" alt="FastAPI" />
  <img src="https://img.shields.io/badge/Supabase-PostgreSQL-3ecf8e?style=flat&logo=supabase" alt="Supabase" />
  <img src="https://img.shields.io/badge/Vite-5-646cff?style=flat&logo=vite" alt="Vite" />
  <img src="https://img.shields.io/badge/Python-3.13-3776ab?style=flat&logo=python" alt="Python" />
  <img src="https://img.shields.io/badge/License-MIT-green?style=flat" alt="License" />
</p>

---

Browse 100+ components, compare prices across **9 Indian retailers**, build custom PCs with compatibility checking, get **AI-powered recommendations**, and share builds — all for free.

## Why PCease?

Most PC-building tools target the US market with Newegg/Amazon.com pricing. PCease is built **specifically for Indian buyers** — tracking prices from Amazon.in, Flipkart, MDComputers, PrimeABGB, and more. No affiliate bloat, no paywalls.

---

## Features

### Core

- **Browse & Filter** — Search 100+ components across 8 categories (CPU, GPU, Motherboard, RAM, Storage, PSU, Case, Cooler). Grid and list views with inline vendor prices and buy links.
- **Price Comparison** — Every component shows prices from up to 9 Indian retailers side-by-side. Cheapest vendor highlighted. Direct buy links to each store.
- **PC Builder** — Slot-based build tool with live budget tracker, wattage estimator, and bottleneck analyzer. Share any build via a unique link.
- **Compare Tool** — Place up to 4 components side-by-side with a full specs comparison table. Best values auto-highlighted in green.

### Smart

- **AI Advisor** — Enter a budget and use case → get a full build recommendation powered by Google Gemini. Includes an interactive chat mode.
- **Wattage Calculator** — Sums component TDP values and recommends a PSU wattage with headroom.
- **Bottleneck Analyzer** — Detects CPU-GPU tier mismatches before you buy.

### Community

- **Forum** — Ask questions, share configs, upvote/downvote threads. Scoped by category (Build Help, Reviews, Deals, etc.).
- **Sharable Builds** — Generate a short link for any build. No account needed to view.
- **Auth** — Register/login with JWT. Saves builds to your account.

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| **Frontend** | React 18, Vite 5, React Router v6, react-hot-toast, Feather Icons |
| **Backend** | FastAPI (Python 3.13), Pydantic v2, python-jose (JWT) |
| **Database** | Supabase (hosted PostgreSQL) |
| **AI** | Google Gemini API (`google-generativeai`) |
| **Hosting** | Frontend → Vercel, Backend → Render, DB → Supabase |
| **Design** | Custom CSS design system — dark theme, CSS variables, responsive |

---

## Getting Started

### Prerequisites

| Tool | Version |
|------|---------|
| Node.js | ≥ 18 |
| Python | ≥ 3.11 |
| Supabase project | [supabase.com](https://supabase.com) (free tier works) |

### 1. Database

Open the Supabase SQL editor and run `backend/supabase_migration.sql` to create all tables. Then seed component data:

```bash
cd backend
python -m venv .venv
.venv\Scripts\activate        # Windows
source .venv/bin/activate     # macOS / Linux
pip install -r requirements.txt
python seed_supabase.py
```

### 2. Backend

Create a `backend/.env` file with your own credentials (refer to `.env.example`). Then start the server:

```bash
uvicorn app.main:app --reload --port 8000
```

> **Never commit your `.env` file.** Make sure `.env` is listed in `.gitignore`.

### 3. Frontend

Create a `frontend/.env` file with your backend URL, then run:

```bash
cd frontend
npm install
npm run dev
```

---

## API Reference

Interactive docs available at `/docs` (Swagger UI) and `/redoc` when the server is running.

### Components

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `GET` | `/api/categories` | — | All component categories |
| `GET` | `/api/components` | — | List components (query: `category`, `brand`, `search`, `sort`, `skip`, `limit`) |
| `GET` | `/api/components/{id}` | — | Single component with all vendor prices |
| `POST` | `/api/compare` | — | Compare up to 4 components `{ "ids": [1,2,3] }` |
| `GET` | `/api/vendors` | — | All tracked vendors |
| `GET` | `/api/stats` | — | Platform-wide counts |

### Builds

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `GET` | `/api/builds` | ✅ | List user's saved builds |
| `POST` | `/api/builds` | ✅ | Save a new build |
| `DELETE` | `/api/builds/{id}` | ✅ | Delete a build |
| `POST` | `/api/builds/share` | — | Generate shareable link |
| `GET` | `/api/builds/shared/{share_id}` | — | Load a shared build |

### Auth

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `POST` | `/api/auth/register` | — | Create account |
| `POST` | `/api/auth/login` | — | Login → JWT token |
| `GET` | `/api/auth/me` | ✅ | Current user profile |

### Forum

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `GET` | `/api/forum/threads` | — | List threads (query: `category`, `search`) |
| `GET` | `/api/forum/threads/{id}` | — | Thread detail with replies |
| `POST` | `/api/forum/threads` | ✅ | Create thread |
| `POST` | `/api/forum/threads/{id}/replies` | ✅ | Post reply |
| `POST` | `/api/forum/threads/{id}/vote` | ✅ | Upvote / downvote |

### AI Advisor

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `POST` | `/api/advisor` | — | Get AI build recommendation |

---

## Database Schema
