"""Fusionne les fichiers médias identiques d'un .pptx (même contenu) et met à jour les relations. Usage : python3 dedupe.py in.pptx out.pptx"""
import sys, zipfile, hashlib, re, posixpath
src, dst = sys.argv[1:3]
zin = zipfile.ZipFile(src); files = {i.filename: zin.read(i.filename) for i in zin.infolist()}
first, remap = {}, {}
for fn in sorted(files):
    if fn.startswith('ppt/media/'):
        h = hashlib.md5(files[fn]).hexdigest()
        if h in first: remap[fn] = first[h]
        else: first[h] = fn
for fn in list(files):
    if fn.endswith('.rels'):
        base = posixpath.dirname(posixpath.dirname(fn))  # dossier de la partie source
        x = files[fn].decode('utf-8'); changed = False
        for old, new in remap.items():
            o = posixpath.relpath(old, base); n = posixpath.relpath(new, base)
            if f'Target="{o}"' in x: x = x.replace(f'Target="{o}"', f'Target="{n}"'); changed = True
        if changed: files[fn] = x.encode('utf-8')
for old in remap: del files[old]
zout = zipfile.ZipFile(dst, 'w', zipfile.ZIP_DEFLATED)
for f in ['[Content_Types].xml'] + [f for f in files if f != '[Content_Types].xml']: zout.writestr(f, files[f])
zout.close(); print(len(remap), 'doublons fusionnés')
