three.js r160 (0.160.0), MIT — https://threejs.org/ (LICENSE alături).
Copiate din pachetul npm `three@0.160.0`: build/three.module.min.js, examples/jsm/loaders/GLTFLoader.js,
examples/jsm/controls/OrbitControls.js, examples/jsm/utils/BufferGeometryUtils.js.
Singura schimbare: importurile `'three'` și `'../utils/BufferGeometryUtils.js'` trimit la fișierele de alături,
ca pagina să meargă fără „import map” și fără internet.
