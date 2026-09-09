import { ROUTE, FADE, SCENES } from './media.js';

const PLATE_W = 1200;
const PLATE_H = 800;
const PIN_LENGTH = '+=420%';
const GSAP_CDN = [
  'https://cdn.jsdelivr.net/npm/gsap@3.12.5/dist/gsap.min.js',
  'https://cdn.jsdelivr.net/npm/gsap@3.12.5/dist/ScrollTrigger.min.js'
];

const root = document.getElementById('algoritm-city');
if (root) {
  ensureGsap().then(init).catch(() => root.classList.add('is-fallback'));
}

function ensureGsap() {
  if (window.gsap && window.ScrollTrigger) return Promise.resolve();
  return GSAP_CDN.reduce((chain, src) => chain.then(() => new Promise((ok, fail) => {
    if ([...document.scripts].some(s => s.src === src) && window.gsap) return ok();
    const s = document.createElement('script');
    s.src = src; s.onload = ok; s.onerror = fail;
    document.head.appendChild(s);
  })), Promise.resolve());
}

const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
const lerp = (a, b, t) => a + (b - a) * t;
const smooth = t => { t = clamp(t, 0, 1); return t * t * (3 - 2 * t); };
const easeInOut = t => (t < .5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2);

function init() {
  const { gsap, ScrollTrigger } = window;
  gsap.registerPlugin(ScrollTrigger);

  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const hoverable = matchMedia('(hover: hover)').matches;
  const pin = root.querySelector('.cj-pin');
  const frame = root.querySelector('.cj-frame');
  const caps = [...root.querySelectorAll('.cj-cap')];
  const stepEl = root.querySelector('.cj-step');
  const stageBtns = [...root.querySelectorAll('.cj-stages button')];
  const black = root.querySelector('.cj-black');

  if (reduced) root.classList.add('is-reduced');

  const scenes = ROUTE.map((seg, i) => {
    const el = root.querySelector(`.cj-scene[data-scene="${seg.id}"]`);
    const cfg = SCENES[seg.id];
    return {
      ...seg, i, cfg, el,
      plate: el.querySelector('.cj-plate'),
      photo: el.querySelector('.cj-photo'),
      video: el.querySelector('video'),
      windowPhoto: el.querySelector('.cj-window-photo'),
      loaded: false, lastVideoT: -1
    };
  });
  const last = scenes.length - 1;

  root.querySelectorAll('.cj-layer').forEach(l => l.style.setProperty('--depth', l.dataset.depth || 0));

  // ---- media loading: first scene right away, the rest when the block is near ----
  const load = s => {
    if (s.loaded) return; s.loaded = true;
    if (s.photo && s.cfg.src) { s.photo.src = s.cfg.src; s.photo.alt = s.cfg.alt || ''; }
    if (s.windowPhoto && s.cfg.windowSrc) s.windowPhoto.src = s.cfg.windowSrc;
    if (s.video && s.cfg.src) { s.video.src = s.cfg.src; s.video.muted = true; s.video.preload = 'auto'; s.video.load(); }
  };
  scenes.filter(s => s.cfg.eager).forEach(load);
  const near = new IntersectionObserver(entries => {
    if (entries.some(e => e.isIntersecting)) { scenes.forEach(load); near.disconnect(); }
  }, { rootMargin: '150% 0px' });
  near.observe(root);

  // ---- geometry ----
  let W = 0, H = 0;
  const measure = () => { const r = frame.getBoundingClientRect(); W = r.width; H = r.height; };
  measure();
  new ResizeObserver(() => { measure(); render(state.p); }).observe(frame);

  const mouse = { x: 0, y: 0 };
  const state = { p: 0 };
  let active = -1;

  function cameraAt(s, te) {
    const { from, to } = s.cfg.camera;
    const exit = s.cfg.exit || { s: to.s };
    if (reduced) return { s: to.s, x: to.x, y: to.y };
    if (te > 1) {
      const k = smooth((te - 1) / 0.25);
      return { s: lerp(to.s, exit.s, k), x: to.x, y: to.y };
    }
    if (te < 0) {
      const k = smooth(-te / 0.25);
      return { s: lerp(from.s, from.s * 0.96, k), x: from.x, y: from.y };
    }
    const k = easeInOut(te);
    return { s: lerp(from.s, to.s, k), x: lerp(from.x, to.x, k), y: lerp(from.y, to.y, k) };
  }

  function placePlate(s, cam) {
    const cover = Math.max(W / PLATE_W, H / PLATE_H);
    const S = cover * cam.s;
    const f = (W < H && s.cfg.focusMobile) || s.cfg.focus || { x: .5, y: .5 };
    const par = reduced ? 0 : 1;
    let tx = W / 2 - f.x * PLATE_W * S + cam.x * W + mouse.x * 7 * par;
    let ty = H / 2 - f.y * PLATE_H * S + cam.y * H + mouse.y * 5 * par;
    tx = clamp(tx, W - PLATE_W * S, 0);
    ty = clamp(ty, H - PLATE_H * S, 0);
    s.plate.style.transform = `translate3d(${tx.toFixed(2)}px,${ty.toFixed(2)}px,0) scale(${S.toFixed(4)})`;
  }

  function render(p) {
    if (!W) measure();
    let current = 0;
    scenes.forEach(s => {
      const span = s.to - s.from;
      const te = (p - s.from) / span;
      const t = clamp(te, 0, 1);
      let alpha;
      if (reduced) {
        alpha = p >= s.from && (p < s.to || s.i === last) ? 1 : 0;
      } else {
        const fin = s.i === 0 ? 1 : smooth((p - (s.from - FADE)) / (2 * FADE));
        const fout = s.i === last ? 1 : 1 - smooth((p - (s.to - FADE)) / (2 * FADE));
        alpha = Math.min(fin, fout);
      }
      if (p >= s.from && (p < s.to || s.i === last)) current = s.i;

      s.el.style.opacity = alpha.toFixed(3);
      s.el.style.visibility = alpha > 0.005 ? 'visible' : 'hidden';
      s.el.style.setProperty('--t', t.toFixed(3));
      if (alpha > 0.005) placePlate(s, cameraAt(s, clamp(te, -0.25, 1.25)));

      if (s.video && s.video.duration && Math.abs(t - s.lastVideoT) > 1 / 30 && alpha > 0.005) {
        s.video.currentTime = t * s.video.duration; s.lastVideoT = t;
      }
    });

    // brief dip to black on every cut; the fly-through into the building goes fully dark
    let dark = 0;
    if (!reduced) scenes.slice(0, -1).forEach(s => {
      const k = s.id === 'ads' ? 1 : 0.6;
      dark = Math.max(dark, k * (1 - smooth(Math.abs(p - s.to) / FADE)));
    });
    black.style.opacity = dark.toFixed(3);

    root.style.setProperty('--intro', current === 0 ? (1 - smooth((p - (scenes[0].to - FADE * 2)) / (FADE * 2))).toFixed(3) : '0');
    if (p > 0.02) root.dataset.started = '';
    if (current !== active) setActive(current);
  }

  function setActive(i) {
    active = i;
    scenes.forEach(s => {
      const on = s.i === i;
      s.el.toggleAttribute('data-active', on);
      if ('inert' in s.el) s.el.inert = !on;
      if (!on) setLive(s, false);
    });
    const id = scenes[i].id;
    caps.forEach(c => c.classList.toggle('is-on', c.dataset.cap === id));
    stageBtns.forEach(b => b.setAttribute('aria-pressed', String(b.dataset.go === id)));
    if (i > 0 && stepEl) stepEl.textContent = String(i).padStart(2, '0');
  }

  // ---- hotspots: hover / focus / tap / keyboard all lead to the same local effect ----
  function setLive(s, on) {
    s.el.classList.toggle('is-live', on);
    s.el.querySelectorAll('.cj-hot').forEach(h => h.setAttribute('aria-pressed', String(on)));
    clearTimeout(s.liveTimer);
    if (on) {
      restart(s.el, s.id === 'ads' ? 'is-pulse' : s.id === 'ai' ? 'is-play' : null);
      if (!hoverable) s.liveTimer = setTimeout(() => setLive(s, false), 6500);
    } else {
      s.el.classList.remove('is-pulse', 'is-play');
    }
  }
  function restart(el, cls) {
    if (!cls) return;
    el.classList.remove(cls); void el.offsetWidth; el.classList.add(cls);
  }
  scenes.forEach(s => {
    s.el.querySelectorAll('.cj-hot').forEach(h => {
      let armed = null; // live state before a tap, captured before focus flips it
      if (hoverable) {
        h.addEventListener('pointerenter', () => setLive(s, true));
        h.addEventListener('pointerleave', () => { if (document.activeElement !== h) setLive(s, false); });
      }
      h.addEventListener('focus', () => setLive(s, true));
      h.addEventListener('blur', () => { if (hoverable) setLive(s, false); });
      h.addEventListener('pointerdown', () => { armed = s.el.classList.contains('is-live'); });
      h.addEventListener('click', e => {
        const keyboard = e.detail === 0;
        if (hoverable && !keyboard) return; // mouse users already got the effect on hover
        const was = armed === null ? s.el.classList.contains('is-live') : armed;
        armed = null;
        setLive(s, keyboard ? !s.el.classList.contains('is-live') : !was);
      });
    });
  });

  // ---- cursor parallax ----
  if (hoverable && !reduced) {
    frame.addEventListener('pointermove', e => {
      const r = frame.getBoundingClientRect();
      const nx = (e.clientX - r.left) / r.width, ny = (e.clientY - r.top) / r.height;
      mouse.x = (nx - .5) * 2; mouse.y = (ny - .5) * 2;
      frame.style.setProperty('--mx', mouse.x.toFixed(3));
      frame.style.setProperty('--my', mouse.y.toFixed(3));
      frame.style.setProperty('--px', (nx * 100).toFixed(1) + '%');
      frame.style.setProperty('--py', (ny * 100).toFixed(1) + '%');
      render(state.p);
    });
    frame.addEventListener('pointerleave', () => {
      mouse.x = mouse.y = 0;
      frame.style.setProperty('--mx', '0'); frame.style.setProperty('--my', '0');
      render(state.p);
    });
  }

  // ---- scroll route ----
  const tween = gsap.to(state, {
    p: 1, ease: 'none',
    scrollTrigger: { trigger: pin, start: 'top top', end: PIN_LENGTH, pin: true, anticipatePin: 1, scrub: reduced ? true : 0.7 },
    onUpdate: () => render(state.p)
  });
  const st = tween.scrollTrigger;

  stageBtns.forEach(b => b.addEventListener('click', () => {
    const s = scenes.find(x => x.id === b.dataset.go);
    if (!s) return;
    const mid = s.from + (s.to - s.from) * 0.42;
    window.scrollTo({ top: st.start + (st.end - st.start) * mid, behavior: reduced ? 'auto' : 'smooth' });
  }));

  // pause CSS animations when the block is not on screen
  new IntersectionObserver(entries => {
    root.classList.toggle('is-offscreen', !entries.some(e => e.isIntersecting));
  }, { threshold: 0.01 }).observe(root);

  scenes.forEach(s => { if (s.video) s.video.addEventListener('loadedmetadata', () => render(state.p)); });

  root.classList.add('is-ready');
  render(0);
  requestAnimationFrame(() => ScrollTrigger.refresh());
}
