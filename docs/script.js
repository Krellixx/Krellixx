const canvas = document.getElementById("spaceCanvas");
const statusEl = document.getElementById("status");
const subStatusEl = document.getElementById("subStatus");
const droneOverlay = document.getElementById("droneOverlay");

const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
renderer.setSize(window.innerWidth, window.innerHeight);

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x000000);

const camera = new THREE.PerspectiveCamera(48, window.innerWidth / window.innerHeight, 0.1, 50000);
camera.position.set(0, 0, 3600);

const ambient = new THREE.AmbientLight(0xffffff, 0.22);
scene.add(ambient);

const sunLight = new THREE.PointLight(0xffb347, 2.6, 0, 1.3);
sunLight.position.set(0, 0, 0);
scene.add(sunLight);

const loader = new THREE.TextureLoader();
loader.crossOrigin = "anonymous";

const textures = {
  sun: loader.load("https://threejs.org/examples/textures/planets/sun.jpg"),
  earth: loader.load("https://threejs.org/examples/textures/planets/earth_atmos_2048.jpg"),
  earthNormal: loader.load("https://threejs.org/examples/textures/planets/earth_normal_2048.jpg"),
  earthSpec: loader.load("https://threejs.org/examples/textures/planets/earth_specular_2048.jpg")
};

const universe = new THREE.Group();
scene.add(universe);

const stars = makeStarField(6000, 22000);
scene.add(stars);

const solarSystem = new THREE.Group();
solarSystem.visible = false;
universe.add(solarSystem);

const sun = new THREE.Mesh(
  new THREE.SphereGeometry(290, 64, 64),
  new THREE.MeshStandardMaterial({
    map: textures.sun,
    emissive: new THREE.Color(0xff8c2a),
    emissiveIntensity: 1.6,
    roughness: 1,
    metalness: 0
  })
);
solarSystem.add(sun);

const earthOrbitRadius = 1600;
const earthPivot = new THREE.Object3D();
solarSystem.add(earthPivot);

const earth = new THREE.Mesh(
  new THREE.SphereGeometry(74, 128, 128),
  new THREE.MeshStandardMaterial({
    map: textures.earth,
    normalMap: textures.earthNormal,
    specularMap: textures.earthSpec,
    roughness: 0.82,
    metalness: 0.04
  })
);
earth.position.set(earthOrbitRadius, 0, 0);
earthPivot.add(earth);

const atmosphere = new THREE.Mesh(
  new THREE.SphereGeometry(78, 96, 96),
  new THREE.MeshBasicMaterial({
    color: 0x63a8ff,
    transparent: true,
    opacity: 0.18
  })
);
atmosphere.position.copy(earth.position);
earthPivot.add(atmosphere);

const tinyBluePoint = new THREE.Mesh(
  new THREE.SphereGeometry(9, 24, 24),
  new THREE.MeshBasicMaterial({ color: 0x4ea2ff })
);
tinyBluePoint.position.copy(earth.position);
tinyBluePoint.visible = false;
earthPivot.add(tinyBluePoint);

const earthCluster = new THREE.Group();
earthCluster.visible = false;
scene.add(earthCluster);

const earthPositions = [
  new THREE.Vector3(-230, 0, 0),
  new THREE.Vector3(0, 0, 0),
  new THREE.Vector3(230, 0, 0)
];

for (let i = 0; i < 3; i += 1) {
  const sphere = new THREE.Mesh(
    new THREE.SphereGeometry(74, 128, 128),
    new THREE.MeshStandardMaterial({
      map: textures.earth,
      normalMap: textures.earthNormal,
      specularMap: textures.earthSpec,
      roughness: 0.8,
      metalness: 0.05
    })
  );
  sphere.position.copy(earthPositions[i]);
  earthCluster.add(sphere);

  const glow = new THREE.Mesh(
    new THREE.SphereGeometry(80, 64, 64),
    new THREE.MeshBasicMaterial({
      color: 0x7ab8ff,
      transparent: true,
      opacity: 0.15
    })
  );
  glow.position.copy(earthPositions[i]);
  earthCluster.add(glow);
}

const orangePoint = new THREE.Mesh(
  new THREE.SphereGeometry(3.2, 24, 24),
  new THREE.MeshBasicMaterial({ color: 0xff9d2f })
);
orangePoint.position.set(0, 0, 0);
scene.add(orangePoint);

const timeline = {
  holdVoid: 5,
  zoomSun: 10,
  revealEarthPoint: 6,
  zoomEarth: 8,
  switchToTriple: 2,
  droneFly: 50
};

const totalTimelineSeconds =
  timeline.holdVoid +
  timeline.zoomSun +
  timeline.revealEarthPoint +
  timeline.zoomEarth +
  timeline.switchToTriple +
  timeline.droneFly;

const clock = new THREE.Clock();

function makeStarField(count, spread) {
  const positions = new Float32Array(count * 3);
  for (let i = 0; i < count; i += 1) {
    const radius = 1200 + Math.random() * spread;
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.acos(2 * Math.random() - 1);
    positions[i * 3 + 0] = radius * Math.sin(phi) * Math.cos(theta);
    positions[i * 3 + 1] = radius * Math.sin(phi) * Math.sin(theta);
    positions[i * 3 + 2] = radius * Math.cos(phi);
  }
  const geom = new THREE.BufferGeometry();
  geom.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  return new THREE.Points(
    geom,
    new THREE.PointsMaterial({
      color: 0xffffff,
      size: 6,
      sizeAttenuation: true,
      transparent: true,
      opacity: 0.72
    })
  );
}

function smoothstep(t) {
  const x = Math.min(1, Math.max(0, t));
  return x * x * (3 - 2 * x);
}

function lerp(a, b, t) {
  return a + (b - a) * t;
}

function setStatus(line1, line2) {
  statusEl.textContent = line1;
  subStatusEl.textContent = line2;
}

function updateSceneByTime(t) {
  sun.rotation.y += 0.0018;
  earth.rotation.y += 0.007;
  atmosphere.rotation.y -= 0.0012;
  earthPivot.rotation.y += 0.0007;
  stars.rotation.y += 0.00003;

  let cursor = 0;

  if (t < timeline.holdVoid) {
    const pulse = 0.75 + Math.sin(t * 3.5) * 0.22;
    orangePoint.scale.setScalar(pulse);
    solarSystem.visible = false;
    earthCluster.visible = false;
    camera.position.set(0, 0, 3600);
    camera.lookAt(orangePoint.position);
    setStatus("Deep void lock: distant orange signal detected", "Sequence begins automatically in 5 seconds");
    return;
  }
  cursor += timeline.holdVoid;

  if (t < cursor + timeline.zoomSun) {
    solarSystem.visible = true;
    const p = smoothstep((t - cursor) / timeline.zoomSun);
    orangePoint.visible = true;
    orangePoint.scale.setScalar(lerp(1, 120, p));
    camera.position.set(lerp(0, 260, p), lerp(0, 80, p), lerp(3600, 1300, p));
    camera.lookAt(0, 0, 0);
    setStatus("Signal resolved: star confirmed", "Approaching the central body...");
    return;
  }
  cursor += timeline.zoomSun;

  if (t < cursor + timeline.revealEarthPoint) {
    const p = smoothstep((t - cursor) / timeline.revealEarthPoint);
    tinyBluePoint.visible = true;
    orangePoint.visible = false;
    camera.position.set(lerp(260, 1000, p), lerp(80, 180, p), lerp(1300, 1450, p));
    camera.lookAt(lerp(0, earth.position.x, p), lerp(0, 0, p), 0);
    setStatus("Secondary blue signature found", "Likely Earth. Trajectory realigned.");
    return;
  }
  cursor += timeline.revealEarthPoint;

  if (t < cursor + timeline.zoomEarth) {
    const p = smoothstep((t - cursor) / timeline.zoomEarth);
    tinyBluePoint.visible = false;
    camera.position.set(
      lerp(earth.position.x + 1000, earth.position.x + 180, p),
      lerp(180, 42, p),
      lerp(1450, 170, p)
    );
    camera.lookAt(earth.position.x, 0, 0);
    setStatus("Earth lock established", "Closing to orbital inspection distance...");
    return;
  }
  cursor += timeline.zoomEarth;

  if (t < cursor + timeline.switchToTriple) {
    const p = smoothstep((t - cursor) / timeline.switchToTriple);
    solarSystem.visible = p < 0.6;
    earthCluster.visible = p > 0.35;
    if (p > 0.35) {
      camera.position.set(lerp(earth.position.x + 180, 0, p), lerp(42, 130, p), lerp(170, 620, p));
      camera.lookAt(0, 0, 0);
    }
    setStatus("Scene transition", "Switching to triple-Earth drone capture.");
    return;
  }
  cursor += timeline.switchToTriple;

  const droneT = Math.min(1, (t - cursor) / timeline.droneFly);
  solarSystem.visible = false;
  earthCluster.visible = true;
  droneOverlay.classList.add("active");

  const angle = droneT * Math.PI * 2.35;
  const radius = lerp(560, 390, Math.sin(droneT * Math.PI));
  const y = 140 + Math.sin(droneT * Math.PI * 6) * 22;
  camera.position.set(Math.cos(angle) * radius, y, Math.sin(angle) * radius);
  camera.lookAt(0, 0, 0);

  earthCluster.children.forEach((mesh, idx) => {
    mesh.rotation.y += 0.002 + idx * 0.0004;
  });
  setStatus("DRONE ACTIVE: Earth triple flyover", "Autonomous pass - 50 second cinematic scan");
}

function animate() {
  const t = Math.min(totalTimelineSeconds + 1, clock.getElapsedTime());
  updateSceneByTime(t);
  renderer.render(scene, camera);
  requestAnimationFrame(animate);
}

function onResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
}

window.addEventListener("resize", onResize);
animate();
