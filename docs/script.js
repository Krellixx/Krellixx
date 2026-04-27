const canvas = document.getElementById("spaceCanvas");
const phaseLabel = document.getElementById("phaseLabel");
const cityLabel = document.getElementById("cityLabel");
const timerLabel = document.getElementById("timerLabel");
const hud = document.getElementById("hud");
const interactiveBtn = document.getElementById("interactiveBtn");
const helpTip = document.getElementById("helpTip");
const body = document.body;

const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: "high-performance" });
renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
renderer.setSize(window.innerWidth, window.innerHeight);

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x000000);

const camera = new THREE.PerspectiveCamera(55, window.innerWidth / window.innerHeight, 0.1, 12000);
camera.position.set(0, 0, 2200);
const controls = new THREE.OrbitControls(camera, canvas);
controls.enabled = false;
controls.enableDamping = true;
controls.dampingFactor = 0.07;
controls.minDistance = 26;
controls.maxDistance = 210;
controls.maxPolarAngle = Math.PI * 0.49;

const ambient = new THREE.AmbientLight(0xffffff, 0.16);
scene.add(ambient);
const sunLight = new THREE.PointLight(0xffcc88, 2.4, 9000, 2);
scene.add(sunLight);

const textureLoader = new THREE.TextureLoader();
const earthTexture = textureLoader.load("https://threejs.org/examples/textures/planets/earth_atmos_2048.jpg");
const earthBump = textureLoader.load("https://threejs.org/examples/textures/planets/earth_bump_2048.jpg");
const earthSpec = textureLoader.load("https://threejs.org/examples/textures/planets/earth_specular_2048.jpg");
const earthLights = textureLoader.load("https://threejs.org/examples/textures/planets/earth_lights_2048.png");
const cloudTexture = textureLoader.load("https://threejs.org/examples/textures/planets/earth_clouds_1024.png");

const starGeo = new THREE.BufferGeometry();
const starCount = 3500;
const starPos = new Float32Array(starCount * 3);
for (let i = 0; i < starCount; i += 1) {
  const r = 2600 + Math.random() * 6500;
  const th = Math.random() * Math.PI * 2;
  const ph = Math.acos(2 * Math.random() - 1);
  starPos[i * 3] = r * Math.sin(ph) * Math.cos(th);
  starPos[i * 3 + 1] = r * Math.sin(ph) * Math.sin(th);
  starPos[i * 3 + 2] = r * Math.cos(ph);
}
starGeo.setAttribute("position", new THREE.BufferAttribute(starPos, 3));
const stars = new THREE.Points(
  starGeo,
  new THREE.PointsMaterial({ color: 0xffffff, size: 4, sizeAttenuation: true, transparent: true, opacity: 0.85 })
);
scene.add(stars);

const solarGroup = new THREE.Group();
scene.add(solarGroup);

const sun = new THREE.Mesh(
  new THREE.SphereGeometry(80, 64, 64),
  new THREE.MeshStandardMaterial({ color: 0xff9d42, emissive: 0xff5c00, emissiveIntensity: 1.4 })
);
solarGroup.add(sun);
const sunGlow = new THREE.Sprite(
  new THREE.SpriteMaterial({ color: 0xff8a2b, transparent: true, opacity: 0.62, blending: THREE.AdditiveBlending })
);
sunGlow.scale.set(380, 380, 1);
sun.add(sunGlow);
const sunGlow2 = new THREE.Sprite(
  new THREE.SpriteMaterial({ color: 0xffd26a, transparent: true, opacity: 0.35, blending: THREE.AdditiveBlending })
);
sunGlow2.scale.set(560, 560, 1);
sun.add(sunGlow2);
sunLight.position.copy(sun.position);

const planetDefs = [
  { name: "Mercury", radius: 5, orbit: 120, speed: 0.0105, color: 0xb4b4b4 },
  { name: "Venus", radius: 10, orbit: 170, speed: 0.0076, color: 0xd9af6b },
  { name: "Earth", radius: 12, orbit: 235, speed: 0.0062, color: 0x5a8cff },
  { name: "Mars", radius: 7, orbit: 300, speed: 0.0051, color: 0xd57254 },
  { name: "Jupiter", radius: 32, orbit: 430, speed: 0.0028, color: 0xc7a781 },
  { name: "Saturn", radius: 28, orbit: 560, speed: 0.0021, color: 0xe3c98a },
  { name: "Uranus", radius: 19, orbit: 680, speed: 0.0015, color: 0x9ee9ea },
  { name: "Neptune", radius: 18, orbit: 790, speed: 0.0012, color: 0x5b76db }
];

const planets = [];
let earth = null;
let cloudLayer = null;
let auroraLayer = null;
let moon = null;
let statueGroup = null;
let statueGlobe = null;
let markerGroup = null;
const markerMeshes = [];
const raycaster = new THREE.Raycaster();
const pointer = new THREE.Vector2();

planetDefs.forEach((def) => {
  const material =
    def.name === "Earth"
      ? new THREE.MeshStandardMaterial({
          map: earthTexture,
          bumpMap: earthBump,
          bumpScale: 0.3,
          specularMap: earthSpec,
          metalness: 0.03,
          roughness: 0.7
        })
      : new THREE.MeshStandardMaterial({
          color: def.color,
          roughness: 0.78,
          metalness: 0.1
        });

  const mesh = new THREE.Mesh(new THREE.SphereGeometry(def.radius, 48, 48), material);
  solarGroup.add(mesh);

  if (def.name === "Earth") {
    earth = mesh;
    const glow = new THREE.Mesh(
      new THREE.SphereGeometry(def.radius * 1.08, 36, 36),
      new THREE.MeshBasicMaterial({ color: 0x65b7ff, transparent: true, opacity: 0.28 })
    );
    earth.add(glow);
    cloudLayer = new THREE.Mesh(
      new THREE.SphereGeometry(def.radius * 1.012, 36, 36),
      new THREE.MeshStandardMaterial({ map: cloudTexture, transparent: true, opacity: 0.42 })
    );
    earth.add(cloudLayer);
    const nightLayer = new THREE.Mesh(
      new THREE.SphereGeometry(def.radius * 1.004, 36, 36),
      new THREE.MeshBasicMaterial({ map: earthLights, transparent: true, opacity: 0.45, blending: THREE.AdditiveBlending })
    );
    earth.add(nightLayer);
    auroraLayer = new THREE.Mesh(
      new THREE.TorusGeometry(def.radius * 0.88, def.radius * 0.17, 18, 80),
      new THREE.MeshBasicMaterial({
        color: 0x33ffd8,
        transparent: true,
        opacity: 0.17,
        blending: THREE.AdditiveBlending
      })
    );
    auroraLayer.rotation.x = Math.PI / 2;
    earth.add(auroraLayer);
    moon = new THREE.Mesh(
      new THREE.SphereGeometry(3.2, 28, 28),
      new THREE.MeshStandardMaterial({ color: 0x8a8f99, roughness: 0.92, metalness: 0.03 })
    );
    solarGroup.add(moon);
  }

  planets.push({ ...def, mesh });
});

const earthMarker = new THREE.Mesh(
  new THREE.SphereGeometry(2.6, 18, 18),
  new THREE.MeshBasicMaterial({ color: 0x5aa7ff, transparent: true, opacity: 0.95 })
);
scene.add(earthMarker);

const earthTilt = THREE.MathUtils.degToRad(23.4);
const targetZone = { lat: 12.9716, lon: 77.5946 };

const state = {
  start: performance.now(),
  droneStart: 0,
  interactiveReady: false,
  interactiveStarted: false,
  soundEnabled: false,
  audioContext: null,
  audioNodes: null
};

function planetPosition(def, t) {
  const angle = t * def.speed + def.orbit * 0.01;
  return new THREE.Vector3(Math.cos(angle) * def.orbit, 0, Math.sin(angle) * def.orbit);
}

function latLonToEarthVector(lat, lon, radius) {
  const latR = THREE.MathUtils.degToRad(lat);
  const lonR = THREE.MathUtils.degToRad(lon);
  const x = radius * Math.cos(latR) * Math.cos(lonR);
  const z = radius * Math.cos(latR) * Math.sin(lonR);
  const y = radius * Math.sin(latR);
  const v = new THREE.Vector3(x, y, z);
  v.applyAxisAngle(new THREE.Vector3(0, 0, 1), earthTilt);
  return v;
}

function updatePlanets(t) {
  planets.forEach((p) => {
    const pos = planetPosition(p, t);
    p.mesh.position.copy(pos);
    p.mesh.rotation.y += 0.002;
  });
  if (cloudLayer) {
    cloudLayer.rotation.y += 0.0012;
  }
  if (auroraLayer) {
    auroraLayer.rotation.z += 0.0022;
    auroraLayer.material.opacity = 0.13 + Math.sin(t * 0.22) * 0.05;
  }
  if (earth) {
    earth.rotation.z = earthTilt;
  }
  if (moon && earth) {
    const earthPos = earth.getWorldPosition(new THREE.Vector3());
    const moonAngle = t * 0.04;
    const moonOffset = new THREE.Vector3(Math.cos(moonAngle) * 32, Math.sin(moonAngle * 0.3) * 4, Math.sin(moonAngle) * 32);
    moon.position.copy(earthPos.clone().add(moonOffset));
  }
}

function lerpVec(a, b, t) {
  return new THREE.Vector3(
    THREE.MathUtils.lerp(a.x, b.x, t),
    THREE.MathUtils.lerp(a.y, b.y, t),
    THREE.MathUtils.lerp(a.z, b.z, t)
  );
}

function setPhaseText(text) {
  phaseLabel.textContent = text;
}

function hashCode(text) {
  let hash = 0;
  for (let i = 0; i < text.length; i += 1) {
    hash = (hash << 5) - hash + text.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

function hashToLatLon(name, index) {
  const h1 = hashCode(`${name}-lat-${index}`);
  const h2 = hashCode(`${name}-lon-${index}`);
  const lat = (h1 % 170) - 85;
  const lon = (h2 % 360) - 180;
  return { lat, lon };
}

function createStatueAt(surfacePoint, earthWorld) {
  statueGroup = new THREE.Group();
  scene.add(statueGroup);
  statueGroup.position.copy(surfacePoint);

  const up = surfacePoint.clone().sub(earthWorld).normalize();
  const quat = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), up);
  statueGroup.quaternion.copy(quat);

  const base = new THREE.Mesh(
    new THREE.CylinderGeometry(4.5, 6.5, 4.2, 36),
    new THREE.MeshStandardMaterial({ color: 0x2a3342, roughness: 0.64, metalness: 0.34 })
  );
  base.position.y = 2.1;
  statueGroup.add(base);

  const stand = new THREE.Mesh(
    new THREE.CylinderGeometry(2.1, 2.5, 8, 32),
    new THREE.MeshStandardMaterial({ color: 0x3a4b63, roughness: 0.42, metalness: 0.58 })
  );
  stand.position.y = 8;
  statueGroup.add(stand);

  statueGlobe = new THREE.Mesh(
    new THREE.SphereGeometry(6.8, 64, 64),
    new THREE.MeshStandardMaterial({
      map: earthTexture,
      bumpMap: earthBump,
      bumpScale: 0.16,
      roughness: 0.58,
      metalness: 0.18
    })
  );
  statueGlobe.position.y = 14.8;
  statueGroup.add(statueGlobe);

  const ring = new THREE.Mesh(
    new THREE.TorusGeometry(8.3, 0.26, 16, 120),
    new THREE.MeshStandardMaterial({ color: 0x67cbff, emissive: 0x2d85c4, emissiveIntensity: 0.6, metalness: 0.9, roughness: 0.2 })
  );
  ring.position.y = 14.8;
  ring.rotation.x = Math.PI / 2;
  statueGroup.add(ring);

  markerGroup = new THREE.Group();
  markerGroup.position.y = 14.8;
  statueGroup.add(markerGroup);
}

async function loadRepoMarkers() {
  if (!markerGroup) return;
  markerMeshes.splice(0, markerMeshes.length);
  while (markerGroup.children.length) {
    const child = markerGroup.children.pop();
    if (child.geometry) child.geometry.dispose();
    if (child.material) child.material.dispose();
  }

  const username = "Krellixx";
  let repos = [];
  try {
    const response = await fetch(`https://api.github.com/users/${username}/repos?per_page=100&sort=updated`);
    if (response.ok) repos = await response.json();
  } catch (err) {
    repos = [];
  }

  repos
    .filter((repo) => !repo.fork)
    .forEach((repo, index) => {
      const latLon = hashToLatLon(repo.name, index);
      const pos = latLonToEarthVector(latLon.lat, latLon.lon, 7.25);
      const marker = new THREE.Mesh(
        new THREE.SphereGeometry(0.22, 12, 12),
        new THREE.MeshStandardMaterial({
          color: 0x7ce8ff,
          emissive: 0x2cc1ff,
          emissiveIntensity: 0.9,
          metalness: 0.45,
          roughness: 0.25
        })
      );
      marker.position.copy(pos);
      marker.userData = { url: repo.html_url };

      const stem = new THREE.Mesh(
        new THREE.CylinderGeometry(0.03, 0.03, 0.62, 8),
        new THREE.MeshBasicMaterial({ color: 0x8fdfff })
      );
      stem.position.copy(pos.clone().multiplyScalar(0.96));
      stem.lookAt(pos);
      stem.rotateX(Math.PI / 2);

      markerGroup.add(stem);
      markerGroup.add(marker);
      markerMeshes.push(marker);
    });
}

function startAudioEngine() {
  if (state.soundEnabled) return;
  const AudioCtx = window.AudioContext || window.webkitAudioContext;
  if (!AudioCtx) return;
  state.audioContext = new AudioCtx();
  const ctx = state.audioContext;

  const master = ctx.createGain();
  master.gain.value = 0.12;
  master.connect(ctx.destination);

  const engineOsc = ctx.createOscillator();
  engineOsc.type = "sawtooth";
  engineOsc.frequency.value = 72;
  const engineGain = ctx.createGain();
  engineGain.gain.value = 0.03;
  engineOsc.connect(engineGain).connect(master);

  const noiseBuffer = ctx.createBuffer(1, ctx.sampleRate * 2, ctx.sampleRate);
  const data = noiseBuffer.getChannelData(0);
  for (let i = 0; i < data.length; i += 1) data[i] = Math.random() * 2 - 1;
  const noiseSource = ctx.createBufferSource();
  noiseSource.buffer = noiseBuffer;
  noiseSource.loop = true;

  const bp = ctx.createBiquadFilter();
  bp.type = "bandpass";
  bp.frequency.value = 420;
  bp.Q.value = 0.7;
  const noiseGain = ctx.createGain();
  noiseGain.gain.value = 0.014;

  noiseSource.connect(bp).connect(noiseGain).connect(master);
  engineOsc.start();
  noiseSource.start();

  state.audioNodes = { engineOsc, engineGain, bp, noiseGain };
  state.soundEnabled = true;
}

function updateAudio(elapsedSec) {
  if (!state.soundEnabled || !state.audioNodes) return;
  const { engineOsc, engineGain, bp, noiseGain } = state.audioNodes;
  const wave = Math.sin(elapsedSec * 1.6);
  engineOsc.frequency.setValueAtTime(72 + wave * 9, state.audioContext.currentTime);
  engineGain.gain.setValueAtTime(0.025 + Math.abs(wave) * 0.02, state.audioContext.currentTime);
  bp.frequency.setValueAtTime(380 + (wave + 1) * 160, state.audioContext.currentTime);
  noiseGain.gain.setValueAtTime(0.01 + Math.abs(Math.sin(elapsedSec * 2.4)) * 0.02, state.audioContext.currentTime);
}

function prepareInteractiveMode(earthWorld) {
  if (state.interactiveReady) return;
  state.interactiveReady = true;
  body.classList.add("letterbox");
  interactiveBtn.classList.remove("hidden");
  helpTip.classList.remove("hidden");

  const targetSurface = latLonToEarthVector(targetZone.lat, targetZone.lon, 13).add(earthWorld);
  createStatueAt(targetSurface, earthWorld);
  loadRepoMarkers();

  interactiveBtn.addEventListener(
    "click",
    () => {
      startAudioEngine();
      controls.enabled = true;
      state.interactiveStarted = true;
      interactiveBtn.classList.add("hidden");
      setPhaseText("Phase 5: Interactive Artifact Chamber");
      cityLabel.textContent = "Target Zone: Locked";
      hud.classList.remove("hidden");
      body.classList.remove("drone-mode");
    },
    { once: true }
  );
}

function updateCinematic(elapsedSec, simTime) {
  updatePlanets(simTime);
  const earthWorld = earth.getWorldPosition(new THREE.Vector3());
  earthMarker.position.copy(earthWorld).multiplyScalar(1.02);
  earthMarker.material.opacity = elapsedSec > 10 ? 0.8 : 0;

  if (elapsedSec < 5) {
    setPhaseText("Phase 1: Deep Space Signal");
    const pulse = 1 + Math.sin(elapsedSec * 4.5) * 0.08;
    sun.scale.setScalar(pulse);
    sunGlow.material.opacity = 0.45 + Math.sin(elapsedSec * 4.5) * 0.15;
    sunGlow2.material.opacity = 0.27 + Math.sin(elapsedSec * 3.7) * 0.08;
    camera.position.set(0, 0, 2200);
    camera.lookAt(0, 0, 0);
    hud.classList.add("hidden");
    body.classList.remove("drone-mode");
    return;
  }

  if (elapsedSec < 18) {
    setPhaseText("Phase 2: Approaching the Solar System");
    const p = (elapsedSec - 5) / 13;
    const eased = 1 - Math.pow(1 - p, 2.8);
    camera.position.set(0, 120 * (1 - eased), THREE.MathUtils.lerp(2200, 520, eased));
    camera.lookAt(0, 0, 0);
    hud.classList.add("hidden");
    body.classList.remove("drone-mode");
    body.classList.add("letterbox");
    return;
  }

  if (elapsedSec < 30) {
    setPhaseText("Phase 3: Earth Lock");
    const p = (elapsedSec - 18) / 12;
    const eased = 1 - Math.pow(1 - p, 2.2);
    const from = new THREE.Vector3(0, 70, 500);
    const to = earthWorld.clone().add(new THREE.Vector3(30, 16, 28));
    const pos = lerpVec(from, to, eased);
    camera.position.copy(pos);
    camera.lookAt(earthWorld);
    hud.classList.add("hidden");
    body.classList.remove("drone-mode");
    if (moon) {
      moon.position.lerp(camera.position.clone().add(new THREE.Vector3(-6, 3, -13)), 0.02);
    }
    return;
  }

  if (!state.droneStart && !state.interactiveStarted) {
    state.droneStart = elapsedSec;
  }
  setPhaseText("Phase 4: Descent to Surface");
  hud.classList.remove("hidden");
  body.classList.add("drone-mode");

  const droneElapsed = elapsedSec - state.droneStart;
  const diveDuration = 18;
  const t = Math.min(1, droneElapsed / diveDuration);
  const eased = 1 - Math.pow(1 - t, 2.4);
  const citySurface = latLonToEarthVector(targetZone.lat, targetZone.lon, 12.65).add(earthWorld);
  const camOffset = citySurface.clone().sub(earthWorld).normalize().multiplyScalar(THREE.MathUtils.lerp(9.5, 3.2, eased));
  const drift = new THREE.Vector3(
    Math.sin(droneElapsed * 1.6) * (0.35 * (1 - eased)),
    Math.sin(droneElapsed * 1.1) * (0.25 * (1 - eased)),
    Math.cos(droneElapsed * 1.5) * (0.35 * (1 - eased))
  );

  const camPos = citySurface.clone().add(camOffset).add(drift);
  camera.position.copy(camPos);
  camera.lookAt(citySurface);

  cityLabel.textContent = "Target Zone: Acquired";
  const mins = Math.floor(droneElapsed / 60);
  const secs = Math.floor(droneElapsed % 60);
  timerLabel.textContent = `T+${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;

  if (t >= 1) {
    prepareInteractiveMode(earthWorld);
  }

  if (state.interactiveStarted && statueGroup) {
    const lookTarget = statueGroup.position.clone().add(new THREE.Vector3(0, 14, 0));
    const desired = statueGroup.position.clone().add(new THREE.Vector3(23, 16, 21));
    camera.position.lerp(desired, 0.04);
    camera.lookAt(lookTarget);
  }
}

canvas.addEventListener("click", (event) => {
  if (!state.interactiveStarted) return;
  const rect = canvas.getBoundingClientRect();
  pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
  pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
  raycaster.setFromCamera(pointer, camera);
  const hit = raycaster.intersectObjects(markerMeshes, false)[0];
  if (hit && hit.object.userData && hit.object.userData.url) {
    window.open(hit.object.userData.url, "_blank", "noopener,noreferrer");
  }
});

function animate() {
  const now = performance.now();
  const elapsedSec = (now - state.start) / 1000;
  const simTime = elapsedSec * 12;
  updateCinematic(elapsedSec, simTime);
  if (state.interactiveStarted) controls.update();
  if (statueGlobe) statueGlobe.rotation.y += 0.0025;
  markerMeshes.forEach((marker, idx) => {
    const s = 1 + Math.sin(elapsedSec * 2.5 + idx) * 0.26;
    marker.scale.setScalar(s);
  });
  updateAudio(elapsedSec);
  renderer.render(scene, camera);
  requestAnimationFrame(animate);
}

window.addEventListener("resize", () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

animate();
