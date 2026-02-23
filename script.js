import { vertexShader, fragmentShader } from "./shader.js";

// Free, no-bundler ESM imports:
import * as THREE from "https://unpkg.com/three@0.160.0/build/three.module.js";
import Lenis from "https://cdn.jsdelivr.net/npm/@studio-freight/lenis@1.0.42/dist/lenis.mjs";

// GSAP is loaded as a global via script tags
const gsap = window.gsap;
const ScrollTrigger = window.ScrollTrigger;

gsap.registerPlugin(ScrollTrigger);

// -------- Lenis smooth scroll --------
const lenis = new Lenis({
  smoothWheel: true,
  smoothTouch: false,
});

function raf(time) {
  lenis.raf(time);
  ScrollTrigger.update();
  requestAnimationFrame(raf);
}
requestAnimationFrame(raf);

// -------- WebGL Shader setup --------
const CONFIG = {
  color: "#ebf5df",
  spread: 0.5,
  speed: 1.0, // keep progress in 0..1
};

const canvas = document.querySelector(".hero-canvas");
const hero = document.querySelector(".hero");

const scene = new THREE.Scene();
const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);

const renderer = new THREE.WebGLRenderer({
  canvas,
  alpha: true,
  antialias: false,
  powerPreference: "high-performance",
});

function hexToRgb(hex) {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? {
        r: parseInt(result[1], 16) / 255,
        g: parseInt(result[2], 16) / 255,
        b: parseInt(result[3], 16) / 255,
      }
    : { r: 0.92, g: 0.96, b: 0.87 };
}

const geometry = new THREE.PlaneGeometry(2, 2);
const rgb = hexToRgb(CONFIG.color);

const material = new THREE.ShaderMaterial({
  vertexShader,
  fragmentShader,
  uniforms: {
    uProgress: { value: 0 },
    uResolution: { value: new THREE.Vector2(1, 1) },
    uColor: { value: new THREE.Vector3(rgb.r, rgb.g, rgb.b) },
    uSpread: { value: CONFIG.spread },
  },
  transparent: true,
});

const mesh = new THREE.Mesh(geometry, material);
scene.add(mesh);

function resize() {
  const width = hero.offsetWidth;
  const height = hero.offsetHeight;

  renderer.setSize(width, height, false);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  material.uniforms.uResolution.value.set(width, height);
}
resize();
window.addEventListener("resize", resize);

let uProgress = 0;

function animate() {
  material.uniforms.uProgress.value = uProgress;
  renderer.render(scene, camera);
  requestAnimationFrame(animate);
}
animate();

// -------- Scroll-driven progress (LOCAL to hero) --------
function clamp01(v) {
  return Math.max(0, Math.min(1, v));
}

lenis.on("scroll", ({ scroll }) => {
  const heroTop = hero.offsetTop;
  const heroHeight = hero.offsetHeight;
  const windowHeight = window.innerHeight;

  const maxScroll = Math.max(1, heroHeight - windowHeight);
  const localScroll = scroll - heroTop; // progress starts when hero starts

  uProgress = clamp01((localScroll / maxScroll) * CONFIG.speed);
});

// -------- Free word-split (replaces SplitText) --------
function splitWords(el) {
  const text = (el.textContent || "").trim();
  const parts = text.split(/\s+/).filter(Boolean);

  el.textContent = "";
  parts.forEach((word, idx) => {
    const span = document.createElement("span");
    span.className = "word";
    span.textContent = word;
    el.appendChild(span);
    if (idx !== parts.length - 1) el.appendChild(document.createTextNode(" "));
  });

  return Array.from(el.querySelectorAll(".word"));
}

const heroH2 = document.querySelector(".reveal-words");
const words = splitWords(heroH2);

gsap.set(words, { opacity: 0 });

ScrollTrigger.create({
  trigger: ".hero-content",
  start: "top 25%",
  end: "bottom 100%",
  onUpdate: (self) => {
    const progress = self.progress;
    const total = words.length;

    const visibleCount = Math.floor(progress * total);

    for (let i = 0; i < total; i++) {
      const targetOpacity = i <= visibleCount ? 1 : 0;
      gsap.to(words[i], { opacity: targetOpacity, duration: 0.12, overwrite: true });
    }
  },
});


(() => {
  const section = document.querySelector(".usage");
  if (!section) return;

  // ВАЖНО: не unobserve — чтобы при обратном скролле пряталось обратно
  const io = new IntersectionObserver(
    (entries) => {
      for (const e of entries) {
        if (e.isIntersecting) {
          section.classList.add("is-inview");
        } else {
          section.classList.remove("is-inview");
        }
      }
    },
    {
      threshold: 0.28, // чуть больше, чтобы плавнее триггерилось
    }
  );

  io.observe(section);
})();


// -------- Scroll reveal for Products / About / Contact --------
(() => {
  const targets = [".cats", ".aboutt", ".contact-section"];
  const els = targets.map((s) => document.querySelector(s)).filter(Boolean);
  if (!els.length) return;

  const io = new IntersectionObserver(
    (entries) => {
      for (const e of entries) {
        if (e.isIntersecting) e.target.classList.add("is-inview");
        else e.target.classList.remove("is-inview");
      }
    },
    { threshold: 0.22 }
  );

  els.forEach((el) => io.observe(el));
})();


(() => {
  const items = [
    {
      id: "rumen-yeast",
      title: "Rumen Yeast",
      sub: "Живые дрожжи (Saccharomyces cerevisiae)",
      img: "rumen.png",
      desc:
        "Кормовая добавка на основе живых дрожжей Saccharomyces cerevisiae для поддержки рубца и повышения эффективности кормления.",
      benefits: ["Улучшает пищеварение", "Поддерживает микрофлору рубца", "Увеличивает надой"],
      how: "Смешивать с кормом по схеме хозяйства. Назначение: молочный и мясной КРС."
    },
    {
      id: "premix",
      title: "Витаминно-минеральный премикс",
      sub: "Для всех ферм",
      img: "premix.png",
      desc:
        "Премикс для ежедневного обогащения рациона витаминами и минералами. Используется на всех фермах.",
      benefits: ["Vitamin A, D3, E", "Calcium и Phosphorus", "Zinc и Selenium"],
      how: "Добавлять в комбикорм по норме рациона. Назначение: регулярная витаминно-минеральная поддержка."
    },
    {
      id: "dairy-concentrate",
      title: "MAG Agro Dairy Concentrate",
      sub: "Концентрат для молочного КРС",
      img: "dairy.png",
      desc:
        "Высокоэффективный концентрат для молочного КРС, разработанный для увеличения надоев, улучшения качества молока и поддержания здоровья животных.",
      benefits: [
        "Увеличение надоев на 10–20%",
        "Улучшение жирности молока",
        "Укрепление иммунитета",
        "Улучшение пищеварения",
        "Сырой протеин: 30–38%, витамины A, D3, E, кальций, фосфор, живые дрожжи"
      ],
      how: "Рекомендуемая дозировка: 1–3 кг на голову в сутки или 10–20% от комбикорма. Назначение: молочные фермы и сельскохозяйственные предприятия."
    },
    {
      id: "protein-concentrate",
      title: "MAG Agro Protein Concentrate 35%",
      sub: "Белковый концентрат (Protein concentrate)",
      img: "protein.png",
      desc:
        "Высокобелковый концентрат для увеличения привеса, улучшения кормления и повышения эффективности производства.",
      benefits: [
        "Ускорение роста КРС",
        "Увеличение привеса на 10–15%",
        "Улучшение конверсии корма",
        "Сырой протеин: 35%, соевый и подсолнечный шрот, витамины, минералы, аминокислоты"
      ],
      how: "Рекомендуемая дозировка: 5–20% от комбикорма. Назначение: мясной и молочный КРС, комбикормовые заводы."
    },
    {
      id: "calf-starter",
      title: "MAG Agro Calf Starter Concentrate",
      sub: "Специализированный концентрат для телят",
      img: "calf.png",
      desc:
        "Концентрат для телят, обеспечивающий быстрый рост, развитие рубца и укрепление здоровья.",
      benefits: [
        "Ускорение роста телят",
        "Развитие рубца",
        "Снижение заболеваемости",
        "Сырой протеин: 18–24%, витамины A, D3, E, минеральный комплекс, пробиотики"
      ],
      how: "Рекомендуемая дозировка: 0.5–2 кг на голову в сутки. Назначение: телята от 2 недель до 6 месяцев."
    }
  ];

  const grid = document.getElementById("catsGrid");

  const modal = document.getElementById("cmodal");
  const mTitle = document.getElementById("cmodalTitle");
  const mSub = document.getElementById("cmodalSub");
  const mDesc = document.getElementById("cmodalDesc");
  const mList = document.getElementById("cmodalList");
  const mHow = document.getElementById("cmodalHow");
  const mImg = document.getElementById("cmodalImg");

  let lastFocus = null;

  function cardTpl(x) {
    return `
      <article class="catcard">
        <div class="catcard__imgWrap">
          <img class="catcard__img" src="${x.img}" alt="${x.title}">
        </div>

        <div class="catcard__body">
          <h3 class="catcard__name">${x.title}</h3>
          <p class="catcard__sub">${x.sub}</p>
        </div>

        <button class="catcard__go" type="button" aria-label="Подробнее" data-open="${x.id}">
          <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path d="M7 17L17 7" stroke="#111" stroke-width="2.2" stroke-linecap="round"/>
            <path d="M9 7h8v8" stroke="#111" stroke-width="2.2" stroke-linecap="round"/>
          </svg>
        </button>
      </article>
    `;
  }

  function render() {
    grid.innerHTML = items.map(cardTpl).join("");
  }

  function openModal(id) {
    const x = items.find(i => i.id === id);
    if (!x) return;

    lastFocus = document.activeElement;

    mTitle.textContent = x.title;
    mSub.textContent = x.sub;
    mDesc.textContent = x.desc;
    mHow.textContent = x.how;
    mImg.src = x.img;
    mImg.alt = x.title;
    mList.innerHTML = x.benefits.map(b => `<li>${b}</li>`).join("");

    modal.classList.add("is-open");
    modal.setAttribute("aria-hidden", "false");
    document.body.style.overflow = "hidden";

    const closeBtn = modal.querySelector(".cmodal__close");
    closeBtn && closeBtn.focus();
  }

  function closeModal() {
    modal.classList.remove("is-open");
    modal.setAttribute("aria-hidden", "true");
    document.body.style.overflow = "";

    if (lastFocus && typeof lastFocus.focus === "function") lastFocus.focus();
  }

  document.addEventListener("click", (e) => {
    const open = e.target.closest("[data-open]");
    if (open) return openModal(open.getAttribute("data-open"));

    const close = e.target.closest("[data-close]");
    if (close) return closeModal();
  });

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && modal.classList.contains("is-open")) closeModal();
  });

  render();
})();
