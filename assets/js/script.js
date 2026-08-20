document.addEventListener('DOMContentLoaded', () => {

  /* ===== ПРЕЛОАДЕР: анимация появления ALGORITM сверху ===== */
  const preloader = document.getElementById('preloader');
  window.addEventListener('load', () => {
    setTimeout(() => preloader.classList.add('is-hidden'), 900);
  });
  // подстраховка на случай медленной загрузки шрифтов
  setTimeout(() => preloader.classList.add('is-hidden'), 2500);

  /* ===== ШАПКА: фон при скролле ===== */
  const header = document.getElementById('header');
  const onScroll = () => {
    header.classList.toggle('is-scrolled', window.scrollY > 30);
  };
  onScroll();
  window.addEventListener('scroll', onScroll, { passive: true });

  /* ===== МОБИЛЬНОЕ МЕНЮ-ГАМБУРГЕР ===== */
  const burger = document.getElementById('burger');
  const nav = document.getElementById('nav');

  const overlay = document.createElement('div');
  overlay.className = 'nav-overlay';
  document.body.appendChild(overlay);

  const closeMenu = () => {
    burger.classList.remove('is-open');
    nav.classList.remove('is-open');
    overlay.classList.remove('is-open');
    document.body.style.overflow = '';
  };

  const toggleMenu = () => {
    const isOpen = nav.classList.toggle('is-open');
    burger.classList.toggle('is-open', isOpen);
    overlay.classList.toggle('is-open', isOpen);
    document.body.style.overflow = isOpen ? 'hidden' : '';
  };

  burger.addEventListener('click', toggleMenu);
  overlay.addEventListener('click', closeMenu);
  nav.querySelectorAll('.nav__link').forEach(link => {
    link.addEventListener('click', closeMenu);
  });

  /* ===== ПЛАВНАЯ ПРОКРУТКА (доп. к CSS scroll-behavior, с учётом высоты шапки) ===== */
  document.querySelectorAll('a[href^="#"]').forEach(link => {
    link.addEventListener('click', (e) => {
      const id = link.getAttribute('href');
      if (id.length < 2) return;
      const target = document.querySelector(id);
      if (!target) return;
      e.preventDefault();
      const offset = 76;
      const top = target.getBoundingClientRect().top + window.pageYOffset - offset;
      window.scrollTo({ top, behavior: 'smooth' });
    });
  });

  /* ===== ПОЯВЛЕНИЕ БЛОКОВ ПРИ СКРОЛЛЕ ===== */
  const revealTargets = document.querySelectorAll(
    '.value-card, .service-card, .case-card, .review-card, .about__mission, .contact__form, .contact__left'
  );
  revealTargets.forEach(el => el.classList.add('reveal'));

  const io = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-visible');
        io.unobserve(entry.target);
      }
    });
  }, { threshold: 0.15 });

  revealTargets.forEach(el => io.observe(el));

  /* ===== ГОД В ФУТЕРЕ ===== */
  const yearEl = document.getElementById('year');
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  /* ===== ФОРМА ЗАЯВКИ ===== */
  const form = document.getElementById('leadForm');
  const note = document.getElementById('formNote');

  if (form) {
    form.addEventListener('submit', (e) => {
      e.preventDefault();

      const name = form.name.value.trim();
      const phone = form.phone.value.trim();
      const service = form.service.value;
      const message = form.message.value.trim();

      if (!name || !phone) {
        note.style.color = '#e6112a';
        note.textContent = 'Заполните имя и телефон.';
        return;
      }

      // Демо-режим: отправка на бэкенд не подключена.
      // Формируем сообщение и открываем WhatsApp с заполненным текстом,
      // чтобы заявка точно дошла до агентства.
      const text = encodeURIComponent(
        `Здравствуйте! Заявка с сайта ALGORITM.\n` +
        `Имя: ${name}\n` +
        `Телефон: ${phone}\n` +
        `Услуга: ${service}\n` +
        (message ? `Комментарий: ${message}` : '')
      );

      note.style.color = '#f5f5f5';
      note.textContent = 'Открываем WhatsApp для отправки заявки...';

      window.open(`https://wa.me/77058903755?text=${text}`, '_blank');
      form.reset();
    });
  }

});
