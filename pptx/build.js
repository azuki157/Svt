// Génère PMA_SVT.pptx : diaporama sobre et professionnel, illustré par des rendus 3D du moteur three.js.
const pptxgen = require('pptxgenjs');
const React = require('react');
const RDS = require('react-dom/server');
const sharp = require('sharp');
const fa = require('react-icons/fa');
const path = require('path');
const SKILL = process.env.SKILL_DIR;
const { applyTheme } = require(path.join(SKILL, 'scripts/apply_theme.js'));

const THEME = {
  name: 'PMA SVT', headFontFace: 'Cambria', bodyFontFace: 'Calibri',
  colors: { dk1: 'F2F5FF', lt1: '0A0F24', dk2: 'A9B4D6', lt2: '141B3A', accent1: 'FF5D8F', accent2: '4DB8FF', accent3: 'A98BFF', accent4: '37E0C0', accent5: 'FFB84D', accent6: 'FF4D5E', hlink: '4DB8FF', folHlink: 'A98BFF' },
};
const BG = '0A0F24', CARDLINE = '27315E';

const pres = new pptxgen();
pres.layout = 'LAYOUT_16x9';
pres.theme = { headFontFace: THEME.headFontFace, bodyFontFace: THEME.bodyFontFace };
pres.title = 'La procréation médicalement assistée'; pres.subject = 'SVT · Sujet 4'; pres.author = 'SVT';
const C = pres.SchemeColor;
const IMG = (n) => path.join(__dirname, 'img', n + '.png');

async function icon(name, color = '#FFFFFF') {
  const svg = RDS.renderToStaticMarkup(React.createElement(fa[name], { color, size: '256' }));
  const buf = await sharp(Buffer.from(svg)).png().toBuffer();
  return 'image/png;base64,' + buf.toString('base64');
}

// ---------- layouts ----------
pres.defineSlideMaster({ title: 'Titre', background: { color: BG }, objects: [] });
pres.defineSlideMaster({
  title: 'Contenu', background: { color: BG },
  objects: [
    { placeholder: { options: { name: 'title', type: 'title', x: 0.6, y: 0.66, w: 8.8, h: 0.7, fontSize: 30, bold: true, color: C.text1, align: 'left', valign: 'top', margin: 0 }, text: '' } },
    { text: { text: 'La procréation médicalement assistée · SVT', options: { x: 0.6, y: 5.2, w: 5, h: 0.25, fontSize: 10, color: C.text2, margin: 0 } } },
  ],
  slideNumber: { x: 8.9, y: 5.2, w: 0.5, h: 0.25, fontSize: 10, color: 'A9B4D6', align: 'right' },
});

// ---------- helpers ----------
const sh = pres.shapes;
function kicker(s, text, color) { s.addText(text, { x: 0.6, y: 0.34, w: 8, h: 0.25, fontSize: 11, bold: true, charSpacing: 3, color, margin: 0, isTextBox: true, objectName: 'Rubrique' }); }
function card(s, x, y, w, h, name = 'Carte') { s.addShape(sh.ROUNDED_RECTANGLE, { x, y, w, h, rectRadius: 0.12, fill: { color: C.background2 }, line: { color: CARDLINE, width: 0.75 }, objectName: name }); }
function txt(s, text, o) { s.addText(text, { margin: 0, isTextBox: true, color: C.text1, fontSize: 14, valign: 'top', ...o }); }
function pill(s, text, x, y, w, color) {
  s.addShape(sh.ROUNDED_RECTANGLE, { x, y, w, h: 0.34, rectRadius: 0.17, fill: { color: BG, transparency: 18 }, line: { color, width: 1 }, objectName: 'Légende' });
  txt(s, text, { x: x + 0.12, y, w: w - 0.24, h: 0.34, fontSize: 12, bold: true, valign: 'middle', align: 'center', objectName: 'Texte légende' });
}
async function badge(s, x, y, d, accent, ico, name = 'Pastille') {
  s.addShape(sh.OVAL, { x, y, w: d, h: d, fill: { color: accent }, line: { color: accent, width: 0 }, objectName: name });
  const k = d * 0.5; s.addImage({ data: await icon(ico), x: x + (d - k) / 2, y: y + (d - k) / 2, w: k, h: k, altText: '', objectName: name + ' icône' });
}
function num(s, n, x, y, d, accent) {
  s.addShape(sh.OVAL, { x, y, w: d, h: d, fill: { color: accent }, line: { color: accent, width: 0 }, objectName: 'Numéro ' + n });
  s.addText(String(n), { x, y, w: d, h: d, align: 'center', valign: 'middle', fontSize: 14, bold: true, color: BG, margin: 0, isTextBox: true, objectName: 'Numéro ' + n + ' texte' });
}
function picture(s, name, x, y, w, alt) { const h = { title: 0.9, defs: 1, male: 1, don_kids: 1 }; s.addImage({ path: IMG(name), x, y, w, h: w / pxAR[name], altText: alt, objectName: 'Illustration ' + name }); }
const pxAR = { title: 1100 / 1222, defs: 1, male: 1, don_kids: 1, fem_fol: 1100 / 588, fem_plug: 1100 / 588, micro: 1100 / 588, stim_pon: 1100 / 493, stim_fol: 1100 / 493, ins_cav: 1100 / 733, ins_feco: 1100 / 733, fiv_pon: 1100 / 611, fiv_petri: 1100 / 611, fiv_nid: 1100 / 611, fiv_emb: 1100 / 611, icsi: 1100 / 748, bilan: 1100 / 846, loi: 1100 / 499 };
const content = (title, sec) => { const s = pres.addSlide({ masterName: 'Contenu', sectionTitle: sec }); s.addText(title, { placeholder: 'title' }); return s; };
const stat = (s, x, y, w, h, big, label, accent, bigSize = 22) => {
  card(s, x, y, w, h, 'Chiffre');
  txt(s, [{ text: big, options: { fontSize: bigSize, bold: true, color: accent, breakLine: true } }, { text: label, options: { fontSize: 12, color: C.text2 } }], { x: x + 0.18, y: y + 0.1, w: w - 0.36, h: h - 0.2, valign: 'middle', objectName: 'Chiffre texte' });
};

(async () => {
  const SEC = ['Introduction', 'Causes', 'Techniques', 'Synthèse et cadre légal'];
  SEC.forEach((t) => pres.addSection({ title: t }));

  // ===== 1. titre =====
  {
    const s = pres.addSlide({ masterName: 'Titre', sectionTitle: SEC[0] });
    s.addText('SVT · SUJET 4', { x: 0.6, y: 0.9, w: 4.8, h: 0.3, fontSize: 12, bold: true, charSpacing: 4, color: C.accent1, margin: 0, isTextBox: true, objectName: 'Rubrique' });
    s.addText('La procréation médicalement assistée', { x: 0.6, y: 1.3, w: 4.9, h: 1.9, fontSize: 38, bold: true, fontFace: '+mj-lt', color: C.text1, margin: 0, valign: 'top', isTextBox: true, objectName: 'Titre' });
    s.addText('Infertilité, stérilité et techniques d’assistance médicale à la procréation', { x: 0.6, y: 3.3, w: 4.7, h: 0.8, fontSize: 16, color: C.text2, margin: 0, valign: 'top', isTextBox: true, objectName: 'Sous-titre' });
    [['Causes', C.accent1], ['Techniques', C.accent4], ['Cadre légal', C.accent3]].forEach(([t, c], i) => {
      const x = 0.6 + i * 1.5;
      s.addShape(sh.ROUNDED_RECTANGLE, { x, y: 4.45, w: 1.35, h: 0.38, rectRadius: 0.19, fill: { color: BG }, line: { color: c, width: 1.25 }, objectName: 'Étiquette ' + t });
      s.addText(t, { x, y: 4.45, w: 1.35, h: 0.38, fontSize: 12, bold: true, color: C.text1, align: 'center', valign: 'middle', margin: 0, isTextBox: true, objectName: 'Étiquette ' + t + ' texte' });
    });
    picture(s, 'title', 5.6, 0.55, 3.9, 'Rendu 3D : l’utérus entouré de spermatozoïdes');
    s.addNotes('Introduction. Faire un enfant semble naturel, et pourtant de nombreux couples rencontrent des difficultés pour concevoir. Pourquoi la fécondation échoue-t-elle parfois ? Comment la médecine peut-elle aider ? Trois questions guident l’exposé : les causes, les techniques, le cadre légal.');
  }

  // ===== 2. trois questions =====
  {
    const s = content('Trois questions pour comprendre', SEC[0]); kicker(s, 'INTRODUCTION', C.accent1);
    const items = [
      ['FaSearch', C.accent1, 'Quelles causes ?', 'Identifier les causes de fertilité et de stérilité, chez la femme comme chez l’homme.'],
      ['FaFlask', C.accent4, 'Quelles techniques ?', 'Relever les différentes techniques d’assistance médicale à la procréation.'],
      ['FaBalanceScale', C.accent3, 'Quel cadre légal ?', 'Pour qui, depuis quand, payant ou remboursé ?'],
    ];
    for (let i = 0; i < 3; i++) {
      const [ic, ac, h, t] = items[i]; const x = 0.6 + i * 3.0;
      card(s, x, 1.6, 2.8, 3.2, 'Carte ' + (i + 1));
      await badge(s, x + 0.3, 1.9, 0.75, ac, ic);
      txt(s, h, { x: x + 0.3, y: 2.9, w: 2.3, h: 0.4, fontSize: 18, bold: true, objectName: 'Question ' + (i + 1) });
      txt(s, t, { x: x + 0.3, y: 3.4, w: 2.3, h: 1.2, color: C.text2, objectName: 'Réponse ' + (i + 1) });
    }
    s.addNotes('Le sujet demande trois choses : identifier les causes de fertilité et de stérilité, relever les techniques d’assistance médicale à la procréation, et préciser le cadre législatif de la PMA.');
  }

  // ===== 3. définitions =====
  {
    const s = content('Infertilité ou stérilité ?', SEC[0]); kicker(s, 'DÉFINITIONS', C.accent5);
    const d = [[C.accent4, 'Fertilité', 'Capacité d’un couple à concevoir un enfant naturellement.'], [C.accent5, 'Infertilité', 'Aucune grossesse après 2 ans de rapports fréquents, sans contraception.'], [C.accent6, 'Stérilité', 'Grossesse considérée comme naturellement impossible.']];
    d.forEach(([ac, h, t], i) => {
      const y = 1.45 + i * 0.94; card(s, 0.6, y, 5.5, 0.82, 'Définition ' + h);
      txt(s, h, { x: 0.8, y, w: 1.45, h: 0.82, fontSize: 17, bold: true, color: ac, valign: 'middle', objectName: 'Terme ' + h });
      txt(s, t, { x: 2.3, y, w: 3.65, h: 0.82, valign: 'middle', objectName: 'Définition ' + h + ' texte' });
    });
    picture(s, 'defs', 6.4, 1.45, 3.0, 'Rendu 3D : un ovocyte entouré d’un anneau de 24 mois');
    [[C.accent2, 'Contraception', 'évite la fécondation'], [C.accent3, 'Contragestion', 'agit après la fécondation']].forEach(([ac, h, t], i) => {
      const x = 0.6 + i * 4.5;
      s.addShape(sh.ROUNDED_RECTANGLE, { x, y: 4.6, w: 4.3, h: 0.5, rectRadius: 0.25, fill: { color: BG }, line: { color: ac, width: 1.25 }, objectName: h });
      txt(s, [{ text: h + ' : ', options: { bold: true, color: ac } }, { text: t }], { x: x + 0.2, y: 4.6, w: 3.9, h: 0.5, valign: 'middle', objectName: h + ' texte' });
    });
    s.addNotes('Un couple est infertile quand il n’arrive pas à avoir d’enfant malgré des rapports fréquents sans contraception pendant deux ans. La stérilité signifie qu’une grossesse est naturellement impossible. À ne pas confondre avec la contraception (évite la fécondation) et la contragestion (contrôle des naissances après la fécondation). La PMA, au contraire, aide à obtenir une fécondation. Source : documents 1 et 6.');
  }

  // ===== 4. répartition =====
  {
    const s = content('Une affaire de couple', SEC[1]); kicker(s, 'CAUSES · RÉPARTITION', C.accent3);
    card(s, 0.6, 1.45, 4.6, 3.55, 'Cadre graphique');
    s.addChart(pres.charts.DOUGHNUT, [{ name: 'Causes', labels: ['Mixtes', 'Féminines', 'Masculines', 'Inexpliquées'], values: [39, 33, 21, 7] }], {
      x: 0.7, y: 1.55, w: 4.4, h: 3.35, holeSize: 58, chartColors: ['A98BFF', 'FF5D8F', '4DB8FF', '98A2B8'], showLegend: true, legendPos: 'b', legendColor: 'F2F5FF', legendFontSize: 12, legendFontFace: '+mn-lt',
      showValue: true, showPercent: false, dataLabelColor: '0A0F24', dataLabelFontSize: 14, dataLabelFontBold: true, dataLabelFontFace: '+mn-lt', dataLabelFormatCode: '0"%"', showTitle: false, dataBorder: { pt: 2, color: '141B3A' },
    });
    [['93 %', 'des cas : une cause est identifiée', C.accent4], ['60 %', 'impliquent une cause masculine (21 + 39)', C.accent2], ['72 %', 'impliquent une cause féminine (33 + 39)', C.accent1]].forEach(([b, l, ac], i) => {
      const y = 1.45 + i * 1.2; card(s, 5.5, y, 3.9, 1.1, 'Chiffre ' + b);
      txt(s, b, { x: 5.7, y, w: 1.45, h: 1.1, fontSize: 32, bold: true, color: ac, valign: 'middle', objectName: 'Valeur ' + b });
      txt(s, l, { x: 7.2, y, w: 2.05, h: 1.1, valign: 'middle', color: C.text2, objectName: 'Libellé ' + b });
    });
    s.addNotes('Répartition des causes d’infertilité : 39 % mixtes, 33 % féminines, 21 % masculines, 7 % inexpliquées. Une cause masculine intervient donc dans 60 % des cas (21 + 39) et une cause féminine dans 72 % (33 + 39). Source : document 6.');
  }

  // ===== 5. causes féminines =====
  {
    const s = content('Causes féminines', SEC[1]); kicker(s, 'CAUSES · FEMME', C.accent1);
    picture(s, 'fem_fol', 0.6, 1.4, 4.25, 'Rendu 3D : follicule qui ne libère pas son ovocyte'); pill(s, 'Follicule qui ne se rompt pas', 0.75, 3.2, 2.7, C.accent5);
    picture(s, 'fem_plug', 5.15, 1.4, 4.25, 'Rendu 3D : trompe obstruée par une infection'); pill(s, 'Trompe obstruée par une infection', 5.3, 3.2, 3.0, C.accent6);
    [[0.6, '30 %', C.accent5, 'Troubles de l’ovulation', 'maladies des ovaires, problèmes hormonaux'], [5.15, '26 %', C.accent6, 'Obstruction des trompes', 'suite à des infections']].forEach(([x, b, ac, h, t]) => {
      card(s, x, 3.85, 4.25, 1.15, 'Cause ' + h);
      txt(s, b, { x: x + 0.2, y: 3.85, w: 1.45, h: 1.15, fontSize: 28, bold: true, color: ac, valign: 'middle', objectName: 'Part ' + b });
      txt(s, [{ text: h, options: { bold: true, breakLine: true } }, { text: t, options: { color: C.text2 } }], { x: x + 1.75, y: 3.85, w: 2.35, h: 1.15, valign: 'middle', objectName: 'Cause ' + h + ' texte' });
    });
    s.addNotes('Chez la femme, les deux principales causes : les troubles de l’ovulation (30 %), dus à des maladies des ovaires ou à des problèmes hormonaux, et l’obstruction des trompes utérines (26 %), suite à des infections. Dans les deux cas, ovocyte et spermatozoïdes ne peuvent pas se rencontrer.');
  }

  // ===== 6. causes masculines =====
  {
    const s = content('Causes masculines', SEC[1]); kicker(s, 'CAUSES · HOMME', C.accent2);
    picture(s, 'male', 0.6, 1.4, 3.3, 'Rendu 3D : appareil reproducteur masculin, testicules mis en évidence'); pill(s, '21 % des infertilités', 0.75, 4.2, 2.1, C.accent2);
    const rows = [['FaHourglassHalf', 'En nombre insuffisant'], ['FaClock', 'De mobilité insuffisante'], ['FaDna', 'Malformés en grand nombre']];
    txt(s, 'Anomalies des spermatozoïdes', { x: 4.3, y: 1.4, w: 5, h: 0.3, fontSize: 14, color: C.text2, bold: true, objectName: 'Sous-titre' });
    for (let i = 0; i < 3; i++) {
      const y = 1.8 + i * 0.72; await badge(s, 4.3, y, 0.55, C.accent2, rows[i][0], 'Anomalie ' + (i + 1));
      txt(s, rows[i][1], { x: 5.05, y, w: 4.3, h: 0.55, fontSize: 18, bold: true, valign: 'middle', objectName: 'Anomalie ' + (i + 1) + ' texte' });
    }
    card(s, 4.3, 3.95, 5.1, 1.05, 'Origines');
    txt(s, [{ text: 'Origines possibles', options: { bold: true, color: C.accent5, breakLine: true } }, { text: 'troubles hormonaux, dysfonctionnement des testicules, obstruction des voies génitales' }], { x: 4.5, y: 3.95, w: 4.7, h: 1.05, valign: 'middle', objectName: 'Origines texte' });
    s.addNotes('Chez l’homme, l’infertilité vient surtout d’un nombre insuffisant de spermatozoïdes, d’une mobilité insuffisante ou d’un nombre important de spermatozoïdes malformés. L’origine est diverse : troubles hormonaux, dysfonctionnement des testicules, obstruction des voies génitales. Source : document 6.');
  }

  // ===== 7. panorama des techniques =====
  {
    const s = content('Les techniques de PMA', SEC[2]); kicker(s, 'TECHNIQUES · PANORAMA', C.accent4);
    const T = [['FaSyringe', C.accent5, 'Stimulation hormonale', 'Aide l’ovaire à produire des ovocytes'], ['FaVial', C.accent1, 'Insémination', 'Spermatozoïdes déposés dans l’utérus'], ['FaFlask', C.accent4, 'FIV', 'Fécondation en laboratoire puis transfert de l’embryon'], ['FaMicroscope', C.accent3, 'ICSI', 'Un spermatozoïde injecté dans l’ovocyte'], ['FaSnowflake', C.accent2, 'Dons', 'Sperme ou ovocytes de donneurs']];
    for (let i = 0; i < 5; i++) {
      const [ic, ac, h, t] = T[i]; const x = 0.6 + i * 1.8;
      card(s, x, 1.5, 1.64, 3.4, 'Technique ' + h);
      await badge(s, x + 0.2, 1.7, 0.62, ac, ic);
      txt(s, h, { x: x + 0.2, y: 2.55, w: 1.28, h: 0.7, fontSize: 16, bold: true, objectName: 'Technique ' + h + ' nom' });
      txt(s, t, { x: x + 0.2, y: 3.3, w: 1.3, h: 1.5, color: C.text2, objectName: 'Technique ' + h + ' texte' });
    }
    s.addNotes('Cinq techniques à connaître : la stimulation hormonale des ovaires, l’insémination artificielle, la fécondation in vitro avec transfert d’embryon, l’ICSI et les dons de gamètes. Elles se combinent souvent : la stimulation précède l’insémination et la FIV, l’ICSI est une variante de la FIV.');
  }

  // ===== 8. stimulation =====
  {
    const s = content('La stimulation hormonale', SEC[2]); kicker(s, 'TECHNIQUES · 1', C.accent5);
    picture(s, 'stim_fol', 0.6, 1.4, 3.9, 'Rendu 3D : follicules en croissance sous stimulation'); picture(s, 'stim_pon', 0.6, 3.25, 3.9, 'Rendu 3D : ponction des follicules');
    const it = [['Cycle naturel', 'FSH et LH hypophysaires ; le pic de LH déclenche l’ovulation.'], ['Défaillance', 'Sans pic de LH, l’ovulation n’a pas lieu.'], ['Stimulation', 'Des hormones remplacent ou renforcent le complexe hypothalamo-hypophysaire.'], ['Ponction', 'Ovocytes prélevés avant l’ovulation (don, FIV).']];
    it.forEach(([h, t], i) => {
      const y = 1.4 + i * 0.9; num(s, i + 1, 4.9, y, 0.42, C.accent5);
      txt(s, [{ text: h, options: { bold: true, breakLine: true } }, { text: t, options: { color: C.text2 } }], { x: 5.5, y: y - 0.02, w: 3.9, h: 0.85, objectName: 'Étape ' + (i + 1) });
    });
    s.addNotes('Dans un cycle naturel, l’hypophyse libère FSH puis un pic de LH qui déclenche l’ovulation. Si ce pic manque, il n’y a pas d’ovulation. La stimulation remplace ou renforce cette commande : plusieurs follicules grandissent, contrôlés à l’échographie. Les ovocytes sont ponctionnés avant l’ovulation, pour le don d’ovocytes ou la FIV.');
  }

  // ===== 9. insémination =====
  {
    const s = content('L’insémination artificielle', SEC[2]); kicker(s, 'TECHNIQUES · 2', C.accent1);
    picture(s, 'ins_cav', 0.6, 1.4, 4.2, 'Rendu 3D : cathéter dans la cavité utérine'); pill(s, 'Dépôt dans l’utérus', 0.75, 3.75, 2.0, C.accent1);
    const st = ['Sperme du conjoint ou d’un donneur, préparé au laboratoire.', 'Ovaires stimulés, ovulation contrôlée pour choisir le bon moment.', 'Dépôt dans l’utérus avec un cathéter fin.'];
    st.forEach((t, i) => { const y = 1.45 + i * 0.92; num(s, i + 1, 5.15, y, 0.42, C.accent1); txt(s, t, { x: 5.75, y: y - 0.02, w: 3.65, h: 0.85, objectName: 'Étape ' + (i + 1) }); });
    [['12 %', 'de réussite par insémination', C.accent1], ['> 6 000', 'naissances par an en France', C.accent4], ['6 %', 'avec don de sperme', C.accent5]].forEach(([b, l, ac], i) => stat(s, 0.6 + i * 3.0, 4.4, 2.8, 0.68, b, l, ac, 18));
    s.addNotes('L’insémination artificielle place dans l’utérus des spermatozoïdes préalablement préparés, du conjoint ou d’un donneur (6 % des cas). Pour augmenter les chances, les ovaires sont stimulés et l’ovulation contrôlée. Taux de succès d’environ 12 % ; plus de 6 000 naissances par an en France. La fécondation reste naturelle.');
  }

  // ===== 10. dons =====
  {
    const s = content('Dons de gamètes', SEC[2]); kicker(s, 'TECHNIQUES · 3', C.accent2);
    picture(s, 'don_kids', 0.6, 1.4, 3.4, 'Rendu 3D : paillette plongée dans l’azote liquide, dix naissances maximum'); pill(s, '−196 °C', 0.75, 4.35, 1.2, C.accent2);
    card(s, 4.3, 1.4, 5.1, 2.25, 'Don de sperme');
    txt(s, 'Don de sperme', { x: 4.5, y: 1.5, w: 4.7, h: 0.35, fontSize: 17, bold: true, color: C.accent2, objectName: 'Don de sperme titre' });
    txt(s, [{ text: 'Gratuit et volontaire', options: { bullet: true, breakLine: true } }, { text: 'Conservé à −196 °C (azote liquide), jusqu’à 10 ans', options: { bullet: true, breakLine: true } }, { text: '10 enfants au maximum par donneur', options: { bullet: true, breakLine: true } }, { text: 'Loi de 2021 : accès aux origines à la majorité', options: { bullet: true } }], { x: 4.5, y: 1.92, w: 4.7, h: 1.65, paraSpaceAfter: 4, objectName: 'Don de sperme liste' });
    card(s, 4.3, 3.8, 5.1, 1.2, 'Don d’ovocytes');
    txt(s, 'Don d’ovocytes', { x: 4.5, y: 3.88, w: 4.7, h: 0.35, fontSize: 17, bold: true, color: C.accent1, objectName: 'Don d’ovocytes titre' });
    txt(s, [{ text: 'Stimulation hormonale + ponction, puis FIV', options: { bullet: true, breakLine: true } }, { text: 'Encore peu répandu', options: { bullet: true } }], { x: 4.5, y: 4.28, w: 4.7, h: 0.7, paraSpaceAfter: 3, objectName: 'Don d’ovocytes liste' });
    s.addNotes('Le don de sperme est gratuit et volontaire. Les spermatozoïdes sont conservés dans l’azote liquide à −196 °C, jusqu’à 10 ans ; un donneur ne peut donner naissance qu’à 10 enfants. Le document 6 le décrit comme anonyme ; la loi de bioéthique de 2021 a changé cela : depuis le 1er septembre 2022, les donneurs consentent à la transmission de leur identité aux enfants nés de leur don, à leur majorité. Le don d’ovocytes nécessite stimulation et ponction, puis une FIV ; il reste peu répandu.');
  }

  // ===== 11. FIV =====
  {
    const s = content('La fécondation in vitro', SEC[2]); kicker(s, 'TECHNIQUES · 4', C.accent4);
    const st = [['fiv_pon', 'Prélèvement', 'Plusieurs ovocytes après stimulation hormonale.', C.accent1, 'Rendu 3D : ponction des ovocytes'], ['fiv_petri', 'Fécondation', 'Ovocytes et spermatozoïdes, incubés 24 h à 37 °C.', C.accent4, 'Rendu 3D : boîte de Pétri incubée'], ['fiv_nid', 'Transfert', 'Après 48 h, 1 ou 2 embryons normaux sont déposés dans l’utérus ; les autres sont congelés.', C.accent3, 'Rendu 3D : embryons déposés dans la cavité utérine']];
    st.forEach(([img, h, t, ac, alt], i) => {
      const x = 0.6 + i * 3.0; picture(s, img, x, 1.35, 2.8, alt);
      num(s, i + 1, x, 3.2, 0.36, ac);
      txt(s, h, { x: x + 0.48, y: 3.2, w: 2.3, h: 0.36, fontSize: 17, bold: true, valign: 'middle', objectName: 'Étape ' + (i + 1) });
      txt(s, t, { x, y: 3.65, w: 2.8, h: 0.95, color: C.text2, objectName: 'Étape ' + (i + 1) + ' texte' });
    });
    [['> 18 000', 'naissances / an', C.accent4], ['≈ 20 %', 'de réussite', C.accent5], ['3 %', 'gamètes de dons', C.accent1], ['GPA', 'interdite en France', C.accent6]].forEach(([b, l, ac], i) => stat(s, 0.6 + i * 2.25, 4.45, 2.05, 0.65, b, l, ac, 17));
    s.addNotes('FIV, ou FIVETE : fécondation in vitro et transfert d’embryon. 1) prélèvement de plusieurs ovocytes après stimulation ; 2) fécondation : ovocytes et spermatozoïdes mis en contact et incubés à 37 °C pendant 24 h ; 3) après 48 h, un ou deux embryons au développement normal sont déposés dans la cavité utérine avec un cathéter fin et souple, les autres sont congelés. Plus de 18 000 naissances par an, environ 20 % de réussite ; gamètes issus de dons dans 3 % des cas. La GPA est interdite en France.');
  }

  // ===== 12. ICSI =====
  {
    const s = content('ICSI : un seul spermatozoïde', SEC[2]); kicker(s, 'TECHNIQUES · 5', C.accent3);
    picture(s, 'icsi', 0.6, 1.4, 5.0, 'Rendu 3D : micropipette injectant un spermatozoïde dans un ovocyte'); pill(s, 'Micropipette d’injection', 0.75, 4.4, 2.35, C.accent3);
    const it = ['Un spermatozoïde est injecté directement dans l’ovocyte.', 'Réalisée sous un microscope spécialement équipé.', 'Technique très utilisée en FIV.'];
    it.forEach((t, i) => { const y = 1.45 + i * 0.72; num(s, i + 1, 5.95, y, 0.38, C.accent3); txt(s, t, { x: 6.5, y: y - 0.03, w: 2.9, h: 0.7, objectName: 'Point ' + (i + 1) }); });
    card(s, 5.95, 3.7, 3.45, 1.3, 'Indication');
    txt(s, [{ text: 'Surtout utile', options: { bold: true, color: C.accent3, breakLine: true } }, { text: 'spermatozoïdes peu nombreux, peu mobiles ou anormaux' }], { x: 6.15, y: 3.7, w: 3.1, h: 1.3, valign: 'middle', objectName: 'Indication texte' });
    s.addNotes('Dans l’ICSI, un spermatozoïde est sélectionné puis injecté directement dans l’ovocyte, grâce à un microscope spécialement équipé : une pipette maintient l’ovocyte, une fine aiguille dépose le spermatozoïde. Cette technique, très utilisée, est précieuse quand les spermatozoïdes sont peu nombreux, peu mobiles ou anormaux.');
  }

  // ===== 13. tableau comparatif =====
  {
    const s = content('Comparer les techniques', SEC[3]); kicker(s, 'SYNTHÈSE', C.accent4);
    const H = (t) => ({ text: t, options: { bold: true, color: BG, fill: { color: '37E0C0' }, fontSize: 14, valign: 'middle' } });
    const R = (a, b, c, d, ac) => [{ text: a, options: { bold: true, color: ac, fontSize: 14 } }, { text: b, options: { fontSize: 14 } }, { text: c, options: { fontSize: 14, color: 'A9B4D6' } }, { text: d, options: { fontSize: 14, bold: true, align: 'center' } }];
    const rows = [[H('Technique'), H('Principe'), H('Indication fréquente'), H('Réussite')],
      R('Stimulation', 'Aide l’ovaire à produire des ovocytes', 'Troubles de l’ovulation', '—', 'FFB84D'),
      R('Insémination', 'Sperme préparé déposé dans l’utérus', 'Peu de spermatozoïdes, ovulation à contrôler', '12 %', 'FF5D8F'),
      R('FIV', 'Fécondation in vitro puis transfert', 'Trompes obstruées', '≈ 20 %', '37E0C0'),
      R('ICSI', 'Un spermatozoïde injecté dans l’ovocyte', 'Spermatozoïdes peu nombreux, peu mobiles, anormaux', '—', 'A98BFF'),
      R('Dons', 'Sperme ou ovocytes de donneurs', 'Gamètes absents ou de mauvaise qualité', '—', '4DB8FF')];
    s.addTable(rows, { x: 0.6, y: 1.45, w: 8.8, colW: [1.6, 3.0, 3.2, 1.0], rowH: [0.4, 0.62, 0.62, 0.62, 0.62, 0.62], color: C.text1, fill: { color: C.background2 }, border: { type: 'solid', pt: 0.75, color: CARDLINE }, margin: [0.05, 0.1, 0.05, 0.1], fontSize: 14, valign: 'middle', objectName: 'Tableau comparatif' });
    s.addNotes('Tableau de synthèse. Les indications sont données à titre d’exemple : le médecin choisit la technique selon la cause identifiée. Les taux de réussite sont ceux du document 6 (insémination 12 %, FIVETE environ 20 %).');
  }

  // ===== 14. chiffres clés =====
  {
    const s = content('Les chiffres clés', SEC[3]); kicker(s, 'SYNTHÈSE · CHIFFRES', C.accent4);
    const mk = (x, ttl, vals, fmt, ymax, ac) => {
      card(s, x, 1.45, 4.3, 3.05, ttl);
      txt(s, ttl, { x: x + 0.2, y: 1.55, w: 3.9, h: 0.3, fontSize: 14, bold: true, color: C.text2, objectName: 'Titre ' + ttl });
      s.addChart(pres.charts.BAR, [{ name: ttl, labels: ['Insémination', 'FIVETE'], values: vals }], {
        x: x + 0.1, y: 1.9, w: 4.1, h: 2.5, barDir: 'col', chartColors: ac, invertedColors: ac, barGapWidthPct: 60, showLegend: false, showTitle: false,
        showValue: true, dataLabelPosition: 'outEnd', dataLabelColor: 'F2F5FF', dataLabelFontSize: 14, dataLabelFontBold: true, dataLabelFontFace: '+mn-lt', dataLabelFormatCode: fmt,
        catAxisLabelColor: 'F2F5FF', catAxisLabelFontSize: 12, catAxisLabelFontFace: '+mn-lt', valAxisHidden: true, valAxisMaxVal: ymax, valAxisMinVal: 0, valGridLine: { style: 'none' }, catGridLine: { style: 'none' },
      });
    };
    mk(0.6, 'Taux de réussite par tentative', [12, 20], '0"%"', 26, ['FF5D8F', '37E0C0']);
    mk(5.1, 'Naissances par an en France', [6000, 18000], '#,##0', 23000, ['FF5D8F', '37E0C0']);
    card(s, 0.6, 4.62, 8.8, 0.5, 'Conclusion');
    txt(s, 'La FIV réussit mieux par tentative et représente trois fois plus de naissances.', { x: 0.8, y: 4.62, w: 8.4, h: 0.5, valign: 'middle', objectName: 'Conclusion texte' });
    s.addNotes('Environ 12 % de réussite pour l’insémination, 20 % pour la FIVETE. En France, plus de 6 000 naissances par an par insémination et plus de 18 000 par FIVETE. Source : document 6.');
  }

  // ===== 15. cadre légal =====
  {
    const s = content('Le cadre légal en France', SEC[3]); kicker(s, 'CADRE LÉGAL', C.accent3);
    const ev = [['1982', 'Premier « bébé-éprouvette »', 'B9C6FF'], ['1994', 'Lois de bioéthique', '4DB8FF'], ['2004', 'Révision', 'A98BFF'], ['2011', 'Révision', 'A98BFF'], ['2021', 'PMA pour toutes', 'FF5D8F'], ['2022', 'Accès aux origines', '37E0C0']];
    s.addShape(sh.LINE, { x: 1.1, y: 1.95, w: 7.8, h: 0, line: { color: '3A4680', width: 2 }, objectName: 'Frise' });
    ev.forEach(([y, t, c], i) => {
      const cx = 1.1 + i * 1.56; const big = i === 4;
      s.addShape(sh.OVAL, { x: cx - (big ? 0.15 : 0.1), y: 1.95 - (big ? 0.15 : 0.1), w: big ? 0.3 : 0.2, h: big ? 0.3 : 0.2, fill: { color: c }, line: { color: BG, width: 2 }, objectName: 'Repère ' + y });
      txt(s, y, { x: cx - 0.7, y: 1.4, w: 1.4, h: 0.3, fontSize: 16, bold: true, color: c, align: 'center', objectName: 'Année ' + y });
      txt(s, t, { x: cx - 0.72, y: 2.2, w: 1.44, h: 0.4, fontSize: 12, color: C.text2, align: 'center', objectName: 'Événement ' + y });
    });
    const q = [[C.accent1, 'À qui ?', 'Couples femme-homme, couples de femmes et femmes seules (loi du 2 août 2021).'], [C.accent5, 'Conditions', 'Être en âge de procréer : femme avant 45 ans, homme avant 60 ans ; consentement.'], [C.accent4, 'Payant ?', 'Remboursée à 100 % par l’Assurance maladie (6 inséminations, 4 FIV).'], [C.accent6, 'Interdits', 'GPA (mère porteuse) et PMA après décès. Dons gratuits et volontaires.']];
    q.forEach(([ac, h, t], i) => {
      const x = 0.6 + i * 2.25; card(s, x, 2.85, 2.05, 2.15, 'Question ' + h);
      txt(s, h, { x: x + 0.18, y: 2.95, w: 1.7, h: 0.35, fontSize: 17, bold: true, color: ac, objectName: 'Question ' + h + ' titre' });
      txt(s, t, { x: x + 0.18, y: 3.38, w: 1.72, h: 1.55, color: C.text1, objectName: 'Question ' + h + ' texte' });
    });
    s.addNotes('Le cadre légal a évolué avec les lois de bioéthique de 1994, 2004, 2011 et surtout 2021. Depuis la loi du 2 août 2021, la PMA est ouverte à toutes les femmes : couples femme-homme, couples de femmes, femmes seules. Elle est prise en charge à 100 % par l’Assurance maladie, dans la limite de six inséminations et quatre FIV. Les dons restent gratuits et volontaires, avec accès aux origines depuis le 1er septembre 2022. La gestation pour autrui et la PMA post-mortem sont interdites. À vérifier avant l’oral : les âges limites (45 ans pour la femme, 60 ans pour l’homme) et la limite d’âge du remboursement (43 ans selon l’Assurance maladie).');
  }

  // ===== 16. bilan =====
  {
    const s = content('À chaque cause, sa technique', SEC[3]); kicker(s, 'BILAN', C.accent4);
    const m = [['Troubles de l’ovulation', 'Stimulation hormonale', C.accent5], ['Spermatozoïdes peu nombreux ou peu mobiles', 'Insémination · FIV · ICSI', C.accent2], ['Trompes obstruées', 'FIV', C.accent3], ['Absence de gamètes', 'Don de sperme ou d’ovocytes', C.accent4]];
    m.forEach(([a, b, ac], i) => {
      const y = 1.45 + i * 0.9;
      card(s, 0.6, y, 2.75, 0.78, 'Cause ' + (i + 1)); txt(s, a, { x: 0.75, y, w: 2.45, h: 0.78, valign: 'middle', objectName: 'Cause ' + (i + 1) + ' texte' });
      s.addText('→', { x: 3.4, y, w: 0.4, h: 0.78, fontSize: 22, bold: true, color: ac, align: 'center', valign: 'middle', margin: 0, isTextBox: true, objectName: 'Flèche ' + (i + 1) });
      s.addShape(sh.ROUNDED_RECTANGLE, { x: 3.85, y, w: 2.6, h: 0.78, rectRadius: 0.12, fill: { color: ac }, line: { color: ac, width: 0 }, objectName: 'Technique ' + (i + 1) });
      txt(s, b, { x: 4.0, y, w: 2.3, h: 0.78, fontSize: 15, bold: true, color: BG, valign: 'middle', objectName: 'Technique ' + (i + 1) + ' texte' });
    });
    picture(s, 'bilan', 6.75, 1.45, 2.65, 'Rendu 3D : les trois stations, appareil féminin, masculin et laboratoire');
    card(s, 6.75, 3.7, 2.65, 1.3, 'Conclusion');
    txt(s, 'La PMA aide la nature, dans un cadre légal et éthique.', { x: 6.9, y: 3.7, w: 2.35, h: 1.3, valign: 'middle', italic: true, color: C.accent4, objectName: 'Conclusion texte' });
    s.addNotes('Pour résumer : un trouble de l’ovulation se traite par stimulation hormonale ; des spermatozoïdes peu nombreux ou peu mobiles par insémination, FIV ou ICSI ; des trompes obstruées par une FIV ; l’absence de gamètes par un don. La PMA aide la nature, elle ne la remplace pas, dans un cadre légal et éthique précis.');
  }

  // ===== 17. sources =====
  {
    const s = content('Sources et références', SEC[3]); kicker(s, 'ANNEXE', C.accent2);
    const L = [['FaBook', 'Documents 1 et 6 du sujet (manuels scolaires de SVT)'], ['FaLandmark', 'Loi n° 2021-1017 du 2 août 2021 relative à la bioéthique'], ['FaHeartbeat', 'Agence de la biomédecine : procreation-medicale.fr'], ['FaEuroSign', 'Ministère de la Santé (sante.fr), Assurance maladie (ameli.fr)'], ['FaCube', 'Modèles 3D : utérus, appareil masculin, spermatozoïde ; autres éléments modélisés pour l’exposé']];
    for (let i = 0; i < L.length; i++) { const y = 1.4 + i * 0.62; await badge(s, 0.6, y, 0.5, C.accent2, L[i][0], 'Source ' + (i + 1)); txt(s, L[i][1], { x: 1.3, y, w: 8, h: 0.5, valign: 'middle', objectName: 'Source ' + (i + 1) + ' texte' }); }
    card(s, 0.6, 4.6, 8.8, 0.5, 'À vérifier');
    txt(s, [{ text: 'À vérifier avant l’oral : ', options: { bold: true, color: C.accent5 } }, { text: 'seuils d’âge (45 et 60 ans) et limite d’âge du remboursement.' }], { x: 0.8, y: 4.6, w: 8.4, h: 0.5, valign: 'middle', objectName: 'À vérifier texte' });
    s.addNotes('Sources utilisées pour le contenu et le cadre légal.');
  }

  await pres.writeFile({ fileName: path.join(__dirname, 'PMA_SVT.pptx') });
  await applyTheme(path.join(__dirname, 'PMA_SVT.pptx'), THEME);
  console.log('ok');
})().catch((e) => { console.error(e); process.exit(1); });
