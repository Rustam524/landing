/**
 * Боковая панель первого экрана: два столбца с фирменными логотипами
 * платформ, с которыми мы работаем — Instagram, TikTok, Facebook и amoCRM,
 * каждый в своём фирменном цвете. Без квадратных подложек/карточек — только
 * сами значки и подпись, едущие навстречу друг другу (один столбец вверх,
 * другой вниз), останавливаются при наведении/фокусе.
 */
(function () {
  "use strict";

  var colUp = document.getElementById("hero-squares-col-up");
  var colDown = document.getElementById("hero-squares-col-down");
  if (!colUp || !colDown) return;

  var ICONS = window.ALGORITM_BRAND_ICONS || {};

  var PLATFORMS = [
    { id: "instagram", label: "Instagram", href: "https://www.instagram.com/algoritm_co" },
    { id: "tiktok", label: "TikTok", href: "/uslugi/smm/" },
    { id: "facebook", label: "Facebook", href: "/uslugi/smm/" },
    { id: "amocrm", label: "amoCRM", href: "/uslugi/amocrm/" },
  ];

  function tileHtml(item) {
    return (
      '<a class="hero-square-tile" href="' +
      item.href +
      '" target="' + (item.href.indexOf("http") === 0 ? "_blank" : "_self") + '" rel="noopener" ' +
      'data-analytics-event="hero_platform_click" data-analytics-label="' +
      item.id +
      '">' +
      '<span class="hero-square-tile__icon">' +
      (ICONS[item.id] || "") +
      "</span>" +
      '<span class="hero-square-tile__label">' +
      item.label +
      "</span>" +
      "</a>"
    );
  }

  function fillColumn(host, items) {
    var html = items.map(tileHtml).join("");
    // Дублируем — бесшовный вертикальный цикл (translateY 0 ↔ -50%).
    host.innerHTML = html + html;
  }

  // Каждый столбец получает все 4 логотипа (в разном порядке), чтобы
  // хватало контента на всю высоту панели даже с небольшим набором значков.
  fillColumn(colUp, [PLATFORMS[0], PLATFORMS[1], PLATFORMS[2], PLATFORMS[3]]);
  fillColumn(colDown, [PLATFORMS[2], PLATFORMS[3], PLATFORMS[0], PLATFORMS[1]]);
})();
