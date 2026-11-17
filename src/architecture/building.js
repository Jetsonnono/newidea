import * as THREE from 'three';
import { createBase } from './base.js';
import { createAtrium } from './atrium.js';
import { createPetalArray } from './petals.js';
import { createScaleRefs } from './scale.js';

/**
 * Assemble station into five exhibition explode layers:
 * L1 petals · L2 BIPV glass · L3 diagrid steel · L4 program · L5 foundation
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

  // Five museum board layers
  const layerFoundation = mkLayer('Layer5_Foundation', 'foundation');
  const layerProgram = mkLayer('Layer4_Program', 'program');
  const layerSteel = mkLayer('Layer3_Steel', 'steel', 3.15);
  const layerGlass = mkLayer('Layer2_Glass', 'glass', 3.15);
  const layerPetals = mkLayer('Layer1_Petals', 'petals');

  // —— Foundation (base + earth + courtyard) ——
  const base = createBase(materials);
  while (base.children.length) {
    const child = base.children[0];
    const layer = child.userData.layer;
    if (layer === 'ramp') {
      // V2G hub belongs with program/interior systems
      layerProgram.add(child);
    } else {
      layerFoundation.add(child);
    }
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
  layerFoundation.add(berm);

  // Scale figures + weather tower
  const scaleRefs = createScaleRefs(materials);
  while (scaleRefs.children.length) {
    layerFoundation.add(scaleRefs.children[0]);
  }

  // —— Program: podium + atrium floor + interiors ——
  const podium = new THREE.Mesh(
    new THREE.CylinderGeometry(12.2, 13.5, 0.85, 48),
    materials.concrete
  );
  podium.position.y = 3.05;
  podium.castShadow = true;
  podium.receiveShadow = true;
  layerProgram.add(podium);

  const atrium = createAtrium(materials);
  atrium.position.y = 0;
  let causticSpots = null;
  while (atrium.children.length) {
    const child = atrium.children[0];
    const layer = child.userData.layer;
    if (child.name === 'BIPVShell' || layer === 'atriumGlass') {
      layerGlass.add(child);
    } else if (child.name === 'Diagrid' || layer === 'atriumSteel') {
      layerSteel.add(child);
    } else {
      if (child.name === 'CausticSpots') causticSpots = child;
      // Cores / floor / caustics → program layer (local coords at atrium height)
      child.position.y += 3.15;
      layerProgram.add(child);
    }
  }
  // glass & steel sit at world atrium height via layer.restY
  layerGlass.userData.restY = 3.15;
  layerGlass.position.y = 3.15;
  layerSteel.userData.restY = 3.15;
  layerSteel.position.y = 3.15;

  // Extra program content: spiral stair + BESS cabinets
  addProgramInteriors(layerProgram, materials);

  // —— Petals + roof ring beams on steel layer ——
  const petals = createPetalArray(materials);
  while (petals.children.length) {
    const child = petals.children[0];
    if (child.userData.layer === 'roof') layerSteel.add(child);
    else layerPetals.add(child);
  }
  layerPetals.userData.petals = petals.userData.petals;

  root.add(layerFoundation, layerProgram, layerSteel, layerGlass, layerPetals);

  const layers = {
    foundation: [layerFoundation],
    program: [layerProgram],
    steel: [layerSteel],
    glass: [layerGlass],
    petals: [layerPetals],
    // aliases for older callers
    base: [layerFoundation],
    atriumFloor: [layerProgram],
    atriumSteel: [layerSteel],
    atriumGlass: [layerGlass],
  };

  const atriumProxy = {
    userData: {
      causticSpots,
      dome: atrium.userData.dome,
    },
  };

  root.userData.parts = {
    base: layerFoundation,
    atrium: atriumProxy,
    petals: layerPetals,
    podium,
    layers,
    exhibitionLayers: {
      foundation: layerFoundation,
      program: layerProgram,
      steel: layerSteel,
      glass: layerGlass,
      petals: layerPetals,
    },
  };

  return root;
}

function addProgramInteriors(layer, materials) {
  // Two ring research office floors visible through translucent BIPV
  [3.95, 5.85].forEach((y, fi) => {
    const ring = new THREE.Mesh(
      new THREE.RingGeometry(4.2 - fi * 0.3, 10.4 - fi * 0.4, 64),
      materials.concrete
    );
    ring.rotation.x = -Math.PI / 2;
    ring.position.y = y;
    ring.receiveShadow = true;
    ring.castShadow = true;
    layer.add(ring);

    // Warm amber under-glow for inhabited labs
    const glowRing = new THREE.Mesh(
      new THREE.RingGeometry(4.4 - fi * 0.3, 10.0 - fi * 0.4, 48),
      materials.amberGlow
    );
    glowRing.rotation.x = -Math.PI / 2;
    glowRing.position.y = y - 0.08;
    layer.add(glowRing);

    // Desk / lab benches on each floor
    for (let i = 0; i < 6; i += 1) {
      const a = (i / 6) * Math.PI * 2 + fi * 0.3;
      const desk = new THREE.Mesh(
        new THREE.BoxGeometry(2.2, 0.1, 0.7),
        materials.concrete
      );
      desk.position.set(Math.cos(a) * 7.2, y + 0.4, Math.sin(a) * 7.2);
      desk.rotation.y = -a;
      desk.castShadow = true;
      layer.add(desk);
    }
  });

  // Spiral stair around oculus
  const stair = new THREE.Group();
  stair.name = 'SpiralStair';
  const steps = 36;
  for (let i = 0; i < steps; i += 1) {
    const t = i / steps;
    const a = t * Math.PI * 4.2;
    const r = 3.2;
    const step = new THREE.Mesh(
      new THREE.BoxGeometry(1.15, 0.08, 0.48),
      materials.concrete
    );
    step.position.set(Math.cos(a) * r, 3.35 + t * 5.0, Math.sin(a) * r);
    step.rotation.y = -a;
    step.castShadow = true;
    step.receiveShadow = true;
    stair.add(step);
  }
  const rail = new THREE.Mesh(
    new THREE.TorusGeometry(3.4, 0.04, 6, 48),
    materials.steel
  );
  rail.rotation.x = Math.PI / 2;
  rail.position.y = 5.8;
  stair.add(rail);
  const rail2 = rail.clone();
  rail2.position.y = 7.4;
  stair.add(rail2);
  layer.add(stair);

  // Central warm atrium glow volume
  const atriumGlow = new THREE.Mesh(
    new THREE.CylinderGeometry(2.6, 3.2, 5.5, 24, 1, true),
    materials.amberGlow
  );
  atriumGlow.position.y = 5.5;
  atriumGlow.material = materials.amberGlow.clone();
  atriumGlow.material.transparent = true;
  atriumGlow.material.opacity = 0.35;
  atriumGlow.material.side = THREE.DoubleSide;
  layer.add(atriumGlow);

  // Battery energy storage cabinets
  for (let i = 0; i < 4; i += 1) {
    const cab = new THREE.Mesh(
      new THREE.BoxGeometry(1.2, 2.2, 0.7),
      materials.carbon
    );
    cab.position.set(-7 + i * 1.5, 4.3, -6.5);
    cab.castShadow = true;
    layer.add(cab);
    const stripe = new THREE.Mesh(
      new THREE.BoxGeometry(1.05, 0.08, 0.72),
      materials.cyanGlow
    );
    stripe.position.set(-7 + i * 1.5, 4.9, -6.5);
    layer.add(stripe);
  }
}

/** Museum-grade vertical offsets for five exhibition layers */
const EXPLODE_OFFSETS = {
  foundation: 0,
  program: 10,
  steel: 20,
  glass: 28,
  petals: 38,
  // aliases
  base: 0,
  earth: 0,
  atriumFloor: 10,
  podium: 10,
  atriumSteel: 20,
  roof: 20,
  atriumGlass: 28,
};

export function setExplodedView(building, amount) {
  const layers = building.userData.parts.layers;
  const seen = new Set();
  Object.entries(layers).forEach(([key, objs]) => {
    const offset = EXPLODE_OFFSETS[key];
    if (offset === undefined) return;
    objs.forEach((obj) => {
      if (seen.has(obj)) return;
      seen.add(obj);
      const rest = obj.userData.restY ?? 0;
      obj.position.y = THREE.MathUtils.lerp(
        obj.position.y,
        rest + offset * amount,
        0.12
      );
    });
  });
}

/** World-space Y centers for callout sync */
export function getExhibitionLayerHeights(building, amount = 1) {
  const ex = building.userData.parts.exhibitionLayers;
  const heights = {};
  Object.entries(ex).forEach(([key, group]) => {
    const rest = group.userData.restY ?? 0;
    const offset = EXPLODE_OFFSETS[key] ?? 0;
    // Approximate visual center of each separated pack
    const packLift = { foundation: 1.2, program: 5, steel: 7, glass: 7, petals: 8 };
    heights[key] = rest + offset * amount + (packLift[key] ?? 4);
  });
  return heights;
}
