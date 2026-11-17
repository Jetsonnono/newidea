import * as THREE from 'three';

export const EXPLODE_LABELS = [
  {
    key: 'petals',
    code: '01',
    title: '仿生追光钙钛矿叶片阵列',
    en: 'Sunflower Tracking Petals ×24',
  },
  {
    key: 'glass',
    code: '02',
    title: '彩色半透明 BIPV 发电幕墙',
    en: 'Chromatic Perovskite BIPV Shell',
  },
  {
    key: 'steel',
    code: '03',
    title: '双曲面空间网格钢骨架',
    en: 'Diagrid Skeleton & Ring Beams',
  },
  {
    key: 'program',
    code: '04',
    title: '科研办公 · 储能 · V2G 子系统',
    en: 'Lab Floors · BESS · V2G Hub',
  },
  {
    key: 'foundation',
    code: '05',
    title: '高原覆土保温退台基座',
    en: 'Earth-Sheltered Concrete Base',
  },
];

function makeLabelSprite(meta, boardWhite = false) {
  const canvas = document.createElement('canvas');
  canvas.width = 1024;
  canvas.height = 256;
  const ctx = canvas.getContext('2d');
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Panel
  ctx.fillStyle = boardWhite ? 'rgba(255,255,255,0.94)' : 'rgba(14,22,18,0.82)';
  roundRect(ctx, 24, 28, 960, 200, 18);
  ctx.fill();

  // Accent bar
  ctx.fillStyle = boardWhite ? '#2f6f5e' : '#c4a35a';
  ctx.fillRect(24, 28, 10, 200);

  ctx.fillStyle = boardWhite ? 'rgba(26,34,28,0.55)' : 'rgba(242,239,230,0.65)';
  ctx.font = '600 36px Syne, sans-serif';
  ctx.fillText(meta.code, 60, 88);

  ctx.fillStyle = boardWhite ? '#132018' : '#f2efe6';
  ctx.font = '600 44px "IBM Plex Sans", sans-serif';
  ctx.fillText(meta.title, 60, 148);

  ctx.fillStyle = boardWhite ? 'rgba(19,32,24,0.5)' : 'rgba(242,239,230,0.5)';
  ctx.font = '500 28px "IBM Plex Sans", sans-serif';
  ctx.fillText(meta.en.toUpperCase(), 60, 196);

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.needsUpdate = true;

  const mat = new THREE.SpriteMaterial({
    map: tex,
    transparent: true,
    depthTest: false,
    depthWrite: false,
  });
  const sprite = new THREE.Sprite(mat);
  sprite.scale.set(14, 3.5, 1);
  sprite.center.set(0, 0.5);
  sprite.renderOrder = 10;
  sprite.userData.labelMeta = meta;
  return sprite;
}

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

/**
 * Museum-board callout rails + sprite labels (render into 4K PNG).
 */
export function createCalloutSystem(scene) {
  const root = new THREE.Group();
  root.name = 'ExplodeCallouts';
  root.visible = false;
  scene.add(root);

  const dashMat = new THREE.LineDashedMaterial({
    color: 0x6a736c,
    dashSize: 0.55,
    gapSize: 0.35,
    transparent: true,
    opacity: 0.75,
    depthTest: false,
  });

  const items = EXPLODE_LABELS.map((meta, i) => {
    const side = i % 2 === 0 ? 1 : -1;
    const x = side * (24 + (i % 3) * 1.2);
    const z = -8 + i * 3.2;

    const anchor = new THREE.Group();
    anchor.position.set(x, 0, z);
    root.add(anchor);

    const geo = new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(0, -5, 0),
      new THREE.Vector3(0, 5, 0),
    ]);
    const line = new THREE.Line(geo, dashMat.clone());
    line.computeLineDistances();
    line.frustumCulled = false;
    anchor.add(line);

    const tickGeo = new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(0, 0, 0),
      new THREE.Vector3(-side * 7, 0, 0),
    ]);
    const tick = new THREE.Line(tickGeo, dashMat.clone());
    tick.computeLineDistances();
    tick.frustumCulled = false;
    anchor.add(tick);

    const sprite = makeLabelSprite(meta, false);
    sprite.position.set(side * 0.8, 0.2, 0);
    if (side < 0) {
      sprite.center.set(1, 0.5);
    }
    anchor.add(sprite);

    return { meta, anchor, line, sprite, side, key: meta.key };
  });

  function setVisible(v) {
    root.visible = v;
  }

  function syncToLayers(layerHeights) {
    items.forEach((item) => {
      const y = layerHeights[item.key] ?? 0;
      item.anchor.position.y = y;
    });
  }

  function setBoardStyle(boardWhite) {
    root.traverse((obj) => {
      if (obj.isLine && obj.material) {
        obj.material.color.set(boardWhite ? 0x2a322e : 0x6a736c);
        obj.material.opacity = boardWhite ? 0.92 : 0.7;
      }
    });
    items.forEach((item) => {
      const next = makeLabelSprite(item.meta, boardWhite);
      next.position.copy(item.sprite.position);
      next.center.copy(item.sprite.center);
      item.anchor.remove(item.sprite);
      item.sprite.material.map?.dispose?.();
      item.sprite.material.dispose();
      item.sprite = next;
      item.anchor.add(next);
    });
  }

  function render() {
    // Sprites render with the WebGL scene — no extra pass
  }

  function setSize() {}

  return {
    root,
    labelRenderer: null,
    setVisible,
    syncToLayers,
    setBoardStyle,
    render,
    setSize,
  };
}
