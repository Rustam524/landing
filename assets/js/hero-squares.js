/**
 * Боковая панель первого экрана: два столбца квадратных карточек с нашими
 * услугами, едущих навстречу друг другу — один столбец вверх, другой вниз
 * (по образцу референса, адаптировано под ALGORITM). Останавливается при
 * наведении/фокусе, каждая карточка — активная ссылка.
 */
(function () {
  "use strict";

  var colUp = document.getElementById("hero-squares-col-up");
  var colDown = document.getElementById("hero-squares-col-down");
  if (!colUp || !colDown) return;

  var DATA = window.ALGORITM_DATA;
  if (!DATA) return;

  function tileHtml(item, ICONS) {
    return (
      '<a class="hero-square-tile" href="' +
      item.href +
      '" data-analytics-event="hero_direction_click" data-analytics-label="' +
      item.id +
      '">' +
      '<span class="hero-square-tile__icon">' +
      (ICONS[item.icon] || "") +
      "</span>" +
      '<span class="hero-square-tile__label">' +
      item.title +
      "</span>" +
      "</a>"
    );
  }

  function fillColumn(host, items, ICONS) {
    var html = items
      .map(function (item) {
        return tileHtml(item, ICONS);
      })
      .join("");
    // Дублируем — бесшовный вертикальный цикл (translateY 0 ↔ -50%).
    host.innerHTML = html + html;
  }

  var ready = window.ALGORITM_CONTENT_READY || Promise.resolve();
  ready.then(function () {
    var ICONS = window.ALGORITM_ICONS || {};
    // Только сами услуги — курсы уже отдельно показаны в блоке «Обучение»,
    // не дублируем их здесь.
    var items = DATA.services || [];
    if (!items.length) return;

    var half = Math.ceil(items.length / 2);
    fillColumn(colUp, items.slice(0, half), ICONS);
    fillColumn(colDown, items.slice(half), ICONS);
  });
})();
