import * as THREE from 'three';

const PETAL_COUNT = 24;

/**
 * 24 parametric spiral perovskite biomimetic heliotropic petals.
 * Deep blue-violet lattice with gold busbar details; each rotates about its hinge axis.
 */
export function createPetalArray(materials) {
  const group = new THREE.Group();
  group.name = 'PetalArray';
  group.userData.petals = [];

  // Roof spiral crown
  for (let i = 0; i < 16; i += 1) {
    const petal = createPetal(materials, i);
    const angle = (i / 16) * Math.PI * 2;
    const radius = 5.2 + (i % 4) * 0.55;
    const y = 13.2 + (i % 3) * 0.35;
    const hinge = new THREE.Group();
    hinge.name = `RoofPetalHinge_${i}`;
    hinge.position.set(Math.cos(angle) * radius, y, Math.sin(angle) * radius);
    hinge.lookAt(0, y + 2.5, 0);
    hinge.rotateY(Math.PI);
    // Local X is hinge axis
    petal.position.set(0, 0, 1.15);
    hinge.add(petal);
    hinge.userData.baseQuaternion = hinge.quaternion.clone();
    hinge.userData.spiralIndex = i;
    hinge.userData.zone = 'roof';
    hinge.userData.layer = 'petals';
    hinge.userData.restY = hinge.position.y;
    group.add(hinge);
    group.userData.petals.push({ hinge, petal, index: i });
  }

  // South façade spiral band
  for (let i = 0; i < 8; i += 1) {
    const petal = createPetal(materials, i + 16, 0.82);
    const t = i / 7;
    const x = -8 + t * 16;
    const y = 4.2 + Math.sin(t * Math.PI) * 2.4 + t * 1.2;
    const z = 11.5 + Math.sin(t * Math.PI * 2) * 0.6;
    const hinge = new THREE.Group();
    hinge.name = `SouthPetalHinge_${i}`;
    hinge.position.set(x, y, z);
    hinge.rotation.set(-0.35, Math.PI, 0.15 * Math.sin(t * Math.PI));
    petal.position.set(0, 0, 0.9);
    hinge.add(petal);
    hinge.userData.baseQuaternion = hinge.quaternion.clone();
    hinge.userData.spiralIndex = i + 16;
    hinge.userData.zone = 'south';
    hinge.userData.layer = 'petals';
    hinge.userData.restY = hinge.position.y;
    group.add(hinge);
    group.userData.petals.push({ hinge, petal, index: i + 16 });
  }

  return group;
}

function createPetal(materials, seed = 0, scale = 1) {
  const group = new THREE.Group();
  group.name = `Petal_${seed}`;

  // Biomimetic pointed ellipse body
  const shape = new THREE.Shape();
  shape.moveTo(0, -0.2);
  shape.bezierCurveTo(0.55, 0.2, 0.7, 1.4, 0.05, 2.6);
  shape.bezierCurveTo(-0.7, 1.4, -0.55, 0.2, 0, -0.2);

  const bodyGeo = new THREE.ExtrudeGeometry(shape, {
    depth: 0.06,
    bevelEnabled: true,
    bevelThickness: 0.02,
    bevelSize: 0.025,
    bevelSegments: 2,
    curveSegments: 24,
  });
  bodyGeo.center();
  bodyGeo.rotateX(-Math.PI / 2);

  const body = new THREE.Mesh(bodyGeo, materials.petalBody.clone());
  body.castShadow = true;
  body.receiveShadow = true;
  // Slight hue variation across petals
  const hueShift = (seed % 7) * 0.01;
  body.material.color.offsetHSL(hueShift, 0.02, -0.02 * (seed % 3));
  body.userData.restY = 0;
  group.add(body);

  // Lattice texture via thin ribs
  const latticeMat = materials.petalLattice;
  for (let i = 0; i < 5; i += 1) {
    const rib = new THREE.Mesh(
      new THREE.BoxGeometry(0.015, 0.02, 2.2 - i * 0.15),
      latticeMat
    );
    rib.position.set(-0.28 + i * 0.14, 0.05, 0.05);
    rib.rotation.y = (-0.2 + i * 0.1) * 0.4;
    rib.castShadow = true;
    rib.userData.restY = rib.position.y;
    group.add(rib);
  }
  for (let i = 0; i < 4; i += 1) {
    const cross = new THREE.Mesh(
      new THREE.BoxGeometry(0.9 - i * 0.12, 0.015, 0.015),
      latticeMat
    );
    cross.position.set(0, 0.05, -0.7 + i * 0.45);
    cross.userData.restY = cross.position.y;
    group.add(cross);
  }

  // Gold busbars
  const bus1 = new THREE.Mesh(
    new THREE.BoxGeometry(0.03, 0.03, 2.35),
    materials.goldBusbar
  );
  bus1.position.set(0, 0.06, 0.02);
  bus1.userData.restY = bus1.position.y;
  group.add(bus1);

  const bus2 = new THREE.Mesh(
    new THREE.BoxGeometry(0.85, 0.02, 0.025),
    materials.goldBusbar
  );
  bus2.position.set(0, 0.065, -0.85);
  bus2.userData.restY = bus2.position.y;
  group.add(bus2);

  const bus3 = bus2.clone();
  bus3.position.z = 0.55;
  bus3.scale.x = 0.7;
  bus3.userData.restY = bus3.position.y;
  group.add(bus3);

  // Edge trim
  const edge = new THREE.Mesh(
    new THREE.TorusGeometry(0.95, 0.012, 6, 40, Math.PI * 1.2),
    materials.goldBusbar
  );
  edge.rotation.x = Math.PI / 2;
  edge.rotation.z = 0.2;
  edge.position.set(0, 0.04, 0.1);
  edge.scale.set(0.55, 1.15, 0.9);
  edge.userData.restY = edge.position.y;
  group.add(edge);

  group.scale.setScalar(scale);
  group.userData.normalLocal = new THREE.Vector3(0, 1, 0);
  return group;
}

/**
 * Orient each petal so its face normal tracks the sun direction.
 */
export function updatePetalTracking(petalArray, sunDirection) {
  const sun = sunDirection.clone().normalize();
  const petals = petalArray.userData.petals || [];
  let alignmentSum = 0;

  petals.forEach(({ hinge }, idx) => {
    const worldPos = new THREE.Vector3();
    hinge.getWorldPosition(worldPos);

    // Desired outward facing toward sun, with spiral phase offset for organic stagger
    const stagger = Math.sin(idx * 0.7) * 0.08;
    const targetDir = sun.clone();
    targetDir.y = THREE.MathUtils.clamp(targetDir.y + stagger, 0.05, 1);
    targetDir.normalize();

    const lookTarget = worldPos.clone().add(targetDir);
    const tmp = new THREE.Object3D();
    tmp.position.copy(worldPos);
    tmp.up.set(0, 1, 0);
    tmp.lookAt(lookTarget);

    // Blend with base mounting orientation for structural realism
    const qTarget = tmp.quaternion;
    const qBase = hinge.userData.baseQuaternion;
    const qBlend = qBase.clone().slerp(qTarget, hinge.userData.zone === 'roof' ? 0.88 : 0.75);
    hinge.quaternion.slerp(qBlend, 0.28);

    // Power uses intended facing (stable), not in-flight quaternion
    alignmentSum += Math.max(0, targetDir.dot(sun));
  });

  return alignmentSum / Math.max(1, petals.length);
}

export { PETAL_COUNT };
