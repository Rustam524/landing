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
    '.service-card, .strength-card, .price-card, .cases__instagram, .capability-card, .about__text, .about__card, .contact__form, .contact__left, .pricing__cta'
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

  /* ===== МОКАП ТЕЛЕФОНА: непрерывная переписка из 6 вопросов и ответов ===== */
  const chat = document.getElementById('phoneChat');
  const statusEl = document.getElementById('phoneStatus');

  const conversation = [
    { from: 'in', text: 'Здравствуйте! Меня интересует SMM услуга' },
    { from: 'out', text: 'Здравствуйте! Ведём Instagram и TikTok под ключ — от 120 000 ₸/мес. В какой сфере у вас бизнес?' },
    { from: 'in', text: 'У нас кофейня, хотим больше заявок с рекламы' },
    { from: 'out', text: 'Отлично, подключим таргет в Meta и TikTok Ads — от 150 000 ₸/мес, бюджет отдельно. Настроим и протестируем креативы.' },
    { from: 'in', text: 'А можно бота, который сам отвечает клиентам?' },
    { from: 'out', text: 'Да, настроим ИИ-бота для WhatsApp — отвечает 24/7, консультирует и собирает заявки. Стоимость — от 250 000 ₸.' },
    { from: 'in', text: 'Заявки часто теряются, менеджер забывает перезванивать' },
    { from: 'out', text: 'Настроим amoCRM: заявка сразу попадает в воронку с задачей для менеджера. Ни один клиент не потеряется.' },
    { from: 'in', text: 'Сколько занимает запуск проекта?' },
    { from: 'out', text: 'В среднем 3–7 дней на настройку, дальше тестируем и оптимизируем. Ведёт весь цикл одна команда.' },
    { from: 'in', text: 'Хочу обсудить проект, куда написать?' },
    { from: 'out', text: 'Пишите нам в WhatsApp — ответим в течение рабочего дня и подберём тариф под задачи 🙂' }
  ];

  const wait = (ms) => new Promise(resolve => setTimeout(resolve, ms));

  const scrollChatDown = () => {
    chat.scrollTo({ top: chat.scrollHeight, behavior: reduceMotion ? 'auto' : 'smooth' });
  };

  const addBubble = (type, text) => {
    const bubble = document.createElement('div');
    bubble.className = `msg msg--${type === 'in' ? 'in' : 'out'}`;
    bubble.textContent = text;
    chat.appendChild(bubble);
    scrollChatDown();
    return bubble;
  };

  const addTyping = () => {
    const typing = document.createElement('div');
    typing.className = 'msg msg--typing';
    typing.innerHTML = '<span></span><span></span><span></span>';
    chat.appendChild(typing);
    scrollChatDown();
    return typing;
  };

  async function playConversation() {
    if (!chat) return;

    chat.classList.add('is-fading');
    await wait(300);
    chat.innerHTML = '';
    chat.classList.remove('is-fading');
    if (statusEl) statusEl.textContent = 'онлайн';

    for (const msg of conversation) {
      if (msg.from === 'in') {
        await wait(900);
        addBubble('in', msg.text);
      } else {
        await wait(700);
        if (statusEl) statusEl.textContent = 'печатает…';
        const typingEl = addTyping();
        await wait(1300);
        typingEl.remove();
        addBubble('out', msg.text);
        if (statusEl) statusEl.textContent = 'онлайн';
      }
    }

    await wait(3500);
    playConversation();
  }

  if (chat) {
    if (reduceMotion) {
      conversation.forEach(msg => addBubble(msg.from, msg.text));
    } else {
      playConversation();
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
