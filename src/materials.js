import * as THREE from 'three';

export function createMaterials() {
  const concrete = new THREE.MeshStandardMaterial({
    color: 0xe8ece6,
    roughness: 0.82,
    metalness: 0.04,
    name: 'concrete',
  });

  const earthFill = new THREE.MeshStandardMaterial({
    color: 0x6d7a5c,
    roughness: 0.95,
    metalness: 0.0,
    name: 'earthFill',
  });

  const steel = new THREE.MeshStandardMaterial({
    color: 0x8a9499,
    roughness: 0.28,
    metalness: 0.92,
    name: 'steel',
  });

  const bipvAmber = new THREE.MeshPhysicalMaterial({
    color: 0xc9893a,
    roughness: 0.12,
    metalness: 0.05,
    transmission: 0.72,
    thickness: 0.45,
    transparent: true,
    opacity: 0.88,
    ior: 1.45,
    attenuationColor: new THREE.Color(0xd4a05a),
    attenuationDistance: 1.8,
    side: THREE.DoubleSide,
    name: 'bipvAmber',
  });

  const bipvLapis = new THREE.MeshPhysicalMaterial({
    color: 0x1f4d7a,
    roughness: 0.1,
    metalness: 0.08,
    transmission: 0.65,
    thickness: 0.5,
    transparent: true,
    opacity: 0.9,
    ior: 1.5,
    attenuationColor: new THREE.Color(0x2a6aa0),
    attenuationDistance: 1.5,
    side: THREE.DoubleSide,
    name: 'bipvLapis',
  });

  const ramp = new THREE.MeshStandardMaterial({
    color: 0xb8c0b4,
    roughness: 0.7,
    metalness: 0.08,
    name: 'ramp',
  });

  const courtyard = new THREE.MeshStandardMaterial({
    color: 0x4f6b58,
    roughness: 0.9,
    metalness: 0.02,
    name: 'courtyard',
  });

  const petalBody = new THREE.MeshStandardMaterial({
    color: 0x3a2a72,
    roughness: 0.32,
    metalness: 0.62,
    emissive: 0x1a1040,
    emissiveIntensity: 0.22,
    side: THREE.DoubleSide,
    name: 'petalBody',
  });

  const petalLattice = new THREE.MeshStandardMaterial({
    color: 0x5a45a8,
    roughness: 0.22,
    metalness: 0.78,
    emissive: 0x22155a,
    emissiveIntensity: 0.45,
    side: THREE.DoubleSide,
    name: 'petalLattice',
  });

  const goldBusbar = new THREE.MeshStandardMaterial({
    color: 0xc4a35a,
    roughness: 0.22,
    metalness: 1.0,
    name: 'goldBusbar',
  });

  const ground = new THREE.MeshStandardMaterial({
    color: 0xa8b29a,
    roughness: 1.0,
    metalness: 0.0,
    name: 'ground',
  });

  const road = new THREE.MeshStandardMaterial({
    color: 0x6e746c,
    roughness: 0.85,
    metalness: 0.05,
    name: 'road',
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
    steel,
    bipvAmber,
    bipvLapis,
    ramp,
    courtyard,
    petalBody,
    petalLattice,
    goldBusbar,
    ground,
    road,
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
      }
      if (mat.color) mat.color.set(0xf2f4f0);
      if ('opacity' in mat) {
        mat.transparent = true;
        mat.opacity = shared.has(mat) ? 0.55 : 0.7;
      }
    } else if (mat.userData.prevColor) {
      mat.color.copy(mat.userData.prevColor);
      mat.opacity = mat.userData.prevOpacity ?? 1;
      mat.transparent = mat.userData.prevTransparent ?? false;
    }
  };

  root.traverse((obj) => {
    if (!obj.isMesh) return;
    if (Array.isArray(obj.material)) obj.material.forEach(applyMat);
    else applyMat(obj.material);
  });

  // Ensure shared catalog stays in sync even if unused on a mesh this frame
  Object.values(materials).forEach(applyMat);
}
