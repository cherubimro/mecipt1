// SPDX-License-Identifier: AGPL-3.0-or-later
// Vederea 3D a pupitrului: modelul „MECIPT-1” (Sketchfab, marius0198, 2020, CC BY 4.0) cu becurile aprinse după
// emulator. three.js (MIT) și modelul se încarcă abia la prima cerere, ca pagina 2D să rămână ușoară.
// Pupitrul se rotește trăgând cu mouse-ul sau cu degetul; un clic scurt (fără tragere) pe o manetă o apasă,
// exact ca în 2D (onPick primește id-ul comutatorului din pagină). Manetele se înclină după starea din 2D.
import { lampNodeMap, lampEmissive, switchNodeMap, leverTilt, ZONES3D, zoneNodes } from './lamp3d.js';

const VENDOR = new URL('../vendor/three/', import.meta.url).href;

// Întoarce { setLamps(pairs), setLever(id, up), pickAt(x, y), screenOf(id), focus(zone, opts), zone(), render(), dispose(),
// lampCount, switchCount, lit() }
// sau aruncă dacă WebGL ori modelul lipsesc.
export async function createView3D(container, { positions, colors, model = 'model3d/scene.gltf', background = '#353b40', onPick = null, onZone = null }) {
  const THREE = await import(`${VENDOR}three.module.min.js`);
  const { GLTFLoader } = await import(`${VENDOR}GLTFLoader.js`);
  const { OrbitControls } = await import(`${VENDOR}OrbitControls.js`);

  const renderer = new THREE.WebGLRenderer({ antialias: true, preserveDrawingBuffer: false });
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.setPixelRatio(Math.min(globalThis.devicePixelRatio || 1, 2));
  const canvas = renderer.domElement;
  canvas.className = 'view3d-canvas';
  canvas.setAttribute('role', 'img');
  container.append(canvas);

  const scene = new THREE.Scene();
  scene.background = new THREE.Color(background);
  scene.add(new THREE.HemisphereLight(0xffffff, 0x3a3f44, 1.6));
  const sun = new THREE.DirectionalLight(0xffffff, 1.6);
  sun.position.set(2, 5, 4);
  scene.add(sun);

  const gltf = await new GLTFLoader().loadAsync(new URL(model, document.baseURI).href);
  const root = gltf.scene;
  scene.add(root);

  // becurile: fiecare își primește propriile materiale, ca să strălucească independent
  const byName = new Map();
  root.traverse((o) => { const n = o.userData && o.userData.name; if (n && !byName.has(n)) byName.set(n, o); });
  const lamps = new Map();     // id → { mats, color, b }
  for (const [id, node] of lampNodeMap(positions)) {
    const obj = byName.get(node);
    if (!obj) continue;
    const mats = [];
    obj.traverse((m) => {
      if (!m.isMesh) return;
      m.material = m.material.clone();
      mats.push(m.material);
    });
    lamps.set(id, { mats, color: new THREE.Color(lampEmissive(id, colors)), b: -1 });
  }

  // comutatoarele: maneta (obiectul „Switch.NNN”) se înclină în jurul axei ei x, de la baza ei
  root.updateMatrixWorld(true);
  const levers = new Map();    // id → { obj, base, up, yUp }
  const leverMeshes = [];
  for (const [id, node] of switchNodeMap(positions)) {
    const obj = byName.get(node);
    if (!obj) continue;
    // axa y proprie a manetei urcă sau coboară în scenă? (de aici semnul înclinării)
    const yAxis = new THREE.Vector3(0, 1, 0).transformDirection(obj.matrixWorld);
    levers.set(id, { obj, base: obj.quaternion.clone(), up: null, yUp: yAxis.y >= 0 });
    obj.traverse((m) => { if (m.isMesh) { m.userData.switchId = id; leverMeshes.push(m); } });
  }
  const axisX = new THREE.Vector3(1, 0, 0), tilt = new THREE.Quaternion();
  const setLever = (id, up) => {
    const l = levers.get(id);
    if (!l || l.up === up) return;
    l.up = up;
    l.obj.quaternion.copy(l.base).multiply(tilt.setFromAxisAngle(axisX, leverTilt(up, l.yUp)));
  };
  for (const id of levers.keys()) setLever(id, false);

  // camera: tot pupitrul în cadru, privit din față și puțin de sus
  const box = new THREE.Box3().setFromObject(root);
  const size = box.getSize(new THREE.Vector3()), center = box.getCenter(new THREE.Vector3());
  const span = size.length();
  const camera = new THREE.PerspectiveCamera(35, 1, span / 200, span * 20);
  const front = frontDirection(THREE, root, byName);
  camera.position.copy(center).addScaledVector(front, span * 0.95).add(new THREE.Vector3(0, size.y * 0.35, 0));
  const controls = new OrbitControls(camera, canvas);
  controls.target.copy(center);
  controls.enableDamping = true;
  controls.zoomToCursor = true;           // rotița apropie spre punctul arătat: spre manetele unui panou
  controls.minDistance = span * 0.04;     // destul de aproape cât să se citească o etichetă de comutator
  controls.maxDistance = span * 3;
  controls.update();

  // Zonele: camera zboară spre un grup de becuri și comutatoare, privit drept din fața panoului lui.
  const home = { pos: camera.position.clone(), target: center.clone() };
  let flight = null, zone = 'all';
  const panelNormal = (name) => {
    const panel = byName.get(name);
    let mesh = null;
    if (panel) panel.traverse((o) => { if (!mesh && o.isMesh) mesh = o; });
    const n = mesh && mesh.geometry.attributes.normal;
    if (!n) return front.clone();
    const v = new THREE.Vector3(n.getX(0), n.getY(0), n.getZ(0)).transformDirection(mesh.matrixWorld);
    const pc = new THREE.Box3().setFromObject(panel).getCenter(new THREE.Vector3());
    if (v.dot(home.pos.clone().sub(pc)) < 0) v.negate();   // fața dinspre vizitator, nu spatele
    return v;
  };
  const focus = (zoneId, { instant = false } = {}) => {
    const z = ZONES3D.find((x) => x.id === zoneId);
    if (!z) return false;
    let pos = home.pos, target = home.target;
    if (z.id !== 'all') {
      // întinderea zonei văzută din fața panoului: din cutiile obiectelor, proiectate pe dreapta și susul camerei
      const n = panelNormal(z.panel);
      const right = new THREE.Vector3().crossVectors(new THREE.Vector3(0, 1, 0), n).normalize();
      const up = new THREE.Vector3().crossVectors(n, right);
      const pts = [];
      for (const name of zoneNodes(positions, z.id)) {
        const o = byName.get(name);
        if (!o) continue;
        const b = new THREE.Box3().setFromObject(o);
        if (!b.isEmpty()) pts.push(b.min, b.max, b.getCenter(new THREE.Vector3()));
      }
      if (!pts.length) return false;
      target = new THREE.Box3().setFromPoints(pts).getCenter(new THREE.Vector3());
      let hw = 0, hh = 0;
      for (const p of pts) {
        const v = p.clone().sub(target);
        hw = Math.max(hw, Math.abs(v.dot(right)));
        hh = Math.max(hh, Math.abs(v.dot(up)));
      }
      const vfov = camera.fov * Math.PI / 180, hfov = 2 * Math.atan(Math.tan(vfov / 2) * camera.aspect);
      const d = Math.max(hw / Math.tan(hfov / 2), hh / Math.tan(vfov / 2)) * 1.18;
      pos = target.clone().addScaledVector(n, Math.max(d, controls.minDistance * 1.05));
    }
    zone = z.id;
    flight = { p0: camera.position.clone(), t0: controls.target.clone(), p1: pos.clone(), t1: target.clone(),
      start: performance.now(), dur: instant ? 0 : 800 };
    return true;
  };
  // o rotire sau o apropiere cu mâna oprește zborul și scoate zona din buton
  controls.addEventListener('start', () => {
    flight = null;
    if (zone !== null) { zone = null; if (onZone) onZone(null); }
  });
  const fly = () => {
    if (!flight) return;
    const t = flight.dur ? Math.min(1, (performance.now() - flight.start) / flight.dur) : 1;
    const e = t < 0.5 ? 2 * t * t : 1 - (-2 * t + 2) ** 2 / 2;
    camera.position.lerpVectors(flight.p0, flight.p1, e);
    controls.target.lerpVectors(flight.t0, flight.t1, e);
    if (t >= 1) flight = null;
  };

  // Ce comutator e sub punctul (x, y) al ferestrei: maneta lovită de rază sau, dacă raza o ratează la milimetru
  // (manetele sunt mici, mai ales pe telefon), cea mai apropiată pe ecran, la cel mult PICK_PX, dacă nu e ascunsă.
  const PICK_PX = 18;
  const ray = new THREE.Raycaster(), ndc = new THREE.Vector2(), wp = new THREE.Vector3();
  const toScreen = (obj, r) => {
    obj.getWorldPosition(wp);
    const d = wp.distanceTo(camera.position);
    wp.project(camera);
    return { x: r.left + (wp.x + 1) / 2 * r.width, y: r.top + (1 - wp.y) / 2 * r.height, z: wp.z, d };
  };
  const pickAt = (x, y) => {
    const r = canvas.getBoundingClientRect();
    if (!r.width || !r.height) return null;
    ndc.set((x - r.left) / r.width * 2 - 1, -((y - r.top) / r.height) * 2 + 1);
    ray.setFromCamera(ndc, camera);
    const hit = ray.intersectObject(root, true)[0];
    if (hit && hit.object.userData.switchId) return hit.object.userData.switchId;
    let best = null, bestD = PICK_PX;
    for (const [id, l] of levers) {
      const s = toScreen(l.obj, r);
      if (s.z > 1) continue;
      const dist = Math.hypot(s.x - x, s.y - y);
      if (dist < bestD && (!hit || s.d <= hit.distance + span * 0.02)) { best = id; bestD = dist; }
    }
    return best;
  };
  // clic = apăsare și ridicare aproape în același loc; altfel e o rotire a pupitrului
  let down = null;
  canvas.addEventListener('pointerdown', (e) => { down = { x: e.clientX, y: e.clientY, t: performance.now() }; });
  canvas.addEventListener('pointerup', (e) => {
    const d = down;
    down = null;
    if (!d || !onPick || Math.hypot(e.clientX - d.x, e.clientY - d.y) > 6 || performance.now() - d.t > 600) return;
    const id = pickAt(e.clientX, e.clientY);
    if (id) onPick(id);
  });
  canvas.addEventListener('pointermove', (e) => {
    if (e.buttons || e.pointerType === 'touch') return;
    canvas.style.cursor = pickAt(e.clientX, e.clientY) ? 'pointer' : '';
  });

  const resize = () => {
    const w = container.clientWidth || 1, h = container.clientHeight || 1;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  };
  const ro = globalThis.ResizeObserver ? new ResizeObserver(resize) : null;
  if (ro) ro.observe(container);
  resize();

  return {
    lampCount: lamps.size,
    switchCount: levers.size,
    setLever,
    pickAt,
    // centrul manetei pe ecran (coordonatele ferestrei), pentru încercări
    screenOf(id) { const l = levers.get(id); return l ? toScreen(l.obj, canvas.getBoundingClientRect()) : null; },
    // pairs: [id, strălucire 0…1], ca becurile din 2D (aceeași inerție)
    setLamps(pairs) {
      for (const [id, b] of pairs) {
        const l = lamps.get(id);
        if (!l) continue;
        const v = Math.round(b * 50) / 50;
        if (v === l.b) continue;
        l.b = v;
        for (const m of l.mats) { m.emissive.copy(l.color); m.emissiveIntensity = v * 2.2; }
      }
    },
    lit() { let n = 0; for (const l of lamps.values()) if (l.b > 0.5) n++; return n; },
    focus,
    zone: () => zone,
    render() { fly(); controls.update(); renderer.render(scene, camera); },
    resize,
    dispose() { if (ro) ro.disconnect(); controls.dispose(); renderer.dispose(); canvas.remove(); },
  };
}

// Fața pupitrului: direcția normalei panoului din mijloc (spre vizitator); dacă nu se găsește, +Z.
function frontDirection(THREE, root, byName) {
  root.updateMatrixWorld(true);
  const panel = byName.get('Center') || byName.get('Right') || null;
  let mesh = null;
  if (panel) panel.traverse((o) => { if (!mesh && o.isMesh) mesh = o; });
  if (!mesh) return new THREE.Vector3(0, 0, 1);
  const g = mesh.geometry, n = g.attributes.normal;
  if (!n) return new THREE.Vector3(0, 0, 1);
  const v = new THREE.Vector3(n.getX(0), n.getY(0), n.getZ(0)).transformDirection(mesh.matrixWorld);
  v.y = 0;
  return v.lengthSq() > 1e-6 ? v.normalize() : new THREE.Vector3(0, 0, 1);
}
