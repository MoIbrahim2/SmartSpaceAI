import glob
import json
import random
import uuid
import os
from datetime import datetime

furniture_files = glob.glob('/home/noorelmobashar/Projects/SmartSpaceAI/back-end/knowledge_base/furniture/**/*.json', recursive=True)
rule_files = glob.glob('/home/noorelmobashar/Projects/SmartSpaceAI/back-end/knowledge_base/category_rules/*.json')

# 1. Parse category rules
category_rules = {}
for rf in rule_files:
    with open(rf, 'r', encoding='utf-8') as fp:
        data = json.load(fp)
        room_type = data.get('roomType', '').lower().replace(' ', '_')
        for r in data.get('rules', []):
            cat = r['category']
            if cat not in category_rules:
                category_rules[cat] = {
                    'roomTypes': set(),
                    'styles': set(),
                    'materials': set(),
                    'colors': set(),
                    'sizeRules': []
                }
            if room_type:
                category_rules[cat]['roomTypes'].add(room_type)
            
            defaults = r.get('defaults', {})
            category_rules[cat]['styles'].update(defaults.get('preferredStyles', []))
            category_rules[cat]['materials'].update(defaults.get('preferredMaterials', []))
            category_rules[cat]['colors'].update(defaults.get('preferredColors', []))
            
            for sz in r.get('sizeRules', []):
                dims = sz.get('recommendedDimensions', {})
                w = dims.get('width', {})
                l = dims.get('length', {})
                h = dims.get('height', {})
                w_min = w.get('min') if isinstance(w, dict) else None
                w_max = w.get('max') if isinstance(w, dict) else None
                l_min = l.get('min') if isinstance(l, dict) else None
                l_max = l.get('max') if isinstance(l, dict) else None
                h_min = h.get('min') if isinstance(h, dict) else None
                h_max = h.get('max') if isinstance(h, dict) else None
                category_rules[cat]['sizeRules'].append({
                    'w_min': w_min, 'w_max': w_max,
                    'l_min': l_min, 'l_max': l_max,
                    'h_min': h_min, 'h_max': h_max,
                    'note': sz.get('recommendedDimensions', {}).get('note', '') or sz.get('sizeVariant', '')
                })

# Fallback defaults pools
ALL_STYLES = ['Modern', 'Contemporary', 'Scandinavian', 'Classic', 'Industrial', 'Minimalist', 'Bohemian', 'Rustic', 'Traditional']
ALL_MATERIALS = ['Wood', 'Upholstered', 'Metal', 'Glass', 'Leather', 'Velvet', 'Marble', 'Fabric', 'Rattan', 'Plastic', 'Ceramic']
ALL_COLORS = ['White', 'Black', 'Beige', 'Gray', 'Brown', 'Blue', 'Green', 'Gold', 'Natural', 'Cream', 'Oak', 'Walnut']
BRANDS = ['IKEA', 'Hub Furniture', 'Kabbani Furniture', 'InHouse', 'Homzmart', 'SmartSpace', 'StyleCraft', 'Decora', 'Mobilia']
MARKETPLACES = ['IKEA', 'Hub Furniture', 'Kabbani', 'Homzmart', 'InHouse']

# Target count per JSON file to reach ~25,000 products overall across 71 files
TARGET_PER_FILE = 350

total_generated = 0

for file_path in furniture_files:
    with open(file_path, 'r', encoding='utf-8') as fp:
        existing_items = json.load(fp)
    
    if not existing_items:
        continue
    
    canonical_cat = existing_items[0]['classification']['canonicalCategory']
    existing_room_types = existing_items[0]['classification'].get('roomTypes', [])
    
    # Collect images pool for this category
    images_pool = []
    prices_pool = []
    for item in existing_items:
        for img in item.get('images', []):
            if img.get('url'):
                images_pool.append(img)
        p = item.get('pricing', {}).get('currentPrice')
        if p and p > 0:
            prices_pool.append(p)
            
    if not images_pool:
        images_pool = [{
            "url": "https://www.ikea.com/us/en/images/products/placeholder.jpg",
            "isPrimary": True,
            "width": 800,
            "height": 800,
            "altText": canonical_cat
        }]
        
    min_p = min(prices_pool) if prices_pool else 1000
    max_p = max(prices_pool) if prices_pool else 30000
    
    # Rules info
    rule_info = category_rules.get(canonical_cat, {})
    rule_styles = list(rule_info.get('styles', [])) or ALL_STYLES
    rule_materials = list(rule_info.get('materials', [])) or ALL_MATERIALS
    rule_colors = list(rule_info.get('colors', [])) or ALL_COLORS
    rule_room_types = list(rule_info.get('roomTypes', [])) or existing_room_types or ['living_room']
    size_rules = rule_info.get('sizeRules', [])
    
    # Compute overall min/max for width, length, height
    all_w_mins = [sr['w_min'] for sr in size_rules if sr['w_min'] is not None]
    all_w_maxs = [sr['w_max'] for sr in size_rules if sr['w_max'] is not None]
    all_l_mins = [sr['l_min'] for sr in size_rules if sr['l_min'] is not None]
    all_l_maxs = [sr['l_max'] for sr in size_rules if sr['l_max'] is not None]
    all_h_mins = [sr['h_min'] for sr in size_rules if sr['h_min'] is not None]
    all_h_maxs = [sr['h_max'] for sr in size_rules if sr['h_max'] is not None]

    w_range = (min(all_w_mins), max(all_w_maxs)) if (all_w_mins and all_w_maxs) else (40, 200)
    l_range = (min(all_l_mins), max(all_l_maxs)) if (all_l_mins and all_l_maxs) else (40, 220)
    h_range = (min(all_h_mins), max(all_h_maxs)) if (all_h_mins and all_h_maxs) else (30, 220)
    
    new_items = []
    
    for i in range(TARGET_PER_FILE):
        # Pick dimension variant
        if size_rules:
            sr = random.choice(size_rules)
            w_min_val = sr['w_min'] or w_range[0]
            w_max_val = sr['w_max'] or w_range[1]
            l_min_val = sr['l_min'] or l_range[0]
            l_max_val = sr['l_max'] or l_range[1]
            h_min_val = sr['h_min'] or h_range[0]
            h_max_val = sr['h_max'] or h_range[1]
            note = sr['note']
        else:
            w_min_val, w_max_val = w_range
            l_min_val, l_max_val = l_range
            h_min_val, h_max_val = h_range
            note = ''
            
        width = round(random.uniform(w_min_val, w_max_val), 1)
        length = round(random.uniform(l_min_val, l_max_val), 1)
        height = round(random.uniform(h_min_val, h_max_val), 1)
        
        style = random.choice(rule_styles)
        material = random.choice(rule_materials)
        color = random.choice(rule_colors)
        brand = random.choice(BRANDS)
        marketplace = random.choice(MARKETPLACES)
        
        # Price spectrum across cheap, balanced, premium, luxury
        tier_factor = random.choice([0.4, 0.7, 1.0, 1.5, 2.2, 3.0])
        current_price = round(random.uniform(min_p * tier_factor, max_p * tier_factor), 2)
        current_price = max(current_price, 150.0)
        
        has_discount = random.random() < 0.35
        if has_discount:
            discount_pct = round(random.uniform(5, 25), 1)
            original_price = round(current_price / (1 - discount_pct / 100), 2)
        else:
            discount_pct = 0.0
            original_price = current_price

        # Image from category image pool
        base_img = random.choice(images_pool)
        img_obj = {
            "url": base_img.get("url"),
            "isPrimary": True,
            "width": base_img.get("width", 800),
            "height": base_img.get("height", 800),
            "altText": f"{brand} {style} {canonical_cat} - {color}"
        }
        
        variant_desc = f"{note} - {style} {canonical_cat} in {material} ({color})".strip(" -")
        prod_name = f"{brand} {style} {canonical_cat} ({width}x{length} cm)" if note == '' else f"{brand} {style} {canonical_cat} - {note}"
        sku = f"SKU-{canonical_cat[:3].upper()}-{random.randint(10000, 99999)}"
        
        product_doc = {
            "externalId": str(uuid.uuid4()),
            "source": {
                "marketplace": marketplace,
                "productUrl": f"https://www.{marketplace.lower().replace(' ', '')}.com/p/{canonical_cat.lower().replace(' ', '-')}-{uuid.uuid4().hex[:8]}",
                "country": "EG",
                "scrapedAt": datetime.utcnow().strftime("%Y-%m-%d %H:%M:%S"),
                "lastUpdated": datetime.utcnow().isoformat() + "Z"
            },
            "basic": {
                "name": prod_name,
                "brand": brand,
                "description": f"High quality {prod_name}. {variant_desc}.",
                "sku": sku
            },
            "classification": {
                "canonicalCategory": canonical_cat,
                "roomTypes": rule_room_types if rule_room_types else existing_room_types,
                "styles": [style],
                "materials": [material],
                "colors": [color],
                "tags": [canonical_cat] + list(rule_room_types) + [style, material, "furniture"]
            },
            "pricing": {
                "currency": "EGP",
                "currentPrice": current_price,
                "originalPrice": original_price,
                "discountPercentage": discount_pct
            },
            "dimensions": {
                "width": width,
                "height": height,
                "length": length,
                "dimensionUnit": "cm",
                "weight": round(random.uniform(5, 80), 1),
                "weightUnit": "kg"
            },
            "images": [img_obj],
            "availability": {
                "inStock": True,
                "stockStatus": "IN_STOCK"
            },
            "rating": {
                "average": round(random.uniform(3.8, 5.0), 1),
                "reviews": random.randint(5, 180)
            },
            "processing": {
                "status": "ACCEPTED"
            }
        }
        
        new_items.append(product_doc)
        
    with open(file_path, 'w', encoding='utf-8') as fp:
        json.dump(new_items, fp, indent=2)
        fp.write('\n')
        
    total_generated += len(new_items)
    print(f"Generated {len(new_items)} products for {canonical_cat} in {os.path.basename(file_path)}")

print(f"\nSUCCESS: Generated total of {total_generated} products across all files.")
