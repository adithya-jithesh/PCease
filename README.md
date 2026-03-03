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
| **Database** | Supabase (hosted PostgreSQL), service-role key for server-side ops |
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

### 1. Clone

```bash
git clone https://github.com/vaibhavshiroorkar/pcease.git
cd pcease
```

### 2. Database

Open the Supabase SQL editor and run `backend/supabase_migration.sql` to create all tables. Then seed component data:

```bash
cd backend
python -m venv .venv
.venv\Scripts\activate        # Windows
# source .venv/bin/activate   # macOS / Linux
pip install -r requirements.txt
python seed_supabase.py
```

### 3. Backend

Create `backend/.env`:

```env
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_KEY=your-anon-key
SUPABASE_SERVICE_KEY=your-service-role-key
SECRET_KEY=any-random-secret-string
GEMINI_API_KEY=your-google-gemini-api-key
FRONTEND_URL=http://localhost:5173
```

Start the server:

```bash
uvicorn app.main:app --reload --port 8000
```

### 4. Frontend

Create `frontend/.env`:

```env
VITE_API_URL=http://localhost:8000/api
```

```bash
cd frontend
npm install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173).

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

```
categories        id · slug · name · description · icon
vendors           id · slug · name · url · logo_url
components        id · category_id · name · brand · model · specifications (jsonb) · image_url
component_prices  id · component_id · vendor_id · price · currency · url · in_stock
builds            id · user_id · name · components (jsonb) · total_price · created_at
shared_builds     id · share_id · name · components (jsonb) · total_price · created_at
users             id · username · email · hashed_password · created_at
forum_threads     id · user_id · title · content · category · created_at
forum_replies     id · thread_id · user_id · content · created_at
forum_votes       id · thread_id · user_id · vote_type
```

---

## Project Structure

```
pcease/
├── backend/
│   ├── app/
│   │   ├── main.py            # FastAPI app, CORS, router mounting
│   │   ├── config.py          # Pydantic settings from .env
│   │   ├── database.py        # Supabase client (service role key)
│   │   ├── routers/
│   │   │   ├── auth.py        # Register, login, JWT
│   │   │   ├── components.py  # Browse, compare, builds, stats
│   │   │   └── forum.py       # Threads, replies, voting
│   │   ├── schemas/           # Pydantic request/response models
│   │   └── utils/
│   │       └── auth.py        # JWT decode, current_user dependency
│   ├── seed_supabase.py       # Seeds 100+ components, 9 vendors, 500+ prices
│   ├── supabase_migration.sql # Full schema DDL
│   └── requirements.txt
│
├── frontend/
│   ├── src/
│   │   ├── App.jsx            # Route definitions
│   │   ├── main.jsx           # React root
│   │   ├── pages/
│   │   │   ├── Home.jsx       # Landing / hero page
│   │   │   ├── Browse.jsx     # Component browser (grid + list)
│   │   │   ├── Builder.jsx    # PC build tool
│   │   │   ├── Compare.jsx    # Side-by-side comparison
│   │   │   ├── Advisor.jsx    # AI recommendation + chat
│   │   │   ├── Forum.jsx      # Community threads
│   │   │   └── Auth.jsx       # Login / register
│   │   ├── components/
│   │   │   ├── Navbar.jsx
│   │   │   └── Footer.jsx
│   │   ├── context/
│   │   │   └── AuthContext.jsx # Auth state + JWT management
│   │   ├── services/
│   │   │   └── api.js         # API client, price helpers, config
│   │   └── styles/
│   │       └── global.css     # Design system (CSS custom properties)
│   ├── vite.config.js
│   └── package.json
│
└── README.md
```

---

## Deployment

### Backend → Render

| Setting | Value |
|---------|-------|
| Build command | `pip install -r requirements.txt` |
| Start command | `uvicorn app.main:app --host 0.0.0.0 --port $PORT` |
| Root directory | `backend` |
| Environment | Add every key from `backend/.env` |

### Frontend → Vercel

| Setting | Value |
|---------|-------|
| Framework preset | Vite |
| Root directory | `frontend` |
| Build command | `npm run build` |
| Output directory | `dist` |
| Environment | `VITE_API_URL` = your Render backend URL (e.g. `https://pcease-api.onrender.com/api`) |

### Database → Supabase

Free tier is sufficient. Enable **Row Level Security** only if you add public-facing write operations beyond what the service key already handles.

---

## Vendors Tracked

| Vendor | URL |
|--------|-----|
| Amazon India | amazon.in |
| Flipkart | flipkart.com |
| MDComputers | mdcomputers.in |
| PrimeABGB | primeabgb.com |
| PC Studio | pcstudio.in |
| Vedant Computers | vedantcomputers.com |
| IT Depot | itdepot.com |
| Compify | compify.in |
| EliteHubs | elitehubs.com |

---

## Contributing

1. Fork the repo
2. Create a feature branch (`git checkout -b feature/my-feature`)
3. Commit your changes (`git commit -m "Add my feature"`)
4. Push to the branch (`git push origin feature/my-feature`)
5. Open a Pull Request

---

## License

[MIT](LICENSE)
