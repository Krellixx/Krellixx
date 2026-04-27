const panels = {
  intro: document.getElementById("introPanel"),
  guess: document.getElementById("guessPanel"),
  calc: document.getElementById("calcPanel"),
  spinner: document.getElementById("spinnerPanel"),
  dimension: document.getElementById("dimensionPanel")
};

const followedBtn = document.getElementById("followedBtn");
const readyBtn = document.getElementById("readyBtn");
const toSpinnerBtn = document.getElementById("toSpinnerBtn");
const stopBtn = document.getElementById("stopBtn");
const againBtn = document.getElementById("againBtn");
const streamNumberEl = document.getElementById("streamNumber");
const spinnerHint = document.getElementById("spinnerHint");

const dimensionEyebrow = document.getElementById("dimensionEyebrow");
const dimensionTitle = document.getElementById("dimensionTitle");
const dimensionText = document.getElementById("dimensionText");
const dimensionMeta = document.getElementById("dimensionMeta");

const body = document.body;

let streamInterval = null;
let streamNumber = 1;
let isStopped = false;

const fontStacks = [
  "Inter, system-ui, sans-serif",
  "Orbitron, sans-serif",
  "Bebas Neue, sans-serif",
  "Cinzel, serif",
  "Playfair Display, serif",
  "Fira Code, monospace",
  "Rajdhani, sans-serif",
  "Press Start 2P, monospace",
  "Audiowide, sans-serif",
  "Russo One, sans-serif",
  "Space Grotesk, sans-serif",
  "JetBrains Mono, monospace",
  "Monoton, display",
  "Righteous, sans-serif",
  "Oswald, sans-serif",
  "Lobster, cursive",
  "Great Vibes, cursive",
  "Teko, sans-serif",
  "Major Mono Display, monospace",
  "Creepster, display",
  "Tilt Neon, sans-serif",
  "Rubik Glitch, display",
  "Bangers, display",
  "Pacifico, cursive",
  "Unbounded, sans-serif",
  "Exo 2, sans-serif",
  "Share Tech Mono, monospace"
];

const moods = [
  "Neon Storm",
  "Cosmic Ice",
  "Inferno Bloom",
  "Void Pulse",
  "Solar Punk",
  "Quantum Garden",
  "Retro Glitch",
  "Crystal Noise",
  "Midnight Haze",
  "Laser Temple"
];

function showPanel(name) {
  Object.values(panels).forEach((panel) => panel.classList.remove("active"));
  panels[name].classList.add("active");
}

function colorSetForDimension(n) {
  const hue = (n * 17 + 37) % 360;
  const hue2 = (hue + 58 + (n % 19)) % 360;
  const hue3 = (hue + 180) % 360;
  return {
    bgA: `hsl(${hue} 85% 10%)`,
    bgB: `hsl(${hue2} 75% 18%)`,
    accent: `hsl(${hue} 92% 62%)`,
    accent2: `hsl(${hue3} 90% 66%)`
  };
}

function makeDimensionData(n) {
  const font = fontStacks[(n - 1) % fontStacks.length];
  const weight = 300 + ((n * 37) % 700);
  const size = 0.95 + ((n % 8) * 0.085);
  const spacing = ((n % 11) - 5) * 0.02;
  const border = `${1 + (n % 5)}px`;
  const mood = moods[(n - 1) % moods.length];
  const colors = colorSetForDimension(n);

  return {
    number: n,
    title: `Dimension ${n.toString().padStart(3, "0")}`,
    mood,
    font,
    size: `${size.toFixed(2)}rem`,
    spacing: `${spacing.toFixed(2)}em`,
    weight,
    border,
    colors
  };
}

function applyDimension(n) {
  const d = makeDimensionData(n);

  body.style.setProperty("--bg", d.colors.bgA);
  body.style.setProperty("--bg-soft", d.colors.bgB);
  body.style.setProperty("--accent", d.colors.accent);
  body.style.setProperty("--accent-2", d.colors.accent2);
  body.style.fontFamily = d.font;
  body.style.fontWeight = `${Math.min(900, Math.max(300, d.weight))}`;
  body.style.letterSpacing = d.spacing;

  const dynamicCss = `
    radial-gradient(circle at ${15 + (n % 65)}% ${15 + ((n * 9) % 70)}%, ${d.colors.bgB}, ${d.colors.bgA})
  `;
  body.style.background = dynamicCss;

  const panel = panels.dimension;
  panel.style.borderWidth = d.border;
  panel.style.borderStyle = n % 2 === 0 ? "solid" : "dashed";
  panel.style.transform = `rotate(${((n % 9) - 4) * 0.1}deg)`;

  dimensionEyebrow.textContent = `${d.mood} | Universe Signature #${n}`;
  dimensionTitle.textContent = d.title;
  dimensionTitle.style.fontSize = `clamp(1.8rem, ${2 + ((n % 13) * 0.22)}vw, 4.3rem)`;
  dimensionText.textContent =
    `You forced reality into Dimension ${n}. ` +
    `Tone, typography and cosmic rhythm are remapped for this world.`;
  dimensionText.style.fontSize = d.size;

  dimensionMeta.innerHTML = `
    <div class="meta-item"><b>Mood</b>${d.mood}</div>
    <div class="meta-item"><b>Font Stack</b>${d.font}</div>
    <div class="meta-item"><b>Letter Spacing</b>${d.spacing}</div>
    <div class="meta-item"><b>Font Weight</b>${d.weight}</div>
    <div class="meta-item"><b>Accent</b>${d.colors.accent}</div>
    <div class="meta-item"><b>Secondary Accent</b>${d.colors.accent2}</div>
  `;
}

function startStream() {
  isStopped = false;
  streamNumber = 1;
  streamNumberEl.textContent = `${streamNumber}`;
  spinnerHint.textContent = "Press stop at the perfect moment.";
  stopBtn.disabled = false;

  if (streamInterval) {
    clearInterval(streamInterval);
  }

  // High-speed ticker gives the "reflex challenge" feel.
  streamInterval = setInterval(() => {
    streamNumber += 1;
    if (streamNumber > 100) {
      streamNumber = 1;
    }
    streamNumberEl.textContent = `${streamNumber}`;
  }, 35);
}

function stopStream() {
  if (isStopped) {
    return;
  }
  isStopped = true;
  stopBtn.disabled = true;
  clearInterval(streamInterval);
  streamInterval = null;

  const chosen = streamNumber;
  spinnerHint.textContent = `Locked at ${chosen}. Rendering matching dimension...`;
  setTimeout(() => {
    applyDimension(chosen);
    showPanel("dimension");
  }, 680);
}

followedBtn.addEventListener("click", () => showPanel("guess"));
readyBtn.addEventListener("click", () => showPanel("calc"));
toSpinnerBtn.addEventListener("click", () => {
  showPanel("spinner");
  startStream();
});
stopBtn.addEventListener("click", stopStream);
againBtn.addEventListener("click", () => {
  showPanel("intro");
});

// Default landing style.
applyDimension(1);
showPanel("intro");

// Background particle shimmer.
const canvas = document.getElementById("bgCanvas");
const ctx = canvas.getContext("2d");
const particles = [];

function resizeCanvas() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
}

function randomParticle() {
  return {
    x: Math.random() * canvas.width,
    y: Math.random() * canvas.height,
    r: Math.random() * 1.8 + 0.4,
    vx: (Math.random() - 0.5) * 0.4,
    vy: (Math.random() - 0.5) * 0.4,
    a: Math.random() * 0.6 + 0.2
  };
}

function refillParticles() {
  particles.length = 0;
  const count = Math.min(220, Math.floor((canvas.width * canvas.height) / 9200));
  for (let i = 0; i < count; i += 1) {
    particles.push(randomParticle());
  }
}

function drawParticles() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  const accent = getComputedStyle(body).getPropertyValue("--accent").trim();
  ctx.fillStyle = accent || "#08d9d6";
  particles.forEach((p) => {
    p.x += p.vx;
    p.y += p.vy;
    if (p.x < 0 || p.x > canvas.width) p.vx *= -1;
    if (p.y < 0 || p.y > canvas.height) p.vy *= -1;

    ctx.globalAlpha = p.a;
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
    ctx.fill();
  });
  ctx.globalAlpha = 1;
  requestAnimationFrame(drawParticles);
}

window.addEventListener("resize", () => {
  resizeCanvas();
  refillParticles();
});

resizeCanvas();
refillParticles();
drawParticles();
