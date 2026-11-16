import * as THREE from 'three';
import { createBase } from './base.js';
import { createAtrium } from './atrium.js';
import { createPetalArray } from './petals.js';

/**
 * Assemble station and pack content into explode-safe layer groups.
 * Only layer group transforms move during explode — never nested parts.
 */
export function createBuilding(materials) {
  const root = new THREE.Group();
  root.name = 'HelioMatrixStation';

  const mkLayer = (name, key, y = 0) => {
    const g = new THREE.Group();
    g.name = name;
    g.userData.explodeKey = key;
    g.userData.restY = y;
    g.position.y = y;
    return g;
  };

  const layerBase = mkLayer('LayerBase', 'base');
  const layerEarth = mkLayer('LayerEarth', 'earth');
  const layerPodium = mkLayer('LayerPodium', 'podium');
  const layerAtriumFloor = mkLayer('LayerAtriumFloor', 'atriumFloor', 3.15);
  const layerAtriumSteel = mkLayer('LayerAtriumSteel', 'atriumSteel', 3.15);
  const layerAtriumGlass = mkLayer('LayerAtriumGlass', 'atriumGlass', 3.15);
  const layerRoof = mkLayer('LayerRoof', 'roof');
  const layerPetals = mkLayer('LayerPetals', 'petals');

  // —— Base ——
  const base = createBase(materials);
  while (base.children.length) {
    const child = base.children[0];
    if (child.userData.layer === 'earth') layerEarth.add(child);
    else layerBase.add(child);
  }

  const berm = new THREE.Mesh(
    new THREE.TorusGeometry(22, 1.15, 10, 64, Math.PI * 1.45),
    materials.earthFill
  );
  berm.rotation.x = Math.PI / 2;
  berm.rotation.z = 0.8;
  berm.position.set(2, 0.45, -4);
  berm.scale.set(1.1, 1, 0.72);
  berm.castShadow = true;
  berm.receiveShadow = true;
  layerEarth.add(berm);

  // —— Podium ——
  const podium = new THREE.Mesh(
    new THREE.CylinderGeometry(12.2, 13.5, 0.85, 48),
    materials.concrete
  );
  podium.position.y = 3.05;
  podium.castShadow = true;
  podium.receiveShadow = true;
  layerPodium.add(podium);

  // —— Atrium parts (created at local origin; layers carry world Y) ——
  const atrium = createAtrium(materials);
  // createAtrium currently offsets itself by y=3.15 — neutralize and use layers
  atrium.position.y = 0;
  let causticSpots = null;
  while (atrium.children.length) {
    const child = atrium.children[0];
    const layer = child.userData.layer;
    if (child.name === 'BIPVShell' || layer === 'atriumGlass') {
      layerAtriumGlass.add(child);
    } else if (child.name === 'Diagrid' || layer === 'atriumSteel') {
      layerAtriumSteel.add(child);
    } else {
      if (child.name === 'CausticSpots') causticSpots = child;
      layerAtriumFloor.add(child);
    }
  }

  // —— Petals / rings ——
  const petals = createPetalArray(materials);
  while (petals.children.length) {
    const child = petals.children[0];
    if (child.userData.layer === 'roof') layerRoof.add(child);
    else layerPetals.add(child);
  }
  layerPetals.userData.petals = petals.userData.petals;

  root.add(
    layerBase,
    layerEarth,
    layerPodium,
    layerAtriumFloor,
    layerAtriumSteel,
    layerAtriumGlass,
    layerRoof,
    layerPetals
  );

  const layers = {
    base: [layerBase],
    earth: [layerEarth],
    podium: [layerPodium],
    atriumFloor: [layerAtriumFloor],
    atriumSteel: [layerAtriumSteel],
    atriumGlass: [layerAtriumGlass],
    roof: [layerRoof],
    petals: [layerPetals],
  };

  // Proxy for systems that expect atrium.userData.causticSpots
  const atriumProxy = {
    userData: {
      causticSpots,
      dome: atrium.userData.dome,
    },
  };

  root.userData.parts = {
    base: layerBase,
    atrium: atriumProxy,
    petals: layerPetals,
    podium,
    layers,
  };

  return root;
}

const EXPLODE_OFFSETS = {
  base: 0,
  earth: 1.2,
  podium: 3.2,
  atriumFloor: 7,
  atriumSteel: 11,
  atriumGlass: 14,
  roof: 18,
  petals: 24,
};

export function setExplodedView(building, amount) {
  const layers = building.userData.parts.layers;
  Object.entries(layers).forEach(([key, objs]) => {
    const offset = EXPLODE_OFFSETS[key] ?? 0;
    objs.forEach((obj) => {
      const rest = obj.userData.restY ?? 0;
      obj.position.y = THREE.MathUtils.lerp(
        obj.position.y,
        rest + offset * amount,
        0.14
      );
    });
  });
}
