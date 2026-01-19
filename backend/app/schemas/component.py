from pydantic import BaseModel
from datetime import datetime
from typing import Optional, List, Any
from decimal import Decimal


# Category Schemas
class CategoryBase(BaseModel):
    name: str
    slug: str
    description: Optional[str] = None
    icon: Optional[str] = None


class CategoryCreate(CategoryBase):
    pass


class CategoryResponse(CategoryBase):
    id: int
    
    class Config:
        from_attributes = True


# Vendor Schemas
class VendorBase(BaseModel):
    name: str
    website: Optional[str] = None
    logo_url: Optional[str] = None


class VendorCreate(VendorBase):
    pass


class VendorResponse(VendorBase):
    id: int
    
    class Config:
        from_attributes = True


# Component Price Schemas
class ComponentPriceBase(BaseModel):
    price: Decimal
    in_stock: bool = True
    url: Optional[str] = None


class ComponentPriceCreate(ComponentPriceBase):
    component_id: int
    vendor_id: int


class ComponentPriceResponse(ComponentPriceBase):
    id: int
    vendor: VendorResponse
    updated_at: datetime
    
    class Config:
        from_attributes = True


# Component Schemas
class ComponentBase(BaseModel):
    name: str
    brand: Optional[str] = None
    specs: Optional[dict] = None
    image_url: Optional[str] = None


class ComponentCreate(ComponentBase):
    category_id: int


class ComponentResponse(ComponentBase):
    id: int
    category_id: int
    created_at: datetime
    
    class Config:
        from_attributes = True


class ComponentDetailResponse(ComponentResponse):
    category: CategoryResponse
    prices: List[ComponentPriceResponse] = []


# Build Schemas
class BuildBase(BaseModel):
    name: str
    components: Optional[dict] = None  # {category: component_id}


class BuildCreate(BuildBase):
    pass


class BuildResponse(BuildBase):
    id: int
    user_id: int
    total_price: Optional[Decimal] = None
    created_at: datetime
    
    class Config:
        from_attributes = True


# Search & Filter Schemas
class ComponentFilter(BaseModel):
    category: Optional[str] = None
    brand: Optional[str] = None
    min_price: Optional[Decimal] = None
    max_price: Optional[Decimal] = None
    search: Optional[str] = None
