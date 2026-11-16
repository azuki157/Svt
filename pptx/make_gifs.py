"""Transforme les séquences d'images 3D (fond transparent) en GIF animés recadrés, posés sur un fond uni.
Usage : python3 make_gifs.py <dossier_clips> <dossier_sortie>
"""
import sys, os, glob, subprocess, shutil
from PIL import Image

CLIPS, OUT = sys.argv[1], sys.argv[2]
os.makedirs(OUT, exist_ok=True)
WHITE, PALE = (255, 255, 255), (243, 246, 252)
# (clip, sortie, cx, cy, largeur du recadrage (px sur 1600x900), ratio l/h, largeur GIF, fps, fond)
SPEC = [
    ('title', 'title', 800, 440, 780, 0.9, 560, 12, PALE),
    ('defs', 'defs', 803, 430, 800, 1.0, 560, 12, WHITE),
    ('fem_fol', 'fem_fol', 695, 520, 900, 1.87, 700, 12, WHITE),
    ('fem_plug', 'fem_plug', 822, 520, 900, 1.87, 700, 12, WHITE),
    ('male', 'male', 800, 480, 700, 1.0, 560, 12, WHITE),
    ('stim_fol', 'stim_fol', 797, 520, 900, 2.23, 700, 12, WHITE),
    ('stim_pon', 'stim_pon', 810, 470, 1000, 2.23, 700, 12, WHITE),
    ('stim_pon', 'fiv_pon', 810, 470, 1000, 1.8, 620, 12, WHITE),
    ('ins', 'ins_cav', 803, 480, 900, 1.5, 640, 10, WHITE),
    ('dons', 'don_kids', 797, 430, 800, 1.0, 560, 10, WHITE),
    ('fiv_petri', 'fiv_petri', 800, 500, 1100, 1.8, 620, 12, WHITE),
    ('fiv_nid', 'fiv_nid', 780, 480, 900, 1.8, 620, 10, WHITE),
    ('icsi', 'icsi', 800, 450, 1500, 1.47, 700, 10, WHITE),
    ('bilan', 'bilan', 800, 470, 1300, 1.3, 560, 10, WHITE),
]
only = set(sys.argv[3:])
for clip, out, cx, cy, w, ar, ow, fps, bg in SPEC:
    if only and out not in only:
        continue
    frames = sorted(glob.glob(f'{CLIPS}/frames_{clip}/f*.png'))
    if not frames:
        print('manque', clip); continue
    h = w / ar
    tmp = f'{OUT}/_tmp_{out}'
    shutil.rmtree(tmp, ignore_errors=True); os.makedirs(tmp)
    oh = int(round(ow / ar))
    for i, f in enumerate(frames):
        im = Image.open(f).convert('RGBA'); W, H = im.size
        x0 = min(max(cx - w / 2, 0), W - w); y0 = min(max(cy - h / 2, 0), H - h)
        c = im.crop((int(x0), int(y0), int(x0 + w), int(y0 + h))).resize((ow, oh), Image.LANCZOS)
        base = Image.new('RGBA', c.size, bg + (255,)); base.alpha_composite(c)
        base.convert('RGB').save(f'{tmp}/f{i:04d}.png')
    pal = f'{tmp}/pal.png'
    subprocess.run(['ffmpeg', '-y', '-loglevel', 'error', '-framerate', str(fps), '-i', f'{tmp}/f%04d.png', '-vf', 'palettegen=max_colors=200:stats_mode=diff', pal], check=True)
    subprocess.run(['ffmpeg', '-y', '-loglevel', 'error', '-framerate', str(fps), '-i', f'{tmp}/f%04d.png', '-i', pal, '-lavfi', 'paletteuse=dither=sierra2_4a:diff_mode=rectangle', '-loop', '0', f'{OUT}/{out}.gif'], check=True)
    shutil.rmtree(tmp, ignore_errors=True)
    print(out, os.path.getsize(f'{OUT}/{out}.gif') // 1024, 'Ko', len(frames), 'images')
