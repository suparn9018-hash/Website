/* ═══════════════════════════════════════════════════════
   ANTRIKSH CLOUD — script.js
   Three.js + GSAP + preserved features
═══════════════════════════════════════════════════════ */

/* ── 1. CONFIG & DETECTION ──────────────────────────── */
const IS_MOBILE = window.innerWidth < 768 || !window.matchMedia('(hover:hover)').matches;
const DPR       = Math.min(window.devicePixelRatio || 1, IS_MOBILE ? 1.5 : 2);
const HAS_WEBGL = (() => { try { return !!document.createElement('canvas').getContext('webgl2') || !!document.createElement('canvas').getContext('webgl'); } catch(e){ return false; } })();

/* ── 2. THREE.JS SCENE MANAGER ──────────────────────── */
let SceneManager = null;

function initThree() {
  if (!HAS_WEBGL || typeof THREE === 'undefined') return;

  const canvas = document.getElementById('three-canvas');
  if (!canvas) return;

  // ── Renderer ──
  const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: !IS_MOBILE });
  renderer.setPixelRatio(DPR);
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setClearColor(0x000000, 0);
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.1;

  // ── Camera ──
  const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 1000);
  camera.position.z = 12;

  // ── Clock ──
  const clock = new THREE.Clock();

  // ─────────────────────────────────────────────────────
  // SCENE 1 — Hero: GPU cluster constellation
  // ─────────────────────────────────────────────────────
  const heroScene = new THREE.Scene();

  // Ambient lights
  heroScene.add(new THREE.AmbientLight(0x0a0e1a, 1));
  const heroLight1 = new THREE.PointLight(0x3b82f6, IS_MOBILE ? 2 : 3, 40);
  heroLight1.position.set(-8, 6, 5);
  heroScene.add(heroLight1);
  const heroLight2 = new THREE.PointLight(0x7c3aed, IS_MOBILE ? 1.5 : 2.5, 35);
  heroLight2.position.set(8, -4, 3);
  heroScene.add(heroLight2);

  // GPU modules (6×12 grid)
  const gpuGroup   = new THREE.Group();
  const gpuModules = [];
  const gpuGeo     = new THREE.BoxGeometry(0.5, 0.08, 0.28);
  const COLS = IS_MOBILE ? 6 : 12, ROWS = IS_MOBILE ? 4 : 6;
  const gapX = 0.72, gapY = 0.52;
  const offsetX = -(COLS - 1) * gapX / 2;
  const offsetY = -(ROWS - 1) * gapY / 2;

  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      const t = (r * COLS + c) / (ROWS * COLS);
      const mat = new THREE.MeshStandardMaterial({
        color: new THREE.Color().setHSL(0.6 + t * 0.12, 0.7, 0.12),
        emissive: new THREE.Color().setHSL(0.6 + t * 0.12, 1, 0.06),
        emissiveIntensity: 0.8 + Math.random() * 0.4,
        metalness: 0.9, roughness: 0.2,
      });
      const mesh = new THREE.Mesh(gpuGeo, mat);
      mesh.position.set(offsetX + c * gapX, offsetY + r * gapY, (Math.random() - 0.5) * 0.2);
      mesh.rotation.z = (Math.random() - 0.5) * 0.05;
      mesh.userData.baseEmissive = mat.emissiveIntensity;
      mesh.userData.phase = Math.random() * Math.PI * 2;
      gpuGroup.add(mesh);
      gpuModules.push(mesh);
    }
  }
  heroScene.add(gpuGroup);

  // NVLink connection lines
  const lineMat = new THREE.LineBasicMaterial({ color: 0x3b82f6, transparent: true, opacity: 0.18 });
  const lineGroup = new THREE.Group();
  for (let i = 0; i < gpuModules.length - 1; i += 3) {
    const pts = [gpuModules[i].position.clone(), gpuModules[Math.min(i + COLS, gpuModules.length-1)].position.clone()];
    lineGroup.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts), lineMat));
  }
  heroScene.add(lineGroup);

  // Particle data-flow
  const partCount  = IS_MOBILE ? 600 : 2000;
  const partPositions = new Float32Array(partCount * 3);
  const partVelocities = new Float32Array(partCount * 3);
  for (let i = 0; i < partCount; i++) {
    partPositions[i*3]   = (Math.random() - 0.5) * 14;
    partPositions[i*3+1] = (Math.random() - 0.5) * 8;
    partPositions[i*3+2] = (Math.random() - 0.5) * 6 + 2;
    partVelocities[i*3]   = (Math.random() - 0.5) * 0.008;
    partVelocities[i*3+1] = (Math.random() - 0.5) * 0.005;
    partVelocities[i*3+2] = -0.01 - Math.random() * 0.015;
  }
  const partGeo = new THREE.BufferGeometry();
  partGeo.setAttribute('position', new THREE.BufferAttribute(partPositions, 3));
  const partMat = new THREE.PointsMaterial({ color: 0x60a5fa, size: 0.04, transparent: true, opacity: 0.7, sizeAttenuation: true });
  const particles = new THREE.Points(partGeo, partMat);
  heroScene.add(particles);

  // ─────────────────────────────────────────────────────
  // SCENE 2 — GPU: Rotating Chip model
  // ─────────────────────────────────────────────────────
  const gpuScene = new THREE.Scene();
  gpuScene.add(new THREE.AmbientLight(0x0f1629, 1.2));
  const gpuSceneLight1 = new THREE.PointLight(0x3b82f6, 4, 30);
  gpuSceneLight1.position.set(5, 5, 8);
  gpuScene.add(gpuSceneLight1);
  const gpuSceneLight2 = new THREE.PointLight(0x7c3aed, 2, 25);
  gpuSceneLight2.position.set(-4, -3, 6);
  gpuScene.add(gpuSceneLight2);

  const chipGroup = new THREE.Group();

  // PCB board
  const boardMat = new THREE.MeshStandardMaterial({ color: 0x0a2a1a, metalness: 0.4, roughness: 0.6, emissive: 0x001a0a, emissiveIntensity: 0.3 });
  chipGroup.add(new THREE.Mesh(new THREE.BoxGeometry(4.2, 3.0, 0.08), boardMat));

  // GPU die (large chip)
  const dieMat = new THREE.MeshStandardMaterial({ color: 0x1a1a2e, metalness: 0.8, roughness: 0.15, emissive: 0x3b82f6, emissiveIntensity: 0.4 });
  const dieChip = new THREE.Mesh(new THREE.BoxGeometry(1.4, 1.4, 0.12), dieMat);
  dieChip.position.set(0, 0.1, 0.1);
  dieChip.userData.role = 'die';
  chipGroup.add(dieChip);

  // HBM3e memory stacks
  const hbmMat = new THREE.MeshStandardMaterial({ color: 0x0f1629, metalness: 0.9, roughness: 0.1, emissive: 0x7c3aed, emissiveIntensity: 0.5 });
  [[-1.2,0.6],[-1.2,-0.4],[1.2,0.6],[1.2,-0.4]].forEach(([x,y]) => {
    const hbm = new THREE.Mesh(new THREE.BoxGeometry(0.38, 0.55, 0.18), hbmMat);
    hbm.position.set(x, y, 0.13);
    hbm.userData.role = 'hbm';
    chipGroup.add(hbm);
  });

  // Heatsink fins
  const hsMat = new THREE.MeshStandardMaterial({ color: 0x2a2a2a, metalness: 0.95, roughness: 0.05 });
  for (let i = -5; i <= 5; i++) {
    const fin = new THREE.Mesh(new THREE.BoxGeometry(3.8, 0.04, 0.8), hsMat);
    fin.position.set(0, i * 0.22, 0.5);
    chipGroup.add(fin);
  }

  // NVLink connectors strip
  const nvMat = new THREE.MeshStandardMaterial({ color: 0x1a3a5c, metalness: 0.7, roughness: 0.3, emissive: 0x60a5fa, emissiveIntensity: 0.6 });
  for (let i = 0; i < 8; i++) {
    const conn = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.18, 0.06), nvMat);
    conn.position.set(-1.8 + i * 0.52, -1.3, 0.05);
    conn.userData.role = 'nvlink';
    chipGroup.add(conn);
  }

  chipGroup.position.set(2.5, 0, 0);
  gpuScene.add(chipGroup);

  // ─────────────────────────────────────────────────────
  // SCENE 3 — Architecture: Exploded stack layers
  // ─────────────────────────────────────────────────────
  const archScene = new THREE.Scene();
  archScene.add(new THREE.AmbientLight(0x050a14, 1));
  archScene.add(Object.assign(new THREE.PointLight(0x3b82f6, 3, 40), { position: new THREE.Vector3(0, 5, 10) }));
  archScene.add(Object.assign(new THREE.PointLight(0x7c3aed, 2, 35), { position: new THREE.Vector3(0, -4, 8) }));

  const LAYER_COLORS = [0x16a34a, 0x0ea5e9, 0x7c3aed, 0xf59e0b, 0xef4444, 0x3b82f6];
  const LAYER_LABELS = ['Power','Cooling','GPUs','Fabric','Sovereign','API'];
  const glassPlanes  = [];
  const planeSep     = IS_MOBILE ? 1.2 : 1.6;

  LAYER_COLORS.forEach((col, i) => {
    const planeMat = new THREE.MeshPhysicalMaterial({
      color: col, transparent: true, opacity: 0.12,
      roughness: 0.05, metalness: 0.1,
      side: THREE.DoubleSide,
      emissive: col, emissiveIntensity: 0.08,
    });
    const plane = new THREE.Mesh(new THREE.PlaneGeometry(8, 4.5), planeMat);
    plane.position.set(0, 0, (i - 2.5) * planeSep);
    plane.userData.baseZ = (i - 2.5) * planeSep;
    plane.userData.color = col;
    archScene.add(plane);
    glassPlanes.push(plane);

    // Edge glow
    const edgeMat = new THREE.LineBasicMaterial({ color: col, transparent: true, opacity: 0.5 });
    const pts = [new THREE.Vector3(-4,-2.25,0), new THREE.Vector3(4,-2.25,0), new THREE.Vector3(4,2.25,0), new THREE.Vector3(-4,2.25,0), new THREE.Vector3(-4,-2.25,0)];
    const edge = new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts), edgeMat);
    plane.add(edge);
  });

  // Animated sphere that passes through layers
  const sphereGeo = new THREE.SphereGeometry(0.22, 24, 24);
  const sphereMat = new THREE.MeshStandardMaterial({ color: 0x22c55e, emissive: 0x22c55e, emissiveIntensity: 2, metalness: 0, roughness: 0 });
  const archSphere = new THREE.Mesh(sphereGeo, sphereMat);
  archScene.add(archSphere);

  // Sphere glow via PointLight
  const sphereLight = new THREE.PointLight(0x22c55e, 3, 4);
  archSphere.add(sphereLight);

  // ─────────────────────────────────────────────────────
  // SCENE 4 — Roadmap: Growing Data Center
  // ─────────────────────────────────────────────────────
  const roadmapScene = new THREE.Scene();
  roadmapScene.add(new THREE.AmbientLight(0x050a14, 0.8));
  roadmapScene.add(Object.assign(new THREE.PointLight(0x3b82f6, 3, 50), { position: new THREE.Vector3(0, 10, 10) }));
  roadmapScene.add(Object.assign(new THREE.PointLight(0x7c3aed, 2, 40), { position: new THREE.Vector3(8, 5, 5) }));

  // Ground plane
  const groundMat = new THREE.MeshStandardMaterial({ color: 0x060c1a, roughness: 0.9, metalness: 0.1 });
  roadmapScene.add(new THREE.Mesh(new THREE.PlaneGeometry(30, 20), Object.assign(groundMat, {})));
  roadmapScene.children[roadmapScene.children.length - 1].rotation.x = -Math.PI / 2;
  roadmapScene.children[roadmapScene.children.length - 1].position.y = -1.5;

  const buildingGroup = new THREE.Group();
  const allBuildings   = [];

  function makeBuilding(x, y, z, w, h, d, phase, emissiveColor) {
    const mat = new THREE.MeshStandardMaterial({
      color: 0x0f1629, metalness: 0.6, roughness: 0.4,
      emissive: emissiveColor, emissiveIntensity: 0.3,
    });
    const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
    mesh.position.set(x, y + h / 2 - 1.5, z);
    mesh.userData.phase    = phase;
    mesh.userData.targetY  = y + h / 2 - 1.5;
    mesh.userData.scaleH   = h;
    mesh.scale.y = 0.001;
    buildingGroup.add(mesh);
    allBuildings.push(mesh);

    // Windows
    const winMat = new THREE.MeshStandardMaterial({ color: emissiveColor, emissive: emissiveColor, emissiveIntensity: 1.5, transparent: true, opacity: 0 });
    for (let row = 0; row < Math.floor(h * 2); row++) {
      for (let col = 0; col < Math.floor(w * 3); col++) {
        const win = new THREE.Mesh(new THREE.PlaneGeometry(0.08, 0.05), winMat.clone());
        win.position.set(-w/2 + 0.2 + col * (w / Math.floor(w*3)), -h/2 + 0.15 + row * 0.14, d/2 + 0.001);
        win.userData.isWindow = true;
        win.userData.phase    = phase;
        mesh.add(win);
      }
    }
    return mesh;
  }

  // Phase 1: 3 MW — small container module
  makeBuilding(0, 0, 0, 1.5, 0.8, 2.5, 1, 0x3b82f6);

  // Phase 2: 100 MW — multiple buildings
  makeBuilding(-3.5, 0, 0, 2.5, 1.4, 3, 2, 0x7c3aed);
  makeBuilding(3.5, 0, 0, 2.5, 1.4, 3, 2, 0x7c3aed);
  makeBuilding(0, 0, -3, 1.8, 1.2, 2, 2, 0x7c3aed);

  // Phase 3: 500 MW — full campus
  makeBuilding(-6, 0, 1, 3, 2, 3.5, 3, 0x22c55e);
  makeBuilding(6, 0, 1, 3, 2, 3.5, 3, 0x22c55e);
  makeBuilding(-6, 0, -3, 2.5, 1.8, 2.5, 3, 0x22c55e);
  makeBuilding(6, 0, -3, 2.5, 1.8, 2.5, 3, 0x22c55e);
  makeBuilding(0, 0, 3.5, 4, 2.5, 2, 3, 0x22c55e);

  roadmapScene.add(buildingGroup);
  buildingGroup.position.set(0, 0, 0);

  // ─────────────────────────────────────────────────────
  // AMBIENT PARTICLES (always visible across all scenes)
  // ─────────────────────────────────────────────────────
  const ambCount = IS_MOBILE ? 60 : 200;
  const ambPos   = new Float32Array(ambCount * 3);
  const ambVel   = new Float32Array(ambCount * 3);
  for (let i = 0; i < ambCount; i++) {
    ambPos[i*3]   = (Math.random() - 0.5) * 20;
    ambPos[i*3+1] = (Math.random() - 0.5) * 14;
    ambPos[i*3+2] = (Math.random() - 0.5) * 8;
    ambVel[i*3]   = (Math.random() - 0.5) * 0.003;
    ambVel[i*3+1] = (Math.random() - 0.5) * 0.002 + 0.001;
    ambVel[i*3+2] = (Math.random() - 0.5) * 0.001;
  }
  const ambGeo = new THREE.BufferGeometry();
  ambGeo.setAttribute('position', new THREE.BufferAttribute(ambPos, 3));
  const ambMat = new THREE.PointsMaterial({ color: 0x3b82f6, size: 0.025, transparent: true, opacity: 0.35, sizeAttenuation: true });

  // Create ambient points in every scene
  [heroScene, gpuScene, archScene, roadmapScene].forEach(sc => {
    sc.add(new THREE.Points(ambGeo, ambMat.clone()));
  });

  // ─────────────────────────────────────────────────────
  // ACTIVE SCENE MANAGEMENT
  // ─────────────────────────────────────────────────────
  let activeScene    = heroScene;
  let activeProgress = 0; // 0–1 for arch sphere animation
  let roadmapPhase   = 1;
  let mx = 0, my = 0;
  let targetMX = 0, targetMY = 0;

  document.addEventListener('mousemove', e => {
    targetMX = (e.clientX / window.innerWidth - 0.5) * 2;
    targetMY = -(e.clientY / window.innerHeight - 0.5) * 2;
  });

  function setScene(scene) { activeScene = scene; }

  // ─────────────────────────────────────────────────────
  // ANIMATION LOOP
  // ─────────────────────────────────────────────────────
  function animate() {
    requestAnimationFrame(animate);
    const t = clock.getElapsedTime();
    const dt = clock.getDelta ? 0.016 : 0.016;

    // Smooth mouse
    mx += (targetMX - mx) * 0.04;
    my += (targetMY - my) * 0.04;

    /* ── Hero ── */
    if (activeScene === heroScene) {
      camera.position.x += (mx * 0.8 - camera.position.x) * 0.03;
      camera.position.y += (my * 0.5 - camera.position.y) * 0.03;
      camera.lookAt(0, 0, 0);

      // Pulse GPU modules
      gpuModules.forEach((m, i) => {
        const pulse = Math.sin(t * 1.2 + m.userData.phase) * 0.3 + 0.7;
        m.material.emissiveIntensity = m.userData.baseEmissive * pulse;
      });

      // Animate particles
      const pos = particles.geometry.attributes.position.array;
      for (let i = 0; i < partCount; i++) {
        pos[i*3]   += partVelocities[i*3];
        pos[i*3+1] += partVelocities[i*3+1];
        pos[i*3+2] += partVelocities[i*3+2];
        if (pos[i*3+2] < -4) { pos[i*3+2] = 6; pos[i*3] = (Math.random()-0.5)*14; pos[i*3+1] = (Math.random()-0.5)*8; }
      }
      particles.geometry.attributes.position.needsUpdate = true;

      heroLight1.position.x = Math.sin(t * 0.3) * 6;
      heroLight2.position.x = Math.cos(t * 0.25) * 6;
    }

    /* ── GPU chip ── */
    if (activeScene === gpuScene) {
      chipGroup.rotation.y = t * 0.25 + mx * 0.3;
      chipGroup.rotation.x = my * 0.15;
      camera.position.x += (2.5 - camera.position.x) * 0.05;
      camera.position.y += (0   - camera.position.y) * 0.05;
      camera.lookAt(2.5, 0, 0);
    }

    /* ── Architecture ── */
    if (activeScene === archScene) {
      camera.position.x += (mx * 1.5 - camera.position.x) * 0.04;
      camera.position.y += (my * 1.0 - camera.position.y) * 0.04;
      camera.lookAt(0, 0, 0);

      // Animate sphere through layers
      const sP   = activeProgress;
      const sZ   = -4 + sP * 12;
      archSphere.position.z = sZ;
      archSphere.position.y = Math.sin(t * 2) * 0.3;

      // Change sphere colour at each layer
      const layerIdx = Math.floor(sP * LAYER_COLORS.length);
      if (layerIdx < LAYER_COLORS.length) {
        const col = new THREE.Color(LAYER_COLORS[layerIdx]);
        sphereMat.color.set(col);
        sphereMat.emissive.set(col);
        sphereLight.color.set(col);
      }

      // Highlight active layer
      glassPlanes.forEach((p, i) => {
        const active = Math.abs(p.position.z - sZ) < 1;
        p.material.opacity = active ? 0.25 : 0.1;
        p.material.emissiveIntensity = active ? 0.2 : 0.05;
      });
    }

    /* ── Roadmap ── */
    if (activeScene === roadmapScene) {
      camera.position.x += (mx * 2 - camera.position.x) * 0.03;
      camera.position.y += (4 - camera.position.y) * 0.04;
      camera.position.z  = 12;
      camera.lookAt(0, 0, 0);

      // Grow buildings based on phase
      allBuildings.forEach(b => {
        if (b.userData.phase <= roadmapPhase) {
          b.scale.y += (1 - b.scale.y) * 0.04;
          // Show windows
          b.children.forEach(w => {
            if (w.userData.isWindow) {
              w.material.opacity = Math.min(w.material.opacity + 0.02, 0.85);
            }
          });
        }
      });

      buildingGroup.rotation.y += 0.002;
    }

    // Animate ambient particles
    const ambPositions = ambGeo.attributes.position.array;
    for (let i = 0; i < ambCount; i++) {
      ambPositions[i*3]   += ambVel[i*3];
      ambPositions[i*3+1] += ambVel[i*3+1];
      ambPositions[i*3+2] += ambVel[i*3+2];
      if (ambPositions[i*3+1] > 8)  ambPositions[i*3+1] = -8;
      if (ambPositions[i*3]   > 12) ambPositions[i*3]   = -12;
      if (ambPositions[i*3]   < -12)ambPositions[i*3]   = 12;
    }
    ambGeo.attributes.position.needsUpdate = true;

    renderer.render(activeScene, camera);
  }

  // Resize
  window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  });

  canvas.classList.add('ready');
  animate();

  SceneManager = { setScene, heroScene, gpuScene, archScene, roadmapScene, glassPlanes,
    get activeProgress() { return activeProgress; },
    set activeProgress(v) { activeProgress = v; },
    get roadmapPhase() { return roadmapPhase; },
    set roadmapPhase(v) { roadmapPhase = v; },
    camera
  };
}

/* ── 3. GSAP SCROLL SYSTEM ──────────────────────────── */
function initGSAP() {
  if (typeof gsap === 'undefined' || typeof ScrollTrigger === 'undefined') {
    // Fallback: use IntersectionObserver
    initFallbackReveal();
    return;
  }

  gsap.registerPlugin(ScrollTrigger);

  // ── Section reveals (replace IntersectionObserver) ──
  gsap.utils.toArray('.reveal').forEach(el => {
    gsap.fromTo(el, { opacity: 0, y: 30 }, {
      opacity: 1, y: 0, duration: 0.8, ease: 'power3.out',
      scrollTrigger: { trigger: el, start: 'top 88%', toggleActions: 'play none none none' }
    });
  });
  gsap.utils.toArray('.reveal-scale').forEach(el => {
    gsap.fromTo(el, { opacity: 0, scale: 0.92 }, {
      opacity: 1, scale: 1, duration: 0.7, ease: 'power3.out',
      scrollTrigger: { trigger: el, start: 'top 88%', toggleActions: 'play none none none' }
    });
  });

  // Keep old fade-up + scale-in working with GSAP too
  gsap.utils.toArray('.fade-up, .scale-in').forEach(el => {
    const isScale = el.classList.contains('scale-in');
    gsap.fromTo(el, { opacity: 0, y: isScale ? 0 : 24, scale: isScale ? 0.93 : 1 }, {
      opacity: 1, y: 0, scale: 1, duration: 0.7, ease: 'power3.out',
      scrollTrigger: { trigger: el, start: 'top 88%', toggleActions: 'play none none none' }
    });
  });

  // ── Count-up numbers ──
  gsap.utils.toArray('.count-num').forEach(el => {
    const target  = parseFloat(el.dataset.count);
    const suffix  = el.dataset.suffix || '';
    const prefix  = el.dataset.prefix || '';
    const isInt   = Number.isInteger(target);
    ScrollTrigger.create({
      trigger: el, start: 'top 85%', once: true,
      onEnter: () => {
        gsap.fromTo({ val: 0 }, { val: target, duration: 1.6, ease: 'power2.out',
          onUpdate: function () {
            el.textContent = prefix + (isInt ? Math.round(this.targets()[0].val) : this.targets()[0].val.toFixed(1)) + suffix;
          }
        });
      }
    });
  });

  // ── Bar fills ──
  gsap.utils.toArray('.bar-fill, .bw-fill').forEach(el => {
    ScrollTrigger.create({
      trigger: el, start: 'top 85%', once: true,
      onEnter: () => { gsap.to(el, { width: el.dataset.w || '0%', duration: 1.3, ease: 'power2.out' }); }
    });
  });

  // ── Timeline power bars ──
  gsap.utils.toArray('.tl-pw-fill').forEach(el => {
    ScrollTrigger.create({
      trigger: el, start: 'top 85%', once: true,
      onEnter: () => { gsap.to(el, { width: el.dataset.pw || '0%', duration: 1.3, ease: 'power2.out' }); }
    });
  });

  if (!SceneManager) return;

  // ── Hero: camera zoom out on scroll ──
  ScrollTrigger.create({
    trigger: '#hero', start: 'top top', end: 'bottom top', scrub: 1,
    onUpdate: self => {
      if (SceneManager) SceneManager.camera.position.z = 12 + self.progress * 8;
    }
  });

  // ── Scene switching ──
  const sceneMap = [
    { id: '#gpus',         scene: () => SceneManager.gpuScene },
    { id: '#architecture', scene: () => SceneManager.archScene },
    { id: '#roadmap',      scene: () => SceneManager.roadmapScene },
  ];
  const heroSections = ['#why','#sovereign','#how','#pricing','#ecosystem','#builders','#traction'];

  heroSections.forEach(id => {
    const el = document.querySelector(id);
    if (!el) return;
    ScrollTrigger.create({
      trigger: el, start: 'top 60%', end: 'bottom 40%',
      onEnter: () => SceneManager.setScene(SceneManager.heroScene),
      onEnterBack: () => SceneManager.setScene(SceneManager.heroScene),
    });
  });

  sceneMap.forEach(({ id, scene }) => {
    const el = document.querySelector(id);
    if (!el) return;
    ScrollTrigger.create({
      trigger: el, start: 'top 60%', end: 'bottom 40%',
      onEnter:     () => SceneManager.setScene(scene()),
      onEnterBack: () => SceneManager.setScene(scene()),
      onLeave:     () => SceneManager.setScene(SceneManager.heroScene),
      onLeaveBack: () => SceneManager.setScene(SceneManager.heroScene),
    });
  });

  // ── Architecture sphere scrub ──
  const archEl = document.querySelector('#architecture');
  if (archEl) {
    ScrollTrigger.create({
      trigger: archEl, start: 'top 50%', end: 'bottom 50%', scrub: 1,
      onUpdate: self => { if (SceneManager) SceneManager.activeProgress = self.progress; }
    });
  }

  // ── Roadmap phase reveal ──
  const phases = document.querySelectorAll('.tl-phase');
  phases.forEach((p, i) => {
    ScrollTrigger.create({
      trigger: p, start: 'top 70%', once: true,
      onEnter: () => { if (SceneManager) SceneManager.roadmapPhase = i + 1; }
    });
  });

  // ── Heading parallax ──
  gsap.utils.toArray('section h2').forEach(h => {
    gsap.fromTo(h, { y: 20 }, {
      y: -20, ease: 'none',
      scrollTrigger: { trigger: h, start: 'top bottom', end: 'bottom top', scrub: 1.5 }
    });
  });

  // ── Section heading entrance ──
  gsap.utils.toArray('.lbl, .lbl-lt').forEach(el => {
    gsap.fromTo(el, { opacity: 0, x: -16 }, {
      opacity: 1, x: 0, duration: 0.6, ease: 'power2.out',
      scrollTrigger: { trigger: el, start: 'top 88%', toggleActions: 'play none none none' }
    });
  });
}

/* ── FALLBACK REVEAL (no GSAP) ──────────────────────── */
function initFallbackReveal() {
  const io = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (!e.isIntersecting) return;
      const el = e.target;
      if (el.classList.contains('fade-up') || el.classList.contains('scale-in') ||
          el.classList.contains('reveal') || el.classList.contains('reveal-scale')) {
        el.classList.add('visible');
      }
      if (el.classList.contains('tl-pw-fill') && !el.dataset.anim) {
        el.style.width = el.dataset.pw || '0%'; el.dataset.anim = '1';
      }
      if ((el.classList.contains('bar-fill') || el.classList.contains('bw-fill')) && !el.dataset.anim) {
        setTimeout(() => { el.style.width = el.dataset.w || '0%'; }, 60); el.dataset.anim = '1';
      }
      if (el.classList.contains('count-num')) countUp(el);
      io.unobserve(el);
    });
  }, { threshold: 0.05, rootMargin: '0px 0px 0px 0px' });

  document.querySelectorAll('.fade-up,.scale-in,.reveal,.reveal-scale,.tl-pw-fill,.bar-fill,.bw-fill,.count-num')
    .forEach(el => io.observe(el));
}

/* ── 4. PRESERVED FEATURES ──────────────────────────── */

/* GPU heatmap */
(function () {
  const c = document.getElementById('heatmap');
  if (!c) return;
  const ctx = c.getContext('2d');
  const COLS = 216, ROWS = 9;
  const cells = Array.from({ length: COLS * ROWS }, () => ({
    util: Math.random() * 0.4 + 0.4, target: Math.random() * 0.4 + 0.4,
    speed: Math.random() * 0.03 + 0.005,
  }));
  function getColor(u) {
    if (u < 0.3)  return `rgba(59,130,246,${0.3+u})`;
    if (u < 0.6)  return `rgba(34,197,94,${0.4+u*0.5})`;
    if (u < 0.85) return `rgba(251,191,36,${0.5+u*0.4})`;
    return `rgba(239,68,68,${0.6+u*0.4})`;
  }
  function draw() {
    const W = c.offsetWidth;
    c.width = W; c.height = c.offsetHeight || 72;
    const cw = W / COLS, rh = c.height / ROWS;
    cells.forEach((cell, i) => {
      if (Math.random() < 0.04) cell.target = Math.random() * 0.9 + 0.05;
      cell.util += (cell.target - cell.util) * cell.speed;
      const x = (i % COLS) * cw, y = Math.floor(i / COLS) * rh;
      ctx.fillStyle = getColor(cell.util);
      ctx.fillRect(x+0.5, y+0.5, cw-0.5, rh-0.5);
    });
    requestAnimationFrame(draw);
  }
  draw();
})();

/* Nav scroll hide/show */
(function () {
  let last = 0, tick = false;
  const nav = document.getElementById('nav');
  window.addEventListener('scroll', () => {
    if (tick) return;
    requestAnimationFrame(() => {
      const y = window.scrollY;
      nav.classList.toggle('scrolled', y > 80);
      nav.classList.toggle('hidden', y > last + 6 && y > 120);
      if (y < last - 4) nav.classList.remove('hidden');
      last = y; tick = false;
    });
    tick = true;
  });
})();

/* Cursor glow */
(function () {
  const g = document.getElementById('cursor-glow');
  if (!g) return;
  document.addEventListener('mousemove', e => {
    g.style.left = e.clientX + 'px';
    g.style.top  = e.clientY + 'px';
  });
})();

/* Magnetic buttons */
document.querySelectorAll('.btn-magnetic').forEach(btn => {
  btn.addEventListener('mousemove', e => {
    const r = btn.getBoundingClientRect();
    const x = (e.clientX - r.left - r.width  / 2) * 0.18;
    const y = (e.clientY - r.top  - r.height / 2) * 0.18;
    btn.style.transform = `translate(${x}px,${y}px)`;
  });
  btn.addEventListener('mouseleave', () => { btn.style.transform = ''; });
});

/* Count-up (standalone, used as fallback) */
function countUp(el) {
  if (el.dataset.counted) return;
  el.dataset.counted = '1';
  const target = parseFloat(el.dataset.count);
  const suffix = el.dataset.suffix || '', prefix = el.dataset.prefix || '';
  const isInt  = Number.isInteger(target);
  const dur = 1600, start = performance.now();
  function step(now) {
    const p = Math.min((now - start) / dur, 1);
    const ease = 1 - Math.pow(1 - p, 3);
    const v = target * ease;
    el.textContent = prefix + (isInt ? Math.round(v) : v.toFixed(1)) + suffix;
    if (p < 1) requestAnimationFrame(step);
  }
  requestAnimationFrame(step);
}

/* FAQ accordion */
function faq(btn) {
  const a = btn.nextElementSibling;
  const open = a.classList.contains('open');
  document.querySelectorAll('.faq-a.open').forEach(x => {
    x.classList.remove('open');
    x.previousElementSibling.classList.remove('open');
  });
  if (!open) { a.classList.add('open'); btn.classList.add('open'); }
}
window.faq = faq;

/* Pricing calculator */
(function () {
  const slider = document.getElementById('gpu-slider');
  if (!slider) return;
  const ANT_RATE = 2.50, AWS_RATE = 7.00;
  function fmt(n) {
    if (n >= 1e6) return '$' + (n / 1e6).toFixed(2) + 'M';
    return '$' + Math.round(n).toLocaleString();
  }
  function update() {
    const gpus   = parseInt(slider.value, 10);
    const antHr  = gpus * ANT_RATE, awsHr = gpus * AWS_RATE;
    const saveHr = awsHr - antHr, pct = Math.round((saveHr / awsHr) * 100);
    document.getElementById('gpu-count-label').textContent = gpus.toLocaleString() + ' GPUs';
    document.getElementById('calc-ant').textContent   = fmt(antHr) + '/hr';
    document.getElementById('calc-aws').textContent   = fmt(awsHr) + '/hr';
    document.getElementById('calc-save').textContent  = fmt(saveHr) + '/hr';
    document.getElementById('calc-pct').textContent   = pct + '% cheaper than AWS/GCP';
    document.getElementById('calc-monthly').textContent = fmt(saveHr * 24 * 30) + '/mo';
    document.getElementById('calc-annual').textContent  = fmt(saveHr * 24 * 365) + '/yr';
  }
  slider.addEventListener('input', update);
  update();
})();

/* Terminal typewriter */
(function () {
  const terms = document.querySelectorAll('.term-line[data-text]');
  if (!terms.length) return;
  let lineIdx = 0;
  function typeLine(el, text, cb) {
    el.textContent = '';
    let i = 0;
    const iv = setInterval(() => {
      el.textContent += text[i++];
      if (i >= text.length) { clearInterval(iv); setTimeout(cb, 400); }
    }, 26);
  }
  function runLines() {
    if (lineIdx >= terms.length) {
      setTimeout(() => {
        terms.forEach(t => { t.textContent = ''; t.classList.remove('typed'); });
        lineIdx = 0; runLines();
      }, 3200);
      return;
    }
    const el = terms[lineIdx]; el.classList.add('typed');
    typeLine(el, el.dataset.text, () => { lineIdx++; runLines(); });
  }
  const wrap = document.getElementById('terminal-wrap');
  if (!wrap) return;
  const tio = new IntersectionObserver(entries => {
    if (entries[0].isIntersecting) { runLines(); tio.disconnect(); }
  }, { threshold: 0.3 });
  tio.observe(wrap);
})();

/* Scroll-to-top */
(function () {
  const btn = document.getElementById('back-top');
  if (!btn) return;
  window.addEventListener('scroll', () => {
    btn.style.opacity = window.scrollY > 600 ? '1' : '0';
    btn.style.pointerEvents = window.scrollY > 600 ? 'auto' : 'none';
  });
  btn.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));
})();

/* Active nav highlight */
(function () {
  const sections = document.querySelectorAll('section[id]');
  const links    = document.querySelectorAll('.nav-links a[href^="#"]');
  if (!sections.length || !links.length) return;
  const observer = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (!e.isIntersecting) return;
      links.forEach(l => l.classList.remove('active-nav'));
      const a = document.querySelector(`.nav-links a[href="#${e.target.id}"]`);
      if (a) a.classList.add('active-nav');
    });
  }, { rootMargin: '-40% 0px -55% 0px' });
  sections.forEach(s => observer.observe(s));
})();

/* ── FORCE-REVEAL: show elements already in viewport ─────
   Fixes blank sections when jumping via nav links or loading
   with a #hash. Runs reveal logic immediately on any element
   whose bounding rect is currently within the viewport.     */
function forceRevealInViewport() {
  const vh = window.innerHeight;

  document.querySelectorAll(
    '.fade-up:not(.visible), .scale-in:not(.visible), .reveal, .reveal-scale, ' +
    '.tl-pw-fill:not([data-anim]), .bar-fill:not([data-anim]), .bw-fill:not([data-anim]), ' +
    '.count-num:not([data-counted])'
  ).forEach(el => {
    const { top, bottom } = el.getBoundingClientRect();
    if (top < vh && bottom > 0) {                      // element is in view
      el.classList.add('visible');                     // fade-up / scale-in
      if (el.classList.contains('tl-pw-fill') && !el.dataset.anim) {
        el.style.width = el.dataset.pw || '0%'; el.dataset.anim = '1';
      }
      if ((el.classList.contains('bar-fill') || el.classList.contains('bw-fill')) && !el.dataset.anim) {
        setTimeout(() => { el.style.width = el.dataset.w || '0%'; }, 60); el.dataset.anim = '1';
      }
      if (el.classList.contains('count-num')) countUp(el);
    }
  });

  // Refresh GSAP ScrollTrigger so it re-evaluates after jump
  if (typeof ScrollTrigger !== 'undefined') ScrollTrigger.refresh(true);
}

/* Nav links: close mobile nav, then force-reveal after smooth scroll settles */
document.querySelectorAll('#navLinks a').forEach(a => {
  a.addEventListener('click', () => {
    document.getElementById('navLinks')?.classList.remove('open');
    // smooth scroll takes ~600ms — run force-reveal after it lands
    setTimeout(forceRevealInViewport, 650);
    setTimeout(forceRevealInViewport, 900); // second pass for late renders
  });
});

/* Hash on initial load: if URL has #section, reveal after page settles */
if (window.location.hash) {
  window.addEventListener('load', () => {
    setTimeout(() => {
      const target = document.querySelector(window.location.hash);
      if (target) target.scrollIntoView({ behavior: 'instant' });
      setTimeout(forceRevealInViewport, 150);
    }, 200);
  });
}

/* Also run on any manual hash change (browser back/forward) */
window.addEventListener('hashchange', () => setTimeout(forceRevealInViewport, 650));

/* ── 5. INITIALIZATION ───────────────────────────────── */
function init() {
  initThree();
  initGSAP();

  window.addEventListener('load', () => {
    if (!SceneManager && HAS_WEBGL) initThree();
    if (typeof gsap !== 'undefined' && typeof ScrollTrigger === 'undefined') initGSAP();
    // Final pass: reveal anything in viewport after full page load
    setTimeout(forceRevealInViewport, 300);
  });
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
