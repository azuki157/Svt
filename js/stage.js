// Scène 3D : rendu, éclairage, fond, "stations" (utérus / appareil masculin / laboratoire),
// chargement des 3 modèles GLB et matériaux spéciaux (mise en évidence par zones, flagelle animé).
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';

export const COL = {
  fem: 0xff5d8f, mal: 0x4db8ff, mix: 0xa98bff, unk: 0x98a2b8,
  lab: 0x37e0c0, warn: 0xffb84d, bad: 0xff4d5e, good: 0x5cf2a0, ink: 0x070b1a,
};
// Position des stations dans l'espace : la caméra voyage de l'une à l'autre.
export const ST = {
  F: new THREE.Vector3(0, 0, 0),      // utérus
  M: new THREE.Vector3(11, 0, 0),     // appareil reproducteur masculin
  L: new THREE.Vector3(22, 0, 0),     // laboratoire (FIV, ICSI, conservation)
};

// ---------- fondu générique d'un groupe (opacité de tous les matériaux) ----------
export function setFade(obj, a) {
  a = Math.max(0, Math.min(1, a));
  if (obj.userData._fade === a) return;
  obj.userData._fade = a;
  obj.visible = a > 0.004;
  if (!obj.visible) return;
  obj.traverse((o) => {
    if (!o.material) return;
    const mats = Array.isArray(o.material) ? o.material : [o.material];
    for (const m of mats) {
      if (m.userData.base === undefined) { m.userData.base = m.opacity; m.userData.baseT = m.transparent; }
      m.opacity = m.userData.base * a;
      m.transparent = m.userData.baseT || a < 0.999 || (m.userData.ghostU && m.userData.ghostU.value > 0.01);
    }
  });
}

// ---------- matériau avec zones (utérus) : mise en évidence émissive + mode "fantôme" ----------
export function zoneMaterial(base) {
  const m = base.clone();
  const hi = Array.from({ length: 8 }, () => new THREE.Vector3());
  const U = { uHi: { value: hi }, uDim: { value: 0 }, uGhost: { value: 0 } };
  m.userData.hi = hi; m.userData.dimU = U.uDim; m.userData.ghostU = U.uGhost;
  m.onBeforeCompile = (sh) => {
    Object.assign(sh.uniforms, U);
    sh.vertexShader = sh.vertexShader
      .replace('#include <common>', '#include <common>\nattribute float aZone;\nvarying float vZone;')
      .replace('#include <begin_vertex>', '#include <begin_vertex>\nvZone = aZone;');
    sh.fragmentShader = sh.fragmentShader
      .replace('#include <common>', '#include <common>\nuniform vec3 uHi[8];\nuniform float uDim;\nuniform float uGhost;\nvarying float vZone;')
      .replace('#include <emissivemap_fragment>',
        `#include <emissivemap_fragment>
        vec3 hz = uHi[int(vZone + 0.5)];
        totalEmissiveRadiance += hz;
        float hl = max(hz.r, max(hz.g, hz.b));
        diffuseColor.rgb *= mix(1.0, 0.42, uDim * (1.0 - step(0.001, hl)));`)
      .replace('#include <dithering_fragment>',
        `#include <dithering_fragment>
        float fr = pow(1.0 - abs(dot(normalize(vNormal), normalize(vViewPosition))), 2.0);
        gl_FragColor.a *= mix(1.0, 0.16 + 0.6 * fr, uGhost);`);
  };
  return m;
}

// ---------- spermatozoïde : flagelle ondulant (déformation dans le vertex shader) ----------
export function makeSpermMaterial({ amp = 1, color = 0xf4eee4, emissive = 0x2a4a7a, cut = 1, head = 1 } = {}) {
  const m = new THREE.MeshPhysicalMaterial({ color, roughness: 0.32, clearcoat: 0.6, emissive, emissiveIntensity: 0.35, sheen: 1, sheenColor: new THREE.Color(0xffffff) });
  const U = { uTime: { value: 0 }, uAmp: { value: amp }, uCut: { value: cut }, uHead: { value: head } };
  m.userData.U = U;
  m.onBeforeCompile = (sh) => {
    Object.assign(sh.uniforms, U);
    sh.vertexShader = sh.vertexShader
      .replace('#include <common>', '#include <common>\nuniform float uTime;\nuniform float uAmp;\nuniform float uCut;\nuniform float uHead;')
      .replace('#include <begin_vertex>', `#include <begin_vertex>
        float sx = clamp((0.30 - position.x) / 0.70, 0.0, 1.3);
        #ifdef USE_INSTANCING
          float ph = fract(sin(dot(instanceMatrix[3].xyz, vec3(12.9898, 78.233, 37.719))) * 43758.5453) * 6.2831;
        #else
          float ph = 0.0;
        #endif
        transformed.x = mix(position.x, 0.30 - sx * 0.70 * uCut, step(0.0001, sx));
        float sc = min(sx, 1.0);
        float wv = sin(sc * 9.0 - uTime * 9.0 + ph);
        transformed.y += uAmp * (0.012 + 0.09 * sc) * sc * wv;
        transformed.z += uAmp * 0.045 * sc * sc * cos(sc * 9.0 - uTime * 9.0 + ph);
        transformed.y += uAmp * 0.008 * sin(uTime * 9.0 + ph) * step(0.3, position.x);
        transformed.yz *= mix(1.0, uHead, smoothstep(0.2, 0.34, position.x));`);
  };
  return m;
}

// ---------- création de la scène ----------
export async function createStage(canvas, { width, height, dpr = 1, onProgress } = {}) {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance' });
  renderer.setPixelRatio(dpr);
  renderer.setSize(width, height, false);
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;
  renderer.outputColorSpace = THREE.SRGBColorSpace;

  const scene = new THREE.Scene();
  scene.fog = new THREE.FogExp2(0x0a0f24, 0.022);
  const camera = new THREE.PerspectiveCamera(40, width / height, 0.05, 200);
  const pmrem = new THREE.PMREMGenerator(renderer);
  scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
  scene.environmentIntensity = 0.55;

  // lumières
  scene.add(new THREE.HemisphereLight(0xbcd0ff, 0x1a1024, 0.7));
  const key = new THREE.DirectionalLight(0xfff0e0, 2.2);
  key.position.set(5, 8, 7); scene.add(key); scene.add(key.target);
  const rims = {};
  for (const [k, c] of [['F', COL.fem], ['M', COL.mal], ['L', COL.lab]]) {
    const L = new THREE.PointLight(c, 22, 0, 2);
    L.position.copy(ST[k]).add(new THREE.Vector3(-3.5, 2.5, -3.5));
    scene.add(L); rims[k] = L;
  }

  // ciel dégradé
  const skyU = { uTop: { value: new THREE.Color(0x101a3d) }, uBot: { value: new THREE.Color(0x05070f) }, uTime: { value: 0 } };
  const sky = new THREE.Mesh(
    new THREE.SphereGeometry(90, 32, 16),
    new THREE.ShaderMaterial({
      side: THREE.BackSide, depthWrite: false, fog: false, uniforms: skyU,
      vertexShader: 'varying vec3 vP; void main(){ vP = normalize(position); gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }',
      fragmentShader: `varying vec3 vP; uniform vec3 uTop; uniform vec3 uBot; uniform float uTime;
        void main(){
          float h = vP.y * 0.5 + 0.5;
          vec3 c = mix(uBot, uTop, pow(h, 0.8));
          float n = sin(vP.x*6.0+uTime*0.05)*sin(vP.y*5.0-uTime*0.04)*sin(vP.z*7.0+uTime*0.03);
          c += uTop * 0.18 * (n * 0.5 + 0.5) * smoothstep(0.1, 0.9, h);
          gl_FragColor = vec4(c, 1.0);
        }`,
    }));
  sky.renderOrder = -10; sky.frustumCulled = false; scene.add(sky);

  // poussière / "plancton" lumineux
  const N = 1100, pos = new Float32Array(N * 3), sz = new Float32Array(N), ph = new Float32Array(N);
  let seed = 7; const R = () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };
  for (let i = 0; i < N; i++) {
    pos[i * 3] = -14 + R() * 56; pos[i * 3 + 1] = -7 + R() * 15; pos[i * 3 + 2] = -22 + R() * 34;
    sz[i] = 0.05 + R() * 0.16; ph[i] = R();
  }
  const dg = new THREE.BufferGeometry();
  dg.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  dg.setAttribute('aS', new THREE.BufferAttribute(sz, 1));
  dg.setAttribute('aP', new THREE.BufferAttribute(ph, 1));
  const dustU = { uTime: { value: 0 }, uPx: { value: 700 }, uColor: { value: new THREE.Color(0x9fc4ff) } };
  const dust = new THREE.Points(dg, new THREE.ShaderMaterial({
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, uniforms: dustU,
    vertexShader: `attribute float aS; attribute float aP; uniform float uTime; uniform float uPx; varying float vA;
      void main(){ vec3 p = position; p.y += sin(uTime*0.15 + aP*6.28)*0.7; p.x += cos(uTime*0.11 + aP*9.0)*0.6; p.z += sin(uTime*0.09 + aP*4.0)*0.5;
        vec4 mv = modelViewMatrix*vec4(p,1.0); gl_Position = projectionMatrix*mv; gl_PointSize = aS*uPx/(-mv.z); vA = 0.25 + 0.75*fract(aP*7.0); }`,
    fragmentShader: 'varying float vA; uniform vec3 uColor; void main(){ float d = length(gl_PointCoord-0.5); float a = smoothstep(0.5,0.0,d); gl_FragColor = vec4(uColor, a*a*vA*0.6); }',
  }));
  dust.frustumCulled = false; scene.add(dust);

  // plateformes "holographiques"
  const glowTex = (() => {
    const c = document.createElement('canvas'); c.width = c.height = 128; const g = c.getContext('2d');
    const gr = g.createRadialGradient(64, 64, 0, 64, 64, 64);
    gr.addColorStop(0, 'rgba(255,255,255,0.55)'); gr.addColorStop(0.5, 'rgba(255,255,255,0.12)'); gr.addColorStop(1, 'rgba(255,255,255,0)');
    g.fillStyle = gr; g.fillRect(0, 0, 128, 128); const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
  })();
  function makePlatform(color, r = 2.5) {
    const g = new THREE.Group();
    const disc = new THREE.Mesh(new THREE.CylinderGeometry(r, r * 1.04, 0.06, 72),
      new THREE.MeshStandardMaterial({ color: 0x0c1226, metalness: 0.25, roughness: 0.55 }));
    g.add(disc);
    const ring = new THREE.Mesh(new THREE.TorusGeometry(r, 0.018, 12, 96), new THREE.MeshBasicMaterial({ color }));
    ring.rotation.x = Math.PI / 2; ring.position.y = 0.032; g.add(ring);
    const ring2 = new THREE.Mesh(new THREE.TorusGeometry(r * 1.22, 0.008, 8, 96), new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.35 }));
    ring2.rotation.x = Math.PI / 2; ring2.position.y = 0.032; g.add(ring2);
    const glow = new THREE.Mesh(new THREE.PlaneGeometry(r * 3.6, r * 3.6),
      new THREE.MeshBasicMaterial({ map: glowTex, color, transparent: true, opacity: 0.5, depthWrite: false, blending: THREE.AdditiveBlending, fog: false }));
    glow.rotation.x = -Math.PI / 2; glow.position.y = 0.04; g.add(glow);
    g.userData.ring = ring;
    return g;
  }

  const S = {
    renderer, scene, camera, sky, skyU, dust, dustU, rims, key, makePlatform, THREE,
    time: 0, uterus: null, male: null, spermGeo: null, platforms: {},
    resize(w, h, d = dpr) {
      renderer.setPixelRatio(d); renderer.setSize(w, h, false);
      camera.aspect = w / h; camera.updateProjectionMatrix();
      dustU.uPx.value = h * d / (2 * Math.tan(THREE.MathUtils.degToRad(camera.fov) / 2));
    },
    render() {
      sky.position.copy(camera.position);
      dustU.uTime.value = S.time; skyU.uTime.value = S.time;
      renderer.render(scene, camera);
    },
  };
  S.resize(width, height, dpr);

  // ---------- chargement des modèles ----------
  const loader = new GLTFLoader();
  const load = (url) => new Promise((res, rej) => loader.load(url, res, (e) => onProgress && e.total && onProgress(e.loaded / e.total), rej));
  const [gU, gM, gS] = await Promise.all([load('models/uterus.glb'), load('models/male_reproductive_system.glb'), load('models/sperm.glb')]);

  // -- utérus : recentré + attribut de zone pour les mises en évidence
  {
    const root = gU.scene;
    root.updateMatrixWorld(true);
    const lights = []; root.traverse((o) => { if (o.isLight || o.isCamera) lights.push(o); }); lights.forEach((o) => o.removeFromParent());
    const box = new THREE.Box3().setFromObject(root); const c = box.getCenter(new THREE.Vector3());
    const holder = new THREE.Group(); holder.add(root); root.position.sub(c);
    holder.updateMatrixWorld(true);
    const zoneOf = (x, y) => {
      const ov = (cx, cy) => ((x - cx) / 0.27) ** 2 + ((y - cy) / 0.27) ** 2 < 1;
      if (ov(-0.905, 0.33)) return 1;           // ovaire gauche (côté image)
      if (ov(0.93, 0.37)) return 2;             // ovaire droit
      if (Math.abs(x) > 0.33 && y > 0.40) return x < 0 ? 3 : 4; // trompes
      if (y < -0.33) return 6;                  // vagin
      if (y < -0.16 && Math.abs(x) < 0.55) return 7; // col
      if (Math.abs(x) <= 0.55 && y >= -0.16) return 5; // corps de l'utérus
      return 0;                                 // ligaments / reste
    };
    root.traverse((o) => {
      if (!o.isMesh) return;
      const geo = o.geometry; const p = geo.attributes.position; const z = new Float32Array(p.count);
      const v = new THREE.Vector3();
      for (let i = 0; i < p.count; i++) { v.fromBufferAttribute(p, i).applyMatrix4(o.matrixWorld); z[i] = zoneOf(v.x, v.y); }
      geo.setAttribute('aZone', new THREE.BufferAttribute(z, 1));
      o.material = zoneMaterial(o.material);
      o.material.roughness = 0.5; o.material.envMapIntensity = 1.1;
      S.uterusMat = o.material; S.uterusMesh = o;
    });
    S.uterus = holder;
    S.uterusBox = new THREE.Box3().setFromObject(holder);
  }

  // -- appareil masculin : une matière par pièce
  {
    const root = gM.scene; root.rotation.y = Math.PI; root.updateMatrixWorld(true);
    S.maleParts = {};
    root.traverse((o) => {
      if (!o.isMesh) return;
      o.material = o.material.clone();
      o.material.envMapIntensity = 0.9;
      o.material.roughness = Math.min(o.material.roughness, 0.6);
      o.material.userData.baseColor = o.material.color.clone();
      const n = o.name.split('_')[0].replace('.', '');
      S.maleParts[n] = o;
    });
    const box = new THREE.Box3().setFromObject(root); const c = box.getCenter(new THREE.Vector3());
    const holder = new THREE.Group(); holder.add(root); root.position.sub(c);
    const s = 3.1 / (box.max.y - box.min.y);
    holder.scale.setScalar(s);
    holder.updateMatrixWorld(true);
    S.male = holder; S.maleRoot = root;
    S.maleBox = new THREE.Box3().setFromObject(holder);
  }

  // -- spermatozoïde : géométrie cuite, normalisée (longueur 1, tête vers +X)
  {
    let mesh; gS.scene.updateMatrixWorld(true);
    gS.scene.traverse((o) => { if (o.isMesh) mesh = o; });
    const geo = mesh.geometry.clone().applyMatrix4(mesh.matrixWorld);
    geo.computeBoundingBox();
    const b = geo.boundingBox; const c = b.getCenter(new THREE.Vector3()); const sz = b.getSize(new THREE.Vector3());
    geo.translate(-c.x, -c.y, -c.z);
    geo.scale(1 / sz.x, 1 / sz.x, 1 / sz.x);
    geo.rotateY(Math.PI); // la tête (côté -x dans le fichier) passe vers +x
    geo.deleteAttribute('uv'); geo.deleteAttribute('normal');
    geo.computeVertexNormals();
    geo.computeBoundingSphere();
    S.spermGeo = geo;
  }
  return S;
}
