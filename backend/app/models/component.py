from sqlalchemy import Column, Integer, String, Text, Numeric, Boolean, DateTime, ForeignKey, JSON
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from ..database import Base


class Category(Base):
    __tablename__ = "categories"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), unique=True, nullable=False)
    slug = Column(String(100), unique=True, nullable=False)
    description = Column(Text)
    icon = Column(String(50))  # Abbreviation like CPU, GPU, RAM
    
    # Relationships
    components = relationship("Component", back_populates="category")


class Component(Base):
    __tablename__ = "components"
    
    id = Column(Integer, primary_key=True, index=True)
    category_id = Column(Integer, ForeignKey("categories.id"), nullable=False)
    name = Column(String(255), nullable=False)
    brand = Column(String(100))
    specs = Column(JSON)  # Flexible specs storage
    image_url = Column(String(500))
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # Relationships
    category = relationship("Category", back_populates="components")
    prices = relationship("ComponentPrice", back_populates="component")


class Vendor(Base):
    __tablename__ = "vendors"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), unique=True, nullable=False)
    website = Column(String(255))
    logo_url = Column(String(500))
    
    # Relationships
    prices = relationship("ComponentPrice", back_populates="vendor")


class ComponentPrice(Base):
    __tablename__ = "component_prices"
    
    id = Column(Integer, primary_key=True, index=True)
    component_id = Column(Integer, ForeignKey("components.id"), nullable=False)
    vendor_id = Column(Integer, ForeignKey("vendors.id"), nullable=False)
    price = Column(Numeric(12, 2), nullable=False)
    in_stock = Column(Boolean, default=True)
    url = Column(String(500))
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    
    # Relationships
    component = relationship("Component", back_populates="prices")
    vendor = relationship("Vendor", back_populates="prices")


class Build(Base):
    __tablename__ = "builds"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    name = Column(String(100), nullable=False)
    components = Column(JSON)  # Store component IDs as JSON
    total_price = Column(Numeric(12, 2))
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Relationships
    user = relationship("User", back_populates="builds")
