"""
Nettoie les photos qui ne ressemblent pas a des plages/eau.
Analyse les couleurs : garde celles avec du bleu/sable, vire le reste.

Usage: conda run python scripts/clean-photos.py
       conda run python scripts/clean-photos.py --dry-run   (preview sans supprimer)
"""
import os
import sys
from pathlib import Path
from PIL import Image

PHOTOS_DIR = Path(__file__).parent / 'photos'
TRASH_DIR = Path(__file__).parent / 'photos_rejected'


def is_beach_photo(filepath):
    try:
        img = Image.open(filepath).convert('RGB')
        w, h = img.size
        # Trop petite = mauvaise qualite
        if w < 300 or h < 200:
            return False, 'trop petite'

        img = img.resize((100, 75))
        pixels = list(img.getdata())
        total = len(pixels)

        blue = 0
        sand = 0
        green = 0
        dark = 0

        for r, g, b in pixels:
            if b > 120 and b > r and b > g * 0.8:
                blue += 1
            elif r > 150 and g > 120 and b < g and r > b:
                sand += 1
            elif g > 100 and g > r * 0.9 and g > b:
                green += 1
            elif r < 70 and g < 70 and b < 70:
                dark += 1

        blue_pct = blue / total
        sand_pct = sand / total
        green_pct = green / total
        dark_pct = dark / total
        beach_pct = blue_pct + sand_pct

        if beach_pct >= 0.25:
            return True, f'plage ({blue_pct:.0%} bleu, {sand_pct:.0%} sable)'
        if green_pct > 0.2 and blue_pct > 0.1:
            return True, f'lac ({blue_pct:.0%} bleu, {green_pct:.0%} vert)'
        if dark_pct > 0.4:
            return False, f'trop sombre ({dark_pct:.0%})'
        return False, f'pas plage ({blue_pct:.0%} bleu, {sand_pct:.0%} sable)'
    except Exception as e:
        return True, f'erreur: {e}'


def main():
    dry_run = '--dry-run' in sys.argv

    if not PHOTOS_DIR.exists():
        print('Pas de dossier photos/')
        return

    if not dry_run:
        TRASH_DIR.mkdir(exist_ok=True)

    files = sorted(PHOTOS_DIR.glob('*'))
    images = [f for f in files if f.suffix.lower() in ('.jpg', '.jpeg', '.png', '.webp')]

    print(f'\n{len(images)} photos a analyser\n')

    kept = 0
    rejected = 0

    for f in images:
        ok, reason = is_beach_photo(f)
        if ok:
            kept += 1
            print(f'  OK  {f.name} — {reason}')
        else:
            rejected += 1
            if dry_run:
                print(f'  DEL {f.name} — {reason}')
            else:
                # Deplacer dans rejected au lieu de supprimer
                f.rename(TRASH_DIR / f.name)
                print(f'  DEL {f.name} — {reason}')

    print(f'\n{"="*50}')
    print(f'  Gardees:   {kept}')
    print(f'  Rejetees:  {rejected}')
    if not dry_run and rejected > 0:
        print(f'  (deplacees dans scripts/photos_rejected/)')
    if dry_run:
        print(f'  Mode preview — relance sans --dry-run pour nettoyer')
    print()


if __name__ == '__main__':
    main()
