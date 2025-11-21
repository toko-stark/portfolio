document.addEventListener('DOMContentLoaded', () => {
  const header = document.querySelector('.header');
  const sectionsAll = [...document.querySelectorAll('section')];
  sectionsAll.forEach((s) => s.classList.add('reveal'));

  const revealTargets = document.querySelectorAll('.reveal,[data-reveal]');
  const io = new IntersectionObserver(
    (entries) => {
      entries.forEach((e) => {
        if (e.isIntersecting) {
          e.target.classList.add('visible');
          io.unobserve(e.target);
        }
      });
    },
    { threshold: 0.15, rootMargin: '0px 0px -10% 0px' }
  );
  revealTargets.forEach((el) => io.observe(el));

  const links = [...document.querySelectorAll('.nav-link, .nav-menu-link')];
  const linkMap = new Map(
    links.map((l) => [l.getAttribute('href')?.slice(1), l])
  );

  function getHeaderHeight() {
    return header ? header.offsetHeight : 0;
  }

  function smoothScrollToSection(id) {
    const target = document.getElementById(id);
    if (!target) return;
    const top = target.offsetTop - getHeaderHeight() - 40;
    window.scrollTo({ top, behavior: 'smooth' });
  }

  links.forEach((link) => {
    link.addEventListener('click', (e) => {
      const href = link.getAttribute('href');
      if (href && href.startsWith('#') && href !== '#') {
        e.preventDefault();
        smoothScrollToSection(href.slice(1));
      }
    });
  });

  const idSections = [...document.querySelectorAll('section[id]')];
  let activeId = null;

  function pickActiveSection() {
    const headerH = getHeaderHeight();
    const viewportCenterY = window.scrollY + window.innerHeight / 2;

    let best = null;
    let bestDist = Infinity;

    for (const section of idSections) {
      const rect = section.getBoundingClientRect();
      const top = rect.top + window.scrollY - headerH;
      const bottom = top + rect.height;

      if (viewportCenterY >= top && viewportCenterY <= bottom) {
        best = section;
        break;
      }
      const center = top + rect.height / 2;
      const dist = Math.abs(center - viewportCenterY);
      if (dist < bestDist) {
        bestDist = dist;
        best = section;
      }
    }

    if (best && best.id !== activeId) {
      activeId = best.id;
      links.forEach((l) => l.classList.remove('active'));
      const link = linkMap.get(activeId);
      if (link) link.classList.add('active');
    }
  }

  let ticking = false;
  window.addEventListener(
    'scroll',
    () => {
      if (!ticking) {
        requestAnimationFrame(() => {
          pickActiveSection();
          ticking = false;
        });
        ticking = true;
      }
    },
    { passive: true }
  );

  window.addEventListener('resize', pickActiveSection);
  pickActiveSection();
});
