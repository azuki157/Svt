// Outils communs aux slides : essaims, positions d'organes, échographie, étiquettes.
import * as THREE from 'three';
import { Swarm, fresnelMat } from './props.js';
import { rng, smooth, clamp, lerp } from './util.js';

const V3 = THREE.Vector3;
export const v3 = (x, y, z) => new V3(x, y, z);

// Essaim de spermatozoïdes qui traverse une région de l'espace (nage en continu)
export function makeFlock(W, n, { scale = 0.25, amp = 1, cut = 1, head = 1, seed = 1, color, emissive } = {}) {
  const sw = new Swarm(W.S, n, { amp, cut, head, color, emissive }); W.add(sw.group);
  const R = rng(seed); const P = Array.from({ length: n }, () => ({ a: R(), b: R(), c: R(), d: R(), e: R() }));
  const pos = new V3(), pos2 = new V3(), s1 = new V3(), s2 = new V3(), dir = new V3(), ax = new V3();
  const at = (p, i, time, center, axis, span, spread, speed, wob) => {
    const rate = speed * (0.6 + 0.8 * p.a) / span;
    const u = (((p.b + time * rate) % 1) + 1) % 1;
    const rr = spread * Math.sqrt(p.c); const th = p.d * 6.2832 + time * (0.3 + p.e) * 0.6;
    const lat1 = Math.cos(th) * rr + Math.sin(time * 2.1 + p.b * 40) * wob, lat2 = Math.sin(th) * rr;
    return { u, v: new V3().copy(center).addScaledVector(axis, (u - 0.5) * span).addScaledVector(s1, lat1).addScaledVector(s2, lat2) };
  };
  return {
    sw, n,
    run(time, { center, axis = v3(-1, 0, 0), span = 14, spread = 3, speed = 1.2, scaleMul = 1, count = n, wob = 0.12 }) {
      ax.copy(axis).normalize();
      s1.crossVectors(ax, new V3(0, 1, 0)); if (s1.lengthSq() < 1e-4) s1.set(0, 0, 1); s1.normalize(); s2.crossVectors(ax, s1).normalize();
      for (let i = 0; i < n; i++) {
        if (i >= count) { sw.hide(i); continue; }
        const p = P[i]; const a = at(p, i, time, center, ax, span, spread, speed, wob); const b = at(p, i, time + 0.06, center, ax, span, spread, speed, wob);
        dir.subVectors(b.v, a.v); if (dir.lengthSq() < 1e-9) dir.copy(ax);
        const sc = scale * scaleMul * smooth(a.u / 0.1) * smooth((1 - a.u) / 0.1);
        sw.set(i, a.v, dir, Math.max(sc, 0.0001), p.e * 6);
      }
      sw.commit(time);
    },
    hideAll() { for (let i = 0; i < n; i++) sw.hide(i); sw.commit(0); },
  };
}

// centre (monde) d'une ou plusieurs pièces du modèle masculin
export function partPos(W, group, groups = {
  testis: ['Sphere'], vas: ['polySurface286', 'polySurface286001'], vesicles: ['Plane007', 'Plane008'], prostate: ['bladder'], bladder: ['bladder001'],
  penis: ['Cube001'],
}) {
  W.M.updateMatrixWorld(true);
  const box = new THREE.Box3();
  for (const n of (groups[group] || [group])) { const m = W.S.maleParts[n]; if (m) box.expandByObject(m); }
  return box.getCenter(new V3());
}
export const partBox = (W, names) => { W.M.updateMatrixWorld(true); const b = new THREE.Box3(); names.forEach((n) => W.S.maleParts[n] && b.expandByObject(W.S.maleParts[n])); return b; };

// coordonnées locales de l'utérus -> monde
export const uPos = (W, x, y, z = 0) => new V3(x, y, z).add(W.ST.F);
// lignes centrales approximatives des trompes (coordonnées locales de l'utérus)
export const TUBE_L = [[0, 0.28, 0], [-0.14, 0.4, 0], [-0.32, 0.46, 0], [-0.45, 0.58, 0], [-0.56, 0.69, 0], [-0.72, 0.73, 0], [-0.95, 0.75, 0], [-1.13, 0.73, 0]];
export const TUBE_R = TUBE_L.map(([x, y, z]) => [-x, y, z]);
export const OV_L = [-0.905, 0.33, 0.0], OV_R = [0.93, 0.37, 0.0];

// ---------- échographie ovarienne (canvas 2D) ----------
const speck = (() => { const r = rng(42); return Array.from({ length: 900 }, () => [r(), r(), r(), r()]); })();
export function drawEcho(g, t, fols, { probe = true } = {}) {
  const w = 360, h = 260; g.fillStyle = '#050505'; g.fillRect(0, 0, w, h);
  g.save(); g.beginPath(); g.moveTo(w / 2, 6); g.arc(w / 2, 6, 262, Math.PI * 0.16, Math.PI * 0.84); g.closePath(); g.clip();
  const gr = g.createRadialGradient(w / 2, 6, 10, w / 2, 6, 262); gr.addColorStop(0, '#4a4a4a'); gr.addColorStop(0.6, '#2b2b2b'); gr.addColorStop(1, '#161616');
  g.fillStyle = gr; g.fillRect(0, 0, w, h);
  for (const [x, y, s, a] of speck) { g.fillStyle = `rgba(255,255,255,${0.05 + 0.18 * a * (0.6 + 0.4 * Math.sin(t * 6 + x * 50))})`; g.fillRect(x * w, y * h, 1 + s * 1.6, 1 + s * 1.2); }
  // ovaire
  g.fillStyle = 'rgba(120,120,120,0.35)'; g.beginPath(); g.ellipse(w / 2, 128, 130, 88, 0, 0, 7); g.fill();
  g.strokeStyle = 'rgba(210,210,210,0.55)'; g.lineWidth = 2; g.stroke();
  // follicules (liquide = noir)
  for (const f of fols) {
    const r = f.d * 1.55 * (f.s ?? 1); if (r < 0.5) continue;
    const gg = g.createRadialGradient(f.x, f.y, 0, f.x, f.y, r);
    gg.addColorStop(0, '#000'); gg.addColorStop(0.85, '#050505'); gg.addColorStop(1, 'rgba(230,230,230,0.9)');
    g.fillStyle = gg; g.beginPath(); g.arc(f.x, f.y, r, 0, 7); g.fill();
    g.fillStyle = 'rgba(255,255,255,0.25)'; g.beginPath(); g.arc(f.x + r * 0.55, f.y - r * 0.45, r * 0.16, 0, 7); g.fill();
  }
  g.restore();
  g.strokeStyle = 'rgba(120,255,200,0.35)'; g.lineWidth = 1; g.beginPath(); g.arc(w / 2, 6, 262, Math.PI * 0.16, Math.PI * 0.84); g.stroke();
  g.fillStyle = 'rgba(120,255,200,0.9)'; g.font = '11px Inter, sans-serif'; g.fillText('2D · 7,5 MHz', 8, 16);
}

export { smooth, clamp, lerp, rng };

// onde de choc / éclat (ovulation, fécondation...) ; u in [0,1] (hors de l'intervalle = invisible)
export function makeBurst(W, color = 0xffffff, size = 0.6) {
  const m = new THREE.Mesh(new THREE.SphereGeometry(1, 28, 18), fresnelMat(color, 1.4, 1.8));
  m.visible = false; W.S.scene.add(m);
  m.userData.set = (u, pos) => {
    m.visible = u > 0 && u < 1;
    if (!m.visible) return;
    if (pos) m.position.copy(pos);
    m.scale.setScalar(0.04 + size * (1 - Math.pow(1 - u, 3)));
    m.material.uniforms.uA.value = Math.pow(1 - u, 1.5);
  };
  return m;
}
export const bump = (t, a, b, fi = 0.5, fo = 0.5) => smooth((t - a) / fi) * (1 - smooth((t - (b - fo)) / fo));
