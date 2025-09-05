/* Tristan James Photo — bg.js
   Particles with: parallax scroll, continuous idle rotation, cursor swirl,
   opacity twinkles — plus GUI presets to make it “galaxy-like”.
*/
(function(){
  const DPR = Math.min(window.devicePixelRatio || 1, 2);

  // -------- Config (live-tunable) --------
  const CFG = {
    // Palette weights (0..1)
    dominantWeight: 0.85, // share of yellows vs accents at spawn
    // Counts & scale
    density: 1.0,         // multiplier on auto count (0.5..2)
    edgeMargin: 80,       // offscreen spawn/wrap margin (px)
    // Twinkle (alpha pulse)
    twinkleRate: 0.08,    // per-second chance per particle to start
    twinkleMs: 1100,      // duration
    twinkleDepth: 0.85,   // dip depth (0..1) -> 0.85 = 15% alpha at mid
    twinkleSizePulse: 0.12,
    // Swirl (cursor stir)
    swirlRadius: 200,
    swirlStrength: 0.10,
    swirlFalloff: 2.0,
    velDamp: 0.92,
    // Scroll parallax
    scrollStrength: 0.10,
    scrollDamp: 0.10,
    // Continuous rotation
    rotActive: 0.000003,  // rad/ms when active
    rotIdle:   0.000010,  // rad/ms when fully idle
    idleDelayMs: 1200,
    idleFadeMs:  800,
    // Vignette
    vignetteOuter: 1.2,   // 0.9..1.6
    // Preset name (for GUI)
    preset: 'Calm Nebula',
    // Re-seed (button in GUI)
    reseed: () => initParticles()
  };

  const PRESETS = {
    'Calm Nebula': {
      dominantWeight: 0.9, density: 1.0, twinkleRate: 0.06, twinkleMs: 1200,
      twinkleDepth: 0.8, swirlRadius: 180, swirlStrength: 0.07, swirlFalloff: 2.0,
      scrollStrength: 0.08, rotActive: 0.000003, rotIdle: 0.000010, vignetteOuter: 1.2
    },
    'Spiral Galaxy': {
      dominantWeight: 0.8, density: 1.2, twinkleRate: 0.07, twinkleMs: 1400,
      twinkleDepth: 0.9, swirlRadius: 260, swirlStrength: 0.12, swirlFalloff: 1.8,
      scrollStrength: 0.12, rotActive: 0.000004, rotIdle: 0.000014, vignetteOuter: 1.35
    },
    'Starfield (calm)': {
      dominantWeight: 0.95, density: 0.9, twinkleRate: 0.04, twinkleMs: 1000,
      twinkleDepth: 0.7, swirlRadius: 140, swirlStrength: 0.05, swirlFalloff: 2.4,
      scrollStrength: 0.06, rotActive: 0.000002, rotIdle: 0.000007, vignetteOuter: 1.15
    },
    'Swirl Storm': {
      dominantWeight: 0.75, density: 1.4, twinkleRate: 0.10, twinkleMs: 1200,
      twinkleDepth: 0.95, swirlRadius: 300, swirlStrength: 0.16, swirlFalloff: 1.6,
      scrollStrength: 0.14, rotActive: 0.000005, rotIdle: 0.000018, vignetteOuter: 1.4
    }
  };

  // Palette (mostly yellows with rare accents)
  const DOMINANT = ["#F5DF9A","#F5DF9A","#F5DF9A","#F3F59A","#F3F59A","#F0EF75","#F0EF75"];
  const ACCENTS  = ["#F47A27","#A4F3F5"];

  // Utils
  const clamp01 = v => Math.max(0, Math.min(1, v));
  const hexToRgb = (hex) => {
    const m = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return m ? { r: parseInt(m[1],16), g: parseInt(m[2],16), b: parseInt(m[3],16) } : {r:255,g:255,b:255};
  };
  const rgba = (rgb, a) => `rgba(${rgb.r},${rgb.g},${rgb.b},${a})`;

  // Canvas
  const c = document.createElement('canvas');
  c.id = 'bgfx';
  Object.assign(c.style, { position:'fixed', inset:'0', width:'100%', height:'100%', zIndex:'-1', pointerEvents:'none' });
  document.body.prepend(c);
  const ctx = c.getContext('2d');

  // Particles
  let P = [];
  function autoCount(){
    const w = c.width / DPR, h = c.height / DPR;
    const base = Math.round((w*h) / 2800);
    const clamped = Math.max(220, Math.min(base, 1200));
    return Math.round(clamped * clamp01(CFG.density));
  }
  function initParticles(){
    const w = c.width / DPR, h = c.height / DPR;
    const COUNT = autoCount();
    const M = CFG.edgeMargin;
    P = new Array(COUNT).fill(0).map(()=> {
      const isDominant = Math.random() < CFG.dominantWeight;
      const baseHex = isDominant
        ? DOMINANT[(Math.random()*DOMINANT.length)|0]
        : ACCENTS[(Math.random()*ACCENTS.length)|0];
      return {
        x: Math.random()*(w + M*2) - M,
        y: Math.random()*(h + M*2) - M,
        z: Math.random()*1 + 0.2,            // 0.2..1.2 (nearer = bigger effects)
        r: Math.random()*1.6 + 0.6,
        dx: (Math.random()*0.3+0.05)*(Math.random()<0.5?-1:1),
        dy: (Math.random()*0.2+0.03)*(Math.random()<0.5?-1:1),
        vx: 0, vy: 0,
        alphaBase: Math.random()*0.35 + 0.35,
        rgb: hexToRgb(baseHex),
        twinkleUntil: 0
      };
    });
  }

  // Resize/backing scale
  function fit(){
    const { innerWidth:w, innerHeight:h } = window;
    c.width  = Math.floor(w * DPR);
    c.height = Math.floor(h * DPR);
    ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
    ctx.clearRect(0,0,c.width/DPR,c.height/DPR);
    initParticles();
  }
  window.addEventListener('resize', fit);

  // Cursor & Scroll
  const mouse = { xN: 0, yN: 0, x: 0, y: 0 };
  let px = 0, py = 0, lastMouseMove = 0;
  function setMouse(clientX, clientY){
    const w = c.clientWidth, h = c.clientHeight;
    mouse.x = clientX; mouse.y = clientY;
    mouse.xN = (clientX / w) * 2 - 1;
    mouse.yN = -((clientY / h) * 2 - 1);
    lastMouseMove = performance.now();
  }
  window.addEventListener('mousemove', e => setMouse(e.clientX, e.clientY), { passive:true });
  window.addEventListener('touchmove', e => { const t = e.touches[0]; if (t) setMouse(t.clientX, t.clientY); }, { passive:true });

  let sTarget = 0, sOffset = 0, lastScroll = 0;
  function onScroll(){ sTarget = window.scrollY || window.pageYOffset || 0; lastScroll = performance.now(); }
  window.addEventListener('scroll', onScroll, { passive:true }); onScroll();

  // Twinkles
  function maybeStartTwinkles(dtMs){
    const expected = P.length * CFG.twinkleRate * (dtMs / 1000);
    let toStart = Math.floor(expected);
    if (Math.random() < (expected - toStart)) toStart += 1;
    for (let k=0; k<toStart; k++){
      const p = P[(Math.random()*P.length)|0];
      p.twinkleUntil = performance.now() + CFG.twinkleMs;
    }
  }

  // Animation
  let lastT = performance.now();
  let rotTheta = 0;
  function tick(){
    requestAnimationFrame(tick);
    const now = performance.now();
    const dt  = Math.min(50, now - lastT); lastT = now;

    const w = c.width / DPR, h = c.height / DPR;
    const cx = w*0.5, cy = h*0.5;

    // cursor parallax
    px += (mouse.xN - px) * 0.06;
    py += (mouse.yN - py) * 0.06;

    // scroll parallax
    sOffset += (sTarget - sOffset) * CFG.scrollDamp;

    // continuous rotation speed (blend active/idle)
    const lastActivity = Math.max(lastMouseMove, lastScroll);
    const idleT = clamp01((now - lastActivity - CFG.idleDelayMs) / CFG.idleFadeMs);
    const rotSpeed = CFG.rotActive + (CFG.rotIdle - CFG.rotActive) * idleT;
    rotTheta += rotSpeed * dt;

    // twinkles
    maybeStartTwinkles(dt);

    // background vignette
    ctx.clearRect(0,0,w,h);
    const vg = ctx.createRadialGradient(
      w*0.8, (h*0.2) + (sOffset * 0.025), Math.min(w,h)*0.1,
      w*0.5, (h*0.5) + (sOffset * 0.025), Math.max(w,h)*CFG.vignetteOuter
    );
    vg.addColorStop(0, 'rgba(14,19,26,0.30)');
    vg.addColorStop(1, 'rgba(11,13,16,0.00)');
    ctx.fillStyle = vg;
    ctx.fillRect(0,0,w,h);

    // stir strength decays after movement
    const swirlActivity = clamp01(1 - (now - lastMouseMove) / 800);

    ctx.save();
    ctx.globalCompositeOperation = 'lighter';

    const M = CFG.edgeMargin;
    for (let i=0; i<P.length; i++){
      const p = P[i];

      // depth-based cursor parallax
      const parX = px * (1.8 - p.z) * 8;
      const parY = py * (1.8 - p.z) * 6;

      // swirl (tangential)
      const dxm = (p.x - mouse.x);
      const dym = (p.y - mouse.y);
      const dist = Math.hypot(dxm, dym);
      if (dist < CFG.swirlRadius && swirlActivity > 0.01){
        const inv = dist > 0.0001 ? 1.0 / dist : 0.0;
        const tN  = 1 - (dist / CFG.swirlRadius);
        const fall= Math.pow(tN, CFG.swirlFalloff);
        const tx = -dym * inv, ty = dxm * inv;
        const k  = CFG.swirlStrength * fall * (0.6 + 0.4*p.z) * swirlActivity;
        p.vx += tx * k; p.vy += ty * k;
      }

      // natural drift + swirl velocity
      p.x += (p.dx * 0.15 * p.z) + p.vx;
      p.y += (p.dy * 0.15 * p.z) + p.vy;
      p.vx *= CFG.velDamp; p.vy *= CFG.velDamp;

      // wrap with margin
      if (p.x < -M) p.x = w + M; if (p.x > w + M) p.x = -M;
      if (p.y < -M) p.y = h + M; if (p.y > h + M) p.y = -M;

      // parallax-by-scroll (nearer moves more)
      const depthParallax = (1.4 - p.z);
      const scrollY = sOffset * CFG.scrollStrength * depthParallax;

      // base + cursor + scroll
      let x = p.x + parX;
      let y = p.y + parY + scrollY;

      // continuous sky rotation
      {
        const dx = x - cx, dy = y - cy;
        const s = Math.sin(rotTheta), c0 = Math.cos(rotTheta);
        x = cx + dx * c0 - dy * s;
        y = cy + dx * s + dy * c0;
      }

      // opacity twinkle
      let a = p.alphaBase, sizeMul = 1;
      if (now < p.twinkleUntil){
        const t = 1 - ((p.twinkleUntil - now) / CFG.twinkleMs); // 0..1
        const bell = Math.sin(Math.PI * Math.max(0, Math.min(1, t))); // 0..1..0
        a = p.alphaBase * (1 - CFG.twinkleDepth * bell);
        sizeMul = 1 + CFG.twinkleSizePulse * bell;
      }

      if (a < 0.02) continue;

      // draw
      ctx.fillStyle = rgba(p.rgb, a * 0.18);
      ctx.beginPath(); ctx.arc(x, y, p.r*3.2*sizeMul, 0, Math.PI*2); ctx.fill();

      ctx.fillStyle = rgba(p.rgb, a);
      ctx.beginPath(); ctx.arc(x, y, p.r*sizeMul, 0, Math.PI*2); ctx.fill();
    }

    ctx.restore();
  }

  // -------- GUI (press "g" to toggle; or use ?gui=1) --------
  let gui, guiVisible = false;
  function applyPreset(name){
    const p = PRESETS[name]; if (!p) return;
    Object.assign(CFG, p, { preset: name });
    initParticles();
  }
  function maybeInitGUI(){
    const wantsGUI = location.search.includes('gui=1');
    if (!('lil' in window) && !wantsGUI) return; // load only on demand if available
    if (!window.lil || gui) return;
    gui = new window.lil.GUI({ title: 'Galaxy Controls', width: 340 });
    guiVisible = true;

    gui.add(CFG, 'preset', Object.keys(PRESETS)).onChange(applyPreset);
    const fP = gui.addFolder('Particles');
    fP.add(CFG, 'density', 0.5, 2.0, 0.05).onFinishChange(initParticles);
    fP.add(CFG, 'dominantWeight', 0.5, 1.0, 0.01).onFinishChange(initParticles);
    fP.add(CFG, 'edgeMargin', 0, 200, 5).onFinishChange(initParticles);
    fP.add(CFG, 'reseed');

    const fT = gui.addFolder('Twinkle');
    fT.add(CFG, 'twinkleRate', 0.0, 0.2, 0.005);
    fT.add(CFG, 'twinkleMs', 400, 2000, 50);
    fT.add(CFG, 'twinkleDepth', 0.5, 0.99, 0.01);
    fT.add(CFG, 'twinkleSizePulse', 0.0, 0.3, 0.01);

    const fS = gui.addFolder('Swirl');
    fS.add(CFG, 'swirlRadius', 60, 400, 5);
    fS.add(CFG, 'swirlStrength', 0.02, 0.25, 0.005);
    fS.add(CFG, 'swirlFalloff', 1.2, 3.0, 0.1);
    fS.add(CFG, 'velDamp', 0.85, 0.98, 0.005);

    const fScroll = gui.addFolder('Scroll & Rotation');
    fScroll.add(CFG, 'scrollStrength', 0.02, 0.2, 0.005);
    fScroll.add(CFG, 'scrollDamp', 0.04, 0.2, 0.01);
    fScroll.add(CFG, 'rotActive', 0.000001, 0.00001, 0.000001);
    fScroll.add(CFG, 'rotIdle',   0.000004, 0.00004, 0.000001);
    fScroll.add(CFG, 'idleDelayMs', 500, 3000, 50);
    fScroll.add(CFG, 'idleFadeMs',  200, 2000, 50);

    const fV = gui.addFolder('Vignette');
    fV.add(CFG, 'vignetteOuter', 0.9, 1.6, 0.01);

    gui.onFinishChange(()=>{}); // keep open
  }
  document.addEventListener('keydown', (e)=>{
    if (e.key.toLowerCase() === 'g'){
      if (!gui) { maybeInitGUI(); return; }
      guiVisible = !guiVisible;
      gui.domElement.style.display = guiVisible ? 'block' : 'none';
    }
  });
  // Auto-open if ?gui=1
  if (location.search.includes('gui=1')) {
    window.addEventListener('load', maybeInitGUI, { once:true });
  }

  // Boot
  fit();
  // Apply default preset on first run (matches starting CFG values fairly closely)
  applyPreset(CFG.preset);
  tick();
})();
