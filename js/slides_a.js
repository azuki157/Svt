// Slides 1 à 4 : titre, définitions, répartition des causes, causes féminines.
import * as THREE from 'three';
import { makeOocyte, makeStream, makeDonut, makeFollicle, makePathogen, makePlug, glowShell } from './props.js';
import { makeFlock, makeBurst, bump, uPos, TUBE_L, TUBE_R, OV_L, OV_R, v3 } from './kit.js';
import { clamp, lerp, smooth, seg, easeOut, easeBack, easeInOut } from './util.js';

const V3 = THREE.Vector3;

export function slidesA(W) {
  const { S, COL, ST } = W;
  const out = [];
  const HUB = new V3(5.5, 0, 0);
  const ALL = ['testis', 'vas', 'vesicles', 'prostate', 'bladder', 'penis', 'vessels'];
  const allU = (c, k) => ({ 0: [c, k], 1: [c, k], 2: [c, k], 3: [c, k], 4: [c, k], 5: [c, k], 6: [c, k], 7: [c, k] });

  // =====================================================================
  // 1. TITRE
  // =====================================================================
  {
    let fl;
    out.push({
      id: 'titre', dur: 24, bg: [0x1c1448, 0x05060f], accent: COL.fem, shift: 0.17,
      ui: {
        side: 'left', kicker: 'SVT · Sujet 4', title: 'La PMA :<br>quand la nature a besoin d’aide',
        items: [
          { at: 1.6, html: '<b>Pourquoi</b> certains couples n’arrivent-ils pas à avoir d’enfant ?' },
          { at: 4.2, html: '<b>Comment</b> la médecine peut-elle les aider ?' },
          { at: 7.5, html: '<em>①</em> Identifier les causes d’infertilité et de stérilité', cls: 'plain' },
          { at: 9.5, html: '<em>②</em> Relever les techniques d’assistance médicale à la procréation', cls: 'plain' },
          { at: 11.5, html: '<em>③</em> Préciser le cadre légal : pour qui ? depuis quand ? remboursée ?', cls: 'plain' },
        ],
        src: 'Procréation médicalement assistée · infertilité · stérilité',
      },
      narration: 'Faire un enfant semble naturel… et pourtant, de nombreux couples rencontrent des difficultés pour concevoir. Pourquoi la fécondation échoue-t-elle parfois ? Et comment la médecine peut-elle aider ? Voyageons ensemble au cœur de l’appareil reproducteur pour le comprendre.',
      init(W) { fl = makeFlock(W, 70, { scale: 0.28, seed: 3 }); },
      update(W, t) {
        W.show(W.U, 1); W.show(W.platF, 1); W.show(fl.sw.group, 1);
        const a = lerp(-0.6, 0.55, smooth(t / 24)), r = lerp(7.2, 6.0, smooth(t / 24)), h = lerp(1.2, 0.2, smooth(t / 24));
        W.setCam([Math.sin(a) * r, h, Math.cos(a) * r], [0, 0.05, 0], 40);
        fl.run(W.time, { center: v3(3.4, 0.3, 0.8), axis: v3(-1, -0.05, -0.1), span: 13, spread: 2.6, speed: 1.1 });
        W.hiUterus(allU(COL.fem, 0.1 + 0.07 * Math.sin(W.time * 1.6)));
      },
    });
  }

  // =====================================================================
  // 2. DÉFINITIONS
  // =====================================================================
  {
    let oo, ring, ringMats = [], fl, barrier, diag, orbs = [], seg1, seg2;
    const C = HUB.clone().add(v3(0, 0.1, 0));
    out.push({
      id: 'definitions', dur: 40, bg: [0x241046, 0x07040f], accent: COL.warn, shift: 0.17,
      ui: {
        side: 'left', kicker: '01 · Définitions', title: 'Fertilité, infertilité,<br>stérilité',
        items: [
          { at: 1.2, html: '<b>Fertilité</b> : capacité d’un couple à concevoir un enfant naturellement.' },
          { at: 4.5, html: '<em>Infertilité</em> : pas de grossesse après <b>2 ans</b> de rapports fréquents, sans contraception.' },
          { at: 17, html: '<em>Stérilité</em> : grossesse considérée comme <b>naturellement impossible</b>.', cls: 'warnli' },
          { at: 25, html: '<b>Contraception</b> : moyens qui évitent la <b>fécondation</b>.' },
          { at: 28, html: '<b>Contragestion</b> : contrôle des naissances <b>après</b> la fécondation.' },
          { at: 33, html: 'La PMA fait l’inverse : elle <b>aide</b> à obtenir une fécondation.', cls: 'plain' },
        ],
        src: 'Document 1 · Document 6',
      },
      narration: 'Un couple est dit infertile quand il n’arrive pas à avoir d’enfant malgré des rapports fréquents, sans contraception, pendant deux ans. La stérilité, elle, signifie qu’une grossesse est naturellement impossible. À ne pas confondre avec la contraception, qui évite la fécondation, et la contragestion, qui agit après elle : la PMA, au contraire, aide à obtenir une fécondation.',
      init(W) {
        oo = W.add(makeOocyte(1.15, { corona: true })); oo.position.copy(C);
        ring = W.add(new THREE.Group()); ring.position.copy(C);
        for (let i = 0; i < 24; i++) {
          const a = Math.PI / 2 - (i / 24) * Math.PI * 2;
          const m = new THREE.Mesh(new THREE.SphereGeometry(0.1, 16, 12), new THREE.MeshStandardMaterial({ color: 0x39406a, emissive: 0x000000, roughness: 0.4 }));
          m.position.set(Math.cos(a) * 2.15, Math.sin(a) * 2.15, 0); ring.add(m); ringMats.push(m);
        }
        fl = makeFlock(W, 50, { scale: 0.3, seed: 8 });
        barrier = W.add(new THREE.Group()); barrier.position.copy(C).add(v3(2.7, 0, 0));
        const pane = new THREE.Mesh(new THREE.BoxGeometry(0.07, 3.6, 3.6), new THREE.MeshPhysicalMaterial({ color: 0xff4d5e, transparent: true, opacity: 0.22, emissive: 0xff2038, emissiveIntensity: 0.5, roughness: 0.2, depthWrite: false }));
        barrier.add(pane);
        for (const s of [1, -1]) { const b = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.12, 4.4), new THREE.MeshBasicMaterial({ color: 0xff4d5e })); b.rotation.x = s * Math.PI / 4; barrier.add(b); }
        // schéma "rapport → fécondation → nidation" (contraception / contragestion)
        diag = W.add(new THREE.Group()); diag.position.copy(C).add(v3(0, -2.5, 0.2));
        const mk = (x, c) => { const o = new THREE.Mesh(new THREE.SphereGeometry(0.2, 24, 18), new THREE.MeshStandardMaterial({ color: c, emissive: c, emissiveIntensity: 0.7 })); o.position.x = x; diag.add(o); return o; };
        orbs = [mk(-3.2, 0xb9c6ff), mk(0, COL.lab), mk(3.2, COL.warn)];
        const lineMat = (c) => new THREE.MeshBasicMaterial({ color: c });
        const l1 = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.035, 3.0, 8), lineMat(COL.mal)); l1.rotation.z = Math.PI / 2; l1.position.x = -1.6; diag.add(l1);
        const l2 = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.035, 3.0, 8), lineMat(COL.warn)); l2.rotation.z = Math.PI / 2; l2.position.x = 1.6; diag.add(l2);
      },
      update(W, t) {
        // objets visibles selon la phase
        const ph1 = t < 23.5;
        W.show(oo, 1); W.show(ring, ph1 && t > 3.5 ? 1 : 0); W.show(fl.sw.group, ph1 ? 1 : 0);
        W.show(barrier, t > 17 && ph1 ? 1 : 0); W.show(diag, t > 24 ? 1 : 0);
        oo.rotation.y = W.time * 0.25; oo.position.y = C.y + Math.sin(W.time * 0.8) * 0.07;
        // anneau des 24 mois
        const m = Math.floor(clamp((t - 4.5) / 11) * 24 + 0.0001);
        ringMats.forEach((mm, i) => {
          const on = i < m, c = t > 16 ? COL.warn : COL.lab;
          mm.material.color.set(on ? c : 0x39406a); mm.material.emissive.set(on ? c : 0x000000); mm.material.emissiveIntensity = on ? 0.9 : 0;
          mm.scale.setScalar(on ? 1.35 : 1);
        });
        ring.rotation.z = 0;
        // spermatozoïdes : nagent vers l'ovocyte (bloqués par la barrière ensuite)
        const blocked = t > 18;
        fl.run(W.time, { center: C.clone().add(v3(blocked ? 5.6 : 4.7, 0, 0)), axis: v3(-1, 0, 0), span: blocked ? 5.4 : 6.6, spread: blocked ? 1.7 : 1.5, speed: 1.2, count: 50 });
        // étiquettes
        if (t > 4.5 && t < 17.5) W.label('mois', `Mois <b>${Math.max(1, Math.min(24, m + 1))}</b> / 24`, C.clone().add(v3(0, 2.15, 0)), { a: bump(t, 4.5, 17.5), color: COL.warn, dx: 40, dy: -34, big: true });
        W.label('inf', 'Infertilité<small>24 mois sans grossesse</small>', C.clone().add(v3(0, 2.15, 0)), { a: bump(t, 16, 23.5), color: COL.warn, dx: -20, dy: -44, big: true });
        W.label('ste', 'Stérilité<small>grossesse naturellement impossible</small>', C.clone().add(v3(2.7, -1.7, 0)), { a: bump(t, 18.5, 23.5), color: COL.bad, dx: -30, dy: 56, big: true, right: true });
        // schéma contraception / contragestion
        const D = diag.position;
        W.label('o1', 'Rapport', D.clone().add(v3(-3.2, 0, 0)), { a: bump(t, 24.5, 40, 0.8, 0.5), color: 0xb9c6ff, dx: 0, dy: 26 });
        W.label('o2', 'Fécondation', D.clone().add(v3(0, 0, 0)), { a: bump(t, 24.8, 40, 0.8, 0.5), color: COL.lab, dx: 0, dy: 26 });
        W.label('o3', 'Nidation', D.clone().add(v3(3.2, 0, 0)), { a: bump(t, 25, 40, 0.8, 0.5), color: COL.warn, dx: 0, dy: 26 });
        W.label('contra', 'Contraception<small>évite la fécondation</small>', D.clone().add(v3(-1.6, 0, 0)), { a: bump(t, 25.5, 40, 0.8, 0.5), color: COL.mal, dx: 0, dy: -34 });
        W.label('contrag', 'Contragestion<small>après la fécondation</small>', D.clone().add(v3(1.6, 0, 0)), { a: bump(t, 28.5, 40, 0.8, 0.5), color: COL.warn, dx: 0, dy: -34 });
        W.label('pma', 'PMA : aider cette étape', D.clone().add(v3(0, 0, 0)), { a: bump(t, 33, 40, 0.8, 0.5), color: COL.lab, dx: 0, dy: 74, big: true });
        // barrière : apparition en "pop"
        barrier.scale.setScalar(Math.max(0.001, easeBack(seg(t, 17, 18.2))));
        // caméra
        const k = smooth(t / 40);
        W.setCam([C.x + lerp(0.5, -0.3, k), lerp(0.5, -0.3, k) + (t > 24 ? 0 : 0), lerp(11.4, 10.4, k) + (t > 23.5 ? smooth(seg(t, 23.5, 27)) * 0.8 : 0)], [C.x, C.y + (t > 24 ? -smooth(seg(t, 23.5, 27)) * 0.9 : 0), C.z], 42);
      },
    });
  }

  // =====================================================================
  // 3. RÉPARTITION DES CAUSES
  // =====================================================================
  {
    let donut, stream, curve;
    const D = HUB.clone().add(v3(0, 0.9, 0));
    const SEG = [ // ordre = ordre du document (mixtes, féminines, masculines, inexpliquées)
      { n: 'Mixtes', v: 39, color: COL.mix, a: 6.0, b: 11.5 },
      { n: 'Féminines', v: 33, color: COL.fem, a: 11.5, b: 17 },
      { n: 'Masculines', v: 21, color: COL.mal, a: 17, b: 22.5 },
      { n: 'Inexpliquées', v: 7, color: COL.unk, a: 22.5, b: 28 },
    ];
    out.push({
      id: 'causes', dur: 40, bg: [0x13184a, 0x04060f], accent: COL.mix, shift: 0.17,
      ui: {
        side: 'left', kicker: '02 · Causes d’infertilité', title: 'Un problème<br><span style="color:#a98bff">de couple</span>, pas d’une personne',
        items: [
          { at: 28.5, html: 'Dans <b>93 %</b> des cas, une cause est identifiée.' },
          { at: 31, html: 'Une cause <b>masculine</b> est impliquée dans <b>60 %</b> des cas <small>(21 + 39)</small>.' },
          { at: 34, html: 'Une cause <b>féminine</b> dans <b>72 %</b> <small>(33 + 39)</small>.' },
        ],
        stats: [
          { at: 6.2, v: 39, suf: ' %', label: 'causes mixtes (les deux partenaires)', color: COL.mix },
          { at: 11.7, v: 33, suf: ' %', label: 'causes féminines', color: COL.fem },
          { at: 17.2, v: 21, suf: ' %', label: 'causes masculines', color: COL.mal },
          { at: 22.7, v: 7, suf: ' %', label: 'causes inexpliquées', color: COL.unk },
        ],
        src: 'Document 6 · Répartition des causes d’infertilité',
      },
      narration: 'Les causes d’infertilité se répartissent ainsi : 39 % sont mixtes, 33 % féminines, 21 % masculines, et 7 % restent inexpliquées. Autrement dit, une cause masculine intervient dans 60 % des cas et une cause féminine dans 72 % : l’infertilité est presque toujours l’affaire du couple.',
      init(W) {
        donut = W.add(makeDonut(SEG, { R: 1.8, r: 1.0, depth: 0.4 })); donut.position.copy(D);
        curve = new THREE.CatmullRomCurve3([ST.F.clone().add(v3(0.6, 1.0, 0.2)), v3(3.2, 3.0, 0.3), HUB.clone().add(v3(0, 3.8, 0)), v3(8.2, 3.0, 0.3), ST.M.clone().add(v3(-1.0, 1.2, 0.2))]);
        stream = W.add(makeStream(curve, 90, COL.mix, 0.2));
      },
      update(W, t) {
        W.show(W.U, 1); W.show(W.M, 1); W.show(W.platF, 1); W.show(W.platM, 1); W.show(donut, 1); W.show(stream, 0);
        donut.rotation.y = Math.sin(W.time * 0.45) * 0.3; donut.rotation.x = -0.12;
        const k = 0.45 + 0.3 * Math.sin(W.time * 4);
        donut.userData.segs.forEach((m, i) => {
          const s = SEG[i]; const grow = easeOut(seg(t, 1.0 + i * 0.7, 2.6 + i * 0.7));
          const act = bump(t, s.a, s.b, 0.4, 0.5);
          m.scale.set(grow, grow, grow);
          m.position.copy(m.userData.dir).multiplyScalar(0.34 * act);
          m.material.emissiveIntensity = 0.1 + 0.3 * act;
          m.material.opacity = 1;
          W.label('seg' + i, `${s.n}<small>${s.v} %</small>`, D.clone().add(m.userData.dir.clone().multiplyScalar(1.45 + 0.34 * act)), { a: grow * (t > 28 ? 0.9 : 1), color: s.color, dx: m.userData.dir.x * 60, dy: -m.userData.dir.y * 44, right: m.userData.dir.x < 0 });
        });
        // modèles : s'illuminent selon la part active
        const act = (i) => bump(t, SEG[i].a, SEG[i].b, 0.4, 0.5);
        const mixA = act(0), femA = act(1), malA = act(2), unkA = act(3);
        const uhi = {}, mhi = [];
        let uc = COL.fem, uk = 0, mc = COL.mal, mk = 0;
        if (mixA > 0) { uc = COL.mix; uk = mixA * k; mc = COL.mix; mk = mixA * k; }
        if (femA > 0) { uc = COL.fem; uk = femA * k; }
        if (malA > 0) { mc = COL.mal; mk = malA * k; }
        if (unkA > 0) { uc = COL.unk; uk = unkA * (0.25 + 0.4 * Math.abs(Math.sin(W.time * 5))); mc = COL.unk; mk = uk; }
        if (uk > 0) W.hiUterus(allU(uc, uk * 0.55), 0.0);
        if (mk > 0) W.hiMale(ALL, mc, mk * 0.4, 0);
        // flux entre les deux modèles pour les causes mixtes
        W.show(stream, mixA);
        stream.userData.update(W.time, easeOut(seg(t, 6, 8)), 0.28);
        // points d'interrogation (causes inexpliquées)
        W.label('q1', '?', ST.F.clone().add(v3(0, 1.3, 0.3)), { a: unkA, color: COL.unk, dx: 0, dy: -40, big: true });
        W.label('q2', '?', ST.M.clone().add(v3(0, 1.9, 0.3)), { a: unkA, color: COL.unk, dx: 0, dy: -40, big: true });
        const c = smooth(t / 6);
        W.setCam([HUB.x, lerp(1.4, 0.9, c), lerp(19, 14.6, c)], [HUB.x, 0.4, 0], 40);
      },
    });
  }

  // =====================================================================
  // 4. CAUSES FÉMININES
  // =====================================================================
  {
    let folR, folL, burst, ooFree, pathos = [], plug, fl, curveL;
    const wl = (p) => uPos(W, p[0], p[1], p[2]);
    out.push({
      id: 'feminin', dur: 44, bg: [0x3a0f2f, 0x08030a], accent: COL.fem, shift: 0.17,
      ui: {
        side: 'left', kicker: '03 · Causes féminines', title: 'Quand l’ovulation ou<br>le trajet est perturbé',
        items: [
          { at: 7, html: '<em>Troubles de l’ovulation</em> : maladies des ovaires, problèmes hormonaux.' },
          { at: 22, html: '<em>Obstruction des trompes</em> après des infections : l’ovocyte et les spermatozoïdes ne peuvent plus se rencontrer.' },
        ],
        stats: [
          { at: 9, v: 30, suf: ' %', label: 'des infertilités féminines : troubles de l’ovulation', color: COL.warn },
          { at: 24, v: 26, suf: ' %', label: 'obstruction des trompes utérines', color: COL.bad },
        ],
        src: 'Document 6 · Les causes de l’infertilité',
      },
      narration: 'Chez la femme, la première cause d’infertilité, 30 % des cas, est un trouble de l’ovulation : maladie des ovaires ou déséquilibre hormonal, le follicule ne libère pas son ovocyte. La deuxième, 26 %, est l’obstruction des trompes, souvent après une infection : ovocyte et spermatozoïdes ne peuvent plus se rencontrer.',
      init(W) {
        folR = W.add(makeFollicle(0.26)); folR.position.copy(wl([OV_R[0] + 0.02, OV_R[1] + 0.02, 0.2]));
        folL = W.add(makeFollicle(0.26)); folL.position.copy(wl([OV_L[0] - 0.02, OV_L[1] + 0.02, 0.2]));
        burst = makeBurst(W, 0xffe2b0, 0.7);
        ooFree = W.add(makeOocyte(0.085, { corona: true }));
        curveL = new THREE.CatmullRomCurve3(TUBE_L.map(wl));
        plug = W.add(makePlug()); plug.scale.setScalar(1.15);
        for (let i = 0; i < 5; i++) { const p = makePathogen(0.045); pathos.push(W.add(p)); }
        fl = makeFlock(W, 20, { scale: 0.2, seed: 4 });
      },
      update(W, t) {
        W.show(W.U, 1); W.show(W.platF, 1);
        // ---- A : troubles de l'ovulation (ovaire droit)
        const A = bump(t, 6, 20, 0.6, 0.8);
        const growR = easeOut(seg(t, 7, 12));
        W.show(folR, A); folR.scale.setScalar(0.35 + 0.65 * growR + 0.04 * Math.sin(W.time * 9) * seg(t, 12, 19));
        W.show(folL, 0);
        if (A > 0) W.hiUterus({ 1: [COL.warn, 0.45 * A], 2: [COL.warn, 0.45 * A] }, 0.35 * A);
        const ovP = wl(OV_R);
        W.label('ov', 'Ovaires', wl([OV_R[0] + 0.1, OV_R[1] + 0.25, 0]), { a: bump(t, 2, 20), color: COL.warn, dx: 40, dy: -56 });
        W.label('tr', 'Trompes utérines', wl([0.72, 0.8, 0.0]), { a: bump(t, 2.8, 20), color: COL.mix, dx: 20, dy: -70 });
        W.label('ut', 'Utérus', wl([0.1, 0.0, 0.4]), { a: bump(t, 3.5, 20), color: COL.fem, dx: 70, dy: 40 });
        W.label('noov', '✕ Pas d’ovulation<small>le follicule ne se rompt pas</small>', ovP.clone().add(v3(0.1, 0.1, 0.3)), { a: bump(t, 13, 20), color: COL.bad, dx: -40, dy: -90, big: true, right: true });
        // ---- B : obstruction de la trompe gauche
        const B = bump(t, 20, 38, 0.8, 0.8);
        if (B > 0) W.hiUterus({ 3: [COL.bad, 0.9 * B * (0.7 + 0.3 * Math.sin(W.time * 5))], 4: [COL.bad, 0.25 * B] }, 0.45 * B);
        const uPlug = 0.5; const pp = curveL.getPointAt(uPlug);
        W.show(plug, B * easeOut(seg(t, 20.5, 22.5)));
        plug.position.copy(pp); plug.rotation.y = W.time * 0.4;
        pathos.forEach((p, i) => { W.show(p, B * easeOut(seg(t, 21 + i * 0.25, 22.8 + i * 0.25))); const a = i * 1.26 + W.time * 0.7; p.position.copy(pp).add(v3(Math.cos(a) * 0.1, Math.sin(a) * 0.1, 0.07 * Math.sin(a * 2))); p.rotation.y = W.time * 2; });
        W.label('plug', 'Obstruction<small>suite à des infections</small>', pp.clone().add(v3(0.02, 0.05, 0.1)), { a: bump(t, 22.5, 38), color: COL.bad, dx: 50, dy: -92, big: true });
        // ovulation normale à gauche puis trajet de l'ovocyte jusqu'à l'obstacle
        const ovT = seg(t, 24, 30);
        W.show(ooFree, B * (t > 24 ? 1 : 0));
        const uo = 1 - easeInOut(ovT) * 0.43; ooFree.position.copy(curveL.getPointAt(clamp(uo, 0.5 + 0.0, 1)));
        ooFree.position.z += 0.0;
        burst.userData.set(seg(t, 23.4, 25.2), wl([-1.13, 0.73, 0]));
        // spermatozoïdes depuis l'utérus : bloqués avant l'obstacle
        W.show(fl.sw.group, B * (t > 27 ? 1 : 0));
        const q = new V3(), qd = new V3();
        for (let i = 0; i < fl.n; i++) {
          const st = 27.5 + i * 0.22; const u = clamp((t - st) * 0.07, 0, 0.455 - (i % 4) * 0.012);
          curveL.getPointAt(u, q); curveL.getPointAt(Math.min(1, u + 0.02), qd);
          q.x += Math.sin(W.time * 3 + i) * 0.015; q.y += Math.cos(W.time * 2.2 + i * 2) * 0.02; q.z += (((i * 37) % 11) / 11 - 0.5) * 0.05;
          qd.sub(curveL.getPointAt(u)).normalize();
          fl.sw.set(i, q, qd, u > 0.01 ? 0.2 : 0.0001);
        }
        fl.sw.commit(W.time);
        W.label('meet', 'Rencontre impossible', pp.clone().add(v3(0.0, -0.05, 0.1)), { a: bump(t, 33, 38), color: COL.bad, dx: 80, dy: 70, big: true });
        // ---- caméra
        let p, l;
        if (t < 6) { const k = smooth(t / 6); p = [lerp(0, 0.2, k), lerp(0.7, 0.6, k), lerp(7.2, 6.4, k)]; l = [0, 0.15, 0]; }
        else if (t < 20) { const k = smooth(seg(t, 6, 10)); p = [lerp(0.2, 1.3, k), lerp(0.6, 0.8, k), lerp(6.4, 4.9, k)]; l = [lerp(0, 0.45, k), lerp(0.15, 0.4, k), 0]; }
        else if (t < 24) { const k = smooth(seg(t, 20, 24)); p = [lerp(1.3, -0.6, k), lerp(0.8, 0.95, k), lerp(4.9, 4.7, k)]; l = [lerp(0.45, -0.1, k), lerp(0.4, 0.45, k), 0]; }
        else { p = [-0.6 + Math.sin(W.time * 0.3) * 0.15, 0.95, 4.7]; l = [-0.1, 0.45, 0]; }
        W.setCam([p[0] + ST.F.x, p[1], p[2]], [l[0] + ST.F.x, l[1], l[2]], 40);
      },
    });
  }
  return out;
}
