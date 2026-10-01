-- Seed catalogue. Prices are indicative INR street prices and only meant
-- to make the app usable out of the box; refresh them before going live.

insert into public.retailers (slug, name, homepage, search_url) values
  ('amazon',      'Amazon.in',        'https://www.amazon.in',              'https://www.amazon.in/s?k={q}'),
  ('flipkart',    'Flipkart',         'https://www.flipkart.com',           'https://www.flipkart.com/search?q={q}'),
  ('mdcomputers', 'MD Computers',     'https://mdcomputers.in',             'https://mdcomputers.in/index.php?route=product/search&search={q}'),
  ('primeabgb',   'PrimeABGB',        'https://www.primeabgb.com',          'https://www.primeabgb.com/?s={q}&post_type=product'),
  ('vedant',      'Vedant Computers', 'https://www.vedantcomputers.com',    'https://www.vedantcomputers.com/index.php?route=product/search&search={q}'),
  ('itdepot',     'The IT Depot',     'https://www.theitdepot.com',         'https://www.theitdepot.com/search.html?keywords={q}'),
  ('elitehubs',   'EliteHubs',        'https://elitehubs.com',              'https://elitehubs.com/search?q={q}'),
  ('pcstudio',    'PC Studio',        'https://www.pcstudio.in',            'https://www.pcstudio.in/?s={q}&post_type=product')
on conflict (slug) do nothing;

-- Parts, plus listings generated from each part's reference price.
-- One statement with no temp tables, so it works however the SQL editor runs
-- it, and it's safe to re-run (existing rows are updated, not duplicated).
with seed_parts (slug, category, brand, name, specs, watts, tier, ref_price) as (
values
-- CPUs ---------------------------------------------------------------------
('ryzen-5-5500',      'cpu', 'AMD',   'Ryzen 5 5500',      '{"socket":"AM4","cores":6,"threads":12,"base_ghz":3.6,"boost_ghz":4.2,"memory":["DDR4"],"igpu":false,"cooler_included":true}', 65, 1, 7000),
('ryzen-5-5600g',     'cpu', 'AMD',   'Ryzen 5 5600G',     '{"socket":"AM4","cores":6,"threads":12,"base_ghz":3.9,"boost_ghz":4.4,"memory":["DDR4"],"igpu":true,"cooler_included":true}', 65, 1, 11000),
('ryzen-5-5600',      'cpu', 'AMD',   'Ryzen 5 5600',      '{"socket":"AM4","cores":6,"threads":12,"base_ghz":3.5,"boost_ghz":4.4,"memory":["DDR4"],"igpu":false,"cooler_included":true}', 65, 2, 10500),
('ryzen-7-5700x3d',   'cpu', 'AMD',   'Ryzen 7 5700X3D',   '{"socket":"AM4","cores":8,"threads":16,"base_ghz":3.0,"boost_ghz":4.1,"memory":["DDR4"],"igpu":false}', 105, 3, 19500),
('ryzen-5-7600',      'cpu', 'AMD',   'Ryzen 5 7600',      '{"socket":"AM5","cores":6,"threads":12,"base_ghz":3.8,"boost_ghz":5.1,"memory":["DDR5"],"igpu":true,"cooler_included":true}', 65, 3, 17000),
('ryzen-5-9600x',     'cpu', 'AMD',   'Ryzen 5 9600X',     '{"socket":"AM5","cores":6,"threads":12,"base_ghz":3.9,"boost_ghz":5.4,"memory":["DDR5"],"igpu":true}', 65, 3, 22000),
('ryzen-7-9700x',     'cpu', 'AMD',   'Ryzen 7 9700X',     '{"socket":"AM5","cores":8,"threads":16,"base_ghz":3.8,"boost_ghz":5.5,"memory":["DDR5"],"igpu":true}', 65, 4, 30000),
('ryzen-7-7800x3d',   'cpu', 'AMD',   'Ryzen 7 7800X3D',   '{"socket":"AM5","cores":8,"threads":16,"base_ghz":4.2,"boost_ghz":5.0,"memory":["DDR5"],"igpu":true}', 120, 5, 36000),
('ryzen-9-9900x',     'cpu', 'AMD',   'Ryzen 9 9900X',     '{"socket":"AM5","cores":12,"threads":24,"base_ghz":4.4,"boost_ghz":5.6,"memory":["DDR5"],"igpu":true}', 120, 5, 42000),
('core-i3-12100f',    'cpu', 'Intel', 'Core i3-12100F',    '{"socket":"LGA1700","cores":4,"threads":8,"base_ghz":3.3,"boost_ghz":4.3,"memory":["DDR4","DDR5"],"igpu":false,"cooler_included":true}', 58, 1, 7500),
('core-i5-12400f',    'cpu', 'Intel', 'Core i5-12400F',    '{"socket":"LGA1700","cores":6,"threads":12,"base_ghz":2.5,"boost_ghz":4.4,"memory":["DDR4","DDR5"],"igpu":false,"cooler_included":true}', 65, 2, 10500),
('core-i5-14400f',    'cpu', 'Intel', 'Core i5-14400F',    '{"socket":"LGA1700","cores":10,"threads":16,"base_ghz":2.5,"boost_ghz":4.7,"memory":["DDR4","DDR5"],"igpu":false,"cooler_included":true}', 65, 3, 13500),
('core-i5-14600kf',   'cpu', 'Intel', 'Core i5-14600KF',   '{"socket":"LGA1700","cores":14,"threads":20,"base_ghz":3.5,"boost_ghz":5.3,"memory":["DDR4","DDR5"],"igpu":false}', 125, 4, 22500),
('core-i7-14700kf',   'cpu', 'Intel', 'Core i7-14700KF',   '{"socket":"LGA1700","cores":20,"threads":28,"base_ghz":3.4,"boost_ghz":5.6,"memory":["DDR4","DDR5"],"igpu":false}', 125, 5, 33000),
-- GPUs ---------------------------------------------------------------------
('rx-6600',           'gpu', 'AMD',    'Radeon RX 6600',            '{"vram_gb":8,"memory_type":"GDDR6","boost_mhz":2491,"length_mm":190}', 132, 2, 19000),
('rtx-3050-6gb',      'gpu', 'NVIDIA', 'GeForce RTX 3050 6GB',      '{"vram_gb":6,"memory_type":"GDDR6","boost_mhz":1470,"length_mm":170}', 70, 1, 17500),
('rtx-4060',          'gpu', 'NVIDIA', 'GeForce RTX 4060',          '{"vram_gb":8,"memory_type":"GDDR6","boost_mhz":2460,"length_mm":245}', 115, 2, 29000),
('rtx-4060-ti',       'gpu', 'NVIDIA', 'GeForce RTX 4060 Ti 8GB',   '{"vram_gb":8,"memory_type":"GDDR6","boost_mhz":2535,"length_mm":245}', 160, 3, 38000),
('rtx-4070-super',    'gpu', 'NVIDIA', 'GeForce RTX 4070 Super',    '{"vram_gb":12,"memory_type":"GDDR6X","boost_mhz":2475,"length_mm":267}', 220, 4, 59000),
('rtx-4070-ti-super', 'gpu', 'NVIDIA', 'GeForce RTX 4070 Ti Super', '{"vram_gb":16,"memory_type":"GDDR6X","boost_mhz":2610,"length_mm":305}', 285, 4, 78000),
('rtx-4080-super',    'gpu', 'NVIDIA', 'GeForce RTX 4080 Super',    '{"vram_gb":16,"memory_type":"GDDR6X","boost_mhz":2550,"length_mm":320}', 320, 5, 105000),
('rx-7600',           'gpu', 'AMD',    'Radeon RX 7600',            '{"vram_gb":8,"memory_type":"GDDR6","boost_mhz":2655,"length_mm":240}', 165, 2, 25000),
('rx-7700-xt',        'gpu', 'AMD',    'Radeon RX 7700 XT',         '{"vram_gb":12,"memory_type":"GDDR6","boost_mhz":2544,"length_mm":280}', 245, 3, 40000),
('rx-7800-xt',        'gpu', 'AMD',    'Radeon RX 7800 XT',         '{"vram_gb":16,"memory_type":"GDDR6","boost_mhz":2430,"length_mm":287}', 263, 4, 48000),
('arc-b580',          'gpu', 'Intel',  'Arc B580',                  '{"vram_gb":12,"memory_type":"GDDR6","boost_mhz":2670,"length_mm":272}', 190, 2, 25000),
-- Motherboards --------------------------------------------------------------
('msi-a520m-a-pro',          'motherboard', 'MSI',      'A520M-A PRO',             '{"socket":"AM4","chipset":"A520","form_factor":"mATX","memory":"DDR4","ram_slots":2,"m2_slots":1,"wifi":false}', 35, null, 5000),
('msi-b550m-pro-vdh-wifi',   'motherboard', 'MSI',      'B550M PRO-VDH WiFi',      '{"socket":"AM4","chipset":"B550","form_factor":"mATX","memory":"DDR4","ram_slots":4,"m2_slots":2,"wifi":true}', 40, null, 9500),
('gigabyte-b550-aorus-elite-v2','motherboard','Gigabyte','B550 AORUS Elite V2',    '{"socket":"AM4","chipset":"B550","form_factor":"ATX","memory":"DDR4","ram_slots":4,"m2_slots":2,"wifi":false}', 45, null, 13000),
('msi-pro-b650m-p',          'motherboard', 'MSI',      'PRO B650M-P',             '{"socket":"AM5","chipset":"B650","form_factor":"mATX","memory":"DDR5","ram_slots":4,"m2_slots":2,"wifi":false}', 45, null, 12500),
('gigabyte-b650-aorus-elite-ax','motherboard','Gigabyte','B650 AORUS Elite AX',    '{"socket":"AM5","chipset":"B650","form_factor":"ATX","memory":"DDR5","ram_slots":4,"m2_slots":3,"wifi":true}', 50, null, 21500),
('asus-tuf-x870-plus-wifi',  'motherboard', 'ASUS',     'TUF Gaming X870-Plus WiFi','{"socket":"AM5","chipset":"X870","form_factor":"ATX","memory":"DDR5","ram_slots":4,"m2_slots":4,"wifi":true}', 55, null, 27000),
('msi-pro-h610m-e-ddr4',     'motherboard', 'MSI',      'PRO H610M-E DDR4',        '{"socket":"LGA1700","chipset":"H610","form_factor":"mATX","memory":"DDR4","ram_slots":2,"m2_slots":1,"wifi":false}', 35, null, 7000),
('asus-prime-b760m-a-wifi-d4','motherboard','ASUS',     'PRIME B760M-A WiFi D4',   '{"socket":"LGA1700","chipset":"B760","form_factor":"mATX","memory":"DDR4","ram_slots":4,"m2_slots":2,"wifi":true}', 40, null, 13000),
('gigabyte-b760m-ds3h-ax',   'motherboard', 'Gigabyte', 'B760M DS3H AX',           '{"socket":"LGA1700","chipset":"B760","form_factor":"mATX","memory":"DDR5","ram_slots":4,"m2_slots":2,"wifi":true}', 40, null, 13500),
('msi-mag-b760-tomahawk-wifi','motherboard','MSI',      'MAG B760 Tomahawk WiFi',  '{"socket":"LGA1700","chipset":"B760","form_factor":"ATX","memory":"DDR5","ram_slots":4,"m2_slots":3,"wifi":true}', 50, null, 19500),
-- Memory ---------------------------------------------------------------------
('corsair-lpx-16-3200',      'ram', 'Corsair',  'Vengeance LPX 16GB (2x8GB) DDR4-3200',  '{"memory":"DDR4","capacity_gb":16,"modules":2,"speed_mts":3200,"cas":16}', 6, null, 3300),
('gskill-ripjaws-32-3600',   'ram', 'G.Skill',  'Ripjaws V 32GB (2x16GB) DDR4-3600',     '{"memory":"DDR4","capacity_gb":32,"modules":2,"speed_mts":3600,"cas":18}', 8, null, 6200),
('kingston-fury-16-5200',    'ram', 'Kingston', 'Fury Beast 16GB (2x8GB) DDR5-5200',     '{"memory":"DDR5","capacity_gb":16,"modules":2,"speed_mts":5200,"cas":40}', 8, null, 4600),
('corsair-vengeance-32-6000','ram', 'Corsair',  'Vengeance 32GB (2x16GB) DDR5-6000',     '{"memory":"DDR5","capacity_gb":32,"modules":2,"speed_mts":6000,"cas":30}', 10, null, 9500),
('gskill-tridentz5-32-6400', 'ram', 'G.Skill',  'Trident Z5 RGB 32GB (2x16GB) DDR5-6400','{"memory":"DDR5","capacity_gb":32,"modules":2,"speed_mts":6400,"cas":32}', 10, null, 11500),
('xpg-lancer-64-6000',       'ram', 'XPG',      'Lancer 64GB (2x32GB) DDR5-6000',        '{"memory":"DDR5","capacity_gb":64,"modules":2,"speed_mts":6000,"cas":30}', 12, null, 18000),
-- Storage --------------------------------------------------------------------
('kingston-nv3-500',     'storage', 'Kingston', 'NV3 500GB NVMe',          '{"capacity_gb":500,"interface":"NVMe PCIe 4.0","read_mbs":5000,"write_mbs":3000}', 5, null, 3200),
('crucial-p3-plus-1tb',  'storage', 'Crucial',  'P3 Plus 1TB NVMe',        '{"capacity_gb":1000,"interface":"NVMe PCIe 4.0","read_mbs":5000,"write_mbs":3600}', 6, null, 5600),
('wd-sn770-1tb',         'storage', 'WD',       'Black SN770 1TB NVMe',    '{"capacity_gb":1000,"interface":"NVMe PCIe 4.0","read_mbs":5150,"write_mbs":4900}', 6, null, 6500),
('crucial-mx500-1tb',    'storage', 'Crucial',  'MX500 1TB SATA SSD',      '{"capacity_gb":1000,"interface":"SATA III","read_mbs":560,"write_mbs":510}', 4, null, 5800),
('samsung-990-pro-2tb',  'storage', 'Samsung',  '990 Pro 2TB NVMe',        '{"capacity_gb":2000,"interface":"NVMe PCIe 4.0","read_mbs":7450,"write_mbs":6900}', 8, null, 15500),
-- Power supplies -------------------------------------------------------------
('deepcool-pf450',       'psu', 'Deepcool',      'PF450 450W',            '{"wattage":450,"efficiency":"80+ White","modular":"Non-modular"}', null, null, 2900),
('deepcool-pk550d',      'psu', 'Deepcool',      'PK550D 550W',           '{"wattage":550,"efficiency":"80+ Bronze","modular":"Non-modular"}', null, null, 4000),
('cm-mwe-650-bronze-v2', 'psu', 'Cooler Master', 'MWE 650 Bronze V2',     '{"wattage":650,"efficiency":"80+ Bronze","modular":"Non-modular"}', null, null, 4600),
('corsair-rm750e',       'psu', 'Corsair',       'RM750e',                '{"wattage":750,"efficiency":"80+ Gold","modular":"Fully modular"}', null, null, 8500),
('msi-mag-a850gl',       'psu', 'MSI',           'MAG A850GL PCIE5',      '{"wattage":850,"efficiency":"80+ Gold","modular":"Fully modular"}', null, null, 9800),
('corsair-rm1000x',      'psu', 'Corsair',       'RM1000x',               '{"wattage":1000,"efficiency":"80+ Gold","modular":"Fully modular"}', null, null, 16500),
-- Cases ----------------------------------------------------------------------
('cm-q300l',             'case', 'Cooler Master', 'MasterBox Q300L',   '{"form_factors":["mATX","ITX"],"max_gpu_mm":360,"max_cooler_mm":157,"fans_included":1}', null, null, 3500),
('ant-esports-ice-112',  'case', 'Ant Esports',   'ICE-112',           '{"form_factors":["ATX","mATX","ITX"],"max_gpu_mm":320,"max_cooler_mm":160,"fans_included":4}', null, null, 3500),
('deepcool-cc560-v2',    'case', 'Deepcool',      'CC560 V2',          '{"form_factors":["ATX","mATX","ITX"],"max_gpu_mm":370,"max_cooler_mm":163,"fans_included":4}', null, null, 4500),
('nzxt-h5-flow',         'case', 'NZXT',          'H5 Flow (2024)',    '{"form_factors":["ATX","mATX","ITX"],"max_gpu_mm":365,"max_cooler_mm":165,"fans_included":2}', null, null, 8000),
('lian-li-lancool-216',  'case', 'Lian Li',       'Lancool 216',       '{"form_factors":["ATX","mATX","ITX"],"max_gpu_mm":392,"max_cooler_mm":180,"fans_included":3}', null, null, 8500),
-- Coolers --------------------------------------------------------------------
('cm-hyper-212-spectrum-v3','cooler', 'Cooler Master', 'Hyper 212 Spectrum V3', '{"type":"Air","sockets":["AM4","AM5","LGA1700"],"tdp_rating":180,"height_mm":154}', 4, null, 2500),
('deepcool-ak400',          'cooler', 'Deepcool',      'AK400',                 '{"type":"Air","sockets":["AM4","AM5","LGA1700"],"tdp_rating":220,"height_mm":155}', 4, null, 2700),
('thermalright-pa120-se',   'cooler', 'Thermalright',  'Peerless Assassin 120 SE','{"type":"Air","sockets":["AM4","AM5","LGA1700"],"tdp_rating":245,"height_mm":155}', 5, null, 3500),
('arctic-lf3-240',          'cooler', 'Arctic',        'Liquid Freezer III 240','{"type":"AIO","sockets":["AM4","AM5","LGA1700"],"tdp_rating":300,"radiator_mm":240}', 8, null, 8500)
),
upserted as (
  insert into public.parts (slug, category, brand, name, specs, watts, tier)
  select slug, category::public.part_category, brand, name, specs::jsonb, watts::int, tier::smallint
  from seed_parts
  on conflict (slug) do update
    set category = excluded.category, brand = excluded.brand, name = excluded.name,
        specs = excluded.specs, watts = excluded.watts, tier = excluded.tier
  returning id, slug
)
-- Spread each reference price across 3-6 retailers with a small, deterministic
-- variation so price comparison has something to compare.
insert into public.listings (part_id, retailer_id, price_inr, in_stock)
select
  u.id,
  r.id,
  (round(s.ref_price * (0.96 + ((u.id * 7 + r.id * 13) % 10) / 100.0) / 10) * 10 - 1)::int,
  ((u.id + r.id) % 11) <> 0
from seed_parts s
join upserted u on u.slug = s.slug
cross join public.retailers r
where (u.id * 3 + r.id) % 4 <> 0
   or r.slug = 'amazon'
on conflict (part_id, retailer_id) do update
  set price_inr = excluded.price_inr, in_stock = excluded.in_stock, updated_at = now();
