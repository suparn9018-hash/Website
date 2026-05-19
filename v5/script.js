/* ══════════════════════════════════════════════════
   ANTRIKSH CLOUD — script.js
   Single clean file. No duplicates.
══════════════════════════════════════════════════ */

/* ── 0. GPU SCROLL SEQUENCE — frame canvas ── */
(function () {
  var wrap     = document.getElementById('gpu-seq-wrap');
  var canvas   = document.getElementById('gpu-seq-canvas');
  var bar      = document.getElementById('gpu-seq-bar');
  var loadBar  = document.getElementById('gpu-seq-load-bar');
  var loadWrap = document.getElementById('gpu-seq-load');
  var hint     = document.getElementById('gpu-seq-hint');
  var stages   = [
    document.getElementById('gst-1'),
    document.getElementById('gst-2'),
    document.getElementById('gst-3'),
  ];

  if (!wrap || !canvas) return;

  var ctx        = canvas.getContext('2d');
  var TOTAL      = 302;        /* total frames */
  var FRAME_PATH = 'frames/frame-%04d.jpg';
  var images     = new Array(TOTAL);
  var loaded     = 0;
  var currentFrame = 0;
  var targetFrame  = 0;
  var rafId        = null;

  /* Stage thresholds (fraction 0→1) */
  var THRESHOLDS = [
    [0,    0.38],
    [0.33, 0.72],
    [0.65, 1.0 ],
  ];

  /* ── Helpers ── */
  function pad4(n) {
    return ('0000' + n).slice(-4);
  }

  function vh() {
    return window.innerHeight || document.documentElement.clientHeight || 800;
  }

  function ensureHeight() {
    var h = vh();
    if (wrap.offsetHeight < h) wrap.style.height = (h * 3.5) + 'px';
  }

  function sizeCanvas() {
    var dpr = window.devicePixelRatio || 1;
    var w   = canvas.offsetWidth  || canvas.parentElement.offsetWidth  || window.innerWidth  || 1280;
    var h   = canvas.offsetHeight || canvas.parentElement.offsetHeight || window.innerHeight || 720;
    canvas.width  = w * dpr;
    canvas.height = h * dpr;
  }

  function drawFrame(idx) {
    var img = images[idx];
    if (!img || !img.complete || !img.naturalWidth) return;
    var cw = canvas.width, ch = canvas.height;
    /* Cover-fit: maintain aspect ratio */
    var ir = img.naturalWidth / img.naturalHeight;
    var cr = cw / ch;
    var sw, sh, sx, sy;
    if (ir > cr) {
      sh = ch; sw = sh * ir;
      sx = (cw - sw) / 2; sy = 0;
    } else {
      sw = cw; sh = sw / ir;
      sx = 0; sy = (ch - sh) / 2;
    }
    ctx.clearRect(0, 0, cw, ch);
    ctx.drawImage(img, sx, sy, sw, sh);
  }

  /* ── Smooth lerp loop ── */
  function animLoop() {
    rafId = requestAnimationFrame(animLoop);
    /* Ease current toward target */
    if (Math.abs(targetFrame - currentFrame) < 0.4) {
      if (currentFrame !== targetFrame) {
        currentFrame = targetFrame;
        drawFrame(Math.round(currentFrame));
      }
    } else {
      currentFrame += (targetFrame - currentFrame) * 0.18;
      drawFrame(Math.round(currentFrame));
    }
  }

  /* ── Scroll handler ── */
  var ticking = false;
  function onScroll() {
    if (!ticking) { requestAnimationFrame(update); ticking = true; }
  }

  function update() {
    ticking = false;
    var h      = vh();
    var rect   = wrap.getBoundingClientRect();
    var travel = Math.max(1, wrap.offsetHeight - h);
    var progress = Math.max(0, Math.min(1, -rect.top / travel));

    /* Frame index */
    targetFrame = Math.round(progress * (TOTAL - 1));

    /* Progress bar */
    if (bar) bar.style.width = (progress * 100) + '%';

    /* Scroll hint */
    if (hint) hint.classList.toggle('hidden', progress > 0.05);

    /* Stage text */
    stages.forEach(function(el, i) {
      if (!el) return;
      var s = THRESHOLDS[i][0], e = THRESHOLDS[i][1];
      el.classList.toggle('active', progress >= s && progress < e);
    });
  }

  /* ── Frame loading — priority load first + last frames, then fill in ── */
  function loadImage(idx, onDone) {
    var img = new Image();
    img.onload = function() {
      images[idx] = img;
      loaded++;
      /* Update load bar */
      if (loadBar) loadBar.style.width = Math.round(loaded / TOTAL * 100) + '%';
      if (loaded === TOTAL && loadWrap) {
        loadWrap.classList.add('done');
      }
      if (onDone) onDone(idx);
    };
    img.onerror = function() {
      loaded++;
    };
    img.src = FRAME_PATH.replace('%04d', pad4(idx + 1)); /* frames are 1-indexed */
    images[idx] = img;
  }

  function startLoading() {
    /* Load frame 0 first so something shows immediately */
    loadImage(0, function() {
      sizeCanvas();
      drawFrame(0);
    });

    /* Then load all remaining frames in order */
    for (var i = 1; i < TOTAL; i++) {
      (function(idx) { loadImage(idx, null); })(i);
    }
  }

  /* ── Init ── */
  ensureHeight();
  sizeCanvas();
  startLoading();
  animLoop();

  window.addEventListener('scroll',  onScroll,     { passive: true });
  window.addEventListener('resize',  function() {
    ensureHeight();
    sizeCanvas();
    drawFrame(Math.round(currentFrame));
  }, { passive: true });
})();

/* ── 1. NAV SCROLL — full-width → floating pill ── */
(function () {
  const nav = document.getElementById('nav');
  if (!nav) return;
  let last = 0;
  const FLOAT_THRESHOLD = 120;

  window.addEventListener('scroll', () => {
    const y = window.scrollY;

    /* Floating pill once past threshold */
    nav.classList.toggle('floating', y > FLOAT_THRESHOLD);

    /* Hide on scroll down, show on scroll up */
    if (y > last + 8 && y > FLOAT_THRESHOLD) nav.classList.add('hidden');
    else if (y < last - 6)                    nav.classList.remove('hidden');

    last = y;
  }, { passive: true });
})();

/* ── 2. MOBILE NAV TOGGLE ── */
(function () {
  document.querySelectorAll('#navLinks a').forEach(a =>
    a.addEventListener('click', () =>
      document.getElementById('navLinks')?.classList.remove('open')
    )
  );
})();

/* ── 3. COUNT-UP ── */
function countUp(el) {
  if (el.dataset.counted) return;
  el.dataset.counted = '1';
  const target = parseFloat(el.dataset.count || '0');
  const suffix = el.dataset.suffix || '';
  const prefix = el.dataset.prefix || '';
  const isInt  = Number.isInteger(target);
  const dur = 1500, start = performance.now();
  (function step(now) {
    const p = Math.min((now - start) / dur, 1);
    const v = target * (1 - Math.pow(1 - p, 3));
    el.textContent = prefix + (isInt ? Math.round(v) : v.toFixed(1)) + suffix;
    if (p < 1) requestAnimationFrame(step);
  })(start);
}

/* ── 4. REVEAL ON SCROLL ── */
function revealEl(el) {
  el.classList.add('visible');
  // Animate bar fills
  if (el.classList.contains('bar-fill') ||
      el.classList.contains('bw-fill') ||
      el.classList.contains('phase-fill')) {
    setTimeout(() => { el.style.width = el.dataset.w || '0%'; }, 60);
  }
  // Count-up numbers
  if (el.classList.contains('count-num')) countUp(el);
}

function isInView(el) {
  const r = el.getBoundingClientRect();
  return r.top < window.innerHeight * 0.93 && r.bottom > 0;
}

const SEL = '.reveal, .bar-fill, .bw-fill, .phase-fill, .count-num';

// ── Staggered sibling reveals ──
// When a parent has multiple .reveal children, auto-cascade their delays
document.querySelectorAll('section, .wl-benefits, .why-grid, .builders-grid, .gpu-grid').forEach(parent => {
  const siblings = Array.from(parent.querySelectorAll(':scope > .reveal, :scope > * > .reveal'));
  if (siblings.length < 2) return;
  siblings.forEach((el, i) => {
    // Only set if no explicit .d1/.d2/.d3 delay already
    if (!el.classList.contains('d1') && !el.classList.contains('d2') && !el.classList.contains('d3')) {
      el.style.transitionDelay = (i * 90) + 'ms';
    }
  });
});

// IntersectionObserver for scroll-triggered reveals
const revealObs = new IntersectionObserver(entries => {
  entries.forEach(e => {
    if (e.isIntersecting) { revealEl(e.target); revealObs.unobserve(e.target); }
  });
}, { threshold: 0.04 });

document.querySelectorAll(SEL).forEach(el => revealObs.observe(el));

// Force-reveal anything already in viewport (handles page load + nav jumps)
function sweepViewport() {
  document.querySelectorAll(SEL + ':not(.visible):not([data-counted])').forEach(el => {
    if (isInView(el)) { revealEl(el); revealObs.unobserve(el); }
  });
}

window.addEventListener('load',           () => { sweepViewport(); setTimeout(sweepViewport, 400); });
document.addEventListener('DOMContentLoaded', () => setTimeout(sweepViewport, 80));

let swTick = false;
window.addEventListener('scroll', () => {
  if (swTick) return; swTick = true;
  requestAnimationFrame(() => { sweepViewport(); swTick = false; });
}, { passive: true });

// After nav-link jump
document.querySelectorAll('.nav-links a[href^="#"]').forEach(a => {
  a.addEventListener('click', () => {
    setTimeout(sweepViewport, 600);
    setTimeout(sweepViewport, 1000);
  });
});
if (window.location.hash) {
  window.addEventListener('load', () => setTimeout(sweepViewport, 500));
}

/* ── 5. ACTIVE NAV HIGHLIGHT ── */
(function () {
  const sections = document.querySelectorAll('section[id]');
  const links    = document.querySelectorAll('.nav-links a[href^="#"]');
  if (!sections.length || !links.length) return;
  const obs = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (!e.isIntersecting) return;
      links.forEach(l => l.classList.remove('active-nav'));
      const a = document.querySelector(`.nav-links a[href="#${e.target.id}"]`);
      if (a) a.classList.add('active-nav');
    });
  }, { rootMargin: '-40% 0px -55% 0px' });
  sections.forEach(s => obs.observe(s));
})();

/* ── 6. GPU UTILISATION HEATMAP ── */
(function () {
  const c = document.getElementById('heatmap');
  if (!c) return;
  const ctx = c.getContext('2d');
  const COLS = 180, ROWS = 8;
  const cells = Array.from({ length: COLS * ROWS }, () => ({
    u: Math.random() * .5 + .3,
    t: Math.random() * .5 + .3,
    s: Math.random() * .025 + .006,
  }));
  function color(u) {
    if (u < .3)  return `rgba(59,130,246,${.25 + u})`;
    if (u < .6)  return `rgba(34,197,94,${.35 + u * .5})`;
    if (u < .85) return `rgba(251,191,36,${.4 + u * .4})`;
    return `rgba(239,68,68,${.5 + u * .4})`;
  }
  function draw() {
    const W = c.offsetWidth || 800;
    c.width = W; c.height = c.offsetHeight || 56;
    const cw = W / COLS, rh = c.height / ROWS;
    cells.forEach((cell, i) => {
      if (Math.random() < .03) cell.t = Math.random() * .9 + .05;
      cell.u += (cell.t - cell.u) * cell.s;
      ctx.fillStyle = color(cell.u);
      ctx.fillRect((i % COLS) * cw + .5, Math.floor(i / COLS) * rh + .5, cw - .5, rh - .5);
    });
    requestAnimationFrame(draw);
  }
  draw();
})();

/* ── 7. TERMINAL TYPEWRITER ── */
(function () {
  const lines = document.querySelectorAll('.term-line[data-text]');
  if (!lines.length) return;
  let idx = 0;
  function typeLine(el, text, done) {
    el.textContent = ''; let i = 0;
    if (!text.length) { setTimeout(done, 20); return; }
    const iv = setInterval(() => {
      el.textContent += text[i++];
      if (i >= text.length) { clearInterval(iv); setTimeout(done, 35); }
    }, 5); /* 5ms per char — ~3× faster */
  }
  function run() {
    if (idx >= lines.length) {
      setTimeout(() => { lines.forEach(l => { l.textContent = ''; }); idx = 0; run(); }, 800);
      return;
    }
    typeLine(lines[idx], lines[idx].dataset.text, () => { idx++; run(); });
  }
  const wrap = document.getElementById('terminal-wrap');
  if (!wrap) return;
  new IntersectionObserver((en, ob) => {
    if (en[0].isIntersecting) { run(); ob.disconnect(); }
  }, { threshold: .25 }).observe(wrap);
})();

/* ── 8. PRICING CALCULATOR ── */
(function () {
  const slider = document.getElementById('gpu-slider');
  if (!slider) return;
  const ANT = 2.50, AWS = 7.00;
  const $ = id => document.getElementById(id);
  function fmt(n) {
    if (n >= 1e6) return '$' + (n / 1e6).toFixed(2) + 'M';
    if (n >= 1e3) return '$' + Math.round(n).toLocaleString();
    return '$' + Math.round(n);
  }
  function calc() {
    const g = +slider.value, a = g * ANT, w = g * AWS, s = w - a;
    const pct = Math.round(s / w * 100);
    if ($('gpu-count-label')) $('gpu-count-label').textContent = g.toLocaleString() + ' GPUs';
    if ($('calc-ant'))     $('calc-ant').textContent     = fmt(a) + '/hr';
    if ($('calc-aws'))     $('calc-aws').textContent     = fmt(w) + '/hr';
    if ($('calc-save'))    $('calc-save').textContent    = fmt(s) + '/hr';
    if ($('calc-pct'))     $('calc-pct').textContent     = pct + '% cheaper';
    if ($('calc-monthly')) $('calc-monthly').textContent = fmt(s * 24 * 30) + '/mo';
    if ($('calc-annual'))  $('calc-annual').textContent  = fmt(s * 24 * 365) + '/yr';
  }
  slider.addEventListener('input', calc);
  calc();
})();

/* ── 9. FAQ ACCORDION ── */
function faq(btn) {
  const ans  = btn.nextElementSibling;
  const open = ans.classList.contains('open');
  document.querySelectorAll('.faq-a.open').forEach(a => {
    a.classList.remove('open');
    a.previousElementSibling?.classList.remove('open');
  });
  if (!open) { ans.classList.add('open'); btn.classList.add('open'); }
}
window.faq = faq;

/* ── 10. SCROLL TO TOP ── */
(function () {
  const btn = document.getElementById('back-top');
  if (!btn) return;
  window.addEventListener('scroll', () =>
    btn.classList.toggle('visible', window.scrollY > 500), { passive: true });
  btn.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));
})();

/* ── 11. HOW-STEP ACTIVE HIGHLIGHT ── */
(function () {
  document.querySelectorAll('.how-step').forEach(step => {
    new IntersectionObserver(([e]) =>
      step.classList.toggle('s-active', e.isIntersecting),
      { rootMargin: '-30% 0px -50% 0px' }
    ).observe(step);
  });
})();

/* ── 12. SECTION GPU NETWORK BACKGROUNDS ── */
(function () {
  const isMobile = window.innerWidth < 768;

  function initNet(canvas) {
    if (!canvas) return;
    const section = canvas.closest('section') || canvas.parentElement;
    if (!section) return;
    const ctx = canvas.getContext('2d');
    let W, H, dots = [], mx = -9999, my = -9999;

    const GAP   = isMobile ? 40 : 50;
    const R     = isMobile ? 1.3 : 1.8;
    const REACH = isMobile ? 90  : 160;
    const LINK  = isMobile ? 50  : 65;
    const COLS  = [[59, 130, 246], [124, 58, 237], [59, 130, 246], [16, 163, 164]];

    function resize() {
      W = canvas.width  = section.offsetWidth;
      H = canvas.height = section.offsetHeight;
      dots = [];
      for (let x = GAP / 2; x < W; x += GAP)
        for (let y = GAP / 2; y < H; y += GAP) {
          const col = COLS[Math.floor(Math.random() * COLS.length)];
          dots.push({ x, y, ox: x, oy: y, vx: 0, vy: 0, col, ph: Math.random() * Math.PI * 2 });
        }
    }

    let t = 0;
    function draw() {
      t += 0.008;
      ctx.clearRect(0, 0, W, H);

      if (!isMobile) {
        for (let i = 0; i < dots.length; i++) {
          for (let j = i + 1; j < dots.length; j++) {
            const d = Math.hypot(dots[i].x - dots[j].x, dots[i].y - dots[j].y);
            if (d < LINK) {
              ctx.strokeStyle = `rgba(59,130,246,${(1 - d / LINK) * 0.20})`;
              ctx.lineWidth = 0.5;
              ctx.beginPath();
              ctx.moveTo(dots[i].x, dots[i].y);
              ctx.lineTo(dots[j].x, dots[j].y);
              ctx.stroke();
            }
          }
        }
      }

      dots.forEach(d => {
        const dx = mx - d.x, dy = my - d.y;
        const dist = Math.hypot(dx, dy);
        if (dist < REACH) {
          const f = (REACH - dist) / REACH;
          d.vx -= dx * f * 0.034;
          d.vy -= dy * f * 0.034;
        }
        d.vx += (d.ox - d.x) * 0.07;
        d.vy += (d.oy - d.y) * 0.07;
        d.vx *= 0.80; d.vy *= 0.80;
        d.x += d.vx; d.y += d.vy;
        const disp  = Math.hypot(d.x - d.ox, d.y - d.oy);
        const pulse = 0.5 + 0.5 * Math.sin(t * 1.8 + d.ph);
        const alpha = 0.22 + Math.min(disp / 8, 1) * 0.4 + pulse * 0.13;
        const r     = R + (dist < REACH ? (REACH - dist) / REACH * 1.4 : 0);
        ctx.beginPath();
        ctx.arc(d.x, d.y, r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${d.col[0]},${d.col[1]},${d.col[2]},${alpha})`;
        ctx.fill();
        if (dist < REACH) {
          ctx.beginPath();
          ctx.arc(d.x, d.y, r * 3.5, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(${d.col[0]},${d.col[1]},${d.col[2]},${0.022 * (REACH - dist) / REACH})`;
          ctx.fill();
        }
      });
      requestAnimationFrame(draw);
    }

    // Mouse tracking
    section.addEventListener('mousemove', e => {
      const r = section.getBoundingClientRect();
      mx = e.clientX - r.left;
      my = e.clientY - r.top;
    });
    section.addEventListener('mouseleave', () => { mx = -9999; my = -9999; });

    // Resize with debounce
    let rt;
    window.addEventListener('resize', () => { clearTimeout(rt); rt = setTimeout(resize, 250); });

    // Lazy-start when section enters view
    let started = false;
    new IntersectionObserver(([e], ob) => {
      if (e.isIntersecting && !started) {
        started = true;
        resize();
        draw();
        ob.disconnect();
      }
    }, { threshold: 0.02 }).observe(section);
  }

  // Wire up all section-net canvases (includes new #net-stack from v3.1)
  document.querySelectorAll('canvas.section-net').forEach(c => initNet(c));
})();

/* ── 13. STACK INFOGRAPHIC — LAYER TOGGLE (new in v3.1) ── */
/**
 * toggleStackLayer(el)
 * Called via onclick on each .stack-layer.
 * - Toggles .s-active on the clicked layer (accordion-style).
 * - Opens/closes the .layer-detail panel below its .layer-card.
 * - On desktop (≥1024px), wraps layers in .stack-layers-3d for the
 *   CSS 3D perspective tilt.  Safe to call multiple times (idempotent).
 */
function toggleStackLayer(el) {
  const detail   = el.querySelector('.layer-detail');
  const isActive = el.classList.contains('s-active');

  // Close all open layers first (accordion behaviour)
  document.querySelectorAll('.stack-layer').forEach(layer => {
    layer.classList.remove('s-active');
    const d = layer.querySelector('.layer-detail');
    if (d) d.classList.remove('open');
  });

  // Re-open if it was closed before this click
  if (!isActive) {
    el.classList.add('s-active');
    if (detail) detail.classList.add('open');
  }
}
window.toggleStackLayer = toggleStackLayer;

/* Apply the 3D perspective wrapper on desktop, and clean it up on resize */
(function () {
  const wrapper = document.getElementById('stack3d');
  if (!wrapper) return;

  function applyLayout() {
    if (window.innerWidth >= 1024) {
      wrapper.classList.add('stack-layers-3d');
    } else {
      wrapper.classList.remove('stack-layers-3d');
    }
  }

  applyLayout();
  let rt;
  window.addEventListener('resize', () => { clearTimeout(rt); rt = setTimeout(applyLayout, 200); });
})();

/* ── TASTE-SKILL: Magnetic hover on primary CTAs ── */
(function () {
  if (window.innerWidth < 768) return; /* desktop only */

  const STRENGTH = 0.18; /* how far the button follows cursor, 0–1 */

  document.querySelectorAll('.btn-primary, .nav-cta, .btn-wl-white').forEach(function(btn) {
    var raf = null;
    var tx = 0, ty = 0;   /* target */
    var cx = 0, cy = 0;   /* current (lerped) */

    function lerp(a, b, t) { return a + (b - a) * t; }

    function frame() {
      cx = lerp(cx, tx, 0.12);
      cy = lerp(cy, ty, 0.12);
      btn.style.transform = 'translate(' + cx.toFixed(2) + 'px,' + cy.toFixed(2) + 'px)';
      if (Math.abs(cx - tx) > 0.05 || Math.abs(cy - ty) > 0.05) {
        raf = requestAnimationFrame(frame);
      } else {
        raf = null;
      }
    }

    btn.addEventListener('mousemove', function(e) {
      var r = btn.getBoundingClientRect();
      tx = (e.clientX - (r.left + r.width  / 2)) * STRENGTH;
      ty = (e.clientY - (r.top  + r.height / 2)) * STRENGTH;
      if (!raf) raf = requestAnimationFrame(frame);
    });

    btn.addEventListener('mouseleave', function() {
      tx = 0; ty = 0;
      if (!raf) raf = requestAnimationFrame(frame);
    });
  });
})();

/* ── BF-CODE: typewriter animation for the Founder card's training.py ──
   Triggers on first viewport entry. Types each line char-by-char with a
   small inter-line pause, then runs the "RUNNING · XXm" status timer
   ticking up from 00m to suggest a live training job.
*/
(function () {
  var code = document.getElementById('bf-code-anim');
  if (!code) return;
  var lines = code.querySelectorAll('.bf-code-line');
  var timerEl = document.getElementById('bf-code-timer');
  if (!lines.length) return;

  function typeLine(el, onDone) {
    var text = el.getAttribute('data-text') || '';
    el.classList.add('typing');
    var i = 0;
    var CHAR_MS = 18;        /* per-character speed */
    function step() {
      if (i <= text.length) {
        el.textContent = text.slice(0, i++);
        setTimeout(step, CHAR_MS);
      } else {
        el.classList.remove('typing');
        if (onDone) onDone();
      }
    }
    step();
  }

  function typeAllLines(idx) {
    if (idx >= lines.length) {
      startTimer();
      return;
    }
    typeLine(lines[idx], function () {
      setTimeout(function () { typeAllLines(idx + 1); }, 200);
    });
  }

  function startTimer() {
    if (!timerEl) return;
    var minutes = 0;
    function tick() {
      minutes += 1;
      timerEl.textContent = String(minutes).padStart(2, '0') + 'm';
      /* slow down after a while so it doesn't run away */
      var nextDelay = minutes < 15 ? 1100 : 2800;
      if (minutes < 99) setTimeout(tick, nextDelay);
    }
    setTimeout(tick, 600);
  }

  var played = false;
  var obs = new IntersectionObserver(function (entries) {
    entries.forEach(function (e) {
      if (e.isIntersecting && !played) {
        played = true;
        typeAllLines(0);
        obs.disconnect();
      }
    });
  }, { threshold: 0.35 });
  obs.observe(code);
})();
