/**
 * Вступительная анимация ALGORITM: волна светящейся пыли (красная, золотая,
 * кремовая) поднимается снизу экрана слева направо и собирается в фирменный
 * логотип, затем поверх нею проявляется чёткая вырезка букв, плавно
 * появляется теглайн, и через ~3.5 секунды экран открывает главную страницу.
 *
 * Само движение частиц — на WebGL (органичная волна + сборка), рендер
 * ведётся шейдером. Сэмплирование пикселей логотипа в облако целевых точек
 * (по яркости, канвас 2D) — техника, адаптированная из открытого проекта
 * github.com/HelloAndersJ/particle-logo под наш логотип и палитру; сама
 * "волна подъёма и сборки" дописана здесь на GLSL.
 *
 * Показывается один раз за сессию (sessionStorage), учитывает
 * prefers-reduced-motion и слабые устройства (в т.ч. отсутствие WebGL) —
 * в этих случаях логотип появляется сразу, без покадровой анимации.
 * Не блокирует загрузку основного контента (страница грузится параллельно
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
  // Заставка — короткая одноразовая анимация (~3.5с), а не постоянный фон,
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

  if (!canvas || !logoSource) {
    // На случай отсутствия canvas/логотипа — не блокируем сайт.
    showTagline();
    window.setTimeout(function () {
      finishIntro(false);
    }, 900);
    return;
  }

  // -----------------------------------------------------------------------
  // 1. Сэмплируем силуэт логотипа: рисуем PNG на скрытом канвасе и находим
  //    точки фирменного знака по яркости (тот же логотип, что и на сайте).
  //    Сэмплируем только полосу со знаком и словом ALGORITM.
  // -----------------------------------------------------------------------
  var LUM_THRESHOLD = 175;
  var logoGeometry = null; // чёткая "вырезка" букв — заполняется здесь, рисуется в конце сборки

  function buildLogoPoints(maxParticles) {
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

    var bandTop = size * 0.4;
    var bandBottom = size * 0.548;
    var bandLeft = size * 0.12;
    var bandRight = size * 0.88;
    var step = 1;

    var points = [];
    var minX = size, maxX = 0, minY = size, maxY = 0;

    for (var y = bandTop; y < bandBottom; y += step) {
      for (var x = bandLeft; x < bandRight; x += step) {
        var idx = (Math.round(y) * size + Math.round(x)) * 4;
        var lum = 0.299 * data[idx] + 0.587 * data[idx + 1] + 0.114 * data[idx + 2];
        if (lum > LUM_THRESHOLD) {
          points.push({ x: x, y: y });
          if (x < minX) minX = x;
          if (x > maxX) maxX = x;
          if (y < minY) minY = y;
          if (y > maxY) maxY = y;
        }
      }
    }

    if (!points.length) return [];

    if (points.length > maxParticles) {
      var keepChance = maxParticles / points.length;
      points = points.filter(function () {
        return Math.random() < keepChance;
      });
    }

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
    // названия) — проявляется поверх пыли в конце анимации.
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
      if (l <= LUM_THRESHOLD) px[i + 3] = 0;
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

  function drawCrispLogo(ctx2d, alpha) {
    if (!logoGeometry) return;
    ctx2d.save();
    ctx2d.globalAlpha = alpha;
    ctx2d.drawImage(
      logoGeometry.canvas,
      logoGeometry.destX,
      logoGeometry.destY,
      logoGeometry.destW,
      logoGeometry.destH
    );
    ctx2d.restore();
  }

  // -----------------------------------------------------------------------
  // 2. Упрощённый путь (reduced motion / слабое железо / нет WebGL):
  //    логотип сразу собран, без покадровой анимации.
  // -----------------------------------------------------------------------
  function runSimplified() {
    var ctx2d = canvas.getContext("2d");
    if (!ctx2d) {
      showTagline();
      window.setTimeout(function () {
        finishIntro(false);
      }, 900);
      return;
    }
    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    var w = window.innerWidth;
    var h = window.innerHeight;
    canvas.width = w * dpr;
    canvas.height = h * dpr;
    canvas.style.width = w + "px";
    canvas.style.height = h + "px";
    ctx2d.setTransform(dpr, 0, 0, dpr, 0, 0);
    buildLogoPoints(4500);
    ctx2d.clearRect(0, 0, w, h);
    drawCrispLogo(ctx2d, 1);
    showTagline();
    window.setTimeout(function () {
      finishIntro(false);
    }, 1400);
  }

  // -----------------------------------------------------------------------
  // 3. Основной путь: WebGL-волна пыли, поднимающаяся слева направо и
  //    собирающаяся в силуэт логотипа, плюс фоновые дрейфующие искры для
  //    атмосферы. Дальше поверх проявляется чёткая вырезка букв (2D canvas
  //    поверх WebGL-канваса нельзя — рисуем её в конце тем же <canvas>,
  //    переключив контекст 2D после остановки WebGL-цикла).
  // -----------------------------------------------------------------------
  var VERTEX_SRC =
    "precision highp float;\n" +
    "attribute vec4 aBirth;\n" + // x: birthX(px), y: rise height(px), z: phase seed 0..1, w: tone 0..1
    "attribute vec4 aGoal;\n" + // x: goalX(px), y: goalY(px), z: point size(px), w: kind (0=ambient,1=logo)
    "uniform float uTime;\n" +
    "uniform float uResX;\n" +
    "uniform float uResY;\n" +
    "uniform float uDpr;\n" +
    "varying float vAlpha;\n" +
    "varying float vTone;\n" +
    "void main(){\n" +
    "  float kind = aGoal.w;\n" +
    "  float phase = aBirth.z * 6.28318;\n" +
    "  float tone = aBirth.w;\n" +
    "  float minDim = min(uResX, uResY);\n" + // единый масштаб — одна и та же формула для любого экрана
    "  float x; float y; float alpha;\n" +
    "  if (kind > 0.5) {\n" +
    "    float birth = 0.05 + (aGoal.x / uResX) * 0.62;\n" + // волна: собираются слева направо
    "    float age = max(0.0, uTime - birth);\n" +
    "    float assemble = smoothstep(0.0, 1.5, age);\n" +
    "    float rise = 1.0 - assemble;\n" +
    "    x = aGoal.x + sin(age*2.1+phase)*(1.0-assemble)*minDim*0.0229 + sin(phase*3.0)*assemble*minDim*0.0036;\n" +
    "    y = aGoal.y + rise*aBirth.y + sin(age*3.0+phase)*(1.0-assemble)*minDim*0.0157;\n" +
    "    alpha = smoothstep(0.0,0.25,age) * (0.82 + 0.18*sin(uTime*3.0+phase));\n" +
    "  } else {\n" +
    "    float birth = aBirth.z * 0.65;\n" +
    "    float age = max(0.0, uTime - birth);\n" +
    "    float drift = age * 0.16;\n" +
    "    x = aBirth.x + sin(age*0.8+phase) * minDim*0.0371;\n" +
    "    y = uResY*1.06 - drift*uResY*0.62 + sin(age*1.7+phase)*minDim*0.0214;\n" +
    "    alpha = smoothstep(0.0,0.3,age) * (0.28+0.34*tone) * smoothstep(4.4,1.7,age);\n" +
    "  }\n" +
    "  vAlpha = clamp(alpha, 0.0, 1.0);\n" +
    "  vTone = tone;\n" +
    "  gl_Position = vec4(x/uResX*2.0-1.0, 1.0 - y/uResY*2.0, 0.0, 1.0);\n" +
    "  gl_PointSize = max(1.0, aGoal.z * uDpr);\n" +
    "}\n";

  var FRAGMENT_SRC =
    "precision mediump float;\n" +
    "varying float vAlpha;\n" +
    "varying float vTone;\n" +
    "void main(){\n" +
    "  vec2 uv = gl_PointCoord - 0.5;\n" +
    "  float d = length(uv) * 2.0;\n" +
    "  if (d > 1.0 || vAlpha < 0.01) discard;\n" +
    "  float core = exp(-d*d*13.0);\n" +
    "  float halo = exp(-d*d*3.2) * 0.22;\n" +
    "  vec3 warm = mix(vec3(0.73,0.20,0.16), vec3(0.90,0.72,0.36), vTone);\n" + // фирменный красный -> золотой
    "  vec3 color = mix(warm, vec3(1.0,0.97,0.90), core*0.7);\n" +
    "  gl_FragColor = vec4(color, (core+halo) * vAlpha);\n" +
    "}\n";

  function compileShader(gl, type, source) {
    var shader = gl.createShader(type);
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
      var log = gl.getShaderInfoLog(shader);
      gl.deleteShader(shader);
      throw new Error(log || "shader compile error");
    }
    return shader;
  }

  function runWebgl() {
    var gl =
      canvas.getContext("webgl", { alpha: true, antialias: false, premultipliedAlpha: false }) ||
      canvas.getContext("experimental-webgl", { alpha: true, antialias: false, premultipliedAlpha: false });
    if (!gl) {
      runSimplified();
      return;
    }

    var program, buffer, locTime, locResX, locResY, locDpr, particleCount;

    function buildParticles() {
      // Плотность частиц-сборки — по числу найденных точек логотипа (без
      // ограничения на слабых мобильных: уже не 2D-канвас, GPU справится
      // с бóльшим числом точек — но всё же ограничим сверху ради телефонов).
      var logoPoints = buildLogoPoints(9000);
      // единая формула для всех размеров экрана (без разделения на «телефон/десктоп»):
      // количество фоновых частиц растёт с площадью экрана и упирается в потолок ради GPU.
      var screenArea = window.innerWidth * window.innerHeight;
      var AMBIENT_COUNT = Math.max(700, Math.min(1900, Math.round(screenArea * 0.0036)));
      var total = logoPoints.length + AMBIENT_COUNT;
      particleCount = total;

      var data = new Float32Array(total * 8);
      var i = 0;

      for (var li = 0; li < logoPoints.length; li++, i++) {
        var p = logoPoints[li];
        var seed = Math.random();
        var height = 60 + Math.random() * window.innerHeight * 0.55;
        var size = Math.random() < 0.05 ? 4.5 + Math.random() * 2.5 : 1.3 + Math.random() * 2.2;
        var off = i * 8;
        data[off] = p.x; // aBirth.x (не используется для kind=1, но пусть будет)
        data[off + 1] = height; // aBirth.y — высота подъёма
        data[off + 2] = seed; // aBirth.z — фаза
        data[off + 3] = Math.random(); // aBirth.w — тон (красный↔золотой)
        data[off + 4] = p.x; // aGoal.x
        data[off + 5] = p.y; // aGoal.y
        data[off + 6] = size; // aGoal.z — размер точки
        data[off + 7] = 1.0; // aGoal.w — kind: логотип
      }

      for (var ai = 0; ai < AMBIENT_COUNT; ai++, i++) {
        var off2 = i * 8;
        data[off2] = Math.random() * window.innerWidth;
        data[off2 + 1] = 0;
        data[off2 + 2] = Math.random();
        data[off2 + 3] = Math.random();
        data[off2 + 4] = 0;
        data[off2 + 5] = 0;
        data[off2 + 6] = 1.1 + Math.random() * 2.2;
        data[off2 + 7] = 0.0; // kind: амбиентная пыль
      }

      if (!buffer) buffer = gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
      gl.bufferData(gl.ARRAY_BUFFER, data, gl.STATIC_DRAW);
    }

    try {
      program = gl.createProgram();
      gl.attachShader(program, compileShader(gl, gl.VERTEX_SHADER, VERTEX_SRC));
      gl.attachShader(program, compileShader(gl, gl.FRAGMENT_SHADER, FRAGMENT_SRC));
      gl.linkProgram(program);
      if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
        throw new Error(gl.getProgramInfoLog(program) || "program link error");
      }
      gl.useProgram(program);

      buildParticles();

      var aBirthLoc = gl.getAttribLocation(program, "aBirth");
      var aGoalLoc = gl.getAttribLocation(program, "aGoal");
      gl.enableVertexAttribArray(aBirthLoc);
      gl.vertexAttribPointer(aBirthLoc, 4, gl.FLOAT, false, 32, 0);
      gl.enableVertexAttribArray(aGoalLoc);
      gl.vertexAttribPointer(aGoalLoc, 4, gl.FLOAT, false, 32, 16);

      locTime = gl.getUniformLocation(program, "uTime");
      locResX = gl.getUniformLocation(program, "uResX");
      locResY = gl.getUniformLocation(program, "uResY");
      locDpr = gl.getUniformLocation(program, "uDpr");

      gl.enable(gl.BLEND);
      gl.blendFunc(gl.SRC_ALPHA, gl.ONE);
      gl.clearColor(0, 0, 0, 0);
    } catch (e) {
      runSimplified();
      return;
    }

    var dpr = Math.min(window.devicePixelRatio || 1, 2);

    function resize() {
      var w = window.innerWidth;
      var h = window.innerHeight;
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
      canvas.style.width = w + "px";
      canvas.style.height = h + "px";
      gl.viewport(0, 0, canvas.width, canvas.height);
    }
    resize();
    window.addEventListener("resize", resize);

    canvas.addEventListener(
      "webglcontextlost",
      function (e) {
        e.preventDefault();
        if (!finished) {
          showTagline();
          finishIntro(false);
        }
      },
      { once: true }
    );

    var TOTAL_MS = 3500;
    var TAGLINE_AT_MS = 2650;
    var REVEAL_START_MS = 2050;
    var REVEAL_DURATION_MS = 600;
    var taglineShown = false;
    var startTime = null;
    var glActive = true;

    function loop(ts) {
      if (startTime === null) startTime = ts;
      var elapsedMs = ts - startTime;
      var t = elapsedMs / 1000;

      gl.clear(gl.COLOR_BUFFER_BIT);
      gl.uniform1f(locTime, t);
      gl.uniform1f(locResX, window.innerWidth);
      gl.uniform1f(locResY, window.innerHeight);
      gl.uniform1f(locDpr, dpr);
      gl.drawArrays(gl.POINTS, 0, particleCount);

      if (!taglineShown && elapsedMs >= TAGLINE_AT_MS) {
        taglineShown = true;
        showTagline();
      }

      if (!finished) rafId = requestAnimationFrame(loop);
    }

    rafId = requestAnimationFrame(loop);

    // Чёткая вырезка букв: не пытаемся рисовать 2D поверх активного WebGL-
    // канваса — вместо этого накладываем реальный логотип отдельным <img>,
    // синхронизированным по времени с REVEAL_*, поверх канваса.
    var reveal = document.getElementById("intro-logo-reveal");
    if (reveal && logoGeometry) {
      var revealCtx = reveal.getContext("2d");
      var revealDpr = Math.min(window.devicePixelRatio || 1, 2);
      reveal.width = Math.max(1, Math.round(logoGeometry.destW * revealDpr));
      reveal.height = Math.max(1, Math.round(logoGeometry.destH * revealDpr));
      reveal.style.left = logoGeometry.destX + "px";
      reveal.style.top = logoGeometry.destY + "px";
      reveal.style.width = logoGeometry.destW + "px";
      reveal.style.height = logoGeometry.destH + "px";
      if (revealCtx) {
        revealCtx.setTransform(revealDpr, 0, 0, revealDpr, 0, 0);
        revealCtx.drawImage(logoGeometry.canvas, 0, 0, logoGeometry.destW, logoGeometry.destH);
      }
      window.setTimeout(function () {
        if (!finished) reveal.classList.add("is-visible");
      }, REVEAL_START_MS);
    }

    window.setTimeout(function () {
      finishIntro(false);
    }, TOTAL_MS);
  }

  var started = false;

  function proceedWhenReady() {
    if (started) return;
    started = true;

    if (simplified) {
      runSimplified();
      return;
    }

    runWebgl();
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
