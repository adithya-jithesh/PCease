from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import func
from ..database import get_db
from ..models.forum import ForumThread, ForumReply
from ..models.user import User
from ..schemas.forum import (
    ThreadCreate, ThreadResponse, ThreadDetailResponse,
    ReplyCreate, ReplyResponse
)
from ..utils.auth import get_current_user

router = APIRouter(prefix="/api/forum", tags=["Forum"])


@router.get("/threads", response_model=List[ThreadResponse])
def get_threads(
    category: Optional[str] = None,
    search: Optional[str] = None,
    skip: int = 0,
    limit: int = 20,
    db: Session = Depends(get_db)
):
    """Get forum threads with optional filters"""
    query = db.query(
        ForumThread,
        User.username.label("author_username"),
        func.count(ForumReply.id).label("reply_count")
    ).join(User).outerjoin(ForumReply).group_by(ForumThread.id, User.username)
    
    if category:
        query = query.filter(ForumThread.category == category)
    
    if search:
        query = query.filter(ForumThread.title.ilike(f"%{search}%"))
    
    results = query.order_by(ForumThread.created_at.desc()).offset(skip).limit(limit).all()
    
    # Transform results
    threads = []
    for thread, author_username, reply_count in results:
        thread_dict = {
            "id": thread.id,
            "user_id": thread.user_id,
            "title": thread.title,
            "content": thread.content,
            "category": thread.category,
            "created_at": thread.created_at,
            "author_username": author_username,
            "reply_count": reply_count
        }
        threads.append(thread_dict)
    
    return threads


@router.post("/threads", response_model=ThreadResponse, status_code=status.HTTP_201_CREATED)
def create_thread(
    thread: ThreadCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Create a new forum thread"""
    db_thread = ForumThread(
        user_id=current_user.id,
        title=thread.title,
        content=thread.content,
        category=thread.category
    )
    db.add(db_thread)
    db.commit()
    db.refresh(db_thread)
    
    return {
        "id": db_thread.id,
        "user_id": db_thread.user_id,
        "title": db_thread.title,
        "content": db_thread.content,
        "category": db_thread.category,
        "created_at": db_thread.created_at,
        "author_username": current_user.username,
        "reply_count": 0
    }


@router.get("/threads/{thread_id}", response_model=ThreadDetailResponse)
def get_thread(thread_id: int, db: Session = Depends(get_db)):
    """Get thread with all replies"""
    thread = db.query(ForumThread).options(
        joinedload(ForumThread.author),
        joinedload(ForumThread.replies).joinedload(ForumReply.author)
    ).filter(ForumThread.id == thread_id).first()
    
    if not thread:
        raise HTTPException(status_code=404, detail="Thread not found")
    
    # Build response with usernames
    replies = [{
        "id": r.id,
        "thread_id": r.thread_id,
        "user_id": r.user_id,
        "content": r.content,
        "created_at": r.created_at,
        "author_username": r.author.username
    } for r in thread.replies]
    
    return {
        "id": thread.id,
        "user_id": thread.user_id,
        "title": thread.title,
        "content": thread.content,
        "category": thread.category,
        "created_at": thread.created_at,
        "author_username": thread.author.username,
        "reply_count": len(replies),
        "replies": replies
    }


@router.post("/threads/{thread_id}/replies", response_model=ReplyResponse, status_code=status.HTTP_201_CREATED)
def create_reply(
    thread_id: int,
    reply: ReplyCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Add a reply to a thread"""
    # Check thread exists
    thread = db.query(ForumThread).filter(ForumThread.id == thread_id).first()
    if not thread:
        raise HTTPException(status_code=404, detail="Thread not found")
    
    db_reply = ForumReply(
        thread_id=thread_id,
        user_id=current_user.id,
        content=reply.content
    )
    db.add(db_reply)
    db.commit()
    db.refresh(db_reply)
    
    return {
        "id": db_reply.id,
        "thread_id": db_reply.thread_id,
        "user_id": db_reply.user_id,
        "content": db_reply.content,
        "created_at": db_reply.created_at,
        "author_username": current_user.username
    }


@router.delete("/threads/{thread_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_thread(
    thread_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Delete a thread (author only)"""
    thread = db.query(ForumThread).filter(
        ForumThread.id == thread_id,
        ForumThread.user_id == current_user.id
    ).first()
    
    if not thread:
        raise HTTPException(status_code=404, detail="Thread not found or not authorized")
    
    db.delete(thread)
    db.commit()
