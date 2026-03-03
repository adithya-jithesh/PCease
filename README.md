# PCease — PC Builder for India

A full-stack PC building companion tailored for the Indian market.
Compare component prices across 9 major Indian retailers, design custom builds with an AI advisor, and discuss setups in the community forum.

---

## Features

| Area | Details |
|------|---------|
| **Browse** | 100+ components across 8 categories  filter by category, brand, search |
| **Compare** | Add up to 4 components  vendor price bars  cheapest highlighted  in-page search |
| **Builder** | Slot-based PC builder  budget tracker  share builds via link |
| **AI Advisor** | Gemini-powered build recommendations for any budget or use case |
| **Forum** | Community threads with voting and nested replies |
| **Auth** | JWT-based login/register |

---

## Tech Stack

**Frontend**
- React 18 + Vite 5
- React Router v6
- react-icons (Feather icon set)
- react-hot-toast
- CSS custom properties — dark minimal design system

**Backend**
- FastAPI (Python 3.13)
- Supabase (PostgreSQL as a service)
- Google Gemini API (AI advisor)
- JWT authentication via python-jose
- Deployed on Render

**Database**
- Supabase PostgreSQL
- Tables: `categories`, `vendors`, `components`, `component_prices`, `builds`, `shared_builds`, `forum_threads`, `forum_replies`, `forum_votes`
- 100 components, 9 vendors, 555+ price entries

---

## Quick Start

### Prerequisites
- Node.js  18
- Python  3.11
- A [Supabase](https://supabase.com) project

### 1. Clone
```bash
git clone https://github.com/your-username/pcease.git
cd pcease
```

### 2. Backend
```bash
cd backend
python -m venv .venv
# Windows
.venv\Scripts\activate
# macOS/Linux
source .venv/bin/activate

pip install -r requirements.txt
```

Create `backend/.env`:
```env
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_KEY=your-anon-key
SUPABASE_SERVICE_KEY=your-service-role-key
SECRET_KEY=any-random-secret-string
GEMINI_API_KEY=your-gemini-api-key
```

Run the schema migration in Supabase SQL editor (`backend/supabase_migration.sql`), then seed:
```bash
python seed_supabase.py
```

Start the backend:
```bash
uvicorn app.main:app --reload
# Runs on http://localhost:8000
```

### 3. Frontend
```bash
cd frontend
npm install
npm run dev
# Runs on http://localhost:5173
```

---

## Database Schema

```
categories       id, slug, name, description, icon
vendors          id, slug, name, url, logo_url
components       id, category_id, name, brand, model, specifications(json), image_url
component_prices id, component_id, vendor_id, price, currency, url, in_stock
builds           id, user_id, name, description, slots(json), total_price
shared_builds    id, share_id, build_data(json)
forum_threads    id, user_id, title, content, category, upvotes, downvotes
forum_replies    id, thread_id, user_id, content
```

---

## API Reference

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/categories` | All component categories |
| GET | `/api/components` | Components (filter: category, brand, search, sort) |
| GET | `/api/components/{id}` | Single component with prices |
| POST | `/api/compare` | Compare list `{ ids: [1,2,3] }` |
| GET | `/api/vendors` | All vendors |
| GET | `/api/stats` | Site-wide stats |
| POST | `/api/auth/register` | Register user |
| POST | `/api/auth/login` | Login (returns JWT) |
| GET | `/api/auth/me` | Current user |
| GET | `/api/builds` | User builds (auth required) |
| POST | `/api/builds` | Save build (auth required) |
| POST | `/api/builds/share` | Create shareable link |
| GET | `/api/builds/shared/{id}` | Load shared build |
| GET | `/api/forum/threads` | Forum threads |
| POST | `/api/forum/threads` | Create thread (auth required) |
| POST | `/api/advisor` | AI build recommendation |

---

## Project Structure

```
pcease/
 backend/
    app/
       main.py          # FastAPI app, CORS, routers
       config.py        # Settings from .env
       database.py      # Supabase client
       models/          # SQLAlchemy models (legacy, kept for reference)
       routers/         # auth, components, forum
       schemas/         # Pydantic request/response models
    seed_supabase.py     # Database seeder (100 components, 9 vendors)
    supabase_migration.sql
    requirements.txt

 frontend/
     src/
         pages/
            Home.jsx      Browse.jsx    Builder.jsx
            Compare.jsx   Forum.jsx     Auth.jsx
            Advisor.jsx
         components/
            Navbar.jsx
            Footer.jsx
         context/
            AuthContext.jsx
         services/
            api.js        # Centralised API layer + price helpers
         styles/
             global.css    # Design system — dark minimal theme
```

---

## Deployment

**Backend (Render)**
- Build command: `pip install -r requirements.txt`
- Start command: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
- Set all `.env` variables as environment variables in Render dashboard

**Frontend (Vercel)**
- Auto-deploys on push to `main`
- Set `VITE_API_URL` to your Render backend URL

---

## Vendors Tracked

Amazon.in  Flipkart  MDComputers  PrimeABGB  PC Studio  Vedant Computers  IT Depot  Compify  EliteHubs

---

## License

MIT
