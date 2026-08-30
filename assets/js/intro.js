/**
 * Вступительная анимация "цифрового импульса" ALGORITM.
 * Показывается один раз за сессию (sessionStorage), учитывает
 * prefers-reduced-motion и слабые устройства, не блокирует загрузку
 * основного контента (страница грузится параллельно под оверлеем).
 */
(function () {
  "use strict";

  var STORAGE_KEY = "algoritm_intro_seen";
  var screenEl = document.getElementById("intro-screen");
  if (!screenEl) return;

  var alreadySeen = false;
  try {
    alreadySeen = sessionStorage.getItem(STORAGE_KEY) === "1";
  } catch (e) {
    // sessionStorage может быть недоступен (приватный режим) — показываем анимацию.
  }

  if (alreadySeen) {
    screenEl.hidden = true;
    return;
  }

  var reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var isLowEndDevice =
    (navigator.deviceMemory && navigator.deviceMemory <= 2) ||
    (navigator.hardwareConcurrency && navigator.hardwareConcurrency <= 2) ||
    (navigator.connection && navigator.connection.saveData);
  var simplified = reducedMotion || isLowEndDevice;

  var canvas = document.getElementById("intro-canvas");
  var ctx = canvas && !simplified ? canvas.getContext("2d") : null;
  var skipBtn = document.getElementById("intro-skip");
  var soundBtn = document.getElementById("intro-sound-toggle");
  var soundEnabled = false;
  var finished = false;
  var rafId = null;

  document.body.style.overflow = "hidden";

  function track(eventName, params) {
    if (window.ALGORITM_trackEvent) window.ALGORITM_trackEvent(eventName, params || {});
  }

  function resizeCanvas() {
    if (!canvas) return;
    var rect = canvas.parentElement.getBoundingClientRect();
    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    canvas.style.width = rect.width + "px";
    canvas.style.height = rect.height + "px";
    if (ctx) ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  function drawPulse(t, width, height) {
    if (!ctx) return;
    ctx.clearRect(0, 0, width, height);
    var cx = width / 2;
    var cy = height / 2;

    // Импульс: расширяющаяся горизонтальная световая линия
    var pulseProgress = Math.min(t / 700, 1);
    var lineWidth = width * 0.92 * easeOutCubic(pulseProgress);
    var alpha = t < 700 ? 1 : Math.max(0, 1 - (t - 700) / 500);

    var grad = ctx.createLinearGradient(cx - lineWidth / 2, 0, cx + lineWidth / 2, 0);
    grad.addColorStop(0, "rgba(220,38,38,0)");
    grad.addColorStop(0.5, "rgba(220,38,38," + alpha + ")");
    grad.addColorStop(1, "rgba(220,38,38,0)");

    ctx.fillStyle = grad;
    ctx.fillRect(cx - lineWidth / 2, cy - 1.5, lineWidth, 3);

    // Небольшой всплеск частиц в момент кульминации импульса
    if (t >= 550 && t <= 1300) {
      var burstT = (t - 550) / 750;
      var count = 26;
      for (var i = 0; i < count; i++) {
        var angle = (Math.PI * 2 * i) / count;
        var dist = easeOutCubic(burstT) * (width * 0.34);
        var px = cx + Math.cos(angle) * dist;
        var py = cy + Math.sin(angle) * dist * 0.6;
        var particleAlpha = Math.max(0, 1 - burstT) * 0.9;
        ctx.fillStyle = "rgba(220,38,38," + particleAlpha + ")";
        ctx.beginPath();
        ctx.arc(px, py, 1.6, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }

  function easeOutCubic(x) {
    return 1 - Math.pow(1 - x, 3);
  }

  var startTime = null;
  function loop(ts) {
    if (startTime === null) startTime = ts;
    var elapsed = ts - startTime;
    var rect = canvas.parentElement.getBoundingClientRect();
    drawPulse(elapsed, rect.width, rect.height);
    if (elapsed < 1400 && !finished) {
      rafId = requestAnimationFrame(loop);
    }
  }

  function finishIntro(skipped) {
    if (finished) return;
    finished = true;
    if (rafId) cancelAnimationFrame(rafId);
    try {
      sessionStorage.setItem(STORAGE_KEY, "1");
    } catch (e) {}
    document.body.style.overflow = "";
    screenEl.classList.add("is-leaving");
    if (skipped) track("intro_skip");
    window.setTimeout(function () {
      screenEl.hidden = true;
    }, 500);
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
    // Упрощённый вариант: без canvas-частиц, короткое плавное появление.
    screenEl.classList.add("is-assembled");
    window.setTimeout(function () {
      screenEl.classList.add("is-tagline");
    }, 250);
    window.setTimeout(function () {
      finishIntro(false);
    }, 1400);
    return;
  }

  resizeCanvas();
  window.addEventListener("resize", resizeCanvas);
  rafId = requestAnimationFrame(loop);

  window.setTimeout(function () {
    screenEl.classList.add("is-assembled");
  }, 900);
  window.setTimeout(function () {
    screenEl.classList.add("is-tagline");
  }, 1500);
  window.setTimeout(function () {
    finishIntro(false);
  }, 2600);
})();
