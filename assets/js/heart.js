/**
 * "Цифровое сердце" ALGORITM — абстрактный технологический объект
 * из красных частиц и тонких линий (НЕ анатомическое сердце).
 * По периметру рисуется сетка узлов вдоль параметрической кривой сердца,
 * соединённых тонкими линиями, с мягкой пульсацией свечения.
 * Поверх — по очереди подсвечиваются активные ссылки-направления.
 */
(function () {
  "use strict";

  var wrap = document.querySelector(".hero__heart-wrap");
  var canvas = document.getElementById("heart-canvas");
  var directionEl = document.getElementById("heart-direction");
  if (!wrap || !canvas || !directionEl) return;

  var ctx = canvas.getContext("2d");
  var reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var simplified = reducedMotion || window.ALGORITM_isLowEndDevice();

  var directions = (window.ALGORITM_DATA && window.ALGORITM_DATA.directions) || [];
  var points = [];
  var dpr = Math.min(window.devicePixelRatio || 1, 2);
  var size = 0;

  function buildPoints(count) {
    var pts = [];
    for (var i = 0; i < count; i++) {
      var t = (i / count) * Math.PI * 2;
      // Классическая параметрическая кривая сердца — используется только как
      // силуэт для размещения узлов-частиц, а не как реалистичное изображение.
      var x = 16 * Math.pow(Math.sin(t), 3);
      var y = -(13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t));
      pts.push({ x: x, y: y });
    }
    return pts;
  }
  points = buildPoints(48);

  function resize() {
    var rect = wrap.getBoundingClientRect();
    size = Math.min(rect.width, rect.height);
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    canvas.style.width = rect.width + "px";
    canvas.style.height = rect.height + "px";
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  function project(pt, scale) {
    var cx = canvas.width / dpr / 2;
    var cy = canvas.height / dpr / 2;
    var k = (size / 34) * scale;
    return { x: cx + pt.x * k, y: cy + pt.y * k };
  }

  function drawHeart(scale, glow) {
    var w = canvas.width / dpr;
    var h = canvas.height / dpr;
    ctx.clearRect(0, 0, w, h);

    var projected = points.map(function (p) {
      return project(p, scale);
    });

    // Тонкие связывающие линии (эффект схемы/цифровой сети)
    ctx.lineWidth = 1;
    for (var i = 0; i < projected.length; i++) {
      var a = projected[i];
      var b = projected[(i + 1) % projected.length];
      ctx.strokeStyle = "rgba(185, 28, 28, " + (0.35 + glow * 0.25) + ")";
      ctx.beginPath();
      ctx.moveTo(a.x, a.y);
      ctx.lineTo(b.x, b.y);
      ctx.stroke();

      if (i % 6 === 0) {
        var c = projected[(i + 11) % projected.length];
        ctx.strokeStyle = "rgba(220, 38, 38, " + (0.12 + glow * 0.12) + ")";
        ctx.beginPath();
        ctx.moveTo(a.x, a.y);
        ctx.lineTo(c.x, c.y);
        ctx.stroke();
      }
    }

    // Узлы-частицы с лёгким свечением
    projected.forEach(function (p, i) {
      var r = i % 4 === 0 ? 2.6 : 1.6;
      ctx.beginPath();
      ctx.fillStyle = "rgba(220, 38, 38, " + (0.75 + glow * 0.25) + ")";
      ctx.shadowColor = "rgba(220, 38, 38, 0.9)";
      ctx.shadowBlur = 6 + glow * 10;
      ctx.arc(p.x, p.y, r, 0, Math.PI * 2);
      ctx.fill();
    });
    ctx.shadowBlur = 0;
  }

  var rafId = null;
  function animate(ts) {
    var period = 2400;
    var phase = (ts % period) / period; // 0..1
    var pulse = Math.sin(phase * Math.PI * 2);
    var scale = 1 + pulse * 0.035;
    var glow = (pulse + 1) / 2;
    drawHeart(scale, glow);
    rafId = requestAnimationFrame(animate);
  }

  resize();
  window.addEventListener("resize", resize);

  if (simplified) {
    drawHeart(1, 0.5);
    canvas.classList.add("heart-canvas--simple-pulse");
  } else {
    rafId = requestAnimationFrame(animate);
  }

  // ---- Ротация направлений вокруг/рядом с сердцем ----
  if (!directions.length) return;

  var idx = -1;
  var paused = false;
  var pendingTimer = null;

  function showNext() {
    idx = (idx + 1) % directions.length;
    var dir = directions[idx];
    directionEl.innerHTML = "";
    var link = document.createElement("a");
    link.href = dir.href;
    link.textContent = dir.title;
    link.setAttribute("data-analytics-event", "heart_direction_click");
    link.setAttribute("data-analytics-label", dir.id);
    directionEl.appendChild(link);
    directionEl.classList.add("is-visible");

    scheduleHide();
  }

  function scheduleHide() {
    clearTimeout(pendingTimer);
    pendingTimer = window.setTimeout(function () {
      if (paused) {
        scheduleHide();
        return;
      }
      directionEl.classList.remove("is-visible");
      pendingTimer = window.setTimeout(function () {
        if (paused) {
          scheduleHide();
        } else {
          showNext();
        }
      }, 650);
    }, 2000);
  }

  wrap.addEventListener("mouseenter", function () {
    paused = true;
  });
  wrap.addEventListener("mouseleave", function () {
    paused = false;
  });
  directionEl.addEventListener("focusin", function () {
    paused = true;
  });
  directionEl.addEventListener("focusout", function () {
    paused = false;
  });

  showNext();
})();
