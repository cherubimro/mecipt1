// SPDX-License-Identifier: AGPL-3.0-or-later
// Vederea 3D a pupitrului: modelul „MECIPT-1” (Sketchfab, marius0198, 2020, CC BY 4.0) cu becurile aprinse după
// emulator. three.js (MIT) și modelul se încarcă abia la prima cerere, ca pagina 2D să rămână ușoară.
// În 3D pupitrul doar se privește (se rotește cu mouse-ul sau cu degetul); comenzile rămân în vederea 2D.
import { lampNodeMap, lampEmissive } from './lamp3d.js';

const VENDOR = new URL('../vendor/three/', import.meta.url).href;

// Întoarce { setLamps(pairs), render(), dispose(), lampCount, lit() } sau aruncă dacă WebGL ori modelul lipsesc.
export async function createView3D(container, { positions, colors, model = 'model3d/scene.gltf', background = '#353b40' }) {
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
  controls.minDistance = span * 0.25;
  controls.maxDistance = span * 3;
  controls.update();

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
    render() { controls.update(); renderer.render(scene, camera); },
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
