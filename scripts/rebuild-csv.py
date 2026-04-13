"""
Reconstruit photos_supabase.csv en scannant les photos existantes
et en les matchant avec les données beach_data/*.json
"""
import csv, json, re, hashlib
from pathlib import Path

SCRIPT_DIR = Path(__file__).parent
PHOTOS_DIR = SCRIPT_DIR / 'photos'
DATA_DIR   = SCRIPT_DIR / 'beach_data'
CSV_OUTPUT = SCRIPT_DIR / 'photos_supabase.csv'

def sanitize_filename(name, osm_id):
    slug = name.lower()
    for a, b in [('àáâãäå','a'),('èéêë','e'),('ìíîï','i'),('òóôõö','o'),('ùúûü','u'),('ç','c'),('ñ','n')]:
        for c in a: slug = slug.replace(c, b)
    slug = re.sub(r'[^a-z0-9 -]', '', slug)
    slug = re.sub(r'\s+', '-', slug).strip('-')
    short_hash = hashlib.md5(osm_id.encode()).hexdigest()[:6]
    return f"{slug[:60]}_{short_hash}"

# Charger toutes les plages
all_beaches = []
for f in sorted(DATA_DIR.glob('beaches_*.json')):
    country = f.stem.replace('beaches_', '')
    with open(f, 'r', encoding='utf-8') as fh:
        beaches = json.load(fh)
    for b in beaches:
        b['country'] = country
    all_beaches.extend(beaches)
    print(f"  {f.name}: {len(beaches)} plages")

print(f"\nTotal: {len(all_beaches)} plages")

# Matcher avec les photos existantes
rows = []
not_found = 0
for beach in all_beaches:
    osm_id = beach['osm_id']
    name   = beach['name']
    slug   = sanitize_filename(name, osm_id)

    photo_file = None
    for ext in ['jpg','jpeg','png','webp']:
        candidate = PHOTOS_DIR / f"{slug}.{ext}"
        if candidate.exists():
            photo_file = candidate.name
            break

    if photo_file:
        rows.append([osm_id, name, beach.get('country',''), beach['lat'], beach['lng'], photo_file, 'google_maps'])
    else:
        not_found += 1

print(f"Photos trouvées: {len(rows)}")
print(f"Sans photo: {not_found}")

# Écrire le CSV
with open(CSV_OUTPUT, 'w', encoding='utf-8', newline='') as f:
    writer = csv.writer(f)
    writer.writerow(['osm_id','name','country','lat','lng','photo_file','source'])
    writer.writerows(rows)

print(f"\n✅ CSV écrit: {CSV_OUTPUT}")
print(f"   {len(rows)} entrées")
