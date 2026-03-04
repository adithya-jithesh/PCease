from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.gzip import GZipMiddleware
from fastapi.responses import ORJSONResponse
from .routers import auth, components, forum, advisor
from .config import settings
from .cache import get_cache, set_cache, clear_cache


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Startup: warm caches. Shutdown: cleanup."""
    from .database import get_db
    try:
        db = get_db()
        set_cache("categories", db.table("categories").select("*").order("name").execute().data or [])
        set_cache("vendors", db.table("vendors").select("*").order("name").execute().data or [])
    except Exception:
        set_cache("categories", [])
        set_cache("vendors", [])
    yield
    clear_cache()


app = FastAPI(
    title="PCease API",
    description="PC Building Platform — Compare prices, check compatibility, get AI recommendations.",
    version="4.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
    default_response_class=ORJSONResponse,
    lifespan=lifespan,
)

# Middleware
app.add_middleware(GZipMiddleware, minimum_size=500)

origins = [settings.frontend_url] if settings.frontend_url else []
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_origin_regex=r"http://(localhost|127\.0\.0\.1):\d+",
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
        "version": "4.0.0",
        "status": "running",
        "docs": "/docs",
    }


@app.get("/health")
def health_check():
    """Health check — tests Supabase connectivity."""
    from .database import get_db
    try:
        db = get_db()
        db.table("categories").select("id").limit(1).execute()
        return {"status": "healthy", "version": "4.0.0", "db": "connected"}
    except Exception as e:
        return {"status": "unhealthy", "version": "4.0.0", "db": str(e)}
