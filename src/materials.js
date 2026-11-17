import * as THREE from 'three';
import { createPerovskiteMaps } from './materials/perovskiteTextures.js';

export function createMaterials() {
  const concrete = new THREE.MeshStandardMaterial({
    color: 0xe6e8e2,
    roughness: 0.78,
    metalness: 0.03,
    envMapIntensity: 0.35,
    name: 'concrete',
  });

  const earthFill = new THREE.MeshStandardMaterial({
    color: 0x7a6b4e,
    roughness: 0.96,
    metalness: 0.0,
    name: 'earthFill',
  });

  const planting = new THREE.MeshStandardMaterial({
    color: 0x5a6b42,
    roughness: 0.92,
    metalness: 0.0,
    name: 'planting',
  });

  const shrub = new THREE.MeshStandardMaterial({
    color: 0x6a7358,
    roughness: 0.92,
    metalness: 0.0,
    name: 'shrub',
  });

  const steel = new THREE.MeshStandardMaterial({
    color: 0xeef1f4,
    roughness: 0.28,
    metalness: 0.72,
    envMapIntensity: 1.1,
    name: 'steel',
  });

  const carbon = new THREE.MeshStandardMaterial({
    color: 0x3a3e42,
    roughness: 0.45,
    metalness: 0.7,
    envMapIntensity: 0.7,
    name: 'carbon',
  });

  // Gem-like BIPV — lapis→amber→terracotta, warm amber glow from inside
  const bipvGlass = new THREE.MeshPhysicalMaterial({
    color: 0xffffff,
    vertexColors: true,
    roughness: 0.08,
    metalness: 0.02,
    transmission: 0.65,
    thickness: 0.7,
    transparent: true,
    opacity: 0.68,
    ior: 1.52,
    attenuationColor: new THREE.Color(0xd4a05a),
    attenuationDistance: 1.6,
    clearcoat: 0.55,
    clearcoatRoughness: 0.1,
    envMapIntensity: 1.35,
    side: THREE.DoubleSide,
    name: 'bipvGlass',
  });

  // Facade Low-E — BasicMaterial so PMREM/bloom can't bleach the ribbon white
  const lowEGlass = new THREE.MeshBasicMaterial({
    color: 0x121820,
    side: THREE.DoubleSide,
    name: 'lowEGlass',
  });

  const lowEGlassLit = new THREE.MeshStandardMaterial({
    color: 0x101820,
    roughness: 0.4,
    metalness: 0.35,
    envMapIntensity: 0.35,
    emissive: 0xffaa44,
    emissiveIntensity: 0.55,
    side: THREE.DoubleSide,
    name: 'lowEGlassLit',
  });

  const mullion = new THREE.MeshStandardMaterial({
    color: 0x1a1c1e,
    roughness: 0.4,
    metalness: 0.85,
    name: 'mullion',
  });

  const amberGlow = new THREE.MeshStandardMaterial({
    color: 0xffaa44,
    emissive: 0xffaa44,
    emissiveIntensity: 1.35,
    roughness: 0.6,
    metalness: 0.05,
    name: 'amberGlow',
  });

  const glassRail = new THREE.MeshPhysicalMaterial({
    color: 0xd8e4ec,
    roughness: 0.05,
    metalness: 0.05,
    transmission: 0.9,
    thickness: 0.05,
    transparent: true,
    opacity: 0.35,
    ior: 1.5,
    side: THREE.DoubleSide,
    name: 'glassRail',
  });

  const stonePavers = new THREE.MeshStandardMaterial({
    color: 0x5a5e62,
    roughness: 0.88,
    metalness: 0.05,
    name: 'stonePavers',
  });

  const gravel = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    roughness: 0.95,
    metalness: 0.02,
    name: 'gravel',
  });

  const canopyPV = new THREE.MeshPhysicalMaterial({
    color: 0x1a2740,
    roughness: 0.2,
    metalness: 0.55,
    transmission: 0.25,
    transparent: true,
    opacity: 0.65,
    envMapIntensity: 1.1,
    side: THREE.DoubleSide,
    name: 'canopyPV',
  });

  const bipvAmber = bipvGlass;
  const bipvLapis = bipvGlass;

  const ramp = new THREE.MeshStandardMaterial({
    color: 0xc5c8c0,
    roughness: 0.72,
    metalness: 0.06,
    name: 'ramp',
  });

  const courtyard = new THREE.MeshStandardMaterial({
    color: 0xd2d5cc,
    roughness: 0.62,
    metalness: 0.04,
    envMapIntensity: 0.4,
    name: 'courtyard',
  });

  // —— Perovskite petal: #141226 obsidian + champagne #d4af37 busbars ——
  const { map, roughnessMap, emissiveMap } = createPerovskiteMaps(1024);
  const petalBody = new THREE.MeshPhysicalMaterial({
    color: 0x141226,
    map,
    roughnessMap,
    emissiveMap,
    emissive: new THREE.Color(0x1a1435),
    emissiveIntensity: 0.14,
    metalness: 0.55,
    roughness: 0.42,
    iridescence: 0.85,
    iridescenceIOR: 1.7,
    iridescenceThicknessRange: [120, 480],
    clearcoat: 0.55,
    clearcoatRoughness: 0.2,
    envMapIntensity: 0.55,
    side: THREE.DoubleSide,
    name: 'petalBody',
  });

  petalBody.onBeforeCompile = (shader) => {
    shader.fragmentShader = shader.fragmentShader.replace(
      '#include <opaque_fragment>',
      `
      {
        vec3 viewDir = normalize(vViewPosition);
        float graze = pow(1.0 - saturate(dot(normal, viewDir)), 2.8);
        // Soft blue-violet film edge + champagne rim kiss — no blown white
        outgoingLight += vec3(0.1, 0.07, 0.22) * graze * 0.35;
        outgoingLight += vec3(0.18, 0.14, 0.05) * graze * graze * 0.22;
      }
      #include <opaque_fragment>
      `
    );
  };
  petalBody.customProgramCacheKey = () => 'perovskite-irid-v2';

  const petalLattice = new THREE.MeshStandardMaterial({
    color: 0x2a2440,
    roughness: 0.35,
    metalness: 0.55,
    name: 'petalLattice',
  });

  const goldBusbar = new THREE.MeshPhysicalMaterial({
    color: 0xd4af37,
    roughness: 0.28,
    metalness: 1.0,
    clearcoat: 0.45,
    clearcoatRoughness: 0.18,
    envMapIntensity: 1.25,
    name: 'goldBusbar',
  });

  const champagneGold = new THREE.MeshPhysicalMaterial({
    color: 0xd4af37,
    roughness: 0.3,
    metalness: 0.95,
    clearcoat: 0.5,
    clearcoatRoughness: 0.16,
    envMapIntensity: 1.3,
    name: 'champagneGold',
  });

  const ground = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    vertexColors: true,
    roughness: 0.9,
    metalness: 0.0,
    bumpScale: 0.35,
    name: 'ground',
  });

  const road = new THREE.MeshStandardMaterial({
    color: 0x3a3c40,
    roughness: 0.9,
    metalness: 0.05,
    name: 'road',
  });

  const asphalt = new THREE.MeshStandardMaterial({
    color: 0x2e3034,
    roughness: 0.92,
    metalness: 0.04,
    name: 'asphalt',
  });

  const stipa = new THREE.MeshStandardMaterial({
    color: 0xb89a5a,
    roughness: 0.95,
    metalness: 0.0,
    name: 'stipa',
  });

  const ridgeRock = new THREE.MeshStandardMaterial({
    color: 0x3d4a52,
    roughness: 0.92,
    metalness: 0.05,
    name: 'ridgeRock',
  });

  const vehicle = new THREE.MeshStandardMaterial({
    color: 0xeceff2,
    roughness: 0.35,
    metalness: 0.45,
    envMapIntensity: 1.0,
    name: 'vehicle',
  });

  const glassDark = new THREE.MeshPhysicalMaterial({
    color: 0x1a2430,
    roughness: 0.12,
    metalness: 0.55,
    transmission: 0.15,
    transparent: true,
    opacity: 0.88,
    envMapIntensity: 1.2,
    name: 'glassDark',
  });

  const cyanGlow = new THREE.MeshStandardMaterial({
    color: 0x3ef0e8,
    emissive: 0x2ad8d0,
    emissiveIntensity: 1.85,
    roughness: 0.25,
    metalness: 0.15,
    name: 'cyanGlow',
  });

  const rock = new THREE.MeshStandardMaterial({
    color: 0x8a7a68,
    roughness: 0.95,
    metalness: 0.0,
    name: 'rock',
  });

  const snow = new THREE.MeshStandardMaterial({
    color: 0xeef2f5,
    roughness: 0.85,
    metalness: 0.0,
    name: 'snow',
  });

  const wireWhite = new THREE.MeshBasicMaterial({
    color: 0xf4f6f2,
    wireframe: true,
    transparent: true,
    opacity: 0.85,
    name: 'wireWhite',
  });

  return {
    concrete,
    earthFill,
    planting,
    shrub,
    steel,
    carbon,
    bipvGlass,
    bipvAmber,
    bipvLapis,
    lowEGlass,
    lowEGlassLit,
    mullion,
    amberGlow,
    glassRail,
    stonePavers,
    gravel,
    canopyPV,
    ramp,
    courtyard,
    petalBody,
    petalLattice,
    goldBusbar,
    champagneGold,
    ground,
    road,
    asphalt,
    stipa,
    ridgeRock,
    vehicle,
    glassDark,
    cyanGlow,
    rock,
    snow,
    wireWhite,
  };
}

export function setWireframeMode(root, materials, enabled) {
  const shared = new Set(Object.values(materials));
  const seen = new Set();

  const applyMat = (mat) => {
    if (!mat || seen.has(mat) || mat.name === 'wireWhite') return;
    seen.add(mat);
    mat.wireframe = enabled;
    if (enabled) {
      if (!mat.userData.prevColor && mat.color?.clone) {
        mat.userData.prevColor = mat.color.clone();
        mat.userData.prevOpacity = mat.opacity;
        mat.userData.prevTransparent = mat.transparent;
        mat.userData.prevMap = mat.map;
        mat.userData.prevTransmission = mat.transmission;
      }
      if (mat.map) mat.map = null;
      if (mat.color) mat.color.set(0xf2f4f0);
      if ('transmission' in mat) mat.transmission = 0;
      if ('opacity' in mat) {
        mat.transparent = true;
        mat.opacity = shared.has(mat) ? 0.55 : 0.7;
      }
    } else if (mat.userData.prevColor) {
      mat.color.copy(mat.userData.prevColor);
      mat.opacity = mat.userData.prevOpacity ?? 1;
      mat.transparent = mat.userData.prevTransparent ?? false;
      if (mat.userData.prevMap !== undefined) mat.map = mat.userData.prevMap;
      if (mat.userData.prevTransmission !== undefined) {
        mat.transmission = mat.userData.prevTransmission;
      }
    }
  };

  root.traverse((obj) => {
    if (!obj.isMesh) return;
    if (Array.isArray(obj.material)) obj.material.forEach(applyMat);
    else applyMat(obj.material);
  });

  Object.values(materials).forEach(applyMat);
}
