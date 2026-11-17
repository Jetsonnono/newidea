import * as THREE from 'three';
import { createOrganicShape, extrudeOrganicSlab } from '../geometry/helpers.js';

/**
 * Three-tier streamlined white concrete eco-base with recessed
 * Low-E facade bands, glass railings, courtyard & V2G hub.
 */
export function createBase(materials) {
  const group = new THREE.Group();
  group.name = 'Base';

  // Each tier = lower concrete belt + recessed Low-E band + upper parapet
  // (not a solid foam slab — glass must sit on the exterior face)
  const tiers = [
    { y: 0.0, sx: 52, sz: 42, h: 1.55, lobe: 0.2, earth: true },
    { y: 1.55, sx: 40, sz: 32, h: 1.35, lobe: 0.17, earth: true },
    { y: 2.9, sx: 28, sz: 23, h: 1.2, lobe: 0.14, earth: true },
  ];

  tiers.forEach((tier, index) => {
    addRecessedTier(group, materials, tier, index);

    if (tier.earth) {
      const plant = extrudeOrganicSlab(
        tier.sx * 0.86,
        tier.sz * 0.84,
        0.16,
        tier.lobe * 0.9,
        materials.planting,
        0.06
      );
      plant.position.y = tier.y + tier.h - 0.02;
      plant.userData.layer = 'earth';
      plant.userData.restY = plant.position.y;
      plant.castShadow = true;
      plant.receiveShadow = true;
      group.add(plant);
      addTerraceShrubs(group, materials, tier, index);
    }

    const railY = tier.y + tier.h + 0.02;
    const glassR = createGlassRailing(tier.sx * 0.48, tier.sz * 0.48, materials);
    glassR.position.y = railY;
    glassR.userData.layer = 'base';
    glassR.userData.restY = railY;
    group.add(glassR);
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

/**
 * Stacked belt facade: lower + upper concrete, middle = organic RING of
 * dark Low-E (outer path with hole) so the band cannot be occluded.
 */
function addRecessedTier(group, materials, tier, index) {
  const hBot = tier.h * 0.26;
  const hBand = tier.h * 0.52;
  const hTop = tier.h * 0.22;
  const wallT = 0.85; // glass wall thickness (radial)

  const bot = extrudeOrganicSlab(tier.sx, tier.sz, hBot, tier.lobe, materials.concrete, 0.04);
  bot.position.y = tier.y;
  bot.name = `Tier${index + 1}_Bot`;
  bot.userData.layer = 'base';
  bot.userData.restY = bot.position.y;
  group.add(bot);

  const top = extrudeOrganicSlab(tier.sx, tier.sz, hTop, tier.lobe, materials.concrete, 0.04);
  top.position.y = tier.y + hBot + hBand;
  top.name = `Tier${index + 1}_Top`;
  top.userData.layer = 'base';
  top.userData.restY = top.position.y;
  group.add(top);

  const bandY = tier.y + hBot;

  // Dark Low-E curtain wall as hollow organic ring extrusion
  const glassRing = createOrganicRingSlab(
    tier.sx - 0.05,
    tier.sz - 0.05,
    wallT,
    hBand * 0.92,
    tier.lobe,
    materials.lowEGlassLit || materials.lowEGlass
  );
  glassRing.position.y = bandY + hBand * 0.04;
  glassRing.name = `Tier${index + 1}_Glass`;
  glassRing.userData.layer = 'base';
  glassRing.userData.restY = glassRing.position.y;
  glassRing.castShadow = false;
  glassRing.receiveShadow = true;
  group.add(glassRing);

  // Amber glow ring just inside the glass
  const glowRing = createOrganicRingSlab(
    tier.sx - wallT * 0.9,
    tier.sz - wallT * 0.9,
    wallT * 0.55,
    hBand * 0.7,
    tier.lobe,
    materials.amberGlow
  );
  glowRing.position.y = bandY + hBand * 0.15;
  glowRing.userData.layer = 'base';
  glowRing.userData.restY = glowRing.position.y;
  group.add(glowRing);

  // Inner concrete core
  const core = extrudeOrganicSlab(
    tier.sx - wallT * 2.4,
    tier.sz - wallT * 2.4,
    hBand,
    tier.lobe,
    materials.concrete,
    0.02
  );
  core.position.y = bandY;
  core.userData.layer = 'base';
  core.userData.restY = core.position.y;
  group.add(core);

  // Mullions around perimeter
  const mullionCount = 28 + index * 8;
  for (let i = 0; i < mullionCount; i += 1) {
    const t = (i / mullionCount) * Math.PI * 2;
    const rShape =
      1 + tier.lobe * Math.cos(t) + tier.lobe * 0.4 * Math.cos(2 * t);
    const rx = (tier.sx * 0.5 - 0.08) * rShape;
    const rz = (tier.sz * 0.5 - 0.08) * (rShape * 0.92);
    const mull = new THREE.Mesh(
      new THREE.BoxGeometry(0.16, hBand * 0.88, 0.28),
      materials.mullion
    );
    mull.position.set(Math.cos(t) * rx, bandY + hBand * 0.5, Math.sin(t) * rz);
    mull.lookAt(0, mull.position.y, 0);
    mull.castShadow = true;
    mull.userData.layer = 'base';
    mull.userData.restY = mull.position.y;
    group.add(mull);
  }

  // Dark sill / lintel
  const sill = extrudeOrganicSlab(tier.sx + 0.05, tier.sz + 0.05, 0.09, tier.lobe, materials.mullion, 0.02);
  sill.position.y = bandY;
  sill.userData.layer = 'base';
  sill.userData.restY = sill.position.y;
  group.add(sill);

  const lintel = extrudeOrganicSlab(tier.sx + 0.05, tier.sz + 0.05, 0.09, tier.lobe, materials.mullion, 0.02);
  lintel.position.y = bandY + hBand - 0.08;
  lintel.userData.layer = 'base';
  lintel.userData.restY = lintel.position.y;
  group.add(lintel);
}

/** Extruded organic ring (outer shape with inner hole) for facade belts */
function createOrganicRingSlab(scaleX, scaleZ, thickness, height, lobe, material) {
  const outer = createOrganicShape(scaleX, scaleZ, lobe, 96);
  const inner = createOrganicShape(
    Math.max(2, scaleX - thickness * 2),
    Math.max(2, scaleZ - thickness * 2),
    lobe,
    96
  );
  // Hole winding must be opposite of outer
  const hole = new THREE.Path();
  const pts = inner.getPoints(96);
  for (let i = pts.length - 1; i >= 0; i -= 1) {
    const p = pts[i];
    if (i === pts.length - 1) hole.moveTo(p.x, p.y);
    else hole.lineTo(p.x, p.y);
  }
  outer.holes.push(hole);

  const geo = new THREE.ExtrudeGeometry(outer, {
    depth: height,
    bevelEnabled: false,
    curveSegments: 96,
  });
  geo.rotateX(-Math.PI / 2);
  geo.translate(0, height / 2, 0);
  geo.computeVertexNormals();
  const mesh = new THREE.Mesh(geo, material);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  return mesh;
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
    bush.position.set(x, tier.y + tier.h + 0.28, z);
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
