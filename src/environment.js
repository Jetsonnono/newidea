import * as THREE from 'three';
import { fbm } from './geometry/helpers.js';
import {
  createPlateauTextures,
  createGravelTexture,
} from './materials/terrainTextures.js';

export function createEnvironment(scene, materials) {
  const group = new THREE.Group();
  group.name = 'Environment';

  const plateauTex = createPlateauTextures(1024);
  materials.ground.map = plateauTex.map;
  materials.ground.bumpMap = plateauTex.bumpMap;
  materials.ground.bumpScale = 0.35;
  materials.ground.roughness = 0.9;
  materials.ground.needsUpdate = true;

  const gravelTex = createGravelTexture(512);
  materials.gravel.map = gravelTex;
  materials.gravel.needsUpdate = true;

  // Plateau terrain — radius ×3 so rectangular edge never reads in frame
  const size = 660;
  const seg = 192;
  const groundGeo = new THREE.PlaneGeometry(size, size, seg, seg);
  groundGeo.rotateX(-Math.PI / 2);
  const pos = groundGeo.attributes.position;
  const colors = [];
  const warm = new THREE.Color(0xa89072);
  const cool = new THREE.Color(0x7a8488);
  const dust = new THREE.Color(0xb8a078);
  const mist = new THREE.Color(0xc8d4de);

  for (let i = 0; i < pos.count; i += 1) {
    const x = pos.getX(i);
    const z = pos.getZ(i);
    const dist = Math.hypot(x, z);
    // Flat pad near building → rolling mid → lifted far hills that hide the plane edge
    const pad = THREE.MathUtils.smoothstep(dist, 24, 70);
    const mid = THREE.MathUtils.smoothstep(dist, 80, 180);
    const far = THREE.MathUtils.smoothstep(dist, 200, 320);
    const n =
      fbm(x * 0.045, z * 0.045, 5) * 6.5 +
      fbm(x * 0.014, z * 0.014, 3) * 12 +
      fbm(x * 0.09, z * 0.09, 2) * 2.4;
    // Smooth lift at distance so mesh edge sinks into fog/hills
    const hillLift =
      mid * (8 + fbm(x * 0.008, z * 0.008, 3) * 14) +
      far * (18 + fbm(x * 0.005 + 3, z * 0.005, 2) * 22);
    const h = Math.max(-0.5, n * pad - 0.25 + hillLift);
    pos.setY(i, h);

    const t = fbm(x * 0.02 + 10, z * 0.02, 3);
    const c = cool.clone().lerp(warm, t).lerp(dust, pad * 0.35);
    if (t > 0.62 && pad > 0.4) c.lerp(new THREE.Color(0x6d7a52), 0.25);
    // Cool mist tint toward far hills → blends with FogExp2 / snow ridges
    c.lerp(mist, far * 0.55);
    colors.push(c.r, c.g, c.b);
  }
  groundGeo.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
  groundGeo.computeVertexNormals();

  const ground = new THREE.Mesh(groundGeo, materials.ground);
  ground.receiveShadow = true;
  ground.position.y = -0.05;
  group.add(ground);

  // Dark gravel apron around building base
  const apron = new THREE.Mesh(
    new THREE.RingGeometry(22, 34, 72),
    materials.gravel
  );
  apron.rotation.x = -Math.PI / 2;
  apron.position.y = 0.02;
  apron.receiveShadow = true;
  group.add(apron);

  const apronInner = new THREE.Mesh(
    new THREE.RingGeometry(18, 22.2, 64),
    materials.gravel
  );
  apronInner.rotation.x = -Math.PI / 2;
  apronInner.position.y = 0.025;
  apronInner.receiveShadow = true;
  group.add(apronInner);

  // Mid-ground dune mounds
  for (let i = 0; i < 18; i += 1) {
    const a = (i / 18) * Math.PI * 2 + 0.35;
    const d = 40 + (i % 6) * 12;
    const mound = new THREE.Mesh(
      new THREE.SphereGeometry(8 + (i % 4) * 2.8, 20, 12, 0, Math.PI * 2, 0, Math.PI * 0.5),
      materials.earthFill
    );
    mound.position.set(Math.cos(a) * d, -0.8, Math.sin(a) * d);
    mound.scale.set(1.7, 0.3 + (i % 3) * 0.08, 1.3);
    mound.receiveShadow = true;
    mound.castShadow = true;
    group.add(mound);
  }

  // Sparse plateau shrubs / rocks
  for (let i = 0; i < 50; i += 1) {
    const a = Math.random() * Math.PI * 2;
    const d = 34 + Math.random() * 90;
    const x = Math.cos(a) * d;
    const z = Math.sin(a) * d;
    if (Math.random() > 0.45) {
      const bush = new THREE.Mesh(
        new THREE.SphereGeometry(0.4 + Math.random() * 0.7, 8, 6),
        materials.shrub
      );
      bush.position.set(x, 0.2, z);
      bush.scale.set(1.2, 0.55 + Math.random() * 0.4, 1);
      bush.castShadow = true;
      group.add(bush);
    } else {
      const rock = new THREE.Mesh(
        new THREE.DodecahedronGeometry(0.5 + Math.random() * 1.2, 0),
        materials.rock
      );
      rock.position.set(x, 0.15, z);
      rock.rotation.set(Math.random(), Math.random(), Math.random());
      rock.scale.set(1, 0.55, 0.85);
      rock.castShadow = true;
      rock.receiveShadow = true;
      group.add(rock);
    }
  }

  // Distant Kunlun-style snow ridges — beyond lifted terrain, soft into fog
  const ridgeGroup = new THREE.Group();
  ridgeGroup.userData.hideOnExport = true;
  for (let i = 0; i < 22; i += 1) {
    const a = (i / 22) * Math.PI * 2 + 0.12;
    const d = 240 + (i % 5) * 18;
    const peak = new THREE.Mesh(
      new THREE.ConeGeometry(14 + (i % 5) * 4, 22 + (i % 4) * 8, 5),
      i % 3 === 0 ? materials.snow : materials.rock
    );
    peak.position.set(Math.cos(a) * d, 12 + (i % 5) * 2, Math.sin(a) * d);
    peak.rotation.y = a;
    peak.userData.hideOnExport = true;
    ridgeGroup.add(peak);

    if (i % 3 !== 0) {
      const cap = new THREE.Mesh(
        new THREE.ConeGeometry(7 + (i % 4), 8, 5),
        materials.snow
      );
      cap.position.copy(peak.position);
      cap.position.y += 12;
      cap.userData.hideOnExport = true;
      ridgeGroup.add(cap);
    }
  }
  group.add(ridgeGroup);

  scene.add(group);
  // Cool grey-blue highland haze — blends gravel frost with far snow ridges
  scene.fog = new THREE.FogExp2(0xd8e2ec, 0.0018);
  scene.background = null;

  return { group, ground };
}

export function updateSkyForSun(_env, _sunState) {
  // Kept for API compatibility; atmosphere system drives Sky uniforms.
}
