/* ─────────────────────────────────────────
   ANTRIKSH CLOUD — script.js  v3
   ───────────────────────────────────────── */

/* ── SAFETY NET: reveal all content immediately ──
   fade-up elements start at opacity:0 in CSS.
   This guarantees they become visible even on
   file://, slow connections, or if the observer fails. */
(function () {
  function revealAll() {
    document.querySelectorAll('.fade-up, .scale-in').forEach(function (el) {
      el.classList.add('visible');
    });
    document.querySelectorAll('.bar-fill').forEach(function (el) {
      el.style.width = el.dataset.w || '0%';
    });
    document.querySelectorAll('.bw-fill').forEach(function (el) {
      el.style.width = el.dataset.w || '0%';
    });
    document.querySelectorAll('.tl-pw-fill').forEach(function (el) {
      el.style.width = el.dataset.pw || '0%';
    });
    document.querySelectorAll('.count-num').forEach(function (el) {
      el.textContent = (el.dataset.prefix || '') + el.dataset.count + (el.dataset.suffix || '');
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', revealAll);
  } else {
    revealAll();
  }

  // Hard fallback — force reveal after 800ms no matter what
  setTimeout(revealAll, 800);
})();


/* ── HERO NEURAL NETWORK CANVAS ── */
(function () {
  var c = document.getElementById('hero-canvas');
  if (!c) return;
  var ctx = c.getContext('2d');
  var W, H, dots = [], mx = -999, my = -999;
  var GAP = 34, R = 1.4, REACH = 110;

  function resize() {
    var hero = document.getElementById('hero');
    if (!hero) return;
    W = c.width  = hero.offsetWidth;
    H = c.height = hero.offsetHeight;
    dots = [];
    for (var x = GAP; x < W; x += GAP)
      for (var y = GAP; y < H; y += GAP)
        dots.push({ x: x, y: y, ox: x, oy: y, vx: 0, vy: 0 });
  }

  function draw() {
    ctx.clearRect(0, 0, W, H);
    dots.forEach(function (d) {
      var dx = mx - d.x, dy = my - d.y;
      var dist = Math.hypot(dx, dy);
      if (dist < REACH) {
        var f = (REACH - dist) / REACH;
        d.vx -= dx * f * 0.04;
        d.vy -= dy * f * 0.04;
      }
      d.vx += (d.ox - d.x) * 0.08;
      d.vy += (d.oy - d.y) * 0.08;
      d.vx *= 0.82; d.vy *= 0.82;
      d.x  += d.vx; d.y  += d.vy;
      var dd = Math.hypot(d.x - d.ox, d.y - d.oy);
      ctx.beginPath();
      ctx.arc(d.x, d.y, R, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(59,130,246,' + (0.14 + Math.min(dd / 8, 1) * 0.5) + ')';
      ctx.fill();
    });
    requestAnimationFrame(draw);
  }

  window.addEventListener('resize', resize);
  var hero = document.getElementById('hero');
  if (hero) {
    hero.addEventListener('mousemove', function (e) {
      var r = c.getBoundingClientRect();
      mx = e.clientX - r.left;
      my = e.clientY - r.top;
    });
    hero.addEventListener('mouseleave', function () { mx = -999; my = -999; });
  }
  resize();
  draw();
})();


/* ── GPU UTILISATION HEATMAP ── */
(function () {
  var c = document.getElementById('heatmap');
  if (!c) return;
  var ctx = c.getContext('2d');
  var COLS = 216, ROWS = 9;
  var cells = Array.from({ length: COLS * ROWS }, function () {
    return {
      util:   Math.random() * 0.4 + 0.4,
      target: Math.random() * 0.4 + 0.4,
      speed:  Math.random() * 0.03 + 0.005,
    };
  });

  function getColor(u) {
    if (u < 0.3)  return 'rgba(59,130,246,'  + (0.3 + u) + ')';
    if (u < 0.6)  return 'rgba(34,197,94,'   + (0.4 + u * 0.5) + ')';
    if (u < 0.85) return 'rgba(251,191,36,'  + (0.5 + u * 0.4) + ')';
    return               'rgba(239,68,68,'   + (0.6 + u * 0.4) + ')';
  }

  function draw() {
    var W = c.offsetWidth;
    c.width  = W;
    c.height = c.offsetHeight || 72;
    var cw = W / COLS, rh = c.height / ROWS;
    cells.forEach(function (cell, i) {
      if (Math.random() < 0.04) cell.target = Math.random() * 0.9 + 0.05;
      cell.util += (cell.target - cell.util) * cell.speed;
      var x = (i % COLS) * cw, y = Math.floor(i / COLS) * rh;
      ctx.fillStyle = getColor(cell.util);
      ctx.fillRect(x + 0.5, y + 0.5, cw - 0.5, rh - 0.5);
    });
    requestAnimationFrame(draw);
  }
  draw();
})();


/* ── NAV: SCROLL HIDE / SHOW ── */
(function () {
  var last = 0, tick = false;
  var nav = document.getElementById('nav');
  if (!nav) return;
  window.addEventListener('scroll', function () {
    if (tick) return;
    requestAnimationFrame(function () {
      var y = window.scrollY;
      if (y > 80)                   nav.classList.add('scrolled');
      else                          nav.classList.remove('scrolled');
      if (y > last + 6 && y > 120) nav.classList.add('hidden');
      else if (y < last - 4)       nav.classList.remove('hidden');
      last = y;
      tick = false;
    });
    tick = true;
  });
})();


/* ── CURSOR GLOW ── */
(function () {
  var g = document.getElementById('cursor-glow');
  if (!g) return;
  document.addEventListener('mousemove', function (e) {
    g.style.left = e.clientX + 'px';
    g.style.top  = e.clientY + 'px';
  });
})();


/* ── MAGNETIC BUTTONS ── */
document.querySelectorAll('.btn-magnetic').forEach(function (btn) {
  btn.addEventListener('mousemove', function (e) {
    var r = btn.getBoundingClientRect();
    var x = (e.clientX - r.left - r.width  / 2) * 0.18;
    var y = (e.clientY - r.top  - r.height / 2) * 0.18;
    btn.style.transform = 'translate(' + x + 'px,' + y + 'px)';
  });
  btn.addEventListener('mouseleave', function () { btn.style.transform = ''; });
});


/* ── COUNT-UP NUMBERS ── */
function countUp(el) {
  if (el.dataset.counted) return;
  el.dataset.counted = '1';
  var target = parseFloat(el.dataset.count);
  var suffix  = el.dataset.suffix || '';
  var prefix  = el.dataset.prefix || '';
  var dur = 1600, start = performance.now();
  var isInt = Number.isInteger(target);

  function step(now) {
    var p    = Math.min((now - start) / dur, 1);
    var ease = 1 - Math.pow(1 - p, 3);
    var v    = target * ease;
    el.textContent = prefix + (isInt ? Math.round(v) : v.toFixed(1)) + suffix;
    if (p < 1) requestAnimationFrame(step);
  }
  requestAnimationFrame(step);
}


/* ── SCROLL-TRIGGERED ANIMATIONS ── */
(function () {
  if (!window.IntersectionObserver) return; // safety net above already handled

  var io = new IntersectionObserver(function (entries) {
    entries.forEach(function (e) {
      if (!e.isIntersecting) return;
      var el = e.target;

      if (el.classList.contains('fade-up') || el.classList.contains('scale-in')) {
        el.classList.add('visible');
      }
      if (el.classList.contains('tl-pw-fill') && !el.dataset.anim) {
        el.style.width = el.dataset.pw || '0%';
        el.dataset.anim = '1';
      }
      if (el.classList.contains('bar-fill') && !el.dataset.anim) {
        setTimeout(function () { el.style.width = el.dataset.w || '0%'; }, 60);
        el.dataset.anim = '1';
      }
      if (el.classList.contains('bw-fill') && !el.dataset.anim) {
        setTimeout(function () { el.style.width = el.dataset.w || '0%'; }, 60);
        el.dataset.anim = '1';
      }
      if (el.classList.contains('count-num')) countUp(el);

      io.unobserve(el);
    });
  }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });

  document.querySelectorAll(
    '.fade-up, .scale-in, .tl-pw-fill, .bar-fill, .bw-fill, .count-num'
  ).forEach(function (el) { io.observe(el); });

  // Hero elements already in viewport — reveal immediately
  setTimeout(function () {
    document.querySelectorAll('#hero .fade-up, #hero .count-num').forEach(function (el) {
      el.classList.add('visible');
      if (el.classList.contains('count-num')) countUp(el);
    });
  }, 120);
})();


/* ── FAQ ACCORDION ── */
function faq(btn) {
  var a    = btn.nextElementSibling;
  var open = a.classList.contains('open');
  document.querySelectorAll('.faq-a.open').forEach(function (x) {
    x.classList.remove('open');
    x.previousElementSibling.classList.remove('open');
  });
  if (!open) { a.classList.add('open'); btn.classList.add('open'); }
}
window.faq = faq; // exposed globally — called via onclick="faq(this)" in HTML


/* ── MOBILE NAV: close on link click ── */
document.querySelectorAll('#navLinks a').forEach(function (a) {
  a.addEventListener('click', function () {
    var nl = document.getElementById('navLinks');
    if (nl) nl.classList.remove('open');
  });
});


/* ── PRICING CALCULATOR ── */
(function () {
  var slider = document.getElementById('gpu-slider');
  if (!slider) return;

  var ANT_RATE = 2.50;
  var AWS_RATE = 7.00;

  function fmt(n) {
    if (n >= 1e6) return '$' + (n / 1e6).toFixed(2) + 'M';
    if (n >= 1e3) return '$' + Math.round(n).toLocaleString();
    return '$' + Math.round(n);
  }

  function update() {
    var gpus    = parseInt(slider.value, 10);
    var antHr   = gpus * ANT_RATE;
    var awsHr   = gpus * AWS_RATE;
    var saveHr  = awsHr - antHr;
    var pct     = Math.round((saveHr / awsHr) * 100);
    var monthly = saveHr * 24 * 30;
    var annual  = saveHr * 24 * 365;

    var label = document.getElementById('gpu-count-label');
    if (label) label.textContent = gpus.toLocaleString() + ' GPUs';

    var map = {
      'calc-ant':     fmt(antHr)   + '/hr',
      'calc-aws':     fmt(awsHr)   + '/hr',
      'calc-save':    fmt(saveHr)  + '/hr',
      'calc-pct':     pct + '% cheaper than AWS/GCP',
      'calc-monthly': fmt(monthly) + '/mo',
      'calc-annual':  fmt(annual)  + '/yr',
    };
    Object.keys(map).forEach(function (id) {
      var el = document.getElementById(id);
      if (el) el.textContent = map[id];
    });
  }

  slider.addEventListener('input', update);
  update();
})();


/* ── TERMINAL TYPEWRITER ── */
(function () {
  var terms = document.querySelectorAll('.term-line[data-text]');
  if (!terms.length) return;

  var lineIdx = 0;

  function typeLine(el, text, cb) {
    el.textContent = '';
    var i = 0;
    var iv = setInterval(function () {
      el.textContent += text[i++];
      if (i >= text.length) { clearInterval(iv); setTimeout(cb, 420); }
    }, 28);
  }

  function runLines() {
    if (lineIdx >= terms.length) {
      setTimeout(function () {
        terms.forEach(function (t) { t.textContent = ''; t.classList.remove('typed'); });
        lineIdx = 0;
        runLines();
      }, 3500);
      return;
    }
    var el = terms[lineIdx];
    el.classList.add('typed');
    typeLine(el, el.dataset.text, function () { lineIdx++; runLines(); });
  }

  var termWrap = document.getElementById('terminal-wrap');
  if (!termWrap || !window.IntersectionObserver) { runLines(); return; }

  var tio = new IntersectionObserver(function (entries) {
    if (entries[0].isIntersecting) { runLines(); tio.disconnect(); }
  }, { threshold: 0.3 });
  tio.observe(termWrap);
})();


/* ── SCROLL-TO-TOP BUTTON ── */
(function () {
  var btn = document.getElementById('back-top');
  if (!btn) return;
  window.addEventListener('scroll', function () {
    btn.style.opacity       = window.scrollY > 600 ? '1' : '0';
    btn.style.pointerEvents = window.scrollY > 600 ? 'auto' : 'none';
  });
  btn.addEventListener('click', function () {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });
})();


/* ── ACTIVE NAV LINK HIGHLIGHT ── */
(function () {
  if (!window.IntersectionObserver) return;
  var sections = document.querySelectorAll('section[id]');
  var links    = document.querySelectorAll('.nav-links a[href^="#"]');
  if (!sections.length || !links.length) return;

  var observer = new IntersectionObserver(function (entries) {
    entries.forEach(function (e) {
      if (!e.isIntersecting) return;
      links.forEach(function (l) { l.classList.remove('active-nav'); });
      var active = document.querySelector('.nav-links a[href="#' + e.target.id + '"]');
      if (active) active.classList.add('active-nav');
    });
  }, { rootMargin: '-40% 0px -55% 0px' });

  sections.forEach(function (s) { observer.observe(s); });
})();