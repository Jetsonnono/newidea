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

  // —— Embedded V2G garage (west, into tier-1 mass) ——
  const v2g = createEmbeddedV2G(materials);
  v2g.position.set(-22, 0, 6);
  group.add(v2g);

  // Asphalt trunk road + stone walkway
  group.add(createRoadNetwork(materials));

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
  const count = 10 + seed * 4;
  const grassMat = materials.stipa || materials.shrub;
  for (let i = 0; i < count; i += 1) {
    const a = (i / count) * Math.PI * 2 + seed * 0.4;
    const r = 0.28 + (i % 5) * 0.08;
    const x = Math.cos(a) * tier.sx * r * 0.5;
    const z = Math.sin(a) * tier.sz * r * 0.5;
    const bush = new THREE.Mesh(
      new THREE.SphereGeometry(0.32 + (i % 3) * 0.1, 8, 6),
      materials.shrub
    );
    bush.position.set(x, tier.y + tier.h + 0.28, z);
    bush.scale.set(1.05, 0.6, 1);
    bush.castShadow = true;
    bush.userData.layer = 'earth';
    bush.userData.restY = bush.position.y;
    group.add(bush);

    // Withered stipa tufts on terraces
    for (let k = 0; k < 3; k += 1) {
      const tuft = new THREE.Mesh(
        new THREE.ConeGeometry(0.12, 0.55, 5),
        grassMat
      );
      tuft.position.set(
        x + (Math.random() - 0.5) * 1.2,
        tier.y + tier.h + 0.2,
        z + (Math.random() - 0.5) * 1.2
      );
      tuft.rotation.z = (Math.random() - 0.5) * 0.3;
      tuft.userData.layer = 'earth';
      tuft.userData.restY = tuft.position.y;
      group.add(tuft);
    }
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

/** Recessed semi-underground V2G bay cut into west podium */
function createEmbeddedV2G(materials) {
  const g = new THREE.Group();
  g.name = 'V2GHub';
  g.userData.layer = 'ramp';

  // Concrete portal / lintel
  const lintel = new THREE.Mesh(
    new THREE.BoxGeometry(14, 0.55, 1.2),
    materials.concrete
  );
  lintel.position.set(0, 2.85, 0.2);
  lintel.castShadow = true;
  lintel.userData.layer = 'ramp';
  lintel.userData.restY = lintel.position.y;
  g.add(lintel);

  // Side jambs
  [-6.5, 6.5].forEach((x) => {
    const jamb = new THREE.Mesh(
      new THREE.BoxGeometry(0.7, 2.8, 1.4),
      materials.concrete
    );
    jamb.position.set(x, 1.35, 0.1);
    jamb.castShadow = true;
    jamb.userData.layer = 'ramp';
    jamb.userData.restY = jamb.position.y;
    g.add(jamb);
  });

  // Recessed garage floor
  const floor = new THREE.Mesh(
    new THREE.PlaneGeometry(13, 9),
    materials.asphalt || materials.road
  );
  floor.rotation.x = -Math.PI / 2;
  floor.position.set(0, 0.08, 3.2);
  floor.receiveShadow = true;
  floor.userData.layer = 'ramp';
  floor.userData.restY = floor.position.y;
  g.add(floor);

  // Warm ceiling light strip
  const strip = new THREE.Mesh(
    new THREE.BoxGeometry(11, 0.08, 0.35),
    materials.amberGlow
  );
  strip.position.set(0, 2.55, 1.2);
  strip.userData.layer = 'ramp';
  strip.userData.restY = strip.position.y;
  g.add(strip);

  const warm = new THREE.PointLight(0xffaa44, 1.6, 14, 1.8);
  warm.position.set(0, 2.4, 2.5);
  warm.userData.layer = 'ramp';
  warm.userData.restY = warm.position.y;
  g.add(warm);

  // Yellow stall lines + white arrows
  const yellow = new THREE.MeshBasicMaterial({ color: 0xe8c84a });
  const white = new THREE.MeshBasicMaterial({ color: 0xf2f2ec });
  for (let i = 0; i < 3; i += 1) {
    const x = -4 + i * 4;
    const stall = new THREE.Mesh(new THREE.PlaneGeometry(2.8, 0.1), yellow);
    stall.rotation.x = -Math.PI / 2;
    stall.position.set(x, 0.1, 1.2);
    stall.userData.layer = 'ramp';
    stall.userData.restY = stall.position.y;
    g.add(stall);
    const stall2 = stall.clone();
    stall2.position.z = 5.8;
    g.add(stall2);
    const side = new THREE.Mesh(new THREE.PlaneGeometry(0.1, 4.6), yellow);
    side.rotation.x = -Math.PI / 2;
    side.position.set(x - 1.4, 0.1, 3.5);
    side.userData.layer = 'ramp';
    side.userData.restY = side.position.y;
    g.add(side);

    const arrow = new THREE.Mesh(new THREE.ConeGeometry(0.28, 0.8, 3), white);
    arrow.rotation.x = -Math.PI / 2;
    arrow.position.set(x, 0.11, 7.2);
    arrow.userData.layer = 'ramp';
    arrow.userData.restY = arrow.position.y;
    g.add(arrow);

    const car = createSUV(materials);
    car.position.set(x, 0.2, 3.5);
    car.rotation.y = Math.PI;
    car.userData.restY = car.position.y;
    car.userData.layer = 'ramp';
    g.add(car);

    const post = createChargePost(materials);
    post.position.set(x + 1.5, 0.1, 1.6);
    post.userData.restY = post.position.y;
    post.userData.layer = 'ramp';
    g.add(post);
  }

  return g;
}

function createRoadNetwork(materials) {
  const g = new THREE.Group();
  g.name = 'RoadNetwork';
  g.userData.layer = 'ramp';

  const asphalt = materials.asphalt || materials.road;
  const curbMat = materials.concrete;
  const pathMat = materials.stonePavers || materials.courtyard;

  // Main asphalt trunk — west from V2G then south curve
  const roadPts = [
    new THREE.Vector3(-28, 0.06, 8),
    new THREE.Vector3(-36, 0.06, 14),
    new THREE.Vector3(-40, 0.06, 28),
    new THREE.Vector3(-32, 0.06, 42),
    new THREE.Vector3(-18, 0.06, 48),
  ];
  const roadCurve = new THREE.CatmullRomCurve3(roadPts);
  const roadMesh = new THREE.Mesh(
    new THREE.TubeGeometry(roadCurve, 64, 2.4, 8, false),
    asphalt
  );
  // Flatten tube into road ribbon
  roadMesh.scale.set(1, 0.08, 1);
  roadMesh.receiveShadow = true;
  roadMesh.userData.layer = 'ramp';
  roadMesh.userData.restY = 0;
  g.add(roadMesh);

  // Flat asphalt apron in front of V2G
  const apron = new THREE.Mesh(new THREE.PlaneGeometry(18, 14), asphalt);
  apron.rotation.x = -Math.PI / 2;
  apron.position.set(-26, 0.05, 10);
  apron.receiveShadow = true;
  apron.userData.layer = 'ramp';
  apron.userData.restY = apron.position.y;
  g.add(apron);

  // Curb stones along main road samples
  for (let i = 0; i < 18; i += 1) {
    const t = i / 17;
    const p = roadCurve.getPoint(t);
    const tan = roadCurve.getTangent(t);
    const side = new THREE.Vector3(-tan.z, 0, tan.x).normalize();
    [-1, 1].forEach((s) => {
      const curb = new THREE.Mesh(
        new THREE.BoxGeometry(1.1, 0.18, 0.22),
        curbMat
      );
      curb.position.copy(p).addScaledVector(side, s * 2.6);
      curb.position.y = 0.12;
      curb.lookAt(p.clone().add(tan));
      curb.userData.layer = 'ramp';
      curb.userData.restY = curb.position.y;
      g.add(curb);

      // Low landscape bollard lights
      if (i % 2 === 0 && s > 0) {
        const lamp = new THREE.Mesh(
          new THREE.CylinderGeometry(0.06, 0.08, 0.55, 8),
          materials.steel
        );
        lamp.position.copy(curb.position);
        lamp.position.y = 0.35;
        lamp.userData.layer = 'ramp';
        lamp.userData.restY = lamp.position.y;
        g.add(lamp);
        const glow = new THREE.Mesh(
          new THREE.SphereGeometry(0.08, 8, 8),
          materials.amberGlow
        );
        glow.position.copy(lamp.position);
        glow.position.y += 0.32;
        glow.userData.layer = 'ramp';
        glow.userData.restY = glow.position.y;
        g.add(glow);
      }
    });
  }

  // Light-grey stone walkway — east spiral toward dome entrance
  const pathPts = [];
  for (let i = 0; i <= 28; i += 1) {
    const t = i / 28;
    const a = -0.4 + t * 1.8;
    const r = 30 - t * 16;
    pathPts.push(new THREE.Vector3(Math.cos(a) * r, 0.07, Math.sin(a) * r + 4));
  }
  const pathCurve = new THREE.CatmullRomCurve3(pathPts);
  const pathMesh = new THREE.Mesh(
    new THREE.TubeGeometry(pathCurve, 80, 1.35, 6, false),
    pathMat
  );
  pathMesh.scale.set(1, 0.06, 1);
  pathMesh.receiveShadow = true;
  pathMesh.userData.layer = 'ramp';
  pathMesh.userData.restY = 0;
  g.add(pathMesh);

  // Final approach to podium
  const entry = new THREE.Mesh(new THREE.PlaneGeometry(5, 10), pathMat);
  entry.rotation.x = -Math.PI / 2;
  entry.position.set(8, 0.08, 14);
  entry.rotation.z = -0.35;
  entry.receiveShadow = true;
  entry.userData.layer = 'ramp';
  entry.userData.restY = entry.position.y;
  g.add(entry);

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
