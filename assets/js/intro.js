/**
 * Вступительная анимация ALGORITM: световой импульс летит "кометой"
 * из угла экрана к центру, вспыхивает и собирается в фирменный логотип,
 * следом проявляется теглайн. Показывается один раз за сессию
 * (sessionStorage), учитывает prefers-reduced-motion и слабые устройства,
 * не блокирует загрузку основного контента (страница грузится параллельно
 * под оверлеем).
 */
(function () {
  "use strict";

  var STORAGE_KEY = "algoritm_intro_seen";
  var overlay = document.getElementById("intro-screen");
  if (!overlay) return;

  var alreadySeen = false;
  try {
    alreadySeen = sessionStorage.getItem(STORAGE_KEY) === "1";
  } catch (e) {
    // sessionStorage может быть недоступен (приватный режим) — показываем анимацию.
  }

  if (alreadySeen) {
    overlay.hidden = true;
    return;
  }

  var reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var isLowEndDevice = window.ALGORITM_isLowEndDevice ? window.ALGORITM_isLowEndDevice() : false;
  var simplified = reducedMotion || isLowEndDevice;

  var canvas = document.getElementById("intro-canvas");
  var ctx = canvas && !simplified ? canvas.getContext("2d") : null;
  var logoWrap = document.getElementById("intro-logo-wrap");
  var logo = document.getElementById("intro-logo");
  var tagline = document.getElementById("intro-tagline");
  var skipBtn = document.getElementById("intro-skip");
  var soundBtn = document.getElementById("intro-sound-toggle");
  var soundEnabled = false;
  var finished = false;
  var rafId = null;

  document.body.style.overflow = "hidden";

  function track(eventName, params) {
    if (window.ALGORITM_trackEvent) window.ALGORITM_trackEvent(eventName, params || {});
  }

  function revealLogo() {
    if (logoWrap) logoWrap.classList.add("is-visible");
    if (logo) logo.classList.add("is-visible");
    window.setTimeout(function () {
      if (tagline) tagline.classList.add("is-visible");
    }, 280);
  }

  function finishIntro(skipped) {
    if (finished) return;
    finished = true;
    if (rafId) cancelAnimationFrame(rafId);
    try {
      sessionStorage.setItem(STORAGE_KEY, "1");
    } catch (e) {}
    document.body.style.overflow = "";
    overlay.classList.add("is-leaving");
    if (skipped) track("intro_skip");
    window.setTimeout(function () {
      overlay.hidden = true;
    }, 550);
  }

  if (skipBtn) {
    skipBtn.addEventListener("click", function () {
      finishIntro(true);
    });
  }

  if (soundBtn) {
    soundBtn.addEventListener("click", function () {
      soundEnabled = !soundEnabled;
      soundBtn.setAttribute("aria-pressed", String(soundEnabled));
      soundBtn.textContent = soundEnabled ? "🔊 Звук вкл." : "🔈 Звук выкл.";
      track("intro_sound_toggle", { enabled: soundEnabled });
      // Аудиофайл фирменного импульса пока не предоставлен владельцем.
      // Звук включается только этим явным действием пользователя и никогда
      // не запускается автоматически (см. ТЗ, раздел 4).
      var audioEl = document.getElementById("intro-audio");
      if (audioEl && audioEl.getAttribute("data-src")) {
        if (soundEnabled) {
          audioEl.src = audioEl.getAttribute("data-src");
          audioEl.play().catch(function () {});
        } else {
          audioEl.pause();
        }
      }
    });
  }

  if (simplified) {
    // Упрощённый вариант: без canvas-кометы, короткое плавное появление.
    revealLogo();
    window.setTimeout(function () {
      finishIntro(false);
    }, 1300);
    return;
  }

  // ---------------------------------------------------------------------
  // Canvas: световой импульс летит по дуге к центру, затем вспыхивает
  // ---------------------------------------------------------------------
  var dpr = Math.min(window.devicePixelRatio || 1, 2);
  var w = window.innerWidth;
  var h = window.innerHeight;

  function resize() {
    w = window.innerWidth;
    h = window.innerHeight;
    canvas.width = w * dpr;
    canvas.height = h * dpr;
    canvas.style.width = w + "px";
    canvas.style.height = h + "px";
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }
  resize();
  window.addEventListener("resize", resize);

  var CORE_COLOR = "#fff4d6";
  var MID_COLOR = "#f4ede2";
  var OUTER_COLOR = "#dc2626"; // ярко-красный из фирменной палитры

  // Путь импульса: из нижнего левого угла к центру экрана, по дуге.
  var startX = -w * 0.1;
  var startY = h * 1.05;
  var endX = w * 0.5;
  var endY = h * 0.44;
  var ctrlX = w * 0.15;
  var ctrlY = h * 0.15;

  var FLIGHT_MS = 780;
  var BURST_MS = 1200;
  var TOTAL_MS = 2700;

  var trail = [];
  var burstParticles = [];
  var ambient = [];
  var startTime = null;
  var burstSpawned = false;

  function bezier(t) {
    var x = (1 - t) * (1 - t) * startX + 2 * (1 - t) * t * ctrlX + t * t * endX;
    var y = (1 - t) * (1 - t) * startY + 2 * (1 - t) * t * ctrlY + t * t * endY;
    return { x: x, y: y };
  }

  function spawnBurst(x, y) {
    var count = w < 600 ? 38 : 78;
    for (var i = 0; i < count; i++) {
      var angle = Math.random() * Math.PI * 2;
      var speed = Math.random() * 4 + 1.5;
      burstParticles.push({
        x: x,
        y: y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        r: Math.random() * 2.2 + 0.8,
        life: 1,
      });
    }
    var ambCount = w < 600 ? 20 : 42;
    for (var j = 0; j < ambCount; j++) {
      ambient.push({
        x: x + (Math.random() - 0.5) * w * 0.6,
        y: y + Math.random() * h * 0.4,
        r: Math.random() * 1.4 + 0.4,
        speed: Math.random() * 0.5 + 0.15,
        drift: (Math.random() - 0.5) * 0.3,
        twinkle: Math.random() * Math.PI * 2,
      });
    }
  }

  function easeOutCubic(t) {
    return 1 - Math.pow(1 - t, 3);
  }

  function draw(ts) {
    if (startTime === null) startTime = ts;
    var elapsed = ts - startTime;
    ctx.clearRect(0, 0, w, h);

    if (elapsed < FLIGHT_MS) {
      var t = elapsed / FLIGHT_MS;
      var pos = bezier(easeOutCubic(t));

      trail.push({ x: pos.x, y: pos.y });
      if (trail.length > 16) trail.shift();

      for (var i = 0; i < trail.length; i++) {
        var pt = trail[i];
        var a = i / trail.length;
        var r = 3 + a * 11;
        var grad = ctx.createRadialGradient(pt.x, pt.y, 0, pt.x, pt.y, r);
        grad.addColorStop(0, CORE_COLOR);
        grad.addColorStop(0.4, MID_COLOR);
        grad.addColorStop(1, "transparent");
        ctx.save();
        ctx.globalAlpha = a * 0.8;
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(pt.x, pt.y, r, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }

      var head = trail[trail.length - 1];
      if (head) {
        var coreGrad = ctx.createRadialGradient(head.x, head.y, 0, head.x, head.y, 16);
        coreGrad.addColorStop(0, CORE_COLOR);
        coreGrad.addColorStop(0.5, OUTER_COLOR);
        coreGrad.addColorStop(1, "transparent");
        ctx.save();
        ctx.shadowBlur = 28;
        ctx.shadowColor = OUTER_COLOR;
        ctx.fillStyle = coreGrad;
        ctx.beginPath();
        ctx.arc(head.x, head.y, 13, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }
    } else {
      if (!burstSpawned) {
        burstSpawned = true;
        var landing = bezier(1);
        spawnBurst(landing.x, landing.y);
        revealLogo();
      }

      for (var b = burstParticles.length - 1; b >= 0; b--) {
        var p = burstParticles[b];
        p.x += p.vx;
        p.y += p.vy;
        p.vx *= 0.96;
        p.vy *= 0.96;
        p.life -= 1 / (BURST_MS / 16.6);
        if (p.life <= 0) {
          burstParticles.splice(b, 1);
          continue;
        }
        ctx.save();
        ctx.globalAlpha = Math.max(p.life, 0);
        ctx.shadowBlur = p.r * 4;
        ctx.shadowColor = OUTER_COLOR;
        ctx.fillStyle = p.life > 0.5 ? CORE_COLOR : OUTER_COLOR;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }

      ctx.fillStyle = MID_COLOR;
      for (var k = 0; k < ambient.length; k++) {
        var am = ambient[k];
        am.y -= am.speed;
        am.x += am.drift;
        am.twinkle += 0.05;
        ctx.save();
        ctx.globalAlpha = 0.22 + Math.sin(am.twinkle) * 0.18;
        ctx.shadowBlur = am.r * 4;
        ctx.shadowColor = OUTER_COLOR;
        ctx.beginPath();
        ctx.arc(am.x, am.y, am.r, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }
    }

    if (!finished) rafId = requestAnimationFrame(draw);
  }

  rafId = requestAnimationFrame(draw);

  window.setTimeout(function () {
    finishIntro(false);
  }, TOTAL_MS);
})();
