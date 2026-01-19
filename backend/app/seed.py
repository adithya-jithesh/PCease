"""
Comprehensive seed script with 100+ PC components
Run with: python -m app.seed
"""
from .database import SessionLocal, engine, Base
from .models.component import Category, Component, Vendor, ComponentPrice
from .models.user import User
from .models.forum import ForumThread
from .utils.auth import get_password_hash
import random

# Create all tables
Base.metadata.create_all(bind=engine)


# ==================== COMPONENT DATA ====================

CATEGORIES = [
    {"name": "Processor", "slug": "cpu", "icon": "CPU", "description": "AMD & Intel CPUs"},
    {"name": "Graphics Card", "slug": "gpu", "icon": "GPU", "description": "NVIDIA & AMD GPUs"},
    {"name": "Motherboard", "slug": "motherboard", "icon": "MB", "description": "AM5, LGA1700, AM4"},
    {"name": "Memory", "slug": "ram", "icon": "RAM", "description": "DDR4 & DDR5 RAM"},
    {"name": "Storage", "slug": "storage", "icon": "SSD", "description": "NVMe, SSD & HDD"},
    {"name": "Power Supply", "slug": "psu", "icon": "PSU", "description": "80+ Certified"},
    {"name": "Case", "slug": "pcCase", "icon": "CASE", "description": "ATX, mATX & ITX"},
    {"name": "Monitor", "slug": "monitor", "icon": "MON", "description": "Gaming & Professional"},
]

VENDORS = [
    {"name": "Amazon India", "website": "https://amazon.in", "logo_url": None},
    {"name": "PrimeABGB", "website": "https://primeabgb.com", "logo_url": None},
    {"name": "MDComputers", "website": "https://mdcomputers.in", "logo_url": None},
    {"name": "Vedant Computers", "website": "https://vedantcomputers.com", "logo_url": None},
    {"name": "PCStudio", "website": "https://pcstudio.in", "logo_url": None},
    {"name": "EliteHubs", "website": "https://elitehubs.com", "logo_url": None},
    {"name": "Compify", "website": "https://compify.in", "logo_url": None},
]

# CPUs - 20+ items
CPUS = [
    # AMD Ryzen 5000 Series
    {"name": "AMD Ryzen 5 5600", "brand": "AMD", "price": 11500, "specs": {"cores": 6, "threads": 12, "base_clock": "3.5GHz", "boost_clock": "4.4GHz", "socket": "AM4", "tdp": 65}},
    {"name": "AMD Ryzen 5 5600X", "brand": "AMD", "price": 14500, "specs": {"cores": 6, "threads": 12, "base_clock": "3.7GHz", "boost_clock": "4.6GHz", "socket": "AM4", "tdp": 65}},
    {"name": "AMD Ryzen 7 5700X", "brand": "AMD", "price": 19500, "specs": {"cores": 8, "threads": 16, "base_clock": "3.4GHz", "boost_clock": "4.6GHz", "socket": "AM4", "tdp": 65}},
    {"name": "AMD Ryzen 7 5800X", "brand": "AMD", "price": 22000, "specs": {"cores": 8, "threads": 16, "base_clock": "3.8GHz", "boost_clock": "4.7GHz", "socket": "AM4", "tdp": 105}},
    {"name": "AMD Ryzen 9 5900X", "brand": "AMD", "price": 32000, "specs": {"cores": 12, "threads": 24, "base_clock": "3.7GHz", "boost_clock": "4.8GHz", "socket": "AM4", "tdp": 105}},
    {"name": "AMD Ryzen 9 5950X", "brand": "AMD", "price": 42000, "specs": {"cores": 16, "threads": 32, "base_clock": "3.4GHz", "boost_clock": "4.9GHz", "socket": "AM4", "tdp": 105}},
    # AMD Ryzen 7000 Series
    {"name": "AMD Ryzen 5 7600", "brand": "AMD", "price": 21000, "specs": {"cores": 6, "threads": 12, "base_clock": "3.8GHz", "boost_clock": "5.1GHz", "socket": "AM5", "tdp": 65}},
    {"name": "AMD Ryzen 5 7600X", "brand": "AMD", "price": 24000, "specs": {"cores": 6, "threads": 12, "base_clock": "4.7GHz", "boost_clock": "5.3GHz", "socket": "AM5", "tdp": 105}},
    {"name": "AMD Ryzen 7 7700X", "brand": "AMD", "price": 29000, "specs": {"cores": 8, "threads": 16, "base_clock": "4.5GHz", "boost_clock": "5.4GHz", "socket": "AM5", "tdp": 105}},
    {"name": "AMD Ryzen 7 7800X3D", "brand": "AMD", "price": 38000, "specs": {"cores": 8, "threads": 16, "base_clock": "4.2GHz", "boost_clock": "5.0GHz", "socket": "AM5", "tdp": 120, "3d_vcache": True}},
    {"name": "AMD Ryzen 9 7900X", "brand": "AMD", "price": 42000, "specs": {"cores": 12, "threads": 24, "base_clock": "4.7GHz", "boost_clock": "5.6GHz", "socket": "AM5", "tdp": 170}},
    {"name": "AMD Ryzen 9 7950X", "brand": "AMD", "price": 55000, "specs": {"cores": 16, "threads": 32, "base_clock": "4.5GHz", "boost_clock": "5.7GHz", "socket": "AM5", "tdp": 170}},
    # Intel 12th Gen
    {"name": "Intel Core i3-12100F", "brand": "Intel", "price": 7500, "specs": {"cores": 4, "threads": 8, "base_clock": "3.3GHz", "boost_clock": "4.3GHz", "socket": "LGA1700", "tdp": 58}},
    {"name": "Intel Core i5-12400F", "brand": "Intel", "price": 11000, "specs": {"cores": 6, "threads": 12, "base_clock": "2.5GHz", "boost_clock": "4.4GHz", "socket": "LGA1700", "tdp": 65}},
    {"name": "Intel Core i5-12600K", "brand": "Intel", "price": 19000, "specs": {"cores": 10, "threads": 16, "base_clock": "3.7GHz", "boost_clock": "4.9GHz", "socket": "LGA1700", "tdp": 125}},
    {"name": "Intel Core i7-12700K", "brand": "Intel", "price": 28000, "specs": {"cores": 12, "threads": 20, "base_clock": "3.6GHz", "boost_clock": "5.0GHz", "socket": "LGA1700", "tdp": 125}},
    # Intel 13th/14th Gen
    {"name": "Intel Core i5-13400F", "brand": "Intel", "price": 15000, "specs": {"cores": 10, "threads": 16, "base_clock": "2.5GHz", "boost_clock": "4.6GHz", "socket": "LGA1700", "tdp": 65}},
    {"name": "Intel Core i5-14600K", "brand": "Intel", "price": 26000, "specs": {"cores": 14, "threads": 20, "base_clock": "3.5GHz", "boost_clock": "5.3GHz", "socket": "LGA1700", "tdp": 125}},
    {"name": "Intel Core i7-13700K", "brand": "Intel", "price": 38000, "specs": {"cores": 16, "threads": 24, "base_clock": "3.4GHz", "boost_clock": "5.4GHz", "socket": "LGA1700", "tdp": 125}},
    {"name": "Intel Core i7-14700K", "brand": "Intel", "price": 42000, "specs": {"cores": 20, "threads": 28, "base_clock": "3.4GHz", "boost_clock": "5.6GHz", "socket": "LGA1700", "tdp": 125}},
    {"name": "Intel Core i9-13900K", "brand": "Intel", "price": 52000, "specs": {"cores": 24, "threads": 32, "base_clock": "3.0GHz", "boost_clock": "5.8GHz", "socket": "LGA1700", "tdp": 125}},
    {"name": "Intel Core i9-14900K", "brand": "Intel", "price": 58000, "specs": {"cores": 24, "threads": 32, "base_clock": "3.2GHz", "boost_clock": "6.0GHz", "socket": "LGA1700", "tdp": 125}},
]

# GPUs - 25+ items
GPUS = [
    # NVIDIA RTX 40 Series
    {"name": "NVIDIA GeForce RTX 4060", "brand": "NVIDIA", "price": 30000, "specs": {"memory": "8GB GDDR6", "cuda_cores": 3072, "boost_clock": "2460MHz", "tdp": 115}},
    {"name": "NVIDIA GeForce RTX 4060 Ti 8GB", "brand": "NVIDIA", "price": 42000, "specs": {"memory": "8GB GDDR6", "cuda_cores": 4352, "boost_clock": "2535MHz", "tdp": 160}},
    {"name": "NVIDIA GeForce RTX 4060 Ti 16GB", "brand": "NVIDIA", "price": 48000, "specs": {"memory": "16GB GDDR6", "cuda_cores": 4352, "boost_clock": "2535MHz", "tdp": 165}},
    {"name": "NVIDIA GeForce RTX 4070", "brand": "NVIDIA", "price": 58000, "specs": {"memory": "12GB GDDR6X", "cuda_cores": 5888, "boost_clock": "2475MHz", "tdp": 200}},
    {"name": "NVIDIA GeForce RTX 4070 Super", "brand": "NVIDIA", "price": 62000, "specs": {"memory": "12GB GDDR6X", "cuda_cores": 7168, "boost_clock": "2475MHz", "tdp": 220}},
    {"name": "NVIDIA GeForce RTX 4070 Ti", "brand": "NVIDIA", "price": 75000, "specs": {"memory": "12GB GDDR6X", "cuda_cores": 7680, "boost_clock": "2610MHz", "tdp": 285}},
    {"name": "NVIDIA GeForce RTX 4070 Ti Super", "brand": "NVIDIA", "price": 82000, "specs": {"memory": "16GB GDDR6X", "cuda_cores": 8448, "boost_clock": "2610MHz", "tdp": 285}},
    {"name": "NVIDIA GeForce RTX 4080", "brand": "NVIDIA", "price": 115000, "specs": {"memory": "16GB GDDR6X", "cuda_cores": 9728, "boost_clock": "2505MHz", "tdp": 320}},
    {"name": "NVIDIA GeForce RTX 4080 Super", "brand": "NVIDIA", "price": 105000, "specs": {"memory": "16GB GDDR6X", "cuda_cores": 10240, "boost_clock": "2550MHz", "tdp": 320}},
    {"name": "NVIDIA GeForce RTX 4090", "brand": "NVIDIA", "price": 175000, "specs": {"memory": "24GB GDDR6X", "cuda_cores": 16384, "boost_clock": "2520MHz", "tdp": 450}},
    # NVIDIA RTX 30 Series (value options)
    {"name": "NVIDIA GeForce RTX 3060 12GB", "brand": "NVIDIA", "price": 24000, "specs": {"memory": "12GB GDDR6", "cuda_cores": 3584, "boost_clock": "1777MHz", "tdp": 170}},
    {"name": "NVIDIA GeForce RTX 3060 Ti", "brand": "NVIDIA", "price": 30000, "specs": {"memory": "8GB GDDR6", "cuda_cores": 4864, "boost_clock": "1670MHz", "tdp": 200}},
    {"name": "NVIDIA GeForce RTX 3070", "brand": "NVIDIA", "price": 38000, "specs": {"memory": "8GB GDDR6", "cuda_cores": 5888, "boost_clock": "1725MHz", "tdp": 220}},
    # AMD RX 7000 Series
    {"name": "AMD Radeon RX 7600", "brand": "AMD", "price": 27000, "specs": {"memory": "8GB GDDR6", "stream_processors": 2048, "boost_clock": "2655MHz", "tdp": 165}},
    {"name": "AMD Radeon RX 7700 XT", "brand": "AMD", "price": 42000, "specs": {"memory": "12GB GDDR6", "stream_processors": 3456, "boost_clock": "2544MHz", "tdp": 245}},
    {"name": "AMD Radeon RX 7800 XT", "brand": "AMD", "price": 48000, "specs": {"memory": "16GB GDDR6", "stream_processors": 3840, "boost_clock": "2430MHz", "tdp": 263}},
    {"name": "AMD Radeon RX 7900 GRE", "brand": "AMD", "price": 58000, "specs": {"memory": "16GB GDDR6", "stream_processors": 5120, "boost_clock": "2245MHz", "tdp": 260}},
    {"name": "AMD Radeon RX 7900 XT", "brand": "AMD", "price": 75000, "specs": {"memory": "20GB GDDR6", "stream_processors": 5376, "boost_clock": "2400MHz", "tdp": 315}},
    {"name": "AMD Radeon RX 7900 XTX", "brand": "AMD", "price": 95000, "specs": {"memory": "24GB GDDR6", "stream_processors": 6144, "boost_clock": "2499MHz", "tdp": 355}},
    # AMD RX 6000 (budget)
    {"name": "AMD Radeon RX 6600", "brand": "AMD", "price": 18000, "specs": {"memory": "8GB GDDR6", "stream_processors": 1792, "boost_clock": "2491MHz", "tdp": 132}},
    {"name": "AMD Radeon RX 6650 XT", "brand": "AMD", "price": 22000, "specs": {"memory": "8GB GDDR6", "stream_processors": 2048, "boost_clock": "2635MHz", "tdp": 176}},
    {"name": "AMD Radeon RX 6700 XT", "brand": "AMD", "price": 28000, "specs": {"memory": "12GB GDDR6", "stream_processors": 2560, "boost_clock": "2581MHz", "tdp": 230}},
    # Entry Level
    {"name": "NVIDIA GeForce GTX 1650", "brand": "NVIDIA", "price": 12000, "specs": {"memory": "4GB GDDR6", "cuda_cores": 896, "boost_clock": "1590MHz", "tdp": 75}},
    {"name": "NVIDIA GeForce GTX 1660 Super", "brand": "NVIDIA", "price": 18000, "specs": {"memory": "6GB GDDR6", "cuda_cores": 1408, "boost_clock": "1785MHz", "tdp": 125}},
    {"name": "Intel Arc A770 16GB", "brand": "Intel", "price": 28000, "specs": {"memory": "16GB GDDR6", "xe_cores": 32, "boost_clock": "2400MHz", "tdp": 225}},
]

# Motherboards - 20+ items
MOTHERBOARDS = [
    # AMD AM5
    {"name": "ASUS ROG Strix B650-A Gaming WiFi", "brand": "ASUS", "price": 22000, "specs": {"socket": "AM5", "chipset": "B650", "form_factor": "ATX", "ram_slots": 4, "max_ram": "128GB", "pcie_slots": 2}},
    {"name": "ASUS ROG Strix X670E-E Gaming WiFi", "brand": "ASUS", "price": 48000, "specs": {"socket": "AM5", "chipset": "X670E", "form_factor": "ATX", "ram_slots": 4, "max_ram": "128GB", "pcie_slots": 3}},
    {"name": "MSI MAG B650 Tomahawk WiFi", "brand": "MSI", "price": 20000, "specs": {"socket": "AM5", "chipset": "B650", "form_factor": "ATX", "ram_slots": 4, "max_ram": "128GB", "pcie_slots": 2}},
    {"name": "MSI MEG X670E ACE", "brand": "MSI", "price": 58000, "specs": {"socket": "AM5", "chipset": "X670E", "form_factor": "E-ATX", "ram_slots": 4, "max_ram": "128GB", "pcie_slots": 4}},
    {"name": "Gigabyte B650 AORUS Elite AX", "brand": "Gigabyte", "price": 18000, "specs": {"socket": "AM5", "chipset": "B650", "form_factor": "ATX", "ram_slots": 4, "max_ram": "128GB", "pcie_slots": 2}},
    {"name": "ASRock B650M PG Riptide WiFi", "brand": "ASRock", "price": 14000, "specs": {"socket": "AM5", "chipset": "B650", "form_factor": "mATX", "ram_slots": 4, "max_ram": "128GB", "pcie_slots": 1}},
    # AMD AM4
    {"name": "ASUS ROG Strix B550-F Gaming WiFi II", "brand": "ASUS", "price": 16000, "specs": {"socket": "AM4", "chipset": "B550", "form_factor": "ATX", "ram_slots": 4, "max_ram": "128GB", "pcie_slots": 2}},
    {"name": "MSI MAG B550 Tomahawk", "brand": "MSI", "price": 14000, "specs": {"socket": "AM4", "chipset": "B550", "form_factor": "ATX", "ram_slots": 4, "max_ram": "128GB", "pcie_slots": 2}},
    {"name": "Gigabyte B550 AORUS Pro V2", "brand": "Gigabyte", "price": 15000, "specs": {"socket": "AM4", "chipset": "B550", "form_factor": "ATX", "ram_slots": 4, "max_ram": "128GB", "pcie_slots": 2}},
    {"name": "ASRock B550M Steel Legend", "brand": "ASRock", "price": 10000, "specs": {"socket": "AM4", "chipset": "B550", "form_factor": "mATX", "ram_slots": 4, "max_ram": "128GB", "pcie_slots": 1}},
    # Intel LGA1700
    {"name": "ASUS ROG Strix Z790-E Gaming WiFi", "brand": "ASUS", "price": 48000, "specs": {"socket": "LGA1700", "chipset": "Z790", "form_factor": "ATX", "ram_slots": 4, "max_ram": "128GB", "pcie_slots": 3}},
    {"name": "ASUS TUF Gaming B760-Plus WiFi", "brand": "ASUS", "price": 18000, "specs": {"socket": "LGA1700", "chipset": "B760", "form_factor": "ATX", "ram_slots": 4, "max_ram": "128GB", "pcie_slots": 2}},
    {"name": "MSI MAG Z790 Tomahawk WiFi", "brand": "MSI", "price": 35000, "specs": {"socket": "LGA1700", "chipset": "Z790", "form_factor": "ATX", "ram_slots": 4, "max_ram": "128GB", "pcie_slots": 3}},
    {"name": "MSI PRO B760M-A WiFi", "brand": "MSI", "price": 12000, "specs": {"socket": "LGA1700", "chipset": "B760", "form_factor": "mATX", "ram_slots": 4, "max_ram": "128GB", "pcie_slots": 1}},
    {"name": "Gigabyte Z790 AORUS Elite AX", "brand": "Gigabyte", "price": 28000, "specs": {"socket": "LGA1700", "chipset": "Z790", "form_factor": "ATX", "ram_slots": 4, "max_ram": "128GB", "pcie_slots": 3}},
    {"name": "Gigabyte B660M DS3H DDR4", "brand": "Gigabyte", "price": 8500, "specs": {"socket": "LGA1700", "chipset": "B660", "form_factor": "mATX", "ram_slots": 2, "max_ram": "64GB", "pcie_slots": 1}},
    {"name": "ASRock Z790 Taichi", "brand": "ASRock", "price": 52000, "specs": {"socket": "LGA1700", "chipset": "Z790", "form_factor": "ATX", "ram_slots": 4, "max_ram": "128GB", "pcie_slots": 4}},
]

# RAM - 15+ items
RAM = [
    # DDR5
    {"name": "Corsair Vengeance DDR5 32GB (2x16GB) 5600MHz", "brand": "Corsair", "price": 9500, "specs": {"capacity": "32GB", "type": "DDR5", "speed": "5600MHz", "latency": "CL36", "kit": "2x16GB"}},
    {"name": "Corsair Vengeance DDR5 32GB (2x16GB) 6000MHz", "brand": "Corsair", "price": 11000, "specs": {"capacity": "32GB", "type": "DDR5", "speed": "6000MHz", "latency": "CL36", "kit": "2x16GB"}},
    {"name": "G.Skill Trident Z5 RGB 32GB (2x16GB) 6000MHz", "brand": "G.Skill", "price": 14000, "specs": {"capacity": "32GB", "type": "DDR5", "speed": "6000MHz", "latency": "CL36", "kit": "2x16GB", "rgb": True}},
    {"name": "G.Skill Trident Z5 RGB 64GB (2x32GB) 6000MHz", "brand": "G.Skill", "price": 26000, "specs": {"capacity": "64GB", "type": "DDR5", "speed": "6000MHz", "latency": "CL36", "kit": "2x32GB", "rgb": True}},
    {"name": "Kingston Fury Beast DDR5 32GB (2x16GB) 5200MHz", "brand": "Kingston", "price": 8000, "specs": {"capacity": "32GB", "type": "DDR5", "speed": "5200MHz", "latency": "CL40", "kit": "2x16GB"}},
    {"name": "TeamGroup T-Force Delta RGB DDR5 32GB 6000MHz", "brand": "TeamGroup", "price": 12000, "specs": {"capacity": "32GB", "type": "DDR5", "speed": "6000MHz", "latency": "CL38", "kit": "2x16GB", "rgb": True}},
    # DDR4
    {"name": "Corsair Vengeance LPX 16GB (2x8GB) 3200MHz DDR4", "brand": "Corsair", "price": 3200, "specs": {"capacity": "16GB", "type": "DDR4", "speed": "3200MHz", "latency": "CL16", "kit": "2x8GB"}},
    {"name": "Corsair Vengeance LPX 32GB (2x16GB) 3200MHz DDR4", "brand": "Corsair", "price": 5800, "specs": {"capacity": "32GB", "type": "DDR4", "speed": "3200MHz", "latency": "CL16", "kit": "2x16GB"}},
    {"name": "G.Skill Ripjaws V 16GB (2x8GB) 3600MHz DDR4", "brand": "G.Skill", "price": 3800, "specs": {"capacity": "16GB", "type": "DDR4", "speed": "3600MHz", "latency": "CL18", "kit": "2x8GB"}},
    {"name": "G.Skill Trident Z RGB 32GB (2x16GB) 3600MHz DDR4", "brand": "G.Skill", "price": 8500, "specs": {"capacity": "32GB", "type": "DDR4", "speed": "3600MHz", "latency": "CL18", "kit": "2x16GB", "rgb": True}},
    {"name": "Kingston Fury Beast 16GB (2x8GB) 3200MHz DDR4", "brand": "Kingston", "price": 3000, "specs": {"capacity": "16GB", "type": "DDR4", "speed": "3200MHz", "latency": "CL16", "kit": "2x8GB"}},
    {"name": "Crucial Ballistix 32GB (2x16GB) 3600MHz DDR4", "brand": "Crucial", "price": 6500, "specs": {"capacity": "32GB", "type": "DDR4", "speed": "3600MHz", "latency": "CL16", "kit": "2x16GB"}},
    {"name": "ADATA XPG Gammix D30 16GB (2x8GB) 3200MHz DDR4", "brand": "ADATA", "price": 2800, "specs": {"capacity": "16GB", "type": "DDR4", "speed": "3200MHz", "latency": "CL16", "kit": "2x8GB"}},
]

# Storage - 20+ items
STORAGE = [
    # NVMe Gen4
    {"name": "Samsung 980 Pro 1TB", "brand": "Samsung", "price": 9000, "specs": {"capacity": "1TB", "type": "NVMe Gen4", "read_speed": "7000MB/s", "write_speed": "5000MB/s", "form_factor": "M.2"}},
    {"name": "Samsung 980 Pro 2TB", "brand": "Samsung", "price": 16000, "specs": {"capacity": "2TB", "type": "NVMe Gen4", "read_speed": "7000MB/s", "write_speed": "5100MB/s", "form_factor": "M.2"}},
    {"name": "Samsung 990 Pro 1TB", "brand": "Samsung", "price": 11000, "specs": {"capacity": "1TB", "type": "NVMe Gen4", "read_speed": "7450MB/s", "write_speed": "6900MB/s", "form_factor": "M.2"}},
    {"name": "Samsung 990 Pro 2TB", "brand": "Samsung", "price": 18000, "specs": {"capacity": "2TB", "type": "NVMe Gen4", "read_speed": "7450MB/s", "write_speed": "6900MB/s", "form_factor": "M.2"}},
    {"name": "WD Black SN850X 1TB", "brand": "Western Digital", "price": 9500, "specs": {"capacity": "1TB", "type": "NVMe Gen4", "read_speed": "7300MB/s", "write_speed": "6300MB/s", "form_factor": "M.2"}},
    {"name": "WD Black SN850X 2TB", "brand": "Western Digital", "price": 17000, "specs": {"capacity": "2TB", "type": "NVMe Gen4", "read_speed": "7300MB/s", "write_speed": "6600MB/s", "form_factor": "M.2"}},
    {"name": "Crucial T500 1TB", "brand": "Crucial", "price": 8500, "specs": {"capacity": "1TB", "type": "NVMe Gen4", "read_speed": "7300MB/s", "write_speed": "6800MB/s", "form_factor": "M.2"}},
    {"name": "Seagate FireCuda 530 1TB", "brand": "Seagate", "price": 10000, "specs": {"capacity": "1TB", "type": "NVMe Gen4", "read_speed": "7300MB/s", "write_speed": "6000MB/s", "form_factor": "M.2"}},
    # NVMe Gen3 (Budget)
    {"name": "Samsung 970 EVO Plus 1TB", "brand": "Samsung", "price": 6500, "specs": {"capacity": "1TB", "type": "NVMe Gen3", "read_speed": "3500MB/s", "write_speed": "3300MB/s", "form_factor": "M.2"}},
    {"name": "WD Blue SN570 1TB", "brand": "Western Digital", "price": 4500, "specs": {"capacity": "1TB", "type": "NVMe Gen3", "read_speed": "3500MB/s", "write_speed": "3000MB/s", "form_factor": "M.2"}},
    {"name": "Crucial P3 Plus 1TB", "brand": "Crucial", "price": 4000, "specs": {"capacity": "1TB", "type": "NVMe Gen4", "read_speed": "5000MB/s", "write_speed": "4200MB/s", "form_factor": "M.2"}},
    {"name": "Kingston NV2 1TB", "brand": "Kingston", "price": 3800, "specs": {"capacity": "1TB", "type": "NVMe Gen4", "read_speed": "3500MB/s", "write_speed": "2100MB/s", "form_factor": "M.2"}},
    {"name": "ADATA XPG Gammix S70 Blade 1TB", "brand": "ADATA", "price": 7500, "specs": {"capacity": "1TB", "type": "NVMe Gen4", "read_speed": "7400MB/s", "write_speed": "6400MB/s", "form_factor": "M.2"}},
    # SATA SSD
    {"name": "Samsung 870 EVO 1TB", "brand": "Samsung", "price": 6000, "specs": {"capacity": "1TB", "type": "SATA SSD", "read_speed": "560MB/s", "write_speed": "530MB/s", "form_factor": "2.5\""}},
    {"name": "Crucial MX500 1TB", "brand": "Crucial", "price": 5000, "specs": {"capacity": "1TB", "type": "SATA SSD", "read_speed": "560MB/s", "write_speed": "510MB/s", "form_factor": "2.5\""}},
    {"name": "WD Blue 1TB SATA SSD", "brand": "Western Digital", "price": 5500, "specs": {"capacity": "1TB", "type": "SATA SSD", "read_speed": "560MB/s", "write_speed": "530MB/s", "form_factor": "2.5\""}},
    # HDD
    {"name": "Seagate Barracuda 2TB HDD", "brand": "Seagate", "price": 4500, "specs": {"capacity": "2TB", "type": "HDD", "rpm": "7200", "cache": "256MB", "form_factor": "3.5\""}},
    {"name": "WD Blue 2TB HDD", "brand": "Western Digital", "price": 4800, "specs": {"capacity": "2TB", "type": "HDD", "rpm": "7200", "cache": "256MB", "form_factor": "3.5\""}},
    {"name": "Seagate Barracuda 4TB HDD", "brand": "Seagate", "price": 7500, "specs": {"capacity": "4TB", "type": "HDD", "rpm": "5400", "cache": "256MB", "form_factor": "3.5\""}},
]

# PSUs - 15+ items
PSUS = [
    # 650W
    {"name": "Corsair RM650e", "brand": "Corsair", "price": 7000, "specs": {"wattage": 650, "efficiency": "80+ Gold", "modular": "Full", "fan_size": "120mm"}},
    {"name": "Seasonic Focus GX-650", "brand": "Seasonic", "price": 8500, "specs": {"wattage": 650, "efficiency": "80+ Gold", "modular": "Full", "fan_size": "120mm"}},
    {"name": "ASUS TUF Gaming 650W", "brand": "ASUS", "price": 7500, "specs": {"wattage": 650, "efficiency": "80+ Bronze", "modular": "Semi", "fan_size": "135mm"}},
    # 750W
    {"name": "Corsair RM750e", "brand": "Corsair", "price": 8500, "specs": {"wattage": 750, "efficiency": "80+ Gold", "modular": "Full", "fan_size": "120mm"}},
    {"name": "Seasonic Focus GX-750", "brand": "Seasonic", "price": 9500, "specs": {"wattage": 750, "efficiency": "80+ Gold", "modular": "Full", "fan_size": "120mm"}},
    {"name": "be quiet! Pure Power 12 M 750W", "brand": "be quiet!", "price": 9000, "specs": {"wattage": 750, "efficiency": "80+ Gold", "modular": "Full", "fan_size": "120mm"}},
    {"name": "MSI MAG A750GL", "brand": "MSI", "price": 7500, "specs": {"wattage": 750, "efficiency": "80+ Gold", "modular": "Full", "fan_size": "120mm"}},
    # 850W
    {"name": "Corsair RM850e", "brand": "Corsair", "price": 10000, "specs": {"wattage": 850, "efficiency": "80+ Gold", "modular": "Full", "fan_size": "120mm"}},
    {"name": "Seasonic Focus GX-850", "brand": "Seasonic", "price": 11500, "specs": {"wattage": 850, "efficiency": "80+ Gold", "modular": "Full", "fan_size": "120mm"}},
    {"name": "be quiet! Straight Power 12 850W", "brand": "be quiet!", "price": 14000, "specs": {"wattage": 850, "efficiency": "80+ Platinum", "modular": "Full", "fan_size": "135mm"}},
    {"name": "ASUS ROG Strix 850G", "brand": "ASUS", "price": 12000, "specs": {"wattage": 850, "efficiency": "80+ Gold", "modular": "Full", "fan_size": "135mm"}},
    # 1000W+
    {"name": "Corsair RM1000e", "brand": "Corsair", "price": 14000, "specs": {"wattage": 1000, "efficiency": "80+ Gold", "modular": "Full", "fan_size": "135mm"}},
    {"name": "Seasonic Prime TX-1000", "brand": "Seasonic", "price": 22000, "specs": {"wattage": 1000, "efficiency": "80+ Titanium", "modular": "Full", "fan_size": "135mm"}},
    {"name": "ASUS ROG Thor 1200P2", "brand": "ASUS", "price": 28000, "specs": {"wattage": 1200, "efficiency": "80+ Platinum", "modular": "Full", "fan_size": "135mm"}},
]

# Cases - 15+ items
CASES = [
    # Mid Tower ATX
    {"name": "NZXT H5 Flow", "brand": "NZXT", "price": 9000, "specs": {"form_factor": "Mid Tower", "motherboard_support": "ATX", "gpu_clearance": "365mm", "included_fans": 2}},
    {"name": "NZXT H7 Flow", "brand": "NZXT", "price": 12000, "specs": {"form_factor": "Mid Tower", "motherboard_support": "ATX", "gpu_clearance": "400mm", "included_fans": 2}},
    {"name": "Lian Li Lancool II Mesh", "brand": "Lian Li", "price": 8500, "specs": {"form_factor": "Mid Tower", "motherboard_support": "ATX", "gpu_clearance": "384mm", "included_fans": 3}},
    {"name": "Lian Li Lancool III", "brand": "Lian Li", "price": 12000, "specs": {"form_factor": "Mid Tower", "motherboard_support": "E-ATX", "gpu_clearance": "435mm", "included_fans": 4}},
    {"name": "Corsair 4000D Airflow", "brand": "Corsair", "price": 9500, "specs": {"form_factor": "Mid Tower", "motherboard_support": "ATX", "gpu_clearance": "360mm", "included_fans": 2}},
    {"name": "Corsair 5000D Airflow", "brand": "Corsair", "price": 14000, "specs": {"form_factor": "Mid Tower", "motherboard_support": "E-ATX", "gpu_clearance": "400mm", "included_fans": 2}},
    {"name": "Fractal Design Meshify C", "brand": "Fractal Design", "price": 8000, "specs": {"form_factor": "Mid Tower", "motherboard_support": "ATX", "gpu_clearance": "315mm", "included_fans": 2}},
    {"name": "Fractal Design Torrent", "brand": "Fractal Design", "price": 16000, "specs": {"form_factor": "Mid Tower", "motherboard_support": "E-ATX", "gpu_clearance": "461mm", "included_fans": 5}},
    {"name": "be quiet! Pure Base 500DX", "brand": "be quiet!", "price": 10000, "specs": {"form_factor": "Mid Tower", "motherboard_support": "ATX", "gpu_clearance": "369mm", "included_fans": 3}},
    {"name": "Phanteks Eclipse G360A", "brand": "Phanteks", "price": 8500, "specs": {"form_factor": "Mid Tower", "motherboard_support": "ATX", "gpu_clearance": "400mm", "included_fans": 3}},
    # Compact/ITX
    {"name": "NZXT H1 V2", "brand": "NZXT", "price": 28000, "specs": {"form_factor": "Mini Tower", "motherboard_support": "ITX", "gpu_clearance": "324mm", "included_fans": 1, "included_psu": "750W"}},
    {"name": "Lian Li A4-H2O", "brand": "Lian Li", "price": 18000, "specs": {"form_factor": "Mini Tower", "motherboard_support": "ITX", "gpu_clearance": "320mm", "included_fans": 0}},
    {"name": "Cooler Master NR200P", "brand": "Cooler Master", "price": 8000, "specs": {"form_factor": "Mini Tower", "motherboard_support": "ITX", "gpu_clearance": "330mm", "included_fans": 2}},
    # Budget
    {"name": "Ant Esports ICE-120AG", "brand": "Ant Esports", "price": 2800, "specs": {"form_factor": "Mid Tower", "motherboard_support": "ATX", "gpu_clearance": "340mm", "included_fans": 3}},
    {"name": "Deepcool CC560", "brand": "Deepcool", "price": 3500, "specs": {"form_factor": "Mid Tower", "motherboard_support": "ATX", "gpu_clearance": "370mm", "included_fans": 4}},
]

# Monitors - 15+ items
MONITORS = [
    # 1080p Gaming
    {"name": "ASUS VG248QG 24\" 165Hz", "brand": "ASUS", "price": 15000, "specs": {"size": "24\"", "resolution": "1920x1080", "refresh_rate": "165Hz", "panel": "TN", "response_time": "0.5ms"}},
    {"name": "LG 24GN650-B 24\" 144Hz", "brand": "LG", "price": 14000, "specs": {"size": "24\"", "resolution": "1920x1080", "refresh_rate": "144Hz", "panel": "IPS", "response_time": "1ms"}},
    {"name": "Acer Nitro VG240Y 24\" 165Hz", "brand": "Acer", "price": 12000, "specs": {"size": "24\"", "resolution": "1920x1080", "refresh_rate": "165Hz", "panel": "IPS", "response_time": "1ms"}},
    # 1440p Gaming
    {"name": "LG 27GP850-B 27\" 165Hz", "brand": "LG", "price": 32000, "specs": {"size": "27\"", "resolution": "2560x1440", "refresh_rate": "165Hz", "panel": "Nano IPS", "response_time": "1ms"}},
    {"name": "ASUS VG27AQ1A 27\" 170Hz", "brand": "ASUS", "price": 28000, "specs": {"size": "27\"", "resolution": "2560x1440", "refresh_rate": "170Hz", "panel": "IPS", "response_time": "1ms"}},
    {"name": "Dell S2722DGM 27\" 165Hz", "brand": "Dell", "price": 24000, "specs": {"size": "27\"", "resolution": "2560x1440", "refresh_rate": "165Hz", "panel": "VA", "response_time": "2ms", "curved": True}},
    {"name": "MSI MAG274QRF-QD 27\" 165Hz", "brand": "MSI", "price": 35000, "specs": {"size": "27\"", "resolution": "2560x1440", "refresh_rate": "165Hz", "panel": "IPS", "response_time": "1ms"}},
    {"name": "Samsung Odyssey G5 27\" 165Hz", "brand": "Samsung", "price": 22000, "specs": {"size": "27\"", "resolution": "2560x1440", "refresh_rate": "165Hz", "panel": "VA", "response_time": "1ms", "curved": True}},
    # 4K
    {"name": "LG 27UP850N-W 27\" 4K", "brand": "LG", "price": 38000, "specs": {"size": "27\"", "resolution": "3840x2160", "refresh_rate": "60Hz", "panel": "IPS", "hdr": "HDR400"}},
    {"name": "ASUS TUF Gaming VG28UQL1A 28\" 4K 144Hz", "brand": "ASUS", "price": 52000, "specs": {"size": "28\"", "resolution": "3840x2160", "refresh_rate": "144Hz", "panel": "IPS", "response_time": "1ms", "hdr": "HDR400"}},
    {"name": "Samsung Odyssey Neo G7 32\" 4K 165Hz", "brand": "Samsung", "price": 95000, "specs": {"size": "32\"", "resolution": "3840x2160", "refresh_rate": "165Hz", "panel": "Mini LED VA", "hdr": "HDR2000", "curved": True}},
    # Ultrawide
    {"name": "LG 34WP65C-B 34\" Ultrawide", "brand": "LG", "price": 28000, "specs": {"size": "34\"", "resolution": "3440x1440", "refresh_rate": "160Hz", "panel": "VA", "curved": True}},
    {"name": "Samsung Odyssey G9 49\" DQHD", "brand": "Samsung", "price": 95000, "specs": {"size": "49\"", "resolution": "5120x1440", "refresh_rate": "240Hz", "panel": "VA", "curved": True, "hdr": "HDR1000"}},
    # Budget
    {"name": "BenQ GW2480 24\" IPS", "brand": "BenQ", "price": 10000, "specs": {"size": "24\"", "resolution": "1920x1080", "refresh_rate": "60Hz", "panel": "IPS"}},
    {"name": "Acer K242HYL 24\" IPS", "brand": "Acer", "price": 8500, "specs": {"size": "24\"", "resolution": "1920x1080", "refresh_rate": "75Hz", "panel": "IPS"}},
]

# Forum threads for demo
FORUM_THREADS = [
    {"title": "Best budget GPU under ₹25,000?", "content": "Looking for a GPU that can handle 1080p gaming at high settings. Current options I'm considering are RX 6600 and GTX 1660 Super. Any suggestions?", "category": "Build Help"},
    {"title": "Ryzen 7800X3D vs Intel 14700K for gaming?", "content": "Building a high-end gaming PC and can't decide between these two. Budget isn't a concern, just want the best gaming performance.", "category": "Discussion"},
    {"title": "My first PC build - ₹80K budget", "content": "Just completed my first build! Ryzen 5 5600 + RTX 4060 + 16GB RAM. Happy to share my experience and answer questions.", "category": "Showcase"},
    {"title": "PC won't POST after new RAM installation", "content": "Installed new DDR5 RAM but PC won't boot. Tried clearing CMOS but no luck. Motherboard LED shows DRAM error.", "category": "Troubleshooting"},
    {"title": "DDR4 vs DDR5 - is it worth the upgrade?", "content": "Planning to upgrade from B550 to B650. Is DDR5 worth the extra cost or should I stick with DDR4 platform?", "category": "Discussion"},
]


def seed_database():
    db = SessionLocal()
    
    try:
        print("🌱 Starting database seed...")
        
        # ===== Categories =====
        print("  → Creating categories...")
        cat_map = {}
        for cat_data in CATEGORIES:
            existing = db.query(Category).filter(Category.slug == cat_data["slug"]).first()
            if not existing:
                cat = Category(**cat_data)
                db.add(cat)
                db.flush()
                cat_map[cat_data["slug"]] = cat
            else:
                cat_map[cat_data["slug"]] = existing
        
        # ===== Vendors =====
        print("  → Creating vendors...")
        vendor_map = {}
        for v_data in VENDORS:
            existing = db.query(Vendor).filter(Vendor.name == v_data["name"]).first()
            if not existing:
                v = Vendor(**v_data)
                db.add(v)
                db.flush()
                vendor_map[v_data["name"]] = v
            else:
                vendor_map[v_data["name"]] = existing
        
        # ===== Components =====
        def add_components(items, category_slug):
            for item in items:
                existing = db.query(Component).filter(Component.name == item["name"]).first()
                if not existing:
                    base_price = item.pop("price")
                    comp = Component(
                        category_id=cat_map[category_slug].id,
                        name=item["name"],
                        brand=item["brand"],
                        specs=item["specs"]
                    )
                    db.add(comp)
                    db.flush()
                    
                    # Add prices from random vendors (3-5 vendors per product)
                    vendor_list = list(vendor_map.values())
                    random.shuffle(vendor_list)
                    for vendor in vendor_list[:random.randint(3, len(vendor_list))]:
                        # Price variation: ±5%
                        price_mult = 1 + (random.random() * 0.1 - 0.05)
                        price = ComponentPrice(
                            component_id=comp.id,
                            vendor_id=vendor.id,
                            price=int(base_price * price_mult),
                            in_stock=random.random() > 0.1,  # 90% in stock
                            url=f"{vendor.website}/product/{comp.id}"
                        )
                        db.add(price)
        
        print("  → Creating CPUs...")
        add_components(CPUS, "cpu")
        
        print("  → Creating GPUs...")
        add_components(GPUS, "gpu")
        
        print("  → Creating Motherboards...")
        add_components(MOTHERBOARDS, "motherboard")
        
        print("  → Creating RAM...")
        add_components(RAM, "ram")
        
        print("  → Creating Storage...")
        add_components(STORAGE, "storage")
        
        print("  → Creating PSUs...")
        add_components(PSUS, "psu")
        
        print("  → Creating Cases...")
        add_components(CASES, "pcCase")
        
        print("  → Creating Monitors...")
        add_components(MONITORS, "monitor")
        
        # ===== Demo User =====
        print("  → Creating demo user...")
        existing_user = db.query(User).filter(User.email == "demo@pcease.in").first()
        if not existing_user:
            demo_user = User(
                email="demo@pcease.in",
                username="demo",
                hashed_password=get_password_hash("demo123")
            )
            db.add(demo_user)
            db.flush()
            
            # Add forum threads
            print("  → Creating forum threads...")
            for thread_data in FORUM_THREADS:
                thread = ForumThread(
                    user_id=demo_user.id,
                    **thread_data
                )
                db.add(thread)
        
        db.commit()
        
        # Print summary
        print("\n✅ Database seeded successfully!")
        print(f"   • Categories: {db.query(Category).count()}")
        print(f"   • Components: {db.query(Component).count()}")
        print(f"   • Vendors: {db.query(Vendor).count()}")
        print(f"   • Prices: {db.query(ComponentPrice).count()}")
        print(f"   • Users: {db.query(User).count()}")
        print(f"   • Forum Threads: {db.query(ForumThread).count()}")
        
    except Exception as e:
        db.rollback()
        print(f"❌ Error seeding database: {e}")
        raise
    finally:
        db.close()


if __name__ == "__main__":
    seed_database()
