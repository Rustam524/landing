/**
 * Поведение шапки: выпадающие меню (наведение + клик + клавиатура),
 * мобильное меню, активные ссылки, кнопка WhatsApp.
 */
(function () {
  "use strict";

  function closeAllDropdowns(except) {
    document.querySelectorAll("[data-dropdown]").forEach(function (item) {
      if (item === except) return;
      item.classList.remove("is-open");
      var trigger = item.querySelector("[data-dropdown-trigger]");
      if (trigger) trigger.setAttribute("aria-expanded", "false");
    });
  }

  function initDropdowns(root) {
    var dropdownItems = root.querySelectorAll("[data-dropdown]");

    dropdownItems.forEach(function (item) {
      var trigger = item.querySelector("[data-dropdown-trigger]");
      var menu = item.querySelector("[data-dropdown-menu]");
      if (!trigger || !menu) return;

      trigger.addEventListener("click", function (e) {
        e.stopPropagation();
        var isOpen = item.classList.contains("is-open");
        closeAllDropdowns(item);
        item.classList.toggle("is-open", !isOpen);
        trigger.setAttribute("aria-expanded", String(!isOpen));
        if (!isOpen) {
          var firstLink = menu.querySelector("a");
          if (firstLink) firstLink.focus();
        }
      });

      item.addEventListener("keydown", function (e) {
        if (e.key === "Escape") {
          item.classList.remove("is-open");
          trigger.setAttribute("aria-expanded", "false");
          trigger.focus();
        }
      });

      // Наведение мышью (не мешает клику/клавиатуре) — плавно открывает и
      // не закрывается, пока курсор движется к пункту меню (см. CSS).
      item.addEventListener("mouseenter", function () {
        if (window.matchMedia("(hover: hover)").matches) {
          trigger.setAttribute("aria-expanded", "true");
        }
      });
      item.addEventListener("mouseleave", function () {
        if (window.matchMedia("(hover: hover)").matches && !item.classList.contains("is-open")) {
          trigger.setAttribute("aria-expanded", "false");
        }
      });
    });

    document.addEventListener("click", function () {
      closeAllDropdowns();
    });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape") closeAllDropdowns();
    });
  }

  function initMobileNav(root) {
    var toggle = root.querySelector(".nav-toggle");
    var mobileNav = root.querySelector("#mobile-nav");
    if (!toggle || !mobileNav) return;

    toggle.addEventListener("click", function () {
      var isOpen = mobileNav.classList.toggle("is-open");
      toggle.setAttribute("aria-expanded", String(isOpen));
      document.body.style.overflow = isOpen ? "hidden" : "";
    });

    mobileNav.querySelectorAll("[data-mobile-submenu-trigger]").forEach(function (btn) {
      var key = btn.getAttribute("data-mobile-submenu-trigger");
      var submenu = mobileNav.querySelector('[data-mobile-submenu="' + key + '"]');
      if (!submenu) return;
      btn.addEventListener("click", function () {
        var isOpen = submenu.classList.toggle("is-open");
        btn.setAttribute("aria-expanded", String(isOpen));
      });
    });

    // Закрывать мобильное меню при переходе по обычной ссылке.
    mobileNav.querySelectorAll("a[href]").forEach(function (a) {
      a.addEventListener("click", function () {
        mobileNav.classList.remove("is-open");
        toggle.setAttribute("aria-expanded", "false");
        document.body.style.overflow = "";
      });
    });
  }

  document.addEventListener("algoritm:partials-ready", function () {
    var headerRoot = document.querySelector("#site-header-root");
    var footerRoot = document.querySelector("#site-footer-root");
    if (headerRoot) {
      initDropdowns(headerRoot);
      initMobileNav(headerRoot);
      window.ALGORITM_markActiveNav(headerRoot);
    }
    window.ALGORITM_applyWhatsAppLinks(document);
    if (footerRoot) window.ALGORITM_applyFooterDynamicData(footerRoot);
  });
})();
