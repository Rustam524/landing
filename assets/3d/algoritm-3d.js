import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';

const section = document.getElementById('algoritm-3d');
if (section && window.gsap && window.ScrollTrigger) init();

function init() {
  const { gsap, ScrollTrigger } = window;
  gsap.registerPlugin(ScrollTrigger);

  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const narrow = matchMedia('(max-width: 860px)');
  const pin = section.querySelector('.a3-pin');
  const canvas = section.querySelector('.a3-canvas');
  const stages = [...section.querySelectorAll('.a3-stage')];
  const bars = [...section.querySelectorAll('.a3-progress i')];
  const counter = section.querySelector('.a3-counter b');
  const total = stages.length;
  section.style.setProperty('--a3-stages', total);

  /* ---------- text: word masks ---------- */
  function splitWords(el) {
    const words = el.textContent.trim().split(/\s+/);
    el.innerHTML = words.map(w => `<span class="a3-w"><span>${w}</span></span>`).join(' ');
  }
  const wordsOf = st => st.querySelectorAll('.a3-w > span');
  const restOf = st => st.querySelectorAll('.a3-kicker, .a3-text, .a3-chips li, .a3-cta');
  stages.forEach(st => st.querySelectorAll('.a3-title').forEach(splitWords));

  let current = -1;
  gsap.set(stages, { autoAlpha: 0 });

  function show(i, dir = 1) {
    if (i === current) return;
    const prev = stages[current];
    current = i;
    const next = stages[i];
    if (counter) counter.textContent = String(i + 1).padStart(2, '0');
    bars.forEach((b, k) => b.classList.toggle('is-done', k <= i));

    const dur = reduced ? 0 : 1;
    if (prev) {
      gsap.killTweensOf([prev, ...wordsOf(prev), ...restOf(prev)]);
      gsap.timeline()
        .to(wordsOf(prev), { yPercent: -110 * dir, duration: .38 * dur, stagger: .018 * dur, ease: 'power2.in' }, 0)
        .to(restOf(prev), { y: -14 * dir, opacity: 0, duration: .3 * dur, stagger: .02 * dur, ease: 'power2.in' }, 0)
        .set(prev, { autoAlpha: 0 });
    }
    gsap.killTweensOf([next, ...wordsOf(next), ...restOf(next)]);
    gsap.set(next, { autoAlpha: 1 });
    gsap.fromTo(wordsOf(next), { yPercent: 110 * dir }, { yPercent: 0, duration: .85 * dur, stagger: .045 * dur, ease: 'power3.out', delay: .12 * dur, overwrite: true });
    gsap.fromTo(restOf(next), { y: 22 * dir, opacity: 0 }, { y: 0, opacity: 1, duration: .7 * dur, stagger: .06 * dur, ease: 'power3.out', delay: .28 * dur, overwrite: true });
  }

  /* ---------- three: glass monolith with a red signal inside ---------- */
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: false, powerPreference: 'high-performance' });
  renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 1.75));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;

  const bg = new THREE.Color(0x0d0a0b);
  const scene = new THREE.Scene();
  scene.background = bg;
  scene.fog = new THREE.Fog(bg, 9, 17);
  const pmrem = new THREE.PMREMGenerator(renderer);
  scene.environment = pmrem.fromScene(new RoomEnvironment(renderer), .04).texture;

  const camera = new THREE.PerspectiveCamera(30, 1, .1, 60);

  scene.add(new THREE.AmbientLight(0xf4f0eb, .18));
  const key = new THREE.DirectionalLight(0xf4f0eb, 2.4);
  key.position.set(-4, 5, 6);
  scene.add(key);
  const rim = new THREE.DirectionalLight(0xffcfbd, 1.1);
  rim.position.set(4, -2, -5);
  scene.add(rim);

  const rig = new THREE.Group();
  scene.add(rig);

  const glass = new THREE.MeshPhysicalMaterial({
    color: 0xf4f0eb, metalness: 0, roughness: .06, transmission: 1, thickness: 1.3, ior: 1.5,
    clearcoat: 1, clearcoatRoughness: .08, attenuationColor: new THREE.Color(0xb91c1c), attenuationDistance: 2.6,
    specularIntensity: 1, envMapIntensity: 1.25
  });
  const slab = new THREE.Mesh(new RoundedBoxGeometry(1.5, 3.1, .62, 8, .16), glass);
  rig.add(slab);

  const coreMat = new THREE.MeshStandardMaterial({ color: 0x2a0606, emissive: 0xb91c1c, emissiveIntensity: 1.8, roughness: .35 });
  const core = new THREE.Mesh(new THREE.CapsuleGeometry(.055, 1.9, 8, 18), coreMat);
  rig.add(core);
  const coreLight = new THREE.PointLight(0xb91c1c, 26, 11, 2);
  rig.add(coreLight);

  const ringMat = new THREE.MeshBasicMaterial({ color: 0xf4f0eb, transparent: true, opacity: 0 });
  const ring = new THREE.Mesh(new THREE.TorusGeometry(2.25, .006, 10, 220), ringMat);
  ring.rotation.x = Math.PI / 2.4;
  rig.add(ring);

  const sats = new THREE.Group();
  const satMat = new THREE.MeshStandardMaterial({ color: 0xf4f0eb, emissive: 0xf4f0eb, emissiveIntensity: .35, roughness: .3, transparent: true, opacity: 0 });
  for (let i = 0; i < 3; i++) {
    const m = new THREE.Mesh(new RoundedBoxGeometry(.28, .42, .05, 4, .04), satMat);
    const a = (i / 3) * Math.PI * 2;
    m.position.set(Math.cos(a) * 1.65, (i - 1) * .55, Math.sin(a) * 1.65);
    m.lookAt(0, m.position.y, 0);
    sats.add(m);
  }
  rig.add(sats);

  const dustGeo = new THREE.BufferGeometry();
  const N = 800, pos = new Float32Array(N * 3);
  for (let i = 0; i < N; i++) {
    pos[i * 3] = (Math.random() - .5) * 14;
    pos[i * 3 + 1] = (Math.random() - .5) * 9;
    pos[i * 3 + 2] = (Math.random() - .5) * 9 - 1;
  }
  dustGeo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  const dust = new THREE.Points(dustGeo, new THREE.PointsMaterial({ color: 0xf4f0eb, size: .028, transparent: true, opacity: .5, sizeAttenuation: true, depthWrite: false }));
  scene.add(dust);

  /* ---------- scroll-driven state ---------- */
  const state = { rot: 0, tilt: 0, camZ: 7.8, camY: 0, core: 1, glow: 1, ring: 0, sats: 0, satSpin: 0 };
  const layout = { x: 1.55, y: 0 };
  function applyLayout() {
    if (narrow.matches) { layout.x = 0; layout.y = .75; }
    else { layout.x = 1.55; layout.y = 0; }
  }
  applyLayout();
  narrow.addEventListener('change', applyLayout);

  const keyframes = [
    { rot: 0,               tilt: 0,    camZ: 7.8, camY: 0,   core: 1,   glow: 1,   ring: 0, sats: 0 },
    { rot: Math.PI * .55,   tilt: -.28, camZ: 6.6, camY: .1,  core: 1.3, glow: 1.6, ring: 0, sats: 0 },
    { rot: Math.PI * 1.1,   tilt: .18,  camZ: 7.2, camY: -.1, core: .55, glow: 1.2, ring: 1, sats: 1 },
    { rot: Math.PI * 1.65,  tilt: -.12, camZ: 6.9, camY: .15, core: 1.15, glow: 1.4, ring: .6, sats: 0 },
    { rot: Math.PI * 2.2,   tilt: 0,    camZ: 6.0, camY: 0,   core: 1.6, glow: 2.2, ring: 1, sats: 1 }
  ];

  const tl = gsap.timeline({
    defaults: { ease: 'none', duration: 1 },
    scrollTrigger: {
      trigger: section, start: 'top top', end: 'bottom bottom', scrub: .9,
      onUpdate: self => show(Math.round(self.progress * (total - 1)), self.direction || 1)
    }
  });
  keyframes.slice(1, total).forEach(k => tl.to(state, k));

  /* ---------- pointer parallax ---------- */
  const mouse = { x: 0, y: 0, tx: 0, ty: 0 };
  if (!reduced) {
    pin.addEventListener('pointermove', e => {
      const r = pin.getBoundingClientRect();
      mouse.tx = ((e.clientX - r.left) / r.width) * 2 - 1;
      mouse.ty = ((e.clientY - r.top) / r.height) * 2 - 1;
    }, { passive: true });
    pin.addEventListener('pointerleave', () => { mouse.tx = 0; mouse.ty = 0; });
  }

  /* ---------- sizing + render loop ---------- */
  function resize() {
    const w = pin.clientWidth, h = pin.clientHeight;
    if (!w || !h) return;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  }
  new ResizeObserver(resize).observe(pin);
  resize();

  let raf = 0, visible = false;
  const clock = new THREE.Clock();
  function frame() {
    if (!visible) { raf = 0; return; }
    const t = clock.getElapsedTime();
    mouse.x += (mouse.tx - mouse.x) * .05;
    mouse.y += (mouse.ty - mouse.y) * .05;

    rig.position.set(layout.x, layout.y, 0);
    rig.rotation.set(mouse.y * .12 + Math.sin(t * .35) * .03, state.rot + mouse.x * .22 + t * .04, state.tilt);
    core.scale.set(1, state.core, 1);
    coreMat.emissiveIntensity = 1.5 * state.glow + Math.sin(t * 2.2) * .25;
    coreLight.intensity = 22 * state.glow;
    ringMat.opacity = .55 * state.ring;
    ring.rotation.z = t * .25;
    sats.rotation.y = t * .55;
    satMat.opacity = .9 * state.sats;
    sats.visible = state.sats > .01;
    ring.visible = state.ring > .01;
    dust.rotation.y = t * .012;
    dust.position.y = Math.sin(t * .2) * .15;

    camera.position.set(0, state.camY, state.camZ);
    camera.lookAt(layout.x * .55, layout.y * .35, 0);
    renderer.render(scene, camera);
    raf = requestAnimationFrame(frame);
  }
  new IntersectionObserver(entries => {
    visible = entries.some(e => e.isIntersecting);
    if (visible && !raf) raf = requestAnimationFrame(frame);
  }, { rootMargin: '10% 0px' }).observe(section);

  show(0, 1);

  /* ---------- language switch from the first screen ---------- */
  const hero = document.getElementById('algoritm-first-screen');
  if (hero) hero.addEventListener('ag-language-change', () => {
    stages.forEach(st => st.querySelectorAll('.a3-title').forEach(splitWords));
    if (current >= 0) gsap.set(wordsOf(stages[current]), { yPercent: 0 });
    requestAnimationFrame(() => ScrollTrigger.refresh());
  });
}
