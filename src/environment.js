import * as THREE from 'three';
import { fbm } from './geometry/helpers.js';
import {
  createPlateauTextures,
  createGravelTexture,
} from './materials/terrainTextures.js';

const PAD_R = 42;

export function createEnvironment(scene, materials) {
  const group = new THREE.Group();
  group.name = 'Environment';

  const plateauTex = createPlateauTextures(1024);
  materials.ground.map = plateauTex.map;
  materials.ground.bumpMap = plateauTex.bumpMap;
  materials.ground.bumpScale = 0.4;
  materials.ground.roughness = 0.92;
  materials.ground.needsUpdate = true;

  const gravelTex = createGravelTexture(512);
  materials.gravel.map = gravelTex;
  materials.gravel.needsUpdate = true;

  const size = 660;
  const seg = 192;
  const groundGeo = new THREE.PlaneGeometry(size, size, seg, seg);
  groundGeo.rotateX(-Math.PI / 2);
  const pos = groundGeo.attributes.position;
  const colors = [];
  const rockGrey = new THREE.Color(0x6a6e72);
  const frostBrown = new THREE.Color(0x4a4038);
  const meadow = new THREE.Color(0x8a7a58);
  const mist = new THREE.Color(0xb8c8d8);

  for (let i = 0; i < pos.count; i += 1) {
    const x = pos.getX(i);
    const z = pos.getZ(i);
    const dist = Math.hypot(x, z);

    // Forced flat pad R < 42m with smoothstep blend (kills mud into plaza / V2G)
    const outside = THREE.MathUtils.smoothstep(dist, PAD_R - 4, PAD_R + 10);
    const mid = THREE.MathUtils.smoothstep(dist, 80, 180);
    const far = THREE.MathUtils.smoothstep(dist, 200, 320);

    const n =
      fbm(x * 0.045, z * 0.045, 5) * 6.5 +
      fbm(x * 0.014, z * 0.014, 3) * 12 +
      fbm(x * 0.09, z * 0.09, 2) * 2.4;
    const hillLift =
      mid * (8 + fbm(x * 0.008, z * 0.008, 3) * 14) +
      far * (18 + fbm(x * 0.005 + 3, z * 0.005, 2) * 22);
    const h = Math.max(-0.2, (n * 0.85 + hillLift) * outside);
    pos.setY(i, h);

    const t = fbm(x * 0.02 + 10, z * 0.02, 3);
    const c = rockGrey.clone().lerp(frostBrown, t * 0.65).lerp(meadow, (1 - t) * 0.35);
    if (outside < 0.15) c.lerp(new THREE.Color(0x5a5650), 0.35); // pad gravel tint
    c.lerp(mist, far * 0.45);
    colors.push(c.r, c.g, c.b);
  }
  groundGeo.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
  groundGeo.computeVertexNormals();

  const ground = new THREE.Mesh(groundGeo, materials.ground);
  ground.receiveShadow = true;
  ground.position.y = -0.02;
  group.add(ground);

  // Gravel apron on flat pad
  const apron = new THREE.Mesh(
    new THREE.RingGeometry(24, 40, 80),
    materials.gravel
  );
  apron.rotation.x = -Math.PI / 2;
  apron.position.y = 0.03;
  apron.receiveShadow = true;
  group.add(apron);

  addBoulders(group, materials);
  addGrassAndShrubs(group, materials);
  addSnowRidges(group, materials);

  scene.add(group);
  // Clear highland air — low density so Kunlun ridges stay crisp
  scene.fog = new THREE.FogExp2(0xd8e2ec, 0.0006);
  scene.background = null;

  return { group, ground };
}

function addBoulders(group, materials) {
  const count = 160;
  const geo = new THREE.DodecahedronGeometry(0.55, 0);
  const mesh = new THREE.InstancedMesh(geo, materials.rock, count);
  const dummy = new THREE.Object3D();
  let n = 0;
  for (let i = 0; i < count * 3 && n < count; i += 1) {
    const a = Math.random() * Math.PI * 2;
    const d = 28 + Math.random() * 95;
    if (d < PAD_R - 2 && Math.random() > 0.25) continue; // sparse on pad edge only
    dummy.position.set(Math.cos(a) * d, 0.15 + Math.random() * 0.25, Math.sin(a) * d);
    const s = 0.6 + Math.random() * 1.8;
    dummy.scale.set(s, s * (0.45 + Math.random() * 0.4), s * (0.75 + Math.random() * 0.35));
    dummy.rotation.set(Math.random(), Math.random() * Math.PI, Math.random());
    dummy.updateMatrix();
    mesh.setMatrixAt(n, dummy.matrix);
    n += 1;
  }
  mesh.count = n;
  mesh.instanceMatrix.needsUpdate = true;
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  group.add(mesh);
}

function addGrassAndShrubs(group, materials) {
  // 800+ withered stipa grass clumps
  const grassCount = 820;
  const grassGeo = new THREE.ConeGeometry(0.18, 0.75, 5);
  grassGeo.translate(0, 0.35, 0);
  const grassMat = materials.stipa || materials.meadow || materials.shrub;
  const grass = new THREE.InstancedMesh(grassGeo, grassMat, grassCount);
  const dummy = new THREE.Object3D();
  let gi = 0;
  for (let i = 0; i < grassCount * 2 && gi < grassCount; i += 1) {
    const a = Math.random() * Math.PI * 2;
    const d = 20 + Math.random() * 110;
    // Keep plaza / road corridors clearer
    if (d < 26 && Math.random() > 0.2) continue;
    dummy.position.set(Math.cos(a) * d, 0.02, Math.sin(a) * d);
    const s = 0.7 + Math.random() * 1.4;
    dummy.scale.set(s * 0.7, s, s * 0.7);
    dummy.rotation.y = Math.random() * Math.PI;
    dummy.rotation.z = (Math.random() - 0.5) * 0.25;
    dummy.updateMatrix();
    grass.setMatrixAt(gi, dummy.matrix);
    gi += 1;
  }
  grass.count = gi;
  grass.instanceMatrix.needsUpdate = true;
  grass.castShadow = true;
  group.add(grass);

  // Alpine shrubs
  const shrubCount = 120;
  const shrubGeo = new THREE.SphereGeometry(0.45, 8, 6);
  const shrubs = new THREE.InstancedMesh(shrubGeo, materials.shrub, shrubCount);
  let si = 0;
  for (let i = 0; i < shrubCount * 2 && si < shrubCount; i += 1) {
    const a = Math.random() * Math.PI * 2;
    const d = 30 + Math.random() * 90;
    dummy.position.set(Math.cos(a) * d, 0.2, Math.sin(a) * d);
    dummy.scale.set(1.1, 0.55 + Math.random() * 0.35, 1);
    dummy.rotation.set(0, Math.random(), 0);
    dummy.updateMatrix();
    shrubs.setMatrixAt(si, dummy.matrix);
    si += 1;
  }
  shrubs.count = si;
  shrubs.instanceMatrix.needsUpdate = true;
  shrubs.castShadow = true;
  group.add(shrubs);
}

function addSnowRidges(group, materials) {
  const ridgeGroup = new THREE.Group();
  ridgeGroup.userData.hideOnExport = true;
  for (let i = 0; i < 24; i += 1) {
    const a = (i / 24) * Math.PI * 2 + 0.08;
    const d = 260 + (i % 5) * 22;
    // Deep teal-grey rock massifs
    const peak = new THREE.Mesh(
      new THREE.ConeGeometry(16 + (i % 5) * 5, 28 + (i % 4) * 10, 5),
      i % 4 === 0 ? materials.snow : materials.ridgeRock || materials.rock
    );
    peak.position.set(Math.cos(a) * d, 16 + (i % 5) * 3, Math.sin(a) * d);
    peak.rotation.y = a;
    peak.userData.hideOnExport = true;
    ridgeGroup.add(peak);

    const cap = new THREE.Mesh(
      new THREE.ConeGeometry(8 + (i % 4), 10, 5),
      materials.snow
    );
    cap.position.copy(peak.position);
    cap.position.y += 14;
    cap.userData.hideOnExport = true;
    ridgeGroup.add(cap);
  }
  group.add(ridgeGroup);
}

export function updateSkyForSun(_env, _sunState) {}
