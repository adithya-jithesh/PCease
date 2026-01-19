from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from mangum import Mangum
from .database import engine, Base
from .routers import auth, components, forum
import os

# Create database tables
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="PCease API",
    description="India's #1 PC Building Platform - Backend API",
    version="2.0.0"
)

# CORS middleware for frontend
origins = [
    "http://localhost:5173",
    "http://localhost:3000",
    "http://127.0.0.1:5173",
]

# Add production frontend URL if set
frontend_url = os.getenv("FRONTEND_URL")
if frontend_url:
    origins.append(frontend_url)

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(auth.router)
app.include_router(components.router)
app.include_router(forum.router)


@app.get("/")
def root():
    return {
        "message": "Welcome to PCease API",
        "docs": "/docs",
        "version": "2.0.0"
    }


@app.get("/health")
def health_check():
    return {"status": "healthy"}


# Vercel serverless handler
handler = Mangum(app)
