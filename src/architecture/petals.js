import * as THREE from 'three';
import { createTwistedLeafGeometry, GOLDEN_ANGLE } from '../geometry/helpers.js';

const PETAL_COUNT = 24;

/**
 * 24 Fibonacci sunflower petals — near-horizontal crown (18–35°)
 * on white dendritic columns anchored to the podium roof (no ring truss / windmill masts).
 */
export function createPetalArray(materials) {
  const group = new THREE.Group();
  group.name = 'PetalArray';
  group.userData.petals = [];

  // Soft podium rail only — no elevated scaffold ring
  const podiumRing = new THREE.Mesh(
    new THREE.TorusGeometry(14.2, 0.16, 10, 72),
    materials.concrete
  );
  podiumRing.rotation.x = Math.PI / 2;
  podiumRing.position.y = 4.05;
  podiumRing.castShadow = true;
  podiumRing.userData.layer = 'roof';
  podiumRing.userData.restY = podiumRing.position.y;
  group.add(podiumRing);

  // Inner 10 — closer ring on upper terrace
  for (let i = 0; i < 10; i += 1) {
    const angle = i * GOLDEN_ANGLE;
    const tiltDeg = 18 + (i % 5) * 2.5; // 18–28°
    addSunflowerPetal(group, materials, {
      index: i,
      angle,
      radius: 11.2 + (i % 3) * 0.35,
      baseY: 4.05,
      trunkH: 2.35 + (i % 3) * 0.18,
      length: 7.2,
      width: 2.55,
      scale: 0.95,
      zone: 'inner',
      tiltDeg,
    });
  }

  // Outer 14 — larger outward bloom
  for (let i = 0; i < 14; i += 1) {
    const angle = i * GOLDEN_ANGLE + 0.35;
    const tiltDeg = 22 + (i % 6) * 2.2; // 22–35°
    addSunflowerPetal(group, materials, {
      index: 10 + i,
      angle,
      radius: 14.6 + (i % 5) * 0.4,
      baseY: 4.0,
      trunkH: 2.55 + (i % 4) * 0.2,
      length: 8.8,
      width: 2.95,
      scale: 1.05,
      zone: 'outer',
      tiltDeg,
    });
  }

  return group;
}

function addSunflowerPetal(group, materials, cfg) {
  const {
    index, angle, radius, baseY, trunkH, length, width, scale, zone, tiltDeg,
  } = cfg;

  const root = new THREE.Group();
  root.name = `PetalRoot_${index}`;
  root.position.set(Math.cos(angle) * radius, baseY, Math.sin(angle) * radius);
  root.userData.layer = 'petals';
  root.userData.restY = root.position.y;

  // White dendritic column — branches cradle the petal from below
  const tree = createDendriticColumn(materials, trunkH, width);
  root.add(tree);

  const hinge = new THREE.Group();
  hinge.name = `PetalHinge_${index}`;
  hinge.position.y = trunkH;

  // lookAt aims local −Z at center → petal +Z blooms radially outward
  const worldHinge = root.position.clone().add(new THREE.Vector3(0, trunkH, 0));
  const centerAim = new THREE.Vector3(0, worldHinge.y + 0.4, 0);
  const tmp = new THREE.Object3D();
  tmp.position.copy(worldHinge);
  tmp.up.set(0, 1, 0);
  tmp.lookAt(centerAim);
  hinge.quaternion.copy(tmp.quaternion);

  // Near-horizontal crown: tiltDeg from horizontal (18–35°)
  const tiltRad = THREE.MathUtils.degToRad(tiltDeg);
  hinge.rotateX(-(Math.PI / 2 - tiltRad));
  hinge.rotateZ(((index % 7) - 3) * 0.018);
  hinge.userData.baseQuaternion = hinge.quaternion.clone();
  hinge.userData.spiralIndex = index;
  hinge.userData.zone = zone;
  hinge.userData.tiltDeg = tiltDeg;
  hinge.userData.layer = 'petals';
  hinge.userData.restY = hinge.position.y;

  const joint = new THREE.Mesh(
    new THREE.SphereGeometry(0.18, 12, 10),
    materials.steel
  );
  joint.castShadow = true;
  hinge.add(joint);

  const petal = createPetalMesh(materials, length, width, scale, index);
  petal.position.set(0, 0.02, 0.25);
  hinge.add(petal);

  root.add(hinge);
  group.add(root);
  group.userData.petals.push({ hinge, root, petal, index });
}

/** Biomimetic white tree column with 3–4 streamline ribs cradling the petal */
function createDendriticColumn(materials, height, petalWidth) {
  const g = new THREE.Group();
  const mat = materials.steel;

  const trunk = new THREE.Mesh(
    new THREE.CylinderGeometry(0.11, 0.22, height * 0.55, 12),
    mat
  );
  trunk.position.y = height * 0.28;
  trunk.castShadow = true;
  g.add(trunk);

  const flare = new THREE.Mesh(
    new THREE.CylinderGeometry(0.28, 0.18, 0.22, 12),
    mat
  );
  flare.position.y = 0.08;
  flare.castShadow = true;
  g.add(flare);

  const forkY = height * 0.52;
  const ribs = 4;
  for (let i = 0; i < ribs; i += 1) {
    const t = (i / ribs) * Math.PI * 2 + 0.2;
    const spread = 0.45 + petalWidth * 0.12;
    const armLen = height * 0.48;
    const arm = new THREE.Mesh(
      new THREE.CylinderGeometry(0.045, 0.09, armLen, 8),
      mat
    );
    arm.position.set(
      Math.cos(t) * spread * 0.55,
      forkY + armLen * 0.28,
      Math.sin(t) * spread * 0.35 + 0.25
    );
    arm.rotation.z = Math.cos(t) * 0.55;
    arm.rotation.x = -0.55 - Math.abs(Math.sin(t)) * 0.2;
    arm.castShadow = true;
    g.add(arm);

    const tip = new THREE.Mesh(
      new THREE.SphereGeometry(0.07, 8, 8),
      mat
    );
    tip.position.set(
      Math.cos(t) * spread * 0.95,
      forkY + armLen * 0.55,
      Math.sin(t) * spread * 0.55 + 0.55
    );
    tip.castShadow = true;
    g.add(tip);
  }

  // Slim central shaft to hinge
  const shaft = new THREE.Mesh(
    new THREE.CylinderGeometry(0.07, 0.1, height * 0.38, 10),
    mat
  );
  shaft.position.y = height * 0.78;
  shaft.castShadow = true;
  g.add(shaft);

  return g;
}

function createPetalMesh(materials, length, width, scale, seed) {
  const g = new THREE.Group();
  const leafParams = {
    length,
    width,
    thickness: 0.14,
    camber: 0.55 + (seed % 5) * 0.04,
    twist: 0.55 + (seed % 4) * 0.06,
    tipDroop: 0.55 + (seed % 3) * 0.08,
    segsL: 52,
    segsW: 20,
  };
  const geo = createTwistedLeafGeometry(leafParams);

  const body = new THREE.Mesh(geo, materials.petalBody.clone());
  body.material.emissiveIntensity = 0.12 + (seed % 4) * 0.02;
  body.castShadow = true;
  body.receiveShadow = true;
  g.add(body);

  const rim = createChampagneRim(leafParams, materials.champagneGold || materials.goldBusbar);
  if (rim) g.add(rim);

  // Champagne-gold laser busbars
  const busMat = materials.goldBusbar;
  const spine = new THREE.Mesh(
    new THREE.BoxGeometry(0.04, 0.02, length * 0.9),
    busMat
  );
  spine.position.set(0, 0.08, length * 0.45);
  g.add(spine);

  for (let i = 0; i < 6; i += 1) {
    const finger = new THREE.Mesh(
      new THREE.BoxGeometry(width * 0.42, 0.012, 0.025),
      busMat
    );
    finger.position.set(0, 0.075, length * (0.18 + i * 0.12));
    finger.rotation.y = (i % 2 === 0 ? 0.08 : -0.08);
    g.add(finger);
  }

  // Slim carbon underside ribs (not heavy scaffold)
  const rib = new THREE.Mesh(
    new THREE.BoxGeometry(0.04, 0.04, length * 0.75),
    materials.carbon
  );
  rib.position.set(0, -0.05, length * 0.4);
  rib.castShadow = true;
  g.add(rib);

  g.scale.setScalar(scale);
  return g;
}

function createChampagneRim(params, material) {
  const {
    length, width, camber, twist, tipDroop, thickness = 0.14,
  } = params;
  const pts = [];
  const samples = 48;

  const sampleEdge = (v, side) => {
    const widthProfile =
      Math.pow(Math.sin(Math.pow(v, 0.62) * Math.PI), 0.85) *
      (1 - Math.pow(v, 2.4) * 0.2);
    const halfW = (width * 0.5) * Math.max(0.05, widthProfile);
    const droop = Math.pow(v, 1.85) * tipDroop;
    const twistAngle = (v - 0.28) * twist;
    const archBase = Math.sin(v * Math.PI) * camber;
    const u = side < 0 ? 0 : 1;
    const x0 = side < 0 ? -halfW : halfW;
    const edge = 1 - Math.pow(Math.abs(u * 2 - 1), 1.6);
    const y0 = thickness * edge * (0.35 + 0.65 * Math.sin(v * Math.PI));
    const arch = archBase * (0.7 + 0.3 * edge);
    const ySurf = y0 + arch * (1 - Math.abs(u * 2 - 1) * 0.35) - droop;
    const cosT = Math.cos(twistAngle);
    const sinT = Math.sin(twistAngle);
    return new THREE.Vector3(
      x0 * cosT - ySurf * sinT * 0.25,
      x0 * sinT * 0.15 + ySurf + 0.02,
      v * length
    );
  };

  for (let i = 0; i <= samples; i += 1) pts.push(sampleEdge(i / samples, -1));
  for (let i = samples; i >= 0; i -= 1) pts.push(sampleEdge(i / samples, 1));

  if (pts.length < 4) return null;
  const curve = new THREE.CatmullRomCurve3(pts, true);
  const tube = new THREE.Mesh(
    new THREE.TubeGeometry(curve, 120, 0.022, 6, true),
    material
  );
  tube.castShadow = true;
  return tube;
}

export function updatePetalTracking(petalArray, sunDirection) {
  const sun = sunDirection.clone().normalize();
  const petals = petalArray.userData.petals || [];
  let alignmentSum = 0;

  petals.forEach(({ hinge }, idx) => {
    const worldPos = new THREE.Vector3();
    hinge.getWorldPosition(worldPos);

    const stagger = Math.sin(idx * 0.65) * 0.04;
    const targetDir = sun.clone();
    // Keep tracking shallow — preserve near-horizontal crown
    targetDir.y = THREE.MathUtils.clamp(targetDir.y * 0.45 + 0.35 + stagger, 0.28, 0.72);
    targetDir.normalize();

    const lookTarget = worldPos.clone().add(targetDir);
    const tmp = new THREE.Object3D();
    tmp.position.copy(worldPos);
    tmp.up.set(0, 1, 0);
    tmp.lookAt(lookTarget);

    const tiltDeg = hinge.userData.tiltDeg ?? 25;
    const tiltRad = THREE.MathUtils.degToRad(tiltDeg);
    tmp.rotateX(-(Math.PI / 2 - tiltRad));

    const qBase = hinge.userData.baseQuaternion;
    const blend = hinge.userData.zone === 'inner' ? 0.55 : 0.62;
    const qBlend = qBase.clone().slerp(tmp.quaternion, blend);
    hinge.quaternion.slerp(qBlend, 0.2);

    alignmentSum += Math.max(0, targetDir.dot(sun));
  });

  return alignmentSum / Math.max(1, petals.length);
}

export { PETAL_COUNT };
