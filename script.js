document.documentElement.classList.add('has-js');

const menuToggle = document.querySelector('.menu-toggle');
const siteNav = document.querySelector('.site-nav');
const navLinks = [...document.querySelectorAll('.nav-link')];
const sections = [...document.querySelectorAll('main section[id]')];
const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
const wideScreen = window.matchMedia('(min-width: 761px)');
const skillsSection = document.querySelector('.skills');
const skillBars = [...document.querySelectorAll('.skill-fill')];
const projectCards = [...document.querySelectorAll('.project-card')];
const projectVisuals = [...document.querySelectorAll('.project-visual')];
const filterButtons = [...document.querySelectorAll('.filter-button')];
const progressBar = document.querySelector('.scroll-progress span');
const siteHeader = document.querySelector('.site-header');
const heroSection = document.querySelector('.hero');
const heroCopy = document.querySelector('.hero-copy');
const heroVisual = document.querySelector('.hero-visual');
const heroPhoto = document.querySelector('.photo-card');
const timeline = document.querySelector('.timeline');
const timelineItems = [...document.querySelectorAll('.timeline-item')];
const resumeCard = document.querySelector('.resume-inner');

const clamp = (value, min = 0, max = 1) => Math.min(Math.max(value, min), max);

/* ---------- Text splitting ---------- */

// Hero name: each letter sits in a clipping mask and rises into place.
const heroLines = [...document.querySelectorAll('.hero-name-line')];
let heroLetterCount = 0;

heroLines.forEach((line) => {
  const text = line.textContent.trim();
  line.replaceChildren(...Array.from(text, (character) => {
    const mask = document.createElement('span');
    mask.className = 'hero-char';
    const letter = document.createElement('span');
    letter.className = 'hero-letter';
    letter.style.setProperty('--letter-index', String(heroLetterCount));
    letter.textContent = character;
    heroLetterCount += 1;
    mask.append(letter);
    return mask;
  }));
  line.classList.add('is-split');
});

heroSection?.style.setProperty('--letter-count', String(heroLetterCount));

// Each letter paints its own slice of one shared gradient, so the name still
// reads as a single continuous gradient while letters animate independently.
const mapHeroGradient = () => {
  heroLines.forEach((line) => {
    line.style.setProperty('--line-w', `${line.offsetWidth}px`);
    line.querySelectorAll('.hero-char').forEach((mask) => {
      mask.firstChild.style.setProperty('--x', `${mask.offsetLeft - line.offsetLeft}px`);
    });
  });
};

mapHeroGradient();
document.fonts?.ready.then(mapHeroGradient);

// Splits the direct text nodes of an element into word spans, keeping <br>s.
const splitWords = (element, className) => {
  const words = [];
  [...element.childNodes].forEach((node) => {
    if (node.nodeType !== Node.TEXT_NODE) return;
    const fragment = document.createDocumentFragment();
    node.textContent.split(/(\s+)/).forEach((part) => {
      if (!part) return;
      if (/^\s+$/.test(part)) {
        fragment.append(' ');
        return;
      }
      const word = document.createElement('span');
      word.className = className;
      word.textContent = part;
      words.push(word);
      fragment.append(word);
    });
    node.replaceWith(fragment);
  });
  return words;
};

// Section headings: words slide up out of a mask when the heading reveals.
document.querySelectorAll('.section-heading h2, .resume-inner h2').forEach((heading) => {
  const label = [...heading.childNodes]
    .map((node) => (node.nodeName === 'BR' ? ' ' : node.textContent))
    .join('')
    .replace(/\s+/g, ' ')
    .trim();
  heading.setAttribute('aria-label', label);

  splitWords(heading, 'split-word').forEach((word, index) => {
    const inner = document.createElement('span');
    inner.textContent = word.textContent;
    inner.style.setProperty('--word-index', String(index));
    word.replaceChildren(inner);
    word.setAttribute('aria-hidden', 'true');
  });
});

// Statement paragraphs: words light up one by one as you scroll past.
const scrubTargets = [...document.querySelectorAll('.intro-statement, .about-copy .lead')].map((element) => ({
  element,
  words: splitWords(element, 'scrub-word'),
}));

// Children of these containers rise in one after another.
document.querySelectorAll('.about-pills, .focus-tags, .tool-list, .contact-links').forEach((group) => {
  group.classList.add('stagger');
  [...group.children].forEach((child, index) => child.style.setProperty('--i', String(index)));
});

// Marquee rows loop seamlessly by holding two copies of their content.
document.querySelectorAll('.marquee-row').forEach((row) => {
  row.append(...[...row.children].map((child) => child.cloneNode(true)));
});

/* ---------- Existing content setup ---------- */

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

const backToTop = document.createElement('a');
backToTop.className = 'back-to-top';
backToTop.href = '#home';
backToTop.setAttribute('aria-label', 'Back to top');
backToTop.textContent = '↑';
document.body.append(backToTop);

/* ---------- Scroll-linked effects ---------- */

function updateScrollEffects() {
  const viewport = window.innerHeight;
  const scrollY = window.scrollY;

  siteHeader?.classList.toggle('is-scrolled', scrollY > 20);
  backToTop.classList.toggle('is-visible', scrollY > viewport * 0.8);

  if (progressBar) {
    const scrollable = document.documentElement.scrollHeight - viewport;
    progressBar.style.width = `${scrollable > 0 ? (scrollY / scrollable) * 100 : 0}%`;
  }

  if (prefersReducedMotion) return;

  // Hero drifts up and fades as it leaves; the photo trails behind it.
  if (scrollY < viewport * 1.2) {
    const exit = clamp(scrollY / (viewport * 0.85));
    if (heroCopy) {
      const active = wideScreen.matches;
      heroCopy.style.setProperty('--hero-exit-y', active ? `${exit * -70}px` : '0px');
      heroCopy.style.setProperty('--hero-exit-o', active ? String(1 - exit * 0.65) : '1');
    }
    heroPhoto?.style.setProperty('--scroll-offset', `${exit * 48}px`);
  }

  scrubTargets.forEach(({ element, words }) => {
    const top = element.getBoundingClientRect().top;
    const progress = clamp((viewport * 0.88 - top) / (viewport * 0.5));
    const litCount = Math.round(progress * words.length);
    words.forEach((word, index) => word.classList.toggle('is-lit', index < litCount));
  });

  if (timeline) {
    const rect = timeline.getBoundingClientRect();
    const marker = viewport * 0.65;
    timeline.style.setProperty('--timeline-progress', String(clamp((marker - rect.top) / rect.height)));
    timelineItems.forEach((item) => {
      item.classList.toggle('is-active', item.getBoundingClientRect().top + 12 < marker);
    });
  }

  projectVisuals.forEach((visual) => {
    const rect = visual.getBoundingClientRect();
    if (rect.bottom < 0 || rect.top > viewport) return;
    const offset = (rect.top + rect.height / 2 - viewport / 2) / viewport;
    visual.style.setProperty('--parallax', `${clamp(offset * 36, -26, 26).toFixed(1)}px`);
  });

  if (resumeCard) {
    const top = resumeCard.getBoundingClientRect().top;
    resumeCard.style.setProperty('--cta-scale', String(0.9 + clamp((viewport - top) / (viewport * 0.6)) * 0.1));
  }
}

let scrollFrame = 0;
const requestScrollUpdate = () => {
  if (scrollFrame) return;
  scrollFrame = requestAnimationFrame(() => {
    scrollFrame = 0;
    updateScrollEffects();
  });
};

window.addEventListener('scroll', requestScrollUpdate, { passive: true });
window.addEventListener('resize', () => {
  mapHeroGradient();
  requestScrollUpdate();
});
updateScrollEffects();

if (prefersReducedMotion) {
  scrubTargets.forEach(({ words }) => words.forEach((word) => word.classList.add('is-lit')));
  timeline?.style.setProperty('--timeline-progress', '1');
  timelineItems.forEach((item) => item.classList.add('is-active'));
}

/* ---------- Navigation ---------- */

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

/* ---------- Reveal on scroll ---------- */

const revealObserver = new IntersectionObserver((entries, observer) => {
  entries.forEach((entry) => {
    if (!entry.isIntersecting) return;
    entry.target.classList.add('is-visible');
    observer.unobserve(entry.target);
  });
}, { threshold: 0.12, rootMargin: '0px 0px -6% 0px' });

document.querySelectorAll('.reveal').forEach((element) => {
  const siblings = [...element.parentElement.children].filter((sibling) => sibling.classList.contains('reveal'));
  element.style.setProperty('--reveal-delay', `${Math.min(siblings.indexOf(element), 4) * 90}ms`);
  revealObserver.observe(element);
});

if (prefersReducedMotion) {
  document.querySelectorAll('.reveal').forEach((element) => element.classList.add('is-visible'));
}

/* ---------- Skills ---------- */

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

/* ---------- Project filters ---------- */

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
    requestScrollUpdate();
  });
});

/* ---------- Pointer effects ---------- */

if (finePointer && !prefersReducedMotion) {
  // Soft spotlight that follows the cursor across cards.
  document.querySelectorAll('.skill-card, .pill, .resume-inner').forEach((card) => {
    card.addEventListener('pointermove', (event) => {
      const rect = card.getBoundingClientRect();
      card.style.setProperty('--mx', `${event.clientX - rect.left}px`);
      card.style.setProperty('--my', `${event.clientY - rect.top}px`);
    });
  });

  // Portrait tilts toward the cursor.
  heroVisual?.addEventListener('pointermove', (event) => {
    const rect = heroVisual.getBoundingClientRect();
    const x = (event.clientX - rect.left) / rect.width - 0.5;
    const y = (event.clientY - rect.top) / rect.height - 0.5;
    heroPhoto?.style.setProperty('--tilt-x', `${(y * -8).toFixed(2)}deg`);
    heroPhoto?.style.setProperty('--tilt-y', `${(x * 10).toFixed(2)}deg`);
  });

  heroVisual?.addEventListener('pointerleave', () => {
    heroPhoto?.style.setProperty('--tilt-x', '0deg');
    heroPhoto?.style.setProperty('--tilt-y', '0deg');
  });

  // Buttons lean slightly toward the cursor.
  document.querySelectorAll('.button').forEach((button) => {
    button.addEventListener('pointermove', (event) => {
      const rect = button.getBoundingClientRect();
      const x = (event.clientX - rect.left - rect.width / 2) * 0.18;
      const y = (event.clientY - rect.top - rect.height / 2) * 0.28;
      button.style.setProperty('--magnet', `${x.toFixed(1)}px ${y.toFixed(1)}px`);
    });

    button.addEventListener('pointerleave', () => button.style.setProperty('--magnet', '0px 0px'));
  });
}

const contactForm = document.querySelector('.contact-form');

contactForm?.querySelectorAll('input, textarea').forEach((field) => {
  field.addEventListener('input', () => field.setCustomValidity(''));
});

contactForm?.addEventListener('submit', (event) => {
  const invalidField = [...contactForm.querySelectorAll('input[required]:not([type="email"]), textarea[required]')]
    .find((field) => {
      const value = field.value.trim();
      return !value || (field.minLength > 0 && value.length < field.minLength) ||
        (field.maxLength >= 0 && field.value.length > field.maxLength);
    });

  if (!invalidField) return;

  event.preventDefault();
  const label = invalidField.closest('label')?.firstChild?.textContent.trim() || 'This field';
  const value = invalidField.value.trim();
  let validationMessage = `${label} cannot be blank.`;

  if (value && invalidField.minLength > 0 && value.length < invalidField.minLength) {
    validationMessage = `${label} must be at least ${invalidField.minLength} characters.`;
  } else if (value && invalidField.maxLength >= 0 && invalidField.value.length > invalidField.maxLength) {
    validationMessage = `${label} cannot exceed ${invalidField.maxLength} characters.`;
  }

  invalidField.setCustomValidity(validationMessage);
  invalidField.reportValidity();
});

document.querySelector('#current-year').textContent = new Date().getFullYear();
