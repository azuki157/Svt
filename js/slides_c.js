// Slides 9 à 13 : FIV (prélèvement + fécondation), FIV (embryons + transfert), ICSI, cadre légal, bilan.
import * as THREE from 'three';
import { makeOocyte, makeEmbryo, setEmbryoProgress, makePetri, makeCatheter, setCatheter, makeCavity, makeStraw, makeDewar, makeMist, makePipette, makeStream, makeBar, Swarm, setPronuclei, glowShell, makeFollicle } from './props.js';
import { makeFlock, makeBurst, bump, uPos, partPos, TUBE_L, TUBE_R, OV_L, OV_R, v3 } from './kit.js';
import { clamp, lerp, smooth, seg, easeOut, easeBack, easeInOut, rng } from './util.js';

const V3 = THREE.Vector3;

export function slidesC(W) {
  const { S, COL, ST } = W;
  const out = [];
  const wl = (p) => uPos(W, p[0], p[1], p[2]);
  const HUB = new V3(5.5, 0, 0);
  const LP = ST.L.clone().add(v3(0, -0.45, 0));

  // =====================================================================
  // 9. FIV — ÉTAPES 1 ET 2 : PRÉLÈVEMENT ET FÉCONDATION
  // =====================================================================
  {
    let petri, oos = [], fl, bursts = [], clock = [], chamber, pip;
    const R = rng(77);
    const OP = [[-0.9, 0.7], [0.1, 1.0], [0.95, 0.55], [-0.5, -0.4], [0.6, -0.6], [-1.15, -0.1]];
    out.push({
      id: 'fiv1', dur: 48, bg: [0x063a46, 0x02080c], accent: COL.lab, shift: 0.17,
      ui: {
        side: 'left', dense: true, kicker: '08 · Fécondation in vitro (FIVETE)', title: 'FIV : la fécondation<br>se fait <span style="color:#37e0c0">hors du corps</span>',
        items: [
          { at: 2, html: '<em>①</em> <b>Prélèvement</b> de plusieurs ovocytes après stimulation hormonale.' },
          { at: 14, html: '<em>②</em> <b>Fécondation</b> : ovocytes et spermatozoïdes sont mis en contact et <b>incubés</b> à 37 °C pendant 24 h.' },
          { at: 38, html: 'Gamètes le plus souvent <b>du couple</b> (dons : 3 % des FIVETE).' },
        ],
        stats: [
          { at: 16, v: 37, suf: ' °C', label: 'température d’incubation', color: COL.warn },
          { at: 24, v: 24, suf: ' h', label: 'de contact entre les gamètes', color: COL.lab },
        ],
        src: 'Document 6 · La fécondation in vitro et transfert d’embryon',
      },
      narration: 'Dans la fécondation in vitro, des ovocytes sont d’abord prélevés après stimulation hormonale. Ils sont ensuite mis en contact avec les spermatozoïdes dans une boîte, incubée à 37 degrés pendant 24 heures. La fécondation a lieu hors du corps : c’est la seule solution lorsque, par exemple, les trompes sont obstruées.',
      init(W) {
        petri = W.add(makePetri(2.3)); petri.position.copy(LP);
        OP.forEach((p) => { const o = W.add(makeOocyte(0.24, { corona: true })); o.userData.home = p; oos.push(o); });
        fl = makeFlock(W, 90, { scale: 0.2, seed: 21 });
        for (let i = 0; i < 6; i++) bursts.push(makeBurst(W, 0xbff0ff, 0.45));
        for (let i = 0; i < 24; i++) {
          const a = Math.PI / 2 - (i / 24) * Math.PI * 2;
          const m = new THREE.Mesh(new THREE.SphereGeometry(0.07, 12, 10), new THREE.MeshStandardMaterial({ color: 0x1b3a44, emissive: 0, roughness: 0.4 }));
          m.position.set(Math.cos(a) * 2.85, 0.1, Math.sin(a) * 2.85); clock.push(m);
        }
        chamber = W.add(new THREE.Group());
        chamber.position.copy(LP);
        const gl = new THREE.Mesh(new THREE.CylinderGeometry(3.3, 3.3, 1.2, 64, 1, true), new THREE.MeshPhysicalMaterial({ color: 0xffb84d, transparent: true, opacity: 0.08, roughness: 0.1, emissive: 0xff9a2d, emissiveIntensity: 0.25, side: THREE.DoubleSide, depthWrite: false }));
        gl.position.y = 0.5; chamber.add(gl);
        const tg = new THREE.Group(); clock.forEach((m) => tg.add(m)); chamber.add(tg); chamber.userData.tg = tg;
        pip = W.add(makePipette(0.05, 0.16, 3.4, true));
      },
      update(W, t) {
        W.show(W.platL, 1); W.show(petri, 1);
        { const lf = smooth(seg(t, 0.5, 3)); petri.userData.lid.position.set(lf * 6.2, lf * 0.8, lf * -0.6); }
        W.show(petri.userData.lid, 1);
        // ① prélèvement : les ovocytes tombent dans la boîte via une pipette
        W.show(pip, bump(t, 2, 13, 0.6, 0.8)); pip.position.copy(LP).add(v3(0.4, 3.4, 0.3)); pip.rotation.z = Math.PI; pip.rotation.x = 0.0;
        oos.forEach((o, i) => {
          const t0 = 3.0 + i * 1.3; const f = easeOut(seg(t, t0, t0 + 1.4));
          W.show(o, f > 0.001 ? 1 : 0);
          const h = o.userData.home; const yTop = LP.y + 3.2;
          const y = lerp(yTop, LP.y + 0.28, f);
          o.position.set(LP.x + h[0] + Math.sin(W.time * 0.5 + i) * 0.04, y, LP.z + h[1]);
          o.rotation.y = W.time * 0.3 + i;
        });
        W.label('l1', '① Prélèvement<small>ovocytes après stimulation</small>', LP.clone().add(v3(0, 1.6, 0)), { a: bump(t, 3, 14), color: COL.fem, dx: -40, dy: -70, right: true, big: true });
        // ② fécondation
        const feco = t > 14;
        W.show(fl.sw.group, smooth(seg(t, 14, 16)));
        fl.run(W.time, { center: LP.clone().add(v3(0.5, 0.36, 0)), axis: v3(-0.9, 0, 0.3), span: 5.2, spread: 1.9, speed: 0.55, count: 90, wob: 0.06 });
        W.label('l2', '② Fécondation in vitro<small>spermatozoïdes + ovocytes</small>', LP.clone().add(v3(0.4, 0.8, -1.6)), { a: bump(t, 15, 38), color: COL.lab, dx: -10, dy: -90, big: true, right: true });
        // incubateur 37 °C + horloge 24 h
        W.show(chamber, smooth(seg(t, 18, 20)) * (1 - smooth(seg(t, 44, 47))));
        const hours = clamp(seg(t, 22, 36)) * 24; const lit = Math.floor(hours);
        clock.forEach((m, i) => { const on = i < lit; m.material.color.set(on ? COL.lab : 0x1b3a44); m.material.emissive.set(on ? COL.lab : 0x000000); m.material.emissiveIntensity = on ? 1.2 : 0; m.scale.setScalar(on ? 1.5 : 1); });
        W.label('inc', `Incubateur <b>37 °C</b><small>${String(Math.round(hours)).padStart(2, '0')} h / 24 h</small>`, LP.clone().add(v3(-2.9, 1.1, 0.6)), { a: bump(t, 19, 40), color: COL.warn, dx: -30, dy: -50, right: true, big: true });
        // fécondation de 5 ovocytes sur 6
        oos.forEach((o, i) => {
          const f = i < 5 ? easeOut(seg(t, 36 + i * 0.5, 38 + i * 0.5)) : 0;
          setPronuclei(o, f);
          const bt = seg(t, 36 + i * 0.5, 37.8 + i * 0.5); bursts[i].userData.set(bt > 0 && i < 5 ? bt : 0, o.position);
        });
        W.label('ok', 'Ovocytes fécondés<small>2 pronucléi visibles</small>', oos[1].position.clone().add(v3(0, 0.4, 0)), { a: bump(t, 38, 47), color: COL.good, dx: 40, dy: -70, big: true });
        // caméra
        const k = smooth(t / 12);
        let p, l;
        if (t < 14) { p = [LP.x + lerp(0.6, 0.3, k), lerp(8.4, 7.4, k), lerp(10.5, 9.4, k)]; l = [LP.x, LP.y + 0.5, 0]; }
        else { const q = smooth(seg(t, 14, 24)); const a = W.time * 0.05; p = [LP.x + lerp(0.3, 0.0, q) + Math.sin(a) * 0.4, lerp(7.4, 6.2, q), lerp(9.4, 8.4, q)]; l = [LP.x, LP.y + 0.2, 0]; }
        W.setCam(p, l, 40);
      },
    });
  }

  // =====================================================================
  // 10. FIV — ÉTAPE 3 : EMBRYONS, SÉLECTION, TRANSFERT
  // =====================================================================
  {
    let petri, embs = [], rings = [], straw, cathLab, cavity, cathU, eU = [], burst, tubeU, swirl;
    const EP = [[-0.95, 0.35], [0.0, 0.75], [0.95, 0.3], [0.1, -0.7]];
    const catPts = [[-0.06, -1.7, 0.0], [-0.02, -1.15, 0.0], [0.0, -0.7, 0.0], [0.0, -0.34, 0.0], [0.0, 0.02, 0.0], [0.0, 0.26, 0.0]];
    out.push({
      id: 'fiv2', dur: 54, bg: [0x063a46, 0x02080c], accent: COL.lab, shift: 0.17,
      ui: {
        side: 'left', dense: true, kicker: '08 · Fécondation in vitro (FIVETE)', title: 'Sélection et transfert<br>de l’embryon',
        items: [
          { at: 2, html: '<em>③</em> Après <b>48 h</b>, l’embryon est à <b>4 cellules</b> environ.' },
          { at: 14, html: '<b>1 ou 2 embryons</b> au développement normal sont choisis.' },
          { at: 21, html: 'Les embryons non transférés sont <b>congelés</b>.' },
          { at: 30, html: 'Dépôt dans la <b>cavité utérine</b> avec un cathéter fin et souple ; l’embryon doit s’implanter (<b>nidation</b>).' },
          { at: 44, html: '<b>GPA interdite</b> en France : l’embryon est implanté chez la femme du couple.', cls: 'warnli' },
        ],
        stats: [
          { at: 40, v: 18000, pre: '> ', label: 'naissances par an en France', color: COL.lab },
          { at: 41.5, v: 20, pre: '≈ ', suf: ' %', label: 'de taux de réussite', color: COL.warn },
        ],
        src: 'Document 6 · FIV et transfert d’embryon',
      },
      narration: 'Après 48 heures, le zygote s’est divisé en environ quatre cellules. Un ou deux embryons au développement normal sont choisis et déposés dans la cavité utérine à l’aide d’un cathéter fin et souple ; les autres sont congelés. Plus de 18 000 enfants naissent chaque année en France par FIVETE, avec un taux de réussite d’environ 20 %. La gestation pour autrui reste interdite.',
      init(W) {
        petri = W.add(makePetri(2.1)); petri.position.copy(LP);
        EP.forEach((p, i) => {
          const e = W.add(makeEmbryo(0.42)); e.userData.home = p; embs.push(e);
          const r = glowShell(0.58, i === 3 ? COL.bad : COL.good, 2.2, 1.3); r.visible = false; e.add(r); rings.push(r);
        });
        straw = W.add(makeStraw(1.2, 0xffd27a)); straw.position.copy(LP).add(v3(2.0, 1.3, 0.5)); straw.rotation.z = 0.35;
        cathLab = W.add(new THREE.Group());
        const ct = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 4.2, 14), new THREE.MeshPhysicalMaterial({ color: 0x7de8ff, transparent: true, opacity: 0.7, roughness: 0.15, clearcoat: 1, emissive: 0x7de8ff, emissiveIntensity: 0.25 })); ct.rotation.z = Math.PI / 2 - 0.25; ct.position.x = 2.1; cathLab.add(ct);
        cavity = W.add(makeCavity()); cavity.position.copy(ST.F);
        cathU = W.add(makeCatheter(catPts.map(wl), 0.03));
        for (let i = 0; i < 2; i++) eU.push(W.add(makeEmbryo(0.1)));
        burst = makeBurst(W, 0xbff0ff, 0.5);
      },
      update(W, t) {
        const lab = 1 - smooth(seg(t, 27.5, 29.5));
        const camLab = t < 28;
        W.show(W.platL, lab); W.show(petri, lab);
        // --- laboratoire : division des embryons
        const prog = seg(t, 2.5, 13);
        embs.forEach((e, i) => {
          const home = e.userData.home; W.show(e, lab);
          const p = i === 3 ? Math.min(prog * 2, 0.75) : (i === 2 ? prog * 2.0 : prog * 2.0);
          setEmbryoProgress(e, Math.min(2, p));
          e.position.set(LP.x + home[0], LP.y + 0.32, LP.z + home[1]); e.rotation.y = W.time * 0.2 + i;
          if (i === 3) { e.userData.cells.forEach((c) => { c.material = c.material.userData.dark || (c.material.userData.dark = Object.assign(c.material.clone(), { color: new THREE.Color(0xb9a79a), emissive: new THREE.Color(0x2b1a10) })); }); }
        });
        const hours = lerp(24, 48, easeInOut(prog));
        W.label('hrs', `<b>${Math.round(hours)} h</b><small>${prog < 0.3 ? 'zygote' : (prog < 0.7 ? '2 cellules' : '4 cellules')}</small>`, LP.clone().add(v3(0, 1.6, 0)), { a: bump(t, 2.5, 14), color: COL.lab, dx: 0, dy: -50, big: true });
        // --- sélection
        const sel = bump(t, 14, 27, 0.5, 0.8);
        rings.forEach((r, i) => { r.visible = sel > 0.05 && i !== 2; r.material.uniforms.uA.value = sel * (0.7 + 0.3 * Math.sin(W.time * 5)); });
        W.label('ok', '✓ Normal<small>choisi pour le transfert</small>', embs[0].position.clone().add(v3(0, 0.5, 0)), { a: bump(t, 14.5, 26), color: COL.good, dx: -30, dy: -60, right: true });
        W.label('ok2', '✓ Normal', embs[1].position.clone().add(v3(0, 0.5, 0)), { a: bump(t, 15, 26), color: COL.good, dx: 20, dy: -60 });
        W.label('ko', 'Développement anormal', embs[3].position.clone().add(v3(0, 0.3, 0.2)), { a: bump(t, 16, 26), color: COL.bad, dx: 50, dy: 60 });
        // embryon n°3 : congelé dans une paillette
        W.show(straw, bump(t, 17, 28, 0.6, 0.6));
        const fz = easeInOut(seg(t, 19, 23));
        if (fz > 0 && fz < 1) { const e = embs[2]; e.position.lerp(straw.position, fz); e.scale.setScalar(1 - 0.7 * fz); } else if (fz >= 1) { embs[2].scale.setScalar(0.3); embs[2].position.copy(straw.position); } else embs[2].scale.setScalar(1);
        W.label('frz', 'Congelé<small>embryons non transférés</small>', straw.position.clone().add(v3(0, 0.7, 0)), { a: bump(t, 21, 27), color: COL.mal, dx: 20, dy: -50, big: true });
        // cathéter de laboratoire qui aspire les 2 embryons choisis
        W.show(cathLab, bump(t, 23.5, 29, 0.6, 0.8));
        const cx = lerp(LP.x + 4.4, LP.x + 0.1, easeInOut(seg(t, 23.5, 26)));
        cathLab.position.set(cx - 2.1, LP.y + 0.38, LP.z + 0.2);
        if (t > 25.5) { [0, 1].forEach((i) => { const e = embs[i]; const f = easeInOut(seg(t, 25.5 + i * 0.4, 27.2 + i * 0.4)); e.position.lerp(v3(cx + 0.1 + i * 0.25, LP.y + 0.38, LP.z + 0.2), f); e.scale.setScalar(1 - 0.55 * f); }); }
        else { embs[0].scale.setScalar(1); embs[1].scale.setScalar(1); }
        // --- transfert dans l'utérus
        const up = smooth(seg(t, 29, 31)) * (1 - smooth(seg(t, 52, 54)));
        W.show(W.U, up); W.show(W.platF, up); W.show(cavity, up); W.ghostUterus(0.82 * up);
        const adv = easeInOut(seg(t, 31.5, 36)); setCatheter(cathU, adv); W.show(cathU, bump(t, 31, 44, 0.4, 1.0));
        const tipP = cathU.userData.curve.getPointAt(0.999);
        const emb2 = (i) => { // 2 embryons : dans le cathéter, puis libérés et dérivant vers le fond de l'utérus (nidation)
          const e = eU[i]; W.show(e, up * (t > 31.5 ? 1 : 0));
          const inCath = cathU.userData.curve.getPointAt(clamp(adv - 0.06 - i * 0.05, 0, 1));
          const rel = easeInOut(seg(t, 36.5 + i * 0.6, 40 + i * 0.6)); const nid = easeInOut(seg(t, 40.5, 44));
          const dest = wl([0.12 + i * 0.12, 0.36 - i * 0.04, 0.05]);
          e.position.copy(inCath); if (rel > 0) { e.position.copy(tipP.clone().add(v3(0, 0.0, 0))).lerp(dest, rel); }
          e.scale.setScalar(1 + nid * 0.4);
          setEmbryoProgress(e, 2 + nid * 1);
        };
        emb2(0); emb2(1);
        burst.userData.set(seg(t, 43.5, 45.5), wl([0.18, 0.36, 0.05]));
        W.label('tr', 'Transfert<small>cathéter fin et souple</small>', cathU.userData.curve.getPointAt(0.45), { a: bump(t, 32, 40), color: COL.lab, dx: -60, dy: 40, right: true, big: true });
        W.label('nid', 'Nidation<small>implantation de l’embryon</small>', wl([0.2, 0.42, 0.1]), { a: bump(t, 43, 53), color: COL.good, dx: 70, dy: -60, big: true });
        // --- caméra
        let p, l;
        if (t < 28.5) { const k = smooth(t / 10); p = [LP.x + lerp(0.4, 0.4, k), lerp(5.0, 3.8, k), lerp(6.8, 5.6, k)]; l = [LP.x + 0.2, LP.y + 0.2, 0]; }
        else if (t < 33) { const k = smooth(seg(t, 28.5, 33)); p = [lerp(LP.x + 0.4, ST.F.x, k), lerp(3.8, 0.5, k), lerp(5.6, 5.2, k)]; l = [lerp(LP.x + 0.2, ST.F.x, k), lerp(LP.y + 0.2, 0.1, k), 0]; }
        else { const k = smooth(seg(t, 36, 44)); p = [ST.F.x + lerp(0, 0.3, k), lerp(0.5, 0.9, k), lerp(5.2, 3.4, k)]; l = [ST.F.x + lerp(0, 0.12, k), lerp(0.1, 0.3, k), 0]; }
        W.setCam(p, l, 40);
      },
    });
  }

  // =====================================================================
  // 11. ICSI
  // =====================================================================
  {
    const OC = ST.L.clone().add(v3(0, 0.4, -9));
    let oo, hold, needle, sp, drop, burst, dropFl;
    out.push({
      id: 'icsi', dur: 44, bg: [0x0c2a30, 0x02070a], accent: COL.lab, shift: 0.17, scope: false,
      ui: {
        side: 'left', kicker: '09 · ICSI', title: 'Un seul spermatozoïde,<br>injecté dans l’ovocyte',
        items: [
          { at: 1.5, html: '<b>ICSI</b> : un spermatozoïde est <em>injecté</em> directement dans l’ovocyte.' },
          { at: 6, html: 'Réalisée avec un <b>microscope spécialement équipé</b> et des micropipettes.' },
          { at: 14, html: 'Technique <b>très utilisée</b> en FIV.' },
          { at: 32, html: 'Particulièrement utile quand les spermatozoïdes sont <b>peu nombreux, peu mobiles ou anormaux</b>.', cls: 'warnli' },
        ],
        src: 'Document 6 · FIV et ICSI',
      },
      narration: 'Dans l’ICSI, une technique très utilisée, un seul spermatozoïde est sélectionné puis injecté directement dans l’ovocyte, grâce à un microscope spécialement équipé. Une pipette maintient l’ovocyte, une fine aiguille y dépose le spermatozoïde. Cette méthode est précieuse quand les spermatozoïdes sont peu nombreux, peu mobiles ou anormaux.',
      init(W) {
        oo = W.add(makeOocyte(1.35)); oo.position.copy(OC);
        hold = W.add(makePipette(0.14, 0.4, 4.6, true)); hold.rotation.z = Math.PI / 2;
        needle = W.add(makePipette(0.11, 0.3, 5.4, true)); needle.rotation.z = -Math.PI / 2;
        for (const pp of [hold, needle]) pp.traverse((o) => { if (o.material) { o.material.depthTest = false; o.renderOrder = 6; if (o.material.color) o.material.color.set(0xbfe9ff); } });
        sp = new Swarm(S, 1, { amp: 0, emissive: 0x2a5a9a }); W.add(sp.group);
        sp.mat.depthTest = false; sp.mesh.renderOrder = 8;
        dropFl = makeFlock(W, 12, { scale: 0.5, seed: 31 });
        drop = W.add(new THREE.Mesh(new THREE.SphereGeometry(1.7, 40, 28), new THREE.MeshPhysicalMaterial({ color: 0xa8dcff, transparent: true, opacity: 0.1, roughness: 0.05, clearcoat: 1, depthWrite: false })));
        burst = makeBurst(W, 0xbff0ff, 1.0);
      },
      update(W, t) {
        document.body.classList.toggle('scope', t > 1);
        W.show(oo, 1); oo.rotation.y = 0.0; oo.rotation.z = 0.0; oo.rotation.x = 0.0;
        oo.position.y = OC.y + Math.sin(W.time * 0.6) * 0.02;
        // pipette de maintien (gauche) : vient se coller à l'ovocyte
        const hg = easeInOut(seg(t, 2, 5.5)); W.show(hold, 1);
        hold.position.set(OC.x - 1.35 - 0.06 - lerp(2.6, 0, hg), OC.y, OC.z);
        // gouttelette de spermatozoïdes en bas à droite
        const dropC = OC.clone().add(v3(4.6, -2.2, 0));
        W.show(drop, bump(t, 3, 12, 0.8, 0.8)); drop.position.copy(dropC);
        W.show(dropFl.sw.group, bump(t, 3, 11, 0.8, 0.5));
        dropFl.run(W.time, { center: dropC.clone().add(v3(0, 0, 0)), axis: v3(1, 0.3, 0), span: 2.8, spread: 0.7, speed: 0.5, count: 12, wob: 0.1 });
        W.label('sel', 'Spermatozoïde sélectionné<small>mobile, bien formé</small>', dropC.clone().add(v3(0, 1.2, 0.5)), { a: bump(t, 4.5, 10), color: COL.good, dx: -20, dy: -50, right: true });
        // aiguille d'injection (droite) : prélève un spermatozoïde puis s'approche
        const tipDrop = dropC.clone().add(v3(-0.75, 0.1, 0));
        const tipSafe = OC.clone().add(v3(3.2, 0, 0));
        const tipIn = OC.clone().add(v3(0.35, 0, 0));
        const tip = new V3();
        if (t < 8) tip.lerpVectors(OC.clone().add(v3(8, -2.2, 0)), tipDrop, easeInOut(seg(t, 5, 8)));
        else if (t < 13) tip.lerpVectors(tipDrop, tipSafe, easeInOut(seg(t, 9, 13)));
        else if (t < 21) tip.lerpVectors(tipSafe, tipIn, easeInOut(seg(t, 14, 19)));
        else tip.lerpVectors(tipIn, tipSafe.clone().add(v3(1.5, 0, 0)), easeInOut(seg(t, 23.5, 27)));
        W.show(needle, 1); needle.position.copy(tip);
        // spermatozoïde : nage -> aspiré dans l'aiguille -> injecté
        W.show(sp.group, 1);
        let sp_pos = new V3(), sp_dir = v3(-1, 0, 0), sp_sc = 1.15;
        if (t < 8.4) { sp_pos.copy(dropC).add(v3(-0.1 + Math.sin(W.time * 1.1) * 0.15, 0.1, 0)); sp_dir = v3(-1, 0.2 * Math.sin(W.time), 0); sp.mat.userData.U.uAmp.value = 1; }
        else { sp.mat.userData.U.uAmp.value = 0; const inN = tip.clone().add(v3(0.75, 0, 0)); sp_pos.copy(inN); }
        if (t > 19.2) { const f = easeInOut(seg(t, 19.4, 23)); const dest = OC.clone().add(v3(-0.1, 0, 0.0)); sp_pos.lerpVectors(tipIn.clone().add(v3(0.75, 0, 0)), dest, f); if (f >= 1 || t > 23.2) { sp.mat.userData.U.uAmp.value = 0.15; } if (f > 0 && t > 23.4) sp_pos.copy(dest); }
        sp.set(0, sp_pos, sp_dir, sp_sc); sp.commit(W.time);
        W.label('inj', 'Micropipette d’injection', tipSafe.clone().add(v3(1.6, 0.35, 0)), { a: bump(t, 13, 24), color: COL.lab, dx: 40, dy: -50 });
        W.label('hold', 'Pipette de maintien', hold.position.clone().add(v3(-1.2, -0.05, 0)), { a: bump(t, 5.5, 20), color: COL.mal, dx: 10, dy: 60 });
        W.label('pen', 'Injection', tipIn.clone().add(v3(0, 0.9, 0.2)), { a: bump(t, 18, 24), color: COL.warn, dx: 30, dy: -60, big: true });
        // fécondation
        burst.userData.set(seg(t, 24.5, 27.5), OC.clone());
        setPronuclei(oo, easeOut(seg(t, 25.5, 28.5)));
        W.label('fec', 'Fécondation<small>2 pronucléi</small>', OC.clone().add(v3(0, 1.45, 0.2)), { a: bump(t, 27, 44), color: COL.good, dx: 30, dy: -50, big: true });
        // caméra : gros plan "microscope"
        W.camKeys(t, [[0, [OC.x + 1.0, OC.y + 0.6, OC.z + 12.5], [OC.x + 0.4, OC.y, OC.z], 40], [5, [OC.x + 2.2, OC.y - 0.6, OC.z + 12.5], [OC.x + 2.2, OC.y - 1.0, OC.z], 40], [13, [OC.x + 2.2, OC.y - 0.6, OC.z + 12.5], [OC.x + 2.2, OC.y - 1.0, OC.z], 40], [16, [OC.x + 0.8, OC.y, OC.z + 9.0], [OC.x + 0.8, OC.y - 0.1, OC.z], 40], [30, [OC.x + 0.5, OC.y, OC.z + 8.4], [OC.x + 0.4, OC.y - 0.1, OC.z], 40], [44, [OC.x + 0.5, OC.y, OC.z + 8.4], [OC.x + 0.4, OC.y - 0.1, OC.z], 40]]);
      },
    });
  }

  // =====================================================================
  // 12. CADRE LÉGISLATIF
  // =====================================================================
  {
    let nodes = [], line, stream, curve, hero;
    const EV = [
      { y: '1982', c: 0xb9c6ff, a: 3, txt: 'Naissance d’Amandine,<small>1er « bébé-éprouvette » français</small>' },
      { y: '1994', c: COL.mal, a: 6.5, txt: 'Premières lois de bioéthique<small>la PMA est encadrée</small>' },
      { y: '2004', c: COL.mix, a: 10, txt: 'Révision de la loi<small>2004</small>' },
      { y: '2011', c: COL.mix, a: 12.5, txt: 'Nouvelle révision<small>2011</small>' },
      { y: '2021', c: COL.fem, a: 16, txt: 'Loi du 2 août 2021<small>PMA pour toutes les femmes</small>' },
      { y: '2022', c: COL.lab, a: 24, txt: 'Accès aux origines<small>1<sup>er</sup> sept. 2022</small>' },
    ];
    const pos = (i) => v3(HUB.x - 3.4 + i * 1.36, 0.5 + Math.sin(i * 0.9) * 0.45, 0);
    out.push({
      id: 'loi', dur: 50, bg: [0x251150, 0x06030f], accent: COL.mix, shift: 0.18,
      ui: {
        side: 'left', dense: true, kicker: '10 · Cadre légal en France', title: 'Pour qui ? Depuis quand ?<br>Qui paie ?',
        items: [
          { at: 16.5, html: '<b>À qui ?</b> Depuis la loi du <em>2 août 2021</em> : couples femme-homme, <b>couples de femmes</b>, <b>femmes seules</b>.' },
          { at: 21, html: '<b>Conditions</b> : être en âge de procréer — femme jusqu’à 45 ans, homme jusqu’à 60 ans ; consentement.' },
          { at: 27, html: '<b>Remboursée ?</b> Oui : prise en charge à <em>100 %</em> par l’Assurance maladie (jusqu’à 6 inséminations et 4 FIV).' },
          { at: 33, html: '<b>Dons</b> gratuits et volontaires ; accès aux origines pour les enfants nés d’un don.' },
          { at: 38, html: '<b>Interdits</b> : GPA (mère porteuse), PMA après décès.', cls: 'warnli' },
        ],
        src: 'Loi n° 2021-1017 du 2 août 2021 · Agence de la biomédecine · Assurance maladie',
      },
      narration: 'Le cadre légal a évolué avec les lois de bioéthique de 1994, 2004, 2011, et surtout 2021 : depuis la loi du 2 août 2021, la PMA est ouverte à toutes les femmes, en couple avec un homme ou une femme, ou seules. Elle est prise en charge à 100 % par l’Assurance maladie, dans la limite de six inséminations et quatre FIV. Les dons restent gratuits et volontaires, avec un accès aux origines ; la gestation pour autrui reste interdite.',
      init(W) {
        curve = new THREE.CatmullRomCurve3(EV.map((e, i) => pos(i)));
        line = W.add(new THREE.Mesh(new THREE.TubeGeometry(curve, 120, 0.022, 8, false), new THREE.MeshBasicMaterial({ color: 0x8e86ff, transparent: true, opacity: 0.6 })));
        EV.forEach((e, i) => {
          const o = new THREE.Mesh(new THREE.SphereGeometry(0.2, 28, 20), new THREE.MeshStandardMaterial({ color: e.c, emissive: e.c, emissiveIntensity: 0.9, roughness: 0.3 }));
          o.add(glowShell(0.3, e.c, 2.2, 1.2)); o.position.copy(pos(i)); nodes.push(W.add(o));
        });
        stream = W.add(makeStream(curve, 80, 0xcfc4ff, 0.14));
      },
      update(W, t) {
        W.show(W.U, 1); W.show(W.M, 1); W.show(W.platF, 1); W.show(W.platM, 1);
        W.show(line, 1); W.show(stream, 1); stream.userData.update(W.time, 1, 0.12);
        line.material.opacity = 0.3 + 0.3 * smooth(t / 20);
        nodes.forEach((o, i) => {
          const e = EV[i]; const on = easeBack(seg(t, e.a - 0.8, e.a + 0.4));
          const hero = i === 4 ? 1 + 0.5 * bump(t, 16, 34, 0.6, 3) + 0.08 * Math.sin(W.time * 3) : 1;
          W.show(o, on > 0.01 ? 1 : 0); o.scale.setScalar(Math.max(0.001, on) * hero);
          const show = bump(t, e.a, i === 5 ? 50 : e.a + 7.5, 0.5, 0.6) ;
          W.label('ev' + i, `<b>${e.y}</b> · ${e.txt}`, pos(i), { a: i === 4 ? Math.max(show, bump(t, 16, 50, 0.5, 0.5)) : (i === 5 ? bump(t, 24, 50, 0.5, 0.5) : show), color: e.c, dx: i === 4 ? -30 : (i === 5 ? -20 : 20), dy: i === 4 ? 100 : (i === 5 ? -90 : (i % 2 ? -80 : 80)), right: i >= 4, big: i === 4 });
        });
        // les deux modèles aux extrémités s'illuminent selon "à qui"
        const k = 0.45 + 0.25 * Math.sin(W.time * 3);
        if (t > 17 && t < 33) { W.hiUterus({ 0: [COL.fem, 0.25 * k], 1: [COL.fem, 0.25 * k], 2: [COL.fem, 0.25 * k], 3: [COL.fem, 0.25 * k], 4: [COL.fem, 0.25 * k], 5: [COL.fem, 0.3 * k], 6: [COL.fem, 0.25 * k], 7: [COL.fem, 0.25 * k] }); }
        W.label('qui', 'Toutes les femmes<small>en couple ou seules</small>', ST.F.clone().add(v3(0, 1.4, 0.3)), { a: bump(t, 17, 26), color: COL.fem, dx: 30, dy: -50, big: true });
        W.label('rem', '100 % remboursé<small>Assurance maladie</small>', HUB.clone().add(v3(0, 2.6, 0)), { a: bump(t, 27.5, 36), color: COL.good, dx: 0, dy: -30, big: true });
        W.label('gpa', '✕ GPA interdite', ST.M.clone().add(v3(0, 2.1, 0.3)), { a: bump(t, 38, 48), color: COL.bad, dx: -30, dy: -40, right: true, big: true });
        const c = smooth(t / 10);
        W.setCam([HUB.x, lerp(2.4, 1.4, c), lerp(20, 17.4, c)], [HUB.x, 0.5, 0], 40);
      },
    });
  }

  // =====================================================================
  // 13. BILAN
  // =====================================================================
  {
    let dewar2, petriB, barA, barB, bars, fl1, fl2, hub;
    const BAR_X = [HUB.x - 0.9, HUB.x + 0.9];
    out.push({
      id: 'bilan', dur: 50, bg: [0x1a1448, 0x04060f], accent: COL.lab, shift: 0.18,
      ui: {
        side: 'left', dense: true, kicker: 'Bilan', title: 'À chaque cause,<br>sa technique',
        items: [
          { at: 3, html: '<span style="color:#ff5d8f">●</span> <b>Troubles de l’ovulation</b> → <em>stimulation hormonale</em> (± insémination)', cls: 'plain' },
          { at: 9, html: '<span style="color:#4db8ff">●</span> <b>Spermatozoïdes peu nombreux, peu mobiles</b> → <em>insémination</em>, <em>FIV</em>, <em>ICSI</em>', cls: 'plain' },
          { at: 16, html: '<span style="color:#a98bff">●</span> <b>Trompes obstruées</b> → <em>FIV</em> (la fécondation se fait hors des trompes)', cls: 'plain' },
          { at: 22, html: '<span style="color:#37e0c0">●</span> <b>Absence de gamètes</b> → <em>don</em> de sperme ou d’ovocytes', cls: 'plain' },
          { at: 30, html: 'Un cadre <b>légal et éthique</b> : toutes les femmes, remboursement, pas de GPA.', cls: 'plain' },
        ],
        stats: [
          { at: 36, v: 12, suf: ' %', label: 'succès / insémination', color: COL.fem },
          { at: 37.5, v: 20, pre: '≈ ', suf: ' %', label: 'succès / FIVETE', color: COL.lab },
        ],
        src: 'Synthèse · Documents 1 et 6',
      },
      narration: 'Pour résumer : un trouble de l’ovulation se traite par stimulation hormonale ; des spermatozoïdes peu nombreux ou peu mobiles par insémination, FIV ou ICSI ; des trompes obstruées par une FIV ; l’absence de gamètes par un don. Les taux de réussite sont d’environ 12 % par insémination et 20 % par FIVETE, dans un cadre légal et éthique précis. La PMA aide la nature, elle ne la remplace pas.',
      init(W) {
        dewar2 = W.add(makeDewar()); dewar2.position.copy(HUB).add(v3(-3.4, -1.0, 2.2)); dewar2.scale.setScalar(0.5);
        petriB = W.add(makePetri(1.1)); petriB.position.copy(HUB).add(v3(3.4, -0.9, 2.4));
        fl1 = makeFlock(W, 40, { scale: 0.26, seed: 41 }); fl2 = makeFlock(W, 40, { scale: 0.26, seed: 42 });
        barA = W.add(makeBar(COL.fem, 0.8, 0.8)); barB = W.add(makeBar(COL.lab, 0.8, 0.8));
        barA.position.set(HUB.x - 0.8, -1.0, 2.4); barB.position.set(HUB.x + 0.8, -1.0, 2.4);
      },
      update(W, t) {
        W.show(W.U, 1); W.show(W.M, 1); W.show(W.platF, 1); W.show(W.platM, 1);
        W.show(dewar2, 1); W.show(petriB, 1);
        W.show(fl1.sw.group, 1); W.show(fl2.sw.group, 1);
        // flux de gamètes qui relient les trois stations
        fl1.run(W.time, { center: v3(HUB.x, 1.2, -0.5), axis: v3(-1, 0, 0), span: 9, spread: 1.3, speed: 1.0 });
        fl2.run(W.time, { center: v3(HUB.x, -0.2, 1.4), axis: v3(1, 0, 0), span: 9, spread: 0.9, speed: 0.9 });
        const k = 0.45 + 0.25 * Math.sin(W.time * 3);
        const A = bump(t, 3, 9), B = bump(t, 9, 16), C = bump(t, 16, 22), D = bump(t, 22, 30);
        if (A > 0) W.hiUterus({ 1: [COL.fem, 0.8 * A * k], 2: [COL.fem, 0.8 * A * k] }, 0.4 * A);
        if (C > 0) W.hiUterus({ 3: [COL.mix, 0.9 * C * k], 4: [COL.mix, 0.9 * C * k] }, 0.4 * C);
        if (B > 0) W.hiMale(['testis', 'vas'], COL.mal, 0.9 * B * k, 0.4 * B);
        W.label('t1', 'Stimulation hormonale', ST.F.clone().add(v3(-0.9, 0.7, 0.3)), { a: A, color: COL.fem, dx: 40, dy: -80, big: true });
        W.label('t2', 'Insémination · FIV · ICSI', partPos(W, 'testis'), { a: B, color: COL.mal, dx: -40, dy: 60, big: true, right: true });
        W.label('t3', 'FIV', ST.F.clone().add(v3(0.7, 0.8, 0.3)), { a: C, color: COL.mix, dx: 60, dy: -60, big: true });
        W.label('t4', 'Dons de gamètes', dewar2.position.clone().add(v3(0, 1.4, 0)), { a: D, color: COL.lab, dx: 0, dy: -40, big: true });
        // histogramme des taux de réussite
        const g = easeOut(seg(t, 34, 38));
        W.show(barA, g); W.show(barB, g);
        barA.scale.y = Math.max(0.001, 12 * 0.1 * g); barB.scale.y = Math.max(0.001, 20 * 0.1 * g);
        W.label('b1', '12 %<small>insémination</small>', barA.position.clone().add(v3(0, 1.2 * g + 0.15, 0)), { a: g, color: COL.fem, dx: -10, dy: -40, right: true, big: true });
        W.label('b2', '≈ 20 %<small>FIVETE</small>', barB.position.clone().add(v3(0, 2.0 * g + 0.15, 0)), { a: g, color: COL.lab, dx: 10, dy: -40, big: true });
        W.label('end', 'La PMA aide la nature, dans un cadre légal et éthique', HUB.clone().add(v3(3.2, 4.4, 0)), { a: bump(t, 42, 50, 1.2, 0.4), color: COL.lab, dx: 0, dy: 0, big: true, right: true });
        // caméra : plan large sur les 3 stations
        const c = smooth(t / 10);
        W.setCam([HUB.x + Math.sin(W.time * 0.12) * 0.8, lerp(1.6, 2.0, c), lerp(14.5, 17.4, c)], [HUB.x, 0.2, 0], 40);
      },
    });
  }
  return out;
}
