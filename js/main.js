/* Tristan James Photo — main.js (music carousel + captioned lightbox; subtle sway) */
(() => {
  // 1) Images with captions (update artist/location as desired)
  const MUSIC = [
{ src: "resources/img/music/01.jpg", artist: "An All Mighty Trigger Happy", location: "Absinthe, Hamilton, ON" },
{ src: "resources/img/music/03.jpg", artist: "Alexisonfire", location: "Terminal 5, New York, NY" },
{ src: "resources/img/music/04.jpg", artist: "Bedouin Soundclash", location: "Victoria, BC" },
// { src: "resources/img/music/05.jpg", artist: "Alexisonfire", location: "Terminal 5, New York, NY" },
// { src: "resources/img/music/06.jpg", artist: "Paul Simon", location: "ACC, Toronto, ON" },
{ src: "resources/img/music/07.jpg", artist: "Grade", location: "Dickens Pub, Burlington, ON" },
{ src: "resources/img/music/08.jpg", artist: "Alexisonfire", location: "Terminal 5, New York, NY" },
{ src: "resources/img/music/09.jpg", artist: "Family Meeting", location: "The Bovine, Toronto, ON" },
{ src: "resources/img/music/10.jpg", artist: "The Flatliners", location: "Absinthe, Hamilton, ON" },
{ src: "resources/img/music/11.jpg", artist: "Modest Mouse", location: "House of Blues, New Orleans, LO" },
// { src: "resources/img/music/12.jpg", artist: "Catapult", location: "Bong Mansion, Burlington, ON" },
{ src: "resources/img/music/13.jpg", artist: "Rough Party", location: "Hamilton, ON" },
{ src: "resources/img/music/14.jpg", artist: "Grade", location: "Dickens Pub, Burlington, ON" },
{ src: "resources/img/music/17.jpg", artist: "Family Meeting", location: "The Bovine, Toronto, ON" },
{ src: "resources/img/music/19.jpg", artist: "Catapult", location: "Toneland Studio, Burlington, ON" },
{ src: "resources/img/music/20.jpg", artist: "The Flatliners", location: "Absinthe, Hamilton, ON" },
{ src: "resources/img/music/21.jpg", artist: "Rough Party", location: "Hamilton, ON" },
// { src: "resources/img/music/22.jpg", artist: "Paul Simon", location: "ACC, Toronto, ON" },
{ src: "resources/img/music/23.jpg", artist: "Family Meeting", location: "The Bovine, Toronto, ON" },
{ src: "resources/img/music/24.jpg", artist: "Catapult", location: "Bong Mansion, Burlington, ON" },
{ src: "resources/img/music/25.jpg", artist: "Say Yes", location: "Absinthe, Hamilton, ON" },
{ src: "resources/img/music/01.png", artist: "The Flatliners", location: "Absinthe, Hamilton, ON" },
{ src: "resources/img/music/02.png", artist: "The Flatliners", location: "Absinthe, Hamilton, ON" },
{ src: "resources/img/music/03.png", artist: "The Dirty Nil", location: "Absinthe, Hamilton, ON" },
{ src: "resources/img/music/04.png", artist: "Catapult", location: "Bong Mansion, Burlington, ON" },
{ src: "resources/img/music/05.png", artist: "Alexisonfire", location: "Terminal 5, New York, NY, USA" },
{ src: "resources/img/music/06.png", artist: "Alexisonfire", location: "Terminal 5, New York, NY, USA" },
{ src: "resources/img/music/07.png", artist: "Alexisonfire", location: "Terminal 5, New York, NY, USA" }

  ];

  const IMAGES = MUSIC.slice();
  const CANVAS = document.getElementById("webgl");
  const WRAP   = document.getElementById("webgl-wrap");
  if (!CANVAS || !WRAP) {
    console.error("[main.js] Missing #webgl or #webgl-wrap.");
    return;
  }

  // 2) WebGL availability → fallback grid
  try {
    const gl = CANVAS.getContext("webgl2") || CANVAS.getContext("webgl");
    if (!gl) throw new Error("no webgl");
  } catch (e) {
    console.warn("[main.js] WebGL unavailable:", e);
    WRAP.innerHTML = `<div class="grid">${
      IMAGES.slice(0, 12).map((img,i)=>`<img src="${img.src}" alt="Music ${i+1}">`).join("")
    }</div>`;
    return;
  }

  // 3) Three.js setup
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 200);
  camera.position.set(0, 0, 9);

  const renderer = new THREE.WebGLRenderer({ canvas: CANVAS, antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));

  scene.add(new THREE.AmbientLight(0xffffff, 0.95));
  const dir = new THREE.DirectionalLight(0x99ccff, 0.35);
  dir.position.set(2,3,1);
  scene.add(dir);

  // 4) Layout / geometry
  const N        = IMAGES.length;
  const rows     = (N > 18) ? 2 : 1;
  const perRing  = Math.ceil(N / rows);
  const baseW    = 2.6;
  const planeW   = THREE.MathUtils.clamp(3.0 - 0.06 * perRing, 1.45, baseW);
  const aspect   = 0.69;
  const planeH   = planeW * aspect;
  const spacing  = 1.18;
  const radius   = (planeW * perRing * spacing) / (2 * Math.PI);
  const rowGap   = planeH + 0.6;

  const group = new THREE.Group();
  scene.add(group);

  const loader = new THREE.TextureLoader();
  const planes = [];
  const maxAniso = renderer.capabilities.getMaxAnisotropy?.() || 1;

  IMAGES.forEach((img, i) => {
    const ringIndex = (rows === 2) ? (i % 2) : 0;
    const idxInRing = (rows === 2) ? Math.floor(i / 2) : i;
    const angle     = (idxInRing / perRing) * Math.PI * 2;

    const tex = loader.load(img.src);
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.minFilter  = THREE.LinearFilter;
    tex.anisotropy = maxAniso;

    const mat  = new THREE.MeshStandardMaterial({
      map: tex, roughness: 0.9, metalness: 0, envMapIntensity: 0.1,
      transparent: true, opacity: 1
    });
    const geom = new THREE.PlaneGeometry(planeW, planeH);
    const m    = new THREE.Mesh(geom, mat);

    const y = (rows===2) ? (ringIndex===0 ? rowGap/2 : -rowGap/2) : 0;
    m.position.set(Math.cos(angle)*radius, y, Math.sin(angle)*radius);
    m.lookAt(0, 0, 0);
    m.userData = { ...img, angle, ringIndex, baseY: y }; // store baseY for non-accumulating sway
    group.add(m);
    planes.push(m);
  });

  // 5) Interaction
  let isDown=false, targetRot=0, rot=0, lastX=0;
  const onDown = x => (isDown=true, lastX=x);
  const onMove = x => { if(!isDown) return; const dx=x-lastX; lastX=x; targetRot += dx*0.002; };
  const onUp   = () => (isDown=false);

  CANVAS.addEventListener("mousedown", e=>onDown(e.clientX));
  addEventListener("mousemove", e=>onMove(e.clientX));
  addEventListener("mouseup", onUp);

  CANVAS.addEventListener("touchstart", e=>onDown(e.touches[0].clientX), {passive:true});
  addEventListener("touchmove",  e=>onMove(e.touches[0].clientX),        {passive:true});
  addEventListener("touchend",   onUp);

  addEventListener("wheel", e=>{
    camera.position.z = THREE.MathUtils.clamp(camera.position.z + (e.deltaY>0? .45 : -.45), 5.5, 14);
  }, {passive:true});

  // 6) Lightbox (captioned)
  const lightbox        = document.getElementById("lightbox");
  const lightboxImg     = document.getElementById("lightbox-img");
  const lightboxCaption = document.getElementById("lightbox-caption");
  const lightboxClose   = document.getElementById("lightbox-close");

  CANVAS.addEventListener("click", (e)=>{
    const rect = CANVAS.getBoundingClientRect();
    const ndc  = new THREE.Vector2(
      ((e.clientX - rect.left) / rect.width) * 2 - 1,
      -((e.clientY - rect.top) / rect.height) * 2 + 1
    );
    const ray = new THREE.Raycaster(); ray.setFromCamera(ndc, camera);
    const hit = ray.intersectObjects(planes)[0];
    if (hit) {
      const { src, artist, location } = hit.object.userData;
      lightboxImg.src = src;
      lightboxCaption.textContent = `Artist: ${artist} • Location: ${location}`;
      lightbox.classList.remove("hidden");
    }
  });
  lightboxClose.addEventListener("click", ()=> lightbox.classList.add("hidden"));
  lightbox.addEventListener("click", e=>{ if (e.target === lightbox) lightbox.classList.add("hidden"); });
  addEventListener("keydown", (e)=>{
    if (e.key === "ArrowLeft")  targetRot -= 0.25;
    if (e.key === "ArrowRight") targetRot += 0.25;
    if (e.key === "Escape")     lightbox.classList.add("hidden");
  });

  // 7) Resize (rounded → prevents seams)
  function sizeToCanvas() {
    const rect = CANVAS.getBoundingClientRect();
    const w = Math.round(rect.width);
    const h = Math.round(rect.height);
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  }
  if ("ResizeObserver" in window) {
    new ResizeObserver(sizeToCanvas).observe(WRAP);
  } else {
    addEventListener("resize", sizeToCanvas);
  }
  sizeToCanvas();

  // 8) Animate — subtle, non-accumulating sway
  const SWAY_AMPLITUDE = 0.06; // tweak 0.03–0.08 for taste
  const SWAY_SPEED     = 0.6;  // lower = slower

  function animate(){
    requestAnimationFrame(animate);

    rot = THREE.MathUtils.damp(rot, targetRot, 8, 0.016);
    group.rotation.y = rot;

    const t = performance.now()*0.001; // seconds
    for (let m of planes){
      // keep rows straight: baseY + small sine (no accumulation)
      const phase = t*SWAY_SPEED + m.userData.angle*1.5;
      m.position.y = m.userData.baseY + SWAY_AMPLITUDE * Math.sin(phase);

      // focus scaling/opacity (slight emphasis on front)
      const delta = Math.abs((group.rotation.y + m.userData.angle) % (Math.PI*2));
      const dist  = Math.abs(Math.PI - delta);
      const s  = THREE.MathUtils.mapLinear(dist, 0, Math.PI, 1.12, 0.92);
      const op = THREE.MathUtils.clamp(THREE.MathUtils.mapLinear(dist, 0, Math.PI, 1, 0.42), 0.42, 1);
      m.scale.setScalar(THREE.MathUtils.damp(m.scale.x, s, 6, 0.016));
      m.material.opacity = THREE.MathUtils.damp(m.material.opacity, op, 8, 0.016);
    }

    renderer.render(scene, camera);
  }
  animate();
})();
