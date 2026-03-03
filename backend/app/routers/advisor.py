from fastapi import APIRouter, Depends, HTTPException
from supabase import Client
from ..database import get_db
from ..config import settings

router = APIRouter(prefix="/api/advisor", tags=["AI Advisor"])


# ========== Pre-built Templates ==========
TEMPLATES = {
    "gaming-budget": {
        "name": "Budget Gaming Build",
        "budget": 40000,
        "use_case": "gaming",
        "description": "Solid 1080p gaming at 60+ FPS. Great for esports titles and casual gaming.",
        "components": [
            {"category": "CPU", "suggestion": "AMD Ryzen 5 5600", "est_price": 10500},
            {"category": "GPU", "suggestion": "AMD RX 6600", "est_price": 16000},
            {"category": "RAM", "suggestion": "16GB DDR4 3200MHz", "est_price": 2800},
            {"category": "Motherboard", "suggestion": "B550M Pro-VDH", "est_price": 7500},
            {"category": "Storage", "suggestion": "500GB NVMe SSD", "est_price": 3000},
            {"category": "PSU", "suggestion": "500W 80+ Bronze", "est_price": 3200},
            {"category": "Case", "suggestion": "Ant Esports ICE-100", "est_price": 2500},
        ],
    },
    "gaming-mid": {
        "name": "Mid-Range Gaming Build",
        "budget": 75000,
        "use_case": "gaming",
        "description": "1080p Ultra / 1440p High gaming. Handles AAA titles with ease.",
        "components": [
            {"category": "CPU", "suggestion": "AMD Ryzen 5 7600", "est_price": 16000},
            {"category": "GPU", "suggestion": "NVIDIA RTX 4060 Ti", "est_price": 33000},
            {"category": "RAM", "suggestion": "16GB DDR5 5600MHz", "est_price": 4500},
            {"category": "Motherboard", "suggestion": "B650 Gaming Plus", "est_price": 14000},
            {"category": "Storage", "suggestion": "1TB NVMe Gen4 SSD", "est_price": 5500},
            {"category": "PSU", "suggestion": "650W 80+ Gold", "est_price": 5500},
            {"category": "Case", "suggestion": "Deepcool CH510", "est_price": 4500},
        ],
    },
    "gaming-high": {
        "name": "High-End Gaming Build",
        "budget": 150000,
        "use_case": "gaming",
        "description": "1440p Ultra / 4K gaming with ray tracing. Future-proof performance.",
        "components": [
            {"category": "CPU", "suggestion": "AMD Ryzen 7 7800X3D", "est_price": 30000},
            {"category": "GPU", "suggestion": "NVIDIA RTX 4070 Ti Super", "est_price": 62000},
            {"category": "RAM", "suggestion": "32GB DDR5 6000MHz", "est_price": 9000},
            {"category": "Motherboard", "suggestion": "X670E Gaming WiFi", "est_price": 22000},
            {"category": "Storage", "suggestion": "2TB NVMe Gen4 SSD", "est_price": 10000},
            {"category": "PSU", "suggestion": "850W 80+ Gold", "est_price": 8000},
            {"category": "Case", "suggestion": "Lian Li Lancool III", "est_price": 9000},
        ],
    },
    "editing": {
        "name": "Content Creation Build",
        "budget": 100000,
        "use_case": "content",
        "description": "Video editing, 3D rendering, and streaming. High core count and RAM.",
        "components": [
            {"category": "CPU", "suggestion": "AMD Ryzen 9 7900X", "est_price": 32000},
            {"category": "GPU", "suggestion": "NVIDIA RTX 4060 Ti", "est_price": 33000},
            {"category": "RAM", "suggestion": "64GB DDR5 5200MHz", "est_price": 14000},
            {"category": "Motherboard", "suggestion": "B650 Aorus Elite", "est_price": 16000},
            {"category": "Storage", "suggestion": "2TB NVMe Gen4 SSD", "est_price": 10000},
            {"category": "PSU", "suggestion": "750W 80+ Gold", "est_price": 7000},
            {"category": "Case", "suggestion": "Fractal Design Pop Air", "est_price": 6000},
        ],
    },
    "productivity": {
        "name": "Productivity Build",
        "budget": 45000,
        "use_case": "productivity",
        "description": "Office work, multitasking, coding. Reliable and efficient.",
        "components": [
            {"category": "CPU", "suggestion": "Intel Core i5-12400", "est_price": 12000},
            {"category": "GPU", "suggestion": "Integrated UHD 730", "est_price": 0},
            {"category": "RAM", "suggestion": "16GB DDR4 3200MHz", "est_price": 2800},
            {"category": "Motherboard", "suggestion": "B660M DS3H", "est_price": 8000},
            {"category": "Storage", "suggestion": "512GB NVMe SSD + 1TB HDD", "est_price": 5000},
            {"category": "PSU", "suggestion": "450W 80+ Bronze", "est_price": 2800},
            {"category": "Case", "suggestion": "Ant Esports Elite 1000", "est_price": 2200},
        ],
    },
    "streaming": {
        "name": "Streaming Build",
        "budget": 120000,
        "use_case": "streaming",
        "description": "Game and stream simultaneously. NVENC encoder for smooth streaming.",
        "components": [
            {"category": "CPU", "suggestion": "AMD Ryzen 7 7700X", "est_price": 24000},
            {"category": "GPU", "suggestion": "NVIDIA RTX 4070 Super", "est_price": 50000},
            {"category": "RAM", "suggestion": "32GB DDR5 5600MHz", "est_price": 8000},
            {"category": "Motherboard", "suggestion": "B650 Tomahawk WiFi", "est_price": 18000},
            {"category": "Storage", "suggestion": "1TB NVMe Gen4 SSD", "est_price": 5500},
            {"category": "PSU", "suggestion": "750W 80+ Gold", "est_price": 7000},
            {"category": "Case", "suggestion": "NZXT H5 Flow", "est_price": 7500},
        ],
    },
}


@router.get("/templates")
def get_templates():
    """Get all pre-built PC templates"""
    return TEMPLATES


@router.get("/templates/{template_id}")
def get_template(template_id: str):
    """Get a specific template"""
    if template_id not in TEMPLATES:
        raise HTTPException(status_code=404, detail="Template not found")
    return TEMPLATES[template_id]


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
            # Fall back to template-based recommendation
            pass

    # Fallback: template-based recommendation
    return _get_template_recommendation(budget, use_case)


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
    total_tdp = 0
    breakdown = []

    # TDP estimates by category (in watts)
    default_tdp = {
        "cpu": 65,
        "gpu": 150,
        "ram": 5,
        "motherboard": 50,
        "storage": 10,
        "pcCase": 0,
        "monitor": 0,
    }

    for cat, comp_id in components.items():
        comp = db.table("components").select("name, specs").eq("id", comp_id).single().execute()
        tdp = default_tdp.get(cat, 10)

        if comp.data and comp.data.get("specs"):
            specs = comp.data["specs"]
            if "tdp" in specs:
                try:
                    tdp = int(str(specs["tdp"]).replace("W", "").strip())
                except ValueError:
                    pass

        total_tdp += tdp
        breakdown.append({
            "category": cat,
            "name": comp.data["name"] if comp.data else "Unknown",
            "wattage": tdp,
        })

    # Add 20% headroom
    recommended_psu = int(total_tdp * 1.2)
    # Round up to nearest 50W
    recommended_psu = ((recommended_psu + 49) // 50) * 50

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


def _get_template_recommendation(budget: int, use_case: str) -> dict:
    """Fallback template-based recommendation"""
    if use_case == "gaming":
        if budget <= 50000:
            return {**TEMPLATES["gaming-budget"], "source": "template"}
        elif budget <= 100000:
            return {**TEMPLATES["gaming-mid"], "source": "template"}
        else:
            return {**TEMPLATES["gaming-high"], "source": "template"}
    elif use_case == "content":
        return {**TEMPLATES["editing"], "source": "template"}
    elif use_case == "streaming":
        return {**TEMPLATES["streaming"], "source": "template"}
    else:
        return {**TEMPLATES["productivity"], "source": "template"}
