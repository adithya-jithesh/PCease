from typing import Optional, List
from fastapi import APIRouter, Depends, HTTPException, status, Query
from supabase import Client
from ..database import get_db
from ..utils.auth import get_current_user, get_current_user_optional

router = APIRouter(prefix="/api", tags=["Components"])


# ========== Categories ==========
@router.get("/categories")
def get_categories(db: Client = Depends(get_db)):
    """Get all component categories"""
    result = db.table("categories").select("*").order("name").execute()
    return result.data


# ========== Components ==========
@router.get("/components")
def get_components(
    category: Optional[str] = None,
    brand: Optional[str] = None,
    search: Optional[str] = None,
    sort: str = Query("price-low", pattern="^(price-low|price-high|name)$"),
    skip: int = 0,
    limit: int = 100,
    db: Client = Depends(get_db),
):
    """Get components with filters. Returns components with nested category and prices."""
    query = db.table("components").select(
        "*, category:categories(*), prices:component_prices(*, vendor:vendors(*))"
    )

    if category:
        # Look up category id by slug
        cat = db.table("categories").select("id").eq("slug", category).single().execute()
        if cat.data:
            query = query.eq("category_id", cat.data["id"])

    if brand:
        query = query.ilike("brand", f"%{brand}%")

    if search:
        query = query.ilike("name", f"%{search}%")

    if sort == "name":
        query = query.order("name")
    else:
        query = query.order("name")  # price sorting done client-side due to join

    result = query.range(skip, skip + limit - 1).execute()
    components = result.data or []

    # Sort by price if needed
    if sort in ("price-low", "price-high"):
        def get_min_price(comp):
            prices = comp.get("prices", [])
            if not prices:
                return float("inf") if sort == "price-low" else 0
            return min(float(p["price"]) for p in prices)

        components.sort(key=get_min_price, reverse=(sort == "price-high"))

    return components


@router.get("/components/{component_id}")
def get_component(component_id: int, db: Client = Depends(get_db)):
    """Get component details with prices and vendor info"""
    result = (
        db.table("components")
        .select("*, category:categories(*), prices:component_prices(*, vendor:vendors(*))")
        .eq("id", component_id)
        .single()
        .execute()
    )

    if not result.data:
        raise HTTPException(status_code=404, detail="Component not found")

    return result.data


# ========== Vendors ==========
@router.get("/vendors")
def get_vendors(db: Client = Depends(get_db)):
    """Get all vendors"""
    result = db.table("vendors").select("*").order("name").execute()
    return result.data


# ========== Builds ==========
@router.get("/builds")
async def get_builds(
    current_user: dict = Depends(get_current_user),
    db: Client = Depends(get_db),
):
    """Get current user's saved builds"""
    result = db.table("builds").select("*").eq("user_id", current_user["id"]).order("created_at", desc=True).execute()
    return result.data


@router.post("/builds", status_code=status.HTTP_201_CREATED)
async def create_build(
    build: dict,
    current_user: dict = Depends(get_current_user),
    db: Client = Depends(get_db),
):
    """Save a new build"""
    # Calculate total price
    total_price = 0
    components = build.get("components", {})
    for _cat, component_id in components.items():
        prices = (
            db.table("component_prices")
            .select("price")
            .eq("component_id", component_id)
            .order("price")
            .limit(1)
            .execute()
        )
        if prices.data:
            total_price += float(prices.data[0]["price"])

    result = db.table("builds").insert({
        "user_id": current_user["id"],
        "name": build.get("name", "My Build"),
        "components": components,
        "total_price": total_price,
    }).execute()

    if not result.data:
        raise HTTPException(status_code=500, detail="Failed to save build")

    return result.data[0]


@router.delete("/builds/{build_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_build(
    build_id: int,
    current_user: dict = Depends(get_current_user),
    db: Client = Depends(get_db),
):
    """Delete a build"""
    result = (
        db.table("builds")
        .delete()
        .eq("id", build_id)
        .eq("user_id", current_user["id"])
        .execute()
    )
    if not result.data:
        raise HTTPException(status_code=404, detail="Build not found")


# ========== Shareable Build ==========
@router.post("/builds/share")
def share_build(build: dict, db: Client = Depends(get_db)):
    """Create a shareable build (no auth required). Returns share_id."""
    import uuid

    share_id = str(uuid.uuid4())[:8]
    components = build.get("components", {})

    # Calculate total price
    total_price = 0
    for _cat, component_id in components.items():
        prices = (
            db.table("component_prices")
            .select("price")
            .eq("component_id", component_id)
            .order("price")
            .limit(1)
            .execute()
        )
        if prices.data:
            total_price += float(prices.data[0]["price"])

    result = db.table("shared_builds").insert({
        "share_id": share_id,
        "name": build.get("name", "Shared Build"),
        "components": components,
        "total_price": total_price,
    }).execute()

    if not result.data:
        raise HTTPException(status_code=500, detail="Failed to create shared build")

    return {"share_id": share_id, "build": result.data[0]}


@router.get("/builds/shared/{share_id}")
def get_shared_build(share_id: str, db: Client = Depends(get_db)):
    """Get a shared build by share_id (no auth required)"""
    result = db.table("shared_builds").select("*").eq("share_id", share_id).single().execute()

    if not result.data:
        raise HTTPException(status_code=404, detail="Shared build not found")

    build_data = result.data
    # Resolve component details
    components_detail = {}
    for cat, component_id in (build_data.get("components") or {}).items():
        comp = (
            db.table("components")
            .select("*, category:categories(*), prices:component_prices(*, vendor:vendors(*))")
            .eq("id", component_id)
            .single()
            .execute()
        )
        if comp.data:
            components_detail[cat] = comp.data

    build_data["components_detail"] = components_detail
    return build_data


# ========== Statistics ==========
@router.get("/stats")
def get_stats(db: Client = Depends(get_db)):
    """Get platform statistics"""
    categories = db.table("categories").select("id", count="exact").execute()
    components = db.table("components").select("id", count="exact").execute()
    vendors = db.table("vendors").select("id", count="exact").execute()
    users = db.table("users").select("id", count="exact").execute()

    return {
        "categories": categories.count or 0,
        "components": components.count or 0,
        "vendors": vendors.count or 0,
        "users": users.count or 0,
    }


# ========== Compare ==========
@router.post("/compare")
def compare_components(body: dict, db: Client = Depends(get_db)):
    """Compare multiple components side by side"""
    ids = body.get("ids", [])
    if not ids or len(ids) > 4:
        raise HTTPException(status_code=400, detail="Provide 1-4 component IDs")

    results = []
    for cid in ids:
        comp = (
            db.table("components")
            .select("*, category:categories(*), prices:component_prices(*, vendor:vendors(*))")
            .eq("id", cid)
            .single()
            .execute()
        )
        if comp.data:
            results.append(comp.data)

    return results
