# PCease v3.0

**India's PC Building Platform** — Compare prices, build PCs, get AI recommendations, and share builds with a link.

## Features

- **Price Comparison** — Compare across 7 Indian retailers (Amazon.in, Flipkart, MDComputers, PrimeABGB, PCStudio, Vedant Computers, The IT Depot)
- **PC Builder** — Drag-and-drop component selection with auto wattage calculator and bottleneck analyzer
- **Shareable Builds** — Copy a link to save/share your build without login
- **AI Build Advisor** — Get budget-based recommendations powered by Google Gemini AI
- **Side-by-Side Compare** — Compare up to 4 components in a detailed table
- **Community Forum** — Ask questions, share builds, upvote/downvote threads
- **Pre-built Templates** — 6 curated builds for gaming, editing, streaming, and productivity
- **User Auth** — JWT-based authentication with bcrypt

## Tech Stack

| Layer | Technology | Deploy |
|-------|-----------|--------|
| Frontend | React 18 + Vite 5 | **Vercel** |
| Backend | FastAPI (Python) | **Render** |
| Database | PostgreSQL (Supabase) | **Supabase** |
| AI | Google Gemini (gemini-1.5-flash) | — |

## Quick Start

### Prerequisites

- Python 3.11+
- Node.js 18+
- Supabase project (free tier works)
- Google Gemini API key (free from [AI Studio](https://aistudio.google.com/apikey))

### 1. Setup Supabase

1. Create a project at [supabase.com](https://supabase.com)
2. Go to SQL Editor → paste and run `backend/supabase_migration.sql`
3. Copy your **Project URL**, **anon key**, and **service_role key** from Settings → API

### 2. Backend Setup

```bash
cd backend

# Create virtual environment
python -m venv venv
venv\Scripts\activate  # Windows
# source venv/bin/activate  # Linux/Mac

# Install dependencies
pip install -r requirements.txt

# Create .env file
copy .env.example .env  # Edit with your Supabase + Gemini keys

# Start server
uvicorn app.main:app --reload
```

Backend runs at: http://localhost:8000
API docs at: http://localhost:8000/docs

### 3. Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Create .env file
copy .env.example .env  # Edit with your API URL + Supabase keys

# Start dev server
npm run dev
```

Frontend runs at: http://localhost:5173

## Deployment

### Frontend → Vercel

1. Connect your GitHub repo
2. Set root directory to `frontend`
3. Add env vars: `VITE_API_URL`, `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`

### Backend → Render

1. Connect your GitHub repo
2. Set root directory to `backend`
3. Build command: `pip install -r requirements.txt`
4. Start command: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
5. Add env vars: `SUPABASE_URL`, `SUPABASE_KEY`, `SUPABASE_SERVICE_KEY`, `SECRET_KEY`, `GEMINI_API_KEY`, `FRONTEND_URL`

## Project Structure

```
pcease/
├── backend/
│   ├── app/
│   │   ├── routers/      # auth, components, forum, advisor
│   │   ├── models/       # (legacy, DB defined in Supabase)
│   │   ├── schemas/      # Pydantic schemas
│   │   ├── utils/        # JWT auth helpers
│   │   ├── config.py     # Settings / env vars
│   │   ├── database.py   # Supabase client
│   │   └── main.py       # FastAPI app
│   ├── supabase_migration.sql
│   ├── render.yaml
│   └── requirements.txt
│
└── frontend/
    ├── src/
    │   ├── components/    # Navbar, Footer
    │   ├── context/       # AuthContext
    │   ├── pages/         # Home, Browse, Builder, Advisor, Forum, Auth, Compare
    │   ├── services/      # API client
    │   └── styles/        # Global CSS
    ├── vercel.json
    └── package.json
```

## API Endpoints

| Method | Endpoint | Description |
|--------|---------|-------------|
| POST | `/api/auth/register` | Register user |
| POST | `/api/auth/login` | Login (returns JWT) |
| GET | `/api/components/` | List/search components |
| GET | `/api/components/{id}` | Component details |
| POST | `/api/components/compare` | Compare up to 4 components |
| POST | `/api/components/builds/share` | Create shareable build |
| GET | `/api/components/builds/shared/{id}` | Get shared build |
| GET | `/api/advisor/templates` | Pre-built templates |
| POST | `/api/advisor/recommend` | AI recommendation |
| POST | `/api/advisor/ask` | Free-form AI Q&A |
| POST | `/api/advisor/wattage` | Power calculator |
| POST | `/api/advisor/bottleneck` | CPU-GPU bottleneck check |
| GET | `/api/forum/threads` | List threads |
| POST | `/api/forum/threads` | Create thread |
| POST | `/api/forum/threads/{id}/vote` | Vote on thread |
| POST | `/api/forum/threads/{id}/replies` | Reply to thread |
| POST | `/api/forum/replies/{id}/vote` | Vote on reply |

## License

MIT
