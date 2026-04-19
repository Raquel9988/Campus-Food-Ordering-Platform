document.addEventListener('DOMContentLoaded', () => {
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
});
