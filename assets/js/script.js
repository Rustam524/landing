document.addEventListener('DOMContentLoaded', () => {

  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ===== ПРЕЛОАДЕР ===== */
  const preloader = document.getElementById('preloader');
  window.addEventListener('load', () => {
    setTimeout(() => preloader.classList.add('is-hidden'), reduceMotion ? 200 : 2100);
  });
  setTimeout(() => preloader.classList.add('is-hidden'), reduceMotion ? 400 : 3200);

  /* ===== ШАПКА: фон при скролле ===== */
  const header = document.getElementById('header');
  const onScroll = () => header.classList.toggle('is-scrolled', window.scrollY > 30);
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
  nav.querySelectorAll('.nav__link').forEach(link => link.addEventListener('click', closeMenu));

  /* ===== ПЛАВНАЯ ПРОКРУТКА К РАЗДЕЛАМ ===== */
  document.querySelectorAll('a[href^="#"]').forEach(link => {
    link.addEventListener('click', (e) => {
      const id = link.getAttribute('href');
      if (id.length < 2) return;
      const target = document.querySelector(id);
      if (!target) return;
      e.preventDefault();
      const offset = 76;
      const top = target.getBoundingClientRect().top + window.pageYOffset - offset;
      window.scrollTo({ top, behavior: reduceMotion ? 'auto' : 'smooth' });
    });
  });

  /* ===== ИНТЕРАКТИВНЫЙ ЛОГОТИП: клик/тап запускает вращение ===== */
  document.querySelectorAll('.logo').forEach(logo => {
    logo.addEventListener('click', () => {
      logo.classList.add('is-spinning');
      setTimeout(() => logo.classList.remove('is-spinning'), 700);
    });
  });

  /* ===== FADE-IN БЛОКОВ ПРИ СКРОЛЛЕ ===== */
  const revealTargets = document.querySelectorAll(
    '.service-card, .strength-card, .price-card, .case-card, .capability-card, .review-card, .about__text, .about__card, .contact__form, .contact__left, .pricing__cta'
  );
  revealTargets.forEach(el => el.classList.add('reveal'));

  if (reduceMotion) {
    revealTargets.forEach(el => el.classList.add('is-visible'));
  } else {
    const revealIO = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          revealIO.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12 });
    revealTargets.forEach(el => revealIO.observe(el));
  }

  /* ===== АНИМИРОВАННЫЕ СЧЁТЧИКИ ===== */
  const counters = document.querySelectorAll('[data-count-to]');
  const animateCounter = (el) => {
    const to = parseInt(el.dataset.countTo, 10) || 0;
    const suffix = el.dataset.suffix || '';
    if (reduceMotion) { el.textContent = to + suffix; return; }
    const duration = 1300;
    const start = performance.now();
    const tick = (now) => {
      const progress = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      el.textContent = Math.round(eased * to) + suffix;
      if (progress < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  };
  const counterIO = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        animateCounter(entry.target);
        counterIO.unobserve(entry.target);
      }
    });
  }, { threshold: 0.6 });
  counters.forEach(el => counterIO.observe(el));

  /* ===== ГОД В ФУТЕРЕ ===== */
  const yearEl = document.getElementById('year');
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  /* ===== МОКАП ТЕЛЕФОНА: цикл переписок в мессенджере ===== */
  const chat = document.getElementById('phoneChat');
  const statusEl = document.getElementById('phoneStatus');

  const dialogs = [
    {
      client: 'Здравствуйте! Меня интересует SMM услуга',
      bot: 'Здравствуйте! Ведём Instagram и TikTok под ключ — от 120 000 ₸/мес. Расскажете, какая у вас сфера?'
    },
    {
      client: 'Можно бота, который сам отвечает клиентам?',
      bot: 'Да, настроим ИИ-бота для WhatsApp — отвечает 24/7 и собирает заявки. Стоимость — от 250 000 ₸.'
    },
    {
      client: 'Сколько стоит настройка таргета?',
      bot: 'Таргет в Meta Ads или TikTok Ads — от 150 000 ₸/мес, бюджет рекламы отдельно. Можем запустить тест уже на этой неделе.'
    }
  ];

  const wait = (ms) => new Promise(resolve => setTimeout(resolve, ms));

  const addBubble = (type, text) => {
    const bubble = document.createElement('div');
    bubble.className = `msg msg--${type}`;
    bubble.textContent = text;
    chat.appendChild(bubble);
    return bubble;
  };

  const addTyping = () => {
    const typing = document.createElement('div');
    typing.className = 'msg msg--typing';
    typing.innerHTML = '<span></span><span></span><span></span>';
    chat.appendChild(typing);
    return typing;
  };

  let dialogIndex = 0;

  async function playDialog() {
    if (!chat) return;
    const dialog = dialogs[dialogIndex % dialogs.length];
    dialogIndex++;

    chat.classList.add('is-fading');
    await wait(300);
    chat.innerHTML = '';
    chat.classList.remove('is-fading');

    await wait(400);
    addBubble('in', dialog.client);

    await wait(1000);
    if (statusEl) statusEl.textContent = 'печатает…';
    const typingEl = addTyping();

    await wait(1500);
    typingEl.remove();
    addBubble('out', dialog.bot);
    if (statusEl) statusEl.textContent = 'онлайн';

    await wait(3200);
    playDialog();
  }

  if (chat) {
    if (reduceMotion) {
      const d = dialogs[0];
      addBubble('in', d.client);
      addBubble('out', d.bot);
    } else {
      playDialog();
    }
  }

  /* ===== ФОРМА ЗАЯВКИ: проверка полей + отправка в WhatsApp ===== */
  const form = document.getElementById('leadForm');
  const note = document.getElementById('formNote');

  const setFieldError = (field, message) => {
    const group = field.closest('.form-group');
    const errorEl = form.querySelector(`[data-error-for="${field.name}"]`);
    if (message) {
      group.classList.add('has-error');
      if (errorEl) errorEl.textContent = message;
    } else {
      group.classList.remove('has-error');
      if (errorEl) errorEl.textContent = '';
    }
  };

  const validateForm = () => {
    let valid = true;

    const name = form.name.value.trim();
    if (!name) {
      setFieldError(form.name, 'Укажите имя');
      valid = false;
    } else {
      setFieldError(form.name, '');
    }

    const phone = form.phone.value.trim();
    const phoneDigits = phone.replace(/\D/g, '');
    if (!phone) {
      setFieldError(form.phone, 'Укажите номер телефона');
      valid = false;
    } else if (phoneDigits.length < 10) {
      setFieldError(form.phone, 'Проверьте номер — слишком короткий');
      valid = false;
    } else {
      setFieldError(form.phone, '');
    }

    return valid;
  };

  if (form) {
    ['name', 'phone'].forEach(fieldName => {
      form[fieldName].addEventListener('input', () => {
        if (form[fieldName].closest('.form-group').classList.contains('has-error')) {
          validateForm();
        }
      });
    });

    form.addEventListener('submit', (e) => {
      e.preventDefault();

      if (!validateForm()) {
        note.style.color = '#b91c1c';
        note.textContent = 'Проверьте поля, отмеченные красным.';
        return;
      }

      const name = form.name.value.trim();
      const phone = form.phone.value.trim();
      const service = form.service.value;
      const message = form.message.value.trim();

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

      note.style.color = '#1b1712';
      note.textContent = 'Открываем WhatsApp для отправки заявки...';

      window.open(`https://wa.me/77058903755?text=${text}`, '_blank');
      form.reset();
    });
  }

});
