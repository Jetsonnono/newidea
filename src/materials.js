import * as THREE from 'three';

function makePetalCellTexture() {
  const size = 256;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  const g = ctx.createLinearGradient(0, 0, size, size);
  g.addColorStop(0, '#2a1a58');
  g.addColorStop(0.5, '#3d2a7a');
  g.addColorStop(1, '#1a1040');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, size, size);

  // Crystalline cell grid
  ctx.strokeStyle = 'rgba(90, 70, 160, 0.55)';
  ctx.lineWidth = 1;
  const cells = 10;
  for (let i = 0; i <= cells; i += 1) {
    const p = (i / cells) * size;
    ctx.beginPath();
    ctx.moveTo(p, 0);
    ctx.lineTo(p, size);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(0, p);
    ctx.lineTo(size, p);
    ctx.stroke();
  }
  // Gold busbars
  ctx.strokeStyle = 'rgba(196, 163, 90, 0.9)';
  ctx.lineWidth = 2;
  for (let i = 0; i <= 4; i += 1) {
    const p = ((i + 0.5) / 5) * size;
    ctx.beginPath();
    ctx.moveTo(p, 0);
    ctx.lineTo(p, size);
    ctx.stroke();
  }
  ctx.lineWidth = 1.5;
  for (let i = 0; i <= 6; i += 1) {
    const p = (i / 6) * size;
    ctx.beginPath();
    ctx.moveTo(0, p);
    ctx.lineTo(size, p);
    ctx.stroke();
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(3, 5);
  tex.anisotropy = 8;
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

export function createMaterials() {
  const concrete = new THREE.MeshStandardMaterial({
    color: 0xe6e8e2,
    roughness: 0.78,
    metalness: 0.03,
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
    color: 0x6e7a48,
    roughness: 0.9,
    metalness: 0.0,
    name: 'shrub',
  });

  const steel = new THREE.MeshStandardMaterial({
    color: 0xeef1f4,
    roughness: 0.28,
    metalness: 0.72,
    name: 'steel',
  });

  const carbon = new THREE.MeshStandardMaterial({
    color: 0x3a3e42,
    roughness: 0.45,
    metalness: 0.7,
    name: 'carbon',
  });

  const bipvGlass = new THREE.MeshPhysicalMaterial({
    color: 0xffffff,
    vertexColors: true,
    roughness: 0.12,
    metalness: 0.05,
    transmission: 0.62,
    thickness: 0.55,
    transparent: true,
    opacity: 0.9,
    ior: 1.48,
    attenuationColor: new THREE.Color(0xb8884a),
    attenuationDistance: 2.2,
    side: THREE.DoubleSide,
    name: 'bipvGlass',
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
    roughness: 0.7,
    metalness: 0.04,
    name: 'courtyard',
  });

  const petalMap = makePetalCellTexture();
  const petalBody = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    map: petalMap,
    roughness: 0.28,
    metalness: 0.55,
    emissive: 0x140c30,
    emissiveIntensity: 0.18,
    side: THREE.DoubleSide,
    name: 'petalBody',
  });

  const petalLattice = new THREE.MeshStandardMaterial({
    color: 0x4a3a88,
    roughness: 0.25,
    metalness: 0.7,
    name: 'petalLattice',
  });

  const goldBusbar = new THREE.MeshStandardMaterial({
    color: 0xc4a35a,
    roughness: 0.2,
    metalness: 1.0,
    name: 'goldBusbar',
  });

  const ground = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    vertexColors: true,
    roughness: 0.98,
    metalness: 0.0,
    name: 'ground',
  });

  const road = new THREE.MeshStandardMaterial({
    color: 0x8a8e86,
    roughness: 0.85,
    metalness: 0.05,
    name: 'road',
  });

  const vehicle = new THREE.MeshStandardMaterial({
    color: 0xeceff2,
    roughness: 0.35,
    metalness: 0.45,
    name: 'vehicle',
  });

  const glassDark = new THREE.MeshStandardMaterial({
    color: 0x1a2430,
    roughness: 0.15,
    metalness: 0.6,
    transparent: true,
    opacity: 0.85,
    name: 'glassDark',
  });

  const cyanGlow = new THREE.MeshStandardMaterial({
    color: 0x3ef0e8,
    emissive: 0x2ad8d0,
    emissiveIntensity: 1.6,
    roughness: 0.3,
    metalness: 0.2,
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
    ramp,
    courtyard,
    petalBody,
    petalLattice,
    goldBusbar,
    ground,
    road,
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
      }
      if (mat.map) mat.map = null;
      if (mat.color) mat.color.set(0xf2f4f0);
      if ('opacity' in mat) {
        mat.transparent = true;
        mat.opacity = shared.has(mat) ? 0.55 : 0.7;
      }
    } else if (mat.userData.prevColor) {
      mat.color.copy(mat.userData.prevColor);
      mat.opacity = mat.userData.prevOpacity ?? 1;
      mat.transparent = mat.userData.prevTransparent ?? false;
      if (mat.userData.prevMap !== undefined) mat.map = mat.userData.prevMap;
    }
  };

  root.traverse((obj) => {
    if (!obj.isMesh) return;
    if (Array.isArray(obj.material)) obj.material.forEach(applyMat);
    else applyMat(obj.material);
  });

  Object.values(materials).forEach(applyMat);
}
