import * as THREE from 'three';

/** 1024 plateau tundra / gravel CanvasTextures for map + bump */
export function createPlateauTextures(size = 1024) {
  const mapCanvas = document.createElement('canvas');
  mapCanvas.width = mapCanvas.height = size;
  const bumpCanvas = document.createElement('canvas');
  bumpCanvas.width = bumpCanvas.height = size;
  const mapCtx = mapCanvas.getContext('2d');
  const bumpCtx = bumpCanvas.getContext('2d');

  // Base tundra wash
  const g = mapCtx.createLinearGradient(0, 0, size, size);
  g.addColorStop(0, '#8a7a62');
  g.addColorStop(0.4, '#9a886c');
  g.addColorStop(0.7, '#7d7360');
  g.addColorStop(1, '#6e6658');
  mapCtx.fillStyle = g;
  mapCtx.fillRect(0, 0, size, size);
  bumpCtx.fillStyle = '#808080';
  bumpCtx.fillRect(0, 0, size, size);

  // Frost / lichen mottling
  for (let i = 0; i < 12000; i += 1) {
    const x = Math.random() * size;
    const y = Math.random() * size;
    const r = 1 + Math.random() * 3;
    const warm = Math.random() > 0.55;
    mapCtx.fillStyle = warm
      ? `rgba(${140 + Math.random() * 40},${120 + Math.random() * 30},${80 + Math.random() * 30},${0.08 + Math.random() * 0.12})`
      : `rgba(${90 + Math.random() * 40},${100 + Math.random() * 35},${90 + Math.random() * 30},${0.06 + Math.random() * 0.1})`;
    mapCtx.beginPath();
    mapCtx.arc(x, y, r, 0, Math.PI * 2);
    mapCtx.fill();

    const b = 110 + Math.random() * 50;
    bumpCtx.fillStyle = `rgb(${b},${b},${b})`;
    bumpCtx.fillRect(x, y, 1 + Math.random() * 2, 1 + Math.random() * 2);
  }

  // Stone chips
  for (let i = 0; i < 2500; i += 1) {
    const x = Math.random() * size;
    const y = Math.random() * size;
    mapCtx.fillStyle = `rgba(${70 + Math.random() * 60},${65 + Math.random() * 50},${55 + Math.random() * 40},0.35)`;
    mapCtx.fillRect(x, y, 1 + Math.random() * 3, 1 + Math.random() * 2);
    bumpCtx.fillStyle = '#c8c8c8';
    bumpCtx.fillRect(x, y, 2, 2);
  }

  // Sparse moss streaks
  mapCtx.strokeStyle = 'rgba(90, 110, 70, 0.18)';
  mapCtx.lineWidth = 2;
  for (let i = 0; i < 80; i += 1) {
    mapCtx.beginPath();
    let x = Math.random() * size;
    let y = Math.random() * size;
    mapCtx.moveTo(x, y);
    for (let k = 0; k < 4; k += 1) {
      x += (Math.random() - 0.5) * 40;
      y += (Math.random() - 0.5) * 40;
      mapCtx.lineTo(x, y);
    }
    mapCtx.stroke();
  }

  const map = new THREE.CanvasTexture(mapCanvas);
  map.wrapS = map.wrapT = THREE.RepeatWrapping;
  map.repeat.set(18, 18);
  map.colorSpace = THREE.SRGBColorSpace;
  map.anisotropy = 8;

  const bumpMap = new THREE.CanvasTexture(bumpCanvas);
  bumpMap.wrapS = bumpMap.wrapT = THREE.RepeatWrapping;
  bumpMap.repeat.set(18, 18);
  bumpMap.anisotropy = 4;

  return { map, bumpMap };
}

export function createGravelTexture(size = 512) {
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = size;
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = '#4a4640';
  ctx.fillRect(0, 0, size, size);
  for (let i = 0; i < 8000; i += 1) {
    const x = Math.random() * size;
    const y = Math.random() * size;
    const v = 50 + Math.random() * 70;
    ctx.fillStyle = `rgb(${v},${v - 4},${v - 10})`;
    ctx.fillRect(x, y, 1 + Math.random() * 2, 1 + Math.random() * 2);
  }
  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(8, 8);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}
