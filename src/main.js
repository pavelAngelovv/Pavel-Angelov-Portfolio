import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { SplitText } from 'gsap/SplitText';
import { ScrambleTextPlugin } from 'gsap/ScrambleTextPlugin';
import { MotionPathPlugin } from 'gsap/MotionPathPlugin';
import Lenis from 'lenis';
import 'lenis/dist/lenis.css';
import './style.css';

gsap.registerPlugin(ScrollTrigger, SplitText, ScrambleTextPlugin, MotionPathPlugin);

const $ = (s, root = document) => root.querySelector(s);
const $$ = (s, root = document) => [...root.querySelectorAll(s)];

const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const finePointer = window.matchMedia('(pointer: fine)').matches;
const ACCENT = '#ff5a1f';

/* ---------- Always-on bits ---------- */

function startClock() {
  const fmt = new Intl.DateTimeFormat('en-GB', { hour: '2-digit', minute: '2-digit', timeZone: 'Europe/Sofia' });
  const tick = () => $$('.js-clock').forEach((el) => (el.textContent = fmt.format(new Date())));
  tick();
  setInterval(tick, 15000);
}

function setupCopyEmail() {
  const btn = $('[data-copy]');
  const hint = $('.footer__email-hint', btn);
  btn.addEventListener('click', async () => {
    try {
      await navigator.clipboard.writeText(btn.dataset.copy);
    } catch {
      window.location.href = `mailto:${btn.dataset.copy}`;
      return;
    }
    gsap.to(hint, { duration: 0.6, scrambleText: { text: 'Copied to clipboard ✓', chars: '01' } });
    gsap.to(hint, { delay: 2.4, duration: 0.6, scrambleText: { text: 'Click to copy', chars: '01' } });
  });
}

// Theatre seat map: curved rows that get wider toward the back, with an aisle.
function buildSeats() {
  const map = $('.seats__map');
  const rows = [12, 14, 16, 18, 18, 20, 20, 22];
  rows.forEach((count, r) => {
    const row = document.createElement('div');
    row.className = 'seats__row';
    const mid = (count - 1) / 2;
    for (let i = 0; i < count; i++) {
      const seat = document.createElement('span');
      seat.className = 'seat';
      if (i === Math.floor(count / 2)) seat.classList.add('gap');
      const d = (i - mid) / mid;
      seat.style.transform = `translateY(${-d * d * (6 + r)}px)`;
      row.appendChild(seat);
    }
    map.appendChild(row);
  });
}

/* ---------- Smooth scroll ---------- */

let lenis = null;

function setupLenis() {
  lenis = new Lenis({ lerp: 0.09, wheelMultiplier: 1 });
  lenis.on('scroll', ScrollTrigger.update);
  gsap.ticker.add((t) => lenis.raf(t * 1000));
  gsap.ticker.lagSmoothing(0);
}

function setupAnchors() {
  $$('[data-link]').forEach((a) =>
    a.addEventListener('click', (e) => {
      const target = $(a.getAttribute('href'));
      if (!target) return;
      e.preventDefault();
      if (lenis) lenis.scrollTo(a.getAttribute('href') === '#top' ? 0 : target, { duration: 1.8 });
      else target.scrollIntoView();
    })
  );
}

/* ---------- Cursor & magnetic ---------- */

function setupCursor() {
  const cursor = $('.cursor');
  const label = $('.cursor__label');
  const xTo = gsap.quickTo(cursor, 'x', { duration: 0.35, ease: 'power3' });
  const yTo = gsap.quickTo(cursor, 'y', { duration: 0.35, ease: 'power3' });

  window.addEventListener('pointermove', (e) => {
    gsap.to(cursor, { opacity: 1, duration: 0.3, overwrite: 'auto' });
    xTo(e.clientX);
    yTo(e.clientY);
  });
  document.addEventListener('pointerleave', () => gsap.to(cursor, { opacity: 0, duration: 0.3 }));

  const grow = (size, text = '') => {
    cursor.classList.toggle('is-label', !!text);
    if (text) label.textContent = text;
    gsap.to(cursor, { width: size, height: size, margin: -size / 2, duration: 0.4, ease: 'power3.out' });
    gsap.to(label, { opacity: text ? 1 : 0, duration: 0.2 });
  };

  $$('a, button').forEach((el) => {
    el.addEventListener('pointerenter', () => (el.dataset.cursor ? grow(76, el.dataset.cursor) : grow(44)));
    el.addEventListener('pointerleave', () => grow(14));
  });
}

function setupMagnetic() {
  $$('[data-magnetic]').forEach((el) => {
    const xTo = gsap.quickTo(el, 'x', { duration: 0.6, ease: 'power3' });
    const yTo = gsap.quickTo(el, 'y', { duration: 0.6, ease: 'power3' });
    el.addEventListener('pointermove', (e) => {
      const r = el.getBoundingClientRect();
      xTo((e.clientX - (r.left + r.width / 2)) * 0.35);
      yTo((e.clientY - (r.top + r.height / 2)) * 0.35);
    });
    el.addEventListener('pointerleave', () => {
      gsap.to(el, { x: 0, y: 0, duration: 1, ease: 'elastic.out(1, 0.35)' });
    });
  });
}

/* ---------- Loader ---------- */

function runLoader() {
  const loader = $('.loader');
  const count = $('.loader__count');
  const words = $$('.loader__word');
  const counter = { v: 0 };

  document.body.classList.add('is-loading');
  lenis?.stop();
  gsap.set(words, { y: 0, yPercent: 110 });

  const tl = gsap.timeline();
  tl.to(counter, { v: 100, duration: 2.4, ease: 'power3.inOut', onUpdate: () => (count.textContent = Math.round(counter.v)) }, 0)
    .to('.loader__bar span', { scaleX: 1, duration: 2.4, ease: 'power3.inOut' }, 0);

  words.forEach((w, i) => {
    tl.to(w, { yPercent: 0, duration: 0.6, ease: 'expo.out' }, 0.15 + i * 0.7);
    if (i < words.length - 1) tl.to(w, { yPercent: -110, duration: 0.5, ease: 'expo.in' }, 0.15 + i * 0.7 + 0.45);
  });

  tl.to('.loader__words, .loader__bottom, .loader__top', { yPercent: -40, opacity: 0, duration: 0.6, ease: 'power3.in' }, '+=0.15')
    .to(loader, { clipPath: 'inset(0% 0% 100% 0%)', duration: 1.1, ease: 'expo.inOut' }, '-=0.3')
    .add(() => {
      loader.remove();
      document.body.classList.remove('is-loading');
      lenis?.start();
    });

  return tl;
}

/* ---------- Hero ---------- */

function heroIntro() {
  const split = SplitText.create('.hero__line', { type: 'chars,lines', linesClass: 'ln', mask: 'lines' });
  const lede = SplitText.create('.hero__lede', { type: 'lines', linesClass: 'ln', mask: 'lines' });

  const tl = gsap.timeline({ paused: true });
  tl.from(split.chars, { yPercent: 120, rotate: 6, duration: 1.4, ease: 'expo.out', stagger: 0.04 })
    .from('.hero__eyebrow-line', { scaleX: 0, duration: 1, ease: 'expo.out' }, 0.3)
    .from('.hero__eyebrow', { opacity: 0, x: -20, duration: 1, ease: 'expo.out' }, 0.3)
    .from(lede.lines, { yPercent: 110, duration: 1.1, ease: 'expo.out', stagger: 0.08 }, 0.5)
    .from('.hero__tags li', { opacity: 0, y: 20, duration: 0.8, ease: 'expo.out', stagger: 0.06 }, 0.6)
    .from('.hero__badge', { scale: 0, rotate: -180, duration: 1.4, ease: 'expo.out' }, 0.5)
    .from('.hero__glow', { scale: 0.3, opacity: 0, duration: 2, ease: 'expo.out' }, 0)
    .from('.nav', { yPercent: -100, opacity: 0, duration: 1, ease: 'expo.out' }, 0.6);
  return tl;
}

function heroScroll() {
  gsap.to('.hero__badge text', { rotation: 360, svgOrigin: '100 100', duration: 18, repeat: -1, ease: 'none' });

  gsap.timeline({ scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true } })
    .to('.hero__line--a', { xPercent: -28, ease: 'none' }, 0)
    .to('.hero__line--b', { xPercent: 22, ease: 'none' }, 0)
    .to('.hero__foot', { yPercent: 60, opacity: 0, ease: 'none' }, 0)
    .to('.hero__glow-wrap', { scale: 1.8, opacity: 0, ease: 'none' }, 0)
    .to('.hero__badge-wrap', { y: 200, scale: 0.6, ease: 'none' }, 0);

  if (finePointer) {
    const glow = $('.hero__glow');
    const xTo = gsap.quickTo(glow, 'x', { duration: 1.6, ease: 'power3' });
    const yTo = gsap.quickTo(glow, 'y', { duration: 1.6, ease: 'power3' });
    $('.hero').addEventListener('pointermove', (e) => {
      xTo((e.clientX - window.innerWidth / 2) * 0.4);
      yTo((e.clientY - window.innerHeight / 2) * 0.4);
    });
  }
}

/* ---------- Manifesto: words light up as you read ---------- */

function manifesto() {
  const split = SplitText.create('.manifesto__text', { type: 'words' });
  gsap.set(split.words, { opacity: 0.12 });
  gsap.timeline({
    scrollTrigger: { trigger: '.manifesto', start: 'top top', end: '+=140%', pin: true, scrub: 0.6 },
  })
    .to(split.words, { opacity: 1, stagger: 0.1, ease: 'none' });
}

/* ---------- Marquee: speed and direction follow scroll velocity ---------- */

function marquee() {
  const rows = $$('.marquee__row').map((row) => {
    const inner = $('.marquee__inner', row);
    const track = document.createElement('div');
    track.className = 'marquee__track';
    const clone = inner.cloneNode(true);
    clone.setAttribute('aria-hidden', 'true');
    track.append(inner, clone);
    row.appendChild(track);
    return { row, track, dir: Number(row.dataset.dir), x: Number(row.dataset.dir) > 0 ? 0 : -50 };
  });

  const wrap = gsap.utils.wrap(-50, 0);
  let scrollDir = 1;
  let boost = 0;

  ScrollTrigger.create({
    trigger: '.marquee',
    start: 'top bottom',
    end: 'bottom top',
    onUpdate(self) {
      scrollDir = self.direction;
      boost = Math.max(boost, Math.min(Math.abs(self.getVelocity()) / 2500, 1.2));
    },
  });

  gsap.ticker.add((_, dt) => {
    boost += (0 - boost) * 0.05;
    rows.forEach((r) => {
      r.x = wrap(r.x - r.dir * scrollDir * (0.012 + boost * 0.25) * (dt / 16));
      gsap.set(r.track, { xPercent: r.x });
      gsap.set(r.row, { skewX: -r.dir * scrollDir * boost * 10 });
    });
  });

  gsap.from('.marquee__row', {
    xPercent: (i) => (i ? 20 : -20),
    opacity: 0,
    ease: 'none',
    scrollTrigger: { trigger: '.marquee', start: 'top bottom', end: 'top 40%', scrub: true },
  });
}

/* ---------- Work: pinned horizontal track with scene-per-project ---------- */

// Each project's visual is its own little scrubbed scene. `st` supplies the trigger config,
// so the same scene runs on the horizontal track (desktop) or vertically (mobile).
function touchupScene(panel, st) {
  const typed = $('.tu__typed', panel);
  const full = typed.dataset.text;
  const rows = $$('.tu__rows li', panel);
  const sum = $('.tu__sum', panel);
  const toggleSpans = $$('.tu__toggle span', panel);
  const priceVal = $('.tu__price-val', panel);
  const scrambles = $$('[data-scramble]', panel);
  scrambles.forEach((el) => (el.textContent = ''));
  typed.textContent = '';

  const proxy = { t: 0, sum: 0, plan: 0 };
  const tl = gsap.timeline({ scrollTrigger: st(panel) });

  tl.from($('.tu', panel), { y: 80, rotate: 3, opacity: 0, duration: 0.6, ease: 'power2.out' })
    .to(proxy, { t: full.length, duration: 1.2, ease: 'none', onUpdate: () => (typed.textContent = full.slice(0, Math.round(proxy.t))) })
    .from($('.tu__spark', panel), { opacity: 0, x: -20, duration: 0.3 });

  rows.forEach((row, i) => {
    const [label, price] = $$('[data-scramble]', row);
    tl.from(row, { opacity: 0, y: 14, duration: 0.25 }, `>-0.05`)
      .to(label, { duration: 0.5, scrambleText: { text: label.dataset.scramble, chars: 'lowerCase', speed: 0.6 } }, '<')
      .to(price, { duration: 0.5, scrambleText: { text: price.dataset.scramble, chars: '0123456789', speed: 0.6 } }, '<');
  });

  tl.to(proxy, {
    sum: 6150,
    duration: 0.7,
    ease: 'power1.out',
    onUpdate: () => (sum.textContent = Math.round(proxy.sum).toLocaleString('en-US')),
  })
    .to($('.tu__toggle i', panel), { xPercent: 100, duration: 0.4, ease: 'power2.inOut' })
    .to(proxy, {
      plan: 1,
      duration: 0.4,
      onUpdate: () => {
        const annual = proxy.plan > 0.5;
        toggleSpans[0].classList.toggle('is-on', !annual);
        toggleSpans[1].classList.toggle('is-on', annual);
        priceVal.textContent = annual ? 'Annual plan' : 'Monthly plan';
      },
    }, '<');
  return tl;
}

function pernikScene(panel, st) {
  const seats = $$('.seat:not(.gap)', panel);
  const sold = gsap.utils.shuffle([...seats]).slice(0, Math.round(seats.length * 0.72));
  const countEl = $('.seats__count b', panel);
  const proxy = { n: 0 };
  let shown = 0;

  const tl = gsap.timeline({ scrollTrigger: st(panel) });
  tl.from($('.seats__stage', panel), { scaleX: 0, opacity: 0, duration: 0.4 })
    .from($$('.seats__row', panel), { opacity: 0, y: 30, stagger: 0.05, duration: 0.4 }, '<0.1')
    .to(proxy, {
      n: sold.length,
      duration: 2,
      ease: 'none',
      onUpdate: () => {
        const n = Math.round(proxy.n);
        if (n === shown) return;
        sold.forEach((s, i) => s.classList.toggle('is-sold', i < n));
        shown = n;
        countEl.textContent = n;
      },
    })
    .fromTo($('.ticket__paper', panel), { clipPath: 'inset(0% 0% 100% 0%)', yPercent: -40 }, { clipPath: 'inset(0% 0% 0% 0%)', yPercent: 0, duration: 0.8, ease: 'none' }, '-=0.5');
  return tl;
}

function niamScene(panel, st) {
  const msgs = $$('.chat > .msg', panel);
  const typing = $('.typing', panel);
  const ticks = $$('.ticks', panel);
  const status = $('.phone__status', panel);

  const tl = gsap.timeline({ scrollTrigger: st(panel) });
  tl.from($('.phone', panel), { y: 120, rotate: -4, opacity: 0, duration: 0.6, ease: 'power2.out' });

  const pop = (el) => tl.from(el, { opacity: 0, y: 20, scale: 0.85, transformOrigin: el.classList.contains('msg--in') ? 'left bottom' : 'right bottom', duration: 0.3 });
  pop(msgs[0]);
  pop(msgs[1]);
  tl.to(ticks[0], { color: '#1a73e8', duration: 0.1 });
  pop(msgs[2]);
  pop(msgs[3]);
  tl.to(ticks[1], { color: '#0c0c0d', duration: 0.1 })
    .fromTo(typing, { opacity: 0, scale: 0.6 }, {
      opacity: 1, scale: 1, transformOrigin: 'left bottom', duration: 0.2,
      onUpdate() { status.textContent = this.progress() > 0.5 ? 'typing…' : 'online'; },
    })
    .to(typing, {
      opacity: 0, height: 0, paddingTop: 0, paddingBottom: 0, marginTop: -8, duration: 0.25, delay: 0.3,
      onUpdate() { status.textContent = this.progress() < 0.5 ? 'typing…' : 'online'; },
    });
  pop(msgs[4]);
  tl.from($('.phone__flag', panel), { opacity: 0, x: -40, duration: 0.3 });
  return tl;
}

function taxiScene(panel, st) {
  const route = $('.route__path', panel);
  const len = route.getTotalLength();
  const langs = $$('.fare__langs span', panel);
  const label = $('.fare__label', panel);
  // The fare card cycles through the site's languages as the taxi drives.
  const copy = ['35 km · fixed price', '35 km · Festpreis', '35 km · stała cena', '35 km · pevná cena', '35 km · preț fix'];
  const proxy = { lang: 0 };

  const tl = gsap.timeline({ scrollTrigger: st(panel) });
  const coast = $('.route__coast', panel);
  const coastLen = coast.getTotalLength();
  tl.fromTo(coast, { strokeDasharray: `${coastLen} ${coastLen}`, strokeDashoffset: coastLen }, { strokeDashoffset: 0, duration: 0.6, ease: 'none' })
    .from($$('.pin', panel), { opacity: 0, scale: 0, transformOrigin: 'center', stagger: 0.04, duration: 0.3 }, '<0.1')
    .fromTo(route, { strokeDashoffset: len, strokeDasharray: `${len} ${len}` }, { strokeDashoffset: 0, duration: 1, ease: 'none' })
    .fromTo($('.route__car', panel), { opacity: 0 }, {
      opacity: 1, duration: 1, ease: 'power1.inOut',
      motionPath: { path: route, align: route, alignOrigin: [0.5, 0.5] },
    }, '<')
    .from($('.fare', panel), { y: 40, opacity: 0, duration: 0.4 }, '-=0.4')
    .to(proxy, {
      lang: langs.length - 1,
      duration: 1.2,
      ease: 'none',
      onUpdate: () => {
        const i = Math.round(proxy.lang);
        langs.forEach((l, j) => l.classList.toggle('is-on', j === i));
        label.textContent = copy[i];
      },
    });
  return tl;
}

function clientsScene(panel, st) {
  return gsap.timeline({ scrollTrigger: st(panel) })
    .from($$('.clients__list li', panel), { xPercent: 40, opacity: 0, stagger: 0.15, duration: 0.6, ease: 'power2.out' });
}

function panelCopyReveal(panel, trigger) {
  const title = $('.panel__title', panel);
  const split = SplitText.create(title, { type: 'lines,words', linesClass: 'ln', mask: 'lines' });
  gsap.timeline({ scrollTrigger: { ...trigger, toggleActions: 'play none none reverse' } })
    .from(split.words, { yPercent: 110, duration: 1, ease: 'expo.out', stagger: 0.05 })
    .from($$('.panel__meta, .panel__sub, .panel__list li, .chips li, .panel__link', panel), { opacity: 0, y: 24, duration: 0.8, ease: 'expo.out', stagger: 0.04 }, 0.15);
}

const SCENES = { touchup: touchupScene, pernik: pernikScene, niam: niamScene, taxi: taxiScene };

function work() {
  const workTitle = SplitText.create('.work__title', { type: 'lines,words', linesClass: 'ln', mask: 'lines' });
  gsap.from(workTitle.words, {
    yPercent: 110, duration: 1.2, ease: 'expo.out', stagger: 0.06,
    scrollTrigger: { trigger: '.work', start: 'top 70%', toggleActions: 'play none none reverse' },
  });

  const projects = $$('.panel--project');
  const clients = $('.panel--clients');
  const mm = gsap.matchMedia();

  mm.add('(min-width: 901px)', () => {
    const track = $('.work__track');
    const distance = () => track.scrollWidth - window.innerWidth;
    const horizontal = gsap.to(track, {
      x: () => -distance(),
      ease: 'none',
      scrollTrigger: { trigger: '.work', start: 'top top', end: () => `+=${distance()}`, pin: true, scrub: 1, invalidateOnRefresh: true, anticipatePin: 1 },
    });
    gsap.to('.work__progress span', {
      scaleX: 1, ease: 'none',
      scrollTrigger: { trigger: '.work', start: 'top top', end: () => `+=${distance()}`, scrub: true, invalidateOnRefresh: true },
    });

    const st = (panel) => ({ trigger: panel, containerAnimation: horizontal, start: 'left 70%', end: 'right 95%', scrub: 1 });

    projects.forEach((panel) => {
      SCENES[panel.dataset.project](panel, st);
      panelCopyReveal(panel, { trigger: panel, containerAnimation: horizontal, start: 'left 60%' });
    });
    clientsScene(clients, (p) => ({ trigger: p, containerAnimation: horizontal, start: 'left 90%', end: 'left 20%', scrub: 1 }));
    panelCopyReveal(clients, { trigger: clients, containerAnimation: horizontal, start: 'left 70%' });

    $$('.panel__num').forEach((num) =>
      gsap.fromTo(num, { xPercent: 40 }, {
        xPercent: -40, ease: 'none',
        scrollTrigger: { trigger: num.parentElement, containerAnimation: horizontal, start: 'left right', end: 'right left', scrub: true },
      })
    );

    // The intro headline drifts left faster than the track for a parallax hand-off.
    gsap.to('.panel--intro .work__title', {
      xPercent: -30, opacity: 0.2, ease: 'none',
      scrollTrigger: { trigger: '.panel--intro', containerAnimation: horizontal, start: 'left left', end: 'right left', scrub: true },
    });
  });

  mm.add('(max-width: 900px)', () => {
    const st = (panel) => ({ trigger: $('.panel__visual', panel) || panel, start: 'top 85%', end: 'bottom 55%', scrub: 1 });
    projects.forEach((panel) => {
      SCENES[panel.dataset.project](panel, st);
      panelCopyReveal(panel, { trigger: panel, start: 'top 75%' });
    });
    clientsScene(clients, (p) => ({ trigger: p, start: 'top 80%', end: 'center 60%', scrub: 1 }));
    panelCopyReveal(clients, { trigger: clients, start: 'top 75%' });
  });
}

/* ---------- Stats ---------- */

function stats() {
  $$('.stat').forEach((stat, i) => {
    const num = $('b', stat);
    const proxy = { v: 0 };
    gsap.timeline({ scrollTrigger: { trigger: '.stats', start: 'top 80%', toggleActions: 'play none none reverse' } })
      .from(stat, { y: 60, opacity: 0, duration: 1, ease: 'expo.out', delay: i * 0.08 })
      .to(proxy, { v: +num.dataset.count, duration: 1.6, ease: 'power3.out', onUpdate: () => (num.textContent = Math.round(proxy.v)) }, '<');
  });
}

/* ---------- Section titles ---------- */

function titles() {
  $$('[data-reveal]').forEach((el) => {
    const split = SplitText.create(el, { type: 'lines,chars', linesClass: 'ln', mask: 'lines' });
    gsap.from(split.chars, {
      yPercent: 115, rotate: 8, duration: 1.2, ease: 'expo.out', stagger: 0.025,
      scrollTrigger: { trigger: el, start: 'top 85%', toggleActions: 'play none none reverse' },
    });
  });
  $$('.label').forEach((el) =>
    gsap.from(el, { opacity: 0, x: -24, duration: 1, ease: 'expo.out', scrollTrigger: { trigger: el, start: 'top 90%' } })
  );
}

/* ---------- Experience: stacked sticky cards ---------- */

function experience() {
  const cards = $$('.card');
  cards.forEach((card, i) => {
    gsap.from($$('.card__top, .card__role, .card__co, .card__list li', card), {
      y: 40, opacity: 0, duration: 1, ease: 'expo.out', stagger: 0.06,
      scrollTrigger: { trigger: card, start: 'top 75%', toggleActions: 'play none none reverse' },
    });
    const next = cards[i + 1];
    if (!next) return;
    gsap.to(card, {
      scale: 0.9, yPercent: -4, '--dim': 0.55, ease: 'none',
      scrollTrigger: { trigger: next, start: 'top bottom', end: 'top 14%', scrub: true },
    });
  });
  $$('.card__idx').forEach((idx) =>
    gsap.from(idx, { yPercent: 60, ease: 'none', scrollTrigger: { trigger: idx.parentElement, start: 'top bottom', end: 'top 14%', scrub: true } })
  );
}

/* ---------- Stack ---------- */

function stack() {
  gsap.from('.skill', {
    y: 80, opacity: 0, duration: 1, ease: 'expo.out', stagger: { each: 0.07, grid: 'auto', from: 'start' },
    scrollTrigger: { trigger: '.stack__grid', start: 'top 80%', toggleActions: 'play none none reverse' },
  });
  $$('[data-scramble-title]').forEach((h, i) => {
    const text = h.textContent;
    ScrollTrigger.create({
      trigger: '.stack__grid',
      start: 'top 80%',
      onEnter: () => gsap.to(h, { delay: 0.2 + i * 0.07, duration: 1, scrambleText: { text, chars: 'upperCase', revealDelay: 0.3 } }),
    });
  });
  $$('.skill').forEach((card) =>
    card.addEventListener('pointermove', (e) => {
      const r = card.getBoundingClientRect();
      card.style.setProperty('--x', `${e.clientX - r.left}px`);
      card.style.setProperty('--y', `${e.clientY - r.top}px`);
    })
  );
  gsap.from('.creds > div', {
    y: 40, opacity: 0, duration: 1, ease: 'expo.out', stagger: 0.1,
    scrollTrigger: { trigger: '.creds', start: 'top 85%' },
  });
}

/* ---------- Footer curtain ---------- */

function footer() {
  const lines = $$('.footer__line');
  gsap.timeline({ scrollTrigger: { trigger: '.footer', start: 'top bottom', end: 'bottom bottom', scrub: true } })
    .from(lines[0], { xPercent: -18, ease: 'none' }, 0)
    .from(lines[1], { xPercent: 14, ease: 'none' }, 0)
    .from('.footer__cta', { scale: 0.3, rotate: -90, ease: 'none' }, 0)
    .from('.footer__links', { y: 80, opacity: 0, ease: 'none' }, 0.2);
  // As the curtain lifts, main's bottom edge rounds off.
  gsap.to('main', {
    borderBottomLeftRadius: 48, borderBottomRightRadius: 48, ease: 'none',
    scrollTrigger: { trigger: '.footer', start: 'top bottom', end: 'top 50%', scrub: true },
  });
}

/* ---------- Global chrome ---------- */

function chrome() {
  gsap.to('.progress span', { scaleX: 1, ease: 'none', scrollTrigger: { start: 0, end: 'max', scrub: 0.3 } });

  let hidden = false;
  ScrollTrigger.create({
    start: 0,
    end: 'max',
    onUpdate(self) {
      const hide = self.direction === 1 && self.scroll() > 300;
      if (hide === hidden) return;
      hidden = hide;
      gsap.to('.nav', { yPercent: hide ? -120 : 0, duration: 0.5, ease: 'power3.out', overwrite: 'auto' });
    },
  });
}

/* ---------- Boot ---------- */

startClock();
setupCopyEmail();
buildSeats();

if (reduceMotion) {
  $('.loader').remove();
  $$('[data-scramble]').forEach((el) => (el.textContent = el.dataset.scramble));
  $('.tu__typed').textContent = $('.tu__typed').dataset.text;
  $('.tu__sum').textContent = '6,150';
  setupAnchors();
} else {
  setupLenis();
  setupAnchors();
  if (finePointer) {
    setupCursor();
    setupMagnetic();
  }
  const loader = runLoader();

  document.fonts.ready.then(() => {
    const intro = heroIntro();
    heroScroll();
    manifesto();
    marquee();
    work();
    stats();
    titles();
    experience();
    stack();
    footer();
    chrome();
    ScrollTrigger.refresh();
    // Start the hero reveal as the loader curtain lifts.
    loader.add(() => intro.play(), '-=1.05');
    if (!loader.isActive() && loader.progress() === 1) intro.play();
  });
}
