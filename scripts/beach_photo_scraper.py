"""
=================================================================
  BEACHFINDER - GOOGLE MAPS PHOTO SCRAPER

  1. Recupere toutes les plages/lacs/baignades via Overpass (OSM)
  2. Pour chaque plage, va sur Google Maps
  3. Recupere la premiere photo du lieu
  4. Sauvegarde localement + genere CSV pour Supabase

  Usage:
    pip install playwright Pillow
    playwright install chromium
    python scripts/beach_photo_scraper.py
    python scripts/beach_photo_scraper.py --country FR    (un seul pays)
    python scripts/beach_photo_scraper.py --resume         (reprendre)
=================================================================
"""
import csv
import os
import sys
import json
import time
import re
import requests
import hashlib
from pathlib import Path
from urllib.parse import quote

sys.stdout.reconfigure(encoding='utf-8', errors='replace')
sys.stderr.reconfigure(encoding='utf-8', errors='replace')

from playwright.sync_api import sync_playwright
from PIL import Image
from io import BytesIO

# === CONFIG ===
SCRIPT_DIR = Path(__file__).parent
PHOTOS_DIR = SCRIPT_DIR / 'photos'
DATA_DIR = SCRIPT_DIR / 'beach_data'
PROGRESS_FILE = SCRIPT_DIR / 'scraper_progress.json'
CSV_OUTPUT = SCRIPT_DIR / 'photos_supabase.csv'
LOG_FILE = SCRIPT_DIR / 'scraper_log.txt'

PHOTOS_DIR.mkdir(exist_ok=True)
DATA_DIR.mkdir(exist_ok=True)

# Delais (comme un humain)
DELAY_BETWEEN_BEACH = 4      # secondes entre chaque plage
DELAY_PAGE_LOAD = 3           # attente chargement page
DELAY_PHOTO_CLICK = 2         # attente apres clic photo
BATCH_SAVE = 20               # sauvegarder le CSV tous les N
MAX_PHOTO_SIZE = 800           # largeur max demandee

# === PAYS ===
# Europe + USA, par code ISO + bbox approximatif pour Overpass
COUNTRIES = {
    # --- France (decoupe en regions pour eviter timeout Overpass) ---
    'FR-NW':  {'name': 'France Nord-Ouest (Bretagne/Normandie)', 'bbox': '47.0,-5.2,49.8,0.5'},
    'FR-NE':  {'name': 'France Nord-Est (Hauts/Grand Est)', 'bbox': '47.5,0.5,51.1,8.3'},
    'FR-W':   {'name': 'France Ouest (Pays de Loire/Nouvelle Aq.)', 'bbox': '44.0,-2.0,47.5,1.0'},
    'FR-SW':  {'name': 'France Sud-Ouest (Landes/Basque/Occitanie W)', 'bbox': '42.3,-2.0,44.5,2.0'},
    'FR-SE':  {'name': 'France Sud-Est (PACA/Corse)', 'bbox': '41.3,2.0,45.0,9.6'},
    'FR-C':   {'name': 'France Centre (Auvergne/Rhone-Alpes)', 'bbox': '44.5,1.0,47.0,7.2'},
    'FR-MED': {'name': 'France Mediterranee (Occitanie E/Herault)', 'bbox': '42.3,2.0,44.5,5.0'},
    # --- Espagne ---
    'ES-N':  {'name': 'Espagne Nord', 'bbox': '41.5,-9.5,43.8,3.3'},
    'ES-E':  {'name': 'Espagne Est (Catalogne/Valence)', 'bbox': '37.5,-1.0,42.5,4.5'},
    'ES-S':  {'name': 'Espagne Sud (Andalousie)', 'bbox': '35.8,-7.5,38.5,-1.0'},
    'ES-BAL': {'name': 'Espagne Baleares', 'bbox': '38.5,1.0,40.2,4.5'},
    'ES-CAN': {'name': 'Espagne Canaries', 'bbox': '27.5,-18.5,29.5,-13.3'},
    # --- Italie ---
    'IT-N':  {'name': 'Italie Nord (Ligurie/Adriatique)', 'bbox': '43.5,6.5,46.5,14.0'},
    'IT-C':  {'name': 'Italie Centre (Toscane/Latium)', 'bbox': '40.5,9.5,43.5,16.5'},
    'IT-S':  {'name': 'Italie Sud + Iles', 'bbox': '36.0,8.0,41.0,18.6'},
    # --- Autres pays (plus petits = pas de decoupe) ---
    'PT':  {'name': 'Portugal', 'bbox': '36.9,-9.6,42.2,-6.1'},
    'GR':  {'name': 'Grece', 'bbox': '34.5,19.2,42.0,29.7'},
    'HR':  {'name': 'Croatie', 'bbox': '42.3,13.4,46.6,19.5'},
    'TR-W': {'name': 'Turquie Ouest (Egee/Med)', 'bbox': '35.8,25.5,41.2,32.0'},
    'TR-S': {'name': 'Turquie Sud (Antalya)', 'bbox': '35.8,28.5,37.5,36.5'},
    'GB':  {'name': 'Royaume-Uni', 'bbox': '49.8,-8.7,59.0,2.0'},
    'DE':  {'name': 'Allemagne', 'bbox': '47.2,5.8,55.1,15.1'},
    'NL':  {'name': 'Pays-Bas', 'bbox': '50.7,3.3,53.6,7.3'},
    'BE':  {'name': 'Belgique', 'bbox': '49.4,2.5,51.5,6.4'},
    'DK':  {'name': 'Danemark', 'bbox': '54.5,8.0,57.8,15.2'},
    'SE':  {'name': 'Suede', 'bbox': '55.3,10.9,69.1,24.2'},
    'NO':  {'name': 'Norvege', 'bbox': '57.9,4.5,71.2,31.2'},
    'PL':  {'name': 'Pologne', 'bbox': '49.0,14.1,54.9,24.2'},
    'IE':  {'name': 'Irlande', 'bbox': '51.3,-10.7,55.5,-5.9'},
    'ME':  {'name': 'Montenegro', 'bbox': '41.8,18.4,43.6,20.4'},
    'AL':  {'name': 'Albanie', 'bbox': '39.6,19.2,42.7,21.1'},
    'BG':  {'name': 'Bulgarie', 'bbox': '41.2,22.3,44.2,28.7'},
    'RO':  {'name': 'Roumanie', 'bbox': '43.5,22.0,48.3,30.0'},
    'CY':  {'name': 'Chypre', 'bbox': '34.5,32.2,35.8,34.6'},
    'MT':  {'name': 'Malte', 'bbox': '35.7,14.1,36.1,14.6'},
    # --- USA ---
    'US-NE': {'name': 'USA Nord-Est', 'bbox': '38.5,-82.0,47.5,-66.5'},
    'US-SE': {'name': 'USA Sud-Est', 'bbox': '24.5,-92.0,38.5,-75.0'},
    'US-W':  {'name': 'USA Ouest (Californie/Oregon)', 'bbox': '32.0,-125.0,49.0,-117.0'},
    'US-SW': {'name': 'USA Sud-Ouest', 'bbox': '24.5,-117.0,37.0,-104.0'},
    'US-GL': {'name': 'USA Grands Lacs', 'bbox': '38.5,-92.0,49.0,-82.0'},
    'US-HI': {'name': 'USA Hawaii', 'bbox': '18.5,-161.0,22.5,-154.5'},
    'US-FL': {'name': 'USA Floride', 'bbox': '24.5,-88.0,31.0,-79.5'},
}


def log(msg):
    print(msg, flush=True)
    try:
        with open(LOG_FILE, 'a', encoding='utf-8') as f:
            f.write(f"{time.strftime('%H:%M:%S')} {msg}\n")
    except:
        pass


# ===================================================================
# ETAPE 1 : Recuperer les plages depuis Overpass API (OpenStreetMap)
# ===================================================================

def build_overpass_query_bbox(bbox):
    """Query Overpass par bounding box"""
    return f"""[out:json][timeout:180];
(
  node["natural"="beach"]({bbox});
  way["natural"="beach"]({bbox});
  node["leisure"="swimming_area"]({bbox});
  way["leisure"="swimming_area"]({bbox});
  node["leisure"="bathing_place"]({bbox});
  way["leisure"="bathing_place"]({bbox});
);
out body center;"""


def fetch_beaches_for_country(code, info):
    """Recupere toutes les plages d'une region via Overpass"""
    cache_file = DATA_DIR / f'beaches_{code}.json'

    # Cache local
    if cache_file.exists():
        with open(cache_file, 'r', encoding='utf-8') as f:
            beaches = json.load(f)
        log(f"  Cache: {len(beaches)} plages")
        return beaches

    query = build_overpass_query_bbox(info['bbox'])

    log(f"  Overpass query...")
    try:
        resp = requests.post(
            'https://overpass-api.de/api/interpreter',
            data={'data': query},
            timeout=200,
        )
        if resp.status_code != 200:
            log(f"  ERREUR Overpass: {resp.status_code}")
            return []
        data = resp.json()
    except Exception as e:
        log(f"  ERREUR Overpass: {e}")
        return []

    beaches = []
    seen = set()

    for el in data.get('elements', []):
        uid = f"{el['type']}/{el['id']}"
        if uid in seen:
            continue
        seen.add(uid)

        lat = el.get('lat') or (el.get('center', {}) or {}).get('lat')
        lng = el.get('lon') or (el.get('center', {}) or {}).get('lon')
        if not lat or not lng:
            continue

        tags = el.get('tags', {})
        name = (
            tags.get('name')
            or tags.get('name:fr')
            or tags.get('name:en')
            or tags.get('name:es')
            or tags.get('name:it')
            or tags.get('name:de')
            or tags.get('water:name')
            or None
        )

        # Skip unnamed beaches for photo scraping (can't search them)
        if not name:
            continue

        city = (
            tags.get('addr:city')
            or tags.get('addr:town')
            or tags.get('addr:municipality')
            or tags.get('is_in')
            or ''
        )

        beaches.append({
            'osm_id': uid,
            'name': name,
            'city': city,
            'lat': lat,
            'lng': lng,
            'country': code,
        })

    # Cache
    with open(cache_file, 'w', encoding='utf-8') as f:
        json.dump(beaches, f, ensure_ascii=False, indent=2)

    log(f"  Trouve: {len(beaches)} plages nommees")
    return beaches


def fetch_all_beaches(country_filter=None):
    """Recupere toutes les plages pour tous les pays"""
    all_beaches = []
    countries = COUNTRIES

    if country_filter:
        countries = {k: v for k, v in COUNTRIES.items() if k == country_filter}
        if not countries:
            log(f"Pays '{country_filter}' non trouve. Disponibles: {list(COUNTRIES.keys())}")
            return []

    for code, info in countries.items():
        log(f"\n{'='*50}")
        log(f"  {info['name']} ({code})")
        log(f"{'='*50}")

        beaches = fetch_beaches_for_country(code, info)
        all_beaches.extend(beaches)

        # Be nice to Overpass
        time.sleep(10)

    log(f"\n{'='*50}")
    log(f"  TOTAL: {len(all_beaches)} plages nommees")
    log(f"{'='*50}\n")

    return all_beaches


# ===================================================================
# ETAPE 2 : Scraper les photos depuis Google Maps
# ===================================================================

def sanitize_filename(name, osm_id):
    """Genere un nom de fichier propre"""
    slug = name.lower()
    # Normaliser les accents
    replacements = {
        'é': 'e', 'è': 'e', 'ê': 'e', 'ë': 'e',
        'à': 'a', 'â': 'a', 'ä': 'a',
        'ù': 'u', 'û': 'u', 'ü': 'u',
        'î': 'i', 'ï': 'i',
        'ô': 'o', 'ö': 'o',
        'ç': 'c', 'ñ': 'n',
        "'": '', '"': '', '/': '-',
    }
    for old, new in replacements.items():
        slug = slug.replace(old, new)
    slug = re.sub(r'[^a-z0-9 -]', '', slug)
    slug = re.sub(r'\s+', '-', slug).strip('-')
    # Add hash of osm_id for uniqueness
    short_hash = hashlib.md5(osm_id.encode()).hexdigest()[:6]
    return f"{slug[:60]}_{short_hash}"


def is_beach_photo_data(img_data):
    """
    Verifie si les bytes d'une image ressemblent a une plage/lac/mer.
    Filtre strict: doit avoir eau (bleu) OU sable golden visible.
    Retourne (True/False, raison)
    """
    try:
        img = Image.open(BytesIO(img_data)).convert('RGB')
        w, h = img.size
        if w < 300 or h < 200:
            return False, 'trop petite'

        img = img.resize((100, 75))
        pixels = list(img.getdata())
        total = len(pixels)

        blue = sand = green = dark = grey = white = 0
        for r, g, b in pixels:
            # Bleu eau/ciel: clairement bleu dominant
            if b > 100 and b > r + 15 and b > g * 0.85:
                blue += 1
            # Sable/plage: tons chauds dorés (pas juste beige générique)
            elif r > 170 and g > 130 and b < 120 and r > g + 15 and r > b + 50:
                sand += 1
            # Vert nature: végétation
            elif g > 90 and g > r + 10 and g > b + 10:
                green += 1
            # Sombre
            elif r < 60 and g < 60 and b < 60:
                dark += 1
            # Gris (intérieur/route/béton): r≈g≈b et pas trop clair
            elif abs(r - g) < 20 and abs(g - b) < 20 and abs(r - b) < 20 and r < 200:
                grey += 1
            # Blanc/beige uniforme (murs intérieur)
            elif r > 180 and g > 165 and b > 150 and abs(r - g) < 30:
                white += 1

        bp = blue / total
        sp = sand / total
        gp = green / total
        dp = dark / total
        grey_p = grey / total
        white_p = white / total

        interior_p = grey_p + white_p

        # Rejet prioritaire: trop d'intérieur (murs, béton, route)
        if interior_p > 0.50:
            return False, f'{interior_p:.0%} interieur/beton'
        if dp > 0.40:
            return False, f'trop sombre {dp:.0%}'

        # Acceptation: doit avoir eau bleue visible
        if bp >= 0.20:
            return True, f'{bp:.0%} bleu eau/ciel'

        # Acceptation: eau + sable (plage classique)
        if bp + sp >= 0.30:
            return True, f'{bp:.0%} bleu {sp:.0%} sable'

        # Acceptation: lac/rivière (vert + un peu bleu)
        if gp > 0.25 and bp > 0.08:
            return True, f'{bp:.0%} bleu {gp:.0%} vert (lac)'

        # Acceptation: sable doré dominant (dunes, plage vue en plongée)
        if sp >= 0.30:
            return True, f'{sp:.0%} sable dore'

        # Rejet: pas assez d'éléments naturels eau/plage
        nature_pct = bp + sp + gp
        if nature_pct < 0.30:
            return False, f'{nature_pct:.0%} nature insuffisant'

        return False, f'b={bp:.0%} s={sp:.0%} g={gp:.0%} gris={grey_p:.0%} - pas plage'
    except:
        return False, 'erreur analyse'


def get_all_photo_urls(page):
    """Recupere TOUTES les URLs de photos googleusercontent sur la page, triees par taille"""
    return page.evaluate('''() => {
        const candidates = [];
        document.querySelectorAll('img').forEach(img => {
            const src = img.src || '';
            if (!src.includes('googleusercontent.com')) return;
            if (img.naturalWidth < 100 || img.naturalHeight < 80) return;
            if (src.includes('/a-/') || src.includes('=s32') || src.includes('=s40') || src.includes('=s48')) return;
            candidates.push({ src, score: img.naturalWidth * img.naturalHeight });
        });
        document.querySelectorAll('[style*="googleusercontent"]').forEach(el => {
            const style = el.getAttribute('style') || '';
            const m = style.match(/url\\("?([^"\\)]+googleusercontent[^"\\)]+)"?\\)/);
            if (m && !m[1].includes('/a-/')) {
                candidates.push({ src: m[1], score: el.offsetWidth * el.offsetHeight });
            }
        });
        candidates.sort((a, b) => b.score - a.score);
        // Deduplicate et forcer haute res
        const seen = new Set();
        return candidates.filter(c => {
            let base = c.src.split('=')[0];
            if (seen.has(base)) return false;
            seen.add(base);
            return true;
        }).map(c => {
            let u = c.src.replace(/=w\\d+[^&]*/g, '').replace(/=h\\d+[^&]*/g, '').replace(/=s\\d+[^&]*/g, '');
            if (u.includes('?')) u = u.split('?')[0];
            return u + '=w800-h600-k-no';
        });
    }''')


def download_and_check(photo_url, slug):
    """Telecharge une photo et verifie que ca ressemble a une plage. Retourne (filepath, ok, reason)"""
    try:
        headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
            'Referer': 'https://www.google.com/maps/',
        }
        resp = requests.get(photo_url, headers=headers, timeout=15)
        if resp.status_code != 200:
            return None, False, 'download failed'

        data = resp.content
        if len(data) < 15000:
            return None, False, 'trop petite'

        ok, reason = is_beach_photo_data(data)
        if not ok:
            return None, False, reason

        ct = resp.headers.get('content-type', 'image/jpeg')
        ext = 'jpg'
        if 'png' in ct: ext = 'png'
        elif 'webp' in ct: ext = 'webp'

        filepath = PHOTOS_DIR / f"{slug}.{ext}"
        with open(filepath, 'wb') as f:
            f.write(data)
        return str(filepath), True, reason
    except:
        return None, False, 'erreur'


def scrape_photo(page, beach):
    """
    Va sur Google Maps, cherche la plage.
    Ouvre le carousel de photos et navigue jusqu'a trouver une vraie photo de plage/eau.
    Teste jusqu'a 5 photos.
    """
    name = beach['name']
    lat = beach['lat']
    lng = beach['lng']
    slug = sanitize_filename(name, beach['osm_id'])
    MAX_TRIES = 5

    # Check if already downloaded
    for ext in ['jpg', 'jpeg', 'png', 'webp']:
        if (PHOTOS_DIR / f"{slug}.{ext}").exists():
            return str(PHOTOS_DIR / f"{slug}.{ext}")

    # Aller sur Google Maps
    search_query = f"{name}"
    url = f"https://www.google.com/maps/search/{quote(search_query)}/@{lat},{lng},15z"

    try:
        page.goto(url, wait_until='networkidle', timeout=15000)
    except:
        page.wait_for_timeout(3000)

    # Accepter cookies
    try:
        accept = page.query_selector(
            'button[aria-label*="Accept all"], '
            'button[aria-label*="Tout accepter"], '
            'button:has-text("Accept all"), '
            'button:has-text("Tout accepter")'
        )
        if accept:
            accept.click()
            page.wait_for_timeout(2000)
    except:
        pass

    page.wait_for_timeout(DELAY_PAGE_LOAD * 1000)

    # Cliquer sur le premier resultat si c'est une liste
    try:
        first_result = page.query_selector('a[href*="/maps/place/"]')
        if first_result:
            first_result.click()
            page.wait_for_timeout(DELAY_PAGE_LOAD * 1000)
    except:
        pass

    # Ouvrir le carousel de photos en cliquant sur la photo principale
    carousel_opened = False
    try:
        photo_area = page.query_selector(
            'button[jsaction*="heroHeaderImage"], '
            'button[jsaction*="photo"], '
            '[data-photo-index="0"], '
            '.aoRNLd, '
            'img[decoding="async"][src*="googleusercontent"]'
        )
        if photo_area:
            photo_area.click()
            page.wait_for_timeout(3000)
            carousel_opened = True
    except:
        pass

    # Collecter les photos en naviguant dans le carousel
    tested_urls = set()

    for attempt in range(MAX_TRIES):
        # Recuperer la photo actuellement visible
        photo_urls = get_all_photo_urls(page)

        # Trouver une URL pas encore testee
        new_url = None
        for u in photo_urls:
            base = u.split('=')[0]
            if base not in tested_urls:
                new_url = u
                tested_urls.add(base)
                break

        if not new_url:
            # Plus de nouvelles photos, on arrete
            if carousel_opened:
                # Essayer de naviguer a la photo suivante avec fleche droite
                try:
                    page.keyboard.press('ArrowRight')
                    page.wait_for_timeout(1500)
                    photo_urls = get_all_photo_urls(page)
                    for u in photo_urls:
                        base = u.split('=')[0]
                        if base not in tested_urls:
                            new_url = u
                            tested_urls.add(base)
                            break
                except:
                    pass

            if not new_url:
                break

        # Telecharger et verifier
        filepath, ok, reason = download_and_check(new_url, slug)
        if ok:
            log(f"    Photo {attempt+1}/{MAX_TRIES} OK ({reason})")
            return filepath
        else:
            log(f"    Photo {attempt+1} rejetee: {reason}")

        # Passer a la photo suivante dans le carousel
        if carousel_opened:
            try:
                page.keyboard.press('ArrowRight')
                page.wait_for_timeout(1500)
            except:
                pass

    return None


# ===================================================================
# ETAPE 3 : Orchestration
# ===================================================================

def load_progress():
    if PROGRESS_FILE.exists():
        try:
            with open(PROGRESS_FILE, 'r') as f:
                return json.load(f)
        except:
            pass
    return {'index': 0, 'found': 0, 'failed': 0, 'total': 0}


def save_progress(p):
    with open(PROGRESS_FILE, 'w') as f:
        json.dump(p, f)


def main():
    import argparse
    parser = argparse.ArgumentParser()
    parser.add_argument('--country', type=str, default=None, help='Code pays (FR, ES, US-NE...)')
    parser.add_argument('--resume', action='store_true', help='Reprendre depuis la progression')
    parser.add_argument('--skip-overpass', action='store_true', help='Skip Overpass, utiliser le cache')
    args = parser.parse_args()

    log("=" * 60)
    log("  BEACHFINDER - GOOGLE MAPS PHOTO SCRAPER")
    log("  Playwright + Overpass + Google Maps")
    log("=" * 60)

    # Step 1: Get all beaches
    if args.skip_overpass:
        all_beaches = []
        for f in DATA_DIR.glob('beaches_*.json'):
            with open(f, 'r', encoding='utf-8') as fh:
                all_beaches.extend(json.load(fh))
        log(f"\nCache total: {len(all_beaches)} plages")
    else:
        all_beaches = fetch_all_beaches(args.country)

    if not all_beaches:
        log("Aucune plage trouvee!")
        return

    # Step 2: Scrape photos
    progress = load_progress() if args.resume else {'index': 0, 'found': 0, 'failed': 0, 'total': len(all_beaches)}
    start_idx = progress['index']
    found = progress['found']
    failed = progress['failed']

    # Prepare CSV header if new
    if not CSV_OUTPUT.exists() or start_idx == 0:
        with open(CSV_OUTPUT, 'w', encoding='utf-8', newline='') as f:
            writer = csv.writer(f)
            writer.writerow(['osm_id', 'name', 'country', 'lat', 'lng', 'photo_file', 'source'])

    log(f"\nDemarrage scraping photos: {len(all_beaches)} plages")
    log(f"Reprise depuis index {start_idx}\n")

    csv_batch = []

    with sync_playwright() as p:
        browser = p.chromium.launch(
            headless=False,
            args=[
                '--disable-blink-features=AutomationControlled',
                '--disable-dev-shm-usage',
                '--no-sandbox',
            ]
        )
        context = browser.new_context(
            user_agent='Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36',
            locale='fr-FR',
            viewport={'width': 1280, 'height': 900},
        )
        page = context.new_page()

        for i in range(start_idx, len(all_beaches)):
            beach = all_beaches[i]
            pct = (i + 1) / len(all_beaches) * 100
            prefix = f"[{pct:.1f}%] [{i+1}/{len(all_beaches)}]"

            log(f"{prefix} {beach['name']} ({beach.get('country', '?')})...")

            try:
                photo_path = scrape_photo(page, beach)

                if photo_path:
                    found += 1
                    photo_file = Path(photo_path).name
                    log(f"  --> {photo_file}")
                    csv_batch.append([
                        beach['osm_id'], beach['name'], beach.get('country', ''),
                        beach['lat'], beach['lng'], photo_file, 'google_maps'
                    ])
                else:
                    failed += 1
                    log(f"  --> PAS DE PHOTO")

            except Exception as e:
                failed += 1
                log(f"  --> ERREUR: {str(e)[:80]}")

            # Save batch
            if csv_batch and len(csv_batch) >= BATCH_SAVE:
                with open(CSV_OUTPUT, 'a', encoding='utf-8', newline='') as f:
                    writer = csv.writer(f)
                    writer.writerows(csv_batch)
                csv_batch = []

            # Save progress
            save_progress({
                'index': i + 1,
                'found': found,
                'failed': failed,
                'total': len(all_beaches),
            })

            # Pause naturelle
            time.sleep(DELAY_BETWEEN_BEACH)

        browser.close()

    # Final save
    if csv_batch:
        with open(CSV_OUTPUT, 'a', encoding='utf-8', newline='') as f:
            writer = csv.writer(f)
            writer.writerows(csv_batch)

    log(f"\n{'='*60}")
    log(f"  TERMINE!")
    log(f"  Photos trouvees: {found}")
    log(f"  Echecs: {failed}")
    log(f"  Total plages: {len(all_beaches)}")
    log(f"\n  Photos: {PHOTOS_DIR}")
    log(f"  CSV:    {CSV_OUTPUT}")
    log(f"{'='*60}")


if __name__ == '__main__':
    main()
