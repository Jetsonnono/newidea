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

  // Plateau terrain with procedural height + vertex colors + CanvasTexture
  const size = 220;
  const seg = 128;
  const groundGeo = new THREE.PlaneGeometry(size, size, seg, seg);
  groundGeo.rotateX(-Math.PI / 2);
  const pos = groundGeo.attributes.position;
  const colors = [];
  const warm = new THREE.Color(0xa89072);
  const cool = new THREE.Color(0x7a8488);
  const dust = new THREE.Color(0xb8a078);

  for (let i = 0; i < pos.count; i += 1) {
    const x = pos.getX(i);
    const z = pos.getZ(i);
    const dist = Math.hypot(x, z);
    // Keep building pad relatively flat
    const pad = THREE.MathUtils.smoothstep(dist, 24, 60);
    const n =
      fbm(x * 0.045, z * 0.045, 5) * 6.5 +
      fbm(x * 0.014, z * 0.014, 3) * 12 +
      fbm(x * 0.09, z * 0.09, 2) * 2.4;
    const h = Math.max(-0.5, n * pad - 0.25);
    pos.setY(i, h);

    const t = fbm(x * 0.02 + 10, z * 0.02, 3);
    const c = cool.clone().lerp(warm, t).lerp(dust, pad * 0.35);
    // Slight green near moisture pockets
    if (t > 0.62 && pad > 0.4) c.lerp(new THREE.Color(0x6d7a52), 0.25);
    colors.push(c.r, c.g, c.b);
  }
  groundGeo.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
  groundGeo.computeVertexNormals();

  const ground = new THREE.Mesh(groundGeo, materials.ground);
  ground.receiveShadow = true;
  ground.position.y = -0.05;
  group.add(ground);

  // Dark gravel apron around building base — kills floating look
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

  // Mid-ground dune mounds so aerial reads as rolling plateau
  for (let i = 0; i < 14; i += 1) {
    const a = (i / 14) * Math.PI * 2 + 0.35;
    const d = 36 + (i % 5) * 9;
    const mound = new THREE.Mesh(
      new THREE.SphereGeometry(7 + (i % 4) * 2.5, 20, 12, 0, Math.PI * 2, 0, Math.PI * 0.5),
      materials.earthFill
    );
    mound.position.set(Math.cos(a) * d, -0.8, Math.sin(a) * d);
    mound.scale.set(1.6, 0.28 + (i % 3) * 0.08, 1.25);
    mound.receiveShadow = true;
    mound.castShadow = true;
    group.add(mound);
  }

  // Sparse plateau shrubs / rocks
  for (let i = 0; i < 40; i += 1) {
    const a = Math.random() * Math.PI * 2;
    const d = 32 + Math.random() * 70;
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

  // Distant low-poly snow ridge ring
  const ridgeGroup = new THREE.Group();
  ridgeGroup.userData.hideOnExport = true;
  for (let i = 0; i < 18; i += 1) {
    const a = (i / 18) * Math.PI * 2 + 0.12;
    const d = 95 + (i % 4) * 8;
    const peak = new THREE.Mesh(
      new THREE.ConeGeometry(10 + (i % 5) * 3, 14 + (i % 3) * 6, 5),
      i % 3 === 0 ? materials.snow : materials.rock
    );
    peak.position.set(Math.cos(a) * d, 4 + (i % 4), Math.sin(a) * d);
    peak.rotation.y = a;
    peak.userData.hideOnExport = true;
    ridgeGroup.add(peak);

    // Snow cap blend
    if (i % 3 !== 0) {
      const cap = new THREE.Mesh(
        new THREE.ConeGeometry(5 + (i % 4), 5, 5),
        materials.snow
      );
      cap.position.copy(peak.position);
      cap.position.y += 7;
      cap.userData.hideOnExport = true;
      ridgeGroup.add(cap);
    }
  }
  group.add(ridgeGroup);

  // Physical Sky + PMREM are owned by systems/atmosphere.js
  scene.add(group);
  // Light highland haze — keep subtle so Sky + env reflections read clearly
  scene.fog = new THREE.FogExp2(0xb8c2c6, 0.0012);
  scene.background = null;

  return { group, ground };
}

export function updateSkyForSun(_env, _sunState) {
  // Kept for API compatibility; atmosphere system drives Sky uniforms.
}
