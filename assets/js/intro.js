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
  // Заставка — короткая одноразовая анимация (~2.5с), а не постоянный фон,
  // поэтому для неё узкий экран телефона сам по себе не повод упрощать —
  // упрощаем только на реально слабом железе (мало памяти/ядер, экономия
  // трафика), а не по одной лишь ширине экрана.
  var isWeakHardware = !!(
    (navigator.deviceMemory && navigator.deviceMemory <= 2) ||
    (navigator.hardwareConcurrency && navigator.hardwareConcurrency <= 2) ||
    (navigator.connection && navigator.connection.saveData)
  );
  var simplified = reducedMotion || isWeakHardware;

  var canvas = document.getElementById("intro-canvas");
  var ctx = canvas ? canvas.getContext("2d") : null;
  var logoSource = document.getElementById("intro-logo-source");
  var tagline = document.getElementById("intro-tagline");
  var skipBtn = document.getElementById("intro-skip");
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
  //    точки фирменного знака по яркости. Сэмплируем только полосу со
  //    знаком и словом ALGORITM (без мелкого подзаголовка "маркетинговое
  //    агентство" и строки "DIGITAL AI MARKETING") — так название читается
  //    чётко даже в небольшом размере на экране.
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

    // Полоса с знаком + словом ALGORITM (доля от высоты/ширины картинки —
    // не зависит от конкретного разрешения файла). По ширине также
    // отрезаем метallic ободок круглого значка слева/справа.
    var bandTop = size * 0.4;
    var bandBottom = size * 0.53;
    var bandLeft = size * 0.12;
    var bandRight = size * 0.88;
    var step = 1; // максимальная плотность — больше "звёздной пыли"
    var threshold = 175;

    var points = [];
    var minX = size, maxX = 0, minY = size, maxY = 0;

    for (var y = bandTop; y < bandBottom; y += step) {
      for (var x = bandLeft; x < bandRight; x += step) {
        var idx = (Math.round(y) * size + Math.round(x)) * 4;
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

    // Ограничиваем итоговое число частиц (иначе на слабом GPU/мобильном
    // браузере анимация начнёт тормозить) — прореживаем случайно, силуэт
    // от этого не страдает, дыма/пыли всё равно заметно больше, чем раньше.
    var MAX_PARTICLES = 4500;
    if (points.length > MAX_PARTICLES) {
      var keepChance = MAX_PARTICLES / points.length;
      points = points.filter(function () {
        return Math.random() < keepChance;
      });
    }

    // Нормализуем к готовому размеру на экране: название почти во весь
    // экран, пропорционально количеству "звёздной пыли".
    var boxW = maxX - minX || 1;
    var boxH = maxY - minY || 1;
    var targetW = Math.min(window.innerWidth * 0.9, 1100);
    var scale = targetW / boxW;
    var targetH = boxH * scale;
    if (targetH > window.innerHeight * 0.5) {
      scale = (window.innerHeight * 0.5) / boxH;
    }
    var boxCx = minX + boxW / 2;
    var boxCy = minY + boxH / 2;
    var screenCx = window.innerWidth / 2;
    var screenCy = window.innerHeight * 0.42;

    // Чёткая "вырезка" настоящих букв (прозрачный фон, только пиксели
    // названия) — проявляется поверх пыли в конце анимации, чтобы название
    // читалось чётко, а не оставалось размытым облаком точек.
    var cutW = Math.max(1, Math.round(boxW));
    var cutH = Math.max(1, Math.round(boxH));
    var cutout = document.createElement("canvas");
    cutout.width = cutW;
    cutout.height = cutH;
    var cutoutCtx = cutout.getContext("2d");
    var cropData = offCtx.getImageData(Math.round(minX), Math.round(minY), cutW, cutH);
    var px = cropData.data;
    for (var i = 0; i < px.length; i += 4) {
      var l = 0.299 * px[i] + 0.587 * px[i + 1] + 0.114 * px[i + 2];
      if (l <= threshold) px[i + 3] = 0; // всё, что не буквы/значок — прозрачное
    }
    cutoutCtx.putImageData(cropData, 0, 0);

    logoGeometry = {
      canvas: cutout,
      destX: screenCx - (cutW * scale) / 2,
      destY: screenCy - (cutH * scale) / 2,
      destW: cutW * scale,
      destH: cutH * scale,
    };

    return points.map(function (p) {
      return {
        x: screenCx + (p.x - boxCx) * scale,
        y: screenCy + (p.y - boxCy) * scale,
      };
    });
  }

  // Геометрия чёткой "вырезки" букв — заполняется в buildLogoPoints(),
  // используется в основном цикле анимации для финального чёткого проявления.
  var logoGeometry = null;

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
    buildLogoPoints(); // заполняет logoGeometry чёткой вырезкой букв
    if (logoGeometry) {
      ctx.drawImage(
        logoGeometry.canvas,
        logoGeometry.destX,
        logoGeometry.destY,
        logoGeometry.destW,
        logoGeometry.destH
      );
    }
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
    // Частицы к этому моменту уже почти сошлись к своим точкам — поверх них
    // плавно проявляем настоящую чёткую вырезку букв, чтобы название
    // читалось резко, а не оставалось "пыльным" облаком точек.
    var REVEAL_START_MS = 1550;
    var REVEAL_DURATION_MS = 550;
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

      if (logoGeometry && elapsed > REVEAL_START_MS) {
        var revealAlpha = Math.min(1, (elapsed - REVEAL_START_MS) / REVEAL_DURATION_MS);
        ctx.save();
        ctx.globalAlpha = revealAlpha;
        ctx.drawImage(
          logoGeometry.canvas,
          logoGeometry.destX,
          logoGeometry.destY,
          logoGeometry.destW,
          logoGeometry.destH
        );
        ctx.restore();
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
