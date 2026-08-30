/**
 * Лёгкое появление элементов при прокрутке (IntersectionObserver).
 * Никаких тяжёлых анимаций — один плавный эффект на весь сайт.
 */
(function () {
  "use strict";

  var reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  function observe() {
    var items = document.querySelectorAll("[data-reveal]:not(.is-visible)");
    if (reducedMotion || !("IntersectionObserver" in window)) {
      items.forEach(function (el) {
        el.classList.add("is-visible");
      });
      return;
    }
    var observer = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            observer.unobserve(entry.target);
          }
        });
      },
      { rootMargin: "0px 0px -8% 0px", threshold: 0.08 }
    );
    items.forEach(function (el) {
      observer.observe(el);
    });
  }

  document.addEventListener("DOMContentLoaded", observe);
  document.addEventListener("algoritm:content-rendered", observe);
})();
