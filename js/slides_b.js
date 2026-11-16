// Slides 5 à 8 : causes masculines, stimulation hormonale, insémination artificielle, dons & conservation.
import * as THREE from 'three';
import { makeOocyte, makeStream, makeFollicle, makeHypo, makeCatheter, setCatheter, makeCavity, makeStraw, makeDewar, makeMist, makePetri, makePlug, Swarm, setPronuclei, glowShell } from './props.js';
import { makeFlock, makeBurst, bump, uPos, partPos, partBox, TUBE_L, TUBE_R, OV_L, OV_R, v3, drawEcho } from './kit.js';
import { clamp, lerp, smooth, seg, easeOut, easeBack, easeInOut, rng } from './util.js';

const V3 = THREE.Vector3;

// aiguille / sonde : cylindre orienté entre deux points
function makeNeedle(r = 0.012, color = 0xd8f4ff) {
  const g = new THREE.Group();
  const m = new THREE.Mesh(new THREE.CylinderGeometry(r, r, 1, 10), new THREE.MeshPhysicalMaterial({ color, metalness: 0.8, roughness: 0.2, emissive: 0x4aa8d8, emissiveIntensity: 0.25 }));
  const tip = new THREE.Mesh(new THREE.ConeGeometry(r, r * 6, 10), m.material); g.add(m, tip);
  g.userData = { m, tip, r };
  return g;
}
function aim(g, base, tip) {
  const { m, tip: t, r } = g.userData; const d = new V3().subVectors(tip, base); const len = Math.max(d.length(), 1e-4); d.normalize();
  const q = new THREE.Quaternion().setFromUnitVectors(new V3(0, 1, 0), d);
  m.quaternion.copy(q); m.scale.set(1, len, 1); m.position.copy(base).addScaledVector(d, len / 2);
  t.quaternion.copy(new THREE.Quaternion().setFromUnitVectors(new V3(0, 1, 0), d.clone().negate())); t.position.copy(tip).addScaledVector(d, r * 3);
}

export function slidesB(W) {
  const { S, COL, ST } = W;
  const out = [];
  const wl = (p) => uPos(W, p[0], p[1], p[2]);
  const MC = ST.M.clone().add(v3(0, 6.4, 0));

  // =====================================================================
  // 5. CAUSES MASCULINES
  // =====================================================================
  {
    let cols = [], plugM, plugPos = new V3(), micro, sw1, sw2, sw3, sw4, norm, few, slow, odd = [];
    const colX = [-5.7, -1.9, 1.9, 5.7];
    out.push({
      id: 'masculin', dur: 44, bg: [0x0b2a52, 0x03060f], accent: COL.mal, shift: 0.17,
      ui: {
        side: 'left', kicker: '04 · Causes masculines', title: 'Des spermatozoïdes<br>en nombre ou en qualité <span style="color:#4db8ff">insuffisants</span>',
        items: [
          { at: 5, html: 'Origines possibles : <b>troubles hormonaux</b>, <b>dysfonctionnement des testicules</b>, <b>obstruction des voies génitales</b>.', cls: 'warnli' },
          { at: 22.5, html: 'Au microscope, les anomalies des spermatozoïdes :', cls: 'plain' },
          { at: 24.5, html: '<em>Nombre</em> insuffisant.' },
          { at: 29, html: '<em>Mobilité</em> insuffisante.' },
          { at: 33.5, html: '<em>Malformations</em> nombreuses (tête, flagelle).' },
        ],
        stats: [{ at: 36.5, v: 21, suf: ' %', label: 'd’infertilités à cause purement masculine (+ 39 % de causes mixtes)', color: COL.mal, wide: true }],
        src: 'Document 6 · Infertilité masculine',
      },
      narration: 'Chez l’homme, l’infertilité vient principalement d’un nombre insuffisant de spermatozoïdes, d’une mobilité insuffisante, ou d’un nombre important de spermatozoïdes malformés. Ces anomalies ont des origines diverses : troubles hormonaux, dysfonctionnement des testicules, ou obstruction des voies génitales qui empêche les spermatozoïdes de sortir.',
      init(W) {
        plugM = W.add(makePlug()); plugM.scale.setScalar(2.2);
        // pastilles "laboratoire" au-dessus du modèle
        micro = W.add(new THREE.Group());
        for (let i = 0; i < 4; i++) {
          const ring = new THREE.Mesh(new THREE.TorusGeometry(1.5, 0.012, 8, 72), new THREE.MeshBasicMaterial({ color: i === 0 ? COL.good : (i === 3 ? COL.bad : COL.warn), transparent: true, opacity: 0.55 }));
          ring.position.set(MC.x + colX[i], MC.y - 0.2, -0.3);
          micro.add(ring);
        }
        norm = makeFlock(W, 7, { scale: 0.62, seed: 5 });
        few = makeFlock(W, 2, { scale: 0.62, seed: 6 });
        slow = makeFlock(W, 8, { scale: 0.62, amp: 0.12, seed: 7 });
        const variants = [{ head: 1.9 }, { cut: 0.28 }, { amp: 0.0, head: 1.3 }];
        odd = variants.map((v) => { const s = new Swarm(S, 1, { ...v, emissive: 0x7a3a2a }); W.add(s.group); return s; });
      },
      update(W, t) {
        W.show(W.M, 1); W.show(W.platM, 1);
        // --- partie 1 : anatomie + origines
        const org = (t < 22) ? 1 : 0;
        const testis = bump(t, 6, 12.5), vas = bump(t, 13, 21);
        const k = 0.5 + 0.25 * Math.sin(W.time * 4);
        if (testis > 0) W.hiMale(['testis'], COL.mal, 0.9 * testis * k, 0.45 * testis);
        if (vas > 0) W.hiMale(['vas'], COL.bad, 0.9 * vas * k, 0.4 * vas);
        const pT = partPos(W, 'testis'), pV = partPos(W, 'vas'), pP = partPos(W, 'prostate'), pS = partPos(W, 'vesicles');
        W.label('lt', 'Testicules<small>production des spermatozoïdes</small>', pT, { a: bump(t, 2.5, 22), color: COL.mal, dx: -80, dy: 56, right: true });
        W.label('lv', 'Voies génitales<small>épididyme · canal déférent</small>', pV.clone().add(v3(0.4, 0.8, 0)), { a: bump(t, 3.2, 22), color: COL.warn, dx: 70, dy: -50 });
        W.label('lp', 'Prostate · vésicules séminales', pP.clone().add(v3(0, -0.2, 0.2)), { a: bump(t, 4, 12), color: 0xffffff, dx: 90, dy: 56 });
        W.label('hor', 'Troubles hormonaux', pT.clone().add(v3(0, 0, 0.3)), { a: bump(t, 8, 12.5), color: COL.mix, dx: 90, dy: -64 });
        // bouchon sur le canal déférent
        const plugA = easeOut(seg(t, 14, 15.5)) * vas;
        W.show(plugM, plugA);
        const box = partBox(W, ['polySurface286', 'polySurface286001']);
        plugPos.set(box.max.x - 0.02, lerp(box.min.y, box.max.y, 0.44), (box.min.z + box.max.z) / 2 + 0.05);
        plugM.position.copy(plugPos); plugM.rotation.y = W.time * 0.4;
        W.label('obs', 'Obstruction<small>les spermatozoïdes ne sortent plus</small>', plugPos, { a: bump(t, 15.5, 21), color: COL.bad, dx: -50, dy: -80, big: true, right: true });
        // --- partie 2 : vue microscopique (au-dessus du modèle)
        W.show(micro, t > 20 ? 1 : 0);
        const mf = t > 21 ? 1 : 0; document.body.classList.toggle('scope', t > 22);
        const colC = (i) => v3(MC.x + colX[i], MC.y - 0.2, 0);
        const run = (fl, i, o) => fl.run(W.time, { center: colC(i), axis: v3(1, 0, 0), span: 2.6, spread: 0.55, ...o });
        W.show(norm.sw.group, mf); W.show(few.sw.group, mf); W.show(slow.sw.group, mf); odd.forEach((s) => W.show(s.group, mf));
        if (t > 20) {
          run(norm, 0, { speed: 0.9 }); run(few, 1, { speed: 0.9 }); run(slow, 2, { speed: 0.12, spread: 0.6 });
          odd.forEach((s, i) => {
            const base = colC(3).clone().add(v3(-1.0 + i * 1.0, (i - 1) * 0.0 + 0.1 * Math.sin(W.time + i), 0.1 * i));
            const ang = 0.15 * Math.sin(W.time * 0.8 + i) + (i === 1 ? 0.0 : 0);
            s.set(0, base, v3(Math.cos(ang), Math.sin(ang), 0), 0.78 * smooth((t - 22) / 2), 0); s.commit(W.time);
          });
        }
        W.label('c0', 'Normal<small>référence</small>', colC(0).clone().add(v3(0, 1.55, 0)), { a: bump(t, 23, 44, 0.6, 0.5), color: COL.good, dx: 0, dy: -24 });
        W.label('c1', 'Peu nombreux', colC(1).clone().add(v3(0, 1.55, 0)), { a: bump(t, 24, 44, 0.6, 0.5), color: COL.warn, dx: 0, dy: -24 });
        W.label('c2', 'Peu mobiles', colC(2).clone().add(v3(0, 1.55, 0)), { a: bump(t, 28.5, 44, 0.6, 0.5), color: COL.warn, dx: 0, dy: -24 });
        W.label('c3', 'Malformés<small>tête · flagelle</small>', colC(3).clone().add(v3(0, 1.55, 0)), { a: bump(t, 33, 44, 0.6, 0.5), color: COL.bad, dx: 0, dy: -24 });
        // --- caméra
        let p, l;
        const M = ST.M;
        if (t < 22) { const q = smooth(t / 6); const a = Math.sin(W.time * 0.25) * 0.25; p = [M.x + lerp(1.0, 0, q) + a * 3, lerp(0.8, 0.3, q), lerp(12.5, 10.2, q)]; l = [M.x, 0, 0]; }
        else if (t < 25.5) { const q = smooth(seg(t, 22, 25.5)); p = [lerp(M.x, MC.x + colX[0], q), lerp(0.3, MC.y, q), lerp(10.2, 6.0, q)]; l = [lerp(M.x, MC.x + colX[0], q), lerp(0, MC.y - 0.2, q), 0]; }
        else { const stops = [0, 1, 2, 3]; const f = clamp((t - 25.5) / 13); const x = lerp(0, 3, smooth(f * 1.0)); const i = x; const cx = lerp(colX[0], colX[3], smooth(f)); p = [MC.x + cx, MC.y, 6.0]; l = [MC.x + cx, MC.y - 0.25, 0]; }
        W.setCam(p, l, 40);
      },
    });
  }

  // =====================================================================
  // 6. STIMULATION HORMONALE
  // =====================================================================
  {
    let hypo, strL, strR, strInj, strInjR, fols = [], burstLH, burstOv, ooOut, needle, tube, ooTube = [], pen, cathHost;
    const FOL = [ // [ovaire, dx, dy, dz, rayon final]
      ['R', 0.04, 0.05, 0.2, 0.25], ['R', -0.13, -0.1, 0.17, 0.17], ['R', 0.18, -0.1, 0.17, 0.15], ['R', 0.12, 0.2, 0.15, 0.14],
      ['L', -0.04, 0.05, 0.2, 0.23], ['L', 0.14, -0.08, 0.17, 0.17], ['L', -0.2, -0.1, 0.17, 0.15], ['L', -0.1, 0.22, 0.15, 0.13],
    ];
    const echoFols = (t) => {
      const nat = easeOut(seg(t, 5, 9)) * (1 - seg(t, 10.2, 11.2)) + (t > 11.6 && t < 15.5 ? 0 : 0);
      const stim = seg(t, 17, 26);
      const arr = [];
      if (t < 15.5) arr.push({ x: 175, y: 125, d: 4 + 9 * nat * (t < 10.2 ? 1 : 0.3) });
      else {
        const P = [[175, 125, 13], [110, 150, 10], [235, 150, 9], [150, 85, 9], [215, 95, 8], [120, 110, 7]];
        P.forEach(([x, y, d], i) => arr.push({ x, y, d: 3 + (d - 3) * easeOut(seg(t, 17 + i * 0.8, 24 + i * 0.8)) * (t > 31.5 + (i % 3) * 1.5 ? 0.12 : 1) }));
      }
      return arr;
    };
    const pathL = [[-0.45, 1.5, 0.1], [-0.7, 1.1, 0.2], OV_L];
    out.push({
      id: 'stimulation', dur: 46, bg: [0x4a1236, 0x090309], accent: COL.warn, shift: 0.17, echo: true,
      ui: {
        side: 'left', dense: true, kicker: '05 · Stimulation hormonale', title: 'Aider l’ovaire<br>à produire des <span style="color:#ffb84d">ovocytes</span>',
        items: [
          { at: 3, html: 'Naturellement : <em>FSH</em> et <em>LH</em> hypophysaires ; le <b>pic de LH</b> déclenche l’ovulation.' },
          { at: 11.2, html: 'Hypophyse déficiente (<b>pas de pic de LH</b>) : pas d’ovulation.', cls: 'warnli' },
          { at: 16, html: '<em>Stimulation</em> : des hormones remplacent ou renforcent l’action de l’hypophyse.' },
          { at: 28, html: 'Ovocytes <b>ponctionnés avant l’ovulation</b> (don, FIV).' },
        ],
        src: 'Document 6 · La stimulation hormonale des ovaires',
      },
      narration: 'Dans un cycle naturel, l’hypophyse libère FSH puis un pic de LH, qui déclenche l’ovulation. Si ce pic manque, l’ovulation n’a pas lieu. La stimulation hormonale remplace ou renforce cette commande : plusieurs follicules grandissent, ce qui est vérifié à l’échographie. Les ovocytes sont ensuite ponctionnés avant l’ovulation, pour le don d’ovocytes ou la fécondation in vitro.',
      init(W) {
        hypo = W.add(makeHypo()); hypo.position.copy(ST.F).add(v3(0, 2.3, 0.0));
        const hp = hypo.position;
        const cL = new THREE.CatmullRomCurve3([hp.clone().add(v3(-0.05, -0.3, 0)), ...pathL.map((p) => wl(p))].map((v) => v.clone()));
        const cR = new THREE.CatmullRomCurve3([hp.clone().add(v3(0.05, -0.3, 0)), wl([0.5, 1.5, 0.1]), wl([0.8, 1.1, 0.2]), wl(OV_R)]);
        strL = W.add(makeStream(cL, 36, COL.warn, 0.12)); strR = W.add(makeStream(cR, 36, COL.warn, 0.12));
        const cI = new THREE.CatmullRomCurve3([wl([-2.3, -0.5, 0.9]), wl([-1.6, 0.0, 0.7]), wl([-1.2, 0.2, 0.4]), wl(OV_L)]);
        const cIR = new THREE.CatmullRomCurve3([wl([2.3, -0.5, 0.9]), wl([1.7, 0.0, 0.7]), wl([1.3, 0.25, 0.4]), wl(OV_R)]);
        strInj = W.add(makeStream(cI, 50, COL.lab, 0.13)); strInjR = W.add(makeStream(cIR, 50, COL.lab, 0.13));
        FOL.forEach((f) => {
          const o = f[0] === 'R' ? OV_R : OV_L; const m = W.add(makeFollicle(f[4])); m.userData.fo = f; m.position.copy(wl([o[0] + f[1], o[1] + f[2], f[3]])); fols.push(m);
        });
        burstLH = makeBurst(W, 0xc89bff, 0.9); burstOv = makeBurst(W, 0xffe2b0, 0.6);
        ooOut = W.add(makeOocyte(0.09, { corona: true }));
        needle = W.add(makeNeedle(0.013));
        tube = W.add(new THREE.Group()); tube.position.copy(wl([-1.9, -1.0, 0.85]));
        tube.add(new THREE.Mesh(new THREE.CylinderGeometry(0.11, 0.11, 0.9, 20, 1, true), new THREE.MeshPhysicalMaterial({ color: 0xcfeeff, transparent: true, opacity: 0.3, roughness: 0.05, clearcoat: 1, side: THREE.DoubleSide, depthWrite: false })));
        const fillt = new THREE.Mesh(new THREE.CylinderGeometry(0.095, 0.095, 0.4, 20), new THREE.MeshStandardMaterial({ color: 0xff9bb8, emissive: 0xff5d8f, emissiveIntensity: 0.25, transparent: true, opacity: 0.55 })); fillt.position.y = -0.22; tube.add(fillt);
        for (let i = 0; i < 4; i++) { const o = W.add(makeOocyte(0.075)); ooTube.push(o); }
      },
      update(W, t) {
        W.show(W.U, 1); W.show(W.platF, 1);
        const phNat = bump(t, 3, 15.5, 0.8, 0.8), phStim = bump(t, 15.5, 46, 0.8, 0.5);
        // hypophyse
        W.show(hypo, bump(t, 1, 46, 1, 0.6));
        const dead = seg(t, 10.8, 12.4) * (1 - seg(t, 15.5, 16.5));
        hypo.userData.hy.material.emissiveIntensity = 0.75 - 0.6 * dead; hypo.userData.pit.material.emissiveIntensity = 0.85 - 0.7 * dead;
        hypo.userData.hy.material.color.set(dead > 0.5 ? 0x8a8a96 : 0xffb84d); hypo.userData.pit.material.color.set(dead > 0.5 ? 0x8a8a96 : 0xc89bff);
        hypo.rotation.y = W.time * 0.5;
        W.label('hyp', 'Complexe hypothalamo-hypophysaire', hypo.position.clone().add(v3(0.1, 0.1, 0)), { a: bump(t, 1.5, 15.5), color: COL.warn, dx: 60, dy: -20 });
        W.show(strL, phNat * (t < 10.5 || t > 15.4 ? 1 : 0.2 * (1 - dead))); W.show(strR, phNat * (t < 10.5 ? 1 : 0));
        strL.userData.update(W.time, easeOut(seg(t, 3.5, 6)), 0.22); strR.userData.update(W.time, easeOut(seg(t, 3.5, 6)), 0.22);
        // follicule naturel (ovaire droit : FOL[0]) puis ovulation
        const growth = (i) => {
          if (t < 15.5) return i === 0 ? easeOut(seg(t, 5, 9)) * (t < 9.7 ? 1 : 1 - 0.0) : 0.0;
          const base = easeOut(seg(t, 17.5 + i * 0.55, 25.5 + i * 0.55));
          const asp = (t > 31 && fols[i].userData.fo[0] === 'L' && i - 4 < 3) ? 1 - smooth(seg(t, 31.2 + (i - 4) * 2.2, 32.4 + (i - 4) * 2.2)) * 0.85 : 1;
          return base * asp;
        };
        fols.forEach((f, i) => {
          const g = growth(i); const ex = i === 0 ? (t > 9.7 && t < 10.6 ? 1 - seg(t, 9.7, 10.6) : (t >= 10.6 && t < 15.5 ? 0 : 1)) : 1;
          f.userData.g = g * (i === 0 && t < 15.5 ? ex : 1);
          W.show(f, (t > 4.5 ? 1 : 0) * (f.userData.g > 0.04 ? 1 : 0));
          f.scale.setScalar(Math.max(0.01, 0.3 + 0.7 * f.userData.g));
        });
        // pic de LH (violet) puis ovulation
        burstLH.userData.set(seg(t, 9.1, 10.2), hypo.position.clone().add(v3(0, -0.1, 0.1)));
        W.label('lh', 'Pic de LH', hypo.position.clone().add(v3(0, -0.3, 0.2)), { a: bump(t, 9, 11), color: COL.mix, dx: -70, dy: 20, right: true, big: true });
        burstOv.userData.set(seg(t, 10.0, 11.4), fols[0].position.clone());
        // ovocyte expulsé (ovulation) -> vers la trompe droite
        W.show(ooOut, bump(t, 10.0, 15, 0.1, 0.8));
        { const c = new THREE.CatmullRomCurve3(TUBE_R.slice().reverse().map(wl)); const u = easeInOut(seg(t, 10.2, 14.8)); ooOut.position.copy(c.getPointAt(clamp(u * 0.6, 0, 0.99))); }
        W.label('ovu', 'Ovulation', fols[0].position.clone().add(v3(0.2, 0.2, 0.2)), { a: bump(t, 10.2, 12.5), color: COL.warn, dx: 60, dy: -50, big: true });
        W.label('nop', '✕ Pas de pic de LH<small>pas d’ovulation</small>', hypo.position.clone().add(v3(0, -0.2, 0.2)), { a: bump(t, 12.4, 15.5), color: COL.bad, dx: 70, dy: 0, big: true });
        // hormones injectées (stimulation)
        const inj = bump(t, 15.8, 28, 0.6, 0.8);
        W.show(strInj, inj); W.show(strInjR, inj);
        strInj.userData.update(W.time, easeOut(seg(t, 16, 18)), 0.28); strInjR.userData.update(W.time, easeOut(seg(t, 16, 18)), 0.28);
        W.label('inj', 'FSH · LH injectées<small>stimulation des deux ovaires</small>', wl([-1.6, 0.05, 0.7]), { a: bump(t, 16.5, 27), color: COL.lab, dx: 0, dy: 90, big: true });
        // ponction : aiguille guidée par échographie
        const pon = bump(t, 28.5, 40, 0.8, 0.8);
        W.ghostUterus(0.8 * pon);
        if (pon > 0.02) W.hiUterus({ 1: [COL.lab, 0.3 * pon] }, 0);
        const base = wl([-0.1, -0.7, 0.42]);
        const targets = [4, 5, 6].map((i) => fols[i].position);
        const idx = clamp(Math.floor((t - 31.2) / 2.2), -1, 2);
        const tipP = new V3();
        if (idx < 0) tipP.lerpVectors(base, targets[0], easeInOut(seg(t, 29, 31.2)) * 0.95);
        else { const prev = idx === 0 ? targets[0] : targets[idx - 1]; const q = easeInOut(seg(t, 31.2 + idx * 2.2 - 0.7, 31.2 + idx * 2.2 + 0.1)); tipP.lerpVectors(prev, targets[idx], q).lerp(targets[idx], 0); tipP.multiplyScalar(0.96).addScaledVector(targets[idx], 0.04); }
        aim(needle, base, tipP); W.show(needle, pon);
        W.show(tube, pon);
        ooTube.forEach((o, i) => { const f = i < 3 ? seg(t, 32.6 + i * 2.2, 34.2 + i * 2.2) : 0; W.show(o, f > 0 ? 1 : 0); o.position.copy(tube.position).add(v3((i - 1.5) * 0.06 + 0, -0.35 + 0.02 * i, 0)); });
        // trajet visuel de l'ovocyte aspiré dans l'aiguille
        W.label('pon', 'Ponction<small>par voie vaginale, sous échographie</small>', base.clone().add(v3(-0.1, -0.2, 0)), { a: bump(t, 29.5, 40), color: COL.lab, dx: -60, dy: 70, right: true, big: true });
        W.label('rec', 'Ovocytes recueillis', tube.position.clone().add(v3(0, 0.55, 0)), { a: bump(t, 34, 42), color: COL.fem, dx: -20, dy: -40, right: true });
        // échographie
        const g = W.echoCtx; drawEcho(g, W.time, echoFols(t));
        document.getElementById('echo-cap').textContent = t < 11 ? 'Cycle naturel : 1 follicule dominant' : (t < 16 ? 'Pas de maturation : follicule régressif' : (t < 28 ? 'Sous stimulation : plusieurs follicules' : 'Ponction : follicules aspirés'));
        // caméra
        let p, l;
        if (t < 15) { const k = smooth(t / 5); p = [lerp(0, 0.6, k), lerp(1.2, 1.0, k), lerp(8.6, 6.4, k)]; l = [0, lerp(0.9, 0.9, k), 0]; }
        else if (t < 28) { const k = smooth(seg(t, 15, 18)); p = [lerp(0.6, 0.0, k), lerp(1.0, 0.7, k), lerp(6.4, 5.4, k)]; l = [0, lerp(0.9, 0.3, k), 0]; }
        else { const k = smooth(seg(t, 28, 32)); p = [lerp(0.0, -1.0, k), lerp(0.7, 0.2, k), lerp(5.4, 3.7, k)]; l = [lerp(0, -0.65, k), lerp(0.3, -0.05, k), 0]; }
        W.setCam([p[0] + ST.F.x, p[1], p[2]], [l[0] + ST.F.x, l[1], l[2]], 40);
      },
    });
  }

  // =====================================================================
  // 7. INSÉMINATION ARTIFICIELLE
  // =====================================================================
  {
    let cavity, cath, curveL, curveR, flL, flR, ooT, tubeSp, folR, burst, spPrep, zygote;
    const catPts = [[-0.06, -1.7, 0.0], [-0.02, -1.15, 0.0], [0.0, -0.7, 0.0], [0.0, -0.34, 0.0], [0.0, 0.02, 0.0], [0.0, 0.27, 0.0]];
    const N = 22;
    out.push({
      id: 'insemination', dur: 48, bg: [0x4a1230, 0x080309], accent: COL.fem, shift: 0.17,
      ui: {
        side: 'left', dense: true, kicker: '06 · Insémination artificielle', title: 'Déposer les spermatozoïdes<br>dans l’utérus',
        items: [
          { at: 2, html: '<em>①</em> Sperme (du conjoint ou d’un donneur) <b>préparé</b> au laboratoire.' },
          { at: 8, html: '<em>②</em> Ovaires <b>stimulés</b> : ovulation contrôlée, bon moment choisi.' },
          { at: 14, html: '<em>③</em> Dépôt <b>dans l’utérus</b> par un fin cathéter.' },
          { at: 29, html: 'La <b>fécondation</b> reste naturelle (dans la trompe).', cls: 'plain' },
        ],
        stats: [
          { at: 36, v: 12, suf: ' %', label: 'de succès par insémination', color: COL.fem },
          { at: 37.5, v: 6000, pre: '> ', label: 'naissances / an en France', color: COL.lab },
          { at: 39, v: 6, suf: ' %', label: 'des cas : don de sperme', color: COL.warn, wide: true },
        ],
        src: 'Document 6 · L’insémination artificielle',
      },
      narration: 'L’insémination artificielle place dans l’utérus des spermatozoïdes préalablement préparés. Pour augmenter les chances, les ovaires sont stimulés et l’ovulation est contrôlée afin de choisir le meilleur moment. Le taux de succès est d’environ 12 %, et plus de 6 000 enfants naissent chaque année en France grâce à cette technique, dans 6 % des cas avec un don de sperme.',
      init(W) {
        cavity = W.add(makeCavity()); cavity.position.copy(ST.F);
        cath = W.add(makeCatheter(catPts.map(wl), 0.03));
        curveL = new THREE.CatmullRomCurve3(TUBE_L.map(wl)); curveR = new THREE.CatmullRomCurve3(TUBE_R.map(wl));
        flL = new Swarm(S, N, { emissive: 0x2a5a9a }); flR = new Swarm(S, N, { emissive: 0x2a5a9a }); W.add(flL.group); W.add(flR.group);
        ooT = W.add(makeOocyte(0.1, { corona: true }));
        folR = W.add(makeFollicle(0.22)); folR.position.copy(wl([OV_R[0] + 0.04, OV_R[1] + 0.04, 0.2]));
        burst = makeBurst(W, 0xbff0ff, 0.5);
        // tube de préparation
        tubeSp = W.add(new THREE.Group()); tubeSp.position.copy(wl([-2.3, -0.2, 0.7])); tubeSp.rotation.z = 0.0;
        tubeSp.add(new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.2, 1.4, 24, 1, true), new THREE.MeshPhysicalMaterial({ color: 0xcfeeff, transparent: true, opacity: 0.3, roughness: 0.05, clearcoat: 1, side: THREE.DoubleSide, depthWrite: false })));
        const bt = new THREE.Mesh(new THREE.SphereGeometry(0.2, 24, 14, 0, 6.2832, Math.PI / 2, Math.PI / 2), new THREE.MeshPhysicalMaterial({ color: 0xcfeeff, transparent: true, opacity: 0.3, roughness: 0.05, clearcoat: 1, side: THREE.DoubleSide, depthWrite: false })); bt.position.y = -0.7; tubeSp.add(bt);
        const liq = new THREE.Mesh(new THREE.CylinderGeometry(0.185, 0.185, 0.7, 24), new THREE.MeshStandardMaterial({ color: 0xf7f3e8, emissive: 0xaecbff, emissiveIntensity: 0.18, transparent: true, opacity: 0.35 })); liq.position.y = -0.35; tubeSp.add(liq);
        spPrep = makeFlock(W, 14, { scale: 0.22, seed: 12 });
        zygote = W.add(makeOocyte(0.1));
      },
      update(W, t) {
        W.show(W.U, 1); W.show(W.platF, 1);
        const ghost = smooth(seg(t, 10.5, 13)) * (1 - smooth(seg(t, 44, 47))); W.ghostUterus(0.82 * ghost);
        W.show(cavity, ghost);
        // ① préparation
        const prep = bump(t, 1.5, 12, 0.8, 0.8); W.show(tubeSp, prep); W.show(spPrep.sw.group, prep);
        if (prep > 0.01) { spPrep.run(W.time, { center: tubeSp.position.clone().add(v3(0, -0.35, 0)), axis: v3(0, 1, 0), span: 0.9, spread: 0.1, speed: 0.5, scaleMul: 1 }); }
        W.label('prep', 'Sperme préparé<small>tri au laboratoire</small>', tubeSp.position.clone().add(v3(0, 0.75, 0)), { a: bump(t, 2.5, 11), color: COL.lab, dx: 20, dy: -34 });
        // ② stimulation + ovulation contrôlée
        const stim = bump(t, 7.5, 16, 0.8, 0.8);
        W.show(folR, stim * (t < 14 ? 1 : 0.0)); folR.scale.setScalar(0.4 + 0.6 * easeOut(seg(t, 8, 12)));
        if (stim > 0) W.hiUterus({ 2: [COL.warn, 0.5 * stim] }, 0.3 * stim);
        W.label('ovs', 'Ovaire stimulé<small>ovulation contrôlée</small>', folR.position.clone().add(v3(0.1, 0.15, 0.1)), { a: bump(t, 9, 15.5), color: COL.warn, dx: 50, dy: -60 });
        // ③ cathéter
        const adv = easeInOut(seg(t, 14, 20)); setCatheter(cath, adv); W.show(cath, bump(t, 13.5, 32, 0.4, 1.2));
        W.label('cat', 'Cathéter souple', curveCath(0.55), { a: bump(t, 15, 24), color: COL.lab, dx: -60, dy: 44, right: true });
        W.label('cav', 'Cavité de l’utérus', wl([0.12, 0.2, 0.1]), { a: bump(t, 20.5, 30), color: COL.fem, dx: 80, dy: -50 });
        // essaim relâché à partir de 20 s
        const tipP = wl(catPts[5]);
        const sp = (sw, curve, side) => {
          for (let i = 0; i < N; i++) {
            const st = 20.6 + i * 0.12 + (side ? 0.05 : 0); const u = clamp((t - st) * (0.056 + (i % 5) * 0.004), 0, 0.96);
            if (u <= 0.002 || t < 20.6) { sw.hide(i); continue; }
            const q = curve.getPointAt(u); const qd = curve.getPointAt(Math.min(1, u + 0.02)).sub(q).normalize();
            const wob = 0.012 + (1 - u) * 0.03; q.x += Math.sin(W.time * 4 + i * 2) * wob; q.y += Math.cos(W.time * 3 + i) * wob; q.z += (((i * 31) % 13) / 13 - 0.5) * 0.14 * (1 - u);
            sw.set(i, q, qd, 0.19 * smooth(u / 0.04) * (1 - smooth((u - 0.94) / 0.06)), i);
          }
          sw.commit(W.time);
        };
        W.show(flL.group, 1); W.show(flR.group, 1);
        sp(flL, curveL, 0); sp(flR, curveR, 1);
        // ovocyte attendant dans la trompe gauche, fécondation
        const wait = bump(t, 18, 48, 0.8, 0.5) ; W.show(ooT, wait);
        const ooU = t < 22 ? lerp(1, 0.86, seg(t, 18, 22)) : 0.86;
        ooT.position.copy(curveL.getPointAt(ooU)); ooT.rotation.y = W.time * 0.3;
        const feco = seg(t, 31, 33.6);
        burst.userData.set(feco > 0 && feco < 1 ? feco : 0, ooT.position);
        setPronuclei(ooT, easeOut(seg(t, 32.5, 34.5)));
        W.label('feco', 'Fécondation<small>dans la trompe</small>', ooT.position.clone().add(v3(0, 0.1, 0.1)), { a: bump(t, 31.5, 44), color: COL.good, dx: -40, dy: -80, right: true, big: true });
        W.show(zygote, 0);
        // caméra
        let p, l;
        if (t < 13) { const k = smooth(t / 5); p = [lerp(-0.3, -0.8, k), lerp(0.6, 0.4, k), lerp(7.2, 6.0, k)]; l = [lerp(0, -0.6, k), lerp(0.2, 0, k), 0]; }
        else if (t < 30) { const k = smooth(seg(t, 13, 18)); p = [lerp(-0.8, 0, k), lerp(0.4, 0.15, k), lerp(6.0, 4.8, k)]; l = [lerp(-0.6, 0, k), lerp(0, 0.05, k), 0]; }
        else { const k = smooth(seg(t, 29, 34)); p = [lerp(0, -0.8, k), lerp(0.15, 0.85, k), lerp(4.8, 3.2, k)]; l = [lerp(0, -0.72, k), lerp(0.05, 0.7, k), 0]; }
        W.setCam([p[0] + ST.F.x, p[1], p[2]], [l[0] + ST.F.x, l[1], l[2]], 40);
        function curveCath(u) { return cath.userData.curve.getPointAt(u); }
      },
    });
  }

  // =====================================================================
  // 8. DONS DE GAMÈTES & CONSERVATION
  // =====================================================================
  {
    let dewar, mist, straw, kids = [], folD, needleD, ooD, petri, swD, burst, strD, strawBig;
    const L = ST.L;
    const kidPos = (i) => { const a = Math.PI / 2 - (i / 10) * Math.PI * 2; return v3(L.x + Math.cos(a) * 2.3, 1.3 + Math.sin(a) * 1.6, 0.0); };
    out.push({
      id: 'dons', dur: 46, bg: [0x063a46, 0x02080c], accent: COL.lab, shift: 0.17,
      ui: {
        side: 'left', kicker: '07 · Dons de gamètes', title: 'Donner, conserver,<br>encadrer',
        items: [
          { at: 1, html: '<b>Don de sperme</b> : gratuit et volontaire.' },
          { at: 4.5, html: 'Conservé dans l’<em>azote liquide</em> à <b>−196 °C</b>, jusqu’à <b>10 ans</b>.' },
          { at: 13, html: '<b>10 enfants au maximum</b> nés d’un même donneur.' },
          { at: 19, html: 'Loi de 2021 : à leur majorité, les enfants nés d’un don (depuis sept. 2022) peuvent connaître le donneur.' },
          { at: 26, html: '<b>Don d’ovocytes</b> : stimulation hormonale + ponction, puis <em>FIV</em> obligatoire.' },
        ],
        stats: [
          { at: 7, v: 196, pre: '−', suf: ' °C', label: 'azote liquide', color: COL.lab },
          { at: 14, v: 10, label: 'enfants max. par donneur', color: COL.warn },
          { at: 38, v: 3, suf: ' %', label: 'des FIVETE avec gamètes issus de dons', color: COL.fem, wide: true },
        ],
        src: 'Document 6 · Don de sperme, don d’ovocytes · loi de bioéthique 2021',
      },
      narration: 'Le don de sperme est gratuit et volontaire. Les spermatozoïdes sont congelés dans l’azote liquide à moins 196 degrés, pendant dix ans au plus. Un même donneur ne peut donner naissance qu’à dix enfants. Depuis la loi de 2021, les enfants nés d’un don peuvent accéder à l’identité du donneur à leur majorité. Le don d’ovocytes, lui, nécessite une stimulation, une ponction, puis une fécondation in vitro : il reste peu répandu.',
      init(W) {
        dewar = W.add(makeDewar()); dewar.position.copy(L).add(v3(0, -1.0, 0)); dewar.scale.setScalar(0.8);
        mist = W.add(makeMist(90)); mist.position.copy(dewar.position); mist.scale.setScalar(0.8);
        strawBig = W.add(makeStraw(1.4, 0xffd27a)); strawBig.scale.setScalar(1.0);
        for (let i = 0; i < 11; i++) {
          const o = new THREE.Mesh(new THREE.SphereGeometry(0.2, 24, 18), new THREE.MeshStandardMaterial({ color: i === 10 ? COL.bad : 0xffd9a0, emissive: i === 10 ? COL.bad : 0xff9a4d, emissiveIntensity: 0.6 }));
          o.add(glowShell(0.26, i === 10 ? COL.bad : 0xffc47a, 2.4, 0.9));
          kids.push(W.add(o));
        }
        // don d'ovocytes : follicule du donneur, aiguille, ovocyte, boîte de Petri
        folD = W.add(makeFollicle(0.55)); folD.position.copy(L).add(v3(2.7, 1.4, 0.2));
        needleD = W.add(makeNeedle(0.02)); ooD = W.add(makeOocyte(0.18, { corona: true }));
        petri = W.add(makePetri(1.15)); petri.position.copy(L).add(v3(-0.1, -0.85, 1.2));
        swD = makeFlock(W, 26, { scale: 0.22, seed: 15 });
        burst = makeBurst(W, 0xbff0ff, 0.5);
        const c = new THREE.CatmullRomCurve3([L.clone().add(v3(1.2, -0.2, 0.0)), L.clone().add(v3(3.0, 0.3, 0.4)), folD.position.clone().add(v3(-0.4, -0.3, 0.3))]);
        strD = W.add(makeStream(c, 40, COL.lab, 0.13));
      },
      update(W, t) {
        W.show(W.platL, 1);
        const A = 1 - smooth(seg(t, 21.5, 24)); // partie sperme
        W.show(dewar, A); W.show(mist, A); mist.userData.update(W.time, 1);
        // paillette qui descend dans la cuve
        const down = easeInOut(seg(t, 6, 10.5));
        W.show(strawBig, bump(t, 0.6, 22, 0.8, 1.2));
        strawBig.position.copy(L).add(v3(0, lerp(3.0, 1.35, down) , 0.0)); strawBig.rotation.set(0, W.time * 0.7, 0.2 * (1 - down));
        const T = lerp(37, -196, down); W.label('temp', `<b>${Math.round(T)} °C</b>`, strawBig.position.clone().add(v3(0.2, 0.6, 0)), { a: bump(t, 4.5, 14) , color: COL.lab, dx: 50, dy: -30, big: true });
        W.label('dew', 'Cuve d’azote liquide', dewar.position.clone().add(v3(1.0, 1.3, 0.3)), { a: bump(t, 8, 22), color: COL.lab, dx: 60, dy: 20 });
        // 10 enfants max
        kids.forEach((o, i) => {
          const on = i < 10 ? easeBack(seg(t, 12 + i * 0.4, 12.8 + i * 0.4)) : easeBack(seg(t, 17.2, 18));
          W.show(o, (t > 12 && t < 22 ? 1 : 0) * (on > 0.01 ? 1 : 0)); o.position.copy(kidPos(i)); o.scale.setScalar(Math.max(0.001, on));
        });
        W.label('n10', '10 / 10<small>naissances maximum</small>', L.clone().add(v3(0, 1.0, 0.3)), { a: bump(t, 16.2, 21.5), color: COL.warn, dx: 0, dy: 0, big: true });
        W.label('n11', '✕ 11<sup>e</sup> refusé', kidPos(10).clone().add(v3(0, 0, 0.1)), { a: bump(t, 17.4, 21.5), color: COL.bad, dx: 30, dy: -40, big: true });
        // don d'ovocytes
        const B = smooth(seg(t, 23, 25.5)) * (1 - smooth(seg(t, 44, 46)));
        W.show(folD, B); W.show(needleD, bump(t, 28.5, 33, 0.6, 0.6)); W.show(petri, B); W.show(swD.sw.group, B);
        W.show(strD, bump(t, 25, 29, 0.5, 0.8)); strD.userData.update(W.time, easeOut(seg(t, 25, 26.5)), 0.3);
        folD.scale.setScalar(0.45 + 0.55 * easeOut(seg(t, 25, 29.5)) - 0.4 * smooth(seg(t, 31.5, 32.4)));
        const tipD = folD.position.clone().add(v3(-0.2, -0.1, 0.15));
        aim(needleD, folD.position.clone().add(v3(1.6, 1.3, 0.2)), v3().lerpVectors(folD.position.clone().add(v3(0.9, 0.7, 0.2)), tipD, easeInOut(seg(t, 29, 31.2))));
        // ovocyte aspiré -> boîte de Petri
        const flight = easeInOut(seg(t, 32, 35.5));
        W.show(ooD, bump(t, 31.8, 46, 0.1, 0.8));
        const pet = petri.position.clone().add(v3(0, 0.2, 0));
        ooD.position.copy(folD.position).lerp(pet, flight); ooD.position.y += Math.sin(flight * Math.PI) * 1.0; ooD.rotation.y = W.time * 0.4;
        swD.run(W.time, { center: pet.clone().add(v3(1.0, 0.3, 0)), axis: v3(-1, 0.0, 0), span: 2.4, spread: 0.6, speed: 0.5, count: 26 });
        burst.userData.set(seg(t, 39.5, 41.6), pet.clone().add(v3(0, 0.2, 0)));
        setPronuclei(ooD, easeOut(seg(t, 40.5, 42.5)));
        W.label('dd', 'Donneuse<small>stimulation + ponction</small>', folD.position.clone().add(v3(0, 0.5, 0)), { a: bump(t, 26, 33), color: COL.fem, dx: 30, dy: -40, big: true });
        W.label('dp', 'Fécondation in vitro<small>obligatoire</small>', petri.position.clone().add(v3(0, 0.35, 0)), { a: bump(t, 35.5, 45), color: COL.lab, dx: -20, dy: -80, big: true, right: true });
        // caméra
        let p, l;
        if (t < 22) { const k = smooth(t / 8); p = [L.x + lerp(0.8, 0.2, k), lerp(2.6, 3.8, k), lerp(11.5, 9.6, k)]; l = [L.x, lerp(0.8, 0.9, k), 0]; }
        else { const k = smooth(seg(t, 21, 26)); p = [L.x + lerp(0.2, 0.6, k), lerp(3.8, 2.8, k), lerp(9.6, 8.6, k)]; l = [L.x + lerp(0, 0.8, k), lerp(0.9, 0.3, k), 0.2]; }
        W.setCam(p, l, 40);
      },
    });
  }
  return out;
}
