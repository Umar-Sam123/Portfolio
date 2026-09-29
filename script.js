document.documentElement.classList.add('has-js');

const menuToggle = document.querySelector('.menu-toggle');
const siteNav = document.querySelector('.site-nav');
const navLinks = [...document.querySelectorAll('.nav-link')];
const sections = [...document.querySelectorAll('main section[id]')];
const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const skillsSection = document.querySelector('.skills');
const skillBars = [...document.querySelectorAll('.skill-fill')];
const projectCards = [...document.querySelectorAll('.project-card')];
const filterButtons = [...document.querySelectorAll('.filter-button')];
const progressBar = document.querySelector('.scroll-progress span');
const siteHeader = document.querySelector('.site-header');
const heroPhoto = document.querySelector('.photo-card');

projectCards.forEach((card, index) => {
  const number = String(index + 1).padStart(2, '0');
  card.querySelector('.project-number').textContent = number;

  const projectTag = card.querySelector('.project-tag');
  if (projectTag && !card.classList.contains('featured')) {
    projectTag.textContent = `PROJECT ${number}`;
  }
});

skillBars.forEach((bar) => {
  bar.style.width = '0%';
  bar.setAttribute('aria-valuenow', '0');
  bar.closest('.skill-item').querySelector('.skill-value').textContent = '0%';
});

const setHeaderState = () => {
  siteHeader?.classList.toggle('is-scrolled', window.scrollY > 20);
};

window.addEventListener('scroll', () => {
  setHeaderState();
  if (progressBar) {
    const scrollable = document.documentElement.scrollHeight - window.innerHeight;
    const progress = scrollable > 0 ? (window.scrollY / scrollable) * 100 : 0;
    progressBar.style.width = `${progress}%`;
  }

  const backToTopVisible = window.scrollY > window.innerHeight * 0.8;
  backToTop.classList.toggle('is-visible', backToTopVisible);

  if (!prefersReducedMotion && heroPhoto && window.scrollY < window.innerHeight) {
    heroPhoto.style.setProperty('--scroll-offset', `${Math.min(window.scrollY * 0.025, 12)}px`);
  }
}, { passive: true });
setHeaderState();

menuToggle?.addEventListener('click', () => {
  const isOpen = siteNav.classList.toggle('is-open');
  menuToggle.setAttribute('aria-expanded', String(isOpen));
});

navLinks.forEach((link) => {
  link.addEventListener('click', () => {
    siteNav?.classList.remove('is-open');
    menuToggle?.setAttribute('aria-expanded', 'false');
  });
});

const sectionObserver = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (!entry.isIntersecting) return;
    const activeId = entry.target.id;
    navLinks.forEach((link) => {
      link.classList.toggle('is-active', link.getAttribute('href') === `#${activeId}`);
    });
  });
}, { rootMargin: '-20% 0px -60% 0px' });

sections.forEach((section) => sectionObserver.observe(section));

const revealObserver = new IntersectionObserver((entries, observer) => {
  entries.forEach((entry) => {
    if (!entry.isIntersecting) return;
    entry.target.classList.add('is-visible');
    observer.unobserve(entry.target);
  });
}, { threshold: 0.12 });

document.querySelectorAll('.reveal').forEach((element) => revealObserver.observe(element));

function animateSkillBars() {
  skillBars.forEach((bar, index) => {
    const targetValue = Number(bar.dataset.value);
    const valueLabel = bar.closest('.skill-item').querySelector('.skill-value');
    const delay = index * 20;

    if (prefersReducedMotion) {
      bar.style.width = `${targetValue}%`;
      bar.setAttribute('aria-valuenow', String(targetValue));
      valueLabel.textContent = `${targetValue}%`;
      return;
    }

    bar.style.transitionDelay = `${delay}ms`;
    bar.style.width = `${targetValue}%`;
    const animationStart = performance.now() + delay;
    const duration = 1200;

    const updateValue = (currentTime) => {
      if (currentTime < animationStart) {
        requestAnimationFrame(updateValue);
        return;
      }

      const progress = Math.min((currentTime - animationStart) / duration, 1);
      const currentValue = Math.round(progress * targetValue);
      valueLabel.textContent = `${currentValue}%`;
      bar.setAttribute('aria-valuenow', String(currentValue));

      if (progress < 1) requestAnimationFrame(updateValue);
    };

    requestAnimationFrame(updateValue);
  });
}

if (skillsSection && skillBars.length) {
  const skillsObserver = new IntersectionObserver(([entry], observer) => {
    if (!entry.isIntersecting) return;
    animateSkillBars();
    observer.unobserve(skillsSection);
  }, { threshold: 0.2 });

  skillsObserver.observe(skillsSection);
}

filterButtons.forEach((button) => {
  button.addEventListener('click', () => {
    const filterValue = button.dataset.filter;
    filterButtons.forEach((item) => {
      const isActive = item === button;
      item.classList.toggle('is-active', isActive);
      item.setAttribute('aria-pressed', String(isActive));
    });

    projectCards.forEach((card) => {
      const categories = card.dataset.category || '';
      const matches = filterValue === 'all' || categories.includes(filterValue);
      card.classList.toggle('is-hidden', !matches);
    });
  });
});

document.querySelector('#current-year').textContent = new Date().getFullYear();

const backToTop = document.createElement('a');
backToTop.className = 'back-to-top';
backToTop.href = '#home';
backToTop.setAttribute('aria-label', 'Back to top');
backToTop.textContent = '↑';
document.body.append(backToTop);

backToTop.classList.toggle('is-visible', window.scrollY > window.innerHeight * 0.8);

if (prefersReducedMotion) {
  document.querySelectorAll('.reveal').forEach((element) => element.classList.add('is-visible'));
}
