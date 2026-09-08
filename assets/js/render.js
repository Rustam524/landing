/**
 * Рендер контентных блоков главной страницы на основе data.js,
 * чтобы услуги/кейсы/направления не дублировались в HTML.
 */
(function () {
  "use strict";

  var DATA = window.ALGORITM_DATA;
  if (!DATA) return;

  var ICONS = window.ALGORITM_ICONS || {};

  function el(tag, className, html) {
    var e = document.createElement(tag);
    if (className) e.className = className;
    if (html !== undefined) e.innerHTML = html;
    return e;
  }

  function renderStats() {
    var host = document.querySelector("[data-stats]");
    if (!host) return;
    host.innerHTML = "";
    DATA.stats.forEach(function (s) {
      var item = el("div", "stat-item", "");
      item.innerHTML =
        '<div class="stat-value">' + s.value + '</div><div class="stat-label">' + s.label + "</div>";
      host.appendChild(item);
    });
  }

  function serviceCardNode(item) {
    var card = el("article", "service-card");
    card.setAttribute("data-reveal", "");
    card.innerHTML =
      '<div class="service-icon">' +
      (ICONS[item.icon] || "") +
      "</div>" +
      "<h3>" +
      item.title +
      "</h3>" +
      "<p>" +
      item.description +
      "</p>" +
      '<a class="btn btn-outline" href="' +
      item.href +
      '" data-analytics-event="service_click" data-analytics-label="' +
      item.id +
      '">' +
      item.cta +
      "</a>";
    return card;
  }

  function renderServices() {
    var host = document.querySelector("[data-services-grid]");
    if (!host) return;
    host.innerHTML = "";
    DATA.services.forEach(function (s) {
      host.appendChild(serviceCardNode(s));
    });
  }

  function renderLearning() {
    var hosts = document.querySelectorAll("[data-learning-row]");
    if (!hosts.length) return;
    hosts.forEach(function (host) {
      var isAlt = host.getAttribute("data-learning-row") === "alt";
      host.innerHTML = "";
      DATA.learningTracks.forEach(function (t) {
        var card = el("article", "learning-card" + (isAlt ? " learning-card--alt" : ""));
        card.setAttribute("data-reveal", "");
        card.innerHTML =
          '<div class="service-icon" style="background:rgba(244,240,235,0.12); color:#f4f0eb;">' +
          (ICONS[t.icon] || "") +
          "</div>" +
          "<h3>" +
          t.title +
          "</h3>" +
          "<p>" +
          t.description +
          "</p>" +
          '<a class="btn btn-primary" href="' +
          t.href +
          '" data-analytics-event="learning_click" data-analytics-label="' +
          t.id +
          '">' +
          t.cta +
          "</a>";
        host.appendChild(card);
      });
    });
  }

  function renderCases() {
    var host = document.querySelector("[data-cases-grid]");
    if (!host) return;
    host.innerHTML = "";
    DATA.cases.slice(0, 6).forEach(function (c) {
      var card = el("article", "case-card");
      card.setAttribute("data-reveal", "");
      card.innerHTML =
        '<div class="case-card__media"><img src="' +
        c.image +
        '" alt="' +
        c.niche +
        ' — ' +
        c.service +
        '" loading="lazy" width="640" height="480"></div>' +
        '<div class="case-card__body">' +
        '<span class="case-tag">' +
        c.service +
        "</span>" +
        "<h3>" +
        c.niche +
        "</h3>" +
        '<p class="case-card__task">' +
        c.task +
        "</p>" +
        '<p class="case-card__result">' +
        c.result +
        "</p>" +
        '<a class="case-card__link" href="' +
        c.href +
        '" data-analytics-event="case_open" data-analytics-label="' +
        c.id +
        '">Посмотреть кейс →</a>' +
        "</div>";
      host.appendChild(card);
    });

    var note = document.querySelector("[data-cases-note]");
    var hasPlaceholders = DATA.cases.some(function (c) {
      return c.placeholder;
    });
    if (note) {
      note.hidden = !hasPlaceholders;
    }
  }

  function renderTestimonials() {
    var section = document.querySelector("[data-testimonials-section]");
    if (!section) return;
    if (!DATA.testimonials || !DATA.testimonials.length) {
      section.hidden = true;
      return;
    }
    var host = section.querySelector("[data-testimonials-grid]");
    host.innerHTML = "";
    DATA.testimonials.slice(0, 3).forEach(function (r) {
      var card = el("article", "testimonial-card");
      card.innerHTML =
        '<div class="testimonial-card__head">' +
        (r.photo ? '<img src="' + r.photo + '" alt="' + r.author + '" loading="lazy">' : "") +
        '<div><div class="testimonial-card__name">' +
        r.author +
        '</div><div class="testimonial-card__service">' +
        (r.serviceLabel || "") +
        "</div></div></div>" +
        '<p class="testimonial-card__text">' +
        r.text +
        "</p>" +
        (r.sourceUrl
          ? '<a class="testimonial-card__source" href="' + r.sourceUrl + '" target="_blank" rel="noopener">Источник отзыва</a>'
          : "");
      host.appendChild(card);
    });
    section.hidden = false;
  }

  function renderBlogPreview() {
    var section = document.querySelector("[data-blog-section]");
    if (!section) return;
    if (!DATA.blogPosts || DATA.blogPosts.length < 3) {
      section.hidden = true;
      return;
    }
    var host = section.querySelector("[data-blog-grid]");
    host.innerHTML = "";
    DATA.blogPosts
      .slice()
      .sort(function (a, b) {
        return new Date(b.date) - new Date(a.date);
      })
      .slice(0, 3)
      .forEach(function (p) {
        var card = el("article", "case-card");
        card.innerHTML =
          '<div class="case-card__media"><img src="' +
          p.cover +
          '" alt="' +
          p.title +
          '" loading="lazy"></div>' +
          '<div class="case-card__body">' +
          '<span class="case-tag">' +
          p.categoryLabel +
          "</span>" +
          "<h3>" +
          p.title +
          "</h3>" +
          '<p class="case-card__task">' +
          p.excerpt +
          "</p>" +
          '<a class="case-card__link" href="' +
          p.href +
          '">Читать →</a>' +
          "</div>";
        host.appendChild(card);
      });
    section.hidden = false;
  }

  function renderSteps() {
    var host = document.querySelector("[data-steps-list]");
    if (!host) return;
    host.innerHTML = "";
    DATA.steps.forEach(function (step, i) {
      var item = el("div", "step-item");
      item.setAttribute("data-reveal", "");
      item.innerHTML = '<div class="step-number">' + (i + 1) + "</div><p>" + step + "</p>";
      host.appendChild(item);
    });
  }

  function renderFounder() {
    var host = document.querySelector("[data-founder-block]");
    if (!host) return;
    var f = DATA.founder;
    host.querySelector("[data-founder-name]").textContent = f.name;
    host.querySelector("[data-founder-role]").textContent = f.role;
    host.querySelector("[data-founder-quote]").textContent = "«" + f.quote + "»";
    var link = host.querySelector("[data-founder-link]");
    if (link) link.href = f.href;
    var picture = host.querySelector("[data-founder-photo]");
    if (picture) {
      picture.innerHTML =
        '<picture>' +
        '<source srcset="' + f.photo.webp480 + ' 480w, ' + f.photo.webp800 + ' 800w" type="image/webp">' +
        '<img src="' + f.photo.src800 + '" srcset="' + f.photo.src480 + ' 480w, ' + f.photo.src800 + ' 800w" sizes="(min-width: 760px) 220px, 60vw" alt="' + f.name + ' — ' + f.role + '" loading="lazy" width="480" height="640">' +
        "</picture>";
    }
  }

  function renderAll() {
    renderStats();
    renderServices();
    renderLearning();
    renderCases();
    renderTestimonials();
    renderBlogPreview();
    renderSteps();
    renderFounder();
    window.ALGORITM_applyWhatsAppLinks(document);
    document.dispatchEvent(new CustomEvent("algoritm:content-rendered"));
  }

  document.addEventListener("DOMContentLoaded", function () {
    // Дожидаемся попытки подгрузить актуальный контент из /content
    // (редактируется через /admin), чтобы не отрисовать сначала данные
    // по умолчанию, а через мгновение — настоящие поверх них.
    var ready = window.ALGORITM_CONTENT_READY || Promise.resolve();
    ready.then(renderAll);
  });
})();
