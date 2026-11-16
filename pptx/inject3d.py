"""Remplace les repères « MODEL3D:<modèle>:<id>:<texte alternatif> » d'un .pptx par de vrais modèles 3D PowerPoint (GLB natifs).

Structure copiée d'un fichier généré par Office (mc:AlternateContent + p:graphicFrame am3d:model3d, repli en image PNG).
Usage : python3 inject3d.py in.pptx out.pptx <dossier_models> <dossier_clips>
Non testé dans PowerPoint : voir README.
"""
import sys, re, math, zipfile
from lxml import etree
from PIL import Image

SRC, DST, MODELS, CLIPS = sys.argv[1:5]
NS = {'p': 'http://schemas.openxmlformats.org/presentationml/2006/main', 'a': 'http://schemas.openxmlformats.org/drawingml/2006/main'}
EMU_M = 36_000_000          # 1 mètre en unités PowerPoint (360 000 par cm)
CAM_Z = 64_748_452          # distance de la caméra (valeur observée dans un fichier Office)
FOV = 2_700_000             # 45 degrés
H_VIS = 2 * CAM_Z * math.tan(math.radians(22.5))

# modèle : (fichier, plus grande dimension, centre (x,y,z), dimensions visibles (x,y) après rotation, rotation (ax,ay,az) en 60000e de degré, image de repli (recadrage))
MODEL = {
    'uterus': dict(glb='uterus.glb', maxext=2.399311, center=(-0.019384, -0.245664, 0.035721), view=(2.399311, 1.715654), rot=(0, 0, 0), frame='m_uterus', cx=800, cy=475, cw=600),
    'male': dict(glb='male_reproductive_system.glb', maxext=3.992293, center=(0.140577, -1.502506, 0.843984), view=(2.412934, 2.703153), rot=(0, 10_800_000, 0), frame='m_male', cx=812, cy=462, cw=560),
    'sperm': dict(glb='sperm.glb', maxext=0.150832, center=(0.0, 0.0, 0.0), view=(0.150832, 0.018920), rot=(0, 0, 0), frame='m_sperm', cx=850, cy=430, cw=520),
}
LIGHTS = '''<am3d:ambientLight><am3d:clr><a:scrgbClr r="50000" g="50000" b="50000"/></am3d:clr><am3d:illuminance n="500000" d="1000000"/></am3d:ambientLight>
<am3d:ptLight rad="0"><am3d:clr><a:scrgbClr r="100000" g="75000" b="50000"/></am3d:clr><am3d:intensity n="9765625" d="1000000"/><am3d:pos x="21959998" y="70920001" z="16344003"/></am3d:ptLight>
<am3d:ptLight rad="0"><am3d:clr><a:scrgbClr r="40000" g="60000" b="95000"/></am3d:clr><am3d:intensity n="12250000" d="1000000"/><am3d:pos x="-37964106" y="51130435" z="57631972"/></am3d:ptLight>
<am3d:ptLight rad="0"><am3d:clr><a:scrgbClr r="86837" g="72700" b="100000"/></am3d:clr><am3d:intensity n="3125000" d="1000000"/><am3d:pos x="-37739122" y="58056624" z="-34769649"/></am3d:ptLight>'''
REL_MODEL = 'http://schemas.microsoft.com/office/2017/06/relationships/model3d'
REL_IMG = 'http://schemas.openxmlformats.org/officeDocument/2006/relationships/image'


def fallback_png(m, w, h):
    """Image de repli transparente, au format du cadre, recadrée sur le rendu 3D clair."""
    import io
    im = Image.open(f"{CLIPS}/frames_{m['frame']}/f0000.png").convert('RGBA')
    ar = w / h
    cw = m['cw']; ch = cw / ar
    x0, y0 = m['cx'] - cw / 2, m['cy'] - ch / 2
    c = im.crop((int(x0), int(y0), int(x0 + cw), int(y0 + ch))).resize((900, int(900 / ar)), Image.LANCZOS)
    buf = io.BytesIO(); c.save(buf, 'PNG'); return buf.getvalue()


def build(model, sid, name, descr, x, y, w, h, rid_glb, rid_png):
    m = MODEL[model]
    mpmu = 1.0 / m['maxext']
    pre = [round(-c * mpmu * EMU_M) for c in m['center']]
    ext_x, ext_y = m['view']
    S = round(1.4157 * min(w * m['maxext'] / ext_x, h * m['maxext'] / ext_y))
    ax, ay, az = m['rot']
    off = f'<a:off x="{x}" y="{y}"/><a:ext cx="{w}" cy="{h}"/>'
    return f'''<mc:AlternateContent xmlns:a="{NS['a']}" xmlns:am3d="http://schemas.microsoft.com/office/drawing/2017/model3d" xmlns:mc="http://schemas.openxmlformats.org/markup-compatibility/2006" xmlns:p="{NS['p']}" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">
<mc:Choice Requires="am3d"><p:graphicFrame><p:nvGraphicFramePr><p:cNvPr id="{sid}" name="{name}" descr="{descr}"/><p:cNvGraphicFramePr><a:graphicFrameLocks noGrp="1" noChangeAspect="1"/></p:cNvGraphicFramePr><p:nvPr/></p:nvGraphicFramePr>
<p:xfrm>{off}</p:xfrm>
<a:graphic><a:graphicData uri="http://schemas.microsoft.com/office/drawing/2017/model3d"><am3d:model3d r:embed="{rid_glb}">
<am3d:spPr><a:xfrm><a:off x="0" y="0"/><a:ext cx="{w}" cy="{h}"/></a:xfrm><a:prstGeom prst="rect"><a:avLst/></a:prstGeom></am3d:spPr>
<am3d:camera><am3d:pos x="0" y="0" z="{CAM_Z}"/><am3d:up dx="0" dy="{EMU_M}" dz="0"/><am3d:lookAt x="0" y="0" z="0"/><am3d:perspective fov="{FOV}"/></am3d:camera>
<am3d:trans><am3d:meterPerModelUnit n="{round(mpmu * 1_000_000)}" d="1000000"/><am3d:preTrans dx="{pre[0]}" dy="{pre[1]}" dz="{pre[2]}"/><am3d:scale><am3d:sx n="1000000" d="1000000"/><am3d:sy n="1000000" d="1000000"/><am3d:sz n="1000000" d="1000000"/></am3d:scale><am3d:rot ax="{ax}" ay="{ay}" az="{az}"/><am3d:postTrans dx="0" dy="0" dz="0"/></am3d:trans>
<am3d:raster rName="Office3DRenderer" rVer="16.0.8326"><am3d:blip r:embed="{rid_png}"/></am3d:raster>
<am3d:objViewport viewportSz="{S}"/>
{LIGHTS}
</am3d:model3d></a:graphicData></a:graphic></p:graphicFrame></mc:Choice>
<mc:Fallback><p:pic><p:nvPicPr><p:cNvPr id="{sid}" name="{name}" descr="{descr}"/><p:cNvPicPr><a:picLocks noGrp="1" noRot="1" noChangeAspect="1" noMove="1" noResize="1" noEditPoints="1" noAdjustHandles="1" noChangeArrowheads="1" noChangeShapeType="1" noCrop="1"/></p:cNvPicPr><p:nvPr/></p:nvPicPr><p:blipFill><a:blip r:embed="{rid_png}"/><a:stretch><a:fillRect/></a:stretch></p:blipFill><p:spPr><a:xfrm>{off}</a:xfrm><a:prstGeom prst="rect"><a:avLst/></a:prstGeom></p:spPr></p:pic></mc:Fallback>
</mc:AlternateContent>'''


zin = zipfile.ZipFile(SRC)
files = {i.filename: zin.read(i.filename) for i in zin.infolist()}
new_parts = {}
used_models = set()
count = 0
for fn in sorted(files):
    m = re.fullmatch(r'ppt/slides/slide(\d+)\.xml', fn)
    if not m:
        continue
    root = etree.fromstring(files[fn])
    marks = [sp for sp in root.iter('{%s}sp' % NS['p']) if (sp.find('.//p:cNvPr', NS).get('name') or '').startswith('MODEL3D:')]
    if not marks:
        continue
    relfn = f'ppt/slides/_rels/slide{m.group(1)}.xml.rels'
    rels = etree.fromstring(files[relfn])
    RN = rels.nsmap[None]
    for k, sp in enumerate(marks):
        cnv = sp.find('.//p:cNvPr', NS)
        _, model, sid_, alt = cnv.get('name').split(':', 3)
        x, y = [int(sp.find('.//a:xfrm/a:off', NS).get(a)) for a in ('x', 'y')]
        w, h = [int(sp.find('.//a:xfrm/a:ext', NS).get(a)) for a in ('cx', 'cy')]
        glb_part = f'ppt/media/model3d_{model}.glb'; png_part = f'ppt/media/model3d_{model}_{sid_}.png'
        new_parts[glb_part] = open(f"{MODELS}/{MODEL[model]['glb']}", 'rb').read(); used_models.add(model)
        new_parts[png_part] = fallback_png(MODEL[model], w, h)
        rg, rp = f'rId9{k}1', f'rId9{k}2'
        etree.SubElement(rels, '{%s}Relationship' % RN, Id=rg, Type=REL_MODEL, Target=f'../media/model3d_{model}.glb')
        etree.SubElement(rels, '{%s}Relationship' % RN, Id=rp, Type=REL_IMG, Target=f'../media/model3d_{model}_{sid_}.png')
        xml = build(model, cnv.get('id'), f'3D Model {cnv.get("id")}', alt.replace('"', "'"), x, y, w, h, rg, rp)
        el = etree.fromstring(xml.encode('utf-8'))
        sp.getparent().replace(sp, el)
        count += 1
    files[fn] = etree.tostring(root, xml_declaration=True, encoding='UTF-8', standalone=True)
    files[relfn] = etree.tostring(rels, xml_declaration=True, encoding='UTF-8', standalone=True)

ct = files['[Content_Types].xml'].decode('utf-8')
if 'Extension="glb"' not in ct:
    ct = ct.replace('<Default ', '<Default Extension="glb" ContentType="model/gltf.binary"/><Default ', 1)
files['[Content_Types].xml'] = ct.encode('utf-8')
files.update(new_parts)
zout = zipfile.ZipFile(DST, 'w', zipfile.ZIP_DEFLATED)
order = ['[Content_Types].xml'] + [f for f in files if f != '[Content_Types].xml']
for f in order:
    zout.writestr(f, files[f])
zout.close()
print(count, 'modèles 3D injectés ->', DST)
