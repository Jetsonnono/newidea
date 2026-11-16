import * as THREE from 'three';
import { createBase } from './base.js';
import { createAtrium } from './atrium.js';
import { createPetalArray } from './petals.js';

export function createBuilding(materials) {
  const root = new THREE.Group();
  root.name = 'HelioMatrixStation';

  const base = createBase(materials);
  const atrium = createAtrium(materials);
  const petals = createPetalArray(materials);

  // Core podium cylinder connecting base to atrium
  const podium = new THREE.Mesh(
    new THREE.CylinderGeometry(8.8, 9.6, 1.2, 48),
    materials.concrete
  );
  podium.position.y = 2.0;
  podium.castShadow = true;
  podium.receiveShadow = true;
  podium.userData.layer = 'podium';
  podium.userData.restY = podium.position.y;

  // Service cores
  const cores = new THREE.Group();
  cores.name = 'ServiceCores';
  [-1, 1].forEach((side, i) => {
    const core = new THREE.Mesh(
      new THREE.CylinderGeometry(1.1, 1.25, 8.5, 20),
      materials.concrete
    );
    core.position.set(side * 6.5, 6.2, -2.5);
    core.castShadow = true;
    core.userData.layer = 'cores';
    core.userData.restY = core.position.y;
    cores.add(core);

    const cap = new THREE.Mesh(
      new THREE.CylinderGeometry(1.35, 1.1, 0.35, 20),
      materials.steel
    );
    cap.position.set(side * 6.5, 10.55, -2.5);
    cap.castShadow = true;
    cap.userData.layer = 'cores';
    cap.userData.restY = cap.position.y;
    cores.add(cap);
  });

  // Roof deck ring for petal mounts
  const roofDeck = new THREE.Mesh(
    new THREE.TorusGeometry(5.8, 0.35, 10, 64),
    materials.concrete
  );
  roofDeck.rotation.x = Math.PI / 2;
  roofDeck.position.y = 13.0;
  roofDeck.castShadow = true;
  roofDeck.receiveShadow = true;
  roofDeck.userData.layer = 'roof';
  roofDeck.userData.restY = roofDeck.position.y;

  const roofPlate = new THREE.Mesh(
    new THREE.CylinderGeometry(4.2, 4.2, 0.25, 48),
    materials.steel
  );
  roofPlate.position.y = 13.15;
  roofPlate.castShadow = true;
  roofPlate.userData.layer = 'roof';
  roofPlate.userData.restY = roofPlate.position.y;

  root.add(base, podium, atrium, cores, roofDeck, roofPlate, petals);

  // Cache explode layers
  const layers = {
    base: [],
    earth: [],
    courtyard: [],
    ramp: [],
    podium: [podium],
    atriumGlass: [],
    atriumSteel: [],
    atriumFloor: [],
    caustics: [],
    cores: [],
    roof: [roofDeck, roofPlate],
    petals: [],
  };

  root.traverse((obj) => {
    if (!obj.isObject3D || !obj.userData?.layer) return;
    const key = obj.userData.layer;
    if (!layers[key]) layers[key] = [];
    layers[key].push(obj);
    if (obj.userData.restY === undefined && obj.position) {
      obj.userData.restY = obj.position.y;
    }
  });

  root.userData.parts = { base, atrium, petals, podium, cores, layers };
  return root;
}

const EXPLODE_OFFSETS = {
  base: 0,
  earth: 0.6,
  courtyard: -1.2,
  ramp: -0.4,
  podium: 1.8,
  atriumFloor: 3.2,
  atriumSteel: 5.5,
  atriumGlass: 7.2,
  caustics: 3.4,
  cores: 4.0,
  roof: 10.5,
  petals: 13.5,
};

export function setExplodedView(building, amount) {
  const layers = building.userData.parts.layers;
  Object.entries(layers).forEach(([key, objs]) => {
    const offset = EXPLODE_OFFSETS[key] ?? 0;
    objs.forEach((obj) => {
      const rest = obj.userData.restY ?? 0;
      const target = rest + offset * amount;
      obj.position.y = THREE.MathUtils.lerp(obj.position.y, target, 0.12);
    });
  });
}
