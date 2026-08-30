/**
 * Заглушка плавающего ИИ-чата Nextbot.
 *
 * ВАЖНО: интеграцию нужно выполнить ТОЛЬКО официальным embed-кодом Nextbot
 * из личного кабинета — этот файл лишь готовит место и UI-обвязку
 * (кнопка, панель, передача названия/URL страницы, переход в WhatsApp).
 * Пока официальный код не вставлен, показывается информационная заглушка.
 *
 * Место вставки официального кода Nextbot: см. комментарий
 * NEXTBOT_OFFICIAL_EMBED_PLACEHOLDER в index.html (перед </body>).
 */
(function () {
  "use strict";

  var launcher = document.getElementById("nextbot-launcher");
  var panel = document.getElementById("nextbot-panel");
  if (!launcher || !panel) return;

  var cfg = (window.ALGORITM_CONFIG && window.ALGORITM_CONFIG.nextbot) || {};

  function track(name, params) {
    if (window.ALGORITM_trackEvent) window.ALGORITM_trackEvent(name, params || {});
  }

  function togglePanel() {
    var isOpen = panel.classList.toggle("is-open");
    launcher.setAttribute("aria-expanded", String(isOpen));
    if (isOpen) {
      track("nextbot_open", { page: window.location.pathname, title: document.title });
    }
  }

  launcher.addEventListener("click", togglePanel);

  var closeBtn = panel.querySelector("[data-nextbot-close]");
  if (closeBtn) {
    closeBtn.addEventListener("click", function () {
      panel.classList.remove("is-open");
      launcher.setAttribute("aria-expanded", "false");
    });
  }

  var waBtn = panel.querySelector("[data-nextbot-whatsapp]");
  if (waBtn) {
    waBtn.addEventListener("click", function () {
      track("nextbot_to_whatsapp", {});
    });
  }

  if (!cfg.enabled) {
    var note = panel.querySelector("[data-nextbot-note]");
    if (note) note.hidden = false;
  }
})();
