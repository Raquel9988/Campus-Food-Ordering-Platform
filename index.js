document.addEventListener('DOMContentLoaded', () => {

  // ── Hero fade-in animations ──────────────────────────────────────────────
  const targets = [
    { id: 'title', delay: 100 },
    { id: 'desc',  delay: 300 },
    { id: 'stats', delay: 500 },
  ];

  targets.forEach(({ id, delay }) => {
    setTimeout(() => {
      const el = document.getElementById(id);
      if (el) el.classList.add('show');
    }, delay);
  });

  // ── Mobile hamburger menu ────────────────────────────────────────────────
  const toggle = document.getElementById('menuToggle');
  const drawer = document.getElementById('navDrawer');

  if (toggle && drawer) {
    toggle.addEventListener('click', () => {
      const isOpen = drawer.classList.toggle('open');
      toggle.classList.toggle('open', isOpen);
      toggle.setAttribute('aria-expanded', isOpen);
    });

    // Close drawer when a nav link is tapped (good UX on mobile)
    drawer.querySelectorAll('a').forEach(link => {
      link.addEventListener('click', () => {
        drawer.classList.remove('open');
        toggle.classList.remove('open');
        toggle.setAttribute('aria-expanded', 'false');
      });
    });

    // Close drawer if viewport grows past mobile breakpoint
    const mq = window.matchMedia('(min-width: 761px)');
    mq.addEventListener('change', e => {
      if (e.matches) {
        drawer.classList.remove('open');
        toggle.classList.remove('open');
        toggle.setAttribute('aria-expanded', 'false');
      }
    });
  }

});