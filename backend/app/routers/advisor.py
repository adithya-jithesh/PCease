from fastapi import APIRouter, Depends, HTTPException
from supabase import Client
from ..database import get_db
from ..config import settings
from typing import Dict, List, Optional

router = APIRouter(prefix="/api/advisor", tags=["AI Advisor"])


# ========== Budget Allocation by Use Case ==========
# Percentages for each category based on use case
BUDGET_ALLOCATION = {
    "gaming": {
        "gpu": 0.38,       # Gaming prioritizes GPU
        "cpu": 0.18,
        "motherboard": 0.12,
        "ram": 0.08,
        "storage": 0.08,
        "psu": 0.08,
        "case": 0.05,
        "cooler": 0.03,
    },
    "content": {
        "cpu": 0.28,       # Content creation prioritizes CPU
        "gpu": 0.25,
        "ram": 0.15,
        "motherboard": 0.12,
        "storage": 0.10,
        "psu": 0.05,
        "case": 0.03,
        "cooler": 0.02,
    },
    "productivity": {
        "cpu": 0.25,
        "motherboard": 0.18,
        "ram": 0.15,
        "storage": 0.18,
        "gpu": 0.10,       # Light GPU needs
        "psu": 0.07,
        "case": 0.05,
        "cooler": 0.02,
    },
    "streaming": {
        "gpu": 0.35,       # Good GPU for encoding
        "cpu": 0.22,
        "ram": 0.12,
        "motherboard": 0.12,
        "storage": 0.08,
        "psu": 0.06,
        "case": 0.03,
        "cooler": 0.02,
    },
}

# Category IDs mapping
CATEGORY_IDS = {
    "cpu": 1,
    "gpu": 2,
    "motherboard": 3,
    "ram": 4,
    "storage": 5,
    "psu": 6,
    "case": 7,
    "cooler": 8,
}

# Essential categories (must have)
ESSENTIAL_CATEGORIES = ["cpu", "gpu", "motherboard", "ram", "storage", "psu", "case"]


def _get_lowest_price(component: dict) -> float:
    """Get lowest price from component's prices"""
    prices = component.get("prices", [])
    if not prices:
        return float("inf")
    return min(float(p["price"]) for p in prices)


def _score_component(component: dict, category: str, use_case: str) -> float:
    """Score a component based on specs for ranking (higher = better)"""
    specs = component.get("specifications", {}) or {}
    score = 0.0
    
    if category == "cpu":
        cores = specs.get("cores", 4)
        score = cores * 10
        boost = specs.get("boost_clock", "")
        if "5." in str(boost): score += 50
        elif "4." in str(boost): score += 30
        
    elif category == "gpu":
        memory = str(specs.get("memory", specs.get("vram", "4")))
        try:
            mem_gb = int(''.join(c for c in memory if c.isdigit())[:2])
            score = mem_gb * 20
        except:
            score = 40
            
    elif category == "ram":
        capacity = str(specs.get("capacity", "8"))
        try:
            cap_gb = int(''.join(c for c in capacity if c.isdigit())[:2])
            score = cap_gb * 5
        except:
            score = 20
        if "DDR5" in str(specs.get("type", "")):
            score += 30
            
    elif category == "storage":
        capacity = str(specs.get("capacity", "256"))
        if "TB" in capacity.upper() or "1000" in capacity or "2000" in capacity:
            score = 100
        elif "512" in capacity or "500" in capacity:
            score = 60
        else:
            score = 30
        if "NVMe" in str(specs.get("type", "")):
            score += 20
            
    elif category == "psu":
        wattage = specs.get("wattage", 500)
        try:
            watts = int(str(wattage).replace("W", "").strip())
            score = watts / 10
        except:
            score = 50
        if "Gold" in str(specs.get("efficiency", "")):
            score += 20
            
    elif category == "motherboard":
        if specs.get("wifi"): score += 20
        if "ATX" in str(specs.get("form_factor", "")):
            score += 15
        ram_slots = specs.get("ram_slots", 2)
        score += ram_slots * 5
        
    elif category == "case":
        fans = specs.get("fans_included", 0)
        score = fans * 10 + 20
        
    elif category == "cooler":
        tdp = specs.get("tdp_rating", 150)
        try:
            tdp_val = int(str(tdp).replace("W", "").strip())
            score = tdp_val / 5
        except:
            score = 30
    
    return score


def _build_smart_recommendation(budget: int, use_case: str, db: Client) -> dict:
    """Build a smart recommendation from actual database components"""
    allocation = BUDGET_ALLOCATION.get(use_case, BUDGET_ALLOCATION["gaming"])
    
    selected_components = []
    total_price = 0
    
    # Calculate budget for each category upfront
    category_budgets = {cat: int(budget * pct) for cat, pct in allocation.items()}
    
    # First pass: select best component within allocated budget for each category
    for category in ESSENTIAL_CATEGORIES + ["cooler"]:
        cat_id = CATEGORY_IDS.get(category)
        if not cat_id:
            continue
        
        cat_budget = category_budgets.get(category, int(budget * 0.05))
        
        # Fetch components in this category with prices
        result = db.table("components").select(
            "id, name, brand, specifications, prices:component_prices(price, vendor:vendors(name))"
        ).eq("category_id", cat_id).execute()
        
        components = result.data or []
        
        # Filter to components within budget and sort by score
        affordable = []
        for comp in components:
            lowest = _get_lowest_price(comp)
            if lowest <= cat_budget and lowest < float("inf"):
                score = _score_component(comp, category, use_case)
                affordable.append((comp, lowest, score))
        
        # If nothing affordable, try to find the cheapest option regardless of allocation
        if not affordable:
            for comp in components:
                lowest = _get_lowest_price(comp)
                if lowest < float("inf") and (total_price + lowest) <= budget:
                    score = _score_component(comp, category, use_case)
                    affordable.append((comp, lowest, score))
        
        # Sort by score descending, then by price ascending for same score
        affordable.sort(key=lambda x: (-x[2], x[1]))
        
        if affordable:
            best_comp, price, score = affordable[0]
            specs = best_comp.get("specifications", {}) or {}
            
            # Get best vendor info
            prices = best_comp.get("prices", [])
            vendor_name = "Various"
            if prices:
                sorted_prices = sorted(prices, key=lambda p: float(p["price"]))
                vendor_name = sorted_prices[0].get("vendor", {}).get("name", "Various")
            
            selected_components.append({
                "category": category.upper(),
                "name": best_comp["name"],
                "brand": best_comp.get("brand", ""),
                "price": int(price),
                "vendor": vendor_name,
                "specs": specs,
                "component_id": best_comp["id"],
            })
            total_price += int(price)
    
    # Second pass: if we have budget left, try to upgrade components
    remaining = budget - total_price
    if remaining > 5000:  # Only upgrade if significant budget remains
        for i, comp in enumerate(selected_components):
            if remaining <= 2000:
                break
                
            cat = comp["category"].lower()
            cat_id = CATEGORY_IDS.get(cat)
            if not cat_id:
                continue
            
            current_price = comp["price"]
            max_upgrade_price = current_price + remaining - 1000  # Keep some buffer
            
            # Find better component within upgrade budget
            result = db.table("components").select(
                "id, name, brand, specifications, prices:component_prices(price, vendor:vendors(name))"
            ).eq("category_id", cat_id).execute()
            
            best_upgrade = None
            best_upgrade_score = _score_component({"specifications": comp["specs"]}, cat, use_case)
            
            for candidate in result.data or []:
                cand_price = _get_lowest_price(candidate)
                if current_price < cand_price <= max_upgrade_price:
                    cand_score = _score_component(candidate, cat, use_case)
                    if cand_score > best_upgrade_score:
                        best_upgrade = (candidate, cand_price, cand_score)
                        best_upgrade_score = cand_score
            
            if best_upgrade:
                new_comp, new_price, _ = best_upgrade
                specs = new_comp.get("specifications", {}) or {}
                prices = new_comp.get("prices", [])
                vendor_name = "Various"
                if prices:
                    sorted_prices = sorted(prices, key=lambda p: float(p["price"]))
                    vendor_name = sorted_prices[0].get("vendor", {}).get("name", "Various")
                
                price_diff = int(new_price) - current_price
                total_price += price_diff
                remaining -= price_diff
                
                selected_components[i] = {
                    "category": cat.upper(),
                    "name": new_comp["name"],
                    "brand": new_comp.get("brand", ""),
                    "price": int(new_price),
                    "vendor": vendor_name,
                    "specs": specs,
                    "component_id": new_comp["id"],
                }
    
    # Build description based on use case
    descriptions = {
        "gaming": f"Optimized for gaming within ₹{budget:,}. Prioritizes GPU and CPU performance.",
        "content": f"Built for content creation within ₹{budget:,}. Strong CPU and ample RAM for editing.",
        "productivity": f"Productivity-focused build within ₹{budget:,}. Reliable and efficient.",
        "streaming": f"Streaming-ready build within ₹{budget:,}. Great for gaming and broadcasting.",
    }
    
    return {
        "title": f"Smart {use_case.title()} Build",
        "description": descriptions.get(use_case, f"Custom build within ₹{budget:,}"),
        "budget": budget,
        "total": total_price,
        "within_budget": total_price <= budget,
        "savings": max(0, budget - total_price),
        "components": selected_components,
        "source": "smart",
        "tips": [
            "Prices may vary. Check individual retailers for current offers.",
            "Consider adding a CPU cooler if not included or for better thermals.",
            "You can upgrade individual components later as budget allows.",
        ],
    }


@router.get("/templates")
def get_templates(db: Client = Depends(get_db)):
    """Get pre-built PC templates for common budget ranges"""
    # Generate templates dynamically from database
    templates = {}
    budgets = [
        ("gaming-budget", 40000, "gaming", "Budget Gaming Build"),
        ("gaming-mid", 75000, "gaming", "Mid-Range Gaming Build"),
        ("gaming-high", 150000, "gaming", "High-End Gaming Build"),
        ("content", 100000, "content", "Content Creation Build"),
        ("productivity", 45000, "productivity", "Productivity Build"),
        ("streaming", 120000, "streaming", "Streaming Build"),
    ]
    
    for template_id, budget, use_case, name in budgets:
        result = _build_smart_recommendation(budget, use_case, db)
        result["name"] = name
        result["template_id"] = template_id
        templates[template_id] = result
    
    return templates


@router.get("/templates/{template_id}")
def get_template(template_id: str, db: Client = Depends(get_db)):
    """Get a specific template"""
    template_map = {
        "gaming-budget": (40000, "gaming", "Budget Gaming Build"),
        "gaming-mid": (75000, "gaming", "Mid-Range Gaming Build"),
        "gaming-high": (150000, "gaming", "High-End Gaming Build"),
        "content": (100000, "content", "Content Creation Build"),
        "productivity": (45000, "productivity", "Productivity Build"),
        "streaming": (120000, "streaming", "Streaming Build"),
    }
    
    if template_id not in template_map:
        raise HTTPException(status_code=404, detail="Template not found")
    
    budget, use_case, name = template_map[template_id]
    result = _build_smart_recommendation(budget, use_case, db)
    result["name"] = name
    result["template_id"] = template_id
    return result


# ========== AI Recommendation ==========
@router.post("/recommend")
async def get_recommendation(body: dict, db: Client = Depends(get_db)):
    """
    Get AI-powered PC build recommendation.
    body: { budget: number, use_case: string, preferences?: string }
    """
    budget = body.get("budget", 50000)
    use_case = body.get("use_case", "gaming")
    preferences = body.get("preferences", "")

    # If Gemini API key is set, use real AI
    if settings.gemini_api_key:
        try:
            import google.generativeai as genai

            genai.configure(api_key=settings.gemini_api_key)
            model = genai.GenerativeModel("gemini-1.5-flash")

            prompt = f"""You are an expert PC building advisor for India. 
Recommend a PC build based on:
- Budget: ₹{budget:,}
- Use Case: {use_case}
- Preferences: {preferences or 'None specified'}

Return a JSON response (no markdown, just raw JSON) with this exact structure:
{{
    "title": "Build name",
    "description": "2-3 sentence description",
    "components": [
        {{"category": "CPU", "name": "Exact product name", "price": estimated_price_inr, "reason": "Why this component"}},
        {{"category": "GPU", "name": "...", "price": ..., "reason": "..."}},
        {{"category": "RAM", "name": "...", "price": ..., "reason": "..."}},
        {{"category": "Motherboard", "name": "...", "price": ..., "reason": "..."}},
        {{"category": "Storage", "name": "...", "price": ..., "reason": "..."}},
        {{"category": "PSU", "name": "...", "price": ..., "reason": "..."}},
        {{"category": "Case", "name": "...", "price": ..., "reason": "..."}}
    ],
    "total": total_price,
    "tips": ["tip1", "tip2", "tip3"],
    "performance_notes": "Expected performance description"
}}

Use real Indian market prices (2025-2026). Stay within budget. Include only components available in India."""

            response = model.generate_content(prompt)
            text = response.text.strip()

            # Clean up markdown code blocks if present
            if text.startswith("```"):
                text = text.split("\n", 1)[1]
            if text.endswith("```"):
                text = text.rsplit("```", 1)[0]
            if text.startswith("json"):
                text = text[4:]

            import json
            return json.loads(text.strip())
        except Exception as e:
            # Fall back to smart database-based recommendation
            pass

    # Fallback: smart database-based recommendation
    return _build_smart_recommendation(budget, use_case, db)


@router.post("/ask")
async def ask_ai(body: dict):
    """
    Ask AI a PC building question.
    body: { question: string }
    """
    question = body.get("question", "")
    if not question:
        raise HTTPException(status_code=400, detail="Question is required")

    if settings.gemini_api_key:
        try:
            import google.generativeai as genai

            genai.configure(api_key=settings.gemini_api_key)
            model = genai.GenerativeModel("gemini-1.5-flash")

            prompt = f"""You are PCease AI, an expert PC building assistant focused on the Indian market.
Answer this question concisely and helpfully. Use Indian prices (₹) and Indian retailers when relevant.
Keep responses under 300 words. Use bullet points for lists.

Question: {question}"""

            response = model.generate_content(prompt)
            return {"answer": response.text, "source": "ai"}
        except Exception:
            pass

    # Fallback
    return {
        "answer": "I'm currently unable to process AI queries. Please try again later or check the pre-built templates for recommendations.",
        "source": "fallback",
    }


# ========== Wattage Calculator ==========
@router.post("/wattage")
def calculate_wattage(body: dict, db: Client = Depends(get_db)):
    """
    Calculate estimated wattage for a build.
    body: { components: { category: component_id } }
    """
    components = body.get("components", {})
    component_ids = [int(cid) for cid in components.values() if cid]
    
    # TDP estimates by category (in watts)
    default_tdp = {
        "cpu": 65,
        "gpu": 150,
        "ram": 5,
        "motherboard": 50,
        "storage": 10,
        "pcCase": 0,
        "monitor": 0,
        "case": 0,
        "cooler": 15,
        "fans": 5,
    }

    # Batch fetch all components
    comp_map = {}
    if component_ids:
        result = db.table("components").select("id, name, specs").in_("id", component_ids).execute()
        comp_map = {c["id"]: c for c in (result.data or [])}

    total_tdp = 0
    breakdown = []

    for cat, comp_id in components.items():
        comp_data = comp_map.get(int(comp_id)) if comp_id else None
        # Normalize category key (e.g., ram_extra_0 -> ram)
        base_cat = cat.split('_')[0] if '_' in cat else cat
        tdp = default_tdp.get(base_cat, 10)

        if comp_data and comp_data.get("specs"):
            specs = comp_data["specs"]
            if "tdp" in specs:
                try:
                    tdp = int(str(specs["tdp"]).replace("W", "").strip())
                except ValueError:
                    pass

        total_tdp += tdp
        breakdown.append({
            "category": cat,
            "name": comp_data["name"] if comp_data else "Unknown",
            "wattage": tdp,
        })

    # Add 20% headroom and round to nearest 50W
    recommended_psu = ((int(total_tdp * 1.2) + 49) // 50) * 50

    return {
        "total_tdp": total_tdp,
        "recommended_psu": recommended_psu,
        "breakdown": breakdown,
        "headroom_percent": 20,
    }


# ========== Bottleneck Check ==========
@router.post("/bottleneck")
def check_bottleneck(body: dict, db: Client = Depends(get_db)):
    """
    Basic CPU-GPU bottleneck analysis.
    body: { cpu_id: int, gpu_id: int }
    """
    cpu_id = body.get("cpu_id")
    gpu_id = body.get("gpu_id")

    if not cpu_id or not gpu_id:
        raise HTTPException(status_code=400, detail="Both cpu_id and gpu_id are required")

    cpu = db.table("components").select("name, specs, brand").eq("id", cpu_id).single().execute()
    gpu = db.table("components").select("name, specs, brand").eq("id", gpu_id).single().execute()

    if not cpu.data or not gpu.data:
        raise HTTPException(status_code=404, detail="Component not found")

    # Simple tier-based bottleneck analysis
    cpu_tier = _get_cpu_tier(cpu.data)
    gpu_tier = _get_gpu_tier(gpu.data)

    diff = abs(cpu_tier - gpu_tier)
    if diff <= 1:
        status_msg = "balanced"
        message = "Great pairing! Your CPU and GPU are well balanced."
        severity = "good"
    elif cpu_tier < gpu_tier:
        status_msg = "cpu_bottleneck"
        message = f"Your CPU ({cpu.data['name']}) may bottleneck the GPU. Consider upgrading the CPU."
        severity = "warning" if diff <= 2 else "critical"
    else:
        status_msg = "gpu_bottleneck"
        message = f"Your GPU ({gpu.data['name']}) may bottleneck the CPU. Consider upgrading the GPU."
        severity = "warning" if diff <= 2 else "critical"

    return {
        "status": status_msg,
        "message": message,
        "severity": severity,
        "cpu": {"name": cpu.data["name"], "tier": cpu_tier},
        "gpu": {"name": gpu.data["name"], "tier": gpu_tier},
    }


def _get_cpu_tier(cpu: dict) -> int:
    """Rate CPU on a 1-5 scale based on name heuristics"""
    name = (cpu.get("name") or "").lower()
    if any(x in name for x in ["9900", "9950", "7950", "7900", "14900", "13900"]):
        return 5
    if any(x in name for x in ["7800", "7700", "14700", "13700", "9700"]):
        return 4
    if any(x in name for x in ["7600", "5600", "14600", "13600", "12600"]):
        return 3
    if any(x in name for x in ["5500", "12400", "13400", "14400"]):
        return 2
    return 1


def _get_gpu_tier(gpu: dict) -> int:
    """Rate GPU on a 1-5 scale based on name heuristics"""
    name = (gpu.get("name") or "").lower()
    if any(x in name for x in ["4090", "4080", "7900 xtx", "7900 xt"]):
        return 5
    if any(x in name for x in ["4070 ti", "4070 super", "7800 xt"]):
        return 4
    if any(x in name for x in ["4060 ti", "4070", "7700 xt", "6800"]):
        return 3
    if any(x in name for x in ["4060", "6700", "7600"]):
        return 2
    return 1

