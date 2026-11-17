import * as THREE from 'three';

/**
 * Left: 02 glass, 04 program · Right: 01 petals, 03 steel, 05 foundation
 * Leaders: 45° elbow + horizontal datum (museum diagram style).
 */
export const EXPLODE_LABELS = [
  {
    key: 'petals',
    code: '01',
    title: '24片向日葵仿生钙钛矿追光叶片',
    en: 'Sunflower Perovskite Tracking Petals ×24',
    side: 'right',
    stack: 0,
  },
  {
    key: 'glass',
    code: '02',
    title: '彩色半透明 BIPV 发电玻璃幕墙',
    en: 'Chromatic Translucent Perovskite BIPV',
    side: 'left',
    stack: 0,
  },
  {
    key: 'steel',
    code: '03',
    title: '双曲面空间三角网格钢结构 (Diagrid)',
    en: 'Parametric Spatial Diagrid Shell',
    side: 'right',
    stack: 1,
  },
  {
    key: 'program',
    code: '04',
    title: '零碳科研中庭与 V2G 微网系统',
    en: 'Zero-Carbon Atrium · BESS · V2G Hub',
    side: 'left',
    stack: 1,
  },
  {
    key: 'foundation',
    code: '05',
    title: '高原覆土保温混凝土退台基座',
    en: 'Plateau Earth-Sheltered Concrete Base',
    side: 'right',
    stack: 2,
  },
];

function makeLabelSprite(meta, boardWhite = false) {
  const canvas = document.createElement('canvas');
  canvas.width = 1280;
  canvas.height = 256;
  const ctx = canvas.getContext('2d');
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  ctx.fillStyle = boardWhite ? 'rgba(255,255,255,0.96)' : 'rgba(14,22,18,0.88)';
  roundRect(ctx, 20, 20, 1240, 216, 12);
  ctx.fill();

  ctx.fillStyle = boardWhite ? '#2f6f5e' : '#c4a35a';
  ctx.fillRect(20, 20, 9, 216);

  ctx.fillStyle = boardWhite ? 'rgba(26,34,28,0.55)' : 'rgba(242,239,230,0.65)';
  ctx.font = '600 36px Syne, "Noto Sans SC", sans-serif';
  ctx.fillText(meta.code, 48, 82);

  ctx.fillStyle = boardWhite ? '#132018' : '#f2efe6';
  const title = meta.title;
  if (title.length > 20) {
    ctx.font = '600 32px "IBM Plex Sans", "Noto Sans SC", sans-serif';
    ctx.fillText(title.slice(0, 16), 48, 136);
    ctx.fillText(title.slice(16), 48, 176);
    ctx.fillStyle = boardWhite ? 'rgba(19,32,24,0.5)' : 'rgba(242,239,230,0.5)';
    ctx.font = '500 22px "IBM Plex Sans", sans-serif';
    ctx.fillText(meta.en.toUpperCase(), 48, 216);
  } else {
    ctx.font = '600 36px "IBM Plex Sans", "Noto Sans SC", sans-serif';
    ctx.fillText(title, 48, 145);
    ctx.fillStyle = boardWhite ? 'rgba(19,32,24,0.5)' : 'rgba(242,239,230,0.5)';
    ctx.font = '500 24px "IBM Plex Sans", sans-serif';
    ctx.fillText(meta.en.toUpperCase(), 48, 200);
  }

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
  sprite.scale.set(14, 2.8, 1);
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
 * Alternating L/R callouts with 45° polyline + horizontal datum leaders.
 */
export function createCalloutSystem(scene) {
  const root = new THREE.Group();
  root.name = 'ExplodeCallouts';
  root.visible = false;
  scene.add(root);

  const lineMat = new THREE.LineBasicMaterial({
    color: 0x8a938c,
    transparent: true,
    opacity: 0.88,
    depthTest: false,
  });

  const LABEL_X = 30;
  const ANCHOR_X = 11;

  const items = EXPLODE_LABELS.map((meta) => {
    const side = meta.side === 'left' ? -1 : 1;
    const zSpread = meta.stack * 1.2 - 1.2;

    const anchor = new THREE.Group();
    // Label plate sits far left/right; Y synced to layer height
    anchor.position.set(side * LABEL_X, 0, zSpread);
    root.add(anchor);

    // Building-side anchor dot → 45° elbow → horizontal datum into label
    const localDotX = side * (ANCHOR_X - LABEL_X);
    const diag = 7.5;
    const elbowX = localDotX + side * diag;
    const elbowY = diag; // 45° rise in elevation
    const labelEdgeX = -side * 0.6;

    const dot = new THREE.Mesh(
      new THREE.SphereGeometry(0.2, 12, 10),
      new THREE.MeshBasicMaterial({ color: 0xc4a35a, depthTest: false })
    );
    dot.position.set(localDotX, 0, 0);
    dot.renderOrder = 11;
    anchor.add(dot);

    const leaderGeo = new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(localDotX, 0, 0),
      new THREE.Vector3(elbowX, elbowY, 0),
      new THREE.Vector3(labelEdgeX, elbowY, 0),
    ]);
    const leader = new THREE.Line(leaderGeo, lineMat.clone());
    leader.frustumCulled = false;
    leader.renderOrder = 10;
    anchor.add(leader);

    const sprite = makeLabelSprite(meta, false);
    // Sit on the horizontal datum of the 45° leader
    sprite.position.set(0, diag + 0.15, 0);
    sprite.center.set(side > 0 ? 0 : 1, 0.5);
    anchor.add(sprite);

    return {
      meta, anchor, leader, dot, sprite, side, key: meta.key, zSpread,
    };
  });

  function setVisible(v) {
    root.visible = v;
  }

  function syncToLayers(layerHeights) {
    items.forEach((item) => {
      const y = layerHeights[item.key] ?? 0;
      item.anchor.position.y = y;
      item.anchor.position.z = item.zSpread;
    });
  }

  function setBoardStyle(boardWhite) {
    root.traverse((obj) => {
      if (obj.isLine && obj.material) {
        obj.material.color.set(boardWhite ? 0x1a221e : 0x8a938c);
        obj.material.opacity = boardWhite ? 0.95 : 0.88;
      }
      if (obj.isMesh && obj.geometry?.type === 'SphereGeometry' && obj.material?.isMeshBasicMaterial) {
        obj.material.color.set(boardWhite ? 0x2f6f5e : 0xc4a35a);
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

  function render() {}
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
