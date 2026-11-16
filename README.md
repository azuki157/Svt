# SVT — La PMA en 3D (diaporama animé)

Diaporama interactif **three.js** : un modèle 3D (utérus, appareil reproducteur masculin, spermatozoïde) évolue slide après slide,
la caméra voyage entre les « stations » (appareil féminin → masculin → laboratoire) et les animations sont synchronisées avec le contenu.

## Lancer
```bash
python3 -m http.server 8000      # puis ouvrir http://localhost:8000
```
Commandes : `←` `→` / `Espace` naviguer · `A` lecture automatique · `N` narration (sous-titres) · `F` plein écran · clic sur la barre de progression pour sauter.
Un lien direct vers une slide : `http://localhost:8000/#7`.

## Structure
- `models/` : les 3 modèles GLB fournis.
- `js/stage.js` : scène, éclairage, chargement des modèles, mise en évidence par zones, flagelle animé.
- `js/props.js` : objets procéduraux (ovocyte, embryon 1→8 cellules, boîte de Pétri, cathéter, paillette, cuve d'azote, follicule, micropipettes…).
- `js/slides_a.js`, `slides_b.js`, `slides_c.js` : les 13 slides (chorégraphie 3D + texte + narration).
- `js/main.js` : moteur déterministe (caméra, fondus, étiquettes 3D, interface).
- `export.js` : rendu vidéo image par image (Playwright + ffmpeg).

## Export vidéo
```bash
node export.js 0 99999 sortie.mp4 24     # rendu complet 1280×720, 24 i/s (le moteur est déterministe)
```

## Sources du contenu
Documents 1 et 6 du sujet ; cadre légal : loi n° 2021-1017 du 2 août 2021, Agence de la biomédecine, Assurance maladie (à vérifier avant l'oral).
