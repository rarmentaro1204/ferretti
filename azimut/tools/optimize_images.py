#!/usr/bin/env python3
"""Prepara le immagini per il sito pubblicato (usa Pillow: pip install pillow).
  images/thumb/   miniature (600 px) per gamme e schede modello: restano nel progetto, servono anche in locale
  dist/images/    copia delle immagini (già ridimensionate a 1600 px dallo scraper) + miniature, pubblicate da Netlify
Uso: python3 tools/optimize_images.py"""
import shutil
from pathlib import Path
from PIL import Image
radice = Path(__file__).resolve().parent.parent
src, thumbs, out = radice / "images", radice / "images" / "thumb", radice / "dist" / "images"
thumbs.mkdir(parents=True, exist_ok=True)
if out.exists():
    shutil.rmtree(out)
out.mkdir(parents=True)
n = tot = tot_th = 0
for f in sorted(src.glob("*.jpg")):
    im = Image.open(f).convert("RGB")
    t = thumbs / f.name
    th = im.copy(); th.thumbnail((600, 600))
    th.save(t, "JPEG", quality=62, optimize=True, progressive=True)
    shutil.copy2(f, out / f.name)
    n += 1; tot += f.stat().st_size; tot_th += t.stat().st_size
shutil.copytree(thumbs, out / "thumb")   # le miniature vanno pubblicate insieme
print(f"{n} immagini · pubblicate {tot/1e6:.1f} MB · miniature {tot_th/1e6:.1f} MB")
