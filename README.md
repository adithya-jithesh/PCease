# PCease v2.0

**India's #1 PC Building Platform**

Compare prices across retailers, check compatibility in real-time, and get AI-powered recommendations.

## Tech Stack

- **Frontend**: React 18 + Vite + React Router
- **Backend**: FastAPI + SQLAlchemy
- **Database**: PostgreSQL
- **Auth**: JWT with bcrypt

## Quick Start

### Prerequisites

- Python 3.11+
- Node.js 18+
- PostgreSQL 15+

### 1. Setup Database

```bash
# Create PostgreSQL database
createdb pcease
```

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
copy .env.example .env  # Edit with your database URL

# Seed database
python -m app.seed

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

# Start dev server
npm run dev
```

Frontend runs at: http://localhost:5173

## Features

- 🔍 Browse components with filters
- ⚙️ PC Builder with compatibility checks
- 🤖 AI Build Advisor
- 💬 Community Forum
- 🔐 User Authentication
- 💰 Price comparison across vendors

## Demo Account

- Email: `demo@pcease.in`
- Password: `demo123`

## Project Structure

```
pc-ease/
├── backend/         # FastAPI backend
│   ├── app/
│   │   ├── models/  # SQLAlchemy models
│   │   ├── schemas/ # Pydantic schemas
│   │   ├── routers/ # API routes
│   │   └── main.py  # App entry
│   └── requirements.txt
│
└── frontend/        # React frontend
    ├── src/
    │   ├── components/
    │   ├── pages/
    │   ├── styles/
    │   └── App.jsx
    └── package.json
```

## License

MIT
