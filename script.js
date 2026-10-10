document.body.classList.add('theme-dark');

const revealItems = document.querySelectorAll('.reveal');
const parallaxItems = document.querySelectorAll('[data-parallax]');
const yearNode = document.getElementById('year');
const dashboardPanels = document.querySelectorAll('.dashboard-window');
const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const isCoarsePointer = window.matchMedia('(pointer: coarse)').matches;

const state = {
  x: 0,
  y: 0,
};

if (yearNode) {
  yearNode.textContent = new Date().getFullYear();
}

const setRevealSequence = () => {
  revealItems.forEach((item, index) => {
    const seq = item.dataset.seq || String((index % 5) + 1);
    const dir = item.dataset.direction || ['up', 'left', 'right', 'scale'][index % 4];
    item.dataset.seq = seq;
    item.dataset.direction = dir;
    item.style.transitionDelay = `${(Number(seq) - 1) * 90}ms`;

    if (dir === 'left') {
      item.style.setProperty('--reveal-translate-x', '-42px');
    } else if (dir === 'right') {
      item.style.setProperty('--reveal-translate-x', '42px');
    } else {
      item.style.setProperty('--reveal-translate-x', '0px');
    }

    item.style.setProperty('--reveal-translate-y', dir === 'scale' ? '0px' : '52px');
  });
};

const revealObserver = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (entry.isIntersecting) {
      entry.target.classList.add('is-visible');
      revealObserver.unobserve(entry.target);
    }
  });
}, {
  threshold: 0.12,
  rootMargin: '0px 0px -8% 0px'
});

revealItems.forEach((item) => revealObserver.observe(item));
setRevealSequence();

const animateParallax = () => {
  const scrollY = window.scrollY;

  parallaxItems.forEach((item) => {
    const speed = Number(item.dataset.parallax || 0.05);
    const offset = scrollY * speed;
    item.style.setProperty('--parallax-shift', `${offset}px`);
  });

  dashboardPanels.forEach((panel) => {
    panel.style.setProperty('--dashboard-shift', `${scrollY * 0.04}px`);
  });
};

let ticking = false;

const onScroll = () => {
  if (!ticking) {
    window.requestAnimationFrame(() => {
      animateParallax();
      ticking = false;
    });
    ticking = true;
  }
};

if (!prefersReducedMotion) {
  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('load', animateParallax);
}

const pointerMove = (event) => {
  state.x = (event.clientX / window.innerWidth - 0.5) * 12;
  state.y = (event.clientY / window.innerHeight - 0.5) * 12;

  dashboardPanels.forEach((panel) => {
    panel.style.setProperty('--tilt-x', `${4 - state.y}deg`);
    panel.style.setProperty('--tilt-y', `${state.x - 8}deg`);
  });
};

if (!prefersReducedMotion && !isCoarsePointer) {
  document.addEventListener('pointermove', pointerMove);
}
