from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .routers import auth, components, forum, advisor
from .config import settings

app = FastAPI(
    title="PCease API",
    description="India's #1 PC Building Platform — Compare prices, check compatibility, get AI recommendations.",
    version="3.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
)

# CORS
origins = [
    "http://localhost:5173",
    "http://localhost:3000",
    "http://127.0.0.1:5173",
]

if settings.frontend_url:
    origins.append(settings.frontend_url)

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Routers
app.include_router(auth.router)
app.include_router(components.router)
app.include_router(forum.router)
app.include_router(advisor.router)


@app.get("/")
def root():
    return {
        "name": "PCease API",
        "version": "3.0.0",
        "status": "running",
        "docs": "/docs",
        "stack": "FastAPI + Supabase + Render",
    }


@app.get("/health")
def health_check():
    return {"status": "healthy", "version": "3.0.0"}
