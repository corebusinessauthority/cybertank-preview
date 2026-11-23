import * as THREE from 'three';

const mount = document.getElementById('scene');
const error = document.getElementById('scene-error');
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x010503);
scene.fog = new THREE.FogExp2(0x010503, 0.006);

const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 170);
const tank = { width: 24, height: 14, depth: 80 };
camera.position.set(0, tank.height / 2, 66);
camera.lookAt(0, tank.height / 2, 0);

let renderer;
try {
  renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false, powerPreference: 'high-performance' });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.2;
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
makeMatrixPlane(tank.width, tank.height, [0, 7, -40], [0, 0, 0], 32, 18, 1);
makeMatrixPlane(tank.depth, tank.height, [-12, 7, 0], [0, Math.PI / 2, 0], 52, 18, 2);
makeMatrixPlane(tank.depth, tank.height, [12, 7, 0], [0, -Math.PI / 2, 0], 52, 18, 3);
makeMatrixPlane(tank.width, tank.depth, [0, 0, 0], [-Math.PI / 2, 0, 0], 32, 52, 4);
makeMatrixPlane(tank.width, tank.depth, [0, 14, 0], [Math.PI / 2, 0, 0], 32, 52, 5);

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
tankFrame.position.set(0, tank.height / 2, 0);
scene.add(tankFrame);

const metalSkin = new THREE.MeshPhongMaterial({ color: 0xe3edf1, specular: 0xffffff, shininess: 116, emissive: 0x20282b });
const darkMetal = new THREE.MeshPhongMaterial({ color: 0x56636b, specular: 0xf3f7fc, shininess: 120, emissive: 0x101719 });
const seamMetal = new THREE.MeshPhongMaterial({ color: 0x25343b, specular: 0x9daeb7, shininess: 80 });
const spikeMetal = new THREE.MeshPhongMaterial({ color: 0x697987, specular: 0xf4f8ff, shininess: 112, emissive: 0x111a1e });
const orbSkin = new THREE.MeshPhongMaterial({ color: 0x394b55, specular: 0xffffff, shininess: 128, emissive: 0x172128 });
new THREE.TextureLoader().load('./metal.jpg', texture => {
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(2.5, 2);
  orbSkin.map = texture;
  orbSkin.needsUpdate = true;
});
new THREE.TextureLoader().load('./snake-metal.jpg', texture => {
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

const snakeHeading = new THREE.Vector3(.74, .08, .67).normalize();
const snakeNodes = Array.from({ length: 8 }, (_, i) =>
  new THREE.Vector3(-2.2, 7.5, 20).addScaledVector(snakeHeading, -.54 * i));
const snakeParts = [
  new THREE.Mesh(new THREE.CylinderGeometry(.62, .325, 1, 32), metalSkin),
  new THREE.Mesh(new THREE.CylinderGeometry(.325, .4, 1, 32), metalSkin),
];
for (let node = 1; node < 7; node++) {
  const radius = .4 - .2 * (node - 1) / 6;
  const nextRadius = .4 - .2 * node / 6;
  snakeParts.push(new THREE.Mesh(new THREE.CylinderGeometry(radius, nextRadius, 1, 32), metalSkin));
}
snakeParts.forEach(part => scene.add(part));
const snakeSeams = Array.from({ length: 7 }, (_, i) => {
  const radius = i === 0 ? .4 : .4 - .2 * (i - 1) / 6;
  const seam = new THREE.Mesh(new THREE.TorusGeometry(radius * 1.005, .012, 5, 32), seamMetal);
  scene.add(seam);
  return seam;
});
const tail = new THREE.Mesh(new THREE.ConeGeometry(.2, .72, 24), metalSkin);
scene.add(tail);

const head = new THREE.Group();
const headBody = new THREE.Mesh(new THREE.SphereGeometry(.62, 32, 20), metalSkin);
headBody.scale.z = .58;
head.add(headBody);
const mouth = new THREE.Mesh(new THREE.CircleGeometry(.49, 32), new THREE.MeshBasicMaterial({ color: 0x010101, side: THREE.DoubleSide }));
mouth.position.z = .39;
head.add(mouth);
const mouthRim = new THREE.Mesh(new THREE.TorusGeometry(.50, .038, 8, 36), darkMetal);
mouthRim.position.z = .405;
head.add(mouthRim);
function petalGeometry(innerHalf, shoulderHalf, tipRadius) {
  const shape = new THREE.Shape();
  shape.moveTo(-innerHalf, .45);
  shape.quadraticCurveTo(-shoulderHalf, .66, 0, tipRadius);
  shape.quadraticCurveTo(shoulderHalf, .66, innerHalf, .45);
  shape.closePath();
  return new THREE.ExtrudeGeometry(shape, {
    depth: .045, bevelEnabled: true, bevelThickness: .018, bevelSize: .015,
    bevelSegments: 2, steps: 1, curveSegments: 8,
  });
}
const mainPetal = petalGeometry(.18, .29, .89);
const smallPetal = petalGeometry(.13, .20, .75);
const petalEyes = [];
for (let i = 0; i < 4; i++) {
  const petal = new THREE.Mesh(mainPetal, darkMetal);
  petal.rotation.z = i * Math.PI / 2;
  petal.position.z = .405;
  head.add(petal);
  const filler = new THREE.Mesh(smallPetal, darkMetal);
  filler.rotation.z = (i + .5) * Math.PI / 2;
  filler.position.z = .40;
  head.add(filler);
  const eye = new THREE.Group();
  eye.add(new THREE.Mesh(new THREE.SphereGeometry(.071, 12, 8), new THREE.MeshBasicMaterial({ color: 0xff351c })));
  const diamond = new THREE.Mesh(new THREE.PlaneGeometry(.048, .048), new THREE.MeshBasicMaterial({ color: 0x570010, side: THREE.DoubleSide }));
  diamond.rotation.z = Math.PI / 4;
  diamond.position.z = .07;
  eye.add(diamond);
  eye.position.set(-Math.sin(i * Math.PI / 2) * .7, Math.cos(i * Math.PI / 2) * .7, .48);
  head.add(eye);
  petalEyes.push(eye);
}
const redEyeMaterial = new THREE.MeshBasicMaterial({ color: 0xe33320 });
for (let i = 0; i < 7; i++) {
  const a = i * Math.PI * 2 / 6;
  const radius = i === 0 ? 0 : .15;
  const bulb = new THREE.Mesh(new THREE.SphereGeometry(i === 0 ? .055 : .038, 10, 7), redEyeMaterial);
  bulb.position.set(Math.cos(a) * radius, Math.sin(a) * radius, .43);
  head.add(bulb);
}
const toothMaterial = new THREE.MeshStandardMaterial({ color: 0xd6d8c9, roughness: .42 });
for (let ring = 0; ring < 2; ring++) {
  for (let i = 0; i < 16; i++) {
    const angle = i * Math.PI * 2 / 16;
    const tooth = new THREE.Mesh(new THREE.ConeGeometry(.025 + .006 * ring, .16 - .04 * ring, 5), toothMaterial);
    tooth.position.set(Math.cos(angle) * (.38 - .14 * ring), Math.sin(angle) * (.38 - .14 * ring), .44);
    tooth.rotation.z = angle + Math.PI / 2;
    head.add(tooth);
  }
}
scene.add(head);

const lateralEyes = [];
for (let i = 0; i < 5; i++) {
  for (const side of [-1, 1]) {
    const eye = new THREE.Group();
    eye.add(new THREE.Mesh(new THREE.SphereGeometry(.075, 10, 7), redEyeMaterial));
    const pupil = new THREE.Mesh(new THREE.PlaneGeometry(.047, .047), new THREE.MeshBasicMaterial({ color: 0x570010, side: THREE.DoubleSide }));
    pupil.rotation.z = Math.PI / 4;
    pupil.position.z = .075;
    eye.add(pupil);
    scene.add(eye);
    lateralEyes.push({ node: i + 1, side, eye });
  }
}

function updateSnake(t, dt) {
  const headPosition = snakeNodes[0];
  const target = new THREE.Vector3(5.5 * Math.sin(t * .16 + .2), 7 + 2.5 * Math.sin(t * .22 + .8), 20 + 8 * Math.sin(t * .11 + 1.4));
  const desired = target.sub(headPosition).multiplyScalar(.18).add(snakeHeading).normalize();
  snakeHeading.lerp(desired, Math.min(1, dt * 2.2)).normalize();
  headPosition.addScaledVector(snakeHeading, dt * (3.5 + .38 * Math.sin(t * .56)));
  for (const [axis, min, max] of [['x', -10.9, 10.9], ['y', 1, 13], ['z', 8, 33]]) {
    if (headPosition[axis] < min || headPosition[axis] > max) {
      headPosition[axis] = THREE.MathUtils.clamp(headPosition[axis], min, max);
      snakeHeading[axis] *= -.8;
      snakeHeading.normalize();
    }
  }
  for (let i = 1; i < snakeNodes.length; i++) {
    const offset = snakeNodes[i].clone().sub(snakeNodes[i - 1]);
    if (offset.lengthSq() < .001) offset.copy(snakeHeading).negate();
    const follow = snakeNodes[i - 1].clone().add(offset.normalize().multiplyScalar(.54));
    snakeNodes[i].lerp(follow, Math.min(1, dt * 11));
  }
  const sideAxis = new THREE.Vector3().crossVectors(snakeHeading, unitY).normalize();
  const points = snakeNodes.map((node, i) => node.clone().addScaledVector(sideAxis,
    Math.sin(t * 5 - i * .95) * .12 * i / 7));
  const neck = points[0].clone().lerp(points[1], .43);
  orientBetween(snakeParts[0], points[0], neck);
  orientBetween(snakeParts[1], neck, points[1]);
  for (let i = 1; i < 7; i++) orientBetween(snakeParts[i + 1], points[i], points[i + 1]);
  for (let i = 0; i < snakeSeams.length; i++) {
    snakeSeams[i].position.copy(points[i + 1]);
    const tangent = points[Math.max(0, i)].clone().sub(points[Math.min(7, i + 2)]).normalize();
    snakeSeams[i].quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), tangent);
  }
  const backward = points[7].clone().sub(points[6]).normalize();
  const tip = points[7].clone().addScaledVector(backward, .72);
  orientBetween(tail, tip, points[7]);
  head.position.copy(points[0]);
  const forward = points[0].clone().sub(points[1]).normalize();
  const towardViewer = camera.position.clone().sub(points[0]).normalize();
  head.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), forward.lerp(towardViewer, .2).normalize());
  for (const { node, side, eye } of lateralEyes) {
    const tangent = points[node - 1].clone().sub(points[node + 1]).normalize();
    const outward = new THREE.Vector3().crossVectors(tangent, unitY).normalize().multiplyScalar(side);
    const radius = .4 - .2 * (node - 1) / 6;
    eye.position.copy(points[node]).addScaledVector(outward, radius * .98);
    eye.lookAt(camera.position);
  }
}

function makeSpikeball() {
  const orb = new THREE.Group();
  const radius = 1.2;
  const shell = new THREE.Mesh(new THREE.SphereGeometry(radius, 28, 18), orbSkin);
  orb.add(shell);
  for (let ring = 0; ring < 4; ring++) {
    const latitude = -.92 + 1.84 * (ring + .5) / 4;
    for (let i = 0; i < 9; i++) {
      const longitude = Math.PI * 2 * (i + (ring % 2) * .5) / 9;
      const normal = new THREE.Vector3(Math.cos(latitude) * Math.cos(longitude), Math.sin(latitude), Math.cos(latitude) * Math.sin(longitude));
      if (normal.z > .78 && Math.abs(normal.x) < .47 && normal.y > -.46 && normal.y < .31) continue;
      const length = radius * (.28 + .045 * Math.sin(i * 1.9 + ring));
      const spike = new THREE.Mesh(new THREE.ConeGeometry(radius * .09, length, 6), spikeMetal);
      spike.position.copy(normal).multiplyScalar(radius + length / 2);
      spike.quaternion.setFromUnitVectors(unitY, normal);
      orb.add(spike);
    }
  }
  const eye = new THREE.Group();
  const eyeShape = new THREE.Shape();
  eyeShape.moveTo(-.53, -.08);
  eyeShape.quadraticCurveTo(0, .24, .53, -.08);
  eyeShape.quadraticCurveTo(0, -.46, -.53, -.08);
  eye.add(new THREE.Mesh(new THREE.ShapeGeometry(eyeShape), new THREE.MeshBasicMaterial({ color: 0x020205, side: THREE.DoubleSide })));
  const gaze = new THREE.Group();
  const iris = new THREE.Mesh(new THREE.CircleGeometry(.24, 28), new THREE.MeshBasicMaterial({ color: 0xe81926 }));
  iris.position.z = .013;
  gaze.add(iris);
  const pupil = new THREE.Mesh(new THREE.CircleGeometry(.112, 22), new THREE.MeshBasicMaterial({ color: 0x000000 }));
  pupil.position.z = .018;
  gaze.add(pupil);
  eye.add(gaze);
  eye.position.set(0, .12, radius * 1.018);
  orb.add(eye);
  scene.add(orb);
  return { orb, eye, gaze, position: new THREE.Vector3(), velocity: new THREE.Vector3() };
}
const twins = [makeSpikeball(), makeSpikeball()];
twins[0].position.set(-7.4, 10.3, 16);
twins[0].velocity.set(.28, .06, .17);
twins[1].position.set(7.2, 4.8, 22);
twins[1].velocity.set(-.19, .11, -.24);
function updateTwins(t, dt) {
  for (let i = 0; i < 2; i++) {
    const twin = twins[i];
    const phase = i * 2.31;
    const homeX = i === 0 ? -7 : 7;
    const homeY = i === 0 ? 9.5 : 5;
    const homeZ = i === 0 ? 18 : 26;
    twin.velocity.x += (Math.sin(t * .37 + phase) * .4 + (homeX - twin.position.x) * .16) * dt;
    twin.velocity.y += (homeY + Math.sin(t * .61 + phase) * 2 - twin.position.y) * .42 * dt;
    twin.velocity.z += (homeZ + Math.cos(t * .29 + phase) * 6 - twin.position.z) * .12 * dt;
    twin.velocity.multiplyScalar(Math.pow(.995, dt * 60));
    twin.position.addScaledVector(twin.velocity, dt);
    for (const [axis, min, max] of [['x', -10.8, 10.8], ['y', 1.2, 12.8], ['z', -38.8, 38.8]]) {
      if (twin.position[axis] < min || twin.position[axis] > max) {
        twin.position[axis] = THREE.MathUtils.clamp(twin.position[axis], min, max);
        twin.velocity[axis] *= -.65;
      }
    }
    twin.orb.position.copy(twin.position);
    const blink = (t + i * .43) % 5.1;
    twin.eye.scale.y = blink < .26 ? Math.max(.04, 1 - Math.sin(Math.PI * blink / .26)) : 1;
    twin.gaze.position.x = .08 * Math.sin(t * 1.13 + i * .61);
    twin.gaze.position.y = -.1 + .055 * Math.sin(t * .83 + .5 + i);
  }
}

const smiley = new THREE.Group();
const smileyMaterial = new THREE.MeshPhongMaterial({ color: 0xa22ee6, emissive: 0x10041a, shininess: 112, transparent: true, opacity: .3, depthWrite: false, side: THREE.DoubleSide });
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
smiley.scale.setScalar(.85);
smiley.position.set(1.5, 10, 13);
scene.add(smiley);
const smileyVelocity = new THREE.Vector3(.42, .16, .38);
function updateSmiley(t, dt) {
  smileyVelocity.x += (Math.sin(t * .32 + 1.7) * .36 + (1.5 - smiley.position.x) * .12) * dt;
  smileyVelocity.y += (Math.cos(t * .44 + .8) * .28 + (10 - smiley.position.y) * .18) * dt;
  smileyVelocity.z += (Math.sin(t * .28 + 2.1) * .42 + (13 - smiley.position.z) * .12) * dt;
  smileyVelocity.multiplyScalar(Math.pow(.998, dt * 60));
  smiley.position.addScaledVector(smileyVelocity, dt);
  for (const [axis, min, max] of [['x', -11, 11], ['y', 1, 13], ['z', -39, 39]]) {
    if (smiley.position[axis] < min || smiley.position[axis] > max) {
      smiley.position[axis] = THREE.MathUtils.clamp(smiley.position[axis], min, max);
      smileyVelocity[axis] *= -.83;
    }
  }
  smileyMaterial.color.setHSL((t * .055) % 1, 1, .5);
  smileyMaterial.emissive.copy(smileyMaterial.color).multiplyScalar(.13);
}

function resize() {
  const width = Math.max(1, mount.clientWidth);
  const height = Math.max(1, mount.clientHeight);
  renderer.setSize(width, height, false);
  camera.aspect = width / height;
  const frontFit = Math.max(20, tank.width / (2 * Math.tan(THREE.MathUtils.degToRad(camera.fov / 2)) * camera.aspect) * 1.06);
  camera.position.z = tank.depth / 2 + frontFit;
  camera.lookAt(0, tank.height / 2, 0);
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
  const dt = Math.min(.05, (now - lastFrame) / 1000 || .033);
  lastFrame = now;
  const t = reducedMotion ? 5 : (now - start) / 1000;
  if (now - lastMatrixUpdate > 125) {
    drawMatrix(t);
    lastMatrixUpdate = now;
  }
  updateSnake(t, dt);
  updateTwins(t, dt);
  updateSmiley(t, dt);
  renderer.render(scene, camera);
}
requestAnimationFrame(frame);
