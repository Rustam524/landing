/**
 * Подготовка интеграции GA4 / GTM.
 * Реальные идентификаторы владелец подставит в assets/js/config.js
 * (в проде — предпочтительно через переменные окружения сборки).
 * Пока используются понятные заглушки (G-XXXXXXXXXX / GTM-XXXXXXX) —
 * поэтому счётчики НЕ инициализируются, а события лишь копятся в dataLayer,
 * чтобы их можно было проверить локально и подключить аналитику без
 * изменения остального кода.
 */
(function () {
  "use strict";

  window.dataLayer = window.dataLayer || [];

  function isPlaceholderId(id, prefix) {
    return !id || id.indexOf(prefix + "-XXXX") === 0 || id === prefix + "-XXXXXXX" || id === prefix + "-XXXXXXXXXX";
  }

  function trackEvent(name, params) {
    var payload = Object.assign({ event: name }, params || {});
    window.dataLayer.push(payload);
  }
  window.ALGORITM_trackEvent = trackEvent;

  function loadScript(src) {
    var s = document.createElement("script");
    s.async = true;
    s.src = src;
    document.head.appendChild(s);
  }

  function initGtm(containerId) {
    window.dataLayer.push({ "gtm.start": new Date().getTime(), event: "gtm.js" });
    loadScript("https://www.googletagmanager.com/gtm.js?id=" + containerId);
  }

  function initGa4(measurementId) {
    loadScript("https://www.googletagmanager.com/gtag/js?id=" + measurementId);
    window.gtag = window.gtag || function () {
      window.dataLayer.push(arguments);
    };
    window.gtag("js", new Date());
    window.gtag("config", measurementId);
  }

  document.addEventListener("DOMContentLoaded", function () {
    var cfg = (window.ALGORITM_CONFIG && window.ALGORITM_CONFIG.analytics) || {};

    if (!isPlaceholderId(cfg.gtmContainerId, "GTM")) {
      initGtm(cfg.gtmContainerId);
    }
    if (!isPlaceholderId(cfg.ga4MeasurementId, "G")) {
      initGa4(cfg.ga4MeasurementId);
    }

    // Универсальный делегированный обработчик: любой элемент с
    // data-analytics-event автоматически отправляет событие по клику.
    document.addEventListener("click", function (e) {
      var target = e.target.closest("[data-analytics-event]");
      if (!target) return;
      trackEvent(target.getAttribute("data-analytics-event"), {
        label: target.getAttribute("data-analytics-label") || undefined,
        source: target.getAttribute("data-analytics-source") || undefined,
      });
    });
  });
})();
