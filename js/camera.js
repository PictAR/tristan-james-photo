/* TJ Photo — camera.js (standalone wireframe camera viewer) */
(() => {
  const CANVAS = document.getElementById('camgl');
  if (!CANVAS) return;

  // Scene / renderer
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 100);
  camera.position.set(3.6, 2.2, 4.6);

  const renderer = new THREE.WebGLRenderer({ canvas: CANVAS, antialias:true, alpha:true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio||1, 1.5));

  // Subtle gradient-ish fog for depth
  scene.fog = new THREE.FogExp2(0x0b0d10, 0.12);

  // Materials (wireframe lines)
  const lineMat = new THREE.LineBasicMaterial({ color: 0xBFD3E0, transparent:true, opacity:0.9 });
  const accentMat = new THREE.LineBasicMaterial({ color: 0x9AD6FF, transparent:true, opacity:0.9 });

  const group = new THREE.Group(); scene.add(group);

  // Body (rounded box look via bevel-ish edges)
  const body = new THREE.BoxGeometry(2.6, 1.6, 1.2, 2, 2, 2);
  const bodyEdges = new THREE.EdgesGeometry(body);
  const bodyLines = new THREE.LineSegments(bodyEdges, lineMat);
  bodyLines.position.set(0, 0.1, 0);
  group.add(bodyLines);

  // Prism for viewfinder hump
  const hump = new THREE.ConeGeometry(0.6, 0.5, 4);
  hump.rotateY(Math.PI / 4);
  const humpEdges = new THREE.EdgesGeometry(hump);
  const humpLines = new THREE.LineSegments(humpEdges, lineMat);
  humpLines.position.set(-0.6, 0.95, 0);
  group.add(humpLines);

  // Lens barrel (cylinder)
  const lens = new THREE.CylinderGeometry(0.55, 0.55, 1.4, 24);
  lens.rotateX(Math.PI / 2);
  const lensEdges = new THREE.EdgesGeometry(lens);
  const lensLines = new THREE.LineSegments(lensEdges, accentMat);
  lensLines.position.set(1.55, 0.05, 0);
  group.add(lensLines);

  // Focus ring (torus)
  const ring = new THREE.TorusGeometry(0.58, 0.06, 8, 40);
  ring.rotateY(Math.PI / 2);
  const ringEdges = new THREE.EdgesGeometry(ring);
  const ringLines = new THREE.LineSegments(ringEdges, accentMat);
  ringLines.position.set(1.15, 0.05, 0);
  group.add(ringLines);

  // Hotshoe line & shutter button
  const shoe = new THREE.BoxGeometry(0.5, 0.08, 0.4);
  const shoeLines = new THREE.LineSegments(new THREE.EdgesGeometry(shoe), lineMat);
  shoeLines.position.set(-0.5, 0.95, 0);
  group.add(shoeLines);

  const btn = new THREE.CylinderGeometry(0.08, 0.08, 0.1, 12);
  const btnLines = new THREE.LineSegments(new THREE.EdgesGeometry(btn), accentMat);
  btnLines.position.set(0.3, 0.95, -0.35);
  group.add(btnLines);

  // Ground grid (very faint)
  const grid = new THREE.GridHelper(10, 20, 0x22303a, 0x1a242c);
  grid.position.y = -1.1;
  grid.material.opacity = 0.15; grid.material.transparent = true;
  scene.add(grid);

  // Controls
  const controls = new THREE.OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.dampingFactor = 0.08;
  controls.enablePan = false;
  controls.minDistance = 3.2;
  controls.maxDistance = 8;
  controls.target.set(0.6, 0.3, 0);

  // Resize
  const WRAP = document.getElementById('cam-wrap');
  function sizeToCanvas(){
    const rect = CANVAS.getBoundingClientRect();
    const w = Math.round(rect.width), h = Math.round(rect.height);
    renderer.setSize(w, h, false);
    camera.aspect = w / h; camera.updateProjectionMatrix();
  }
  if ('ResizeObserver' in window) new ResizeObserver(sizeToCanvas).observe(WRAP);
  else addEventListener('resize', sizeToCanvas);
  sizeToCanvas();

  // Animate (gentle idle spin)
  function animate(){
    requestAnimationFrame(animate);
    group.rotation.y += 0.003; // slow idle
    controls.update();
    renderer.render(scene, camera);
  }
  animate();
})();
