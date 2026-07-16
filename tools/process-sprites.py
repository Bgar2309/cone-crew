#!/usr/bin/env python3
"""Turn the raw AI images (assets/sprites/, green-screen) into game assets (assets/img/).

- cone/camion: chroma-key the #00FF00 background to transparency, despill,
  crop to content, downscale -> PNG with alpha
- backdrops: downscale if needed -> optimized JPEG

Run from the repo root:  python3 tools/process-sprites.py
Requires: pip install pillow numpy
"""
import os
import numpy as np
from PIL import Image

SRC = 'assets/sprites'
DST = 'assets/img'
os.makedirs(DST, exist_ok=True)

def chroma_key(path, out, target=None):
    """target: ('h', px) or ('w', px) — max size of the output sprite."""
    im = Image.open(path).convert('RGBA')
    a = np.asarray(im).astype(np.int16)
    r, g, b = a[..., 0], a[..., 1], a[..., 2]
    d = g - np.maximum(r, b)          # greenness
    # alpha ramp: opaque below 12, transparent above 70
    alpha = np.clip((70 - d) / 58.0, 0, 1)
    alpha[d <= 12] = 1.0
    # despill: cap green at max(r,b) wherever green dominates
    g2 = np.where(d > 0, np.maximum(r, b), g)
    out_a = np.stack([r, g2, b, (alpha * 255)], axis=-1).astype(np.uint8)
    im2 = Image.fromarray(out_a, 'RGBA')
    im2 = im2.crop(im2.split()[3].getbbox())
    w, h = im2.size
    if target:
        s = target[1] / (h if target[0] == 'h' else w)
        if s < 1:
            im2 = im2.resize((round(w * s), round(h * s)), Image.LANCZOS)
    im2.save(out, optimize=True)
    print(f'{out}: {im2.size[0]}x{im2.size[1]} {os.path.getsize(out) // 1024}KB')

def bg(path, out, max_w=1920, q=85):
    im = Image.open(path).convert('RGB')
    w, h = im.size
    if w > max_w:
        im = im.resize((max_w, round(h * max_w / w)), Image.LANCZOS)
    im.save(out, quality=q, optimize=True)
    print(f'{out}: {im.size[0]}x{im.size[1]} {os.path.getsize(out) // 1024}KB')

def logo(path, out, max_h=256):
    """Already-transparent PNG (official logo): trim + downscale only."""
    im = Image.open(path).convert('RGBA')
    im = im.crop(im.split()[3].getbbox())
    w, h = im.size
    if h > max_h:
        im = im.resize((round(w * max_h / h), max_h), Image.LANCZOS)
    im.save(out, optimize=True)
    print(f'{out}: {im.size[0]}x{im.size[1]} {os.path.getsize(out) // 1024}KB')

chroma_key(f'{SRC}/cone.png',   f'{DST}/cone.png',  ('h', 1024))
chroma_key(f'{SRC}/camion.png', f'{DST}/truck.png', ('w', 1024))
logo(f'{SRC}/logo.png', f'{DST}/logo.png')
bg(f'{SRC}/dusk.png',       f'{DST}/bg-dusk.jpg')
bg(f'{SRC}/city night.png', f'{DST}/bg-night.jpg')
bg(f'{SRC}/entrepot.png',   f'{DST}/bg-depot.jpg')
bg(f'{SRC}/road dusk.png',  f'{DST}/bg-menu.jpg')
