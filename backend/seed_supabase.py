"""
PCease – Supabase seed script
Run from the backend folder:  python seed_supabase.py
Populates categories, vendors, components (100+), and realistic Indian retail prices.
"""

import os, random, sys, re
from dotenv import load_dotenv

load_dotenv()

from supabase import create_client

url = os.getenv("SUPABASE_URL")
key = os.getenv("SUPABASE_SERVICE_KEY") or os.getenv("SUPABASE_KEY")
if not url or not key:
    print("ERROR: Set SUPABASE_URL and SUPABASE_SERVICE_KEY in .env")
    sys.exit(1)

db = create_client(url, key)


def generate_product_url(vendor_slug: str, product_name: str) -> str:
    """Generate realistic product URL for a vendor"""
    # Normalize product name to URL-friendly slug
    slug = product_name.lower()
    slug = re.sub(r'[^\w\s-]', '', slug)  # Remove special chars
    slug = re.sub(r'\s+', '-', slug)       # Spaces to hyphens
    slug = re.sub(r'-+', '-', slug)        # Multiple hyphens to single
    slug = slug.strip('-')
    
    # URL patterns for known vendors
    url_patterns = {
        "amazon-in": f"https://www.amazon.in/dp/{slug}",
        "flipkart": f"https://www.flipkart.com/{slug}/p/item",
        "mdcomputers": f"https://www.mdcomputers.in/product/{slug}",
        "primeabgb": f"https://www.primeabgb.com/{slug}",
        "pcstudio": f"https://www.pcstudio.in/product/{slug}",
        "vedant": f"https://www.vedantcomputers.com/product/{slug}",
        "itdepot": f"https://www.theitdepot.com/{slug}",
        "compify": f"https://www.compify.in/product/{slug}",
        "elitehubs": f"https://www.elitehubs.com/product/{slug}",
    }
    return url_patterns.get(vendor_slug, f"https://example.com/product/{slug}")

# ──────────────────────────────────────────────
# CATEGORIES
# ──────────────────────────────────────────────
CATEGORIES = [
    {"name": "Processors",     "slug": "cpu",         "icon": "", "display_order": 1},
    {"name": "Graphics Cards", "slug": "gpu",         "icon": "", "display_order": 2},
    {"name": "Motherboards",   "slug": "motherboard", "icon": "", "display_order": 3},
    {"name": "Memory (RAM)",   "slug": "ram",         "icon": "", "display_order": 4},
    {"name": "Storage",        "slug": "storage",     "icon": "", "display_order": 5},
    {"name": "Power Supply",   "slug": "psu",         "icon": "", "display_order": 6},
    {"name": "Cabinet",        "slug": "case",        "icon": "", "display_order": 7},
    {"name": "CPU Cooler",     "slug": "cooler",      "icon": "", "display_order": 8},
    {"name": "Monitor",        "slug": "monitor",     "icon": "", "display_order": 9},
    {"name": "Case Fans",      "slug": "fans",        "icon": "", "display_order": 10},
    {"name": "Keyboard",       "slug": "keyboard",    "icon": "", "display_order": 11},
    {"name": "Mouse",          "slug": "mouse",       "icon": "", "display_order": 12},
    {"name": "Mousepad",       "slug": "mousepad",    "icon": "", "display_order": 13},
    {"name": "Headset",        "slug": "headset",     "icon": "", "display_order": 14},
]

# ──────────────────────────────────────────────
# VENDORS  (real Indian retailers)
# ──────────────────────────────────────────────
VENDORS = [
    {"name": "Amazon.in",         "slug": "amazon-in",  "website_url": "https://www.amazon.in"},
    {"name": "Flipkart",          "slug": "flipkart",   "website_url": "https://www.flipkart.com"},
    {"name": "MD Computers",      "slug": "mdcomputers","website_url": "https://www.mdcomputers.in"},
    {"name": "PrimeABGB",         "slug": "primeabgb",  "website_url": "https://www.primeabgb.com"},
    {"name": "PC Studio",         "slug": "pcstudio",   "website_url": "https://www.pcstudio.in"},
    {"name": "Vedant Computers",  "slug": "vedant",     "website_url": "https://www.vedantcomputers.com"},
    {"name": "The IT Depot",      "slug": "itdepot",    "website_url": "https://www.theitdepot.com"},
    {"name": "Compify",           "slug": "compify",    "website_url": "https://www.compify.in"},
    {"name": "EliteHubs",         "slug": "elitehubs",  "website_url": "https://www.elitehubs.com"},
]

# ──────────────────────────────────────────────
# COMPONENTS   (base_price = rough INR MRP)
# Each vendor gets a ±4 % random variation so
# that users can actually see price differences.
# ──────────────────────────────────────────────

# ---------- CPUs ----------
CPUS = [
    {"name": "AMD Ryzen 5 5500",           "brand": "AMD",   "model": "Ryzen 5 5500",           "base": 8999,  "specs": {"cores":6,"threads":12,"base_clock":"3.6 GHz","boost_clock":"4.2 GHz","tdp":65,"socket":"AM4","architecture":"Zen 3"}},
    {"name": "AMD Ryzen 5 5600",           "brand": "AMD",   "model": "Ryzen 5 5600",           "base": 10499, "specs": {"cores":6,"threads":12,"base_clock":"3.5 GHz","boost_clock":"4.4 GHz","tdp":65,"socket":"AM4","architecture":"Zen 3"}},
    {"name": "AMD Ryzen 5 5600X",          "brand": "AMD",   "model": "Ryzen 5 5600X",          "base": 14499, "specs": {"cores":6,"threads":12,"base_clock":"3.7 GHz","boost_clock":"4.6 GHz","tdp":65,"socket":"AM4","architecture":"Zen 3"}},
    {"name": "AMD Ryzen 7 5700X",          "brand": "AMD",   "model": "Ryzen 7 5700X",          "base": 18499, "specs": {"cores":8,"threads":16,"base_clock":"3.4 GHz","boost_clock":"4.6 GHz","tdp":65,"socket":"AM4","architecture":"Zen 3"}},
    {"name": "AMD Ryzen 7 5800X3D",        "brand": "AMD",   "model": "Ryzen 7 5800X3D",        "base": 26999, "specs": {"cores":8,"threads":16,"base_clock":"3.4 GHz","boost_clock":"4.5 GHz","tdp":105,"socket":"AM4","architecture":"Zen 3","3d_vcache":True}},
    {"name": "AMD Ryzen 5 7600",           "brand": "AMD",   "model": "Ryzen 5 7600",           "base": 16999, "specs": {"cores":6,"threads":12,"base_clock":"3.8 GHz","boost_clock":"5.1 GHz","tdp":65,"socket":"AM5","architecture":"Zen 4"}},
    {"name": "AMD Ryzen 5 7600X",          "brand": "AMD",   "model": "Ryzen 5 7600X",          "base": 19999, "specs": {"cores":6,"threads":12,"base_clock":"4.7 GHz","boost_clock":"5.3 GHz","tdp":105,"socket":"AM5","architecture":"Zen 4"}},
    {"name": "AMD Ryzen 7 7700X",          "brand": "AMD",   "model": "Ryzen 7 7700X",          "base": 28499, "specs": {"cores":8,"threads":16,"base_clock":"4.5 GHz","boost_clock":"5.4 GHz","tdp":105,"socket":"AM5","architecture":"Zen 4"}},
    {"name": "AMD Ryzen 7 7800X3D",        "brand": "AMD",   "model": "Ryzen 7 7800X3D",        "base": 36999, "specs": {"cores":8,"threads":16,"base_clock":"4.2 GHz","boost_clock":"5.0 GHz","tdp":120,"socket":"AM5","architecture":"Zen 4","3d_vcache":True}},
    {"name": "AMD Ryzen 9 7900X",          "brand": "AMD",   "model": "Ryzen 9 7900X",          "base": 39999, "specs": {"cores":12,"threads":24,"base_clock":"4.7 GHz","boost_clock":"5.6 GHz","tdp":170,"socket":"AM5","architecture":"Zen 4"}},
    {"name": "AMD Ryzen 9 7950X",          "brand": "AMD",   "model": "Ryzen 9 7950X",          "base": 52999, "specs": {"cores":16,"threads":32,"base_clock":"4.5 GHz","boost_clock":"5.7 GHz","tdp":170,"socket":"AM5","architecture":"Zen 4"}},
    {"name": "Intel Core i3-12100F",       "brand": "Intel", "model": "Core i3-12100F",         "base": 7499,  "specs": {"cores":4,"threads":8,"base_clock":"3.3 GHz","boost_clock":"4.3 GHz","tdp":58,"socket":"LGA 1700","architecture":"Alder Lake"}},
    {"name": "Intel Core i5-12400F",       "brand": "Intel", "model": "Core i5-12400F",         "base": 10799, "specs": {"cores":6,"threads":12,"base_clock":"2.5 GHz","boost_clock":"4.4 GHz","tdp":65,"socket":"LGA 1700","architecture":"Alder Lake"}},
    {"name": "Intel Core i5-13400F",       "brand": "Intel", "model": "Core i5-13400F",         "base": 14499, "specs": {"cores":10,"threads":16,"base_clock":"2.5 GHz","boost_clock":"4.6 GHz","tdp":65,"socket":"LGA 1700","architecture":"Raptor Lake"}},
    {"name": "Intel Core i5-14400F",       "brand": "Intel", "model": "Core i5-14400F",         "base": 13499, "specs": {"cores":10,"threads":16,"base_clock":"2.5 GHz","boost_clock":"4.7 GHz","tdp":65,"socket":"LGA 1700","architecture":"Raptor Lake Refresh"}},
    {"name": "Intel Core i5-14600KF",      "brand": "Intel", "model": "Core i5-14600KF",        "base": 22499, "specs": {"cores":14,"threads":20,"base_clock":"3.5 GHz","boost_clock":"5.3 GHz","tdp":125,"socket":"LGA 1700","architecture":"Raptor Lake Refresh"}},
    {"name": "Intel Core i7-14700KF",      "brand": "Intel", "model": "Core i7-14700KF",        "base": 32999, "specs": {"cores":20,"threads":28,"base_clock":"3.4 GHz","boost_clock":"5.6 GHz","tdp":125,"socket":"LGA 1700","architecture":"Raptor Lake Refresh"}},
    {"name": "Intel Core i9-14900K",       "brand": "Intel", "model": "Core i9-14900K",         "base": 49999, "specs": {"cores":24,"threads":32,"base_clock":"3.2 GHz","boost_clock":"6.0 GHz","tdp":125,"socket":"LGA 1700","architecture":"Raptor Lake Refresh"}},
]

# ---------- GPUs ----------
GPUS = [
    {"name": "NVIDIA GeForce GTX 1650",          "brand": "NVIDIA", "model": "GTX 1650",            "base": 11999, "specs": {"vram":"4 GB GDDR6","tdp":75,"architecture":"Turing"}},
    {"name": "NVIDIA GeForce RTX 3060 12GB",     "brand": "NVIDIA", "model": "RTX 3060 12GB",       "base": 23999, "specs": {"vram":"12 GB GDDR6","boost_clock":"1777 MHz","tdp":170,"architecture":"Ampere","ray_tracing":True,"dlss":"2.0"}},
    {"name": "AMD Radeon RX 6600",               "brand": "AMD",    "model": "RX 6600",             "base": 17999, "specs": {"vram":"8 GB GDDR6","boost_clock":"2491 MHz","tdp":132,"architecture":"RDNA 2","ray_tracing":True}},
    {"name": "AMD Radeon RX 7600",               "brand": "AMD",    "model": "RX 7600",             "base": 24999, "specs": {"vram":"8 GB GDDR6","boost_clock":"2655 MHz","tdp":165,"architecture":"RDNA 3","ray_tracing":True,"fsr":"3.0"}},
    {"name": "NVIDIA GeForce RTX 4060",          "brand": "NVIDIA", "model": "RTX 4060",            "base": 29999, "specs": {"vram":"8 GB GDDR6","boost_clock":"2460 MHz","tdp":115,"architecture":"Ada Lovelace","ray_tracing":True,"dlss":"3.0"}},
    {"name": "NVIDIA GeForce RTX 4060 Ti 8GB",   "brand": "NVIDIA", "model": "RTX 4060 Ti 8GB",     "base": 38999, "specs": {"vram":"8 GB GDDR6","boost_clock":"2535 MHz","tdp":160,"architecture":"Ada Lovelace","ray_tracing":True,"dlss":"3.0"}},
    {"name": "AMD Radeon RX 7700 XT",            "brand": "AMD",    "model": "RX 7700 XT",          "base": 39999, "specs": {"vram":"12 GB GDDR6","boost_clock":"2544 MHz","tdp":245,"architecture":"RDNA 3","ray_tracing":True,"fsr":"3.0"}},
    {"name": "AMD Radeon RX 7800 XT",            "brand": "AMD",    "model": "RX 7800 XT",          "base": 44999, "specs": {"vram":"16 GB GDDR6","boost_clock":"2430 MHz","tdp":263,"architecture":"RDNA 3","ray_tracing":True,"fsr":"3.0"}},
    {"name": "NVIDIA GeForce RTX 4070",          "brand": "NVIDIA", "model": "RTX 4070",            "base": 52999, "specs": {"vram":"12 GB GDDR6X","boost_clock":"2475 MHz","tdp":200,"architecture":"Ada Lovelace","ray_tracing":True,"dlss":"3.0"}},
    {"name": "NVIDIA GeForce RTX 4070 Super",    "brand": "NVIDIA", "model": "RTX 4070 Super",      "base": 58999, "specs": {"vram":"12 GB GDDR6X","boost_clock":"2475 MHz","tdp":220,"architecture":"Ada Lovelace","ray_tracing":True,"dlss":"3.0"}},
    {"name": "NVIDIA GeForce RTX 4070 Ti Super", "brand": "NVIDIA", "model": "RTX 4070 Ti Super",   "base": 69999, "specs": {"vram":"16 GB GDDR6X","boost_clock":"2610 MHz","tdp":285,"architecture":"Ada Lovelace","ray_tracing":True,"dlss":"3.0"}},
    {"name": "AMD Radeon RX 7900 GRE",           "brand": "AMD",    "model": "RX 7900 GRE",         "base": 55999, "specs": {"vram":"16 GB GDDR6","boost_clock":"2245 MHz","tdp":260,"architecture":"RDNA 3","ray_tracing":True,"fsr":"3.0"}},
    {"name": "AMD Radeon RX 7900 XT",            "brand": "AMD",    "model": "RX 7900 XT",          "base": 69999, "specs": {"vram":"20 GB GDDR6","boost_clock":"2400 MHz","tdp":315,"architecture":"RDNA 3","ray_tracing":True,"fsr":"3.0"}},
    {"name": "NVIDIA GeForce RTX 4080 Super",    "brand": "NVIDIA", "model": "RTX 4080 Super",      "base": 99999, "specs": {"vram":"16 GB GDDR6X","boost_clock":"2550 MHz","tdp":320,"architecture":"Ada Lovelace","ray_tracing":True,"dlss":"3.0"}},
    {"name": "AMD Radeon RX 7900 XTX",           "brand": "AMD",    "model": "RX 7900 XTX",         "base": 89999, "specs": {"vram":"24 GB GDDR6","boost_clock":"2499 MHz","tdp":355,"architecture":"RDNA 3","ray_tracing":True,"fsr":"3.0"}},
    {"name": "NVIDIA GeForce RTX 4090",          "brand": "NVIDIA", "model": "RTX 4090",            "base":164999, "specs": {"vram":"24 GB GDDR6X","boost_clock":"2520 MHz","tdp":450,"architecture":"Ada Lovelace","ray_tracing":True,"dlss":"3.0"}},
]

# ---------- Motherboards ----------
MOTHERBOARDS = [
    {"name": "Gigabyte B550M DS3H",                   "brand": "Gigabyte",  "model": "B550M DS3H",               "base": 7499,  "specs": {"socket":"AM4","chipset":"B550","form_factor":"Micro-ATX","ram_slots":2,"max_ram":"64 GB","ram_type":"DDR4"}},
    {"name": "MSI MAG B550 Tomahawk",                 "brand": "MSI",       "model": "MAG B550 Tomahawk",        "base": 14499, "specs": {"socket":"AM4","chipset":"B550","form_factor":"ATX","ram_slots":4,"max_ram":"128 GB","ram_type":"DDR4","wifi":False}},
    {"name": "ASUS ROG Strix B550-F Gaming WiFi II",  "brand": "ASUS",      "model": "ROG Strix B550-F Gaming WiFi II","base": 16999, "specs": {"socket":"AM4","chipset":"B550","form_factor":"ATX","ram_slots":4,"max_ram":"128 GB","ram_type":"DDR4","wifi":True}},
    {"name": "Gigabyte B650 Eagle AX",                "brand": "Gigabyte",  "model": "B650 Eagle AX",            "base": 14999, "specs": {"socket":"AM5","chipset":"B650","form_factor":"ATX","ram_slots":4,"max_ram":"128 GB","ram_type":"DDR5","wifi":True}},
    {"name": "MSI MAG B650 Tomahawk WiFi",            "brand": "MSI",       "model": "MAG B650 Tomahawk WiFi",   "base": 20499, "specs": {"socket":"AM5","chipset":"B650","form_factor":"ATX","ram_slots":4,"max_ram":"128 GB","ram_type":"DDR5","wifi":True}},
    {"name": "ASUS ROG Strix B650-A Gaming WiFi",     "brand": "ASUS",      "model": "ROG Strix B650-A Gaming WiFi","base": 22499, "specs": {"socket":"AM5","chipset":"B650","form_factor":"ATX","ram_slots":4,"max_ram":"128 GB","ram_type":"DDR5","wifi":True}},
    {"name": "ASUS ROG Strix X670E-E Gaming WiFi",    "brand": "ASUS",      "model": "ROG Strix X670E-E Gaming WiFi","base": 44999, "specs": {"socket":"AM5","chipset":"X670E","form_factor":"ATX","ram_slots":4,"max_ram":"128 GB","ram_type":"DDR5","wifi":True}},
    {"name": "Gigabyte B660M DS3H DDR4",              "brand": "Gigabyte",  "model": "B660M DS3H DDR4",          "base": 8499,  "specs": {"socket":"LGA 1700","chipset":"B660","form_factor":"Micro-ATX","ram_slots":2,"max_ram":"64 GB","ram_type":"DDR4"}},
    {"name": "MSI PRO B760M-A WiFi DDR5",             "brand": "MSI",       "model": "PRO B760M-A WiFi DDR5",    "base": 12999, "specs": {"socket":"LGA 1700","chipset":"B760","form_factor":"Micro-ATX","ram_slots":4,"max_ram":"128 GB","ram_type":"DDR5","wifi":True}},
    {"name": "ASUS TUF Gaming B760-Plus WiFi",        "brand": "ASUS",      "model": "TUF Gaming B760-Plus WiFi","base": 17999, "specs": {"socket":"LGA 1700","chipset":"B760","form_factor":"ATX","ram_slots":4,"max_ram":"128 GB","ram_type":"DDR5","wifi":True}},
    {"name": "MSI MAG Z790 Tomahawk WiFi",            "brand": "MSI",       "model": "MAG Z790 Tomahawk WiFi",   "base": 32999, "specs": {"socket":"LGA 1700","chipset":"Z790","form_factor":"ATX","ram_slots":4,"max_ram":"128 GB","ram_type":"DDR5","wifi":True}},
    {"name": "ASUS ROG Strix Z790-E Gaming WiFi",     "brand": "ASUS",      "model": "ROG Strix Z790-E Gaming WiFi","base": 45999, "specs": {"socket":"LGA 1700","chipset":"Z790","form_factor":"ATX","ram_slots":4,"max_ram":"128 GB","ram_type":"DDR5","wifi":True}},
]

# ---------- RAM ----------
RAM = [
    {"name": "ADATA XPG Gammix D30 16GB (2x8GB) 3200MHz DDR4","brand":"ADATA",    "model":"XPG Gammix D30 16GB 3200","base":2799,"specs":{"capacity":"16 GB","kit":"2x8 GB","type":"DDR4","speed":"3200 MHz","latency":"CL16","voltage":"1.35V"}},
    {"name": "Kingston Fury Beast 16GB (2x8GB) 3200MHz DDR4", "brand":"Kingston",  "model":"Fury Beast 16GB 3200 DDR4","base":3099,"specs":{"capacity":"16 GB","kit":"2x8 GB","type":"DDR4","speed":"3200 MHz","latency":"CL16","voltage":"1.35V"}},
    {"name": "Corsair Vengeance LPX 16GB (2x8GB) 3200MHz DDR4","brand":"Corsair", "model":"Vengeance LPX 16GB 3200","base":3399,"specs":{"capacity":"16 GB","kit":"2x8 GB","type":"DDR4","speed":"3200 MHz","latency":"CL16","voltage":"1.35V"}},
    {"name": "G.Skill Ripjaws V 16GB (2x8GB) 3600MHz DDR4",  "brand":"G.Skill",   "model":"Ripjaws V 16GB 3600","base":3899,"specs":{"capacity":"16 GB","kit":"2x8 GB","type":"DDR4","speed":"3600 MHz","latency":"CL18","voltage":"1.35V"}},
    {"name": "Corsair Vengeance LPX 32GB (2x16GB) 3200MHz DDR4","brand":"Corsair","model":"Vengeance LPX 32GB 3200","base":5999,"specs":{"capacity":"32 GB","kit":"2x16 GB","type":"DDR4","speed":"3200 MHz","latency":"CL16","voltage":"1.35V"}},
    {"name": "Kingston Fury Beast 32GB (2x16GB) 5200MHz DDR5","brand":"Kingston",  "model":"Fury Beast 32GB 5200 DDR5","base":7499,"specs":{"capacity":"32 GB","kit":"2x16 GB","type":"DDR5","speed":"5200 MHz","latency":"CL40","voltage":"1.25V"}},
    {"name": "Corsair Vengeance 32GB (2x16GB) 5600MHz DDR5",  "brand":"Corsair",   "model":"Vengeance 32GB 5600 DDR5","base":8999,"specs":{"capacity":"32 GB","kit":"2x16 GB","type":"DDR5","speed":"5600 MHz","latency":"CL36","voltage":"1.25V"}},
    {"name": "Corsair Vengeance 32GB (2x16GB) 6000MHz DDR5",  "brand":"Corsair",   "model":"Vengeance 32GB 6000 DDR5","base":10499,"specs":{"capacity":"32 GB","kit":"2x16 GB","type":"DDR5","speed":"6000 MHz","latency":"CL36","voltage":"1.35V"}},
    {"name": "G.Skill Trident Z5 RGB 32GB (2x16GB) 6000MHz DDR5","brand":"G.Skill","model":"Trident Z5 RGB 32GB 6000 DDR5","base":13999,"specs":{"capacity":"32 GB","kit":"2x16 GB","type":"DDR5","speed":"6000 MHz","latency":"CL30","voltage":"1.35V","rgb":True}},
    {"name": "G.Skill Trident Z5 RGB 64GB (2x32GB) 6000MHz DDR5","brand":"G.Skill","model":"Trident Z5 RGB 64GB 6000 DDR5","base":24999,"specs":{"capacity":"64 GB","kit":"2x32 GB","type":"DDR5","speed":"6000 MHz","latency":"CL30","voltage":"1.35V","rgb":True}},
]

# ---------- Storage ----------
STORAGE = [
    {"name": "Kingston NV2 500GB NVMe M.2 SSD",        "brand":"Kingston",        "model":"NV2 500GB",        "base":2499,"specs":{"capacity":"500 GB","type":"NVMe M.2","read_speed":"3500 MB/s","write_speed":"2100 MB/s","interface":"PCIe Gen 4"}},
    {"name": "WD Blue SN570 1TB NVMe M.2 SSD",         "brand":"Western Digital", "model":"SN570 1TB",        "base":4199,"specs":{"capacity":"1 TB","type":"NVMe M.2","read_speed":"3500 MB/s","write_speed":"3000 MB/s","interface":"PCIe Gen 3"}},
    {"name": "Crucial P3 Plus 1TB NVMe M.2 SSD",       "brand":"Crucial",         "model":"P3 Plus 1TB",      "base":4499,"specs":{"capacity":"1 TB","type":"NVMe M.2","read_speed":"5000 MB/s","write_speed":"4200 MB/s","interface":"PCIe Gen 4"}},
    {"name": "Samsung 980 1TB NVMe M.2 SSD",           "brand":"Samsung",         "model":"980 1TB",          "base":5399,"specs":{"capacity":"1 TB","type":"NVMe M.2","read_speed":"3500 MB/s","write_speed":"3000 MB/s","interface":"PCIe Gen 3"}},
    {"name": "Samsung 870 EVO 1TB SATA SSD",           "brand":"Samsung",         "model":"870 EVO 1TB",      "base":5999,"specs":{"capacity":"1 TB","type":"2.5\" SATA SSD","read_speed":"560 MB/s","write_speed":"530 MB/s","interface":"SATA III"}},
    {"name": "WD Black SN770 1TB NVMe M.2 SSD",       "brand":"Western Digital", "model":"SN770 1TB",        "base":5999,"specs":{"capacity":"1 TB","type":"NVMe M.2","read_speed":"5150 MB/s","write_speed":"4900 MB/s","interface":"PCIe Gen 4"}},
    {"name": "Samsung 990 EVO 1TB NVMe M.2 SSD",      "brand":"Samsung",         "model":"990 EVO 1TB",      "base":7499,"specs":{"capacity":"1 TB","type":"NVMe M.2","read_speed":"5000 MB/s","write_speed":"4200 MB/s","interface":"PCIe Gen 4"}},
    {"name": "Samsung 990 Pro 1TB NVMe M.2 SSD",      "brand":"Samsung",         "model":"990 Pro 1TB",      "base":8499,"specs":{"capacity":"1 TB","type":"NVMe M.2","read_speed":"7450 MB/s","write_speed":"6900 MB/s","interface":"PCIe Gen 4"}},
    {"name": "WD Black SN850X 1TB NVMe M.2 SSD",      "brand":"Western Digital", "model":"SN850X 1TB",       "base":8999,"specs":{"capacity":"1 TB","type":"NVMe M.2","read_speed":"7300 MB/s","write_speed":"6300 MB/s","interface":"PCIe Gen 4"}},
    {"name": "Samsung 990 Pro 2TB NVMe M.2 SSD",      "brand":"Samsung",         "model":"990 Pro 2TB",      "base":16999,"specs":{"capacity":"2 TB","type":"NVMe M.2","read_speed":"7450 MB/s","write_speed":"6900 MB/s","interface":"PCIe Gen 4"}},
    {"name": "Seagate Barracuda 2TB HDD",              "brand":"Seagate",         "model":"Barracuda 2TB",    "base":4499,"specs":{"capacity":"2 TB","type":"3.5\" HDD","rpm":"7200","cache":"256 MB","interface":"SATA III"}},
    {"name": "WD Blue 1TB HDD",                        "brand":"Western Digital", "model":"WD Blue 1TB",      "base":3199,"specs":{"capacity":"1 TB","type":"3.5\" HDD","rpm":"7200","cache":"64 MB","interface":"SATA III"}},
]

# ---------- PSUs ----------
PSUS = [
    {"name": "Cooler Master MWE 550 V2 80+ Bronze",     "brand":"Cooler Master","model":"MWE 550 V2",     "base":3599,"specs":{"wattage":550,"efficiency":"80+ Bronze","modular":"Non-Modular","fan_size":"120mm"}},
    {"name": "Deepcool PF650 80+ White",                "brand":"Deepcool",    "model":"PF650",           "base":3999,"specs":{"wattage":650,"efficiency":"80+ White","modular":"Non-Modular","fan_size":"120mm"}},
    {"name": "Cooler Master MWE 650 V2 80+ Bronze",     "brand":"Cooler Master","model":"MWE 650 V2",     "base":4499,"specs":{"wattage":650,"efficiency":"80+ Bronze","modular":"Non-Modular","fan_size":"120mm"}},
    {"name": "Corsair CV650 650W 80+ Bronze",           "brand":"Corsair",     "model":"CV650",           "base":4799,"specs":{"wattage":650,"efficiency":"80+ Bronze","modular":"Non-Modular","fan_size":"120mm"}},
    {"name": "Corsair RM650e 650W 80+ Gold",            "brand":"Corsair",     "model":"RM650e",          "base":6999,"specs":{"wattage":650,"efficiency":"80+ Gold","modular":"Fully Modular","fan_size":"120mm"}},
    {"name": "MSI MAG A750GL 750W 80+ Gold",            "brand":"MSI",         "model":"MAG A750GL",      "base":7299,"specs":{"wattage":750,"efficiency":"80+ Gold","modular":"Fully Modular","fan_size":"120mm"}},
    {"name": "Corsair RM750e 750W 80+ Gold",            "brand":"Corsair",     "model":"RM750e",          "base":7999,"specs":{"wattage":750,"efficiency":"80+ Gold","modular":"Fully Modular","fan_size":"120mm"}},
    {"name": "Seasonic Focus GX-750 80+ Gold",          "brand":"Seasonic",    "model":"Focus GX-750",    "base":9499,"specs":{"wattage":750,"efficiency":"80+ Gold","modular":"Fully Modular","fan_size":"120mm"}},
    {"name": "Corsair RM850e 850W 80+ Gold",            "brand":"Corsair",     "model":"RM850e",          "base":9999,"specs":{"wattage":850,"efficiency":"80+ Gold","modular":"Fully Modular","fan_size":"120mm"}},
    {"name": "Seasonic Focus GX-850 80+ Gold",          "brand":"Seasonic",    "model":"Focus GX-850",    "base":11499,"specs":{"wattage":850,"efficiency":"80+ Gold","modular":"Fully Modular","fan_size":"120mm"}},
    {"name": "Corsair RM1000e 1000W 80+ Gold",          "brand":"Corsair",     "model":"RM1000e",         "base":13999,"specs":{"wattage":1000,"efficiency":"80+ Gold","modular":"Fully Modular","fan_size":"135mm"}},
]

# ---------- Cases ----------
CASES = [
    {"name": "Ant Esports ICE-112 Mid Tower",          "brand":"Ant Esports",    "model":"ICE-112",         "base":2199,"specs":{"form_factor":"Mid Tower","motherboard_support":"ATX","gpu_clearance":"350 mm","fans_included":1}},
    {"name": "Deepcool CC560 Mid Tower",               "brand":"Deepcool",       "model":"CC560",           "base":3499,"specs":{"form_factor":"Mid Tower","motherboard_support":"ATX","gpu_clearance":"370 mm","fans_included":4}},
    {"name": "Ant Esports ICE-311MT Mid Tower",        "brand":"Ant Esports",    "model":"ICE-311MT",       "base":3299,"specs":{"form_factor":"Mid Tower","motherboard_support":"ATX","gpu_clearance":"360 mm","fans_included":3}},
    {"name": "Cooler Master MasterBox Q300L",          "brand":"Cooler Master",  "model":"MasterBox Q300L", "base":3999,"specs":{"form_factor":"Mini Tower","motherboard_support":"Micro-ATX","gpu_clearance":"360 mm","fans_included":1}},
    {"name": "Lian Li Lancool 205 Mesh",               "brand":"Lian Li",        "model":"Lancool 205 Mesh","base":5999,"specs":{"form_factor":"Mid Tower","motherboard_support":"ATX","gpu_clearance":"370 mm","fans_included":2}},
    {"name": "NZXT H5 Flow",                           "brand":"NZXT",           "model":"H5 Flow",         "base":8999,"specs":{"form_factor":"Mid Tower","motherboard_support":"ATX","gpu_clearance":"365 mm","fans_included":2}},
    {"name": "Corsair 4000D Airflow",                  "brand":"Corsair",        "model":"4000D Airflow",   "base":9499,"specs":{"form_factor":"Mid Tower","motherboard_support":"ATX","gpu_clearance":"360 mm","fans_included":2}},
    {"name": "Lian Li Lancool II Mesh",                "brand":"Lian Li",        "model":"Lancool II Mesh", "base":8499,"specs":{"form_factor":"Mid Tower","motherboard_support":"ATX","gpu_clearance":"384 mm","fans_included":3}},
    {"name": "Fractal Design Meshify C",               "brand":"Fractal Design", "model":"Meshify C",       "base":8499,"specs":{"form_factor":"Mid Tower","motherboard_support":"ATX","gpu_clearance":"315 mm","fans_included":2}},
    {"name": "be quiet! Pure Base 500DX",              "brand":"be quiet!",      "model":"Pure Base 500DX", "base":9999,"specs":{"form_factor":"Mid Tower","motherboard_support":"ATX","gpu_clearance":"369 mm","fans_included":3}},
    {"name": "Lian Li Lancool III",                    "brand":"Lian Li",        "model":"Lancool III",     "base":11999,"specs":{"form_factor":"Mid Tower","motherboard_support":"E-ATX","gpu_clearance":"435 mm","fans_included":4}},
    {"name": "Cooler Master NR200P",                   "brand":"Cooler Master",  "model":"NR200P",          "base":7999,"specs":{"form_factor":"SFF","motherboard_support":"Mini-ITX","gpu_clearance":"330 mm","fans_included":2}},
]

# ---------- CPU Coolers ----------
COOLERS = [
    {"name": "Deepcool AK400",                 "brand":"Deepcool",      "model":"AK400",              "base":1799,"specs":{"type":"Air Tower","fan_size":"120mm","tdp_rating":"220W","height":"155mm","sockets":"AM4/AM5/LGA 1700"}},
    {"name": "ID-COOLING SE-226-XT",           "brand":"ID-COOLING",    "model":"SE-226-XT",          "base":2499,"specs":{"type":"Air Tower","fan_size":"120mm","tdp_rating":"250W","height":"154mm","sockets":"AM4/AM5/LGA 1700"}},
    {"name": "Cooler Master Hyper 212",        "brand":"Cooler Master", "model":"Hyper 212",          "base":2999,"specs":{"type":"Air Tower","fan_size":"120mm","tdp_rating":"150W","height":"160mm","sockets":"AM4/AM5/LGA 1700"}},
    {"name": "Deepcool AK620",                 "brand":"Deepcool",      "model":"AK620",              "base":3999,"specs":{"type":"Dual Tower","fan_size":"2x 120mm","tdp_rating":"260W","height":"160mm","sockets":"AM4/AM5/LGA 1700"}},
    {"name": "Noctua NH-D15",                  "brand":"Noctua",        "model":"NH-D15",             "base":8499,"specs":{"type":"Dual Tower","fan_size":"2x 140mm","tdp_rating":"250W","height":"165mm","sockets":"AM4/AM5/LGA 1700"}},
    {"name": "Deepcool LS520 240mm AIO",       "brand":"Deepcool",      "model":"LS520",              "base":4999,"specs":{"type":"AIO Liquid 240mm","fan_size":"2x 120mm","tdp_rating":"250W","radiator":"240mm","sockets":"AM4/AM5/LGA 1700"}},
    {"name": "Corsair iCUE H100i Elite LCD XT 240mm","brand":"Corsair","model":"H100i Elite LCD XT",  "base":14999,"specs":{"type":"AIO Liquid 240mm","fan_size":"2x 120mm","tdp_rating":"300W","radiator":"240mm","sockets":"AM4/AM5/LGA 1700","lcd_display":True}},
    {"name": "Lian Li Galahad II Trinity 360mm","brand":"Lian Li",     "model":"Galahad II Trinity 360","base":12999,"specs":{"type":"AIO Liquid 360mm","fan_size":"3x 120mm","tdp_rating":"350W","radiator":"360mm","sockets":"AM4/AM5/LGA 1700"}},
    {"name": "NZXT Kraken 360",                "brand":"NZXT",          "model":"Kraken 360",         "base":16999,"specs":{"type":"AIO Liquid 360mm","fan_size":"3x 120mm","tdp_rating":"350W","radiator":"360mm","sockets":"AM4/AM5/LGA 1700","lcd_display":True}},
]

# ---------- Monitors ----------
MONITORS = [
    {"name": "Acer Nitro VG240Y S 24\" 165Hz IPS",         "brand":"Acer",       "model":"VG240Y S",        "base":10499, "specs":{"size":"24 inch","resolution":"1920x1080","panel_type":"IPS","refresh_rate":"165 Hz","response_time":"0.5ms","adaptive_sync":"FreeSync","ports":"HDMI x2, DP","hdr":False}},
    {"name": "LG 24GS60F 24\" 180Hz IPS",                  "brand":"LG",         "model":"24GS60F",         "base":11999, "specs":{"size":"24 inch","resolution":"1920x1080","panel_type":"IPS","refresh_rate":"180 Hz","response_time":"1ms","adaptive_sync":"FreeSync","ports":"HDMI x2, DP","hdr":"HDR10"}},
    {"name": "MSI G2412 24\" 170Hz IPS",                    "brand":"MSI",        "model":"G2412",           "base":10999, "specs":{"size":"24 inch","resolution":"1920x1080","panel_type":"IPS","refresh_rate":"170 Hz","response_time":"1ms","adaptive_sync":"FreeSync Premium","ports":"HDMI x2, DP","hdr":False}},
    {"name": "Samsung Odyssey G3 27\" 165Hz VA",            "brand":"Samsung",    "model":"Odyssey G3 27",   "base":13999, "specs":{"size":"27 inch","resolution":"1920x1080","panel_type":"VA","refresh_rate":"165 Hz","response_time":"1ms","adaptive_sync":"FreeSync","ports":"HDMI, DP","hdr":False}},
    {"name": "Acer Nitro VG271U M3 27\" 180Hz IPS",        "brand":"Acer",       "model":"VG271U M3",       "base":17999, "specs":{"size":"27 inch","resolution":"2560x1440","panel_type":"IPS","refresh_rate":"180 Hz","response_time":"0.5ms","adaptive_sync":"FreeSync Premium","ports":"HDMI x2, DP","hdr":"HDR10"}},
    {"name": "LG 27GP850-B 27\" 165Hz Nano IPS",           "brand":"LG",         "model":"27GP850-B",       "base":24999, "specs":{"size":"27 inch","resolution":"2560x1440","panel_type":"Nano IPS","refresh_rate":"165 Hz","response_time":"1ms","adaptive_sync":"G-Sync Compatible","ports":"HDMI x2, DP, USB","hdr":"HDR400"}},
    {"name": "MSI MAG 274QRF-QD 27\" 165Hz Rapid IPS",     "brand":"MSI",        "model":"MAG 274QRF-QD",   "base":24999, "specs":{"size":"27 inch","resolution":"2560x1440","panel_type":"Rapid IPS","refresh_rate":"165 Hz","response_time":"1ms","adaptive_sync":"G-Sync Compatible","ports":"HDMI x2, DP, USB-C","hdr":"HDR400"}},
    {"name": "Dell S2722QC 27\" 4K 60Hz IPS USB-C",        "brand":"Dell",       "model":"S2722QC",         "base":25999, "specs":{"size":"27 inch","resolution":"3840x2160","panel_type":"IPS","refresh_rate":"60 Hz","response_time":"4ms","adaptive_sync":"FreeSync","ports":"HDMI x2, USB-C 65W","hdr":"HDR400"}},
    {"name": "Samsung Odyssey G5 27\" 165Hz QHD VA",        "brand":"Samsung",    "model":"Odyssey G5 27",   "base":19999, "specs":{"size":"27 inch","resolution":"2560x1440","panel_type":"VA","refresh_rate":"165 Hz","response_time":"1ms","adaptive_sync":"FreeSync Premium","ports":"HDMI, DP","hdr":"HDR10","curved":"1000R"}},
    {"name": "ASUS VG28UQL1A 28\" 4K 144Hz IPS",           "brand":"ASUS",       "model":"VG28UQL1A",       "base":39999, "specs":{"size":"28 inch","resolution":"3840x2160","panel_type":"IPS","refresh_rate":"144 Hz","response_time":"1ms","adaptive_sync":"G-Sync Compatible","ports":"HDMI 2.1 x2, DP, USB","hdr":"HDR400"}},
    {"name": "LG 27GR95QE-B 27\" QHD OLED 240Hz",         "brand":"LG",         "model":"27GR95QE-B",      "base":64999, "specs":{"size":"27 inch","resolution":"2560x1440","panel_type":"OLED","refresh_rate":"240 Hz","response_time":"0.03ms","adaptive_sync":"G-Sync Compatible","ports":"HDMI 2.1 x2, DP, USB","hdr":"HDR10"}},
    {"name": "Samsung Odyssey OLED G8 34\" UWQHD 175Hz",   "brand":"Samsung",    "model":"Odyssey OLED G8", "base":79999, "specs":{"size":"34 inch","resolution":"3440x1440","panel_type":"OLED","refresh_rate":"175 Hz","response_time":"0.03ms","adaptive_sync":"G-Sync Compatible","ports":"HDMI 2.1 x2, DP 1.4, USB-C","hdr":"HDR True Black 400","curved":"1800R"}},
]

# ---------- Case Fans ----------
FANS = [
    {"name": "Arctic P12 PWM PST 120mm (Single)",           "brand":"Arctic",        "model":"P12 PWM PST",     "base":399,  "specs":{"size":"120mm","quantity":1,"rpm":"200-1800","airflow":"56.3 CFM","noise":"22.5 dBA","bearing":"FDB","pwm":True,"rgb":False}},
    {"name": "Arctic P12 PWM PST 120mm (5-Pack)",           "brand":"Arctic",        "model":"P12 PWM 5-Pack",  "base":1599, "specs":{"size":"120mm","quantity":5,"rpm":"200-1800","airflow":"56.3 CFM","noise":"22.5 dBA","bearing":"FDB","pwm":True,"rgb":False}},
    {"name": "Deepcool RF120 FS 120mm (3-Pack)",            "brand":"Deepcool",      "model":"RF120 FS 3-Pack", "base":999,  "specs":{"size":"120mm","quantity":3,"rpm":"500-1500","airflow":"56.5 CFM","noise":"27 dBA","bearing":"Hydro","pwm":False,"rgb":False}},
    {"name": "Cooler Master SickleFlow 120 ARGB (3-Pack)",  "brand":"Cooler Master", "model":"SickleFlow 120 ARGB 3-Pack","base":2499,"specs":{"size":"120mm","quantity":3,"rpm":"650-1800","airflow":"62 CFM","noise":"27 dBA","bearing":"Rifle","pwm":True,"rgb":"ARGB"}},
    {"name": "Corsair iCUE SP120 RGB Elite (3-Pack)",       "brand":"Corsair",       "model":"SP120 RGB Elite 3-Pack","base":3499,"specs":{"size":"120mm","quantity":3,"rpm":"550-1500","airflow":"47.7 CFM","noise":"18 dBA","bearing":"Hydraulic","pwm":True,"rgb":"iCUE RGB"}},
    {"name": "Lian Li UNI FAN SL-INF 120 (3-Pack)",        "brand":"Lian Li",       "model":"SL-INF 120 3-Pack","base":5999,"specs":{"size":"120mm","quantity":3,"rpm":"250-2100","airflow":"61.3 CFM","noise":"29 dBA","bearing":"FDB","pwm":True,"rgb":"ARGB","daisy_chain":True}},
    {"name": "be quiet! Light Wings 140mm (3-Pack)",        "brand":"be quiet!",     "model":"Light Wings 140 3-Pack","base":4499,"specs":{"size":"140mm","quantity":3,"rpm":"1100","airflow":"70.5 CFM","noise":"20.6 dBA","bearing":"Rifle","pwm":True,"rgb":"ARGB"}},
    {"name": "Noctua NF-A12x25 PWM 120mm",                 "brand":"Noctua",        "model":"NF-A12x25 PWM",  "base":2999, "specs":{"size":"120mm","quantity":1,"rpm":"450-2000","airflow":"60.1 CFM","noise":"22.6 dBA","bearing":"SSO2","pwm":True,"rgb":False}},
    {"name": "Noctua NF-A14 PWM 140mm",                    "brand":"Noctua",        "model":"NF-A14 PWM",     "base":2799, "specs":{"size":"140mm","quantity":1,"rpm":"300-1500","airflow":"82.5 CFM","noise":"24.6 dBA","bearing":"SSO2","pwm":True,"rgb":False}},
    {"name": "Deepcool FC120 ARGB 120mm (3-Pack)",         "brand":"Deepcool",      "model":"FC120 ARGB 3-Pack","base":2199,"specs":{"size":"120mm","quantity":3,"rpm":"500-1800","airflow":"61.9 CFM","noise":"28 dBA","bearing":"FDB","pwm":True,"rgb":"ARGB","daisy_chain":True}},
]

# ---------- Keyboards ----------
KEYBOARDS = [
    {"name": "Cosmic Byte CB-GK-21 Firefly",     "brand":"Cosmic Byte",   "model":"CB-GK-21 Firefly",   "base":1499,  "specs":{"type":"Membrane","layout":"Full Size","backlight":"RGB","connection":"Wired USB","anti_ghosting":True}},
    {"name": "Redgear Shadow Blade",             "brand":"Redgear",       "model":"Shadow Blade",       "base":1799,  "specs":{"type":"Membrane","layout":"Full Size","backlight":"RGB","connection":"Wired USB","anti_ghosting":True}},
    {"name": "Ant Esports MK1000",               "brand":"Ant Esports",   "model":"MK1000",             "base":2199,  "specs":{"type":"Mechanical","switch":"Outemu Blue","layout":"Full Size","backlight":"RGB","connection":"Wired USB"}},
    {"name": "TVS Gold Bharat",                  "brand":"TVS",           "model":"Gold Bharat",        "base":2499,  "specs":{"type":"Mechanical","switch":"Cherry MX Blue","layout":"Full Size","backlight":"None","connection":"Wired USB"}},
    {"name": "Redragon K552 Kumara",             "brand":"Redragon",      "model":"K552 Kumara",        "base":2799,  "specs":{"type":"Mechanical","switch":"Outemu Red","layout":"TKL","backlight":"RGB","connection":"Wired USB"}},
    {"name": "Logitech K120",                    "brand":"Logitech",      "model":"K120",               "base":599,   "specs":{"type":"Membrane","layout":"Full Size","backlight":"None","connection":"Wired USB","spill_resistant":True}},
    {"name": "HP K500F Backlit",                 "brand":"HP",            "model":"K500F",              "base":1299,  "specs":{"type":"Membrane","layout":"Full Size","backlight":"RGB","connection":"Wired USB","anti_ghosting":True}},
    {"name": "Logitech G213 Prodigy",            "brand":"Logitech",      "model":"G213 Prodigy",       "base":3499,  "specs":{"type":"Mecha-Membrane","layout":"Full Size","backlight":"RGB","connection":"Wired USB","media_controls":True}},
    {"name": "HyperX Alloy Origins Core",        "brand":"HyperX",        "model":"Alloy Origins Core", "base":5999,  "specs":{"type":"Mechanical","switch":"HyperX Red","layout":"TKL","backlight":"RGB","connection":"Wired USB","aircraft_grade_aluminum":True}},
    {"name": "Logitech G Pro X",                 "brand":"Logitech",      "model":"G Pro X",            "base":9999,  "specs":{"type":"Mechanical","switch":"GX Blue Clicky","layout":"TKL","backlight":"RGB","connection":"Wired USB","hot_swappable":True}},
    {"name": "Razer BlackWidow V3",              "brand":"Razer",         "model":"BlackWidow V3",      "base":8499,  "specs":{"type":"Mechanical","switch":"Razer Green","layout":"Full Size","backlight":"RGB","connection":"Wired USB","wrist_rest":True}},
    {"name": "Razer Huntsman Mini",              "brand":"Razer",         "model":"Huntsman Mini",      "base":7999,  "specs":{"type":"Optical-Mechanical","switch":"Razer Optical Red","layout":"60%","backlight":"RGB","connection":"Wired USB"}},
    {"name": "Corsair K70 RGB Pro",              "brand":"Corsair",       "model":"K70 RGB Pro",        "base":12999, "specs":{"type":"Mechanical","switch":"Cherry MX Red","layout":"Full Size","backlight":"RGB","connection":"Wired USB","media_controls":True,"wrist_rest":True}},
    {"name": "SteelSeries Apex Pro",             "brand":"SteelSeries",   "model":"Apex Pro",           "base":17999, "specs":{"type":"OmniPoint Adjustable","switch":"OmniPoint","layout":"Full Size","backlight":"RGB","connection":"Wired USB","adjustable_actuation":True}},
    {"name": "Ducky One 3 RGB TKL",              "brand":"Ducky",         "model":"One 3 RGB TKL",      "base":10999, "specs":{"type":"Mechanical","switch":"Cherry MX Brown","layout":"TKL","backlight":"RGB","connection":"Wired USB","hot_swappable":True}},
    {"name": "Keychron K8 Pro",                  "brand":"Keychron",      "model":"K8 Pro",             "base":8499,  "specs":{"type":"Mechanical","switch":"Gateron G Pro Brown","layout":"TKL","backlight":"RGB","connection":"Wired/Bluetooth","hot_swappable":True,"mac_compatible":True}},
    {"name": "Royal Kludge RK84",                "brand":"Royal Kludge",  "model":"RK84",               "base":4499,  "specs":{"type":"Mechanical","switch":"RK Brown","layout":"75%","backlight":"RGB","connection":"Wired/Bluetooth/2.4GHz","hot_swappable":True}},
    {"name": "Zebronics Max Ninja",              "brand":"Zebronics",     "model":"Max Ninja",          "base":1999,  "specs":{"type":"Mechanical","switch":"Outemu Blue","layout":"Full Size","backlight":"RGB","connection":"Wired USB"}},
]

# ---------- Mice ----------
MICE = [
    {"name": "Logitech B100",                    "brand":"Logitech",      "model":"B100",               "base":399,   "specs":{"type":"Optical","dpi":"800","buttons":3,"connection":"Wired USB","ambidextrous":True}},
    {"name": "HP X500",                          "brand":"HP",            "model":"X500",               "base":349,   "specs":{"type":"Optical","dpi":"1000","buttons":3,"connection":"Wired USB"}},
    {"name": "Zebronics Zeb-Transformer-M",      "brand":"Zebronics",     "model":"Zeb-Transformer-M",  "base":499,   "specs":{"type":"Optical","dpi":"3200","buttons":6,"connection":"Wired USB","backlight":"RGB"}},
    {"name": "Cosmic Byte Kilonova",             "brand":"Cosmic Byte",   "model":"Kilonova",           "base":899,   "specs":{"type":"Optical","dpi":"6400","buttons":7,"connection":"Wired USB","backlight":"RGB","braided_cable":True}},
    {"name": "Redgear A-20",                     "brand":"Redgear",       "model":"A-20",               "base":799,   "specs":{"type":"Optical","dpi":"4800","buttons":6,"connection":"Wired USB","backlight":"RGB"}},
    {"name": "Logitech G102 Lightsync",          "brand":"Logitech",      "model":"G102 Lightsync",     "base":1499,  "specs":{"type":"Optical","dpi":"8000","buttons":6,"connection":"Wired USB","backlight":"RGB","sensor":"Mercury"}},
    {"name": "Razer DeathAdder Essential",       "brand":"Razer",         "model":"DeathAdder Essential","base":1799,  "specs":{"type":"Optical","dpi":"6400","buttons":5,"connection":"Wired USB","sensor":"Razer Optical"}},
    {"name": "HyperX Pulsefire Haste",           "brand":"HyperX",        "model":"Pulsefire Haste",    "base":2999,  "specs":{"type":"Optical","dpi":"16000","buttons":6,"connection":"Wired USB","weight":"59g","honeycomb_shell":True}},
    {"name": "Logitech G304 Lightspeed",         "brand":"Logitech",      "model":"G304 Lightspeed",    "base":2999,  "specs":{"type":"Optical","dpi":"12000","buttons":6,"connection":"Wireless 2.4GHz","sensor":"HERO","battery_life":"250 hrs"}},
    {"name": "Razer Viper Mini",                 "brand":"Razer",         "model":"Viper Mini",         "base":2499,  "specs":{"type":"Optical","dpi":"8500","buttons":6,"connection":"Wired USB","weight":"61g","speedflex_cable":True}},
    {"name": "Logitech G502 Hero",               "brand":"Logitech",      "model":"G502 Hero",          "base":4499,  "specs":{"type":"Optical","dpi":"25600","buttons":11,"connection":"Wired USB","sensor":"HERO 25K","adjustable_weights":True}},
    {"name": "Razer DeathAdder V3",              "brand":"Razer",         "model":"DeathAdder V3",      "base":5999,  "specs":{"type":"Optical","dpi":"30000","buttons":5,"connection":"Wired USB","weight":"59g","sensor":"Focus Pro 30K"}},
    {"name": "Logitech G Pro X Superlight",      "brand":"Logitech",      "model":"G Pro X Superlight", "base":10999, "specs":{"type":"Optical","dpi":"25600","buttons":5,"connection":"Wireless 2.4GHz","weight":"63g","sensor":"HERO 25K","battery_life":"70 hrs"}},
    {"name": "Razer Viper V2 Pro",               "brand":"Razer",         "model":"Viper V2 Pro",       "base":12999, "specs":{"type":"Optical","dpi":"30000","buttons":5,"connection":"Wireless 2.4GHz","weight":"58g","sensor":"Focus Pro 30K"}},
    {"name": "Corsair Dark Core RGB Pro SE",     "brand":"Corsair",       "model":"Dark Core RGB Pro SE","base":8999,  "specs":{"type":"Optical","dpi":"18000","buttons":9,"connection":"Wireless/Wired","qi_charging":True,"sensor":"MARKSMAN"}},
    {"name": "SteelSeries Aerox 3 Wireless",     "brand":"SteelSeries",   "model":"Aerox 3 Wireless",   "base":7999,  "specs":{"type":"Optical","dpi":"18000","buttons":6,"connection":"Wireless 2.4GHz/Bluetooth","weight":"68g","ip54_rating":True}},
    {"name": "Glorious Model O",                 "brand":"Glorious",      "model":"Model O",            "base":4499,  "specs":{"type":"Optical","dpi":"19000","buttons":6,"connection":"Wired USB","weight":"67g","honeycomb_shell":True}},
    {"name": "Zowie EC2-C",                      "brand":"Zowie",         "model":"EC2-C",              "base":6499,  "specs":{"type":"Optical","dpi":"3200","buttons":5,"connection":"Wired USB","weight":"73g","paracord_cable":True,"esports_grade":True}},
]

# ---------- Mousepads ----------
MOUSEPADS = [
    {"name": "Ant Esports MP200 Small",          "brand":"Ant Esports",   "model":"MP200 Small",        "base":249,   "specs":{"size":"250x210x2mm","surface":"Cloth","base":"Rubber","stitched_edges":False}},
    {"name": "Redgear MP35",                     "brand":"Redgear",       "model":"MP35",               "base":349,   "specs":{"size":"350x250x4mm","surface":"Cloth","base":"Rubber","stitched_edges":True}},
    {"name": "Cosmic Byte Dwarf Medium",         "brand":"Cosmic Byte",   "model":"Dwarf Medium",       "base":449,   "specs":{"size":"400x300x4mm","surface":"Cloth","base":"Rubber","stitched_edges":True}},
    {"name": "SteelSeries QcK Medium",           "brand":"SteelSeries",   "model":"QcK Medium",         "base":999,   "specs":{"size":"320x270x2mm","surface":"Cloth","base":"Rubber","stitched_edges":False}},
    {"name": "Logitech G240 Cloth",              "brand":"Logitech",      "model":"G240 Cloth",         "base":1299,  "specs":{"size":"340x280x1mm","surface":"Cloth","base":"Rubber","stitched_edges":False,"low_friction":True}},
    {"name": "HyperX Fury S Pro XL",             "brand":"HyperX",        "model":"Fury S Pro XL",      "base":1999,  "specs":{"size":"900x420x4mm","surface":"Cloth","base":"Rubber","stitched_edges":True}},
    {"name": "SteelSeries QcK Heavy XXL",        "brand":"SteelSeries",   "model":"QcK Heavy XXL",      "base":2999,  "specs":{"size":"900x400x6mm","surface":"Cloth","base":"Rubber","stitched_edges":True,"extra_thick":True}},
    {"name": "Razer Gigantus V2 XXL",            "brand":"Razer",         "model":"Gigantus V2 XXL",    "base":2499,  "specs":{"size":"940x410x4mm","surface":"Cloth","base":"Rubber","stitched_edges":True}},
    {"name": "Corsair MM350 Pro Extended XL",    "brand":"Corsair",       "model":"MM350 Pro Extended XL","base":3999, "specs":{"size":"930x400x4mm","surface":"Cloth","base":"Rubber","stitched_edges":True,"spill_proof":True}},
    {"name": "Logitech G840 XL",                 "brand":"Logitech",      "model":"G840 XL",            "base":2999,  "specs":{"size":"900x400x3mm","surface":"Cloth","base":"Rubber","stitched_edges":True}},
    {"name": "Glorious 3XL Extended",            "brand":"Glorious",      "model":"3XL Extended",       "base":3499,  "specs":{"size":"1219x609x3mm","surface":"Cloth","base":"Rubber","stitched_edges":True}},
    {"name": "Razer Firefly V2 RGB",             "brand":"Razer",         "model":"Firefly V2",         "base":3999,  "specs":{"size":"355x255x3mm","surface":"Hard","base":"Rubber","stitched_edges":False,"rgb":True}},
    {"name": "Corsair MM700 RGB Extended",       "brand":"Corsair",       "model":"MM700 RGB Extended", "base":5999,  "specs":{"size":"930x400x4mm","surface":"Cloth","base":"Rubber","stitched_edges":True,"rgb":True,"usb_passthrough":True}},
    {"name": "SteelSeries QcK Prism XL RGB",     "brand":"SteelSeries",   "model":"QcK Prism XL",       "base":4499,  "specs":{"size":"900x300x4mm","surface":"Cloth","base":"Rubber","stitched_edges":True,"rgb":True}},
]

# ---------- Headsets ----------
HEADSETS = [
    {"name": "Cosmic Byte H3",                   "brand":"Cosmic Byte",   "model":"H3",                 "base":599,   "specs":{"type":"Over-Ear","driver":"40mm","frequency":"20Hz-20kHz","connection":"3.5mm","microphone":True}},
    {"name": "Redgear Cosmo 7.1",                "brand":"Redgear",       "model":"Cosmo 7.1",          "base":1499,  "specs":{"type":"Over-Ear","driver":"50mm","frequency":"20Hz-20kHz","connection":"USB","microphone":True,"virtual_surround":"7.1","rgb":True}},
    {"name": "Ant Esports H1100 Pro",            "brand":"Ant Esports",   "model":"H1100 Pro",          "base":1299,  "specs":{"type":"Over-Ear","driver":"50mm","frequency":"20Hz-20kHz","connection":"USB/3.5mm","microphone":True,"virtual_surround":"7.1","rgb":True}},
    {"name": "HyperX Cloud Stinger",             "brand":"HyperX",        "model":"Cloud Stinger",      "base":3499,  "specs":{"type":"Over-Ear","driver":"50mm","frequency":"18Hz-23kHz","connection":"3.5mm","microphone":True,"mic_monitoring":False,"weight":"275g"}},
    {"name": "Logitech G335",                    "brand":"Logitech",      "model":"G335",               "base":4499,  "specs":{"type":"Over-Ear","driver":"40mm","frequency":"20Hz-20kHz","connection":"3.5mm","microphone":True,"weight":"240g","memory_foam":True}},
    {"name": "Razer BlackShark V2 X",            "brand":"Razer",         "model":"BlackShark V2 X",    "base":3999,  "specs":{"type":"Over-Ear","driver":"50mm","frequency":"12Hz-28kHz","connection":"3.5mm","microphone":True,"triforce_drivers":True}},
    {"name": "HyperX Cloud II",                  "brand":"HyperX",        "model":"Cloud II",           "base":6999,  "specs":{"type":"Over-Ear","driver":"53mm","frequency":"15Hz-25kHz","connection":"USB/3.5mm","microphone":True,"virtual_surround":"7.1","aluminum_frame":True}},
    {"name": "Logitech G Pro X",                 "brand":"Logitech",      "model":"G Pro X",            "base":9999,  "specs":{"type":"Over-Ear","driver":"50mm","frequency":"20Hz-20kHz","connection":"USB/3.5mm","microphone":True,"blue_voice":True,"pro_g_driver":True}},
    {"name": "Razer BlackShark V2 Pro",          "brand":"Razer",         "model":"BlackShark V2 Pro",  "base":14999, "specs":{"type":"Over-Ear","driver":"50mm","frequency":"12Hz-28kHz","connection":"Wireless 2.4GHz","microphone":True,"battery_life":"24 hrs","thx_spatial":True}},
    {"name": "SteelSeries Arctis 7+",            "brand":"SteelSeries",   "model":"Arctis 7+",          "base":12999, "specs":{"type":"Over-Ear","driver":"40mm","frequency":"20Hz-20kHz","connection":"Wireless 2.4GHz/3.5mm","microphone":True,"battery_life":"30 hrs","ski_goggle_headband":True}},
    {"name": "Corsair HS80 RGB Wireless",        "brand":"Corsair",       "model":"HS80 RGB Wireless",  "base":11999, "specs":{"type":"Over-Ear","driver":"50mm","frequency":"20Hz-40kHz","connection":"Wireless 2.4GHz","microphone":True,"dolby_atmos":True,"battery_life":"20 hrs"}},
    {"name": "Logitech G733 Lightspeed",         "brand":"Logitech",      "model":"G733 Lightspeed",    "base":11499, "specs":{"type":"Over-Ear","driver":"40mm","frequency":"20Hz-20kHz","connection":"Wireless 2.4GHz","microphone":True,"battery_life":"29 hrs","weight":"278g","rgb":True}},
    {"name": "HyperX Cloud Alpha",               "brand":"HyperX",        "model":"Cloud Alpha",        "base":8999,  "specs":{"type":"Over-Ear","driver":"50mm","frequency":"13Hz-27kHz","connection":"3.5mm","microphone":True,"dual_chamber_driver":True}},
    {"name": "SteelSeries Arctis Nova Pro",      "brand":"SteelSeries",   "model":"Arctis Nova Pro",    "base":24999, "specs":{"type":"Over-Ear","driver":"40mm","frequency":"10Hz-40kHz","connection":"Wired USB","microphone":True,"active_noise_cancelling":True,"gamedac":True}},
    {"name": "Astro A50 Gen 4",                  "brand":"Astro",         "model":"A50 Gen 4",          "base":29999, "specs":{"type":"Over-Ear","driver":"40mm","frequency":"20Hz-20kHz","connection":"Wireless 2.4GHz","microphone":True,"dolby_atmos":True,"battery_life":"15 hrs","base_station":True}},
]


# ──────────────────────────────────────────────
# SEED LOGIC
# ──────────────────────────────────────────────
def upsert_rows(table, rows, conflict_col):
    """Insert rows, skip conflicts."""
    for row in rows:
        try:
            db.table(table).upsert(row, on_conflict=conflict_col).execute()
        except Exception as e:
            print(f"  ⚠  {table}: {e}")


def get_or_insert_component(row):
    """Insert a component. If name already exists, return the existing id."""
    existing = db.table("components").select("id").eq("name", row["name"]).limit(1).execute()
    if existing.data:
        return existing.data[0]["id"]
    try:
        res = db.table("components").insert(row).execute()
        return res.data[0]["id"]
    except Exception as e:
        # race / dupe
        existing2 = db.table("components").select("id").eq("name", row["name"]).limit(1).execute()
        if existing2.data:
            return existing2.data[0]["id"]
        print(f"     ✗ {row['name']}: {e}")
        return None

def seed():
    print("🌱  Starting PCease Supabase seed …\n")

    # 1. Categories
    print("  → Categories …")
    upsert_rows("categories", CATEGORIES, "slug")

    # 2. Vendors
    print("  → Vendors …")
    upsert_rows("vendors", VENDORS, "slug")

    # Fetch ID maps
    cat_rows = db.table("categories").select("id,slug").execute().data
    cat_map = {r["slug"]: r["id"] for r in cat_rows}

    ven_rows = db.table("vendors").select("id,slug").execute().data
    ven_map = {r["slug"]: r["id"] for r in ven_rows}
    ven_id_to_slug = {r["id"]: r["slug"] for r in ven_rows}
    ven_list = list(ven_map.values())

    print(f"     Categories: {cat_map}")
    print(f"     Vendors:    {list(ven_map.keys())}")

    # 3. Components + Prices
    component_sets = [
        ("cpu",         CPUS),
        ("gpu",         GPUS),
        ("motherboard", MOTHERBOARDS),
        ("ram",         RAM),
        ("storage",     STORAGE),
        ("psu",         PSUS),
        ("case",        CASES),
        ("cooler",      COOLERS),
        ("monitor",     MONITORS),
        ("fans",        FANS),
        ("keyboard",    KEYBOARDS),
        ("mouse",       MICE),
        ("mousepad",    MOUSEPADS),
        ("headset",     HEADSETS),
    ]

    total_comps = 0
    total_prices = 0

    for cat_slug, items in component_sets:
        cat_id = cat_map.get(cat_slug)
        if not cat_id:
            print(f"  ⚠  Category '{cat_slug}' not found – skipping")
            continue

        print(f"  → {cat_slug} ({len(items)} items) …")

        for item in items:
            base_price = item.pop("base")
            row = {
                "name": item["name"],
                "brand": item["brand"],
                "model": item.get("model", ""),
                "category_id": cat_id,
                "specifications": item["specs"],
            }
            comp_id = get_or_insert_component(row)
            if not comp_id:
                continue

            total_comps += 1

            # Generate prices for 4-7 random vendors
            random.shuffle(ven_list)
            num_vendors = random.randint(4, min(7, len(ven_list)))
            for v_id in ven_list[:num_vendors]:
                # ±4 % price jitter
                jitter = 1 + random.uniform(-0.04, 0.04)
                price = round(base_price * jitter)
                
                # Generate product URL
                vendor_slug = ven_id_to_slug.get(v_id, "")
                product_url = generate_product_url(vendor_slug, item["name"])
                
                price_row = {
                    "component_id": comp_id,
                    "vendor_id": v_id,
                    "price": price,
                    "in_stock": random.random() > 0.08,  # 92 % in stock
                    "url": product_url,
                }
                try:
                    db.table("component_prices").upsert(
                        price_row, on_conflict="component_id,vendor_id"
                    ).execute()
                    total_prices += 1
                except Exception:
                    pass  # ignore duplicates

    # 4. Summary
    print(f"\n✅  Seed complete!")
    print(f"   Components inserted/updated: {total_comps}")
    print(f"   Price entries:               {total_prices}")


if __name__ == "__main__":
    seed()
