import * as THREE from 'three';
import { createOrganicShape, extrudeOrganicSlab } from '../geometry/helpers.js';

/**
 * Three-tier streamlined white concrete eco-base with recessed
 * Low-E facade bands, glass railings, courtyard & V2G hub.
 */
export function createBase(materials) {
  const group = new THREE.Group();
  group.name = 'Base';

  const tiers = [
    { y: 0.0, sx: 52, sz: 42, h: 1.35, lobe: 0.2, earth: true },
    { y: 1.35, sx: 40, sz: 32, h: 1.2, lobe: 0.17, earth: true },
    { y: 2.55, sx: 28, sz: 23, h: 1.1, lobe: 0.14, earth: true },
  ];

  tiers.forEach((tier, index) => {
    const slab = extrudeOrganicSlab(tier.sx, tier.sz, tier.h, tier.lobe, materials.concrete, 0.48);
    slab.position.y = tier.y;
    slab.name = `Tier${index + 1}`;
    slab.userData.layer = 'base';
    slab.userData.restY = slab.position.y;
    group.add(slab);

    // Recessed Low-E ribbon + mullions + warm amber interior glow
    addFacadeBand(group, materials, tier, index);

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

    // Glass railing + metal handrail on terrace edge
    if (index >= 0) {
      const railY = tier.y + tier.h * 0.55 + 0.08;
      const glassR = createGlassRailing(
        tier.sx * 0.49,
        tier.sz * 0.49,
        materials
      );
      glassR.position.y = railY;
      glassR.userData.layer = 'base';
      glassR.userData.restY = railY;
      group.add(glassR);
    }
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
  const road = new THREE.Mesh(new THREE.PlaneGeometry(10, 36), materials.road);
  road.rotation.x = -Math.PI / 2;
  road.position.set(18, 0.04, 22);
  road.rotation.z = -0.55;
  road.receiveShadow = true;
  road.userData.layer = 'ramp';
  road.userData.restY = road.position.y;
  group.add(road);

  return group;
}

function addFacadeBand(group, materials, tier, index) {
  const bandH = tier.h * 0.42;
  const y = tier.y + tier.h * 0.28;
  const inset = 0.35;
  const sx = tier.sx - inset * 2;
  const sz = tier.sz - inset * 2;

  // Inner amber glow volume (reads as inhabited space)
  const glow = extrudeOrganicSlab(sx * 0.96, sz * 0.96, bandH * 0.85, tier.lobe, materials.amberGlow, 0.05);
  glow.position.y = y;
  glow.userData.layer = 'base';
  glow.userData.restY = y;
  group.add(glow);

  // Dark Low-E glass ribbon slightly outside glow
  const glass = extrudeOrganicSlab(sx, sz, bandH, tier.lobe, materials.lowEGlass, 0.04);
  glass.position.y = y;
  glass.userData.layer = 'base';
  glass.userData.restY = y;
  glass.castShadow = false;
  glass.receiveShadow = true;
  group.add(glass);

  // Vertical mullions around perimeter
  const mullionCount = 18 + index * 4;
  for (let i = 0; i < mullionCount; i += 1) {
    const t = (i / mullionCount) * Math.PI * 2;
    const rShape = 1 + tier.lobe * Math.cos(t) + tier.lobe * 0.4 * Math.cos(2 * t);
    const x = Math.cos(t) * (sx * 0.5) * rShape * 0.98;
    const z = Math.sin(t) * (sz * 0.5) * (rShape * 0.92) * 0.98;
    const m = new THREE.Mesh(
      new THREE.BoxGeometry(0.08, bandH * 0.95, 0.12),
      materials.mullion
    );
    m.position.set(x, y + bandH * 0.05, z);
    m.lookAt(0, m.position.y, 0);
    m.castShadow = true;
    m.userData.layer = 'base';
    m.userData.restY = m.position.y;
    group.add(m);
  }

  // Slim lintel / sill bands
  [y - 0.02, y + bandH * 0.9].forEach((ly, li) => {
    const sill = extrudeOrganicSlab(sx + 0.15, sz + 0.15, 0.07, tier.lobe, materials.mullion, 0.02);
    sill.position.y = ly;
    sill.userData.layer = 'base';
    sill.userData.restY = ly;
    group.add(sill);
  });
}

function createGlassRailing(rx, rz, materials) {
  const g = new THREE.Group();
  const pts = [];
  for (let i = 0; i <= 72; i += 1) {
    const t = (i / 72) * Math.PI * 2;
    pts.push(new THREE.Vector3(Math.cos(t) * rx, 0, Math.sin(t) * rz));
  }
  const curve = new THREE.CatmullRomCurve3(pts, true);

  const panelCount = 36;
  for (let i = 0; i < panelCount; i += 1) {
    const t0 = (i / panelCount) * Math.PI * 2;
    const t1 = ((i + 0.92) / panelCount) * Math.PI * 2;
    const p0 = new THREE.Vector3(Math.cos(t0) * rx, 0.55, Math.sin(t0) * rz);
    const p1 = new THREE.Vector3(Math.cos(t1) * rx, 0.55, Math.sin(t1) * rz);
    const mid = p0.clone().add(p1).multiplyScalar(0.5);
    const w = p0.distanceTo(p1);
    const panel = new THREE.Mesh(
      new THREE.BoxGeometry(w, 1.05, 0.035),
      materials.glassRail
    );
    panel.position.copy(mid);
    panel.lookAt(0, mid.y, 0);
    panel.castShadow = false;
    g.add(panel);

    const post = new THREE.Mesh(
      new THREE.CylinderGeometry(0.03, 0.03, 1.1, 8),
      materials.steel
    );
    post.position.set(Math.cos(t0) * rx, 0.55, Math.sin(t0) * rz);
    post.castShadow = true;
    g.add(post);
  }

  const hand = new THREE.Mesh(
    new THREE.TubeGeometry(curve, 128, 0.028, 6, true),
    materials.steel
  );
  hand.position.y = 1.08;
  hand.castShadow = true;
  g.add(hand);

  return g;
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

function createSunkenCourtyard(materials) {
  const g = new THREE.Group();
  g.name = 'SunkenCourtyard';
  g.userData.layer = 'courtyard';

  const floor = new THREE.Mesh(
    new THREE.CylinderGeometry(5.4, 5.8, 0.25, 48),
    materials.stonePavers
  );
  floor.position.y = -0.55;
  floor.receiveShadow = true;
  floor.userData.restY = floor.position.y;
  floor.userData.layer = 'courtyard';
  g.add(floor);

  // Stone path ring
  const path = new THREE.Mesh(
    new THREE.RingGeometry(2.2, 3.6, 48),
    materials.stonePavers
  );
  path.rotation.x = -Math.PI / 2;
  path.position.y = -0.4;
  path.receiveShadow = true;
  path.userData.layer = 'courtyard';
  path.userData.restY = path.position.y;
  g.add(path);

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

  // Instanced highland shrubs + rocks (30–40)
  const bushGeo = new THREE.SphereGeometry(0.45, 8, 6);
  const bushMesh = new THREE.InstancedMesh(bushGeo, materials.shrub, 28);
  const rockGeo = new THREE.DodecahedronGeometry(0.35, 0);
  const rockMesh = new THREE.InstancedMesh(rockGeo, materials.rock, 16);
  const dummy = new THREE.Object3D();
  let bi = 0;
  let ri = 0;
  for (let i = 0; i < 40; i += 1) {
    const a = (i / 40) * Math.PI * 2 + 0.2;
    const d = 2.6 + (i % 5) * 0.45;
    dummy.position.set(Math.cos(a) * d, -0.15, Math.sin(a) * d);
    if (i % 3 !== 0 && bi < 28) {
      dummy.scale.set(1.1 + (i % 3) * 0.2, 0.55 + (i % 4) * 0.1, 1);
      dummy.updateMatrix();
      bushMesh.setMatrixAt(bi, dummy.matrix);
      bi += 1;
    } else if (ri < 16) {
      dummy.scale.set(1, 0.55, 0.85);
      dummy.rotation.set(Math.random(), Math.random(), Math.random());
      dummy.updateMatrix();
      rockMesh.setMatrixAt(ri, dummy.matrix);
      ri += 1;
    }
  }
  bushMesh.instanceMatrix.needsUpdate = true;
  rockMesh.instanceMatrix.needsUpdate = true;
  bushMesh.castShadow = true;
  rockMesh.castShadow = true;
  bushMesh.userData.layer = 'courtyard';
  rockMesh.userData.layer = 'courtyard';
  bushMesh.userData.restY = 0;
  rockMesh.userData.restY = 0;
  g.add(bushMesh, rockMesh);

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

  // Semi-transparent PV canopy
  const canopyShape = createOrganicShape(14, 9, 0.12, 48);
  const canopyGeo = new THREE.ExtrudeGeometry(canopyShape, {
    depth: 0.12,
    bevelEnabled: true,
    bevelThickness: 0.04,
    bevelSize: 0.05,
    bevelSegments: 2,
    curveSegments: 40,
  });
  canopyGeo.rotateX(-Math.PI / 2);
  const canopy = new THREE.Mesh(canopyGeo, materials.canopyPV);
  canopy.position.set(4, 3.5, 4);
  canopy.castShadow = true;
  canopy.userData.restY = canopy.position.y;
  canopy.userData.layer = 'ramp';
  g.add(canopy);

  // Steel canopy frame
  const frame = new THREE.Mesh(
    new THREE.TorusGeometry(5.5, 0.08, 8, 40),
    materials.steel
  );
  frame.rotation.x = Math.PI / 2;
  frame.position.set(4, 3.45, 4);
  frame.scale.set(1.3, 1, 0.85);
  frame.userData.layer = 'ramp';
  frame.userData.restY = frame.position.y;
  g.add(frame);

  [[-1, 1], [4, -1], [8, 2]].forEach(([cx, cz]) => {
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

  // Parking deck with stall lines + arrows
  const deck = new THREE.Mesh(
    new THREE.PlaneGeometry(12, 8),
    materials.road
  );
  deck.rotation.x = -Math.PI / 2;
  deck.position.set(4, 0.42, 5.2);
  deck.receiveShadow = true;
  deck.userData.layer = 'ramp';
  deck.userData.restY = deck.position.y;
  g.add(deck);

  const lineMat = new THREE.MeshBasicMaterial({ color: 0xf5f5f0 });
  for (let i = 0; i < 3; i += 1) {
    const stall = new THREE.Mesh(new THREE.PlaneGeometry(2.6, 0.08), lineMat);
    stall.rotation.x = -Math.PI / 2;
    stall.position.set(1 + i * 3.5, 0.44, 3.2);
    stall.userData.layer = 'ramp';
    stall.userData.restY = stall.position.y;
    g.add(stall);
    const stall2 = stall.clone();
    stall2.position.z = 7.2;
    g.add(stall2);
    const side = new THREE.Mesh(new THREE.PlaneGeometry(0.08, 4), lineMat);
    side.rotation.x = -Math.PI / 2;
    side.position.set(-0.2 + i * 3.5, 0.44, 5.2);
    side.userData.layer = 'ramp';
    side.userData.restY = side.position.y;
    g.add(side);

    // Flow arrow (triangle)
    const arrow = new THREE.Mesh(
      new THREE.ConeGeometry(0.25, 0.7, 3),
      lineMat
    );
    arrow.rotation.x = -Math.PI / 2;
    arrow.position.set(1 + i * 3.5, 0.45, 8.2);
    arrow.userData.layer = 'ramp';
    arrow.userData.restY = arrow.position.y;
    g.add(arrow);
  }

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
  const body = new THREE.Mesh(new THREE.BoxGeometry(2.2, 0.7, 4.4), materials.vehicle);
  body.position.y = 0.45;
  body.castShadow = true;
  car.add(body);

  const cabin = new THREE.Mesh(new THREE.BoxGeometry(2.0, 0.55, 2.4), materials.glassDark);
  cabin.position.set(0, 1.05, -0.15);
  cabin.castShadow = true;
  car.add(cabin);

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
  const stem = new THREE.Mesh(new THREE.BoxGeometry(0.28, 1.5, 0.22), materials.concrete);
  stem.position.y = 0.75;
  stem.castShadow = true;
  g.add(stem);

  const glow = new THREE.Mesh(new THREE.BoxGeometry(0.06, 1.2, 0.06), materials.cyanGlow);
  glow.position.set(0.14, 0.8, 0);
  g.add(glow);
  const glow2 = glow.clone();
  glow2.position.x = -0.14;
  g.add(glow2);

  const head = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.12, 0.3), materials.steel);
  head.position.y = 1.55;
  g.add(head);
  return g;
}
