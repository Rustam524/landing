/**
 * Общие утилиты, используемые на всех страницах сайта.
 */
(function () {
  "use strict";

  var cfg = window.ALGORITM_CONFIG || {};

  function buildWhatsAppLink(customMessage) {
    var number = (cfg.whatsapp && cfg.whatsapp.number) || "";
    var message = customMessage || (cfg.whatsapp && cfg.whatsapp.defaultMessage) || "";
    var encoded = encodeURIComponent(message);
    if (!number) {
      // Реальный номер ещё не предоставлен владельцем — ведём на общую
      // страницу контактов вместо неработающей ссылки.
      return "/kontakty/";
    }
    return "https://wa.me/" + number + "?text=" + encoded;
  }
  window.ALGORITM_buildWhatsAppLink = buildWhatsAppLink;

  function applyWhatsAppLinks(root) {
    var scope = root || document;
    var links = scope.querySelectorAll("[data-whatsapp-link]");
    links.forEach(function (el) {
      var msg = el.getAttribute("data-whatsapp-message") || undefined;
      el.setAttribute("href", buildWhatsAppLink(msg));
      el.setAttribute("target", "_blank");
      el.setAttribute("rel", "noopener");
    });
  }
  window.ALGORITM_applyWhatsAppLinks = applyWhatsAppLinks;

  function applyFooterDynamicData(root) {
    var scope = root || document;
    var yearEl = scope.querySelector("[data-year]");
    if (yearEl) yearEl.textContent = String(new Date().getFullYear());

    var cityEl = scope.querySelector("[data-footer-city]");
    if (cityEl && cfg.contacts && cfg.contacts.city) {
      cityEl.textContent = cfg.contacts.city;
    }

    var igEl = scope.querySelector("[data-footer-instagram]");
    if (igEl && cfg.social && cfg.social.instagram) {
      igEl.href = cfg.social.instagram;
      igEl.hidden = false;
      igEl.target = "_blank";
      igEl.rel = "noopener";
    }
  }
  window.ALGORITM_applyFooterDynamicData = applyFooterDynamicData;

  function markActiveNav(root) {
    var scope = root || document;
    var path = window.location.pathname.replace(/index\.html$/, "");
    scope.querySelectorAll("[data-nav]").forEach(function (link) {
      var href = link.getAttribute("href");
      if (href === path || (href !== "/" && path.indexOf(href) === 0)) {
        link.setAttribute("aria-current", "page");
      }
    });
  }
  window.ALGORITM_markActiveNav = markActiveNav;

  function isLowEndDevice() {
    return !!(
      (navigator.deviceMemory && navigator.deviceMemory <= 2) ||
      (navigator.hardwareConcurrency && navigator.hardwareConcurrency <= 2) ||
      (navigator.connection && navigator.connection.saveData) ||
      window.matchMedia("(max-width: 480px)").matches
    );
  }
  window.ALGORITM_isLowEndDevice = isLowEndDevice;

  var UTM_KEYS = ["utm_source", "utm_medium", "utm_campaign", "utm_term", "utm_content"];
  var UTM_STORAGE_KEY = "algoritm_utm";

  function captureUtmParams() {
    try {
      var params = new URLSearchParams(window.location.search);
      var found = {};
      var hasAny = false;
      UTM_KEYS.forEach(function (key) {
        if (params.has(key)) {
          found[key] = params.get(key);
          hasAny = true;
        }
      });
      if (hasAny) {
        sessionStorage.setItem(UTM_STORAGE_KEY, JSON.stringify(found));
      }
    } catch (e) {
      /* sessionStorage/URLSearchParams недоступны — UTM просто не сохранятся */
    }
  }
  window.ALGORITM_captureUtmParams = captureUtmParams;

  function getStoredUtmParams() {
    try {
      var raw = sessionStorage.getItem(UTM_STORAGE_KEY);
      return raw ? JSON.parse(raw) : {};
    } catch (e) {
      return {};
    }
  }
  window.ALGORITM_getStoredUtmParams = getStoredUtmParams;

  captureUtmParams();
})();
