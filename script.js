import Lenis from "lenis";
import "lenis/dist/lenis.css";

const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

// smooth scroll (wheel/trackpad - touch devices keep their native momentum scrolling)
const lenis = reduceMotion ? null : new Lenis({ lerp: 0.08, autoRaf: true });

function scrollToEl(target) {
  if (lenis) lenis.scrollTo(target, { duration: 1.4 });
  else target.scrollIntoView();
}

// navbar: hide on scroll down, show on scroll up
const nav = document.querySelector("nav");
let lastY = window.scrollY;
let ticking = false;

new ResizeObserver(() => {
  document.documentElement.style.setProperty("--nav-h", `${nav.offsetHeight}px`);
}).observe(nav);

function updateNav() {
  const y = window.scrollY;
  const delta = y - lastY;

  if (y <= nav.offsetHeight) {
    nav.classList.remove("nav-hidden"); // always visible near the top
  } else if (delta > 6) {
    nav.classList.add("nav-hidden");
  } else if (delta < -6) {
    nav.classList.remove("nav-hidden");
  }
  nav.classList.toggle("nav-scrolled", y > 10);

  if (Math.abs(delta) > 6) lastY = y;
  ticking = false;
}

window.addEventListener("scroll", () => {
  if (!ticking) requestAnimationFrame(updateNav);
  ticking = true;
}, { passive: true });

// fundraiser slider
const swiper = new Swiper(".mySwiper", {
  slidesPerView: 1.15,
  spaceBetween: 16,
  freeMode: true,
  grabCursor: true,
  pagination: {
    el: ".swiper-pagination",
    clickable: true,
  },
  breakpoints: {
    600: { slidesPerView: 2, spaceBetween: 20 },
    1025: { slidesPerView: 3, spaceBetween: 30 },
  },
});

// in-page links glide with lenis
document.querySelectorAll('a[href^="#"]').forEach((link) => {
  link.addEventListener("click", (e) => {
    const id = link.getAttribute("href");
    if (id === "#") return e.preventDefault();
    const target = document.querySelector(id);
    if (!target) return;
    e.preventDefault();
    scrollToEl(target);
  });
});

// faq accordion
document.querySelectorAll(".faq-item").forEach((item) => {
  item.addEventListener("click", () => {
    const isOpen = item.classList.contains("active");
    document.querySelectorAll(".faq-item.active").forEach((el) => el.classList.remove("active"));
    if (!isOpen) item.classList.add("active");
  });
});

// hero entrance
function heroIntro() {
  if (reduceMotion) return;
  gsap.from("nav, #center-heading > *", {
    y: 30,
    opacity: 0,
    duration: 0.8,
    stagger: 0.12,
    ease: "power3.out",
    clearProps: "transform,opacity", // hand the nav's transform back to the hide/show css
  });
  gsap.from(".center-img-wrapper > div", {
    y: 60,
    opacity: 0,
    duration: 1,
    stagger: 0.1,
    delay: 0.4,
    ease: "power3.out",
  });
}

// loader - count + filling line follow real image/font loading
const loader = document.querySelector("#loader");
const loaderNum = document.querySelector("#loader-num");
const loaderFill = document.querySelector("#loader-fill");
const images = [...document.images];
const total = images.length + 1; // +1 for fonts
const minDuration = reduceMotion ? 0 : 1800; // so it never just flashes (counted from navigation start)
let loaded = 0;
let pageLoaded = false;
let shown = 0;
const pauses = [25, 55, 80]; // the count holds briefly on each of these
const pauseLength = 350;
let holdUntil = 0;
let pausedTime = 0;

const bump = () => loaded++;
images.forEach((img) => {
  if (img.complete) return bump();
  img.addEventListener("load", bump, { once: true });
  img.addEventListener("error", bump, { once: true });
});
document.fonts.ready.then(bump);
window.addEventListener("load", () => (pageLoaded = true));
setTimeout(() => (pageLoaded = true), 6000); // never get stuck on a slow image

lenis?.stop();

function tickLoader(now) {
  if (now < holdUntil) return requestAnimationFrame(tickLoader);

  const real = pageLoaded ? 100 : (loaded / total) * 100;
  const timeCap = minDuration ? ((now - pausedTime) / minDuration) * 100 : 100;
  const target = Math.min(real, timeCap, 100);

  let next = shown + (target - shown) * 0.15;
  if (target - next < 1) next = target;

  // stop exactly on the next pause point and hold there for a moment
  if (!reduceMotion && pauses.length && next >= pauses[0]) {
    next = pauses.shift();
    holdUntil = now + pauseLength;
    pausedTime += pauseLength;
  }
  shown = next;

  loaderNum.textContent = Math.floor(shown);
  loaderFill.style.transform = `scaleX(${shown / 100})`;

  if (shown >= 100) return hideLoader();
  requestAnimationFrame(tickLoader);
}
requestAnimationFrame(tickLoader);

function hideLoader() {
  const done = () => {
    loader.remove();
    lenis?.start();
  };
  document.documentElement.classList.remove("is-loading");

  if (reduceMotion) return done();

  gsap.timeline({ onComplete: done })
    .to(".loader-top > *, .loader-bottom > *", {
      y: -40,
      opacity: 0,
      duration: 0.4,
      stagger: 0.05,
      ease: "power2.in",
      delay: 0.2,
    })
    .to(loader, { yPercent: -100, duration: 0.9, ease: "power4.inOut" }, "-=0.15")
    .add(heroIntro, "-=0.45");
}
