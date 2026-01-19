from pydantic import BaseModel
from datetime import datetime
from typing import Optional, List


# Thread Schemas
class ThreadBase(BaseModel):
    title: str
    content: str
    category: Optional[str] = None


class ThreadCreate(ThreadBase):
    pass


class ThreadResponse(ThreadBase):
    id: int
    user_id: int
    created_at: datetime
    author_username: Optional[str] = None
    reply_count: int = 0
    
    class Config:
        from_attributes = True


# Reply Schemas
class ReplyBase(BaseModel):
    content: str


class ReplyCreate(ReplyBase):
    pass


class ReplyResponse(ReplyBase):
    id: int
    thread_id: int
    user_id: int
    created_at: datetime
    author_username: Optional[str] = None
    
    class Config:
        from_attributes = True


class ThreadDetailResponse(ThreadResponse):
    replies: List[ReplyResponse] = []
