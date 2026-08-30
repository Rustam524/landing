/**
 * Вступительная анимация ALGORITM: частицы звёздной пыли (красные,
 * золотые, белые) слетаются из пространства и собираются в фирменный
 * логотип, затем плавно проявляется теглайн, и через 2–3 секунды экран
 * открывает главную страницу.
 *
 * Техника сэмплирования пикселей логотипа в облако частиц адаптирована
 * из открытого проекта github.com/HelloAndersJ/particle-logo: логотип
 * рисуется на скрытом канвасе, из его пиксельных данных отбираются точки
 * фирменного знака (по яркости, а не по прозрачности — наш логотип залит
 * сплошным цветом), и уже они становятся частицами. Сама анимация
 * "сборки из рассеянных точек" в исходном проекте отсутствовала (там было
 * только отталкивание от курсора) — она дописана здесь.
 *
 * Показывается один раз за сессию (sessionStorage), учитывает
 * prefers-reduced-motion и слабые устройства, не блокирует загрузку
 * основного контента (страница грузится параллельно под оверлеем).
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
  var ctx = canvas ? canvas.getContext("2d") : null;
  var logoSource = document.getElementById("intro-logo-source");
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
    }, 600);
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

  function showTagline() {
    if (tagline) tagline.classList.add("is-visible");
  }

  if (!ctx || !logoSource) {
    // На случай отсутствия canvas/логотипа — не блокируем сайт.
    showTagline();
    window.setTimeout(function () {
      finishIntro(false);
    }, 900);
    return;
  }

  // -----------------------------------------------------------------------
  // 1. Сэмплируем силуэт логотипа: рисуем PNG на скрытом канвасе и находим
  //    точки фирменного знака по яркости (в пределах вписанной окружности
  //    значка — так в кадр не попадают белые уголки квадратного PNG).
  // -----------------------------------------------------------------------
  function buildLogoPoints() {
    var src = logoSource.naturalWidth ? logoSource : null;
    if (!src) return [];

    var size = src.naturalWidth;
    var off = document.createElement("canvas");
    off.width = size;
    off.height = size;
    var offCtx = off.getContext("2d");
    offCtx.drawImage(src, 0, 0, size, size);

    var data;
    try {
      data = offCtx.getImageData(0, 0, size, size).data;
    } catch (e) {
      return []; // на всякий случай, если браузер не даст прочитать пиксели
    }

    var cx = size / 2;
    var cy = size / 2;
    var rLimit = size * 0.485;
    var rLimitSq = rLimit * rLimit;
    var step = Math.max(2, Math.round(size / 170)); // ограничиваем число точек
    var threshold = 175;

    var points = [];
    var minX = size, maxX = 0, minY = size, maxY = 0;

    for (var y = 0; y < size; y += step) {
      for (var x = 0; x < size; x += step) {
        var dx = x - cx;
        var dy = y - cy;
        if (dx * dx + dy * dy > rLimitSq) continue;
        var idx = (y * size + x) * 4;
        var lum = 0.299 * data[idx] + 0.587 * data[idx + 1] + 0.114 * data[idx + 2];
        if (lum > threshold) {
          points.push({ x: x, y: y });
          if (x < minX) minX = x;
          if (x > maxX) maxX = x;
          if (y < minY) minY = y;
          if (y > maxY) maxY = y;
        }
      }
    }

    if (!points.length) return [];

    // Нормализуем к готовому размеру на экране, сохраняя пропорции.
    var boxW = maxX - minX || 1;
    var boxH = maxY - minY || 1;
    var targetW = Math.min(window.innerWidth * 0.72, 380);
    var scale = targetW / boxW;
    var targetH = boxH * scale;
    if (targetH > window.innerHeight * 0.4) {
      scale = (window.innerHeight * 0.4) / boxH;
    }
    var boxCx = minX + boxW / 2;
    var boxCy = minY + boxH / 2;
    var screenCx = window.innerWidth / 2;
    var screenCy = window.innerHeight * 0.42;

    return points.map(function (p) {
      return {
        x: screenCx + (p.x - boxCx) * scale,
        y: screenCy + (p.y - boxCy) * scale,
      };
    });
  }

  // -----------------------------------------------------------------------
  // 2. Частицы: каждая стартует рассеянной "звёздной пылью" вокруг своей
  //    целевой точки логотипа и плавно сходится к ней.
  // -----------------------------------------------------------------------
  var PALETTE = [
    { color: "220, 38, 38", weight: 0.42 }, // ярко-красный (фирменный)
    { color: "244, 240, 235", weight: 0.36 }, // кремово-белый
    { color: "212, 175, 55", weight: 0.22 }, // золотой акцент
  ];

  function pickColor() {
    var r = Math.random();
    var acc = 0;
    for (var i = 0; i < PALETTE.length; i++) {
      acc += PALETTE[i].weight;
      if (r <= acc) return PALETTE[i].color;
    }
    return PALETTE[0].color;
  }

  function Particle(targetX, targetY) {
    var angle = Math.random() * Math.PI * 2;
    var spread = Math.min(window.innerWidth, window.innerHeight);
    var distance = 140 + Math.random() * spread * 0.55;

    this.targetX = targetX;
    this.targetY = targetY;
    this.x = targetX + Math.cos(angle) * distance;
    this.y = targetY + Math.sin(angle) * distance;
    this.ease = 0.045 + Math.random() * 0.05;
    this.size = 0.9 + Math.random() * 1.7;
    this.color = pickColor();
    this.baseAlpha = 0.55 + Math.random() * 0.45;
    this.twinklePhase = Math.random() * Math.PI * 2;
    this.twinkleSpeed = 0.04 + Math.random() * 0.05;
  }

  Particle.prototype.update = function () {
    this.x += (this.targetX - this.x) * this.ease;
    this.y += (this.targetY - this.y) * this.ease;
    this.twinklePhase += this.twinkleSpeed;
  };

  Particle.prototype.draw = function (ctx2d) {
    var alpha = this.baseAlpha * (0.72 + 0.28 * Math.sin(this.twinklePhase));
    ctx2d.fillStyle = "rgba(" + this.color + "," + alpha.toFixed(3) + ")";
    ctx2d.fillRect(this.x, this.y, this.size, this.size);
  };

  var particles = [];
  var dpr = Math.min(window.devicePixelRatio || 1, 2);

  function resizeCanvas() {
    var w = window.innerWidth;
    var h = window.innerHeight;
    canvas.width = w * dpr;
    canvas.height = h * dpr;
    canvas.style.width = w + "px";
    canvas.style.height = h + "px";
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  function initParticles() {
    var points = buildLogoPoints();
    particles = points.map(function (p) {
      return new Particle(p.x, p.y);
    });
  }

  function drawStatic() {
    // Упрощённый режим (reduced motion / слабое устройство): логотип сразу
    // собран, без покадровой анимации — один статичный рендер частиц.
    var w = window.innerWidth;
    var h = window.innerHeight;
    ctx.clearRect(0, 0, w, h);
    var points = buildLogoPoints();
    points.forEach(function (p) {
      ctx.fillStyle = "rgba(220, 38, 38, 0.9)";
      ctx.fillRect(p.x, p.y, 1.6, 1.6);
    });
  }

  function runSimplified() {
    resizeCanvas();
    drawStatic();
    showTagline();
    window.setTimeout(function () {
      finishIntro(false);
    }, 1400);
  }

  var started = false;

  function proceedWhenReady() {
    if (started) return;
    started = true;

    if (simplified) {
      runSimplified();
      return;
    }

    resizeCanvas();
    window.addEventListener("resize", resizeCanvas);
    initParticles();

    var TOTAL_MS = 2500;
    var TAGLINE_AT_MS = 1900;
    var taglineShown = false;
    var startTime = null;

    function loop(ts) {
      if (startTime === null) startTime = ts;
      var elapsed = ts - startTime;
      var w = window.innerWidth;
      var h = window.innerHeight;

      ctx.clearRect(0, 0, w, h);
      for (var i = 0; i < particles.length; i++) {
        particles[i].update();
        particles[i].draw(ctx);
      }

      if (!taglineShown && elapsed >= TAGLINE_AT_MS) {
        taglineShown = true;
        showTagline();
      }

      if (!finished) rafId = requestAnimationFrame(loop);
    }

    rafId = requestAnimationFrame(loop);
    window.setTimeout(function () {
      finishIntro(false);
    }, TOTAL_MS);
  }

  if (logoSource.complete && logoSource.naturalWidth) {
    proceedWhenReady();
  } else {
    logoSource.addEventListener("load", proceedWhenReady, { once: true });
    logoSource.addEventListener(
      "error",
      function () {
        showTagline();
        window.setTimeout(function () {
          finishIntro(false);
        }, 900);
      },
      { once: true }
    );
    // Подстраховка: если логотип почему-то не загрузится вовремя.
    window.setTimeout(function () {
      if (!finished && !started) proceedWhenReady();
    }, 1200);
  }
})();
