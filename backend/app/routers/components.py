from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import or_
from ..database import get_db
from ..models.component import Category, Component, Vendor, ComponentPrice, Build
from ..models.user import User
from ..schemas.component import (
    CategoryResponse, CategoryCreate,
    ComponentResponse, ComponentCreate, ComponentDetailResponse,
    VendorResponse, VendorCreate,
    BuildResponse, BuildCreate
)
from ..utils.auth import get_current_user

router = APIRouter(prefix="/api", tags=["Components"])


# ========== Categories ==========
@router.get("/categories", response_model=List[CategoryResponse])
def get_categories(db: Session = Depends(get_db)):
    """Get all component categories"""
    return db.query(Category).all()


@router.post("/categories", response_model=CategoryResponse, status_code=status.HTTP_201_CREATED)
def create_category(category: CategoryCreate, db: Session = Depends(get_db)):
    """Create a new category (admin only in production)"""
    db_category = Category(**category.model_dump())
    db.add(db_category)
    db.commit()
    db.refresh(db_category)
    return db_category


# ========== Components ==========
@router.get("/components", response_model=List[ComponentResponse])
def get_components(
    category: Optional[str] = None,
    brand: Optional[str] = None,
    min_price: Optional[float] = None,
    max_price: Optional[float] = None,
    search: Optional[str] = None,
    sort: str = Query("price-low", regex="^(price-low|price-high|name)$"),
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db)
):
    """Get components with optional filters"""
    query = db.query(Component).options(joinedload(Component.category))
    
    # Filter by category
    if category:
        query = query.join(Category).filter(Category.slug == category)
    
    # Filter by brand
    if brand:
        query = query.filter(Component.brand == brand)
    
    # Search by name
    if search:
        query = query.filter(Component.name.ilike(f"%{search}%"))
    
    # Price filtering would require joining with prices
    # For now, we'll handle this in a more complex query if needed
    
    # Sorting
    if sort == "name":
        query = query.order_by(Component.name)
    
    return query.offset(skip).limit(limit).all()


@router.get("/components/{component_id}", response_model=ComponentDetailResponse)
def get_component(component_id: int, db: Session = Depends(get_db)):
    """Get component details with prices"""
    component = db.query(Component).options(
        joinedload(Component.category),
        joinedload(Component.prices).joinedload(ComponentPrice.vendor)
    ).filter(Component.id == component_id).first()
    
    if not component:
        raise HTTPException(status_code=404, detail="Component not found")
    
    return component


@router.post("/components", response_model=ComponentResponse, status_code=status.HTTP_201_CREATED)
def create_component(component: ComponentCreate, db: Session = Depends(get_db)):
    """Create a new component"""
    db_component = Component(**component.model_dump())
    db.add(db_component)
    db.commit()
    db.refresh(db_component)
    return db_component


# ========== Vendors ==========
@router.get("/vendors", response_model=List[VendorResponse])
def get_vendors(db: Session = Depends(get_db)):
    """Get all vendors"""
    return db.query(Vendor).all()


@router.post("/vendors", response_model=VendorResponse, status_code=status.HTTP_201_CREATED)
def create_vendor(vendor: VendorCreate, db: Session = Depends(get_db)):
    """Create a new vendor"""
    db_vendor = Vendor(**vendor.model_dump())
    db.add(db_vendor)
    db.commit()
    db.refresh(db_vendor)
    return db_vendor


# ========== Builds ==========
@router.get("/builds", response_model=List[BuildResponse])
def get_builds(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get current user's saved builds"""
    return db.query(Build).filter(Build.user_id == current_user.id).all()


@router.post("/builds", response_model=BuildResponse, status_code=status.HTTP_201_CREATED)
def create_build(
    build: BuildCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Save a new build"""
    # Calculate total price from components
    total_price = 0
    if build.components:
        for category, component_id in build.components.items():
            component = db.query(Component).filter(Component.id == component_id).first()
            if component:
                # Get lowest price for this component
                lowest_price = db.query(ComponentPrice).filter(
                    ComponentPrice.component_id == component_id
                ).order_by(ComponentPrice.price).first()
                if lowest_price:
                    total_price += float(lowest_price.price)
    
    db_build = Build(
        user_id=current_user.id,
        name=build.name,
        components=build.components,
        total_price=total_price
    )
    db.add(db_build)
    db.commit()
    db.refresh(db_build)
    return db_build


@router.delete("/builds/{build_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_build(
    build_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Delete a build"""
    build = db.query(Build).filter(
        Build.id == build_id,
        Build.user_id == current_user.id
    ).first()
    
    if not build:
        raise HTTPException(status_code=404, detail="Build not found")
    
    db.delete(build)
    db.commit()


# ========== Statistics ==========
@router.get("/stats")
def get_stats(db: Session = Depends(get_db)):
    """Get platform statistics"""
    return {
        "categories": db.query(Category).count(),
        "components": db.query(Component).count(),
        "vendors": db.query(Vendor).count()
    }
