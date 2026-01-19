from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from ..database import Base


class ForumThread(Base):
    __tablename__ = "forum_threads"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    title = Column(String(255), nullable=False)
    content = Column(Text, nullable=False)
    category = Column(String(50))  # Build Help, Troubleshooting, Discussion, etc.
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Relationships
    author = relationship("User", back_populates="threads")
    replies = relationship("ForumReply", back_populates="thread", cascade="all, delete-orphan")


class ForumReply(Base):
    __tablename__ = "forum_replies"
    
    id = Column(Integer, primary_key=True, index=True)
    thread_id = Column(Integer, ForeignKey("forum_threads.id"), nullable=False)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    content = Column(Text, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # Relationships
    thread = relationship("ForumThread", back_populates="replies")
    author = relationship("User", back_populates="replies")
