/**
 * Боковая панель первого экрана: два столбца с круглыми значками — логотипы
 * платформ, с которыми мы работаем (Instagram, TikTok, Facebook, amoCRM,
 * каждый в своём фирменном цвете), плюс два наших направления без внешнего
 * бренда (ИИ-боты, автоматизация) — в фирменном красном ALGORITM. Едут
 * навстречу друг другу (один столбец вверх, другой вниз), останавливаются
 * при наведении/фокусе.
 */
(function () {
  "use strict";

  var colUp = document.getElementById("hero-squares-col-up");
  var colDown = document.getElementById("hero-squares-col-down");
  if (!colUp || !colDown) return;

  var BRAND_ICONS = window.ALGORITM_BRAND_ICONS || {};
  var ICONS = window.ALGORITM_ICONS || {};
  var ALGORITM_RED = "linear-gradient(145deg, var(--color-red-bright), var(--color-red))";

  var PLATFORMS = [
    { id: "instagram", label: "Instagram", bg: "linear-gradient(45deg, #f09433, #e6683c, #dc2743, #cc2366, #bc1888)", icon: BRAND_ICONS.instagram, href: "https://www.instagram.com/algoritm_co" },
    { id: "tiktok", label: "TikTok", bg: "#000000", icon: BRAND_ICONS.tiktok, href: "/uslugi/smm/" },
    { id: "ai-bots", label: "ИИ-боты", bg: ALGORITM_RED, icon: ICONS.ai, href: "/uslugi/ai-boty/" },
    { id: "facebook", label: "Facebook", bg: "#1877F2", icon: BRAND_ICONS.facebook, href: "/uslugi/smm/" },
    { id: "amocrm", label: "amoCRM", bg: "#339DC7", icon: BRAND_ICONS.amocrm, href: "/uslugi/amocrm/" },
    { id: "automation", label: "Автоматизация", bg: ALGORITM_RED, icon: ICONS.automation, href: "/uslugi/avtomatizatsiya/" },
  ];

  function tileHtml(item) {
    return (
      '<a class="hero-square-tile" href="' +
      item.href +
      '" target="' + (item.href.indexOf("http") === 0 ? "_blank" : "_self") + '" rel="noopener" ' +
      'data-analytics-event="hero_platform_click" data-analytics-label="' +
      item.id +
      '">' +
      '<span class="hero-square-tile__icon" style="--tile-bg:' +
      item.bg +
      ';">' +
      (item.icon || "") +
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

  fillColumn(colUp, [PLATFORMS[0], PLATFORMS[1], PLATFORMS[2]]);
  fillColumn(colDown, [PLATFORMS[3], PLATFORMS[4], PLATFORMS[5]]);
})();
