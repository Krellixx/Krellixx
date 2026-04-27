const canvas = document.getElementById("spaceCanvas");
const phaseLabel = document.getElementById("phaseLabel");
const cityLabel = document.getElementById("cityLabel");
const timerLabel = document.getElementById("timerLabel");
const hud = document.getElementById("hud");
const body = document.body;

const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: "high-performance" });
renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
renderer.setSize(window.innerWidth, window.innerHeight);

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x000000);

const camera = new THREE.PerspectiveCamera(55, window.innerWidth / window.innerHeight, 0.1, 12000);
camera.position.set(0, 0, 2200);

const ambient = new THREE.AmbientLight(0xffffff, 0.16);
scene.add(ambient);
const sunLight = new THREE.PointLight(0xffcc88, 2.4, 9000, 2);
scene.add(sunLight);

const textureLoader = new THREE.TextureLoader();
const earthTexture = textureLoader.load("https://threejs.org/examples/textures/planets/earth_atmos_2048.jpg");
const earthBump = textureLoader.load("https://threejs.org/examples/textures/planets/earth_bump_2048.jpg");
const earthSpec = textureLoader.load("https://threejs.org/examples/textures/planets/earth_specular_2048.jpg");
const cloudTexture = textureLoader.load("https://threejs.org/examples/textures/planets/earth_clouds_1024.png");
const moonTexture = textureLoader.load("https://threejs.org/examples/textures/planets/moon_1024.jpg");

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
let moon = null;

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

    moon = new THREE.Mesh(
      new THREE.SphereGeometry(3.3, 36, 36),
      new THREE.MeshStandardMaterial({
        map: moonTexture,
        roughness: 0.92,
        metalness: 0.02
      })
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
const cityPath = [
  { name: "Tokyo", lat: 35.6762, lon: 139.6503 },
  { name: "Delhi", lat: 28.6139, lon: 77.209 },
  { name: "Dubai", lat: 25.2048, lon: 55.2708 },
  { name: "Paris", lat: 48.8566, lon: 2.3522 },
  { name: "London", lat: 51.5072, lon: -0.1276 },
  { name: "New York", lat: 40.7128, lon: -74.006 },
  { name: "Mexico City", lat: 19.4326, lon: -99.1332 },
  { name: "Rio", lat: -22.9068, lon: -43.1729 },
  { name: "Cape Town", lat: -33.9249, lon: 18.4241 },
  { name: "Sydney", lat: -33.8688, lon: 151.2093 }
];

const state = {
  start: performance.now(),
  droneStart: 0
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
  if (earth) {
    earth.rotation.z = earthTilt;
  }
  if (moon && earth) {
    const earthPos = earth.position;
    const moonAngle = t * 0.07;
    const moonRadius = 34;
    moon.position.set(
      earthPos.x + Math.cos(moonAngle) * moonRadius,
      earthPos.y + Math.sin(moonAngle * 0.7) * 3.2,
      earthPos.z + Math.sin(moonAngle) * moonRadius
    );
    moon.rotation.y += 0.0022;
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

function updateCinematic(elapsedSec, simTime) {
  updatePlanets(simTime);
  const earthWorld = earth.getWorldPosition(new THREE.Vector3());
  earthMarker.position.copy(earthWorld).multiplyScalar(1.02);
  earthMarker.material.opacity = elapsedSec > 10 ? 0.8 : 0;

  if (elapsedSec < 5) {
    setPhaseText("Phase 1: Deep Space Signal");
    const pulse = 1 + Math.sin(elapsedSec * 4.5) * 0.08;
    sun.scale.setScalar(pulse);
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
    return;
  }

  const moonWorld = moon.getWorldPosition(new THREE.Vector3());

  if (elapsedSec < 39) {
    setPhaseText("Phase 4: Moon Flyby");
    const p = (elapsedSec - 30) / 9;
    const eased = 1 - Math.pow(1 - p, 2.1);
    const approachStart = earthWorld.clone().add(new THREE.Vector3(26, 11, 20));
    const approachEnd = moonWorld.clone().add(new THREE.Vector3(8, 2.5, 8));
    const approach = lerpVec(approachStart, approachEnd, eased);

    const orbitAngle = eased * Math.PI * 1.35;
    const orbitOffset = new THREE.Vector3(
      Math.cos(orbitAngle) * 7.5,
      Math.sin(orbitAngle * 0.8) * 2.4 + 1.2,
      Math.sin(orbitAngle) * 7.5
    );
    camera.position.copy(approach.add(orbitOffset));
    camera.lookAt(moonWorld);
    hud.classList.add("hidden");
    body.classList.remove("drone-mode");
    return;
  }

  if (!state.droneStart) {
    state.droneStart = elapsedSec;
  }
  setPhaseText("Phase 5: Drone Flyover // Global Cities");
  hud.classList.remove("hidden");
  body.classList.add("drone-mode");

  const droneElapsed = elapsedSec - state.droneStart;
  const routeDuration = 56;
  const normalized = (droneElapsed % routeDuration) / routeDuration;
  const cityProgress = normalized * cityPath.length;
  const i = Math.floor(cityProgress) % cityPath.length;
  const next = (i + 1) % cityPath.length;
  const localT = cityProgress - Math.floor(cityProgress);

  const a = cityPath[i];
  const b = cityPath[next];
  const lat = THREE.MathUtils.lerp(a.lat, b.lat, localT);
  const lon = THREE.MathUtils.lerp(a.lon, b.lon, localT);
  const citySurface = latLonToEarthVector(lat, lon, 12.2).add(earthWorld);
  const camOffset = citySurface.clone().sub(earthWorld).normalize().multiplyScalar(8.7);
  const drift = new THREE.Vector3(
    Math.sin(droneElapsed * 1.6) * 0.35,
    Math.sin(droneElapsed * 1.1) * 0.25,
    Math.cos(droneElapsed * 1.5) * 0.35
  );

  const camPos = citySurface.clone().add(camOffset).add(drift);
  camera.position.copy(camPos);
  camera.lookAt(citySurface);

  cityLabel.textContent = `Target City: ${a.name}`;
  const mins = Math.floor(droneElapsed / 60);
  const secs = Math.floor(droneElapsed % 60);
  timerLabel.textContent = `T+${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
}

function animate() {
  const now = performance.now();
  const elapsedSec = (now - state.start) / 1000;
  const simTime = elapsedSec * 12;
  updateCinematic(elapsedSec, simTime);
  renderer.render(scene, camera);
  requestAnimationFrame(animate);
}

window.addEventListener("resize", () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

animate();
