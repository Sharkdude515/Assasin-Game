// On-screen error reporter for mobile debugging
window.onerror = function (msg, url, line) {
  const hint = document.getElementById('controls-hint');
  if (hint) {
    hint.style.color = '#ff6b6b';
    hint.textContent = 'Error line ' + line + ': ' + msg;
  }
};

// 1. DEVICE DETECTION
const isTouchDevice = ('ontouchstart' in window) || (navigator.maxTouchPoints > 0);
const touchUI = document.getElementById('touch-ui');
const hintEl = document.getElementById('controls-hint');

if (isTouchDevice) {
  touchUI.style.display = 'block';
  hintEl.textContent = 'Left Stick: Move | Swipe Screen: Rotate Camera | Buttons: Sneak / Jump / Strike';
}

document.getElementById('restart-btn').addEventListener('click', () => {
  location.reload();
});

// 2. SCENE, CAMERA & RENDERER
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x1e2536);
scene.fog = new THREE.FogExp2(0x1e2536, 0.018);

const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 200);
const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
document.body.appendChild(renderer.domElement);

// 3. LIGHTING
const ambientLight = new THREE.AmbientLight(0x8fa8ff, 0.85);
scene.add(ambientLight);

const moonLight = new THREE.DirectionalLight(0xffe8cc, 1.25);
moonLight.position.set(25, 45, 20);
moonLight.castShadow = true;
moonLight.shadow.mapSize.set(1024, 1024);
scene.add(moonLight);

// 4. ENVIRONMENT & PARKOUR PLATFORMS
const ground = new THREE.Mesh(
  new THREE.PlaneGeometry(120, 120),
  new THREE.MeshStandardMaterial({ color: 0x353b48, roughness: 0.85 })
);
ground.rotation.x = -Math.PI / 2;
ground.receiveShadow = true;
scene.add(ground);

const platforms = [];
function createBlock(x, y, z, w, h, d, color = 0x6c6051) {
  const mesh = new THREE.Mesh(
    new THREE.BoxGeometry(w, h, d),
    new THREE.MeshStandardMaterial({ color, roughness: 0.8 })
  );
  mesh.position.set(x, y + h / 2, z);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  scene.add(mesh);
  platforms.push({
    minX: x - w / 2,
    maxX: x + w / 2,
    minZ: z - d / 2,
    maxZ: z + d / 2,
    topY: y + h
  });
}

// Fortress rooftops, towers, and parkour step-crates
createBlock(0, 0, -14, 14, 3.5, 8, 0x7d6f5d);
createBlock(-5.5, 0, -9, 2.2, 1.4, 2.2, 0x9c7a4e);
createBlock(-3.2, 0, -9, 2.2, 2.6, 2.2, 0x9c7a4e);
createBlock(12, 0, 4, 8, 3.0, 10, 0x7d6f5d);
createBlock(7.2, 0, 4, 2, 1.6, 2, 0x9c7a4e);
createBlock(-12, 0, 8, 7, 2.2, 7, 0x665d52);

// 5. PLAYER (Assassin)
const player = new THREE.Group();
const bodyMesh = new THREE.Mesh(
  new THREE.CylinderGeometry(0.35, 0.5, 1.4, 12),
  new THREE.MeshStandardMaterial({ color: 0xf8f9fa })
);
bodyMesh.position.y = 0.7;
bodyMesh.castShadow = true;

const headMesh = new THREE.Mesh(
  new THREE.ConeGeometry(0.36, 0.55, 12),
  new THREE.MeshStandardMaterial({ color: 0xe03131 })
);
headMesh.position.y = 1.6;
headMesh.castShadow = true;

player.add(bodyMesh, headMesh);
player.position.set(0, 0, 14);
scene.add(player);

let playerVelY = 0;
let isGrounded = true;
let isCrouching = false;
let gameOver = false;

// 6. GUARDS & PATROL AI
const guards = [];
function spawnGuard(startPos, endPos) {
  const group = new THREE.Group();
  const armor = new THREE.Mesh(
    new THREE.CylinderGeometry(0.4, 0.45, 1.6, 12),
    new THREE.MeshStandardMaterial({ color: 0x343a40 })
  );
  armor.position.y = 0.8;
  armor.castShadow = true;

  const helm = new THREE.Mesh(
    new THREE.SphereGeometry(0.32, 12, 12),
    new THREE.MeshStandardMaterial({ color: 0xced4da })
  );
  helm.position.y = 1.75;

  const coneGeo = new THREE.ConeGeometry(3.2, 7.5, 16, 1, true);
  coneGeo.translate(0, -3.75, 0);
  coneGeo.rotateX(-Math.PI / 2);
  const coneMat = new THREE.MeshBasicMaterial({
    color: 0xffd43b,
    transparent: true,
    opacity: 0.25,
    side: THREE.DoubleSide
  });
  const visionCone = new THREE.Mesh(coneGeo, coneMat);
  visionCone.position.y = 0.9;

  group.add(armor, helm, visionCone);
  group.position.set(startPos.x, startPos.y, startPos.z);
  scene.add(group);

  guards.push({
    mesh: group,
    coneMat,
    waypoints: [startPos, endPos],
    currentWp: 1,
    alive: true,
    alertTimer: 0
  });
}

spawnGuard(new THREE.Vector3(-8, 0, -2), new THREE.Vector3(8, 0, -2));
spawnGuard(new THREE.Vector3(0, 3.5, -16), new THREE.Vector3(0, 3.5, -11));
spawnGuard(new THREE.Vector3(6, 0, 10), new THREE.Vector3(-6, 0, 10));
// 7. UNIFIED INPUT SYSTEM (PC Keyboard/Mouse + Mobile Touch)
const keys = {};
let joyX = 0, joyY = 0;
let camYaw = 0;
let camPitch = 0.55;

// Keyboard (PC)
window.addEventListener('keydown', (e) => {
  keys[e.code] = true;
  if (e.code === 'Space') triggerJump();
  if (e.code === 'KeyE') attemptAssassination();
});
window.addEventListener('keyup', (e) => {
  keys[e.code] = false;
});

// Mouse Drag Camera Orbit (PC)
let isMouseDragging = false;
let prevMouseX = 0, prevMouseY = 0;
renderer.domElement.addEventListener('mousedown', (e) => {
  isMouseDragging = true;
  prevMouseX = e.clientX;
  prevMouseY = e.clientY;
});
window.addEventListener('mouseup', () => {
  isMouseDragging = false;
});
window.addEventListener('mousemove', (e) => {
  if (!isMouseDragging) return;
  camYaw -= (e.clientX - prevMouseX) * 0.007;
  camPitch = Math.max(0.2, Math.min(1.2, camPitch + (e.clientY - prevMouseY) * 0.005));
  prevMouseX = e.clientX;
  prevMouseY = e.clientY;
});

// Touch Camera Orbit (Phone)
let camTouchId = null;
let prevTouchX = 0, prevTouchY = 0;
renderer.domElement.addEventListener('touchstart', (e) => {
  touchUI.style.display = 'block';
  const t = e.changedTouches.item(0);
  if (camTouchId === null && t) {
    camTouchId = t.identifier;
    prevTouchX = t.clientX;
    prevTouchY = t.clientY;
  }
}, { passive: false });

renderer.domElement.addEventListener('touchmove', (e) => {
  e.preventDefault();
  for (let i = 0; i < e.changedTouches.length; i++) {
    const t = e.changedTouches.item(i);
    if (t && t.identifier === camTouchId) {
      camYaw -= (t.clientX - prevTouchX) * 0.009;
      camPitch = Math.max(0.2, Math.min(1.2, camPitch + (t.clientY - prevTouchY) * 0.006));
      prevTouchX = t.clientX;
      prevTouchY = t.clientY;
    }
  }
}, { passive: false });

renderer.domElement.addEventListener('touchend', (e) => {
  for (let i = 0; i < e.changedTouches.length; i++) {
    const t = e.changedTouches.item(i);
    if (t && t.identifier === camTouchId) camTouchId = null;
  }
});

// Virtual Joystick (Phone)
const joyZone = document.getElementById('joystick-zone');
const joyStick = document.getElementById('joystick-stick');
let joyTouchId = null;

joyZone.addEventListener('touchstart', (e) => {
  e.preventDefault();
  const t = e.changedTouches.item(0);
  if (t) {
    joyTouchId = t.identifier;
    updateJoystick(t.clientX, t.clientY);
  }
}, { passive: false });

joyZone.addEventListener('touchmove', (e) => {
  e.preventDefault();
  for (let i = 0; i < e.changedTouches.length; i++) {
    const t = e.changedTouches.item(i);
    if (t && t.identifier === joyTouchId) updateJoystick(t.clientX, t.clientY);
  }
}, { passive: false });

joyZone.addEventListener('touchend', (e) => {
  for (let i = 0; i < e.changedTouches.length; i++) {
    const t = e.changedTouches.item(i);
    if (t && t.identifier === joyTouchId) {
      joyTouchId = null;
      joyX = 0;
      joyY = 0;
      joyStick.style.transform = 'translate(-50%, -50%)';
    }
  }
});

function updateJoystick(clientX, clientY) {
  const rect = joyZone.getBoundingClientRect();
  const centerX = rect.left + rect.width / 2;
  const centerY = rect.top + rect.height / 2;
  const maxRadius = rect.width / 2 - 21;

  let dx = clientX - centerX;
  let dy = clientY - centerY;
  const dist = Math.hypot(dx, dy);

  if (dist > maxRadius) {
    dx = (dx / dist) * maxRadius;
    dy = (dy / dist) * maxRadius;
  }

  joyStick.style.transform = `translate(calc(-50% + ${dx}px), calc(-50% + ${dy}px))`;
  joyX = dx / maxRadius;
  joyY = dy / maxRadius;
}

// Mobile Action Buttons
let touchSneakToggle = false;
const btnSneak = document.getElementById('btn-sneak');
btnSneak.addEventListener('touchstart', (e) => {
  e.preventDefault();
  touchSneakToggle = !touchSneakToggle;
  btnSneak.classList.toggle('active', touchSneakToggle);
});

document.getElementById('btn-jump').addEventListener('touchstart', (e) => {
  e.preventDefault();
  triggerJump();
});

document.getElementById('btn-strike').addEventListener('touchstart', (e) => {
  e.preventDefault();
  attemptAssassination();
});

function triggerJump() {
  if (!gameOver && isGrounded) {
    playerVelY = 0.24;
    isGrounded = false;
  }
}

function attemptAssassination() {
  if (gameOver) return;
  for (const g of guards) {
    if (!g.alive) continue;
    if (player.position.distanceTo(g.mesh.position) < 2.5) {
      g.alive = false;
      g.mesh.rotation.x = Math.PI / 2;
      g.mesh.position.y += 0.3;
      g.coneMat.visible = false;
      updateTargetCount();
      break;
    }
  }
}

function updateTargetCount() {
  const remaining = guards.filter(g => g.alive).length;
  document.getElementById('targets-left').textContent = remaining;
  if (remaining === 0) {
    endGame('MISSION COMPLETE', 'All targets eliminated without compromise.', '#51cf66');
  }
}

function endGame(title, sub, color) {
  gameOver = true;
  const msg = document.getElementById('message');
  const titleEl = document.getElementById('msg-title');
  titleEl.textContent = title;
  titleEl.style.color = color;
  document.getElementById('msg-sub').textContent = sub;
  msg.style.display = 'flex';
}

// 8. MAIN GAME LOOP
const clock = new THREE.Clock();
const statusEl = document.getElementById('status');
const promptEl = document.getElementById('prompt');

function animate() {
  requestAnimationFrame(animate);
  if (gameOver) return;

  const dt = Math.min(clock.getDelta(), 0.05) * 60;

  // Crouch state
  isCrouching = !!(keys['ShiftLeft'] || keys['ShiftRight'] || touchSneakToggle);
  player.scale.y = isCrouching ? 0.65 : 1.0;

  // Combine PC WASD + Phone Joystick inputs
  let inputX = joyX;
  let inputZ = joyY;
  if (keys['KeyW'] || keys['ArrowUp']) inputZ -= 1;
  if (keys['KeyS'] || keys['ArrowDown']) inputZ += 1;
  if (keys['KeyA'] || keys['ArrowLeft']) inputX -= 1;
  if (keys['KeyD'] || keys['ArrowRight']) inputX += 1;

  const inputMag = Math.hypot(inputX, inputZ);
  if (inputMag > 0.05) {
    if (inputMag > 1) {
      inputX /= inputMag;
      inputZ /= inputMag;
    }
    const speed = (isCrouching ? 0.06 : 0.13) * dt;
    const moveAngle = Math.atan2(inputX, inputZ) + camYaw;
    player.rotation.y = moveAngle;
    player.position.x += Math.sin(moveAngle) * speed;
    player.position.z += Math.cos(moveAngle) * speed;
  }

  // Gravity & Parkour Platform Collision
  playerVelY -= 0.012 * dt;
  player.position.y += playerVelY * dt;

  let floorHeight = 0;
  for (const p of platforms) {
    if (
      player.position.x > p.minX - 0.3 &&
      player.position.x < p.maxX + 0.3 &&
      player.position.z > p.minZ - 0.3 &&
      player.position.z < p.maxZ + 0.3
    ) {
      if (player.position.y >= p.topY - 0.45) {
        floorHeight = Math.max(floorHeight, p.topY);
      }
    }
  }

  if (player.position.y <= floorHeight) {
    player.position.y = floorHeight;
    playerVelY = 0;
    isGrounded = true;
  }

  // Guard AI & Detection
  let canAssassinate = false;
  let detected = false;

  for (const g of guards) {
    if (!g.alive) continue;

    const targetWp = g.waypoints[g.currentWp];
    const dir = new THREE.Vector3().subVectors(targetWp, g.mesh.position);
    dir.y = 0;
    if (dir.length() < 0.25) {
      g.currentWp = (g.currentWp + 1) % g.waypoints.length;
    } else {
      dir.normalize();
      g.mesh.position.addScaledVector(dir, 0.035 * dt);
      g.mesh.rotation.y = Math.atan2(dir.x, dir.z);
    }

    const distToPlayer = player.position.distanceTo(g.mesh.position);
    if (distToPlayer < 2.5) canAssassinate = true;

    const forward = new THREE.Vector3(Math.sin(g.mesh.rotation.y), 0, Math.cos(g.mesh.rotation.y));
    const toPlayer = new THREE.Vector3().subVectors(player.position, g.mesh.position).normalize();
    const dot = forward.dot(toPlayer);
    const sightRange = isCrouching ? 4.2 : 7.5;

    if (distToPlayer < sightRange && dot > 0.78 && Math.abs(player.position.y - g.mesh.position.y) < 1.8) {
      g.coneMat.color.setHex(0xff3b3b);
      g.alertTimer += 1 * dt;
      detected = true;
      if (g.alertTimer > 45) {
        endGame('DESYNCHRONIZED', 'You were spotted by the guards!', '#ff6b6b');
      }
    } else {
      g.coneMat.color.setHex(0xffd43b);
      g.alertTimer = Math.max(0, g.alertTimer - 1 * dt);
    }
  }

  // HUD Updates
  promptEl.style.display = canAssassinate ? 'block' : 'none';
  promptEl.textContent = isTouchDevice ? 'TAP STRIKE TO ASSASSINATE' : 'PRESS [E] TO ASSASSINATE';

  if (detected) {
    statusEl.textContent = 'SPOTTED!';
    statusEl.style.color = '#ff6b6b';
  } else if (isCrouching) {
    statusEl.textContent = 'STEALTH (CROUCHED)';
    statusEl.style.color = '#4dabf7';
  } else {
    statusEl.textContent = 'HIDDEN';
    statusEl.style.color = '#51cf66';
  }

  // Smooth Orbiting Third-Person Camera
  const camDist = 10.5;
  const camX = player.position.x + Math.sin(camYaw) * Math.cos(camPitch) * camDist;
  const camY = player.position.y + Math.sin(camPitch) * camDist + 1.5;
  const camZ = player.position.z + Math.cos(camYaw) * Math.cos(camPitch) * camDist;

  camera.position.lerp(new THREE.Vector3(camX, camY, camZ), 0.15);
  camera.lookAt(player.position.x, player.position.y + 1.2, player.position.z);

  renderer.render(scene, camera);
}

// Handle Window Resize & Phone Screen Rotation
window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

animate();
