import * as THREE from 'three';

const mount = document.getElementById('scene');
const error = document.getElementById('scene-error');
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x010503);
scene.fog = new THREE.FogExp2(0x010503, 0.012);

const camera = new THREE.PerspectiveCamera(39, 1, 0.1, 90);
camera.position.set(0, 5.7, 13.5);
camera.lookAt(0, 4.1, -9.5);

let renderer;
try {
  renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false, powerPreference: 'high-performance' });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.45;
  mount.append(renderer.domElement);
} catch (failure) {
  error.hidden = false;
  throw failure;
}

scene.add(new THREE.AmbientLight(0x9ec5ba, 1.1));
const key = new THREE.DirectionalLight(0xffffff, 2.9);
key.position.set(-4, 9, 13);
scene.add(key);
const greenLight = new THREE.PointLight(0x36db7a, 35, 32, 2);
greenLight.position.set(2, 6, -13);
scene.add(greenLight);
const blueLight = new THREE.PointLight(0x69cbe8, 12, 20, 2);
blueLight.position.set(-7, 5, -4);
scene.add(blueLight);

const tank = { width: 18, height: 8.7, depth: 21 };
const glyphs = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ';
const matrixPlanes = [];
function makeMatrixPlane(width, height, position, rotation, columns, rows, seed) {
  const canvas = document.createElement('canvas');
  canvas.width = columns * 25;
  canvas.height = rows * 27;
  const ctx = canvas.getContext('2d', { alpha: false });
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.minFilter = THREE.LinearFilter;
  texture.magFilter = THREE.LinearFilter;
  const material = new THREE.MeshBasicMaterial({ map: texture, side: THREE.DoubleSide, fog: false });
  const plane = new THREE.Mesh(new THREE.PlaneGeometry(width, height), material);
  plane.position.set(...position);
  plane.rotation.set(...rotation);
  scene.add(plane);
  matrixPlanes.push({ ctx, texture, columns, rows, seed, canvas });
}
makeMatrixPlane(18, 8.7, [0, 4.35, -21], [0, 0, 0], 32, 17, 1);
makeMatrixPlane(21, 8.7, [-9, 4.35, -10.5], [0, Math.PI / 2, 0], 36, 17, 2);
makeMatrixPlane(21, 8.7, [9, 4.35, -10.5], [0, -Math.PI / 2, 0], 36, 17, 3);
makeMatrixPlane(18, 21, [0, 0, -10.5], [-Math.PI / 2, 0, 0], 32, 38, 4);
makeMatrixPlane(18, 21, [0, 8.7, -10.5], [Math.PI / 2, 0, 0], 32, 38, 5);

function drawMatrix(time) {
  for (const { ctx, texture, columns, rows, seed, canvas } of matrixPlanes) {
    ctx.fillStyle = '#010603';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.font = '18px ui-monospace, monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    for (let x = 0; x < columns; x++) {
      const fall = Math.floor(time * (2.8 + (x % 5) * .31) + x * 5.39 + seed * 7.8);
      const presence = Math.sin(x * 13.91 + seed * 2.7) > -0.6;
      if (!presence) continue;
      for (let y = 0; y < rows; y++) {
        if (Math.sin(x * 53.1 + y * 29.7 + seed * 91.4) < -0.70) continue;
        const row = (y + fall) % rows;
        const brightness = 0.19 + Math.max(0, 1 - row / rows) * .57;
        const alpha = Math.min(.95, brightness * (.78 + .22 * Math.sin(time * 1.3 + x * 1.8 + y)));
        ctx.fillStyle = `rgba(30,255,105,${alpha})`;
        const code = (x * 13 + y * 7 + Math.floor(time * .8) + seed * 11) % glyphs.length;
        ctx.fillText(glyphs[code], x * 25 + 12, row * 27 + 14);
      }
    }
    texture.needsUpdate = true;
  }
}

const edges = new THREE.EdgesGeometry(new THREE.BoxGeometry(tank.width, tank.height, tank.depth));
const tankFrame = new THREE.LineSegments(edges, new THREE.LineBasicMaterial({ color: 0x50a68e, transparent: true, opacity: .48 }));
tankFrame.position.set(0, tank.height / 2, -tank.depth / 2);
scene.add(tankFrame);

const metalSkin = new THREE.MeshStandardMaterial({ color: 0x92a0a5, metalness: .76, roughness: .28 });
const darkMetal = new THREE.MeshStandardMaterial({ color: 0x344550, metalness: .81, roughness: .31 });
const seamMetal = new THREE.MeshStandardMaterial({ color: 0x202d34, metalness: .85, roughness: .34 });
const spikeMetal = new THREE.MeshStandardMaterial({ color: 0x778c99, metalness: .67, roughness: .34 });
new THREE.TextureLoader().load('./metal.jpg', texture => {
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(2.3, 1.8);
  metalSkin.map = texture;
  metalSkin.needsUpdate = true;
});

const unitY = new THREE.Vector3(0, 1, 0);
function orientBetween(mesh, a, b) {
  const direction = new THREE.Vector3().subVectors(a, b);
  mesh.position.copy(a).add(b).multiplyScalar(.5);
  mesh.quaternion.setFromUnitVectors(unitY, direction.clone().normalize());
  mesh.scale.y = direction.length();
}

function snakePath(t) {
  return new THREE.Vector3(
    -1.45 + 3.6 * Math.sin(t * .43),
    4.25 + 1.24 * Math.sin(t * .71 + .6),
    -8.4 + 3.0 * Math.sin(t * .28 + 1.2)
  );
}

const snakeParts = [];
const snakeSeams = [];
for (let i = 0; i < 17; i++) {
  const taper = 1 - Math.pow(i / 17, 1.7) * .86;
  const radius = .41 * taper + .055;
  const body = new THREE.Mesh(new THREE.CylinderGeometry(radius * .96, radius, 1, 16, 1), i % 3 === 0 ? darkMetal : metalSkin);
  scene.add(body);
  snakeParts.push(body);
  if (i < 16) {
    const seam = new THREE.Mesh(new THREE.TorusGeometry(radius * .98, .025, 5, 18), seamMetal);
    scene.add(seam);
    snakeSeams.push(seam);
  }
}
const tail = new THREE.Mesh(new THREE.ConeGeometry(.13, .86, 12), metalSkin);
scene.add(tail);

const head = new THREE.Group();
head.add(new THREE.Mesh(new THREE.SphereGeometry(.57, 18, 12), darkMetal));
const mouth = new THREE.Mesh(new THREE.CircleGeometry(.49, 32), new THREE.MeshBasicMaterial({ color: 0x020202, side: THREE.DoubleSide }));
mouth.position.z = .55;
head.add(mouth);
const mouthRim = new THREE.Mesh(new THREE.TorusGeometry(.49, .078, 9, 36), metalSkin);
mouthRim.position.z = .60;
head.add(mouthRim);
const petalShape = new THREE.Shape();
petalShape.moveTo(-.31, .34);
petalShape.bezierCurveTo(-.55, .65, -.34, 1.12, 0, 1.43);
petalShape.bezierCurveTo(.34, 1.12, .55, .65, .31, .34);
petalShape.lineTo(-.31, .34);
const petalGeometry = new THREE.ExtrudeGeometry(petalShape, { depth: .14, bevelEnabled: true, bevelThickness: .06, bevelSize: .045, bevelSegments: 2, steps: 1, curveSegments: 8 });
for (let i = 0; i < 4; i++) {
  const petal = new THREE.Mesh(petalGeometry, metalSkin);
  petal.rotation.z = i * Math.PI / 2;
  petal.position.z = .39;
  head.add(petal);
  const eye = new THREE.Mesh(new THREE.SphereGeometry(.09, 9, 7), new THREE.MeshBasicMaterial({ color: 0xe93424 }));
  eye.position.set(-Math.sin(i * Math.PI / 2) * 1.09, Math.cos(i * Math.PI / 2) * 1.09, .60);
  head.add(eye);
}
const innerRed = new THREE.Mesh(new THREE.SphereGeometry(.13, 12, 8), new THREE.MeshBasicMaterial({ color: 0xd82820 }));
innerRed.position.z = .57;
head.add(innerRed);
const toothMaterial = new THREE.MeshStandardMaterial({ color: 0xd6d8c9, roughness: .42 });
for (let i = 0; i < 12; i++) {
  const angle = i * Math.PI * 2 / 12;
  const tooth = new THREE.Mesh(new THREE.ConeGeometry(.055, .21, 5), toothMaterial);
  tooth.position.set(Math.cos(angle) * .39, Math.sin(angle) * .39, .67);
  tooth.rotation.z = angle + Math.PI / 2;
  head.add(tooth);
}
scene.add(head);

function updateSnake(t) {
  const points = Array.from({ length: 19 }, (_, i) => snakePath(t - i * .40));
  for (let i = 0; i < snakeParts.length; i++) {
    orientBetween(snakeParts[i], points[i], points[i + 1]);
    if (i < snakeSeams.length) {
      snakeSeams[i].position.copy(points[i + 1]);
      snakeSeams[i].quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), new THREE.Vector3().subVectors(points[i], points[i + 2]).normalize());
    }
  }
  const tip = points[17].clone().add(points[17].clone().sub(points[16]).normalize().multiplyScalar(.7));
  orientBetween(tail, points[17], tip);
  tail.scale.y = .86;
  head.position.copy(points[0]);
  const forward = new THREE.Vector3().subVectors(points[0], points[2]).normalize();
  const towardViewer = new THREE.Vector3().subVectors(camera.position, points[0]).normalize();
  head.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), forward.lerp(towardViewer, .7).normalize());
}

function makeSpikeball() {
  const orb = new THREE.Group();
  const shell = new THREE.Mesh(new THREE.SphereGeometry(.86, 24, 18), darkMetal);
  orb.add(shell);
  const coneGeometry = new THREE.ConeGeometry(.10, .37, 6);
  for (let i = 0; i < 34; i++) {
    const y = 1 - (i + .5) * 2 / 34;
    const radius = Math.sqrt(1 - y * y);
    const angle = i * 2.3999632297;
    const normal = new THREE.Vector3(Math.cos(angle) * radius, y, Math.sin(angle) * radius);
    if (normal.z > .67 && Math.abs(normal.y) < .38 && Math.abs(normal.x) < .48) continue;
    const spike = new THREE.Mesh(coneGeometry, spikeMetal);
    spike.position.copy(normal).multiplyScalar(1.01);
    spike.quaternion.setFromUnitVectors(unitY, normal);
    orb.add(spike);
  }
  const eye = new THREE.Group();
  const eyeShape = new THREE.Shape();
  eyeShape.moveTo(-.46, 0);
  eyeShape.quadraticCurveTo(0, .30, .46, 0);
  eyeShape.quadraticCurveTo(0, -.34, -.46, 0);
  eye.add(new THREE.Mesh(new THREE.ShapeGeometry(eyeShape), new THREE.MeshBasicMaterial({ color: 0x020205, side: THREE.DoubleSide })));
  const iris = new THREE.Mesh(new THREE.CircleGeometry(.205, 26), new THREE.MeshBasicMaterial({ color: 0xe81926 }));
  iris.position.z = .013;
  eye.add(iris);
  const pupil = new THREE.Mesh(new THREE.CircleGeometry(.09, 22), new THREE.MeshBasicMaterial({ color: 0x000000 }));
  pupil.position.z = .018;
  eye.add(pupil);
  eye.position.set(0, .03, .88);
  orb.add(eye);
  scene.add(orb);
  return { orb, eye };
}
const twins = [makeSpikeball(), makeSpikeball()];
function updateTwins(t) {
  const locations = [
    [-5.6 + .68 * Math.sin(t * .53), 5.4 + .42 * Math.sin(t * .8), -10.0 + .7 * Math.sin(t * .29)],
    [5.5 + .7 * Math.sin(t * .4 + 2), 3.7 + .6 * Math.sin(t * .68 + 1), -8.1 + .8 * Math.sin(t * .32 + 1)],
  ];
  for (let i = 0; i < 2; i++) {
    twins[i].orb.position.set(...locations[i]);
    twins[i].orb.rotation.y = .14 * Math.sin(t * .35 + i);
    const blink = (t + i * 2.3) % 5.6;
    twins[i].eye.scale.y = blink < .19 ? Math.max(.05, Math.abs(blink - .095) / .095) : 1;
  }
}

const smiley = new THREE.Group();
const smileyMaterial = new THREE.MeshBasicMaterial({ color: 0x9d38e0, transparent: true, opacity: .55, depthWrite: false, side: THREE.DoubleSide });
const smileyShell = new THREE.Mesh(new THREE.SphereGeometry(.92, 28, 20), smileyMaterial);
smileyShell.renderOrder = 1;
smiley.add(smileyShell);
const faceMaterial = new THREE.MeshBasicMaterial({ color: 0x030405, transparent: true, opacity: 1, depthWrite: false, depthTest: false });
for (const x of [-.27, .27]) {
  const eye = new THREE.Mesh(new THREE.SphereGeometry(.093, 12, 8), faceMaterial);
  eye.position.set(x, .16, .88);
  eye.renderOrder = 5;
  smiley.add(eye);
}
const smilePoints = [];
for (let i = 0; i <= 18; i++) {
  const x = -.39 + i / 18 * .78;
  smilePoints.push(new THREE.Vector3(x, -.08 - .24 * (1 - (x / .39) ** 2), .89));
}
const smile = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(smilePoints), 18, .027, 6, false), faceMaterial);
smile.renderOrder = 5;
smiley.add(smile);
scene.add(smiley);
function updateSmiley(t) {
  smiley.position.set(1.65 + 1.35 * Math.sin(t * .37), 2.43 + .54 * Math.sin(t * .77), -5.9 + .7 * Math.sin(t * .3));
  smileyMaterial.color.setHSL((t * .045 + .72) % 1, .78, .53);
}

function resize() {
  const width = Math.max(1, mount.clientWidth);
  const height = Math.max(1, mount.clientHeight);
  renderer.setSize(width, height, false);
  camera.aspect = width / height;
  camera.updateProjectionMatrix();
}
new ResizeObserver(resize).observe(mount);
resize();
drawMatrix(0);
let lastMatrixUpdate = 0;
let lastFrame = 0;
const start = performance.now();
function frame(now) {
  requestAnimationFrame(frame);
  if (document.hidden || now - lastFrame < 33) return;
  lastFrame = now;
  const t = reducedMotion ? 5 : (now - start) / 1000;
  if (now - lastMatrixUpdate > 125) {
    drawMatrix(t);
    lastMatrixUpdate = now;
  }
  updateSnake(t);
  updateTwins(t);
  updateSmiley(t);
  renderer.render(scene, camera);
}
requestAnimationFrame(frame);
