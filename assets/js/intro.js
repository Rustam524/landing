/**
 * Вступительная анимация ALGORITM — прямой перенос ролика, присланного
 * заказчиком (три вида частиц: фоновая пыль, поднимающаяся волна и частицы,
 * собирающиеся в логотип; в конце — растворение пыли и чёткая вырезка
 * названия). Формулы шейдера и распределение частиц оставлены как в
 * исходнике, без переосмысления.
 *
 * Ключевое: вся сцена рисуется в фиксированных "виртуальных" единицах
 * 1200×675 (соотношение 16:9 — как в исходном ролике), а сама сцена
 * вписана в экран как видео "letterbox" (см. .intro-scene в styles.css).
 * Поэтому анимация выглядит ОДИНАКОВО на телефоне и на десктопе — она не
 * пересчитывается под пропорции конкретного экрана, а просто масштабируется
 * целиком, как один и тот же ролик на разных мониторах.
 *
 * Сэмплирование пикселей логотипа в облако целевых точек (по яркости,
 * канвас 2D) — техника, адаптированная из открытого проекта
 * github.com/HelloAndersJ/particle-logo под наш логотип.
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
  // Заставка — короткая одноразовая анимация (~4.5с), а не постоянный фон,
  // поэтому для неё узкий экран телефона сам по себе не повод упрощать —
  // упрощаем только на реально слабом железе (мало памяти/ядер, экономия
  // трафика), а не по одной лишь ширине экрана.
  var isWeakHardware = !!(
    (navigator.deviceMemory && navigator.deviceMemory <= 2) ||
    (navigator.hardwareConcurrency && navigator.hardwareConcurrency <= 2) ||
    (navigator.connection && navigator.connection.saveData)
  );
  var simplified = reducedMotion || isWeakHardware;

  var sceneEl = overlay.querySelector(".intro-scene");
  var canvas = document.getElementById("intro-canvas");
  var reveal = document.getElementById("intro-logo-reveal");
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

  if (!canvas || !logoSource || !sceneEl) {
    // На случай отсутствия canvas/логотипа — не блокируем сайт.
    showTagline();
    window.setTimeout(function () {
      finishIntro(false);
    }, 900);
    return;
  }

  // -----------------------------------------------------------------------
  // Виртуальное пространство сцены — фиксированное 1200×675 (16:9), как в
  // исходном ролике. Все координаты частиц и логотипа считаются в этих
  // единицах, а не в пикселях экрана; на экран сцена лишь масштабируется
  // целиком (см. .intro-scene в CSS) — отсюда и одинаковый вид на любом
  // устройстве.
  // -----------------------------------------------------------------------
  var VIRTUAL_W = 1200;
  var VIRTUAL_H = 675;

  function smooth(x) {
    x = Math.max(0, Math.min(1, x));
    return x * x * (3 - 2 * x);
  }

  // -----------------------------------------------------------------------
  // 1. Собираем "brand"-канвас 1200×675 — ровно как в присланном коде:
  //    рисуем картинку (значок + слово ALGORITM, тот самый файл, что был
  //    зашит в присланном коде base64-строкой) на позиции (132,210) шириной
  //    936, значок оставляем как есть, а буквы перекрашиваем в светлый цвет
  //    (source-atop), плюс подпись под названием — теми же координатами и
  //    константами, что и в исходнике (там пространство тоже было 1200×675,
  //    поэтому переводить ничего не нужно). Затем сэмплируем яркие пиксели
  //    этого канваса в облако целевых точек для сборки пыли.
  // -----------------------------------------------------------------------
  var LUM_THRESHOLD = 175;
  var LOGO_DRAW_X = 132;
  var LOGO_DRAW_Y = 210;
  var LOGO_DRAW_W = 936;
  var LOGO_TEXT_START_PX = 288; // граница "значок / буквы" в пикселях исходного файла — из присланного кода
  var LOGO_TAGLINE_Y = 419;
  var LOGO_TAGLINE_TEXT = "Маркетинговое агентство";
  var logoGeometry = null; // { canvas } — весь brand-канвас, рисуется целиком в виртуальных координатах сцены

  function buildBrand() {
    var src = logoSource.naturalWidth ? logoSource : null;
    if (!src) return null;

    var c = document.createElement("canvas");
    c.width = VIRTUAL_W;
    c.height = VIRTUAL_H;
    var b = c.getContext("2d");

    var w = LOGO_DRAW_W;
    var h = (w * src.naturalHeight) / src.naturalWidth;
    b.drawImage(src, LOGO_DRAW_X, LOGO_DRAW_Y, w, h);

    // Сохраняем значок как есть, а буквам названия даём светлый (кремовый)
    // оттенок — чтобы читались на тёмной сцене, как в присланном коде.
    b.save();
    b.globalCompositeOperation = "source-atop";
    b.fillStyle = "#f5e9d8";
    var textStart = LOGO_DRAW_X + (LOGO_TEXT_START_PX / src.naturalWidth) * w;
    b.fillRect(textStart, LOGO_DRAW_Y, LOGO_DRAW_X + w - textStart, h);
    b.restore();

    b.fillStyle = "#f5e9d8";
    b.font = "24px Arial, sans-serif";
    b.textAlign = "center";
    b.fillText(LOGO_TAGLINE_TEXT, (textStart + LOGO_DRAW_X + w) / 2, LOGO_TAGLINE_Y);

    return c;
  }

  function buildLogoPoints() {
    var brand = buildBrand();
    if (!brand) {
      logoGeometry = null;
      return [];
    }
    logoGeometry = { canvas: brand };

    var bc = brand.getContext("2d");
    var pixels;
    try {
      pixels = bc.getImageData(0, 0, VIRTUAL_W, VIRTUAL_H).data;
    } catch (e) {
      return []; // на всякий случай, если браузер не даст прочитать пиксели
    }

    var points = [];
    for (var y = 0; y < VIRTUAL_H; y++) {
      for (var x = 0; x < VIRTUAL_W; x++) {
        var idx = (y * VIRTUAL_W + x) * 4;
        if (pixels[idx + 3] < 40) continue;
        var lum = 0.299 * pixels[idx] + 0.587 * pixels[idx + 1] + 0.114 * pixels[idx + 2];
        if (lum > LUM_THRESHOLD) points.push({ x: x, y: y });
      }
    }
    return points;
  }

  function drawCrispLogo(ctx2d, alpha) {
    if (!logoGeometry) return;
    ctx2d.save();
    ctx2d.globalAlpha = alpha;
    ctx2d.drawImage(logoGeometry.canvas, 0, 0, VIRTUAL_W, VIRTUAL_H);
    ctx2d.restore();
  }

  // -----------------------------------------------------------------------
  // 2. Упрощённый путь (reduced motion / слабое железо / нет WebGL):
  //    логотип сразу собран, без покадровой анимации. Рисуется в той же
  //    вписанной 16:9-сцене, чтобы размер/положение логотипа совпадали с
  //    анимированной версией.
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
    var rect = sceneEl.getBoundingClientRect();
    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    var w = Math.max(1, Math.round(rect.width * dpr));
    var h = Math.max(1, Math.round(rect.height * dpr));
    canvas.width = w;
    canvas.height = h;
    ctx2d.setTransform(w / VIRTUAL_W, 0, 0, h / VIRTUAL_H, 0, 0);
    buildLogoPoints();
    ctx2d.clearRect(0, 0, VIRTUAL_W, VIRTUAL_H);
    drawCrispLogo(ctx2d, 1);
    showTagline();
    window.setTimeout(function () {
      finishIntro(false);
    }, 1400);
  }

  // -----------------------------------------------------------------------
  // 3. Основной путь — прямой перенос присланной анимации: фоновая пыль
  //    (kind 0), большая поднимающаяся и опадающая волна (kind 1) и частицы,
  //    собирающиеся в силуэт логотипа и затем растворяющиеся (kind 2).
  //    Формулы и константы — как в исходном шейдере, без изменений.
  // -----------------------------------------------------------------------
  var VERTEX_SRC =
    "precision highp float;\n" +
    "attribute vec4 aWave;\n" + // x: birthX, y: высота волны, z: фаза(s), w: тон(r) — виртуальные единицы 1200×675
    "attribute vec4 aGoal;\n" + // x/y: цель сборки, z: размер точки, w: вид частицы (0=пыль,1=волна,2=логотип)
    "uniform float uTime;\n" +
    "uniform float uScale;\n" + // пикселей канваса на виртуальную единицу — влияет только на размер точки
    "varying float vAlpha;\n" +
    "varying float vTone;\n" +
    "void main(){\n" +
    "  float t = uTime;\n" +
    "  float x = aWave.x, height = aWave.y, s = aWave.z, r = aWave.w;\n" +
    "  float kind = aGoal.w;\n" +
    "  float birth = x / 1200.0 * 0.90 - 0.08;\n" +
    "  float age = max(0.0, t - birth);\n" +
    "  float grow = smoothstep(0.10, 0.85, t);\n" +
    "  float rise = sin(clamp(age / 2.6, 0.0, 1.0) * 2.28);\n" +
    "  float phase = s * 6.28318;\n" +
    "  float amp = (0.47 + 0.53 * sin(x * 0.010 + 1.1) * sin(x * 0.010 + 1.1));\n" +
    "  float y = 520.0 - rise * height * amp * grow;\n" +
    "  x += sin(age * 1.9 + phase) * age * 13.0 * grow;\n" +
    "  y += sin(age * 3.0 + x * 0.018 + phase) * 18.0 * grow;\n" +
    "  x += sin(phase * 2.7) * age * 7.0;\n" +
    "  if (kind < 0.5) {\n" + // kind 0 — фоновая пыль у "пола" сцены, почти неподвижная
    "    x = aWave.x + sin(t * 1.8 + phase) * 7.0;\n" +
    "    y = 520.0 - (height / 540.0) * 15.0 * (0.3 + grow) + sin(phase + t * 4.0) * 2.2;\n" +
    "  }\n" +
    "  float assemble = smoothstep(2.0 + s * 0.45, 4.4 + s * 0.4, t);\n" +
    "  if (kind > 1.5) {\n" + // kind 2 — собирается в силуэт логотипа
    "    float curve = sin(assemble * 3.14159);\n" +
    "    x = mix(x, aGoal.x, assemble) + sin(phase) * curve * 90.0;\n" +
    "    y = mix(y, aGoal.y, assemble) - curve * (30.0 + r * 90.0);\n" +
    "  } else if (kind > 0.5) {\n" + // kind 1 — большая волна, после сборки логотипа опадает
    "    float fall = max(0.0, t - 4.2);\n" +
    "    x += sin(phase) * fall * 36.0;\n" +
    "    y += fall * fall * (18.0 + 35.0 * r);\n" +
    "  }\n" +
    "  float dissolve = smoothstep(4.6 + s * 0.4, 6.8 + s * 0.4, t);\n" +
    "  if (kind > 1.5) {\n" +
    "    x += sin(phase) * dissolve * 75.0;\n" +
    "    y += dissolve * dissolve * (180.0 + 110.0 * r);\n" +
    "  }\n" +
    "  float fade = kind > 1.5 ? 1.0 - smoothstep(4.5 + s * 0.4, 6.9 + s * 0.3, t) : 1.0 - smoothstep(4.4 + s, 7.4, t);\n" +
    "  float alpha = smoothstep(0.0, 0.20, t - birth) * fade;\n" +
    "  if (kind < 0.5) alpha *= 1.0 - smoothstep(4.7, 7.0, t);\n" +
    "  alpha *= 0.48 + 0.52 * pow(abs(sin(t * (2.0 + 5.0 * r) + phase)), 5.0);\n" +
    "  vAlpha = clamp(alpha, 0.0, 1.0);\n" +
    "  vTone = r;\n" +
    "  gl_Position = vec4(x / 600.0 - 1.0, 1.0 - y / 337.5, 0.0, 1.0);\n" +
    "  gl_PointSize = max(1.1, aGoal.z * uScale);\n" +
    "}\n";

  var FRAGMENT_SRC =
    "precision mediump float;\n" +
    "varying float vAlpha;\n" +
    "varying float vTone;\n" +
    "void main(){\n" +
    "  vec2 uv = gl_PointCoord - 0.5;\n" +
    "  float d = length(uv) * 2.0;\n" +
    "  if (d > 1.0 || vAlpha < 0.005) discard;\n" +
    "  float core = exp(-d*d*13.0);\n" +
    "  float halo = exp(-d*d*3.4) * 0.21;\n" +
    "  vec3 warm = mix(vec3(0.72,0.39,0.19), vec3(0.97,0.84,0.63), vTone);\n" + // фирменный красно-золотой переход
    "  vec3 color = mix(warm, vec3(1.0,0.98,0.91), core*0.76);\n" +
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

    var program, buffer, locTime, locScale, particleCount;

    // Ровно то же распределение частиц, что и в присланном ролике: 9000
    // фоновой пыли, 34000 в большой волне, 17000 собираются в логотип
    // (с повторным использованием точек логотипа — целей больше, чем точек).
    var AMBIENT_COUNT = 9000;
    var WAVE_COUNT = 34000;
    var LOGO_COUNT = 17000;

    function randomSize() {
      return Math.random() < 0.025 ? 9 + Math.random() * 5 : 1.5 + Math.random() * 3.8;
    }

    function buildParticles() {
      var logoPoints = buildLogoPoints();
      var total = AMBIENT_COUNT + WAVE_COUNT + LOGO_COUNT;
      particleCount = total;

      var data = new Float32Array(total * 8);
      var i = 0;

      for (var a = 0; a < AMBIENT_COUNT; a++, i++) {
        var offA = i * 8;
        data[offA] = Math.random() * 1240 - 20;
        data[offA + 1] = Math.random() * 540;
        data[offA + 2] = Math.random();
        data[offA + 3] = Math.random();
        data[offA + 4] = 0;
        data[offA + 5] = 0;
        data[offA + 6] = randomSize();
        data[offA + 7] = 0.0; // kind: фоновая пыль
      }

      for (var w = 0; w < WAVE_COUNT; w++, i++) {
        var offW = i * 8;
        data[offW] = Math.random() * 1240 - 20;
        data[offW + 1] = 540 * Math.pow(Math.random(), 1.55);
        data[offW + 2] = Math.random();
        data[offW + 3] = Math.random();
        data[offW + 4] = 0;
        data[offW + 5] = 0;
        data[offW + 6] = randomSize();
        data[offW + 7] = 1.0; // kind: большая волна
      }

      var hasTargets = logoPoints.length > 0;
      for (var l = 0; l < LOGO_COUNT; l++, i++) {
        var offL = i * 8;
        var goal = hasTargets ? logoPoints[Math.floor(Math.random() * logoPoints.length)] : { x: 600, y: 337.5 };
        data[offL] = Math.random() * 1240 - 20;
        data[offL + 1] = 540 * Math.pow(Math.random(), 1.55);
        data[offL + 2] = Math.random();
        data[offL + 3] = Math.random();
        data[offL + 4] = goal.x;
        data[offL + 5] = goal.y;
        data[offL + 6] = randomSize();
        data[offL + 7] = 2.0; // kind: собирается в логотип
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

      var aWaveLoc = gl.getAttribLocation(program, "aWave");
      var aGoalLoc = gl.getAttribLocation(program, "aGoal");
      gl.enableVertexAttribArray(aWaveLoc);
      gl.vertexAttribPointer(aWaveLoc, 4, gl.FLOAT, false, 32, 0);
      gl.enableVertexAttribArray(aGoalLoc);
      gl.vertexAttribPointer(aGoalLoc, 4, gl.FLOAT, false, 32, 16);

      locTime = gl.getUniformLocation(program, "uTime");
      locScale = gl.getUniformLocation(program, "uScale");

      gl.enable(gl.BLEND);
      gl.blendFunc(gl.SRC_ALPHA, gl.ONE);
      gl.clearColor(0, 0, 0, 0);
    } catch (e) {
      runSimplified();
      return;
    }

    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    var revealCtx = reveal ? reveal.getContext("2d") : null;

    function resize() {
      var rect = sceneEl.getBoundingClientRect();
      var w = Math.max(1, Math.round(rect.width * dpr));
      var h = Math.max(1, Math.round(rect.height * dpr));
      canvas.width = w;
      canvas.height = h;
      gl.viewport(0, 0, w, h);

      if (reveal) {
        reveal.width = w;
        reveal.height = h;
        if (revealCtx && logoGeometry) {
          revealCtx.setTransform(w / VIRTUAL_W, 0, 0, h / VIRTUAL_H, 0, 0);
          revealCtx.clearRect(0, 0, VIRTUAL_W, VIRTUAL_H);
          revealCtx.drawImage(logoGeometry.canvas, 0, 0, VIRTUAL_W, VIRTUAL_H);
        }
      }
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

    // Виртуальное время сцены — как в исходнике: 8 условных секунд,
    // проигрываемых с ускорением ×1.8 (итого ~4.4с реального времени).
    var DURATION = 8;
    var PLAYBACK_RATE = 1.8;
    var time = 0;
    var last = 0;
    var taglineShown = false;

    function loop(now) {
      if (!last) last = now;
      var dt = Math.min((now - last) / 1000, 0.1) * PLAYBACK_RATE;
      time += dt;
      last = now;

      gl.clear(gl.COLOR_BUFFER_BIT);
      gl.uniform1f(locTime, time);
      gl.uniform1f(locScale, canvas.width / VIRTUAL_W);
      gl.drawArrays(gl.POINTS, 0, particleCount);

      if (reveal) {
        reveal.style.opacity = String(smooth((time - 4.1) / 1.4));
      }

      if (!taglineShown && time >= 5.5) {
        taglineShown = true;
        showTagline();
      }

      if (finished) return;
      if (time < DURATION) {
        rafId = requestAnimationFrame(loop);
      } else {
        finishIntro(false);
      }
    }

    rafId = requestAnimationFrame(loop);
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
  }
})();
