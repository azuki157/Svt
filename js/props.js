// Objets 3D procéduraux : ovocyte, embryon, boîte de Petri, cathéter, paillette, cuve d'azote,
// follicule, micropipettes, pathogènes, histogramme circulaire, flux d'hormones, essaim de spermatozoïdes...
import * as THREE from 'three';
import { makeSpermMaterial } from './stage.js';
import { rng, clamp, lerp, easeInOut } from './util.js';

const V3 = THREE.Vector3;

// ---------- halo de Fresnel (additif) ----------
export function fresnelMat(color = 0xffffff, power = 2.5, intensity = 1.2) {
  return new THREE.ShaderMaterial({
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, fog: false,
    uniforms: { uC: { value: new THREE.Color(color) }, uP: { value: power }, uI: { value: intensity }, uA: { value: 1 } },
    vertexShader: 'varying vec3 vN; varying vec3 vV; void main(){ vec4 mv = modelViewMatrix*vec4(position,1.0); vN = normalize(normalMatrix*normal); vV = normalize(-mv.xyz); gl_Position = projectionMatrix*mv; }',
    fragmentShader: 'varying vec3 vN; varying vec3 vV; uniform vec3 uC; uniform float uP; uniform float uI; uniform float uA; void main(){ float f = pow(1.0 - abs(dot(normalize(vN), normalize(vV))), uP); gl_FragColor = vec4(uC*f*uI, f*uA); }',
  });
}
// permet à setFade de moduler aussi ces halos
function patchFade(mat) { Object.defineProperty(mat, 'opacity', { get() { return mat.uniforms.uA.value; }, set(v) { mat.uniforms.uA.value = v; } }); return mat; }
export function glowShell(radius, color, power = 2.5, intensity = 1.2) {
  const m = patchFade(fresnelMat(color, power, intensity));
  return new THREE.Mesh(new THREE.SphereGeometry(radius, 48, 32), m);
}

// ---------- texture granuleuse du cytoplasme ----------
function granTex(base = '#e9c08a', seed = 3) {
  const c = document.createElement('canvas'); c.width = 512; c.height = 256; const g = c.getContext('2d');
  g.fillStyle = base; g.fillRect(0, 0, 512, 256);
  const r = rng(seed);
  for (let i = 0; i < 2600; i++) {
    const x = r() * 512, y = r() * 256, s = 1 + r() * 3.2;
    g.fillStyle = r() < 0.5 ? 'rgba(255,240,200,0.28)' : 'rgba(120,70,20,0.22)';
    g.beginPath(); g.arc(x, y, s, 0, 7); g.fill();
  }
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.wrapS = THREE.RepeatWrapping; return t;
}

// ---------- OVOCYTE ----------
export function makeOocyte(R = 1, { corona = false } = {}) {
  const g = new THREE.Group();
  const cyto = new THREE.Mesh(new THREE.SphereGeometry(R * 0.84, 48, 32),
    new THREE.MeshPhysicalMaterial({ map: granTex(), roughness: 0.5, clearcoat: 0.4, emissive: 0x5a3010, emissiveIntensity: 0.25 }));
  const zona = new THREE.Mesh(new THREE.SphereGeometry(R, 48, 32),
    new THREE.MeshPhysicalMaterial({ color: 0xffd9a0, transparent: true, opacity: 0.2, roughness: 0.12, clearcoat: 1, depthWrite: false }));
  const halo = glowShell(R * 1.03, 0xffc47a, 3, 0.9);
  const polar = new THREE.Mesh(new THREE.SphereGeometry(R * 0.1, 24, 16), new THREE.MeshStandardMaterial({ color: 0xffe7c2, roughness: 0.5 }));
  polar.position.set(0, R * 0.91, 0);
  const pn = new THREE.Group(); const pm = new THREE.MeshPhysicalMaterial({ color: 0xbfefff, emissive: 0x4fd0ff, emissiveIntensity: 0.9, roughness: 0.2, transparent: true, opacity: 0.95, depthTest: false });
  for (const sx of [-1, 1]) { const m = new THREE.Mesh(new THREE.SphereGeometry(R * 0.17, 20, 16), pm); m.position.set(sx * R * 0.24, 0, 0); m.renderOrder = 20; pn.add(m); }
  pn.scale.setScalar(0.001); pn.visible = false;
  g.add(cyto, zona, halo, polar, pn);
  g.userData = { cyto, zona, halo, polar, pn, R };
  if (corona) {
    const cc = new THREE.Group(); const r = rng(11);
    const mat = new THREE.MeshStandardMaterial({ color: 0xf2c4b0, roughness: 0.55, transparent: true, opacity: 0.85 });
    for (let i = 0; i < 120; i++) {
      const y = 1 - (i + 0.5) / 120 * 2, rr = Math.sqrt(1 - y * y), th = i * 2.399963;
      const m = new THREE.Mesh(new THREE.SphereGeometry(R * (0.065 + r() * 0.035), 10, 8), mat);
      m.position.set(Math.cos(th) * rr, y, Math.sin(th) * rr).multiplyScalar(R * (1.07 + r() * 0.1));
      cc.add(m);
    }
    g.add(cc); g.userData.corona = cc;
  }
  return g;
}

// ---------- EMBRYON : segmentation 1 -> 2 -> 4 -> 8 cellules ----------
const TET = [[-1, 1, -1], [-1, -1, 1], [1, 1, 1], [1, -1, -1]].map((a) => new V3(...a).normalize());
function stagePositions(s, R) {
  const r1 = R * 0.8;
  if (s === 1) return { r: r1, p: [new V3()] };
  if (s === 2) { const r = r1 * Math.pow(2, -1 / 3); return { r, p: [new V3(-r, 0, 0), new V3(r, 0, 0)] }; }
  if (s === 4) { const r = r1 * Math.pow(4, -1 / 3); return { r, p: TET.map((d) => d.clone().multiplyScalar(r * 1.2247)) }; }
  const r = r1 * Math.pow(8, -1 / 3); const p = [];
  for (let i = 0; i < 4; i++) for (const sz of [1, -1]) { const d = TET[i]; p.push(new V3(Math.sign(d.x), Math.sign(d.y), sz).multiplyScalar(r)); }
  return { r, p };
}
export function makeEmbryo(R = 1) {
  const g = new THREE.Group();
  const mat = new THREE.MeshPhysicalMaterial({ color: 0xf6d9b0, roughness: 0.42, clearcoat: 0.5, emissive: 0x6b3a14, emissiveIntensity: 0.3 });
  const cells = [];
  for (let i = 0; i < 8; i++) { const m = new THREE.Mesh(new THREE.SphereGeometry(1, 32, 24), mat); cells.push(m); g.add(m); }
  const zona = new THREE.Mesh(new THREE.SphereGeometry(R, 40, 28),
    new THREE.MeshPhysicalMaterial({ color: 0xffd9a0, transparent: true, opacity: 0.18, roughness: 0.1, clearcoat: 1, depthWrite: false }));
  const halo = glowShell(R * 1.03, 0xffc47a, 3, 0.8);
  g.add(zona, halo);
  g.userData = { cells, zona, halo, R };
  setEmbryoProgress(g, 0);
  return g;
}
// p dans [0,3] : 0 = 1 cellule, 1 = 2 cellules, 2 = 4 cellules, 3 = 8 cellules (division progressive entre les paliers)
export function setEmbryoProgress(g, p) {
  const { cells, R } = g.userData;
  p = clamp(p, 0, 3);
  const L = Math.min(2, Math.floor(p)); const f = p >= 3 ? 1 : p - Math.floor(p);
  const s0 = 1 << L, s1 = s0 * 2; const A = stagePositions(s0, R), B = stagePositions(s1, R); const e = easeInOut(f);
  cells.forEach((m, i) => {
    if (i >= s1) { m.visible = false; return; }
    m.visible = true;
    m.position.lerpVectors(A.p[i >> 1], B.p[i], e);
    const r = lerp(A.r, B.r, e) * (1 + 0.06 * Math.sin(Math.PI * e));
    m.scale.setScalar(r * 0.97);
  });
}

// ---------- ESSAIM DE SPERMATOZOÏDES (instances) ----------
export class Swarm {
  constructor(S, n, { amp = 1, cut = 1, head = 1, color = 0xf4eee4, emissive = 0x2a4a7a } = {}) {
    this.S = S; this.n = n;
    this.mat = makeSpermMaterial({ amp, cut, head, color, emissive });
    this.mesh = new THREE.InstancedMesh(S.spermGeo, this.mat, n);
    this.mesh.frustumCulled = false;
    this.mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    this.o = new THREE.Object3D(); this.q = new THREE.Quaternion(); this.fwd = new V3(1, 0, 0);
    this.group = new THREE.Group(); this.group.add(this.mesh);
  }
  set(i, pos, dir, scale, roll = 0) {
    const o = this.o; o.position.copy(pos);
    this.q.setFromUnitVectors(this.fwd, dir.clone().normalize());
    o.quaternion.copy(this.q);
    if (roll) o.rotateX(roll);
    o.scale.setScalar(scale); o.updateMatrix();
    this.mesh.setMatrixAt(i, o.matrix);
  }
  hide(i) { this.o.position.set(0, -999, 0); this.o.scale.setScalar(0.0001); this.o.updateMatrix(); this.mesh.setMatrixAt(i, this.o.matrix); }
  commit(time) { this.mat.userData.U.uTime.value = time; this.mesh.instanceMatrix.needsUpdate = true; }
}

// ---------- BOÎTE DE PÉTRI ----------
export function makePetri(R = 1.7) {
  const g = new THREE.Group();
  const glass = (op) => new THREE.MeshPhysicalMaterial({ color: 0xcfe9ff, transparent: true, opacity: op, roughness: 0.05, clearcoat: 1, depthWrite: false, side: THREE.DoubleSide });
  const base = new THREE.Mesh(new THREE.CylinderGeometry(R, R, 0.05, 72), glass(0.28));
  const wall = new THREE.Mesh(new THREE.CylinderGeometry(R, R, 0.32, 72, 1, true), glass(0.2)); wall.position.y = 0.16;
  const medium = new THREE.Mesh(new THREE.CylinderGeometry(R * 0.965, R * 0.965, 0.1, 72),
    new THREE.MeshPhysicalMaterial({ color: 0xff9bb8, transparent: true, opacity: 0.4, roughness: 0.1, emissive: 0xff5d8f, emissiveIntensity: 0.18, depthWrite: false }));
  medium.position.y = 0.08;
  const lid = new THREE.Group();
  const lidTop = new THREE.Mesh(new THREE.CylinderGeometry(R * 1.05, R * 1.05, 0.04, 72), glass(0.22)); lidTop.position.y = 0.4;
  const lidWall = new THREE.Mesh(new THREE.CylinderGeometry(R * 1.05, R * 1.05, 0.14, 72, 1, true), glass(0.18)); lidWall.position.y = 0.33;
  lid.add(lidTop, lidWall);
  const rim = new THREE.Mesh(new THREE.TorusGeometry(R, 0.012, 8, 96), new THREE.MeshBasicMaterial({ color: 0x9fe6ff, transparent: true, opacity: 0.6 }));
  rim.rotation.x = Math.PI / 2; rim.position.y = 0.32;
  g.add(base, wall, medium, lid, rim);
  g.userData = { lid, medium, R };
  return g;
}

// ---------- CATHÉTER (tube qui se déploie le long d'une courbe) ----------
export function makeCatheter(points, radius = 0.028, color = 0x7de8ff) {
  const curve = new THREE.CatmullRomCurve3(points);
  const seg = 120, rad = 10;
  const geo = new THREE.TubeGeometry(curve, seg, radius, rad, false);
  const mat = new THREE.MeshPhysicalMaterial({ color, transparent: true, opacity: 0.85, roughness: 0.15, clearcoat: 1, emissive: color, emissiveIntensity: 0.25 });
  const mesh = new THREE.Mesh(geo, mat);
  const tip = new THREE.Mesh(new THREE.SphereGeometry(radius * 1.15, 16, 12), new THREE.MeshStandardMaterial({ color: 0xffffff, emissive: 0x7de8ff, emissiveIntensity: 0.9 }));
  const g = new THREE.Group(); g.add(mesh, tip);
  g.userData = { curve, mesh, tip, total: geo.index.count };
  setCatheter(g, 0);
  return g;
}
export function setCatheter(g, p) {
  const { curve, mesh, tip, total } = g.userData; p = clamp(p);
  const per = 10 * 6; // indices par segment de tube
  mesh.geometry.setDrawRange(0, Math.floor((total * p) / per) * per);
  tip.position.copy(curve.getPointAt(Math.max(p, 0.0001)));
  tip.visible = p > 0.001;
}

// ---------- PAILLETTE (sperme congelé) ----------
export function makeStraw(len = 1.1, color = 0xffd27a) {
  const g = new THREE.Group();
  const shell = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, len, 16, 1, true),
    new THREE.MeshPhysicalMaterial({ color: 0xdff3ff, transparent: true, opacity: 0.35, roughness: 0.08, clearcoat: 1, side: THREE.DoubleSide, depthWrite: false }));
  const fill = new THREE.Mesh(new THREE.CylinderGeometry(0.038, 0.038, len * 0.55, 16),
    new THREE.MeshStandardMaterial({ color, emissive: color, emissiveIntensity: 0.35, roughness: 0.3 })); fill.position.y = -len * 0.12;
  const plug = new THREE.Mesh(new THREE.CylinderGeometry(0.052, 0.052, len * 0.12, 16), new THREE.MeshStandardMaterial({ color: 0xf2f2f2, roughness: 0.6 })); plug.position.y = len * 0.44;
  g.add(shell, fill, plug); return g;
}

// ---------- CUVE D'AZOTE LIQUIDE (dewar) ----------
export function makeDewar() {
  const g = new THREE.Group();
  const prof = [[0.01, 0], [0.9, 0.0], [1.05, 0.2], [1.1, 0.6], [1.1, 2.5], [1.02, 2.7], [0.86, 2.76], [0.82, 2.7], [0.95, 2.56], [0.98, 0.7], [0.01, 0.55]].map(([x, y]) => new THREE.Vector2(x, y));
  const body = new THREE.Mesh(new THREE.LatheGeometry(prof, 56),
    new THREE.MeshStandardMaterial({ color: 0xb9c6d8, metalness: 1, roughness: 0.3, side: THREE.DoubleSide }));
  const liquid = new THREE.Mesh(new THREE.CircleGeometry(0.93, 48), new THREE.MeshStandardMaterial({ color: 0x9fe8ff, emissive: 0x38c8ff, emissiveIntensity: 1.6, roughness: 0.15, transparent: true, opacity: 0.95 }));
  liquid.rotation.x = -Math.PI / 2; liquid.position.y = 2.4;
  g.add(body, liquid);
  g.userData = { liquid };
  return g;
}
// brume froide qui déborde de la cuve
export function makeMist(n = 90) {
  const pos = new Float32Array(n * 3); const geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  const c = document.createElement('canvas'); c.width = c.height = 64; const x = c.getContext('2d');
  const gr = x.createRadialGradient(32, 32, 0, 32, 32, 32); gr.addColorStop(0, 'rgba(210,240,255,0.55)'); gr.addColorStop(1, 'rgba(210,240,255,0)'); x.fillStyle = gr; x.fillRect(0, 0, 64, 64);
  const tex = new THREE.CanvasTexture(c);
  const pts = new THREE.Points(geo, new THREE.PointsMaterial({ map: tex, size: 0.7, transparent: true, depthWrite: false, opacity: 0.5, blending: THREE.AdditiveBlending, color: 0xaee6ff, fog: false }));
  const r = rng(5); const seeds = Array.from({ length: n }, () => [r(), r(), r()]);
  pts.userData.update = (t, level = 1) => {
    const a = geo.attributes.position;
    for (let i = 0; i < n; i++) {
      const [s0, s1, s2] = seeds[i]; const f = (s0 + t * 0.12 * (0.6 + s1)) % 1;
      const ang = s2 * 6.283 + f * 2.0; const rad = 0.2 + f * 1.3 * (0.4 + s1);
      a.setXYZ(i, Math.cos(ang) * rad * 0.8, 2.1 + f * 0.15 - f * f * 1.4, Math.sin(ang) * rad * 0.8);
    }
    a.needsUpdate = true; pts.material.opacity = 0.5 * level;
  };
  pts.frustumCulled = false; return pts;
}

// ---------- FOLLICULE ovarien ----------
export function makeFollicle(R = 0.3) {
  const g = new THREE.Group();
  const fluid = new THREE.Mesh(new THREE.SphereGeometry(R, 40, 28),
    new THREE.MeshPhysicalMaterial({ color: 0xa8dcff, transparent: true, opacity: 0.3, roughness: 0.05, clearcoat: 1, emissive: 0x2a7fc0, emissiveIntensity: 0.35, depthWrite: false }));
  const halo = glowShell(R * 1.04, 0x7cc8ff, 2.6, 1.0);
  const oo = makeOocyte(R * 0.28, { corona: true }); oo.position.set(R * 0.38, R * 0.2, R * 0.1);
  g.add(fluid, halo, oo);
  g.userData = { fluid, halo, oo, R };
  return g;
}

// ---------- MICROPIPETTES (ICSI) ----------
export function makePipette(tipR = 0.06, baseR = 0.22, len = 3.2, hollow = true) {
  const pts = [new THREE.Vector2(tipR, 0), new THREE.Vector2(tipR * 1.05, len * 0.35), new THREE.Vector2(baseR, len * 0.85), new THREE.Vector2(baseR, len)];
  const geo = new THREE.LatheGeometry(pts, 32);
  const mat = new THREE.MeshPhysicalMaterial({ color: 0xcfeeff, transparent: true, opacity: 0.34, roughness: 0.05, clearcoat: 1, side: THREE.DoubleSide, depthWrite: false, emissive: 0x4aa8d8, emissiveIntensity: 0.12 });
  const m = new THREE.Mesh(geo, mat);
  const g = new THREE.Group(); g.add(m);
  if (hollow) { const edge = new THREE.Mesh(new THREE.TorusGeometry(tipR, 0.008, 8, 28), new THREE.MeshBasicMaterial({ color: 0xbfeaff })); edge.rotation.x = Math.PI / 2; g.add(edge); }
  return g; // pointe en y=0, s'allonge vers +y
}

// ---------- PATHOGÈNE (infection des trompes) ----------
export function makePathogen(R = 0.14) {
  const geo = new THREE.IcosahedronGeometry(R, 1); const p = geo.attributes.position;
  for (let i = 0; i < p.count; i++) { const v = new V3().fromBufferAttribute(p, i); const k = (i * 7919 % 5 === 0) ? 1.55 : 1.0; p.setXYZ(i, v.x * k, v.y * k, v.z * k); }
  geo.computeVertexNormals();
  return new THREE.Mesh(geo, new THREE.MeshStandardMaterial({ color: 0x7bd84a, emissive: 0x2d8a1c, emissiveIntensity: 0.6, roughness: 0.4, flatShading: true }));
}

// ---------- FLUX DE PARTICULES le long d'une courbe (hormones) ----------
export function makeStream(curve, n = 70, color = 0xffb84d, size = 0.14) {
  const geo = new THREE.BufferGeometry(); const pos = new Float32Array(n * 3); geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  const c = document.createElement('canvas'); c.width = c.height = 64; const x = c.getContext('2d');
  const gr = x.createRadialGradient(32, 32, 0, 32, 32, 32); gr.addColorStop(0, 'rgba(255,255,255,1)'); gr.addColorStop(0.35, 'rgba(255,255,255,0.55)'); gr.addColorStop(1, 'rgba(255,255,255,0)');
  x.fillStyle = gr; x.fillRect(0, 0, 64, 64);
  const pts = new THREE.Points(geo, new THREE.PointsMaterial({ map: new THREE.CanvasTexture(c), size, color, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, fog: false }));
  pts.frustumCulled = false;
  const r = rng(9); const off = Array.from({ length: n }, () => [r(), (r() - 0.5) * 0.18, (r() - 0.5) * 0.18, (r() - 0.5) * 0.18]);
  const tmp = new V3();
  pts.userData.update = (t, reach = 1, speed = 0.25) => {
    const a = geo.attributes.position;
    for (let i = 0; i < n; i++) {
      const f = ((off[i][0] + t * speed) % 1) * reach;
      curve.getPointAt(clamp(f, 0, 0.9999), tmp);
      a.setXYZ(i, tmp.x + off[i][1], tmp.y + off[i][2], tmp.z + off[i][3]);
    }
    a.needsUpdate = true;
  };
  return pts;
}

// ---------- HISTOGRAMME CIRCULAIRE 3D ----------
export function makeDonut(data, { R = 1.55, r = 0.82, depth = 0.34 } = {}) {
  const g = new THREE.Group(); const total = data.reduce((s, d) => s + d.v, 0);
  let a0 = Math.PI / 2; const segs = [];
  data.forEach((d, i) => {
    const sweep = (d.v / total) * Math.PI * 2; const a1 = a0 - sweep; const gap = 0.012;
    const sh = new THREE.Shape(); const A0 = a0 - gap, A1 = a1 + gap; const N = Math.max(6, Math.ceil(sweep * 14));
    for (let k = 0; k <= N; k++) { const a = lerp(A0, A1, k / N); const x = Math.cos(a) * R, y = Math.sin(a) * R; k ? sh.lineTo(x, y) : sh.moveTo(x, y); }
    for (let k = N; k >= 0; k--) { const a = lerp(A0, A1, k / N); sh.lineTo(Math.cos(a) * r, Math.sin(a) * r); }
    const geo = new THREE.ExtrudeGeometry(sh, { depth, bevelEnabled: true, bevelSize: 0.03, bevelThickness: 0.03, bevelSegments: 3, curveSegments: 4 });
    geo.translate(0, 0, -depth / 2);
    const mat = new THREE.MeshPhysicalMaterial({ color: d.color, roughness: 0.3, metalness: 0.15, clearcoat: 0.7, emissive: d.color, emissiveIntensity: 0.12 });
    const m = new THREE.Mesh(geo, mat); const mid = (a0 + a1) / 2;
    m.userData = { dir: new V3(Math.cos(mid), Math.sin(mid), 0), mid };
    g.add(m); segs.push(m); a0 = a1;
  });
  g.userData = { segs };
  return g;
}

// ---------- OBSTACLE (infection / bouchon) : amas de pathogènes + sécrétions ----------
export function makePlug() {
  const g = new THREE.Group(); const r = rng(21);
  for (let i = 0; i < 7; i++) { const p = makePathogen(0.05 + r() * 0.03); p.position.set((r() - 0.5) * 0.16, (r() - 0.5) * 0.1, (r() - 0.5) * 0.1); g.add(p); }
  const blob = new THREE.Mesh(new THREE.SphereGeometry(0.1, 20, 16), new THREE.MeshStandardMaterial({ color: 0x6a1f2a, emissive: 0xff2a3a, emissiveIntensity: 0.7, roughness: 0.5 }));
  blob.scale.set(1.2, 0.9, 0.9); g.add(blob);
  return g;
}

// ---------- CAVITÉ UTÉRINE (schématique, visible en mode fantôme) ----------
export function makeCavity() {
  const sh = new THREE.Shape();
  sh.moveTo(-0.33, 0.44); sh.quadraticCurveTo(0, 0.52, 0.33, 0.44); sh.lineTo(0.06, -0.1); sh.lineTo(0.035, -0.34); sh.lineTo(-0.035, -0.34); sh.lineTo(-0.06, -0.1); sh.closePath();
  const geo = new THREE.ExtrudeGeometry(sh, { depth: 0.16, bevelEnabled: true, bevelSize: 0.05, bevelThickness: 0.06, bevelSegments: 4 });
  geo.translate(0, 0, -0.08);
  const m = new THREE.Mesh(geo, new THREE.MeshPhysicalMaterial({ color: 0xb02a52, transparent: true, opacity: 0.55, roughness: 0.4, emissive: 0x8a1030, emissiveIntensity: 0.5, depthWrite: false }));
  const g = new THREE.Group(); g.add(m);
  // canal vaginal (lumière)
  const lum = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.22, 0.56, 24, 1, true), new THREE.MeshStandardMaterial({ color: 0x8c1d3b, emissive: 0x5a0f26, emissiveIntensity: 0.5, side: THREE.BackSide, transparent: true, opacity: 0.55, depthWrite: false }));
  lum.position.y = -0.62; g.add(lum);
  return g;
}

// ---------- hypothalamus / hypophyse stylisés ----------
export function makeHypo() {
  const g = new THREE.Group();
  const m1 = new THREE.MeshPhysicalMaterial({ color: 0xffb84d, emissive: 0xff8a1f, emissiveIntensity: 0.7, roughness: 0.35, clearcoat: 0.6 });
  const hy = new THREE.Mesh(new THREE.SphereGeometry(0.2, 32, 24), m1); hy.position.y = 0.3;
  const stalk = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.045, 0.28, 12), m1); stalk.position.y = 0.04;
  const pit = new THREE.Mesh(new THREE.SphereGeometry(0.13, 28, 20), new THREE.MeshPhysicalMaterial({ color: 0xc89bff, emissive: 0x8a4dff, emissiveIntensity: 0.8, roughness: 0.35, clearcoat: 0.6 })); pit.position.y = -0.2;
  const halo = glowShell(0.36, 0xffb84d, 2.2, 1.0); halo.position.y = 0.22;
  g.add(hy, stalk, pit, halo);
  g.userData = { hy, pit };
  return g;
}

// ---------- histogramme de barres ----------
export function makeBar(color, w = 0.5, d = 0.5) {
  const geo = new THREE.BoxGeometry(w, 1, d); geo.translate(0, 0.5, 0);
  const m = new THREE.Mesh(geo, new THREE.MeshPhysicalMaterial({ color, roughness: 0.3, clearcoat: 0.6, emissive: color, emissiveIntensity: 0.18, metalness: 0.1 }));
  m.scale.y = 0.001; return m;
}

export function setPronuclei(g, a) { const pn = g.userData.pn; pn.visible = a > 0.01; pn.scale.setScalar(Math.max(0.001, a)); }
