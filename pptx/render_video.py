"""Vidéo du PowerPoint : plaques de slides (texte/graphiques rendus par LibreOffice) + images animées recomposées image par image,
avec la Morphose reproduite (objets « !! » qui glissent, grossissent, tournent) et des fondus pour le reste.
Usage :
  python3 render_video.py prepare deck.pptx work/        # plaques PNG + liste des images par slide + timeline
  python3 render_video.py chunk work/ i n out.mp4        # rend la part i sur n
  python3 render_video.py concat work/ n out.mp4         # assemble les parts
"""
import sys, os, re, io, json, math, zipfile, subprocess, shutil
import numpy as np
from PIL import Image
from lxml import etree

NS = {'p': 'http://schemas.openxmlformats.org/presentationml/2006/main', 'a': 'http://schemas.openxmlformats.org/drawingml/2006/main',
      'r': 'http://schemas.openxmlformats.org/officeDocument/2006/relationships'}
W, H, FPS = 1920, 1080, 24
EMU = W / 9144000.0
TRANS = 1.1            # durée de la transition (s)
SOFFICE = os.path.join(os.environ.get('SKILL_DIR', ''), 'scripts/office/soffice.py')


def ease(u):
    u = min(1, max(0, u)); return u * u * (3 - 2 * u)


def prepare(deck, work):
    os.makedirs(work, exist_ok=True)
    z = zipfile.ZipFile(deck)
    slides = sorted([n for n in z.namelist() if re.fullmatch(r'ppt/slides/slide\d+\.xml', n)], key=lambda n: int(re.findall(r'\d+', n)[0]))
    plates_zip = os.path.join(work, 'plates.pptx')
    zo = zipfile.ZipFile(plates_zip, 'w', zipfile.ZIP_DEFLATED)
    info = []
    for item in z.infolist():
        data = z.read(item.filename)
        if item.filename in slides:
            root = etree.fromstring(data)
            tree = root.find('p:cSld/p:spTree', NS)
            rels = etree.fromstring(z.read(item.filename.replace('slides/', 'slides/_rels/') + '.rels'))
            rmap = {r.get('Id'): r.get('Target') for r in rels}
            pics = []
            for pic in list(tree.findall('p:pic', NS)):
                nm = pic.find('.//p:cNvPr', NS).get('name')
                emb = pic.find('.//a:blip', NS).get('{%s}embed' % NS['r'])
                xf = pic.find('.//a:xfrm', NS); off = xf.find('a:off', NS); ext = xf.find('a:ext', NS)
                am = pic.find('.//a:alphaModFix', NS)
                pics.append(dict(name=nm, media='ppt/' + rmap[emb].replace('../', ''), x=int(off.get('x')), y=int(off.get('y')), w=int(ext.get('cx')), h=int(ext.get('cy')),
                                 rot=int(xf.get('rot', '0')) / 60000.0, alpha=(int(am.get('amt')) / 100000.0 if am is not None else 1.0)))
                tree.remove(pic)
            info.append(pics)
            for tag in ('timing', 'transition'):
                for e in root.findall('p:' + tag, NS): root.remove(e)
            for e in root.findall('{http://schemas.openxmlformats.org/markup-compatibility/2006}AlternateContent'): root.remove(e)
            data = etree.tostring(root, xml_declaration=True, encoding='UTF-8', standalone=True)
        zo.writestr(item, data)
    zo.close()
    subprocess.run(['python3', SOFFICE, '--headless', '--convert-to', 'pdf', '--outdir', work, plates_zip], check=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    subprocess.run(['pdftoppm', '-png', '-r', '192', os.path.join(work, 'plates.pdf'), os.path.join(work, 'plate')], check=True)
    # durées : 160 mots/minute d'après les notes, minimum 5 s ; transition comprise
    from pptx import Presentation
    p = Presentation(deck)
    words = [len(s.notes_slide.notes_text_frame.text.split()) if s.has_notes_slide else 0 for s in p.slides]
    dur = [TRANS + max(5.0, w * 60 / 160.0) for w in words]
    dur[0] = max(dur[0], 5.5); dur[-1] = TRANS + 4.0
    json.dump(dict(slides=info, dur=dur, words=words), open(os.path.join(work, 'timeline.json'), 'w'))
    print(len(info), 'slides ; durée totale', round(sum(dur) - TRANS, 1), 's')


class Media:
    def __init__(self, deck):
        self.z = zipfile.ZipFile(deck); self.cache = {}

    def get(self, name):
        if name in self.cache: return self.cache[name]
        im = Image.open(io.BytesIO(self.z.read(name)))
        frames, durs = [], []
        try:
            n = im.n_frames
        except Exception:
            n = 1
        for i in range(n):
            im.seek(i); frames.append(im.convert('RGBA')); durs.append(im.info.get('duration', 100) / 1000.0 or 0.1)
        self.cache[name] = (frames, durs); return self.cache[name]

    def frame(self, name, t):
        frames, durs = self.get(name)
        if len(frames) == 1: return frames[0]
        T = sum(durs); t = t % T
        for f, d in zip(frames, durs):
            if t < d: return f
            t -= d
        return frames[-1]


def draw(canvas, img, cx, cy, w, h, rot, alpha):
    """Pose img (RGBA) centrée en (cx,cy) px, taille w×h, rotation en degrés (sens horaire)."""
    if alpha <= 0.003 or w < 2 or h < 2: return
    im = img.resize((max(2, int(w)), max(2, int(h))), Image.BILINEAR)
    if abs(rot) > 0.05: im = im.rotate(-rot, expand=True, resample=Image.BICUBIC)
    if alpha < 0.999:
        a = im.getchannel('A').point(lambda v: int(v * alpha)); im.putalpha(a)
    canvas.paste(im, (int(round(cx - im.size[0] / 2)), int(round(cy - im.size[1] / 2))), im)


def geom(p):
    return dict(cx=(p['x'] + p['w'] / 2) * EMU, cy=(p['y'] + p['h'] / 2) * EMU, w=p['w'] * EMU, h=p['h'] * EMU, rot=p['rot'])


def lerp(a, b, u): return a + (b - a) * u


def ang(a, b):
    d = (b - a + 180) % 360 - 180; return d


def render_frame(t, tl, plates, media):
    dur = tl['dur']; starts = np.cumsum([0] + dur[:-1])
    i = max(k for k in range(len(dur)) if starts[k] <= t + 1e-9)
    lt = t - starts[i]
    pics_b = tl['slides'][i]
    inb = i > 0 and lt < TRANS
    u = ease(lt / TRANS) if inb else 1.0
    yy = (np.arange(H, dtype=np.float32) / H)[:, None, None]
    if inb:
        # fonds blancs : on additionne les « encres » (texte, graphiques). L'ancienne slide s'efface vite, la nouvelle apparaît du haut vers le bas.
        wa = 1 - ease(min(1.0, u / 0.45))
        u2 = min(1.0, max(0.0, (u - 0.3) / 0.7))
        mb = np.clip(u2 * 1.6 - 0.6 * yy, 0, 1)
        base = 255 - (255 - plates[i - 1]) * wa - (255 - plates[i]) * mb
    elif i == 0 and lt < 0.8:
        base = 255 - (255 - plates[0]) * ease(lt / 0.8)
    else:
        base = plates[i]
    canvas = Image.fromarray(np.clip(base, 0, 255).astype(np.uint8)).convert('RGBA')
    tt = t  # horloge absolue : les GIF tournent en continu
    if inb:
        pics_a = tl['slides'][i - 1]
        names_b = {p['name']: p for p in pics_b if p['name'].startswith('!!')}
        names_a = {p['name']: p for p in pics_a if p['name'].startswith('!!')}
        for p in pics_a:                                       # sortants
            if p['name'] in names_b: continue
            g = geom(p); draw(canvas, media.frame(p['media'], tt), g['cx'], g['cy'], g['w'], g['h'], g['rot'], p['alpha'] * (1 - u))
        for p in pics_b:                                       # entrants et morphés
            g = geom(p)
            if p['name'] in names_a:
                a = geom(names_a[p['name']]); aa = names_a[p['name']]['alpha']
                draw(canvas, media.frame(p['media'], tt), lerp(a['cx'], g['cx'], u), lerp(a['cy'], g['cy'], u), lerp(a['w'], g['w'], u), lerp(a['h'], g['h'], u),
                     a['rot'] + ang(a['rot'], g['rot']) * u, lerp(aa, p['alpha'], u))
            else:
                draw(canvas, media.frame(p['media'], tt), g['cx'], g['cy'], g['w'], g['h'], g['rot'], p['alpha'] * u)
    else:
        for p in pics_b:
            g = geom(p); a = 1.0 if i > 0 else ease(lt / 0.8)
            draw(canvas, media.frame(p['media'], tt), g['cx'], g['cy'], g['w'], g['h'], g['rot'], p['alpha'] * a)
    return np.asarray(canvas.convert('RGB'))


def load_plates(work, n):
    out = []
    for k in range(1, n + 1):
        f = os.path.join(work, 'plate-%02d.png' % k)
        out.append(np.asarray(Image.open(f).convert('RGB').resize((W, H), Image.LANCZOS), dtype=np.float32))
    return out


def chunk(deck, work, idx, n, out):
    tl = json.load(open(os.path.join(work, 'timeline.json')))
    total = sum(tl['dur']) - TRANS; nf = int(total * FPS)
    a, b = nf * idx // n, nf * (idx + 1) // n
    plates = load_plates(work, len(tl['dur'])); media = Media(deck)
    ff = subprocess.Popen(['ffmpeg', '-y', '-loglevel', 'error', '-f', 'rawvideo', '-pix_fmt', 'rgb24', '-s', f'{W}x{H}', '-r', str(FPS), '-i', '-',
                           '-c:v', 'libx264', '-preset', 'veryfast', '-crf', '18', '-pix_fmt', 'yuv420p', out], stdin=subprocess.PIPE)
    for f in range(a, b):
        ff.stdin.write(render_frame(f / FPS, tl, plates, media).tobytes())
        if (f - a) % 240 == 0: print(idx, f - a, '/', b - a, flush=True)
    ff.stdin.close(); ff.wait()


if __name__ == '__main__':
    cmd = sys.argv[1]
    if cmd == 'prepare': prepare(sys.argv[2], sys.argv[3])
    elif cmd == 'chunk': chunk(sys.argv[2], sys.argv[3], int(sys.argv[4]), int(sys.argv[5]), sys.argv[6])
    elif cmd == 'concat':
        work, n, out = sys.argv[2], int(sys.argv[3]), sys.argv[4]
        lst = os.path.join(work, 'list.txt'); open(lst, 'w').write(''.join(f"file 'part{k}.mp4'\n" for k in range(n)))
        subprocess.run(['ffmpeg', '-y', '-loglevel', 'error', '-f', 'concat', '-safe', '0', '-i', lst, '-c', 'copy', out], check=True)
