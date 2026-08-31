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

  // Иконки услуг/направлений — общие для карточек услуг и hero-виджета,
  // чтобы не дублировать разметку SVG в нескольких файлах.
  window.ALGORITM_ICONS = {
    smm: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><circle cx="6" cy="12" r="2.4"/><circle cx="17" cy="6" r="2.4"/><circle cx="17" cy="18" r="2.4"/><path d="M8.1 10.8 14.9 7.2M8.1 13.2l6.8 3.6"/></svg>',
    content: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><rect x="3" y="6" width="14" height="12" rx="2"/><path d="M17 10l4-2.4v8.8L17 14"/></svg>',
    target: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><circle cx="12" cy="12" r="8"/><circle cx="12" cy="12" r="4"/><circle cx="12" cy="12" r="0.6" fill="currentColor"/></svg>',
    ai: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><rect x="5" y="7" width="14" height="11" rx="3"/><path d="M12 3v4M8.5 21h7"/><circle cx="9" cy="12.5" r="1.1" fill="currentColor" stroke="none"/><circle cx="15" cy="12.5" r="1.1" fill="currentColor" stroke="none"/></svg>',
    automation: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M12 3v3M12 18v3M3 12h3M18 12h3M5.6 5.6l2.1 2.1M16.3 16.3l2.1 2.1M18.4 5.6l-2.1 2.1M7.7 16.3l-2.1 2.1"/><circle cx="12" cy="12" r="4"/></svg>',
    crm: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M4 5h16l-6 8v6l-4-2v-4z"/></svg>',
    "learn-smm": '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M3 9l9-4 9 4-9 4-9-4z"/><path d="M7 11v4c0 1.5 2.2 3 5 3s5-1.5 5-3v-4"/></svg>',
    "learn-ai": '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><circle cx="12" cy="12" r="3"/><path d="M12 3v3M12 18v3M3 12h3M18 12h3M6 6l2 2M16 16l2 2M18 6l-2 2M8 16l-2 2"/></svg>',
  };

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
