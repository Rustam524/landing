/**
 * Модальное окно формы "Получить бесплатный аудит".
 * Схема отправки: форма → серверная функция Netlify → вебхук Make.com →
 * Telegram + Google Sheets. URL вебхука и токены хранятся только на
 * сервере (переменные окружения), во фронтенде их нет.
 */
(function () {
  "use strict";

  var overlay = document.getElementById("audit-modal");
  if (!overlay) return;

  var box = overlay.querySelector(".modal-box");
  var form = overlay.querySelector("#audit-form");
  var statusEl = overlay.querySelector("[data-form-status]");
  var closeButtons = overlay.querySelectorAll("[data-modal-close]");
  var lastFocused = null;

  function track(name, params) {
    if (window.ALGORITM_trackEvent) window.ALGORITM_trackEvent(name, params || {});
  }

  function openModal(source) {
    lastFocused = document.activeElement;
    overlay.classList.add("is-open");
    overlay.setAttribute("aria-hidden", "false");
    document.body.style.overflow = "hidden";
    var firstInput = form.querySelector("input");
    if (firstInput) firstInput.focus();
    track("audit_open", { source: source || "unknown" });
  }

  function closeModal() {
    overlay.classList.remove("is-open");
    overlay.setAttribute("aria-hidden", "true");
    document.body.style.overflow = "";
    if (lastFocused) lastFocused.focus();
  }

  document.addEventListener("click", function (e) {
    var trigger = e.target.closest("[data-open-audit-modal]");
    if (trigger) {
      e.preventDefault();
      openModal(trigger.getAttribute("data-analytics-source"));
    }
  });

  closeButtons.forEach(function (btn) {
    btn.addEventListener("click", closeModal);
  });

  overlay.addEventListener("mousedown", function (e) {
    if (e.target === overlay) closeModal();
  });

  document.addEventListener("keydown", function (e) {
    if (!overlay.classList.contains("is-open")) return;
    if (e.key === "Escape") {
      closeModal();
      return;
    }
    if (e.key === "Tab") {
      var focusable = box.querySelectorAll('a[href], button:not([disabled]), input, select, textarea, [tabindex]:not([tabindex="-1"])');
      if (!focusable.length) return;
      var first = focusable[0];
      var last = focusable[focusable.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    }
  });

  function setFieldError(field, message) {
    var wrap = field.closest(".form-field");
    if (!wrap) return;
    wrap.classList.toggle("has-error", !!message);
    var errorEl = wrap.querySelector(".form-error");
    if (errorEl) errorEl.textContent = message || "";
  }

  function validate() {
    var valid = true;
    var name = form.querySelector("#audit-name");
    var phone = form.querySelector("#audit-phone");
    var consent = form.querySelector("#audit-consent");

    if (!name.value.trim()) {
      setFieldError(name, "Укажите имя");
      valid = false;
    } else {
      setFieldError(name, "");
    }

    var phoneDigits = phone.value.replace(/[^\d+]/g, "");
    if (phoneDigits.length < 7) {
      setFieldError(phone, "Укажите корректный телефон");
      valid = false;
    } else {
      setFieldError(phone, "");
    }

    if (!consent.checked) {
      var consentWrap = consent.closest(".form-field");
      if (consentWrap) consentWrap.classList.add("has-error");
      valid = false;
    } else {
      var consentWrap2 = consent.closest(".form-field");
      if (consentWrap2) consentWrap2.classList.remove("has-error");
    }

    return valid;
  }

  if (form) {
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      statusEl.className = "form-status";
      statusEl.textContent = "";

      if (!validate()) return;

      var submitBtn = form.querySelector('button[type="submit"]');
      submitBtn.disabled = true;
      submitBtn.textContent = "Отправляем…";

      var payload = {
        name: form.querySelector("#audit-name").value.trim(),
        phone: form.querySelector("#audit-phone").value.trim(),
        link: form.querySelector("#audit-link").value.trim(),
        page: window.location.href,
        source: "audit_modal",
        utm: window.ALGORITM_getStoredUtmParams ? window.ALGORITM_getStoredUtmParams() : {},
        submittedAt: new Date().toISOString(),
      };

      var endpoint = (window.ALGORITM_CONFIG && window.ALGORITM_CONFIG.forms && window.ALGORITM_CONFIG.forms.auditEndpoint) || "";

      fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })
        .then(function (res) {
          if (!res.ok) throw new Error("bad_status");
          return res.json().catch(function () {
            return {};
          });
        })
        .then(function () {
          statusEl.className = "form-status is-success";
          statusEl.textContent = "Заявка отправлена! Мы свяжемся с вами в ближайшее время.";
          form.reset();
          track("audit_submit_success", {});
          window.setTimeout(closeModal, 2200);
        })
        .catch(function () {
          var waLink = window.ALGORITM_buildWhatsAppLink
            ? window.ALGORITM_buildWhatsAppLink("Здравствуйте! Хочу получить бесплатный аудит от ALGORITM.")
            : "/kontakty/";
          statusEl.className = "form-status is-error";
          statusEl.innerHTML =
            'Не удалось отправить заявку через сайт (тестовая версия ещё не подключена к серверу). ' +
            'Пожалуйста, напишите нам напрямую: <a href="' +
            waLink +
            '" target="_blank" rel="noopener" style="color:inherit; text-decoration:underline;">написать в WhatsApp</a>.';
        })
        .finally(function () {
          submitBtn.disabled = false;
          submitBtn.textContent = "Получить бесплатный аудит";
        });
    });
  }
})();
