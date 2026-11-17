import * as THREE from 'three';

/** 1024 plateau: cold-grey rock, dark-brown permafrost, withered meadow */
export function createPlateauTextures(size = 1024) {
  const mapCanvas = document.createElement('canvas');
  mapCanvas.width = mapCanvas.height = size;
  const bumpCanvas = document.createElement('canvas');
  bumpCanvas.width = bumpCanvas.height = size;
  const mapCtx = mapCanvas.getContext('2d');
  const bumpCtx = bumpCanvas.getContext('2d');

  // Cool grey rock / dark frost soil wash
  const g = mapCtx.createLinearGradient(0, 0, size, size);
  g.addColorStop(0, '#5a5e62');
  g.addColorStop(0.3, '#6a6258');
  g.addColorStop(0.55, '#4a4540');
  g.addColorStop(0.8, '#7a7368');
  g.addColorStop(1, '#555850');
  mapCtx.fillStyle = g;
  mapCtx.fillRect(0, 0, size, size);
  bumpCtx.fillStyle = '#808080';
  bumpCtx.fillRect(0, 0, size, size);

  // Frost / lichen / withered grass mottling
  for (let i = 0; i < 14000; i += 1) {
    const x = Math.random() * size;
    const y = Math.random() * size;
    const r = 1 + Math.random() * 3.5;
    const kind = Math.random();
    if (kind > 0.62) {
      // cold grey rock chips
      mapCtx.fillStyle = `rgba(${90 + Math.random() * 40},${95 + Math.random() * 35},${100 + Math.random() * 30},${0.1 + Math.random() * 0.15})`;
    } else if (kind > 0.32) {
      // dark brown permafrost
      mapCtx.fillStyle = `rgba(${55 + Math.random() * 35},${42 + Math.random() * 25},${32 + Math.random() * 20},${0.12 + Math.random() * 0.14})`;
    } else {
      // withered yellow meadow
      mapCtx.fillStyle = `rgba(${140 + Math.random() * 40},${120 + Math.random() * 30},${70 + Math.random() * 25},${0.08 + Math.random() * 0.12})`;
    }
    mapCtx.beginPath();
    mapCtx.arc(x, y, r, 0, Math.PI * 2);
    mapCtx.fill();

    const b = 100 + Math.random() * 60;
    bumpCtx.fillStyle = `rgb(${b},${b},${b})`;
    bumpCtx.fillRect(x, y, 1 + Math.random() * 2, 1 + Math.random() * 2);
  }

  // Angular stone chips
  for (let i = 0; i < 3200; i += 1) {
    const x = Math.random() * size;
    const y = Math.random() * size;
    mapCtx.fillStyle = `rgba(${70 + Math.random() * 50},${68 + Math.random() * 45},${65 + Math.random() * 40},0.4)`;
    mapCtx.fillRect(x, y, 1 + Math.random() * 3, 1 + Math.random() * 2);
    bumpCtx.fillStyle = '#c0c0c0';
    bumpCtx.fillRect(x, y, 2, 2);
  }

  // Sparse withered grass streaks
  mapCtx.strokeStyle = 'rgba(150, 130, 75, 0.22)';
  mapCtx.lineWidth = 1.5;
  for (let i = 0; i < 100; i += 1) {
    mapCtx.beginPath();
    let x = Math.random() * size;
    let y = Math.random() * size;
    mapCtx.moveTo(x, y);
    for (let k = 0; k < 4; k += 1) {
      x += (Math.random() - 0.5) * 36;
      y += (Math.random() - 0.5) * 36;
      mapCtx.lineTo(x, y);
    }
    mapCtx.stroke();
  }

  const map = new THREE.CanvasTexture(mapCanvas);
  map.wrapS = map.wrapT = THREE.RepeatWrapping;
  map.repeat.set(22, 22);
  map.colorSpace = THREE.SRGBColorSpace;
  map.anisotropy = 8;

  const bumpMap = new THREE.CanvasTexture(bumpCanvas);
  bumpMap.wrapS = bumpMap.wrapT = THREE.RepeatWrapping;
  bumpMap.repeat.set(22, 22);
  bumpMap.anisotropy = 4;

  return { map, bumpMap };
}

export function createGravelTexture(size = 512) {
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = size;
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = '#3a3834';
  ctx.fillRect(0, 0, size, size);
  for (let i = 0; i < 10000; i += 1) {
    const x = Math.random() * size;
    const y = Math.random() * size;
    const v = 40 + Math.random() * 55;
    ctx.fillStyle = `rgb(${v},${v - 2},${v - 6})`;
    ctx.fillRect(x, y, 1 + Math.random() * 2, 1 + Math.random() * 2);
  }
  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(8, 8);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}
