document.addEventListener('DOMContentLoaded', () => {

  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* Интро-заставка (#intro-overlay) живёт в своём inline-скрипте в index.html —
     запускается раньше этого файла, стартует сама и сама себя убирает. */

  /* ===== ШАПКА: фон при скролле ===== */
  const header = document.getElementById('header');
  if (header) {
    const onScroll = () => header.classList.toggle('is-scrolled', window.scrollY > 30);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
  }

  /* ===== МОБИЛЬНОЕ МЕНЮ-ГАМБУРГЕР ===== */
  const burger = document.getElementById('burger');
  const nav = document.getElementById('nav');

  if (burger && nav) {
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
  }

  /* ===== МОДАЛЬНОЕ ОКНО ПОЛИТИКИ КОНФИДЕНЦИАЛЬНОСТИ =====
     На странице остаётся только ссылка — полный текст открывается поверх
     контента и не разворачивается в общей ленте сайта. */
  const openModal = (id) => {
    const modal = document.getElementById(id);
    if (!modal) return;
    modal.classList.add('is-open');
    modal.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
    modal.querySelector('.modal__close')?.focus();
  };
  const closeModal = (modal) => {
    if (!modal) return;
    modal.classList.remove('is-open');
    modal.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
  };

  document.addEventListener('keydown', (e) => {
    if (e.key !== 'Escape') return;
    document.querySelectorAll('.modal.is-open').forEach(closeModal);
  });

  /* ===== ПЛАВНАЯ ПРОКРУТКА К РАЗДЕЛАМ =====
     Делегирование на document, а не привязка к конкретным узлам: ссылка
     внутри чекбокса согласия пересоздаётся при переключении языка
     (I18N переписывает innerHTML), и делегированный обработчик продолжает
     работать даже после такой замены. */
  document.addEventListener('click', (e) => {
    const modalTrigger = e.target.closest('[data-modal-open]');
    if (modalTrigger) {
      e.preventDefault();
      openModal(modalTrigger.getAttribute('data-modal-open'));
      return;
    }
    const modalCloser = e.target.closest('[data-modal-close]');
    if (modalCloser) {
      e.preventDefault();
      closeModal(modalCloser.closest('.modal'));
      return;
    }

    const link = e.target.closest('a[href^="#"]');
    if (!link) return;
    const id = link.getAttribute('href');
    if (id.length < 2) return;
    const target = document.querySelector(id);
    if (!target) return;
    e.preventDefault();
    const offset = 76;
    const top = target.getBoundingClientRect().top + window.pageYOffset - offset;
    window.scrollTo({ top, behavior: reduceMotion ? 'auto' : 'smooth' });
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
    '.service-card, .strength-card, .price-card, .about__text, .about__card, .contact__left, .pricing__cta'
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

  /* ===== МОКАП ТЕЛЕФОНА: непрерывная переписка, зависит от текущего языка ===== */
  const chat = document.getElementById('phoneChat');
  const statusEl = document.getElementById('phoneStatus');

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

  // generation-токен: при смене языка текущий цикл переписки прерывается,
  // не дожидаясь своих pending-таймаутов, и стартует заново на новом языке
  let phoneGeneration = 0;

  async function playConversation(myGeneration) {
    if (!chat) return;
    const conversation = (window.I18N ? window.I18N.conversation() : []);

    chat.classList.add('is-fading');
    await wait(300);
    if (myGeneration !== phoneGeneration) return;
    chat.innerHTML = '';
    chat.classList.remove('is-fading');
    if (statusEl) statusEl.textContent = window.I18N ? window.I18N.t('phone.online') : 'онлайн';

    for (const msg of conversation) {
      if (myGeneration !== phoneGeneration) return;
      if (msg.from === 'in') {
        await wait(900);
        if (myGeneration !== phoneGeneration) return;
        addBubble('in', msg.text);
      } else {
        await wait(700);
        if (myGeneration !== phoneGeneration) return;
        if (statusEl) statusEl.textContent = window.I18N ? window.I18N.t('phone.typing') : 'печатает…';
        const typingEl = addTyping();
        await wait(1300);
        if (myGeneration !== phoneGeneration) return;
        typingEl.remove();
        addBubble('out', msg.text);
        if (statusEl) statusEl.textContent = window.I18N ? window.I18N.t('phone.online') : 'онлайн';
      }
    }

    await wait(3500);
    if (myGeneration !== phoneGeneration) return;
    playConversation(myGeneration);
  }

  const restartConversation = () => {
    phoneGeneration++;
    if (!chat) return;
    if (reduceMotion) {
      chat.innerHTML = '';
      const conversation = window.I18N ? window.I18N.conversation() : [];
      conversation.forEach(msg => addBubble(msg.from, msg.text));
    } else {
      playConversation(phoneGeneration);
    }
  };

  if (chat) {
    restartConversation();
    document.addEventListener('algoritm:langchange', restartConversation);
  }

});
