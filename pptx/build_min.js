// PMA_SVT_minimal.pptx : version minimaliste (fond blanc, une seule couleur d'accent, beaucoup d'espace, GIF 3D animés).
// Principes retenus : un message par slide, palette restreinte (encre + gris + 1 accent), figures dominantes, peu de texte.
const pptxgen = require('pptxgenjs');
const path = require('path');
const fs = require('fs');
const { applyTheme } = require(path.join(process.env.SKILL_DIR, 'scripts/apply_theme.js'));
const NOTES = JSON.parse(fs.readFileSync(path.join(__dirname, 'notes.json'), 'utf8'));

const THEME = {
  name: 'PMA minimal', headFontFace: 'Cambria', bodyFontFace: 'Calibri',
  colors: { dk1: '1B2338', lt1: 'FFFFFF', dk2: '6B7280', lt2: 'F4F6F8', accent1: '0F8F83', accent2: '1B2338', accent3: '7C8DB5', accent4: 'D1D5DB', accent5: '0F8F83', accent6: 'B42318', hlink: '0F8F83', folHlink: '7C8DB5' },
};
const INK = '1B2338', MUTED = '6B7280', ACC = '0F8F83', HAIR = 'E5E7EB', LIGHT = 'C9CED8';

const pres = new pptxgen();
pres.layout = 'LAYOUT_16x9';
pres.theme = { headFontFace: THEME.headFontFace, bodyFontFace: THEME.bodyFontFace };
pres.title = 'La procréation médicalement assistée'; pres.subject = 'SVT · Sujet 4'; pres.author = 'SVT';
const C = pres.SchemeColor;

pres.defineSlideMaster({ title: 'Titre', background: { color: 'FFFFFF' }, objects: [] });
pres.defineSlideMaster({
  title: 'Contenu', background: { color: 'FFFFFF' },
  objects: [{ placeholder: { options: { name: 'title', type: 'title', x: 0.7, y: 0.62, w: 8.6, h: 0.7, fontSize: 30, bold: false, color: C.text1, align: 'left', valign: 'top', margin: 0 }, text: '' } }],
  slideNumber: { x: 8.8, y: 5.18, w: 0.5, h: 0.25, fontSize: 10, color: '9AA1AF', align: 'right' },
});

const sh = pres.shapes;
const AR = { title: 0.9, defs: 1, male: 1, don_kids: 1, fem_fol: 1.87, fem_plug: 1.87, stim_pon: 2.23, stim_fol: 2.23, ins_cav: 1.5, fiv_pon: 1.8, fiv_petri: 1.8, fiv_nid: 1.8, icsi: 1.47, bilan: 1.3 };
const content = (title, sec, i) => { const s = pres.addSlide({ masterName: 'Contenu', sectionTitle: sec }); s.addText(title, { placeholder: 'title' }); s.addNotes(NOTES[i]); return s; };
const kicker = (s, t) => s.addText(t, { x: 0.7, y: 0.34, w: 8, h: 0.24, fontSize: 10.5, bold: true, charSpacing: 3, color: ACC, margin: 0, isTextBox: true, objectName: 'Rubrique' });
const T = (s, text, o) => s.addText(text, { margin: 0, isTextBox: true, color: C.text1, fontSize: 14, valign: 'top', ...o });
const MODE3D = !!process.env.MODE3D;
// en mode 3D : un repère invisible 'MODEL3D:<modèle>:<id>' remplacé ensuite par un vrai modèle 3D PowerPoint (inject3d.py)
const slot3d = (s, model, id, x, y, w, h, alt) => s.addShape(sh.RECTANGLE, { x, y, w, h, fill: { color: 'FFFFFF', transparency: 100 }, line: { color: 'FFFFFF', width: 0, transparency: 100 }, objectName: 'MODEL3D:' + model + ':' + id + ':' + alt });
const pic = (s, name, x, y, w, alt) => s.addImage({ path: path.join(__dirname, 'gif', name + '.gif'), x, y, w, h: w / AR[name], altText: alt, objectName: 'Illustration ' + name });
const big = (s, v, label, x, y, w, size = 30, lw) => {
  T(s, v, { x, y, w: lw || 1.5, h: 0.6, fontSize: size, color: ACC, fontFace: '+mj-lt', valign: 'middle', objectName: 'Valeur ' + v });
  T(s, label, { x: x + (lw || 1.5) + 0.1, y, w: w - (lw || 1.5) - 0.1, h: 0.6, color: MUTED, valign: 'middle', objectName: 'Libellé ' + v });
};
const step = (s, n, head, text, x, y, w, h = 0.8) => {
  T(s, String(n), { x, y, w: 0.35, h: 0.3, fontSize: 16, bold: true, color: ACC, objectName: 'Numéro ' + n });
  T(s, head ? [{ text: head, options: { bold: true, breakLine: true } }, { text, options: { color: MUTED } }] : text, { x: x + 0.45, y, w: w - 0.45, h, objectName: 'Étape ' + n });
};

(async () => {
  const SEC = ['Introduction', 'Causes', 'Techniques', 'Synthèse et cadre légal'];
  SEC.forEach((t) => pres.addSection({ title: t }));

  // 1 titre
  {
    const s = pres.addSlide({ masterName: 'Titre', sectionTitle: SEC[0] }); s.addNotes(NOTES[0]);
    s.addText('SVT · SUJET 4', { x: 0.7, y: 1.35, w: 4.5, h: 0.25, fontSize: 11, bold: true, charSpacing: 4, color: ACC, margin: 0, isTextBox: true, objectName: 'Rubrique' });
    s.addText('La procréation médicalement assistée', { x: 0.7, y: 1.75, w: 4.7, h: 1.8, fontSize: 38, color: C.text1, fontFace: '+mj-lt', margin: 0, valign: 'top', isTextBox: true, objectName: 'Titre' });
    s.addText('Infertilité, stérilité et techniques d’assistance médicale à la procréation', { x: 0.7, y: 3.75, w: 4.2, h: 0.8, fontSize: 15, color: MUTED, margin: 0, valign: 'top', isTextBox: true, objectName: 'Sous-titre' });
    if (MODE3D) slot3d(s, 'uterus', 's1', 5.6, 0.55, 3.8, 4.2, 'Modèle 3D : utérus'); else pic(s, 'title', 5.6, 0.55, 3.8, 'Rendu 3D : l’utérus et des spermatozoïdes');
  }

  // 2 trois questions
  {
    const s = content('Trois questions', SEC[0], 1); kicker(s, 'INTRODUCTION');
    [['1', 'Quelles causes ?', 'Identifier les causes de fertilité et de stérilité.'], ['2', 'Quelles techniques ?', 'Relever les techniques d’assistance médicale à la procréation.'], ['3', 'Quel cadre légal ?', 'Pour qui, depuis quand, payant ou remboursé ?']].forEach(([n, h, t], i) => {
      const x = 0.7 + i * 3.0;
      T(s, n, { x, y: 1.75, w: 1, h: 0.9, fontSize: 54, color: LIGHT, fontFace: '+mj-lt', objectName: 'Numéro ' + n });
      T(s, h, { x, y: 2.8, w: 2.6, h: 0.4, fontSize: 20, bold: true, objectName: 'Question ' + n });
      T(s, t, { x, y: 3.3, w: 2.5, h: 1.0, color: MUTED, objectName: 'Réponse ' + n });
    });
  }

  // 3 définitions
  {
    const s = content('Infertilité ou stérilité ?', SEC[0], 2); kicker(s, 'DÉFINITIONS');
    [['Fertilité', 'Capacité à concevoir un enfant naturellement.'], ['Infertilité', 'Aucune grossesse après 2 ans de rapports fréquents, sans contraception.'], ['Stérilité', 'Grossesse naturellement impossible.']].forEach(([h, t], i) => {
      const y = 1.5 + i * 0.95;
      T(s, h, { x: 0.7, y, w: 1.6, h: 0.7, fontSize: 18, bold: true, color: ACC, objectName: 'Terme ' + h });
      T(s, t, { x: 2.4, y, w: 3.6, h: 0.7, objectName: 'Définition ' + h });
    });
    pic(s, 'defs', 6.4, 1.4, 3.0, 'Rendu 3D : un ovocyte entouré de 24 mois');
    T(s, [{ text: 'Contraception', options: { bold: true } }, { text: ' : évite la fécondation     ' }, { text: 'Contragestion', options: { bold: true } }, { text: ' : agit après la fécondation' }], { x: 0.7, y: 4.6, w: 8.6, h: 0.35, color: MUTED, objectName: 'Rappel' });
  }

  // 4 répartition
  {
    const s = content('Une affaire de couple', SEC[1], 3); kicker(s, 'CAUSES · RÉPARTITION');
    s.addChart(pres.charts.DOUGHNUT, [{ name: 'Causes', labels: ['Mixtes 39 %', 'Féminines 33 %', 'Masculines 21 %', 'Inexpliquées 7 %'], values: [39, 33, 21, 7] }], {
      x: 0.5, y: 1.35, w: 4.9, h: 3.65, holeSize: 62, chartColors: ['1B2338', '0F8F83', '7C8DB5', 'D1D5DB'], showLegend: true, legendPos: 'b', legendColor: '1B2338', legendFontSize: 12, legendFontFace: '+mn-lt',
      showValue: false, showPercent: false, showTitle: false, dataBorder: { pt: 2, color: 'FFFFFF' },
    });
    [['93 %', 'des cas : une cause est identifiée'], ['60 %', 'impliquent une cause masculine'], ['72 %', 'impliquent une cause féminine']].forEach(([v, l], i) => big(s, v, l, 5.9, 1.65 + i * 1.05, 3.5, 34, 1.6));
  }

  // 5 féminines
  {
    const s = content('Causes féminines', SEC[1], 4); kicker(s, 'CAUSES · FEMME');
    if (MODE3D) slot3d(s, 'uterus', 's5', 0.7, 1.4, 4.1, 2.19, 'Modèle 3D : utérus'); else pic(s, 'fem_fol', 0.7, 1.4, 4.1, 'Rendu 3D : follicule qui ne se rompt pas'); pic(s, 'fem_plug', 5.2, 1.4, 4.1, 'Rendu 3D : trompe obstruée');
    [[0.7, '30 %', 'Troubles de l’ovulation', 'maladies des ovaires, problèmes hormonaux'], [5.2, '26 %', 'Obstruction des trompes', 'suite à des infections']].forEach(([x, v, h, t]) => {
      T(s, v, { x, y: 3.85, w: 1.4, h: 0.8, fontSize: 36, color: ACC, fontFace: '+mj-lt', valign: 'middle', objectName: 'Part ' + v });
      T(s, [{ text: h, options: { bold: true, breakLine: true } }, { text: t, options: { color: MUTED } }], { x: x + 1.5, y: 3.85, w: 2.6, h: 0.8, valign: 'middle', objectName: 'Cause ' + h });
    });
  }

  // 6 masculines
  {
    const s = content('Causes masculines', SEC[1], 5); kicker(s, 'CAUSES · HOMME');
    if (MODE3D) slot3d(s, 'male', 's6', 0.7, 1.4, 3.3, 3.3, 'Modèle 3D : appareil reproducteur masculin'); else pic(s, 'male', 0.7, 1.4, 3.3, 'Rendu 3D : appareil reproducteur masculin');
    ['Spermatozoïdes en nombre insuffisant', 'Mobilité insuffisante', 'Nombreux spermatozoïdes malformés'].forEach((t, i) => step(s, i + 1, '', t, 4.6, 1.5 + i * 0.7, 4.7, 0.5));
    T(s, 'ORIGINES POSSIBLES', { x: 4.6, y: 3.85, w: 4.7, h: 0.25, fontSize: 10.5, bold: true, charSpacing: 3, color: MUTED, objectName: 'Origines titre' });
    T(s, 'Troubles hormonaux · dysfonctionnement des testicules · obstruction des voies génitales', { x: 4.6, y: 4.15, w: 4.7, h: 0.7, objectName: 'Origines texte' });
  }

  // 7 panorama
  {
    const s = content('Les techniques de PMA', SEC[2], 6); kicker(s, 'TECHNIQUES · PANORAMA');
    [['Stimulation hormonale', 'Aide l’ovaire à produire des ovocytes'], ['Insémination', 'Spermatozoïdes déposés dans l’utérus'], ['FIV', 'Fécondation en laboratoire, puis transfert de l’embryon'], ['ICSI', 'Un spermatozoïde injecté dans l’ovocyte'], ['Dons', 'Sperme ou ovocytes de donneurs']].forEach(([h, t], i) => {
      const x = 0.7 + i * 1.8;
      T(s, '0' + (i + 1), { x, y: 1.8, w: 1, h: 0.3, fontSize: 14, bold: true, color: ACC, objectName: 'Numéro ' + (i + 1) });
      T(s, h, { x, y: 2.2, w: 1.55, h: 0.75, fontSize: 18, bold: true, objectName: h });
      T(s, t, { x, y: 3.1, w: 1.55, h: 1.5, color: MUTED, objectName: h + ' texte' });
    });
  }

  // 8 stimulation
  {
    const s = content('La stimulation hormonale', SEC[2], 7); kicker(s, 'TECHNIQUES · 1');
    pic(s, 'stim_fol', 0.7, 1.4, 3.8, 'Rendu 3D : follicules en croissance'); pic(s, 'stim_pon', 0.7, 3.25, 3.8, 'Rendu 3D : ponction des follicules');
    [['Cycle naturel', 'FSH et LH ; le pic de LH déclenche l’ovulation.'], ['Défaillance', 'Sans pic de LH, pas d’ovulation.'], ['Stimulation', 'Des hormones remplacent l’hypophyse.'], ['Ponction', 'Ovocytes prélevés avant l’ovulation.']].forEach(([h, t], i) => step(s, i + 1, h, t, 5.0, 1.45 + i * 0.9, 4.3));
  }

  // 9 insémination
  {
    const s = content('L’insémination artificielle', SEC[2], 8); kicker(s, 'TECHNIQUES · 2');
    if (MODE3D) slot3d(s, 'uterus', 's9', 0.7, 1.4, 4.2, 2.8, 'Modèle 3D : utérus'); else pic(s, 'ins_cav', 0.7, 1.4, 4.2, 'Rendu 3D : cathéter dans la cavité utérine');
    ['Sperme préparé au laboratoire', 'Ovaires stimulés, ovulation contrôlée', 'Dépôt dans l’utérus avec un cathéter'].forEach((t, i) => step(s, i + 1, '', t, 5.4, 1.5 + i * 0.85, 3.9, 0.6));
    [['12 %', 'de réussite', 0.95], ['> 6 000', 'naissances par an', 1.35], ['6 %', 'avec don de sperme', 0.75]].forEach(([v, l, lw], i) => big(s, v, l, [0.7, 3.4, 6.8][i], 4.45, [2.5, 3.2, 2.6][i], 24, lw));
  }

  // 10 dons
  {
    const s = content('Dons de gamètes', SEC[2], 9); kicker(s, 'TECHNIQUES · 3');
    pic(s, 'don_kids', 0.7, 1.4, 3.3, 'Rendu 3D : paillette dans l’azote liquide');
    T(s, 'Don de sperme', { x: 4.6, y: 1.45, w: 4.7, h: 0.35, fontSize: 16, bold: true, color: ACC, objectName: 'Don de sperme titre' });
    T(s, ['Gratuit et volontaire', 'Conservé à −196 °C, jusqu’à 10 ans', '10 enfants maximum par donneur', 'Accès aux origines depuis la loi de 2021'].map((t, i, a) => ({ text: t, options: { bullet: { code: '2013' }, breakLine: i < a.length - 1 } })), { x: 4.6, y: 1.9, w: 4.7, h: 1.6, paraSpaceAfter: 4, objectName: 'Don de sperme liste' });
    T(s, 'Don d’ovocytes', { x: 4.6, y: 3.7, w: 4.7, h: 0.35, fontSize: 16, bold: true, color: ACC, objectName: 'Don d’ovocytes titre' });
    T(s, ['Stimulation, ponction, puis FIV', 'Encore peu répandu'].map((t, i, a) => ({ text: t, options: { bullet: { code: '2013' }, breakLine: i < a.length - 1 } })), { x: 4.6, y: 4.1, w: 4.7, h: 0.8, paraSpaceAfter: 4, objectName: 'Don d’ovocytes liste' });
  }

  // 11 FIV
  {
    const s = content('La fécondation in vitro', SEC[2], 10); kicker(s, 'TECHNIQUES · 4');
    [['fiv_pon', 'Prélèvement', 'Plusieurs ovocytes après stimulation.'], ['fiv_petri', 'Fécondation', 'Ovocytes et spermatozoïdes, 24 h à 37 °C.'], ['fiv_nid', 'Transfert', 'Après 48 h, 1 ou 2 embryons dans l’utérus ; les autres sont congelés.']].forEach(([img, h, t], i) => {
      const x = 0.7 + i * 3.0; pic(s, img, x, 1.35, 2.75, 'Rendu 3D : ' + h.toLowerCase());
      T(s, (i + 1) + '  ' + h, { x, y: 3.05, w: 2.75, h: 0.35, fontSize: 17, bold: true, objectName: 'Étape ' + (i + 1) });
      T(s, t, { x, y: 3.45, w: 2.65, h: 0.95, color: MUTED, objectName: 'Étape ' + (i + 1) + ' texte' });
    });
    [['> 18 000', 'naissances / an', 1.3], ['≈ 20 %', 'de réussite', 1.0], ['3 %', 'gamètes de dons', 0.65], ['GPA', 'interdite', 0.7]].forEach(([v, l, lw], i) => big(s, v, l, [0.7, 3.2, 5.4, 7.9][i], 4.5, [2.4, 2.1, 2.3, 1.5][i], 20, lw));
  }

  // 12 ICSI
  {
    const s = content('ICSI : un seul spermatozoïde', SEC[2], 11); kicker(s, 'TECHNIQUES · 5');
    pic(s, 'icsi', 0.7, 1.4, 5.0, 'Rendu 3D : injection d’un spermatozoïde');
    ['Un spermatozoïde injecté dans l’ovocyte', 'Sous un microscope spécialement équipé', 'Technique très utilisée en FIV'].forEach((t, i) => step(s, i + 1, '', t, 6.1, MODE3D ? 1.4 + i * 0.62 : 1.5 + i * 0.8, 3.2, 0.6));
    T(s, [{ text: 'Surtout utile', options: { bold: true, color: ACC, breakLine: true } }, { text: 'spermatozoïdes peu nombreux, peu mobiles ou anormaux', options: { color: MUTED } }], { x: 6.1, y: MODE3D ? 3.3 : 3.95, w: 3.2, h: 0.9, objectName: 'Indication' });
    if (MODE3D) slot3d(s, 'sperm', 's12', 6.1, 4.2, 3.2, 0.9, 'Modèle 3D : spermatozoïde');
  }

  // 13 comparatif
  {
    const s = content('Comparer les techniques', SEC[3], 12); kicker(s, 'SYNTHÈSE');
    const nb = [{ type: 'none' }, { type: 'none' }, { type: 'solid', pt: 0.5, color: HAIR }, { type: 'none' }];
    const H = (t, al = 'left') => ({ text: t.toUpperCase(), options: { bold: true, color: ACC, fontSize: 10.5, charSpacing: 2, align: al, border: [{ type: 'none' }, { type: 'none' }, { type: 'solid', pt: 1, color: INK }, { type: 'none' }] } });
    const R = (a, b, c, d) => [{ text: a, options: { bold: true, fontSize: 14, border: nb } }, { text: b, options: { fontSize: 14, border: nb } }, { text: c, options: { fontSize: 14, color: MUTED, border: nb } }, { text: d, options: { fontSize: 14, bold: true, color: ACC, align: 'right', border: nb } }];
    s.addTable([[H('Technique'), H('Principe'), H('Indication fréquente'), H('Réussite', 'right')],
      R('Stimulation', 'Aide l’ovaire à produire des ovocytes', 'Troubles de l’ovulation', '—'),
      R('Insémination', 'Sperme préparé déposé dans l’utérus', 'Peu de spermatozoïdes', '12 %'),
      R('FIV', 'Fécondation in vitro puis transfert', 'Trompes obstruées', '≈ 20 %'),
      R('ICSI', 'Un spermatozoïde injecté dans l’ovocyte', 'Spermatozoïdes anormaux', '—'),
      R('Dons', 'Sperme ou ovocytes de donneurs', 'Gamètes absents', '—')],
      { x: 0.7, y: 1.5, w: 8.6, colW: [1.7, 3.2, 2.6, 1.1], rowH: [0.4, 0.58, 0.58, 0.58, 0.58, 0.58], color: C.text1, fontSize: 14, valign: 'middle', margin: [0.04, 0.08, 0.04, 0], objectName: 'Tableau comparatif' });
  }

  // 14 chiffres clés
  {
    const s = content('Les chiffres clés', SEC[3], 13); kicker(s, 'SYNTHÈSE · CHIFFRES');
    const mk = (x, ttl, vals, fmt, ymax) => {
      T(s, ttl, { x, y: 1.5, w: 4, h: 0.3, color: MUTED, objectName: 'Titre ' + ttl });
      s.addChart(pres.charts.BAR, [{ name: ttl, labels: ['Insémination', 'FIVETE'], values: vals }], {
        x: x - 0.1, y: 1.85, w: 4.2, h: 2.6, barDir: 'col', chartColors: ['D1D5DB', '0F8F83'], invertedColors: ['D1D5DB', '0F8F83'], barGapWidthPct: 70, showLegend: false, showTitle: false,
        showValue: true, dataLabelPosition: 'outEnd', dataLabelColor: '1B2338', dataLabelFontSize: 14, dataLabelFontBold: true, dataLabelFontFace: '+mn-lt', dataLabelFormatCode: fmt,
        catAxisLabelColor: '1B2338', catAxisLabelFontSize: 12, catAxisLabelFontFace: '+mn-lt', valAxisHidden: true, valAxisMaxVal: ymax, valAxisMinVal: 0, valGridLine: { style: 'none' }, catGridLine: { style: 'none' },
      });
    };
    mk(0.7, 'Taux de réussite par tentative', [12, 20], '0"%"', 26); mk(5.2, 'Naissances par an en France', [6000, 18000], '#,##0', 23000);
    T(s, 'La FIV réussit mieux par tentative et représente trois fois plus de naissances.', { x: 0.7, y: 4.6, w: 8.6, h: 0.4, fontSize: 16, objectName: 'Conclusion' });
  }

  // 15 cadre légal
  {
    const s = content('Le cadre légal en France', SEC[3], 14); kicker(s, 'CADRE LÉGAL');
    s.addShape(sh.LINE, { x: 1.0, y: 1.95, w: 8.0, h: 0, line: { color: LIGHT, width: 1.25 }, objectName: 'Frise' });
    [['1982', 'Premier « bébé-éprouvette »'], ['1994', 'Lois de bioéthique'], ['2004', 'Révision'], ['2011', 'Révision'], ['2021', 'PMA pour toutes'], ['2022', 'Accès aux origines']].forEach(([y, t], i) => {
      const cx = 1.0 + i * 1.6; const hero = i === 4;
      s.addShape(sh.OVAL, { x: cx - (hero ? 0.11 : 0.07), y: 1.95 - (hero ? 0.11 : 0.07), w: hero ? 0.22 : 0.14, h: hero ? 0.22 : 0.14, fill: { color: hero ? ACC : LIGHT }, line: { color: 'FFFFFF', width: 1.5 }, objectName: 'Repère ' + y });
      T(s, y, { x: cx - 0.7, y: 1.4, w: 1.4, h: 0.3, fontSize: 16, bold: hero, color: hero ? ACC : INK, align: 'center', objectName: 'Année ' + y });
      T(s, t, { x: cx - 0.75, y: 2.2, w: 1.5, h: 0.45, fontSize: 12, color: MUTED, align: 'center', objectName: 'Événement ' + y });
    });
    [['À qui ?', 'Couples femme-homme, couples de femmes, femmes seules (loi du 2 août 2021).'], ['Conditions', 'Femme avant 45 ans, homme avant 60 ans ; consentement.'], ['Payant ?', 'Remboursée à 100 % (6 inséminations, 4 FIV).'], ['Interdits', 'GPA et PMA après décès. Dons gratuits.']].forEach(([h, t], i) => {
      const x = 0.7 + i * 2.25;
      T(s, h, { x, y: 3.05, w: 2.0, h: 0.35, fontSize: 17, bold: true, color: ACC, objectName: 'Question ' + h });
      T(s, t, { x, y: 3.5, w: 2.0, h: 1.4, color: MUTED, objectName: 'Question ' + h + ' texte' });
    });
  }

  // 16 bilan
  {
    const s = content('À chaque cause, sa technique', SEC[3], 15); kicker(s, 'BILAN');
    [['Troubles de l’ovulation', 'Stimulation hormonale'], ['Spermatozoïdes peu nombreux ou peu mobiles', 'Insémination · FIV · ICSI'], ['Trompes obstruées', 'FIV'], ['Absence de gamètes', 'Don de sperme ou d’ovocytes']].forEach(([a, b], i) => {
      const y = 1.5 + i * 0.78;
      T(s, a, { x: 0.7, y, w: 3.2, h: 0.6, fontSize: 15, valign: 'middle', objectName: 'Cause ' + (i + 1) });
      T(s, '→', { x: 4.0, y, w: 0.4, h: 0.6, fontSize: 18, bold: true, color: ACC, valign: 'middle', objectName: 'Flèche ' + (i + 1) });
      T(s, b, { x: 4.5, y, w: 2.5, h: 0.6, fontSize: 15, bold: true, color: ACC, valign: 'middle', objectName: 'Technique ' + (i + 1) });
    });
    pic(s, 'bilan', 7.0, 1.45, 2.4, 'Rendu 3D : utérus et appareil masculin, causes mixtes');
    T(s, 'La PMA aide la nature, dans un cadre légal et éthique.', { x: 0.7, y: 4.75, w: 8.6, h: 0.4, fontSize: 18, fontFace: '+mj-lt', objectName: 'Conclusion' });
  }

  // 17 sources
  {
    const s = content('Sources et références', SEC[3], 16); kicker(s, 'ANNEXE');
    ['Documents 1 et 6 du sujet (manuels scolaires de SVT)', 'Loi n° 2021-1017 du 2 août 2021 relative à la bioéthique', 'Agence de la biomédecine : procreation-medicale.fr et rapports d’activité AMP (environ 1 FIV sur 5 aboutit à une naissance)', 'Ministère de la Santé : sante.fr · Assurance maladie : ameli.fr', 'Modèles 3D : utérus, appareil masculin, spermatozoïde ; autres éléments modélisés pour l’exposé'].forEach((t, i) => T(s, t, { x: 0.7, y: 1.5 + i * 0.58, w: 8.6, h: 0.5, objectName: 'Source ' + (i + 1) }));
    T(s, [{ text: 'À vérifier avant l’oral : ', options: { bold: true, color: ACC } }, { text: 'seuils d’âge (45 et 60 ans) et limite d’âge du remboursement.', options: { color: MUTED } }], { x: 0.7, y: 4.6, w: 8.6, h: 0.35, objectName: 'À vérifier' });
  }

  const out = path.join(__dirname, MODE3D ? 'PMA_SVT_minimal_3D_base.pptx' : 'PMA_SVT_minimal.pptx');
  await pres.writeFile({ fileName: out });
  await applyTheme(out, THEME);
  console.log('ok');
})().catch((e) => { console.error(e); process.exit(1); });
