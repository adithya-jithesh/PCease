from datetime import timedelta
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from supabase import Client
from ..database import get_db
from ..schemas.user import UserCreate, UserResponse, Token
from ..utils.auth import verify_password, get_password_hash, create_access_token, get_current_user
from ..config import settings

router = APIRouter(prefix="/api/auth", tags=["Authentication"])


@router.post("/register", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
def register(user: UserCreate, db: Client = Depends(get_db)):
    """Register a new user"""
    # Check if email exists
    existing = db.table("users").select("id").eq("email", user.email).execute()
    if existing.data:
        raise HTTPException(status_code=400, detail="Email already registered")

    # Check if username exists
    existing = db.table("users").select("id").eq("username", user.username).execute()
    if existing.data:
        raise HTTPException(status_code=400, detail="Username already taken")

    # Create user
    new_user = db.table("users").insert({
        "email": user.email,
        "username": user.username,
        "hashed_password": get_password_hash(user.password),
        "is_active": True,
    }).execute()

    if not new_user.data:
        raise HTTPException(status_code=500, detail="Failed to create user")

    return new_user.data[0]


@router.post("/login", response_model=Token)
def login(form_data: OAuth2PasswordRequestForm = Depends(), db: Client = Depends(get_db)):
    """Login and get access token"""
    result = db.table("users").select("*").eq("email", form_data.username).maybe_single().execute()

    if not result or not result.data or not verify_password(form_data.password, result.data["hashed_password"]):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )

    user = result.data
    access_token = create_access_token(
        data={"sub": user["id"]},
        expires_delta=timedelta(minutes=settings.access_token_expire_minutes),
    )
    return {"access_token": access_token, "token_type": "bearer"}


@router.get("/me", response_model=UserResponse)
async def get_me(current_user: dict = Depends(get_current_user)):
    """Get current authenticated user"""
    return current_user
