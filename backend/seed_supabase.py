"""
PCease – Supabase seed script
Run from the backend folder:  python seed_supabase.py
Populates categories, vendors, components (100+), and realistic Indian retail prices.
"""

import os, random, sys
from dotenv import load_dotenv

load_dotenv()

from supabase import create_client

url = os.getenv("SUPABASE_URL")
key = os.getenv("SUPABASE_SERVICE_KEY") or os.getenv("SUPABASE_KEY")
if not url or not key:
    print("ERROR: Set SUPABASE_URL and SUPABASE_SERVICE_KEY in .env")
    sys.exit(1)

db = create_client(url, key)

# ──────────────────────────────────────────────
# CATEGORIES
# ──────────────────────────────────────────────
CATEGORIES = [
    {"name": "Processors",     "slug": "cpu",         "icon": "🔧", "display_order": 1},
    {"name": "Graphics Cards", "slug": "gpu",         "icon": "🎮", "display_order": 2},
    {"name": "Motherboards",   "slug": "motherboard", "icon": "🔌", "display_order": 3},
    {"name": "Memory (RAM)",   "slug": "ram",         "icon": "💾", "display_order": 4},
    {"name": "Storage",        "slug": "storage",     "icon": "💿", "display_order": 5},
    {"name": "Power Supply",   "slug": "psu",         "icon": "⚡", "display_order": 6},
    {"name": "Cabinet",        "slug": "case",        "icon": "🖥️", "display_order": 7},
    {"name": "CPU Cooler",     "slug": "cooler",      "icon": "❄️", "display_order": 8},
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
                price_row = {
                    "component_id": comp_id,
                    "vendor_id": v_id,
                    "price": price,
                    "in_stock": random.random() > 0.08,  # 92 % in stock
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
