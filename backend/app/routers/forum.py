from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, status
from supabase import Client
from ..database import get_db
from ..utils.auth import get_current_user, get_current_user_optional

router = APIRouter(prefix="/api/forum", tags=["Forum"])


@router.get("/threads")
def get_threads(
    category: Optional[str] = None,
    search: Optional[str] = None,
    skip: int = 0,
    limit: int = 20,
    db: Client = Depends(get_db),
):
    """Get forum threads with author info and reply counts"""
    query = db.table("forum_threads").select(
        "*, author:users!forum_threads_user_id_fkey(username, email), replies:forum_replies(id)"
    )

    if category:
        query = query.eq("category", category)

    if search:
        query = query.ilike("title", f"%{search}%")

    result = query.order("created_at", desc=True).range(skip, skip + limit - 1).execute()

    # Transform to include reply_count and author_username
    threads = []
    for t in result.data or []:
        threads.append({
            "id": t["id"],
            "user_id": t["user_id"],
            "title": t["title"],
            "content": t["content"],
            "category": t["category"],
            "created_at": t["created_at"],
            "upvotes": t.get("upvotes", 0),
            "downvotes": t.get("downvotes", 0),
            "author_username": t.get("author", {}).get("username", "Anonymous"),
            "reply_count": len(t.get("replies", [])),
        })

    return threads


@router.post("/threads", status_code=status.HTTP_201_CREATED)
async def create_thread(
    thread: dict,
    current_user: dict = Depends(get_current_user),
    db: Client = Depends(get_db),
):
    """Create a new forum thread"""
    result = db.table("forum_threads").insert({
        "user_id": current_user["id"],
        "title": thread["title"],
        "content": thread["content"],
        "category": thread.get("category", "Discussion"),
        "upvotes": 0,
        "downvotes": 0,
    }).execute()

    if not result.data:
        raise HTTPException(status_code=500, detail="Failed to create thread")

    t = result.data[0]
    t["author_username"] = current_user["username"]
    t["reply_count"] = 0
    return t


@router.get("/threads/{thread_id}")
def get_thread(thread_id: int, db: Client = Depends(get_db)):
    """Get thread with all replies"""
    thread = (
        db.table("forum_threads")
        .select("*, author:users!forum_threads_user_id_fkey(username)")
        .eq("id", thread_id)
        .single()
        .execute()
    )

    if not thread.data:
        raise HTTPException(status_code=404, detail="Thread not found")

    # Get replies with authors
    replies = (
        db.table("forum_replies")
        .select("*, author:users!forum_replies_user_id_fkey(username)")
        .eq("thread_id", thread_id)
        .order("created_at")
        .execute()
    )

    t = thread.data
    reply_list = []
    for r in replies.data or []:
        reply_list.append({
            "id": r["id"],
            "thread_id": r["thread_id"],
            "user_id": r["user_id"],
            "content": r["content"],
            "created_at": r["created_at"],
            "upvotes": r.get("upvotes", 0),
            "downvotes": r.get("downvotes", 0),
            "author_username": r.get("author", {}).get("username", "Anonymous"),
        })

    return {
        "id": t["id"],
        "user_id": t["user_id"],
        "title": t["title"],
        "content": t["content"],
        "category": t["category"],
        "created_at": t["created_at"],
        "upvotes": t.get("upvotes", 0),
        "downvotes": t.get("downvotes", 0),
        "author_username": t.get("author", {}).get("username", "Anonymous"),
        "reply_count": len(reply_list),
        "replies": reply_list,
    }


@router.post("/threads/{thread_id}/replies", status_code=status.HTTP_201_CREATED)
async def create_reply(
    thread_id: int,
    reply: dict,
    current_user: dict = Depends(get_current_user),
    db: Client = Depends(get_db),
):
    """Add a reply to a thread"""
    # Verify thread exists
    thread = db.table("forum_threads").select("id").eq("id", thread_id).single().execute()
    if not thread.data:
        raise HTTPException(status_code=404, detail="Thread not found")

    result = db.table("forum_replies").insert({
        "thread_id": thread_id,
        "user_id": current_user["id"],
        "content": reply["content"],
        "upvotes": 0,
        "downvotes": 0,
    }).execute()

    if not result.data:
        raise HTTPException(status_code=500, detail="Failed to create reply")

    r = result.data[0]
    r["author_username"] = current_user["username"]
    return r


@router.post("/threads/{thread_id}/vote")
async def vote_thread(
    thread_id: int,
    body: dict,
    current_user: dict = Depends(get_current_user),
    db: Client = Depends(get_db),
):
    """Upvote or downvote a thread. body: { "vote": "up" | "down" }"""
    vote_type = body.get("vote", "up")
    thread = db.table("forum_threads").select("id, upvotes, downvotes").eq("id", thread_id).single().execute()

    if not thread.data:
        raise HTTPException(status_code=404, detail="Thread not found")

    update = {}
    if vote_type == "up":
        update["upvotes"] = (thread.data.get("upvotes") or 0) + 1
    else:
        update["downvotes"] = (thread.data.get("downvotes") or 0) + 1

    db.table("forum_threads").update(update).eq("id", thread_id).execute()
    return {"success": True, **update}


@router.post("/replies/{reply_id}/vote")
async def vote_reply(
    reply_id: int,
    body: dict,
    current_user: dict = Depends(get_current_user),
    db: Client = Depends(get_db),
):
    """Upvote or downvote a reply"""
    vote_type = body.get("vote", "up")
    reply = db.table("forum_replies").select("id, upvotes, downvotes").eq("id", reply_id).single().execute()

    if not reply.data:
        raise HTTPException(status_code=404, detail="Reply not found")

    update = {}
    if vote_type == "up":
        update["upvotes"] = (reply.data.get("upvotes") or 0) + 1
    else:
        update["downvotes"] = (reply.data.get("downvotes") or 0) + 1

    db.table("forum_replies").update(update).eq("id", reply_id).execute()
    return {"success": True, **update}


@router.delete("/threads/{thread_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_thread(
    thread_id: int,
    current_user: dict = Depends(get_current_user),
    db: Client = Depends(get_db),
):
    """Delete a thread (author only)"""
    result = (
        db.table("forum_threads")
        .delete()
        .eq("id", thread_id)
        .eq("user_id", current_user["id"])
        .execute()
    )
    if not result.data:
        raise HTTPException(status_code=404, detail="Thread not found or not authorized")
