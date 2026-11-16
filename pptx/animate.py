"""Ajoute des transitions de diapositive et des animations d'entrée (« Flottant vers l'intérieur » / fondu) à un .pptx.
Usage : python3 animate.py in.pptx out.pptx
Les éléments d'une slide apparaissent automatiquement, dans l'ordre de lecture, sans clic.
"""
import sys, zipfile, re, math
from lxml import etree

NS = {'p': 'http://schemas.openxmlformats.org/presentationml/2006/main', 'a': 'http://schemas.openxmlformats.org/drawingml/2006/main'}
P = '{%s}' % NS['p']
SKIP_NAMES = ('Rubrique',)  # animé avec le titre

def bbox(el):
    for path in ('.//a:xfrm', './/p:xfrm'):
        x = el.find(path, NS)
        if x is not None:
            off, ext = x.find('a:off', NS), x.find('a:ext', NS)
            if off is not None and ext is not None:
                return int(off.get('x')), int(off.get('y')), int(ext.get('cx')), int(ext.get('cy'))
    return None

def inside(b, c):
    return b[0] >= c[0] - 20000 and b[1] >= c[1] - 20000 and b[0] + b[2] <= c[0] + c[2] + 20000 and b[1] + b[3] <= c[1] + c[3] + 20000

class Ids:
    def __init__(self): self.n = 2
    def __call__(self): self.n += 1; return self.n

def effect(ids, spid, node, kind, grp, dur=450):
    """Un effet d'entrée. kind = 'fade' (fondu) ou 'float' (flottant vers l'intérieur)."""
    preset = 10 if kind == 'fade' else 42
    g = ' grpId="0"' if grp else ''
    xml = f'<p:par><p:cTn id="{ids()}" presetID="{preset}" presetClass="entr" presetSubtype="0" fill="hold"{g} nodeType="{node}"><p:stCondLst><p:cond delay="0"/></p:stCondLst><p:childTnLst>'
    xml += f'<p:set><p:cBhvr><p:cTn id="{ids()}" dur="1" fill="hold"><p:stCondLst><p:cond delay="0"/></p:stCondLst></p:cTn><p:tgtEl><p:spTgt spid="{spid}"/></p:tgtEl><p:attrNameLst><p:attrName>style.visibility</p:attrName></p:attrNameLst></p:cBhvr><p:to><p:strVal val="visible"/></p:to></p:set>'
    if kind == 'float':
        xml += f'<p:anim calcmode="lin" valueType="num"><p:cBhvr additive="base"><p:cTn id="{ids()}" dur="{dur}" fill="hold"/><p:tgtEl><p:spTgt spid="{spid}"/></p:tgtEl><p:attrNameLst><p:attrName>ppt_y</p:attrName></p:attrNameLst></p:cBhvr><p:tavLst><p:tav tm="0"><p:val><p:strVal val="#ppt_y+.08"/></p:val></p:tav><p:tav tm="100000"><p:val><p:strVal val="#ppt_y"/></p:val></p:tav></p:tavLst></p:anim>'
    xml += f'<p:animEffect transition="in" filter="fade"><p:cBhvr><p:cTn id="{ids()}" dur="{dur}"/><p:tgtEl><p:spTgt spid="{spid}"/></p:tgtEl></p:cBhvr></p:animEffect></p:childTnLst></p:cTn></p:par>'
    return xml

def motion_xml(ids, spid, path, dur=5200):
    return (f'<p:par><p:cTn id="{ids()}" presetID="0" presetClass="path" presetSubtype="0" fill="hold" nodeType="afterEffect"><p:stCondLst><p:cond delay="0"/></p:stCondLst><p:childTnLst>'
            f'<p:animMotion origin="layout" path="{path}" pathEditMode="relative" rAng="0"><p:cBhvr><p:cTn id="{ids()}" dur="{dur}" repeatCount="indefinite" fill="hold"/><p:tgtEl><p:spTgt spid="{spid}"/></p:tgtEl><p:attrNameLst><p:attrName>ppt_x</p:attrName><p:attrName>ppt_y</p:attrName></p:attrNameLst></p:cBhvr></p:animMotion>'
            f'</p:childTnLst></p:cTn></p:par>')

def build_timing(items, motion=None):
    """items = [(spid, kind, node, is_sp, is_chart)] ; une « tranche » commence à chaque afterEffect (démarrage automatique, sans clic)."""
    ids = Ids()
    slices, cur = [], []
    for it in items:
        if it[2] == 'afterEffect' and cur:
            slices.append(cur); cur = []
        cur.append(it)
    if cur:
        slices.append(cur)
    outer = ids()
    inner, start = '', 0
    for sl in slices:
        sid = ids()
        eff = ''.join(effect(ids, spid, 'afterEffect' if k == 0 else 'withEffect', kind, is_sp or is_chart) for k, (spid, kind, node, is_sp, is_chart) in enumerate(sl))
        inner += f'<p:par><p:cTn id="{sid}" fill="hold"><p:stCondLst><p:cond delay="{start}"/></p:stCondLst><p:childTnLst>{eff}</p:childTnLst></p:cTn></p:par>'
        start += 400
    if motion:
        sid = ids()
        inner += f'<p:par><p:cTn id="{sid}" fill="hold"><p:stCondLst><p:cond delay="{start + 300}"/></p:stCondLst><p:childTnLst>{motion_xml(ids, *motion)}</p:childTnLst></p:cTn></p:par>'
    bld, seen = '', set()
    for spid, kind, node, is_sp, is_chart in items:
        if spid in seen: continue
        seen.add(spid)
        if is_sp: bld += f'<p:bldP spid="{spid}" grpId="0" animBg="1"/>'
        elif is_chart: bld += f'<p:bldGraphic spid="{spid}" grpId="0"><p:bldAsOne/></p:bldGraphic>'
    bld_xml = f'<p:bldLst>{bld}</p:bldLst>' if bld else ''
    return (f'<p:timing xmlns:p="{NS["p"]}"><p:tnLst><p:par><p:cTn id="1" dur="indefinite" restart="never" nodeType="tmRoot"><p:childTnLst><p:seq concurrent="1" nextAc="seek"><p:cTn id="2" dur="indefinite" nodeType="mainSeq"><p:childTnLst>'
            f'<p:par><p:cTn id="{outer}" fill="hold"><p:stCondLst><p:cond delay="indefinite"/><p:cond evt="onBegin" delay="0"><p:tn val="2"/></p:cond></p:stCondLst><p:childTnLst>{inner}</p:childTnLst></p:cTn></p:par>'
            f'</p:childTnLst></p:cTn><p:prevCondLst><p:cond evt="onPrev" delay="0"><p:tgtEl><p:sldTgt/></p:tgtEl></p:cond></p:prevCondLst><p:nextCondLst><p:cond evt="onNext" delay="0"><p:tgtEl><p:sldTgt/></p:tgtEl></p:cond></p:nextCondLst></p:seq></p:childTnLst></p:cTn></p:par></p:tnLst>{bld_xml}</p:timing>')

TRANS = {1: '<p:fade/>'}  # par défaut : fondu enchaîné ; les débuts de section : balayage
SECTION_STARTS = {4, 7, 13}

def lens_path(rot_deg, width_in):
    """Petite boucle fermée (en fractions de la slide) orientée dans le sens de nage ; longueur bornée pour ne pas envahir le texte."""
    L = min(0.75, max(0.3, 0.25 * width_in)); T = L * 0.28
    r = math.radians(rot_deg); h = (math.cos(r), math.sin(r)); n = (-math.sin(r), math.cos(r))
    P = lambda a, b: ((h[0] * a + n[0] * b) / 10.0, (h[1] * a + n[1] * b) / 5.625)
    pts = [P(L * 0.25, -T), P(L * 0.75, -T), P(L, 0), P(L * 0.75, T), P(L * 0.25, T), P(0, 0)]
    f = lambda p: f'{p[0]:.4f} {p[1]:.4f}'
    return f'M 0 0 C {f(pts[0])} {f(pts[1])} {f(pts[2])} C {f(pts[3])} {f(pts[4])} {f(pts[5])} E'

def process_slide(xml_bytes, number):
    root = etree.fromstring(xml_bytes)
    tree = root.find('p:cSld/p:spTree', NS)
    cand = []
    for el in tree:
        tag = etree.QName(el).localname
        if tag not in ('sp', 'pic', 'graphicFrame', 'cxnSp'):
            continue
        cnv = el.find('.//p:cNvPr', NS)
        name = cnv.get('name') or ''
        spid = cnv.get('id')
        b = bbox(el)
        is_title = el.find('.//p:nvPr/p:ph', NS) is not None
        is_chart = tag == 'graphicFrame' and el.find('.//{http://schemas.openxmlformats.org/drawingml/2006/chart}chart') is not None
        cand.append(dict(el=el, name=name, spid=spid, b=b, tag=tag, title=is_title, chart=is_chart))
    items = []
    title = [c for c in cand if c['title']]
    kick = [c for c in cand if c['name'] == 'Rubrique']
    # titre : fondu ; rubrique avec lui
    for k, c in enumerate(title + kick):
        items.append((c['spid'], 'fade', 'afterEffect' if k == 0 else 'withEffect', c['tag'] == 'sp', False))
    rest = [c for c in cand if not c['title'] and c['name'] != 'Rubrique' and not c['name'].startswith('!!') and c['b']]
    rest.sort(key=lambda c: (round(c['b'][1] / 91440 / 0.12), c['b'][0], -(c['b'][2] * c['b'][3])))
    containers, prev_b = [], None
    for c in rest:
        within = any(inside(c['b'], k) and (k[2] * k[3] > c['b'][2] * c['b'][3] * 1.05) for k in containers)
        same_row = bool(prev_b) and abs(c['b'][1] - prev_b[1]) < 91440 * 0.12 and c['b'][0] != prev_b[0]
        node = 'withEffect' if (within or same_row) else 'afterEffect'
        prev_b = c['b']
        if not within:
            containers.append(c['b'])
        if not items:
            node = 'afterEffect'
        items.append((c['spid'], 'float', node, c['tag'] == 'sp', c['chart']))
    # transition + timing
    for old in root.findall('p:transition', NS) + root.findall('p:timing', NS) + root.findall('{http://schemas.openxmlformats.org/markup-compatibility/2006}AlternateContent'):
        root.remove(old)
    trans = '<p:push dir="l"/>' if number in SECTION_STARTS else '<p:fade/>'
    if MORPH and number > 1:
        # Morphose : les objets de même nom (« !!sperm »...) glissent, grossissent et tournent d'une slide à l'autre
        transition = etree.fromstring(f'<mc:AlternateContent xmlns:mc="http://schemas.openxmlformats.org/markup-compatibility/2006" xmlns:p="{NS["p"]}"><mc:Choice xmlns:p159="http://schemas.microsoft.com/office/powerpoint/2015/09/main" Requires="p159"><p:transition spd="slow"><p159:morph option="byObject"/></p:transition></mc:Choice><mc:Fallback><p:transition spd="slow"><p:fade/></p:transition></mc:Fallback></mc:AlternateContent>')
    else:
        transition = etree.fromstring(f'<p:transition xmlns:p="{NS["p"]}" spd="med">{trans}</p:transition>')
    motion = None
    sp = [c for c in cand if c['name'] == '!!sperm']
    if sp and MORPH:
        xf = sp[0]['el'].find('.//a:xfrm', NS)
        rot = int(xf.get('rot', '0')) / 60000.0 if xf is not None else 0.0
        motion = (sp[0]['spid'], lens_path(rot, sp[0]['b'][2] / 914400.0))
    timing = etree.fromstring(build_timing(items, motion))
    clr = root.find('p:clrMapOvr', NS)
    idx = list(root).index(clr) + 1 if clr is not None else list(root).index(root.find('p:cSld', NS)) + 1
    root.insert(idx, transition)
    root.insert(idx + 1, timing)
    return etree.tostring(root, xml_declaration=True, encoding='UTF-8', standalone=True)

MORPH = '--morph' in sys.argv
args = [a for a in sys.argv[1:] if not a.startswith('--')]
src, dst = args[0], args[1]
zin = zipfile.ZipFile(src)
zout = zipfile.ZipFile(dst, 'w', zipfile.ZIP_DEFLATED)
for item in zin.infolist():
    data = zin.read(item.filename)
    m = re.fullmatch(r'ppt/slides/slide(\d+)\.xml', item.filename)
    if m:
        data = process_slide(data, int(m.group(1)))
    zout.writestr(item, data)
zout.close()
print('animations ajoutées ->', dst)
