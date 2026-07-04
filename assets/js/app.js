(() => {
  const body = document.body;
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Reuses the data-reveal contract and IntersectionObserver behavior from the source system.
  const revealElements = [...document.querySelectorAll('[data-reveal]')];
  let revealObserver = null;
  const bindReveal = () => {
    if (reduceMotion || !('IntersectionObserver' in window)) {
      revealElements.forEach((el) => (el.dataset.revealed = 'true'));
      return;
    }
    revealObserver?.disconnect();
    revealObserver = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.dataset.revealed = 'true';
        revealObserver.unobserve(entry.target);
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -8% 0px' });
    revealElements.forEach((el) => {
      if (el.dataset.revealed !== 'true') revealObserver.observe(el);
    });
  };
  bindReveal();

  // Headroom navigation, retained from the Open Design interaction model.
  const chrome = document.querySelector('[data-chrome-headroom]');
  let lastY = window.scrollY;
  window.addEventListener('scroll', () => {
    const y = window.scrollY;
    const delta = y - lastY;
    if (y <= 100) chrome?.classList.remove('is-hidden');
    else if (delta > 7) chrome?.classList.add('is-hidden');
    else if (delta < -7) chrome?.classList.remove('is-hidden');
    lastY = y;
  }, { passive: true });

  // Smooth scroll and active navigation, adapted from the glass-pricing source.
  const navLinks = [...document.querySelectorAll('.ds-nav a[href^="#"]')];
  const sections = [...document.querySelectorAll('main section[id]')];
  document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
    anchor.addEventListener('click', (event) => {
      const target = document.querySelector(anchor.getAttribute('href'));
      if (!target) return;
      event.preventDefault();
      target.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'start' });
      document.querySelector('.ds-nav')?.classList.remove('menu-open');
    });
  });
  const sectionObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      navLinks.forEach((link) => link.classList.toggle('active', link.getAttribute('href') === `#${entry.target.id}`));
    });
  }, { rootMargin: '-40% 0px -52% 0px', threshold: 0 });
  sections.forEach((section) => sectionObserver.observe(section));

  // Mobile menu.
  const menuButton = document.querySelector('.menu-button');
  menuButton?.addEventListener('click', () => {
    const nav = document.querySelector('.ds-nav');
    const open = nav?.classList.toggle('menu-open');
    menuButton.setAttribute('aria-expanded', String(Boolean(open)));
  });

  // Cursor-driven ambient light.
  const cursorAura = document.querySelector('.cursor-aura');
  if (!reduceMotion && window.matchMedia('(pointer:fine)').matches) {
    window.addEventListener('pointermove', (event) => {
      if (!cursorAura) return;
      cursorAura.style.transform = `translate(${event.clientX - 260}px, ${event.clientY - 260}px)`;
    }, { passive: true });
  }

  // Surface highlight coordinates for every ds-card.
  document.querySelectorAll('.ds-card').forEach((card) => {
    card.addEventListener('pointermove', (event) => {
      const rect = card.getBoundingClientRect();
      card.style.setProperty('--mx', `${event.clientX - rect.left}px`);
      card.style.setProperty('--my', `${event.clientY - rect.top}px`);
    });
  });

  // Restrained 3D tilt for the hero composition.
  document.querySelectorAll('[data-tilt]').forEach((stage) => {
    const card = stage.querySelector('.kinetic-card');
    if (!card || reduceMotion || !window.matchMedia('(pointer:fine)').matches) return;
    stage.addEventListener('pointermove', (event) => {
      const rect = stage.getBoundingClientRect();
      const x = (event.clientX - rect.left) / rect.width - 0.5;
      const y = (event.clientY - rect.top) / rect.height - 0.5;
      card.style.transform = `rotateY(${x * 9 - 5}deg) rotateX(${-y * 7 + 2}deg) translateZ(8px)`;
    });
    stage.addEventListener('pointerleave', () => {
      card.style.transform = 'rotateY(-8deg) rotateX(2deg)';
    });
  });

  // Magnetic controls. Movement is intentionally small to preserve usability.
  if (!reduceMotion && window.matchMedia('(pointer:fine)').matches) {
    document.querySelectorAll('.magnetic').forEach((element) => {
      element.addEventListener('pointermove', (event) => {
        const rect = element.getBoundingClientRect();
        const x = event.clientX - rect.left - rect.width / 2;
        const y = event.clientY - rect.top - rect.height / 2;
        element.style.transform = `translate(${x * 0.09}px, ${y * 0.13}px)`;
      });
      element.addEventListener('pointerleave', () => {
        element.style.transform = '';
      });
    });
  }

  // Ripple feedback for all glass buttons.
  document.querySelectorAll('.glass-button').forEach((button) => {
    button.addEventListener('pointerdown', (event) => {
      if (button.disabled) return;
      const rect = button.getBoundingClientRect();
      const ripple = document.createElement('span');
      const size = Math.max(rect.width, rect.height);
      ripple.className = 'ripple';
      ripple.style.width = ripple.style.height = `${size}px`;
      ripple.style.left = `${event.clientX - rect.left - size / 2}px`;
      ripple.style.top = `${event.clientY - rect.top - size / 2}px`;
      button.append(ripple);
      ripple.addEventListener('animationend', () => ripple.remove(), { once: true });
    });
  });

  // Modal with focus return and keyboard support.
  const overlay = document.querySelector('.modal-overlay');
  const modal = overlay?.querySelector('.system-modal');
  const closeButton = overlay?.querySelector('.modal-close');
  let lastFocused = null;
  const openModal = (trigger) => {
    if (!overlay) return;
    lastFocused = trigger || document.activeElement;
    overlay.classList.add('is-open');
    overlay.setAttribute('aria-hidden', 'false');
    body.style.overflow = 'hidden';
    window.setTimeout(() => closeButton?.focus(), reduceMotion ? 0 : 180);
  };
  const closeModal = () => {
    if (!overlay) return;
    overlay.classList.remove('is-open');
    overlay.setAttribute('aria-hidden', 'true');
    body.style.overflow = '';
    if (lastFocused instanceof HTMLElement) lastFocused.focus();
  };
  document.querySelectorAll('[data-open-modal]').forEach((trigger) => trigger.addEventListener('click', () => openModal(trigger)));
  closeButton?.addEventListener('click', closeModal);
  overlay?.querySelector('.modal-confirm')?.addEventListener('click', closeModal);
  overlay?.addEventListener('pointerdown', (event) => {
    if (event.target === overlay) closeModal();
  });
  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && overlay?.classList.contains('is-open')) closeModal();
    if (event.key !== 'Tab' || !overlay?.classList.contains('is-open') || !modal) return;
    const focusable = [...modal.querySelectorAll('button, a, input, [tabindex]:not([tabindex="-1"])')].filter((el) => !el.disabled);
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus(); }
    if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus(); }
  });

  // Clipboard helpers for color tokens and icon names.
  const toast = document.querySelector('.toast');
  let toastTimer = null;
  const showToast = (text) => {
    const label = toast?.querySelector('span');
    if (label) label.textContent = `${text} copiado`;
    toast?.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toast?.classList.remove('show'), 1700);
  };
  document.querySelectorAll('[data-copy]').forEach((item) => {
    item.addEventListener('click', async () => {
      const value = item.dataset.copy;
      try {
        await navigator.clipboard.writeText(value);
      } catch {
        const temp = document.createElement('textarea');
        temp.value = value;
        document.body.append(temp);
        temp.select();
        document.execCommand('copy');
        temp.remove();
      }
      showToast(value);
    });
  });

  // Motion pause control.
  const motionToggle = document.querySelector('#motion-toggle');
  motionToggle?.addEventListener('click', () => {
    const paused = body.classList.toggle('motion-paused');
    motionToggle.setAttribute('aria-pressed', String(paused));
    motionToggle.setAttribute('aria-label', paused ? 'Retomar animações' : 'Pausar animações');
  });

  // Replay all reveal entrances without reloading the page.
  document.querySelector('#replay-motion')?.addEventListener('click', () => {
    revealElements.forEach((el) => delete el.dataset.revealed);
    bindReveal();
    window.scrollTo({ top: document.querySelector('#motion').offsetTop - 70, behavior: reduceMotion ? 'auto' : 'smooth' });
  });
})();
