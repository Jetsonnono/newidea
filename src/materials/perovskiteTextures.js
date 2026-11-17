import * as THREE from 'three';

/**
 * 1024² procedural perovskite cell textures:
 * map / roughnessMap / emissiveMap with dark-gold busbars + micro lattice.
 */
export function createPerovskiteMaps(size = 1024) {
  const mapCanvas = document.createElement('canvas');
  mapCanvas.width = mapCanvas.height = size;
  const roughCanvas = document.createElement('canvas');
  roughCanvas.width = roughCanvas.height = size;
  const emisCanvas = document.createElement('canvas');
  emisCanvas.width = emisCanvas.height = size;

  const mapCtx = mapCanvas.getContext('2d');
  const roughCtx = roughCanvas.getContext('2d');
  const emisCtx = emisCanvas.getContext('2d');

  // Obsidian dark purple-blue #141226
  const base = mapCtx.createLinearGradient(0, 0, size, size);
  base.addColorStop(0, '#0e0c1a');
  base.addColorStop(0.35, '#141226');
  base.addColorStop(0.7, '#1a1630');
  base.addColorStop(1, '#0c0a16');
  mapCtx.fillStyle = base;
  mapCtx.fillRect(0, 0, size, size);

  // Micro crystalline noise speckles
  for (let i = 0; i < 18000; i += 1) {
    const x = Math.random() * size;
    const y = Math.random() * size;
    const a = 0.04 + Math.random() * 0.1;
    mapCtx.fillStyle = `rgba(${40 + Math.random() * 50},${20 + Math.random() * 40},${80 + Math.random() * 90},${a})`;
    mapCtx.fillRect(x, y, 1 + Math.random() * 2, 1 + Math.random() * 2);
  }

  // Roughness base — smooth film with busbar highs
  roughCtx.fillStyle = '#3a3a3a';
  roughCtx.fillRect(0, 0, size, size);

  // Emissive base — near black
  emisCtx.fillStyle = '#000000';
  emisCtx.fillRect(0, 0, size, size);

  const cellsX = 14;
  const cellsY = 22;
  const cellW = size / cellsX;
  const cellH = size / cellsY;

  // Micro lattice (cell separators)
  mapCtx.strokeStyle = 'rgba(70, 55, 120, 0.55)';
  mapCtx.lineWidth = 1;
  roughCtx.strokeStyle = '#5a5a5a';
  roughCtx.lineWidth = 1;
  for (let i = 0; i <= cellsX; i += 1) {
    const x = i * cellW;
    mapCtx.beginPath();
    mapCtx.moveTo(x, 0);
    mapCtx.lineTo(x, size);
    mapCtx.stroke();
    roughCtx.beginPath();
    roughCtx.moveTo(x, 0);
    roughCtx.lineTo(x, size);
    roughCtx.stroke();
  }
  for (let j = 0; j <= cellsY; j += 1) {
    const y = j * cellH;
    mapCtx.beginPath();
    mapCtx.moveTo(0, y);
    mapCtx.lineTo(size, y);
    mapCtx.stroke();
    roughCtx.beginPath();
    roughCtx.moveTo(0, y);
    roughCtx.lineTo(size, y);
    roughCtx.stroke();
  }

  // Inner micro-score lines (laser etch)
  mapCtx.strokeStyle = 'rgba(55, 40, 95, 0.35)';
  mapCtx.lineWidth = 0.6;
  for (let i = 0; i < cellsX; i += 1) {
    for (let s = 1; s < 3; s += 1) {
      const x = i * cellW + (s / 3) * cellW;
      mapCtx.beginPath();
      mapCtx.moveTo(x, 0);
      mapCtx.lineTo(x, size);
      mapCtx.stroke();
    }
  }

  // Champagne-gold #d4af37 laser-etched busbars
  const busGold = 'rgba(212, 175, 55, 1)';
  const busGoldDim = 'rgba(200, 160, 50, 0.92)';
  mapCtx.lineCap = 'round';
  roughCtx.strokeStyle = '#d0d0d0';
  emisCtx.strokeStyle = 'rgba(180, 140, 60, 0.55)';

  for (let i = 0; i <= 5; i += 1) {
    const x = ((i + 0.5) / 6) * size;
    mapCtx.strokeStyle = i % 2 === 0 ? busGold : busGoldDim;
    mapCtx.lineWidth = i % 2 === 0 ? 3.2 : 2.2;
    mapCtx.beginPath();
    mapCtx.moveTo(x, 8);
    mapCtx.lineTo(x, size - 8);
    mapCtx.stroke();

    roughCtx.lineWidth = mapCtx.lineWidth;
    roughCtx.beginPath();
    roughCtx.moveTo(x, 8);
    roughCtx.lineTo(x, size - 8);
    roughCtx.stroke();

    emisCtx.lineWidth = mapCtx.lineWidth * 0.8;
    emisCtx.beginPath();
    emisCtx.moveTo(x, 8);
    emisCtx.lineTo(x, size - 8);
    emisCtx.stroke();
  }

  // Cross busbars
  for (let j = 0; j <= 8; j += 1) {
    const y = (j / 8) * size;
    mapCtx.strokeStyle = busGoldDim;
    mapCtx.lineWidth = 1.6;
    mapCtx.beginPath();
    mapCtx.moveTo(6, y);
    mapCtx.lineTo(size - 6, y);
    mapCtx.stroke();

    roughCtx.lineWidth = 1.6;
    roughCtx.beginPath();
    roughCtx.moveTo(6, y);
    roughCtx.lineTo(size - 6, y);
    roughCtx.stroke();

    emisCtx.lineWidth = 1.2;
    emisCtx.beginPath();
    emisCtx.moveTo(6, y);
    emisCtx.lineTo(size - 6, y);
    emisCtx.stroke();
  }

  // Soft vignette for depth
  const vig = mapCtx.createRadialGradient(
    size * 0.5,
    size * 0.45,
    size * 0.15,
    size * 0.5,
    size * 0.5,
    size * 0.72
  );
  vig.addColorStop(0, 'rgba(40, 20, 80, 0)');
  vig.addColorStop(1, 'rgba(0, 0, 0, 0.35)');
  mapCtx.fillStyle = vig;
  mapCtx.fillRect(0, 0, size, size);

  const map = canvasToTexture(mapCanvas, true);
  const roughnessMap = canvasToTexture(roughCanvas, false);
  const emissiveMap = canvasToTexture(emisCanvas, true);

  map.repeat.set(2.5, 4.5);
  roughnessMap.repeat.set(2.5, 4.5);
  emissiveMap.repeat.set(2.5, 4.5);

  return { map, roughnessMap, emissiveMap };
}

function canvasToTexture(canvas, srgb) {
  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.anisotropy = 8;
  tex.generateMipmaps = true;
  tex.minFilter = THREE.LinearMipmapLinearFilter;
  tex.magFilter = THREE.LinearFilter;
  if (srgb) tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

/** Organic caustic pattern for atrium floor overlay */
export function createCausticsTexture(size = 512) {
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = size;
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = '#000000';
  ctx.fillRect(0, 0, size, size);

  const colors = [
    'rgba(201, 137, 58, 0.55)',
    'rgba(31, 77, 138, 0.45)',
    'rgba(212, 160, 90, 0.4)',
    'rgba(58, 110, 165, 0.4)',
    'rgba(196, 90, 42, 0.35)',
  ];

  for (let i = 0; i < 70; i += 1) {
    const x = Math.random() * size;
    const y = Math.random() * size;
    const r = 8 + Math.random() * 48;
    const g = ctx.createRadialGradient(x, y, 0, x, y, r);
    const c = colors[i % colors.length];
    g.addColorStop(0, c);
    g.addColorStop(0.45, c.replace(/[\d.]+\)$/, '0.15)'));
    g.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.ellipse(x, y, r, r * (0.55 + Math.random() * 0.6), Math.random() * Math.PI, 0, Math.PI * 2);
    ctx.fill();
  }

  // Soft web filaments
  ctx.globalCompositeOperation = 'lighter';
  for (let i = 0; i < 30; i += 1) {
    ctx.strokeStyle = colors[i % colors.length].replace(/[\d.]+\)$/, '0.2)');
    ctx.lineWidth = 1 + Math.random() * 2;
    ctx.beginPath();
    let x = Math.random() * size;
    let y = Math.random() * size;
    ctx.moveTo(x, y);
    for (let k = 0; k < 5; k += 1) {
      x += (Math.random() - 0.5) * 80;
      y += (Math.random() - 0.5) * 80;
      ctx.quadraticCurveTo(x + 20, y - 15, x, y);
    }
    ctx.stroke();
  }
  ctx.globalCompositeOperation = 'source-over';

  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.needsUpdate = true;
  return tex;
}
