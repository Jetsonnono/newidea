import * as THREE from 'three';
import { createOrganicShape, extrudeOrganicSlab } from '../geometry/helpers.js';

/**
 * Three-tier streamlined white concrete eco-base with
 * sunken courtyard planting and west-side V2G canopy.
 * Scale ≈ meters; outer footprint ~55m.
 */
export function createBase(materials) {
  const group = new THREE.Group();
  group.name = 'Base';

  const tiers = [
    { y: 0.0, sx: 52, sz: 42, h: 1.15, lobe: 0.2, earth: true },
    { y: 1.2, sx: 40, sz: 32, h: 1.05, lobe: 0.17, earth: true },
    { y: 2.3, sx: 28, sz: 23, h: 0.95, lobe: 0.14, earth: true },
  ];

  tiers.forEach((tier, index) => {
    const slab = extrudeOrganicSlab(tier.sx, tier.sz, tier.h, tier.lobe, materials.concrete, 0.48);
    slab.position.y = tier.y;
    slab.name = `Tier${index + 1}`;
    slab.userData.layer = 'base';
    slab.userData.restY = slab.position.y;
    group.add(slab);

    // Earth / planting cap inset from edge
    if (tier.earth) {
      const plant = extrudeOrganicSlab(
        tier.sx * 0.88,
        tier.sz * 0.86,
        0.18,
        tier.lobe * 0.9,
        materials.planting,
        0.08
      );
      plant.position.y = tier.y + tier.h * 0.55 + 0.05;
      plant.userData.layer = 'earth';
      plant.userData.restY = plant.position.y;
      plant.castShadow = true;
      plant.receiveShadow = true;
      group.add(plant);

      addTerraceShrubs(group, materials, tier, index);
    }
  });

  // Thin railing rings on upper terraces
  [1, 2].forEach((ti) => {
    const t = tiers[ti];
    const rail = createRailRing(t.sx * 0.48, t.sz * 0.48, materials.steel);
    rail.position.y = t.y + t.h * 0.55 + 0.55;
    rail.userData.layer = 'base';
    rail.userData.restY = rail.position.y;
    group.add(rail);
  });

  // —— Sunken courtyard (south) ——
  const court = createSunkenCourtyard(materials);
  court.position.set(-2, 0, 10);
  group.add(court);

  // —— V2G canopy + vehicles (west / SW) ——
  const v2g = createV2GHub(materials);
  v2g.position.set(-18, 0.05, 12);
  v2g.scale.setScalar(1.15);
  group.add(v2g);

  // Approach road ribbon
  const road = new THREE.Mesh(
    new THREE.PlaneGeometry(10, 36),
    materials.road
  );
  road.rotation.x = -Math.PI / 2;
  road.position.set(18, 0.04, 22);
  road.rotation.z = -0.55;
  road.receiveShadow = true;
  road.userData.layer = 'ramp';
  road.userData.restY = road.position.y;
  group.add(road);

  return group;
}

function addTerraceShrubs(group, materials, tier, seed) {
  const count = 8 + seed * 3;
  for (let i = 0; i < count; i += 1) {
    const a = (i / count) * Math.PI * 2 + seed * 0.4;
    const r = 0.28 + (i % 5) * 0.08;
    const x = Math.cos(a) * tier.sx * r * 0.5;
    const z = Math.sin(a) * tier.sz * r * 0.5;
    const bush = new THREE.Mesh(
      new THREE.SphereGeometry(0.35 + (i % 3) * 0.12, 8, 6),
      materials.shrub
    );
    bush.position.set(x, tier.y + tier.h * 0.55 + 0.35, z);
    bush.scale.set(1.1, 0.65, 1);
    bush.castShadow = true;
    bush.userData.layer = 'earth';
    bush.userData.restY = bush.position.y;
    group.add(bush);
  }
}

function createRailRing(rx, rz, material) {
  const pts = [];
  for (let i = 0; i <= 64; i += 1) {
    const t = (i / 64) * Math.PI * 2;
    pts.push(new THREE.Vector3(Math.cos(t) * rx, 0, Math.sin(t) * rz));
  }
  const curve = new THREE.CatmullRomCurve3(pts, true);
  const mesh = new THREE.Mesh(
    new THREE.TubeGeometry(curve, 128, 0.035, 6, true),
    material
  );
  mesh.castShadow = true;
  return mesh;
}

function createSunkenCourtyard(materials) {
  const g = new THREE.Group();
  g.name = 'SunkenCourtyard';
  g.userData.layer = 'courtyard';

  const floor = new THREE.Mesh(
    new THREE.CylinderGeometry(5.4, 5.8, 0.25, 48),
    materials.courtyard
  );
  floor.position.y = -0.55;
  floor.receiveShadow = true;
  floor.userData.restY = floor.position.y;
  floor.userData.layer = 'courtyard';
  g.add(floor);

  // Retaining wall ring
  const wall = new THREE.Mesh(
    new THREE.CylinderGeometry(5.9, 6.1, 1.6, 48, 1, true),
    materials.concrete
  );
  wall.position.y = 0.15;
  wall.castShadow = true;
  wall.receiveShadow = true;
  wall.userData.restY = wall.position.y;
  wall.userData.layer = 'courtyard';
  g.add(wall);

  // Landscape planters
  for (let i = 0; i < 5; i += 1) {
    const a = (i / 5) * Math.PI * 2 + 0.3;
    const planter = new THREE.Mesh(
      new THREE.CylinderGeometry(0.85, 0.95, 0.45, 16),
      materials.concrete
    );
    planter.position.set(Math.cos(a) * 3.2, -0.25, Math.sin(a) * 3.2);
    planter.userData.restY = planter.position.y;
    planter.userData.layer = 'courtyard';
    planter.castShadow = true;
    g.add(planter);

    const plant = new THREE.Mesh(
      new THREE.SphereGeometry(0.55, 10, 8),
      materials.shrub
    );
    plant.position.set(Math.cos(a) * 3.2, 0.25, Math.sin(a) * 3.2);
    plant.scale.set(1, 0.7, 1);
    plant.userData.restY = plant.position.y;
    plant.userData.layer = 'courtyard';
    plant.castShadow = true;
    g.add(plant);
  }

  // Central tree suggestion
  const trunk = new THREE.Mesh(
    new THREE.CylinderGeometry(0.18, 0.28, 2.4, 10),
    materials.earthFill
  );
  trunk.position.y = 0.5;
  trunk.userData.restY = trunk.position.y;
  trunk.userData.layer = 'courtyard';
  trunk.castShadow = true;
  g.add(trunk);

  const canopy = new THREE.Mesh(
    new THREE.SphereGeometry(1.6, 14, 10),
    materials.shrub
  );
  canopy.position.y = 2.3;
  canopy.scale.set(1.1, 0.75, 1.1);
  canopy.userData.restY = canopy.position.y;
  canopy.userData.layer = 'courtyard';
  canopy.castShadow = true;
  g.add(canopy);

  return g;
}

function createV2GHub(materials) {
  const g = new THREE.Group();
  g.name = 'V2GHub';
  g.userData.layer = 'ramp';

  // Smooth approach ramp (CatmullRom tube flattened visually via deck)
  const rampPts = [];
  for (let i = 0; i <= 20; i += 1) {
    const t = i / 20;
    rampPts.push(
      new THREE.Vector3(
        t * 10,
        (1 - t) * 1.4 + 0.15,
        -2 + Math.sin(t * Math.PI) * 2.5 + t * 4
      )
    );
  }
  const rampCurve = new THREE.CatmullRomCurve3(rampPts);
  const rampMesh = new THREE.Mesh(
    new THREE.TubeGeometry(rampCurve, 64, 2.2, 8, false),
    materials.ramp
  );
  rampMesh.castShadow = true;
  rampMesh.receiveShadow = true;
  rampMesh.userData.restY = 0;
  rampMesh.userData.layer = 'ramp';
  g.add(rampMesh);

  // Canopy roof — organic extruded slab
  const canopyShape = createOrganicShape(14, 9, 0.12, 48);
  const canopyGeo = new THREE.ExtrudeGeometry(canopyShape, {
    depth: 0.28,
    bevelEnabled: true,
    bevelThickness: 0.08,
    bevelSize: 0.1,
    bevelSegments: 2,
    curveSegments: 40,
  });
  canopyGeo.rotateX(-Math.PI / 2);
  const canopy = new THREE.Mesh(canopyGeo, materials.concrete);
  canopy.position.set(4, 3.4, 4);
  canopy.castShadow = true;
  canopy.userData.restY = canopy.position.y;
  canopy.userData.layer = 'ramp';
  g.add(canopy);

  // Columns
  [[-1, 1], [4, -1], [8, 2]].forEach(([cx, cz], i) => {
    const col = new THREE.Mesh(
      new THREE.CylinderGeometry(0.22, 0.28, 3.3, 12),
      materials.concrete
    );
    col.position.set(cx + 2, 1.7, cz + 4);
    col.castShadow = true;
    col.userData.restY = col.position.y;
    col.userData.layer = 'ramp';
    g.add(col);
  });

  // 3 research SUVs + cyan charge posts
  for (let i = 0; i < 3; i += 1) {
    const car = createSUV(materials);
    car.position.set(1 + i * 3.6, 0.55, 5.5);
    car.rotation.y = -0.45;
    car.userData.restY = car.position.y;
    car.userData.layer = 'ramp';
    g.add(car);

    const post = createChargePost(materials);
    post.position.set(-0.4 + i * 3.6, 0.55, 3.8);
    post.userData.restY = post.position.y;
    post.userData.layer = 'ramp';
    g.add(post);
  }

  return g;
}

function createSUV(materials) {
  const car = new THREE.Group();
  const body = new THREE.Mesh(
    new THREE.BoxGeometry(2.2, 0.7, 4.4),
    materials.vehicle
  );
  body.position.y = 0.45;
  body.castShadow = true;
  car.add(body);

  const cabin = new THREE.Mesh(
    new THREE.BoxGeometry(2.0, 0.55, 2.4),
    materials.glassDark
  );
  cabin.position.set(0, 1.05, -0.15);
  cabin.castShadow = true;
  car.add(cabin);

  // Soft streamline nose
  const nose = new THREE.Mesh(
    new THREE.SphereGeometry(0.55, 12, 8, 0, Math.PI * 2, 0, Math.PI * 0.5),
    materials.vehicle
  );
  nose.scale.set(1.8, 0.7, 1.4);
  nose.position.set(0, 0.55, 1.7);
  car.add(nose);

  [[-0.85, 1.2], [0.85, 1.2], [-0.85, -1.3], [0.85, -1.3]].forEach(([x, z]) => {
    const wheel = new THREE.Mesh(
      new THREE.CylinderGeometry(0.38, 0.38, 0.28, 14),
      materials.carbon
    );
    wheel.rotation.z = Math.PI / 2;
    wheel.position.set(x, 0.38, z);
    wheel.castShadow = true;
    car.add(wheel);
  });

  return car;
}

function createChargePost(materials) {
  const g = new THREE.Group();
  const stem = new THREE.Mesh(
    new THREE.BoxGeometry(0.28, 1.5, 0.22),
    materials.concrete
  );
  stem.position.y = 0.75;
  stem.castShadow = true;
  g.add(stem);

  const glow = new THREE.Mesh(
    new THREE.BoxGeometry(0.06, 1.2, 0.06),
    materials.cyanGlow
  );
  glow.position.set(0.14, 0.8, 0);
  g.add(glow);

  const glow2 = glow.clone();
  glow2.position.x = -0.14;
  g.add(glow2);

  const head = new THREE.Mesh(
    new THREE.BoxGeometry(0.4, 0.12, 0.3),
    materials.steel
  );
  head.position.y = 1.55;
  g.add(head);

  return g;
}
