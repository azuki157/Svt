// Moteur du diaporama : chronologie déterministe, caméra, fondus, étiquettes 3D, interface.
import * as THREE from 'three';
import { createStage, ST, COL, setFade } from './stage.js';
import { clamp, lerp, easeInOut, easeOut } from './util.js';
import { buildSlides } from './slides.js';

const $ = (s) => document.querySelector(s);
const q = new URLSearchParams(location.search);
const EXPORT = q.has('export');
if (EXPORT) document.body.classList.add('export');
const V3 = THREE.Vector3;
const hexs = (c) => '#' + c.toString(16).padStart(6, '0');

const LIGHT = q.has('light'); // mode "rendu clair" : fond transparent (utilisé pour les illustrations du PowerPoint)
const S = await createStage($('#gl'), {
  alpha: LIGHT, width: innerWidth, height: innerHeight, dpr: EXPORT ? 1 : Math.min(2, window.devicePixelRatio || 1),
  onProgress: (p) => { $('#loadtxt').textContent = `Chargement des modèles 3D… ${Math.round(p * 100)} %`; },
});

// ================= monde partagé avec les slides =================
const reg = new Map();   // objet -> niveau de fondu courant
const tgt = new Map();   // objet -> niveau cible (cette frame)
const W = {
  S, THREE, ST, COL, setFade, V3,
  t: 0, time: 0, dt: 1 / 60, idx: 0, dur: 10,
  add(obj, parent = S.scene) { parent.add(obj); setFade(obj, 0); reg.set(obj, 0); return obj; },
  show(obj, a = 1) { tgt.set(obj, Math.max(tgt.get(obj) || 0, a)); },
  U: S.uterus, M: S.male, LIGHT,
};
S.uterus.position.copy(ST.F); S.male.position.copy(ST.M);
W.add(S.uterus); W.add(S.male);
const platF = W.add(S.makePlatform(COL.fem, 2.2)); platF.position.copy(ST.F).y = -1.02;
const platM = W.add(S.makePlatform(COL.mal, 2.3)); platM.position.copy(ST.M).y = S.maleBox.min.y - 0.06;
const platL = W.add(S.makePlatform(COL.lab, 3.6)); platL.position.copy(ST.L).y = -1.02;
if (LIGHT) { S.sky.visible = false; S.dust.visible = false; S.scene.fog = null; for (const p of [platF, platM, platL]) p.children.forEach((c) => { c.visible = false; }); }
W.platF = platF; W.platM = platM; W.platL = platL;

// ---------- mise en évidence ----------
const MG = {
  testis: ['Sphere'], vas: ['polySurface286', 'polySurface286001'], vesicles: ['Plane007', 'Plane008'],
  prostate: ['bladder'], bladder: ['bladder001'],
  penis: ['Cube001', 'Cube', 'Cube002', 'Plane001', 'Plane003', 'Plane004', 'Plane005'], vessels: ['Plane006', 'Plane002'],
};
W.hiUterus = (zones, dim = 0) => {
  const hi = S.uterusMat.userData.hi;
  for (const [z, [c, k]] of Object.entries(zones)) { const C = new THREE.Color(c); hi[+z].set(C.r * k, C.g * k, C.b * k); }
  S.uterusMat.userData.dimU.value = dim;
};
W.ghostUterus = (v) => {
  const m = S.uterusMat; m.userData.ghostU.value = v;
  m.transparent = v > 0.01 || m.opacity < 0.999; m.depthWrite = v < 0.01;
  S.uterusMesh.renderOrder = v > 0.01 ? -1 : 0;
};
const resetHi = () => {
  S.uterusMat.userData.hi.forEach((v) => v.set(0, 0, 0)); S.uterusMat.userData.dimU.value = 0;
  for (const m of Object.values(S.maleParts)) { m.material.emissive.setRGB(0, 0, 0); m.material.color.copy(m.material.userData.baseColor); }
};
W.hiMale = (groups, color, k = 0.8, dim = 0.55) => {
  const on = new Set(groups.flatMap((g) => MG[g] || [g]));
  for (const [n, m] of Object.entries(S.maleParts)) {
    if (on.has(n)) { m.material.emissive.set(color); m.material.emissiveIntensity = k; }
    else m.material.color.copy(m.material.userData.baseColor).multiplyScalar(1 - dim);
  }
};

// ---------- caméra ----------
const cur = { p: new V3(5, 2, 24), l: new V3(5, 0, 0), fov: 40 };  // pose finale (affichée)
const want = { p: new V3(), l: new V3(), fov: 40 };                // pose voulue par la slide
let entry = { p: cur.p.clone(), l: cur.l.clone(), fov: cur.fov };
W.shift = 0; // décalage latéral du sujet (fraction de la largeur d'écran, >0 = sujet vers la droite)
W.setCam = (p, l, fov = 40) => {
  want.p.set(...p); want.l.set(...l); want.fov = fov;
  if (W.shift) {
    const dir = want.l.clone().sub(want.p); const d = dir.length();
    const right = dir.normalize().cross(new V3(0, 1, 0)).normalize();
    const off = W.shift * 2 * d * Math.tan(THREE.MathUtils.degToRad(fov) / 2) * (innerWidth / innerHeight);
    want.p.addScaledVector(right, -off); want.l.addScaledVector(right, -off);
  }
};
const herm = (p0, p1, m0, m1, u) => { const u2 = u * u, u3 = u2 * u; return (2 * u3 - 3 * u2 + 1) * p0 + (u3 - 2 * u2 + u) * m0 + (-2 * u3 + 3 * u2) * p1 + (u3 - u2) * m1; };
W.camKeys = (t, keys) => {
  const n = keys.length; let i = 0;
  while (i < n - 2 && t > keys[i + 1][0]) i++;
  const k0 = keys[i], k1 = keys[Math.min(i + 1, n - 1)];
  const dtk = Math.max(1e-4, k1[0] - k0[0]); const u = clamp((t - k0[0]) / dtk);
  const kp = keys[Math.max(i - 1, 0)], kn = keys[Math.min(i + 2, n - 1)];
  const out = { p: [0, 0, 0], l: [0, 0, 0], fov: 0 };
  for (let a = 0; a < 3; a++) {
    for (const [name, idx] of [['p', 1], ['l', 2]]) {
      const m0 = i === 0 ? 0 : (k1[idx][a] - kp[idx][a]) / Math.max(1e-4, k1[0] - kp[0]);
      const m1 = i + 1 >= n - 1 ? 0 : (kn[idx][a] - k0[idx][a]) / Math.max(1e-4, kn[0] - k0[0]);
      out[name][a] = herm(k0[idx][a], k1[idx][a], m0 * dtk, m1 * dtk, u);
    }
  }
  out.fov = lerp(k0[3] ?? 40, k1[3] ?? 40, u * u * (3 - 2 * u));
  W.setCam(out.p, out.l, out.fov);
};

// ---------- étiquettes 3D ----------
const labEls = new Map(); const used = new Set(); const tmpV = new V3();
W.label = (id, html, pos, { a = 1, color = 0xffffff, dx = 46, dy = -34, right = false, big = false } = {}) => {
  let e = labEls.get(id);
  if (!e) {
    const el = document.createElement('div'); el.className = 'lab'; el.innerHTML = '<i class="dot"></i><b class="ln"></b><span class="pill"></span>';
    $('#labels').appendChild(el); e = { el, pill: el.querySelector('.pill'), ln: el.querySelector('.ln'), html: '' }; labEls.set(id, e);
  }
  if (e.html !== html) { e.pill.innerHTML = html; e.html = html; }
  e.el.className = 'lab' + (right ? ' right' : '') + (big ? ' big' : '');
  e.el.style.setProperty('--c', hexs(color));
  e.a = a; e.pos = pos; e.dx = dx; e.dy = dy; used.add(id);
};
function placeLabels() {
  const w = innerWidth, h = innerHeight;
  for (const [id, e] of labEls) {
    if (!used.has(id) || e.a < 0.01) { e.el.style.opacity = 0; continue; }
    tmpV.copy(e.pos).project(S.camera);
    if (tmpV.z > 1 || tmpV.z < -1) { e.el.style.opacity = 0; continue; }
    const x = (tmpV.x * 0.5 + 0.5) * w, y = (-tmpV.y * 0.5 + 0.5) * h;
    e.el.style.transform = `translate(${x}px,${y}px)`; e.el.style.opacity = e.a;
    const len = Math.hypot(e.dx, e.dy);
    e.ln.style.width = len + 'px'; e.ln.style.transform = `rotate(${Math.atan2(e.dy, e.dx)}rad)`;
    e.pill.style.left = e.dx + 'px'; e.pill.style.top = e.dy + 'px';
  }
  used.clear();
}

// ---------- échographie (canvas 2D) ----------
W.echoCtx = $('#echoc').getContext('2d');

// ================= diaporama =================
const slides = buildSlides(W);
const N = slides.length;
for (const s of slides) s.init && s.init(W);
// pré-compilation des shaders (évite les saccades au premier affichage)
for (const o of reg.keys()) { o.userData._fade = -1; setFade(o, 1); }
S.render();
for (const o of reg.keys()) { o.userData._fade = -1; setFade(o, 0); }

const dots = $('#dots');
slides.forEach((s, i) => { const d = document.createElement('i'); d.innerHTML = '<b></b>'; d.title = s.ui.title.replace(/<[^>]+>/g, ''); d.onclick = () => goto(i); dots.appendChild(d); });
let auto = EXPORT, notes = EXPORT, cap = '';
let cur_i = -1, slide = null, rvEls = [], statEls = [];

function buildUI(s) {
  const ui = s.ui;
  document.documentElement.style.setProperty('--acc', hexs(s.accent ?? COL.fem));
  const panel = $('#panel');
  panel.className = 'glass ' + (ui.side || 'left') + (ui.low ? ' low' : '') + (ui.wide ? ' wide' : '') + (ui.dense ? ' dense' : '') + (ui.hidden ? ' hidden' : '');
  $('#kicker').textContent = ui.kicker || '';
  $('#title').innerHTML = ui.title;
  $('#items').innerHTML = (ui.items || []).map((it) => `<li class="rv ${it.cls || ''}" data-at="${it.at}">${it.html}</li>`).join('');
  $('#stats').innerHTML = (ui.stats || []).map((st) => `<div class="stat rv ${st.wide ? 'wide' : ''}" data-at="${st.at}" data-v="${st.v}" data-dec="${st.dec || 0}" data-suf="${st.suf || ''}" data-pre="${st.pre || ''}" data-txt="${st.txt || ''}"><div class="v ${st.txt ? 'txt' : ''}" style="color:${hexs(st.color ?? s.accent ?? COL.fem)}">${st.txt || 0}</div><div class="l">${st.label}</div></div>`).join('');
  $('#src').textContent = ui.src || '';
  $('#echo').style.display = s.echo ? 'block' : 'none';
  $('#echo-cap').textContent = '';
  rvEls = [...document.querySelectorAll('#panel .rv')];
  statEls = [...document.querySelectorAll('#stats .stat')];
  cap = s.narration || '';
  const c = $('#caption'); c.textContent = cap; c.classList.toggle('has', !!cap);
}
function goto(i) {
  if (i < 0 || i >= N || i === cur_i) return;
  slide && slide.exit && slide.exit(W);
  cur_i = i; slide = slides[i]; W.idx = i; W.t = 0; W.dur = slide.dur;
  entry = { p: cur.p.clone(), l: cur.l.clone(), fov: cur.fov };
  buildUI(slide);
  $('#count').textContent = String(i + 1).padStart(2, '0') + ' / ' + String(N).padStart(2, '0');
  [...dots.children].forEach((d, k) => { d.className = k < i ? 'done' : k === i ? 'cur' : ''; });
  W.shift = window.__noShift ? 0 : (slide.shift ?? 0);
  document.body.classList.toggle('scope', !!slide.scope);
  slide.enter && slide.enter(W);
  if (location.hash !== '#' + (i + 1) && !EXPORT) history.replaceState(null, '', '#' + (i + 1));
}
const next = () => goto(Math.min(N - 1, cur_i + 1));
const prev = () => goto(Math.max(0, cur_i - 1));

const bgTop = new THREE.Color(), bgBot = new THREE.Color();
let px = 0, py = 0, spx = 0, spy = 0;

function step(dt) {
  W.dt = dt; W.time += dt; W.t += dt; S.time = W.time;
  resetHi();
  want.fov = 40;
  slide.update(W, W.t);
  // caméra : blend d'entrée + dérive douce + parallaxe souris
  const bd = slide.blend ?? 1.8; const b = easeInOut(W.t / bd);
  const dist = entry.p.distanceTo(want.p); const arc = dist * 0.07 * Math.sin(Math.PI * b);
  cur.p.lerpVectors(entry.p, want.p, b); cur.p.y += arc * 0.7; cur.p.z += arc;
  cur.l.lerpVectors(entry.l, want.l, b); cur.fov = lerp(entry.fov, want.fov, b);
  cur.p.x += Math.sin(W.time * 0.31) * 0.03; cur.p.y += Math.cos(W.time * 0.23) * 0.02;
  spx += (px - spx) * Math.min(1, dt * 3); spy += (py - spy) * Math.min(1, dt * 3);
  const off = cur.p.clone().sub(cur.l);
  const sph = new THREE.Spherical().setFromVector3(off); sph.theta += spx * 0.12; sph.phi = clamp(sph.phi - spy * 0.06, 0.2, 2.9);
  off.setFromSpherical(sph);
  S.camera.position.copy(cur.l).add(off); S.camera.lookAt(cur.l);
  if (Math.abs(S.camera.fov - cur.fov) > 1e-3) { S.camera.fov = cur.fov; S.camera.updateProjectionMatrix(); }
  // fond
  const k = 1 - Math.exp(-dt * 1.6);
  bgTop.set(slide.bg?.[0] ?? 0x101a3d); bgBot.set(slide.bg?.[1] ?? 0x05070f);
  S.skyU.uTop.value.lerp(bgTop, k); S.skyU.uBot.value.lerp(bgBot, k);
  if (S.scene.fog) S.scene.fog.color.copy(S.skyU.uBot.value).lerp(S.skyU.uTop.value, 0.12);
  // fondus
  const kf = 1 - Math.exp(-dt * 5);
  for (const [o, lv] of reg) {
    const t = tgt.get(o) || 0; let n = lv + (t - lv) * kf; if (Math.abs(t - n) < 0.004) n = t;
    reg.set(o, n); setFade(o, n);
  }
  tgt.clear();
  // pulsation des anneaux de plateformes
  if (!LIGHT) for (const p of [platF, platM, platL]) p.userData.ring.material.color.setScalar(0.85 + 0.15 * Math.sin(W.time * 2));
  // interface : apparition échelonnée
  for (const el of rvEls) {
    const p = easeOut((W.t - +el.dataset.at) / 0.7);
    el.style.opacity = p; el.style.transform = `translateY(${(1 - p) * 14}px)`;
  }
  for (const el of statEls) {
    if (el.dataset.txt) continue;
    const p = easeOut((W.t - +el.dataset.at) / 1.4); const v = +el.dataset.v, dec = +el.dataset.dec;
    el.querySelector('.v').textContent = el.dataset.pre + (v * p).toFixed(dec).replace('.', ',').replace(/\B(?=(\d{3})+(?!\d))/g, '\u202f') + el.dataset.suf;
  }
  placeLabels();
  // progression & lecture auto
  const bar = dots.children[cur_i] && dots.children[cur_i].firstChild; if (bar) bar.style.width = clamp(W.t / slide.dur) * 100 + '%';
  if (auto && W.t >= slide.dur) { if (cur_i < N - 1) next(); else { auto = false; $('#bPlay').classList.remove('on'); $('#bPlay').textContent = '▶'; window.__finished = true; } }
}

// ---------- entrées utilisateur ----------
$('#bPrev').onclick = prev; $('#bNext').onclick = next;
const setAuto = (v) => { auto = v; $('#bPlay').classList.toggle('on', v); $('#bPlay').textContent = v ? '❚❚' : '▶'; };
$('#bPlay').onclick = () => setAuto(!auto);
$('#bNotes').onclick = () => { notes = !notes; document.body.classList.toggle('notes', notes); $('#bNotes').classList.toggle('on', notes); };
$('#bFull').onclick = () => (document.fullscreenElement ? document.exitFullscreen() : document.documentElement.requestFullscreen());
addEventListener('keydown', (e) => {
  if (e.key === 'ArrowRight' || e.key === ' ' || e.key === 'PageDown') { e.preventDefault(); next(); }
  else if (e.key === 'ArrowLeft' || e.key === 'PageUp') { e.preventDefault(); prev(); }
  else if (e.key === 'Home') goto(0); else if (e.key === 'End') goto(N - 1);
  else if (e.key === 'a' || e.key === 'A') setAuto(!auto);
  else if (e.key === 'n' || e.key === 'N') $('#bNotes').click();
  else if (e.key === 'f' || e.key === 'F') $('#bFull').click();
});
addEventListener('pointermove', (e) => { px = (e.clientX / innerWidth - 0.5) * 2; py = (e.clientY / innerHeight - 0.5) * 2; });
let tx = null; addEventListener('touchstart', (e) => { tx = e.touches[0].clientX; }, { passive: true });
addEventListener('touchend', (e) => { if (tx == null) return; const d = e.changedTouches[0].clientX - tx; if (Math.abs(d) > 50) (d < 0 ? next() : prev()); tx = null; }, { passive: true });
addEventListener('resize', () => S.resize(innerWidth, innerHeight));
if (EXPORT) { notes = true; document.body.classList.add('notes'); }
setTimeout(() => { $('#hint').style.opacity = 0; }, 7000);

// ---------- démarrage ----------
const start = Math.max(0, Math.min(N - 1, (parseInt(location.hash.slice(1)) || 1) - 1));
goto(start);
$('#loader').classList.add('off');
window.__api = {
  step: (dt) => step(dt), render: () => S.render(), goto, N,
  durs: slides.map((s) => s.dur), get idx() { return cur_i; }, get t() { return W.t; }, setAuto,
  // avance rapide sans rendu (tests)
  // export vidéo : avance déterministe sans rendu
  ffTo(frames, fps = 24) { const dt = 1 / fps; for (let f = 0; f < frames; f++) { if (window.__finished) break; step(dt); } return window.__finished ? 1 : 0; },
  countFrames(fps = 24) { const dt = 1 / fps; let n = 0; while (!window.__finished && n < 1e6) { step(dt); n++; } return n; },
  seek(i, t, dt = 1 / 30) { goto(i); for (let a = 0; a < t; a += dt) step(dt); },
};
window.__ready = true;
if (!EXPORT) {
  let last = performance.now();
  const loop = (now) => { const dt = Math.min(0.05, (now - last) / 1000); last = now; step(dt); S.render(); requestAnimationFrame(loop); };
  requestAnimationFrame(loop);
}
