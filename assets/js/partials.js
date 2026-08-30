/**
 * Подключение общих частей (шапка/подвал) на каждой странице,
 * чтобы не дублировать HTML-разметку.
 */
(function () {
  "use strict";

  function inject(selector, url) {
    var host = document.querySelector(selector);
    if (!host) return Promise.resolve();
    return fetch(url)
      .then(function (res) {
        if (!res.ok) throw new Error("Failed to load " + url);
        return res.text();
      })
      .then(function (html) {
        host.innerHTML = html;
      })
      .catch(function (err) {
        console.error("[ALGORITM] Не удалось загрузить блок:", url, err);
      });
  }

  document.addEventListener("DOMContentLoaded", function () {
    Promise.all([
      inject("#site-header-root", "/partials/header.html"),
      inject("#site-footer-root", "/partials/footer.html"),
    ]).then(function () {
      document.dispatchEvent(new CustomEvent("algoritm:partials-ready"));
    });
  });
})();
