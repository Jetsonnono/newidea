import * as THREE from 'three';
import { createTwistedLeafGeometry, GOLDEN_ANGLE } from '../geometry/helpers.js';

const PETAL_COUNT = 24;

/**
 * 24 Fibonacci sunflower petals — twisted airfoils on tall Y-truss trunks
 * anchored around the dome / upper terrace (matches aerial + golden-hour refs).
 */
export function createPetalArray(materials) {
  const group = new THREE.Group();
  group.name = 'PetalArray';
  group.userData.petals = [];

  // Anchor ring on podium
  const ring = new THREE.Mesh(
    new THREE.TorusGeometry(11.2, 0.32, 12, 80),
    materials.steel
  );
  ring.rotation.x = Math.PI / 2;
  ring.position.y = 3.95;
  ring.castShadow = true;
  ring.receiveShadow = true;
  ring.userData.layer = 'roof';
  ring.userData.restY = ring.position.y;
  group.add(ring);

  const outerRing = new THREE.Mesh(
    new THREE.TorusGeometry(15.5, 0.24, 10, 80),
    materials.concrete
  );
  outerRing.rotation.x = Math.PI / 2;
  outerRing.position.y = 3.0;
  outerRing.castShadow = true;
  outerRing.userData.layer = 'roof';
  outerRing.userData.restY = outerRing.position.y;
  group.add(outerRing);

  // Inner 10 — smaller, closer, slightly lower
  for (let i = 0; i < 10; i += 1) {
    const angle = i * GOLDEN_ANGLE;
    addSunflowerPetal(group, materials, {
      index: i,
      angle,
      radius: 9.5 + (i % 3) * 0.35,
      baseY: 3.85,
      trunkH: 5.2 + (i % 4) * 0.35,
      length: 6.4,
      width: 2.35,
      scale: 0.92,
      zone: 'inner',
      lean: 0.55,
    });
  }

  // Outer 14 — larger bloom ring
  for (let i = 0; i < 14; i += 1) {
    const angle = i * GOLDEN_ANGLE + 0.4;
    addSunflowerPetal(group, materials, {
      index: 10 + i,
      angle,
      radius: 13.8 + (i % 5) * 0.55,
      baseY: 2.85,
      trunkH: 6.8 + (i % 5) * 0.45,
      length: 9.2,
      width: 3.1,
      scale: 1.08,
      zone: 'outer',
      lean: 0.72,
    });
  }

  return group;
}

function addSunflowerPetal(group, materials, cfg) {
  const {
    index, angle, radius, baseY, trunkH, length, width, scale, zone, lean,
  } = cfg;

  // Root mount on ring / terrace
  const root = new THREE.Group();
  root.name = `PetalRoot_${index}`;
  root.position.set(Math.cos(angle) * radius, baseY, Math.sin(angle) * radius);
  root.userData.layer = 'petals';
  root.userData.restY = root.position.y;

  // Hydraulic base plate
  const base = new THREE.Mesh(
    new THREE.CylinderGeometry(0.55, 0.7, 0.42, 14),
    materials.steel
  );
  base.castShadow = true;
  root.add(base);

  const collar = new THREE.Mesh(
    new THREE.TorusGeometry(0.42, 0.06, 8, 20),
    materials.steel
  );
  collar.rotation.x = Math.PI / 2;
  collar.position.y = 0.22;
  root.add(collar);

  // Tracking hinge at top of trunk
  const hinge = new THREE.Group();
  hinge.name = `PetalHinge_${index}`;
  hinge.position.y = trunkH;

  // Leaf length is +Z; Three.lookAt aims local -Z at target.
  // Aim toward center so +Z blooms radially outward.
  const worldHinge = root.position.clone().add(new THREE.Vector3(0, trunkH, 0));
  const centerAim = new THREE.Vector3(0, worldHinge.y + lean * 2.5, 0);
  const tmp = new THREE.Object3D();
  tmp.position.copy(worldHinge);
  tmp.up.set(0, 1, 0);
  tmp.lookAt(centerAim);
  hinge.quaternion.copy(tmp.quaternion);
  // Open the bloom toward a near-horizontal sunflower face
  hinge.rotateX(-1.35 + lean * 0.1);
  hinge.rotateZ(((index % 7) - 3) * 0.025);
  hinge.userData.baseQuaternion = hinge.quaternion.clone();
  hinge.userData.spiralIndex = index;
  hinge.userData.zone = zone;
  hinge.userData.layer = 'petals';
  hinge.userData.restY = hinge.position.y;

  // Y-truss trunk — light structural grey like reference renders
  const truss = createBranchingYTruss(materials, trunkH);
  root.add(truss);

  // Pivot sphere at hinge
  const joint = new THREE.Mesh(
    new THREE.SphereGeometry(0.28, 14, 12),
    materials.steel
  );
  joint.castShadow = true;
  hinge.add(joint);

  const actuator = new THREE.Mesh(
    new THREE.CylinderGeometry(0.08, 0.1, 0.7, 10),
    materials.carbon
  );
  actuator.position.set(0, -0.35, 0);
  hinge.add(actuator);

  // Twisted leaf — extends along +Z from hinge
  const petal = createPetalMesh(materials, length, width, scale, index);
  petal.position.set(0, 0.05, 0.35);
  hinge.add(petal);

  root.add(hinge);
  group.add(root);
  group.userData.petals.push({ hinge, root, petal, index });
}

function createBranchingYTruss(materials, height) {
  const g = new THREE.Group();
  const mat = materials.steel;
  const trunk = new THREE.Mesh(
    new THREE.CylinderGeometry(0.22, 0.32, height * 0.7, 12),
    mat
  );
  trunk.position.y = height * 0.35;
  trunk.castShadow = true;
  g.add(trunk);

  const forkY = height * 0.68;
  [-1, 1].forEach((side) => {
    const armLen = height * 0.42;
    const arm = new THREE.Mesh(
      new THREE.CylinderGeometry(0.1, 0.16, armLen, 10),
      mat
    );
    arm.position.set(side * 0.75, forkY + armLen * 0.22, 0.45);
    arm.rotation.z = side * 0.62;
    arm.rotation.x = -0.5;
    arm.castShadow = true;
    g.add(arm);

    const tip = new THREE.Mesh(
      new THREE.SphereGeometry(0.14, 10, 10),
      materials.carbon
    );
    tip.position.set(side * 1.25, forkY + armLen * 0.52, 0.9);
    tip.castShadow = true;
    g.add(tip);
  });

  const brace = new THREE.Mesh(
    new THREE.CylinderGeometry(0.06, 0.06, 2.1, 8),
    mat
  );
  brace.rotation.z = Math.PI / 2;
  brace.position.set(0, forkY + 0.4, 0.5);
  g.add(brace);

  const shaft = new THREE.Mesh(
    new THREE.CylinderGeometry(0.14, 0.18, height * 0.3, 10),
    mat
  );
  shaft.position.y = height * 0.85;
  shaft.castShadow = true;
  g.add(shaft);

  return g;
}

function createPetalMesh(materials, length, width, scale, seed) {
  const g = new THREE.Group();
  const leafParams = {
    length,
    width,
    thickness: 0.16,
    camber: 0.85 + (seed % 5) * 0.05,
    twist: 0.95 + (seed % 4) * 0.08,
    tipDroop: 1.15 + (seed % 3) * 0.12,
    segsL: 52,
    segsW: 20,
  };
  const geo = createTwistedLeafGeometry(leafParams);

  const body = new THREE.Mesh(geo, materials.petalBody.clone());
  body.material.emissiveIntensity = 0.22 + (seed % 4) * 0.03;
  body.castShadow = true;
  body.receiveShadow = true;
  g.add(body);

  // Champagne-gold aluminum perimeter frame
  const rim = createChampagneRim(leafParams, materials.champagneGold || materials.goldBusbar);
  if (rim) g.add(rim);

  // Center gold busbar highlight
  const edge = new THREE.Mesh(
    new THREE.BoxGeometry(0.035, 0.025, length * 0.88),
    materials.goldBusbar
  );
  edge.position.set(0, 0.09, length * 0.45);
  g.add(edge);

  // Underside Y-type carbon fiber truss (readable from worm's-eye views)
  const underside = createPetalUndersideTruss(length, width, materials);
  g.add(underside);

  g.scale.setScalar(scale);
  return g;
}

/** Deep-grey Y carbon truss + hydraulic actuator detail on petal back */
function createPetalUndersideTruss(length, width, materials) {
  const g = new THREE.Group();
  g.name = 'PetalUnderside';

  const carbon = materials.carbon;
  const steel = materials.steel;

  // Central spine
  const spine = new THREE.Mesh(
    new THREE.BoxGeometry(0.08, 0.07, length * 0.9),
    carbon
  );
  spine.position.set(0, -0.08, length * 0.45);
  spine.castShadow = true;
  g.add(spine);

  // Y-forks along length
  const forks = 5;
  for (let i = 0; i < forks; i += 1) {
    const v = 0.18 + (i / (forks - 1)) * 0.62;
    const z = v * length;
    const halfSpan = width * (0.22 + Math.sin(v * Math.PI) * 0.28);
    [-1, 1].forEach((side) => {
      const arm = new THREE.Mesh(
        new THREE.CylinderGeometry(0.028, 0.04, halfSpan * 1.05, 6),
        carbon
      );
      arm.position.set(side * halfSpan * 0.48, -0.1, z);
      arm.rotation.z = side * (0.95 + (1 - v) * 0.25);
      arm.rotation.x = 0.15;
      arm.castShadow = true;
      g.add(arm);

      const tip = new THREE.Mesh(
        new THREE.SphereGeometry(0.045, 6, 6),
        carbon
      );
      tip.position.set(side * halfSpan * 0.95, -0.09, z);
      g.add(tip);
    });

    // Cross brace
    const brace = new THREE.Mesh(
      new THREE.CylinderGeometry(0.018, 0.018, halfSpan * 1.7, 5),
      carbon
    );
    brace.rotation.z = Math.PI / 2;
    brace.position.set(0, -0.095, z);
    g.add(brace);
  }

  // Hydraulic pivot block near root (metal tracking joint)
  const pivotBlock = new THREE.Mesh(
    new THREE.BoxGeometry(0.32, 0.18, 0.42),
    steel
  );
  pivotBlock.position.set(0, -0.14, 0.35);
  pivotBlock.castShadow = true;
  g.add(pivotBlock);

  const cyl = new THREE.Mesh(
    new THREE.CylinderGeometry(0.055, 0.065, 0.55, 10),
    carbon
  );
  cyl.rotation.x = Math.PI / 2;
  cyl.position.set(0.18, -0.2, 0.55);
  cyl.castShadow = true;
  g.add(cyl);

  const rod = new THREE.Mesh(
    new THREE.CylinderGeometry(0.025, 0.025, 0.7, 8),
    steel
  );
  rod.rotation.x = Math.PI / 2;
  rod.position.set(0.18, -0.2, 0.95);
  g.add(rod);

  const clevis = new THREE.Mesh(
    new THREE.TorusGeometry(0.07, 0.018, 6, 12),
    steel
  );
  clevis.position.set(0.18, -0.2, 1.25);
  g.add(clevis);

  // Side hydraulic twin
  const cyl2 = cyl.clone();
  cyl2.position.x = -0.18;
  g.add(cyl2);
  const rod2 = rod.clone();
  rod2.position.x = -0.18;
  g.add(rod2);

  return g;
}

/** Tube rim following twisted-leaf silhouette */
function createChampagneRim(params, material) {
  const {
    length, width, camber, twist, tipDroop, thickness = 0.16,
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
    new THREE.TubeGeometry(curve, 120, 0.028, 6, true),
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

    const stagger = Math.sin(idx * 0.65) * 0.05;
    const targetDir = sun.clone();
    targetDir.y = THREE.MathUtils.clamp(targetDir.y + stagger, 0.12, 1);
    targetDir.normalize();

    const lookTarget = worldPos.clone().add(targetDir);
    const tmp = new THREE.Object3D();
    tmp.position.copy(worldPos);
    tmp.up.set(0, 1, 0);
    tmp.lookAt(lookTarget);
    // Keep leaf open / facing sun
    tmp.rotateX(-1.2);

    const qBase = hinge.userData.baseQuaternion;
    const blend = hinge.userData.zone === 'inner' ? 0.78 : 0.88;
    const qBlend = qBase.clone().slerp(tmp.quaternion, blend);
    hinge.quaternion.slerp(qBlend, 0.25);

    alignmentSum += Math.max(0, targetDir.dot(sun));
  });

  return alignmentSum / Math.max(1, petals.length);
}

export { PETAL_COUNT };
