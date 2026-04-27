const panels = {
  intro: document.getElementById("introPanel"),
  guess: document.getElementById("guessPanel"),
  calc: document.getElementById("calcPanel"),
  spinner: document.getElementById("spinnerPanel"),
  dimension: document.getElementById("dimensionPanel")
};

const followLink = document.getElementById("followLink");
const followStatus = document.getElementById("followStatus");
const readyBtn = document.getElementById("readyBtn");
const guessInput = document.getElementById("guessInput");
const guessFeedback = document.getElementById("guessFeedback");
const toSpinnerBtn = document.getElementById("toSpinnerBtn");
const stopBtn = document.getElementById("stopBtn");
const againBtn = document.getElementById("againBtn");
const streamNumberEl = document.getElementById("streamNumber");
const spinnerHint = document.getElementById("spinnerHint");

const dimensionEyebrow = document.getElementById("dimensionEyebrow");
const dimensionTitle = document.getElementById("dimensionTitle");
const dimensionText = document.getElementById("dimensionText");
const dimensionMeta = document.getElementById("dimensionMeta");
const cityCanvas = document.getElementById("cityCanvas");
const cityTitle = document.getElementById("cityTitle");
const cityButtons = Array.from(document.querySelectorAll(".city-btn"));

const body = document.body;

let streamInterval = null;
let streamNumber = 1;
let isStopped = false;
let guessedNumber = 8;
let followIntent = false;

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

const cityNames = [
  "Tokyo", "New York", "Paris", "London", "Dubai", "Mumbai", "Seoul", "Singapore", "Barcelona", "Berlin",
  "Los Angeles", "Sydney", "Rome", "Istanbul", "Bangkok", "Sao Paulo", "Toronto", "Shanghai", "Hong Kong", "Cairo",
  "Moscow", "Cape Town", "Mexico City", "San Francisco", "Amsterdam", "Prague", "Lisbon", "Vienna", "Budapest", "Athens",
  "Jakarta", "Manila", "Nairobi", "Lagos", "Accra", "Riyadh", "Doha", "Kuala Lumpur", "Auckland", "Melbourne",
  "Brussels", "Stockholm", "Oslo", "Copenhagen", "Helsinki", "Dublin", "Edinburgh", "Warsaw", "Krakow", "Zurich",
  "Geneva", "Munich", "Frankfurt", "Venice", "Florence", "Naples", "Milan", "Valencia", "Madrid", "Seville",
  "Vancouver", "Montreal", "Chicago", "Seattle", "Boston", "Austin", "Atlanta", "Miami", "Las Vegas", "San Diego",
  "Lima", "Bogota", "Buenos Aires", "Santiago", "Quito", "Reykjavik", "Tallinn", "Riga", "Vilnius", "Bucharest",
  "Belgrade", "Sofia", "Zagreb", "Ljubljana", "Bratislava", "Kyoto", "Osaka", "Busan", "Hanoi", "Ho Chi Minh City",
  "Phnom Penh", "Kathmandu", "Colombo", "Karachi", "Lahore", "Dhaka", "Chennai", "Bengaluru", "Hyderabad", "Pune"
];

// Three.js state for procedural city models.
let renderer;
let scene;
let camera;
let controls;
let cityGroup;
let cityAnimationHandle;
let currentCityVariant = 0;
let currentDimension = 1;

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
  currentDimension = n;
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

  buildCityModel(n, currentCityVariant);
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
  const matched = chosen === guessedNumber;
  spinnerHint.textContent = matched
    ? `Perfect stop at ${chosen}. Loading your exact dimension...`
    : `You stopped at ${chosen}, but your locked guess is ${guessedNumber}. Redirecting to your guessed dimension...`;
  setTimeout(() => {
    applyDimension(guessedNumber);
    showPanel("dimension");
  }, 680);
}

followLink.addEventListener("click", () => {
  followIntent = true;
  followStatus.textContent = "Follow page opened. Return to this tab to auto-enter.";
});

window.addEventListener("focus", () => {
  if (!followIntent) return;
  followStatus.textContent = "Welcome back. Portal unlocked.";
  showPanel("guess");
  followIntent = false;
});

readyBtn.addEventListener("click", () => {
  const parsed = Number.parseInt(guessInput.value, 10);
  if (Number.isNaN(parsed) || parsed < 1 || parsed > 100) {
    guessFeedback.textContent = "Enter a valid number from 1 to 100.";
    guessInput.focus();
    return;
  }
  guessedNumber = parsed;
  guessFeedback.textContent = `Locked guess: ${guessedNumber}`;
  showPanel("calc");
});

toSpinnerBtn.addEventListener("click", () => {
  showPanel("spinner");
  startStream();
});
stopBtn.addEventListener("click", stopStream);
againBtn.addEventListener("click", () => {
  guessInput.value = `${guessedNumber}`;
  showPanel("intro");
});

cityButtons.forEach((button) => {
  button.addEventListener("click", () => {
    const variant = Number.parseInt(button.dataset.variant || "0", 10);
    currentCityVariant = Number.isNaN(variant) ? 0 : variant;
    buildCityModel(currentDimension, currentCityVariant);
  });
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

function initThreeIfNeeded() {
  if (renderer) {
    return;
  }
  renderer = new THREE.WebGLRenderer({
    canvas: cityCanvas,
    antialias: true,
    alpha: true
  });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));

  scene = new THREE.Scene();
  camera = new THREE.PerspectiveCamera(55, 1, 0.1, 1000);
  camera.position.set(26, 30, 32);

  controls = new THREE.OrbitControls(camera, cityCanvas);
  controls.enableDamping = true;
  controls.dampingFactor = 0.055;
  controls.minDistance = 12;
  controls.maxDistance = 120;
  controls.maxPolarAngle = Math.PI * 0.48;

  const ambient = new THREE.AmbientLight(0xffffff, 0.55);
  scene.add(ambient);

  const key = new THREE.DirectionalLight(0xffffff, 0.8);
  key.position.set(20, 40, 8);
  scene.add(key);

  const rim = new THREE.DirectionalLight(0x88ccff, 0.5);
  rim.position.set(-20, 20, -20);
  scene.add(rim);

  cityGroup = new THREE.Group();
  scene.add(cityGroup);

  const animate = () => {
    controls.update();
    renderer.render(scene, camera);
    cityAnimationHandle = requestAnimationFrame(animate);
  };
  animate();
  updateCityCanvasSize();
}

function pseudoRandom(seed) {
  const x = Math.sin(seed * 12.9898) * 43758.5453;
  return x - Math.floor(x);
}

function clearCityGroup() {
  if (!cityGroup) return;
  while (cityGroup.children.length) {
    const child = cityGroup.children.pop();
    if (child.geometry) child.geometry.dispose();
    if (child.material) child.material.dispose();
  }
}

function buildCityModel(dimension, variant) {
  if (!window.THREE || !cityCanvas) {
    return;
  }
  initThreeIfNeeded();
  clearCityGroup();

  const city = cityNames[(dimension - 1) % cityNames.length];
  const modeNames = ["Neon Core", "Heritage Grid", "Future Vertical"];
  cityTitle.textContent = `${city} - ${modeNames[variant]}`;

  const baseHue = (dimension * 17 + variant * 51) % 360;
  const primary = new THREE.Color(`hsl(${baseHue}, 80%, 55%)`);
  const secondary = new THREE.Color(`hsl(${(baseHue + 55) % 360}, 75%, 48%)`);

  const ground = new THREE.Mesh(
    new THREE.PlaneGeometry(58, 58, 1, 1),
    new THREE.MeshStandardMaterial({
      color: new THREE.Color(`hsl(${baseHue}, 38%, 14%)`),
      roughness: 0.82,
      metalness: 0.1
    })
  );
  ground.rotation.x = -Math.PI / 2;
  cityGroup.add(ground);

  const gridSize = 11 + variant * 2;
  const spacing = 3.8 - variant * 0.38;

  for (let gx = -gridSize; gx <= gridSize; gx += 1) {
    for (let gz = -gridSize; gz <= gridSize; gz += 1) {
      const seed = dimension * 10000 + variant * 1000 + gx * 100 + gz;
      const chance = pseudoRandom(seed);
      if (chance < 0.42) continue;

      const heightBase = 1.8 + pseudoRandom(seed + 1) * (8 + variant * 10);
      const width = 1 + pseudoRandom(seed + 2) * (1.3 + variant * 0.4);
      const depth = 1 + pseudoRandom(seed + 3) * (1.4 + variant * 0.35);
      const x = gx * spacing + (pseudoRandom(seed + 4) - 0.5) * 0.4;
      const z = gz * spacing + (pseudoRandom(seed + 5) - 0.5) * 0.4;

      const col = chance > 0.84 ? primary.clone() : secondary.clone();
      col.offsetHSL((pseudoRandom(seed + 6) - 0.5) * 0.1, 0, (pseudoRandom(seed + 7) - 0.5) * 0.12);

      const building = new THREE.Mesh(
        new THREE.BoxGeometry(width, heightBase, depth),
        new THREE.MeshStandardMaterial({
          color: col,
          roughness: 0.38 + variant * 0.15,
          metalness: 0.3 + variant * 0.2,
          emissive: col.clone().multiplyScalar(0.08 + 0.05 * variant)
        })
      );
      building.position.set(x, heightBase / 2, z);
      cityGroup.add(building);
    }
  }

  const halo = new THREE.Mesh(
    new THREE.TorusGeometry(22 + variant * 2, 0.28 + variant * 0.05, 16, 160),
    new THREE.MeshStandardMaterial({
      color: primary,
      emissive: primary.clone().multiplyScalar(0.45),
      roughness: 0.22,
      metalness: 0.88
    })
  );
  halo.rotation.x = Math.PI / 2;
  halo.position.y = 0.15;
  cityGroup.add(halo);

  cityButtons.forEach((btn) => {
    btn.classList.toggle("btn-primary", Number.parseInt(btn.dataset.variant || "0", 10) === variant);
  });
}

function updateCityCanvasSize() {
  if (!renderer || !camera || !cityCanvas) {
    return;
  }
  const rect = cityCanvas.getBoundingClientRect();
  const width = Math.max(100, Math.floor(rect.width));
  const height = Math.max(100, Math.floor(rect.height));
  renderer.setSize(width, height, false);
  camera.aspect = width / height;
  camera.updateProjectionMatrix();
}

window.addEventListener("resize", () => {
  updateCityCanvasSize();
});

window.addEventListener("beforeunload", () => {
  if (cityAnimationHandle) {
    cancelAnimationFrame(cityAnimationHandle);
  }
});
