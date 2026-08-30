/**
 * Визуал первого экрана: "живая сеть" — спокойно дрейфующие частицы
 * данных, соединённые тонкими линиями (constellation/particle-network),
 * с мягкой реакцией на курсor. Техника хорошо зарекомендовавшая себя в
 * премиальных tech/agency hero-секциях (canvas dot-grid / particle
 * network с приглушённой, ненавязчивой анимацией — см. тренды 2025–2026:
 * restraint, cursor-reactive glow, cinematic dark UI).
 *
 * Поверх — то же название ALGORITM и ротация активных ссылок-направлений,
 * что и раньше (логика не менялась, только визуальный носитель).
 */
(function () {
  "use strict";

  var wrap = document.querySelector(".hero__visual-wrap");
  var canvas = document.getElementById("hero-network-canvas");
  var directionEl = document.getElementById("hero-visual-direction");
  if (!wrap || !canvas || !directionEl) return;

  var ctx = canvas.getContext("2d");
  var reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var simplified = reducedMotion || window.ALGORITM_isLowEndDevice();
  var canHover = window.matchMedia("(hover: hover) and (pointer: fine)").matches;

  var dpr = Math.min(window.devicePixelRatio || 1, 2);
  var w = 0, h = 0;
  var particles = [];
  var mouse = { x: -9999, y: -9999, active: false };

  var LINK_DIST = 120;
  var HUB_CHANCE = 0.12; // доля "узлов-акцентов" (крупнее, золото/кремовый)

  function resize() {
    var rect = wrap.getBoundingClientRect();
    w = rect.width;
    h = rect.height;
    canvas.width = w * dpr;
    canvas.height = h * dpr;
    canvas.style.width = w + "px";
    canvas.style.height = h + "px";
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  function buildParticles() {
    var area = w * h;
    var density = simplified ? 1 / 5200 : 1 / 3400;
    var count = Math.max(14, Math.min(70, Math.round(area * density)));
    particles = [];
    for (var i = 0; i < count; i++) {
      var isHub = Math.random() < HUB_CHANCE;
      particles.push({
        x: Math.random() * w,
        y: Math.random() * h,
        vx: (Math.random() - 0.5) * 0.18,
        vy: (Math.random() - 0.5) * 0.18,
        r: isHub ? 2.4 + Math.random() * 1.2 : 1.1 + Math.random() * 0.9,
        hub: isHub,
        phase: Math.random() * Math.PI * 2,
      });
    }
  }

  function stepParticle(p) {
    p.x += p.vx;
    p.y += p.vy;
    if (p.x < 0 || p.x > w) p.vx *= -1;
    if (p.y < 0 || p.y > h) p.vy *= -1;
    p.x = Math.max(0, Math.min(w, p.x));
    p.y = Math.max(0, Math.min(h, p.y));

    if (mouse.active) {
      var dx = p.x - mouse.x;
      var dy = p.y - mouse.y;
      var dist2 = dx * dx + dy * dy;
      var radius = 90;
      if (dist2 < radius * radius && dist2 > 0.01) {
        var dist = Math.sqrt(dist2);
        var force = (1 - dist / radius) * 0.6;
        p.x += (dx / dist) * force;
        p.y += (dy / dist) * force;
      }
    }
    p.phase += 0.02;
  }

  function drawFrame() {
    ctx.clearRect(0, 0, w, h);

    // Линии между близкими частицами
    for (var i = 0; i < particles.length; i++) {
      for (var j = i + 1; j < particles.length; j++) {
        var a = particles[i];
        var b = particles[j];
        var dx = a.x - b.x;
        var dy = a.y - b.y;
        var dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < LINK_DIST) {
          var alpha = (1 - dist / LINK_DIST) * 0.35;
          ctx.strokeStyle = "rgba(220, 38, 38, " + alpha.toFixed(3) + ")";
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(a.x, a.y);
          ctx.lineTo(b.x, b.y);
          ctx.stroke();
        }
      }
    }

    // Узлы
    for (var k = 0; k < particles.length; k++) {
      var p = particles[k];
      var twinkle = 0.7 + 0.3 * Math.sin(p.phase);
      if (p.hub) {
        ctx.fillStyle = "rgba(212, 175, 55, " + (0.65 * twinkle).toFixed(3) + ")";
        ctx.shadowColor = "rgba(212, 175, 55, 0.6)";
        ctx.shadowBlur = 8;
      } else {
        ctx.fillStyle = "rgba(244, 240, 235, " + (0.55 * twinkle).toFixed(3) + ")";
        ctx.shadowColor = "rgba(220, 38, 38, 0.5)";
        ctx.shadowBlur = 4;
      }
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.shadowBlur = 0;
  }

  var rafId = null;
  function loop() {
    for (var i = 0; i < particles.length; i++) stepParticle(particles[i]);
    drawFrame();
    rafId = requestAnimationFrame(loop);
  }

  resize();
  buildParticles();

  if (simplified) {
    drawFrame();
    canvas.classList.add("hero-network-canvas--simple-pulse");
  } else {
    rafId = requestAnimationFrame(loop);

    if (canHover) {
      wrap.addEventListener("mousemove", function (e) {
        var rect = canvas.getBoundingClientRect();
        mouse.x = e.clientX - rect.left;
        mouse.y = e.clientY - rect.top;
        mouse.active = true;
      });
      wrap.addEventListener("mouseleave", function () {
        mouse.active = false;
      });
    }
  }

  window.addEventListener("resize", function () {
    resize();
    buildParticles();
    if (simplified) drawFrame();
  });

  // ---- Ротация направлений вокруг/рядом с визуалом ----
  var directions = (window.ALGORITM_DATA && window.ALGORITM_DATA.directions) || [];
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
    link.setAttribute("data-analytics-event", "hero_direction_click");
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
