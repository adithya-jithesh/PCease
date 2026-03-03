-- =====================================================
-- PCease v3.0 - Supabase Database Schema
-- Run this in your Supabase SQL Editor
-- =====================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ========== Users ==========
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    username VARCHAR(100) UNIQUE NOT NULL,
    hashed_password VARCHAR(255) NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ========== Categories ==========
CREATE TABLE IF NOT EXISTS categories (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) UNIQUE NOT NULL,
    slug VARCHAR(100) UNIQUE NOT NULL,
    description TEXT,
    icon VARCHAR(10),
    display_order INT DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ========== Vendors (Indian Retailers) ==========
CREATE TABLE IF NOT EXISTS vendors (
    id SERIAL PRIMARY KEY,
    name VARCHAR(200) NOT NULL,
    slug VARCHAR(100) UNIQUE NOT NULL,
    website_url VARCHAR(500),
    logo_url VARCHAR(500),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ========== Components ==========
CREATE TABLE IF NOT EXISTS components (
    id SERIAL PRIMARY KEY,
    name VARCHAR(500) NOT NULL,
    brand VARCHAR(200),
    model VARCHAR(200),
    category_id INT REFERENCES categories(id) ON DELETE SET NULL,
    specifications JSONB DEFAULT '{}',
    image_url VARCHAR(500),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_components_category ON components(category_id);
CREATE INDEX idx_components_brand ON components(brand);
CREATE INDEX idx_components_name ON components USING gin(to_tsvector('english', name));

-- ========== Component Prices ==========
CREATE TABLE IF NOT EXISTS component_prices (
    id SERIAL PRIMARY KEY,
    component_id INT REFERENCES components(id) ON DELETE CASCADE,
    vendor_id INT REFERENCES vendors(id) ON DELETE CASCADE,
    price DECIMAL(12, 2) NOT NULL,
    url VARCHAR(1000),
    in_stock BOOLEAN DEFAULT TRUE,
    last_checked TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(component_id, vendor_id)
);

CREATE INDEX idx_prices_component ON component_prices(component_id);
CREATE INDEX idx_prices_vendor ON component_prices(vendor_id);

-- ========== Builds ==========
CREATE TABLE IF NOT EXISTS builds (
    id SERIAL PRIMARY KEY,
    user_id INT REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(200) DEFAULT 'My Build',
    components JSONB DEFAULT '{}',
    total_price DECIMAL(12, 2) DEFAULT 0,
    is_public BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_builds_user ON builds(user_id);

-- ========== Shared Builds (shareable link without auth) ==========
CREATE TABLE IF NOT EXISTS shared_builds (
    id SERIAL PRIMARY KEY,
    share_id UUID DEFAULT uuid_generate_v4() UNIQUE NOT NULL,
    build_data JSONB NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    expires_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '30 days')
);

CREATE INDEX idx_shared_builds_share_id ON shared_builds(share_id);

-- ========== Forum Threads ==========
CREATE TABLE IF NOT EXISTS forum_threads (
    id SERIAL PRIMARY KEY,
    user_id INT REFERENCES users(id) ON DELETE SET NULL,
    title VARCHAR(500) NOT NULL,
    content TEXT NOT NULL,
    category VARCHAR(100) DEFAULT 'Discussion',
    upvotes INT DEFAULT 0,
    downvotes INT DEFAULT 0,
    reply_count INT DEFAULT 0,
    is_pinned BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_threads_user ON forum_threads(user_id);
CREATE INDEX idx_threads_category ON forum_threads(category);
CREATE INDEX idx_threads_created ON forum_threads(created_at DESC);

-- ========== Forum Replies ==========
CREATE TABLE IF NOT EXISTS forum_replies (
    id SERIAL PRIMARY KEY,
    thread_id INT REFERENCES forum_threads(id) ON DELETE CASCADE,
    user_id INT REFERENCES users(id) ON DELETE SET NULL,
    content TEXT NOT NULL,
    upvotes INT DEFAULT 0,
    downvotes INT DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_replies_thread ON forum_replies(thread_id);

-- ========== Forum Votes (track who voted) ==========
CREATE TABLE IF NOT EXISTS forum_votes (
    id SERIAL PRIMARY KEY,
    user_id INT REFERENCES users(id) ON DELETE CASCADE,
    thread_id INT REFERENCES forum_threads(id) ON DELETE CASCADE,
    reply_id INT REFERENCES forum_replies(id) ON DELETE CASCADE,
    vote_type VARCHAR(10) NOT NULL CHECK (vote_type IN ('upvote', 'downvote')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT unique_thread_vote UNIQUE(user_id, thread_id),
    CONSTRAINT unique_reply_vote UNIQUE(user_id, reply_id),
    CONSTRAINT vote_target CHECK (
        (thread_id IS NOT NULL AND reply_id IS NULL) OR
        (thread_id IS NULL AND reply_id IS NOT NULL)
    )
);

-- =====================================================
-- SEED DATA
-- =====================================================

-- Seed Categories
INSERT INTO categories (name, slug, icon, display_order) VALUES
    ('Processors', 'cpu', '🔧', 1),
    ('Graphics Cards', 'gpu', '🎮', 2),
    ('Motherboards', 'motherboard', '🔌', 3),
    ('Memory (RAM)', 'ram', '💾', 4),
    ('Storage', 'storage', '💿', 5),
    ('Power Supply', 'psu', '⚡', 6),
    ('Cabinet', 'case', '🖥️', 7),
    ('CPU Cooler', 'cooler', '❄️', 8)
ON CONFLICT (slug) DO NOTHING;

-- Seed Indian Vendors
INSERT INTO vendors (name, slug, website_url) VALUES
    ('Amazon.in', 'amazon-in', 'https://www.amazon.in'),
    ('Flipkart', 'flipkart', 'https://www.flipkart.com'),
    ('MD Computers', 'mdcomputers', 'https://www.mdcomputers.in'),
    ('PrimeABGB', 'primeabgb', 'https://www.primeabgb.com'),
    ('PC Studio', 'pcstudio', 'https://www.pcstudio.in'),
    ('Vedant Computers', 'vedant', 'https://www.vedantcomputers.com'),
    ('The IT Depot', 'itdepot', 'https://www.theitdepot.com')
ON CONFLICT (slug) DO NOTHING;

-- Seed Sample Components (CPUs)
INSERT INTO components (name, brand, model, category_id, specifications) VALUES
    ('AMD Ryzen 5 5600', 'AMD', 'Ryzen 5 5600', 1, '{"cores": 6, "threads": 12, "base_clock": "3.5 GHz", "boost_clock": "4.4 GHz", "tdp": 65, "socket": "AM4", "architecture": "Zen 3"}'),
    ('AMD Ryzen 5 7600', 'AMD', 'Ryzen 5 7600', 1, '{"cores": 6, "threads": 12, "base_clock": "3.8 GHz", "boost_clock": "5.1 GHz", "tdp": 65, "socket": "AM5", "architecture": "Zen 4"}'),
    ('AMD Ryzen 7 7700X', 'AMD', 'Ryzen 7 7700X', 1, '{"cores": 8, "threads": 16, "base_clock": "4.5 GHz", "boost_clock": "5.4 GHz", "tdp": 105, "socket": "AM5", "architecture": "Zen 4"}'),
    ('AMD Ryzen 9 7900X', 'AMD', 'Ryzen 9 7900X', 1, '{"cores": 12, "threads": 24, "base_clock": "4.7 GHz", "boost_clock": "5.6 GHz", "tdp": 170, "socket": "AM5", "architecture": "Zen 4"}'),
    ('Intel Core i5-14400F', 'Intel', 'Core i5-14400F', 1, '{"cores": 10, "threads": 16, "base_clock": "2.5 GHz", "boost_clock": "4.7 GHz", "tdp": 65, "socket": "LGA 1700", "architecture": "Raptor Lake Refresh"}'),
    ('Intel Core i5-14600KF', 'Intel', 'Core i5-14600KF', 1, '{"cores": 14, "threads": 20, "base_clock": "3.5 GHz", "boost_clock": "5.3 GHz", "tdp": 125, "socket": "LGA 1700", "architecture": "Raptor Lake Refresh"}'),
    ('Intel Core i7-14700KF', 'Intel', 'Core i7-14700KF', 1, '{"cores": 20, "threads": 28, "base_clock": "3.4 GHz", "boost_clock": "5.6 GHz", "tdp": 125, "socket": "LGA 1700", "architecture": "Raptor Lake Refresh"}')
ON CONFLICT DO NOTHING;

-- Seed Sample Components (GPUs)
INSERT INTO components (name, brand, model, category_id, specifications) VALUES
    ('NVIDIA GeForce RTX 4060', 'NVIDIA', 'RTX 4060', 2, '{"vram": "8 GB GDDR6", "boost_clock": "2460 MHz", "tdp": 115, "architecture": "Ada Lovelace", "ray_tracing": true, "dlss": "3.0"}'),
    ('NVIDIA GeForce RTX 4060 Ti', 'NVIDIA', 'RTX 4060 Ti', 2, '{"vram": "8 GB GDDR6", "boost_clock": "2535 MHz", "tdp": 160, "architecture": "Ada Lovelace", "ray_tracing": true, "dlss": "3.0"}'),
    ('NVIDIA GeForce RTX 4070', 'NVIDIA', 'RTX 4070', 2, '{"vram": "12 GB GDDR6X", "boost_clock": "2475 MHz", "tdp": 200, "architecture": "Ada Lovelace", "ray_tracing": true, "dlss": "3.0"}'),
    ('NVIDIA GeForce RTX 4070 Ti Super', 'NVIDIA', 'RTX 4070 Ti Super', 2, '{"vram": "16 GB GDDR6X", "boost_clock": "2610 MHz", "tdp": 285, "architecture": "Ada Lovelace", "ray_tracing": true, "dlss": "3.0"}'),
    ('AMD Radeon RX 7600', 'AMD', 'RX 7600', 2, '{"vram": "8 GB GDDR6", "boost_clock": "2655 MHz", "tdp": 165, "architecture": "RDNA 3", "ray_tracing": true, "fsr": "3.0"}'),
    ('AMD Radeon RX 7800 XT', 'AMD', 'RX 7800 XT', 2, '{"vram": "16 GB GDDR6", "boost_clock": "2430 MHz", "tdp": 263, "architecture": "RDNA 3", "ray_tracing": true, "fsr": "3.0"}')
ON CONFLICT DO NOTHING;

-- Seed Sample Components (RAM)
INSERT INTO components (name, brand, model, category_id, specifications) VALUES
    ('Corsair Vengeance DDR5 16GB (2x8GB) 5600MHz', 'Corsair', 'CMK16GX5M2B5600C36', 4, '{"capacity": "16 GB (2x8GB)", "type": "DDR5", "speed": "5600 MHz", "latency": "CL36", "voltage": "1.25V"}'),
    ('G.Skill Trident Z5 32GB (2x16GB) 6000MHz', 'G.Skill', 'F5-6000J3038F16GX2-TZ5N', 4, '{"capacity": "32 GB (2x16GB)", "type": "DDR5", "speed": "6000 MHz", "latency": "CL30", "voltage": "1.35V"}'),
    ('Kingston Fury Beast DDR5 16GB (2x8GB) 5200MHz', 'Kingston', 'KF552C40BBK2-16', 4, '{"capacity": "16 GB (2x8GB)", "type": "DDR5", "speed": "5200 MHz", "latency": "CL40", "voltage": "1.25V"}'),
    ('Corsair Vengeance LPX DDR4 16GB (2x8GB) 3200MHz', 'Corsair', 'CMK16GX4M2E3200C16', 4, '{"capacity": "16 GB (2x8GB)", "type": "DDR4", "speed": "3200 MHz", "latency": "CL16", "voltage": "1.35V"}')
ON CONFLICT DO NOTHING;

-- Seed Sample Components (Storage)
INSERT INTO components (name, brand, model, category_id, specifications) VALUES
    ('Samsung 990 Pro 1TB NVMe M.2 SSD', 'Samsung', '990 Pro 1TB', 5, '{"capacity": "1 TB", "type": "NVMe M.2", "read_speed": "7450 MB/s", "write_speed": "6900 MB/s", "interface": "PCIe Gen 4"}'),
    ('WD Black SN770 1TB NVMe M.2 SSD', 'Western Digital', 'SN770 1TB', 5, '{"capacity": "1 TB", "type": "NVMe M.2", "read_speed": "5150 MB/s", "write_speed": "4900 MB/s", "interface": "PCIe Gen 4"}'),
    ('Crucial P3 Plus 1TB NVMe M.2 SSD', 'Crucial', 'P3 Plus 1TB', 5, '{"capacity": "1 TB", "type": "NVMe M.2", "read_speed": "5000 MB/s", "write_speed": "4200 MB/s", "interface": "PCIe Gen 4"}')
ON CONFLICT DO NOTHING;

-- Seed Sample Components (PSU)
INSERT INTO components (name, brand, model, category_id, specifications) VALUES
    ('Corsair RM650 650W 80+ Gold', 'Corsair', 'RM650', 6, '{"wattage": 650, "efficiency": "80+ Gold", "modular": "Fully Modular", "fan_size": "135mm"}'),
    ('Corsair RM750 750W 80+ Gold', 'Corsair', 'RM750', 6, '{"wattage": 750, "efficiency": "80+ Gold", "modular": "Fully Modular", "fan_size": "135mm"}'),
    ('Cooler Master MWE 650W V2 80+ Bronze', 'Cooler Master', 'MWE 650 V2', 6, '{"wattage": 650, "efficiency": "80+ Bronze", "modular": "Non-Modular", "fan_size": "120mm"}'),
    ('Deepcool PF750 750W 80+ White', 'Deepcool', 'PF750', 6, '{"wattage": 750, "efficiency": "80+ White", "modular": "Non-Modular", "fan_size": "120mm"}')
ON CONFLICT DO NOTHING;

-- Seed Sample Prices (linking components to vendors with INR prices)
-- CPUs
INSERT INTO component_prices (component_id, vendor_id, price, in_stock) VALUES
    (1, 1, 10499, true), (1, 3, 10299, true), (1, 4, 10399, true),
    (2, 1, 16999, true), (2, 3, 16499, true), (2, 5, 16799, true),
    (3, 1, 28499, true), (3, 3, 27999, true), (3, 4, 28299, true),
    (4, 1, 39999, true), (4, 3, 38999, true),
    (5, 1, 13499, true), (5, 2, 13299, true), (5, 3, 12999, true),
    (6, 1, 22499, true), (6, 3, 21999, true),
    (7, 1, 32999, true), (7, 3, 31999, true), (7, 4, 32499, true)
ON CONFLICT (component_id, vendor_id) DO NOTHING;

-- GPUs
INSERT INTO component_prices (component_id, vendor_id, price, in_stock) VALUES
    (8, 1, 29999, true), (8, 3, 28999, true), (8, 5, 29499, true),
    (9, 1, 38999, true), (9, 3, 37999, true),
    (10, 1, 52999, true), (10, 3, 51999, true), (10, 4, 52499, true),
    (11, 1, 69999, true), (11, 3, 68499, true),
    (12, 1, 24999, true), (12, 3, 23999, true), (12, 6, 24499, true),
    (13, 1, 44999, true), (13, 3, 43999, true)
ON CONFLICT (component_id, vendor_id) DO NOTHING;

-- RAM
INSERT INTO component_prices (component_id, vendor_id, price, in_stock) VALUES
    (14, 1, 4999, true), (14, 3, 4799, true),
    (15, 1, 9999, true), (15, 3, 9499, true),
    (16, 1, 4499, true), (16, 3, 4299, true),
    (17, 1, 3299, true), (17, 3, 3099, true), (17, 2, 3199, true)
ON CONFLICT (component_id, vendor_id) DO NOTHING;

-- Storage
INSERT INTO component_prices (component_id, vendor_id, price, in_stock) VALUES
    (18, 1, 8499, true), (18, 3, 7999, true),
    (19, 1, 5999, true), (19, 3, 5699, true), (19, 6, 5799, true),
    (20, 1, 4499, true), (20, 3, 4199, true)
ON CONFLICT (component_id, vendor_id) DO NOTHING;

-- PSU
INSERT INTO component_prices (component_id, vendor_id, price, in_stock) VALUES
    (21, 1, 7499, true), (21, 3, 6999, true),
    (22, 1, 8499, true), (22, 3, 7999, true),
    (23, 1, 4299, true), (23, 3, 3999, true),
    (24, 1, 4999, true), (24, 3, 4699, true)
ON CONFLICT (component_id, vendor_id) DO NOTHING;

-- ========== Row Level Security (Optional) ==========
-- Enable RLS on tables for production security
-- ALTER TABLE users ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE builds ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE forum_threads ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE forum_replies ENABLE ROW LEVEL SECURITY;

-- ========== Useful Views ==========
CREATE OR REPLACE VIEW components_with_prices AS
SELECT 
    c.*,
    cat.name as category_name,
    cat.slug as category_slug,
    MIN(cp.price) as min_price,
    MAX(cp.price) as max_price,
    COUNT(cp.id) as vendor_count
FROM components c
LEFT JOIN categories cat ON c.category_id = cat.id
LEFT JOIN component_prices cp ON c.id = cp.component_id AND cp.in_stock = true
WHERE c.is_active = true
GROUP BY c.id, cat.name, cat.slug;

-- Done! Your PCease database is ready.
-- Next steps:
-- 1. Copy your Supabase URL and anon key to your .env files
-- 2. Also get the service_role key for the backend
-- 3. Deploy backend to Render, frontend to Vercel
