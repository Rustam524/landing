/**
 * Загрузка редактируемого контента из /content/*.json поверх значений по
 * умолчанию из data.js/config.js. Файлы в /content редактируются через
 * админ-панель Decap CMS (/admin) и попадают в /content/generated/*.json
 * сборочным скриптом (scripts/build-content.js) при каждом деплое.
 *
 * Если /content недоступен (например, локальный просмотр без сервера,
 * или предпросмотр-артефакт без бэкенда) — сайт продолжает работать на
 * встроенных значениях по умолчанию, ничего не ломается.
 *
 * window.ALGORITM_CONTENT_READY — промис, который резолвится, когда все
 * попытки загрузки завершены (успешно или нет). render.js дожидается его
 * перед отрисовкой карточек, чтобы не показывать сначала старые данные,
 * а затем — актуальные.
 */
(function () {
  "use strict";

  function fetchJson(url) {
    return fetch(url, { cache: "no-store" })
      .then(function (res) {
        if (!res.ok) throw new Error("not ok: " + url);
        return res.json();
      })
      .catch(function () {
        return null; // тихо остаёмся на значениях по умолчанию
      });
  }

  function applyTextContent(siteData) {
    if (!siteData) return;
    document.querySelectorAll("[data-content]").forEach(function (el) {
      var path = el.getAttribute("data-content").split(".");
      var value = siteData;
      for (var i = 0; i < path.length; i++) {
        if (value == null) return;
        value = value[path[i]];
      }
      if (typeof value === "string" && value.trim()) {
        el.textContent = value;
      }
    });
  }

  window.ALGORITM_CONTENT_READY = Promise.all([
    fetchJson("/content/site.json"),
    fetchJson("/content/founder.json"),
    fetchJson("/content/generated/services.json"),
    fetchJson("/content/generated/learning.json"),
    fetchJson("/content/generated/cases.json"),
    fetchJson("/content/generated/testimonials.json"),
    fetchJson("/content/generated/latest-posts.json"),
  ]).then(function (results) {
    var site = results[0];
    var founder = results[1];
    var services = results[2];
    var learning = results[3];
    var cases = results[4];
    var testimonials = results[5];
    var latestPosts = results[6];

    var DATA = window.ALGORITM_DATA;
    var CONFIG = window.ALGORITM_CONFIG;

    if (site) {
      if (Array.isArray(site.stats) && site.stats.length) DATA.stats = site.stats;
      if (Array.isArray(site.steps) && site.steps.length) DATA.steps = site.steps;
      if (CONFIG) {
        if (site.contacts) CONFIG.contacts = Object.assign({}, CONFIG.contacts, site.contacts);
        if (site.whatsapp) CONFIG.whatsapp = Object.assign({}, CONFIG.whatsapp, site.whatsapp);
        if (site.social) CONFIG.social = Object.assign({}, CONFIG.social, site.social);
        if (site.analytics) CONFIG.analytics = Object.assign({}, CONFIG.analytics, site.analytics);
      }
      applyTextContent(site);
    }

    if (founder) DATA.founder = Object.assign({}, DATA.founder, founder, { photo: DATA.founder.photo });
    if (founder && typeof founder.photo === "string") {
      // В CMS фото хранится одной ссылкой (не набором src/webp по размерам,
      // как в исходных данных) — используем её везде.
      DATA.founder.photo = {
        src800: founder.photo,
        webp800: founder.photo,
        src480: founder.photo,
        webp480: founder.photo,
      };
    }

    if (Array.isArray(services) && services.length) DATA.services = services;
    if (Array.isArray(learning) && learning.length) DATA.learningTracks = learning;
    if (Array.isArray(cases) && cases.length) DATA.cases = cases;
    if (Array.isArray(testimonials)) DATA.testimonials = testimonials;
    if (Array.isArray(latestPosts)) DATA.blogPosts = latestPosts;
  });
})();
