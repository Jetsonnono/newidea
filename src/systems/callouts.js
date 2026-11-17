import * as THREE from 'three';

export const EXPLODE_LABELS = [
  {
    key: 'petals',
    code: '01',
    title: '24片向日葵仿生钙钛矿追光花瓣阵列',
    en: 'Sunflower Perovskite Tracking Petals ×24',
  },
  {
    key: 'glass',
    code: '02',
    title: '彩色半透明钙钛矿 BIPV 发电玻璃幕墙',
    en: 'Chromatic Translucent Perovskite BIPV',
  },
  {
    key: 'steel',
    code: '03',
    title: '参数化空间三角网格钢结构网壳 (Diagrid)',
    en: 'Parametric Spatial Diagrid Shell',
  },
  {
    key: 'program',
    code: '04',
    title: '零碳科研中庭、储能微网与 V2G 双向充放电系统',
    en: 'Zero-Carbon Atrium · BESS · V2G Hub',
  },
  {
    key: 'foundation',
    code: '05',
    title: '高原覆土超低能耗保温混凝土退台基座',
    en: 'Plateau Earth-Sheltered Concrete Base',
  },
];

function makeLabelSprite(meta, boardWhite = false) {
  const canvas = document.createElement('canvas');
  canvas.width = 1408;
  canvas.height = 280;
  const ctx = canvas.getContext('2d');
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Panel
  ctx.fillStyle = boardWhite ? 'rgba(255,255,255,0.96)' : 'rgba(14,22,18,0.86)';
  roundRect(ctx, 24, 24, 1360, 232, 14);
  ctx.fill();

  // Accent bar
  ctx.fillStyle = boardWhite ? '#2f6f5e' : '#c4a35a';
  ctx.fillRect(24, 24, 10, 232);

  ctx.fillStyle = boardWhite ? 'rgba(26,34,28,0.55)' : 'rgba(242,239,230,0.65)';
  ctx.font = '600 40px Syne, "Noto Sans SC", sans-serif';
  ctx.fillText(meta.code, 56, 90);

  ctx.fillStyle = boardWhite ? '#132018' : '#f2efe6';
  ctx.font = '600 42px "IBM Plex Sans", "Noto Sans SC", sans-serif';
  // Wrap long Chinese titles
  const title = meta.title;
  if (title.length > 22) {
    ctx.font = '600 34px "IBM Plex Sans", "Noto Sans SC", sans-serif';
    ctx.fillText(title.slice(0, 18), 56, 148);
    ctx.fillText(title.slice(18), 56, 190);
    ctx.fillStyle = boardWhite ? 'rgba(19,32,24,0.5)' : 'rgba(242,239,230,0.5)';
    ctx.font = '500 24px "IBM Plex Sans", sans-serif';
    ctx.fillText(meta.en.toUpperCase(), 56, 232);
  } else {
    ctx.fillText(title, 56, 155);
    ctx.fillStyle = boardWhite ? 'rgba(19,32,24,0.5)' : 'rgba(242,239,230,0.5)';
    ctx.font = '500 26px "IBM Plex Sans", sans-serif';
    ctx.fillText(meta.en.toUpperCase(), 56, 210);
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
  sprite.scale.set(16, 3.2, 1);
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
 * Museum-board callouts: horizontal leader lines + dot anchors + sprites.
 */
export function createCalloutSystem(scene) {
  const root = new THREE.Group();
  root.name = 'ExplodeCallouts';
  root.visible = false;
  scene.add(root);

  const lineMat = new THREE.LineBasicMaterial({
    color: 0x8a938c,
    transparent: true,
    opacity: 0.85,
    depthTest: false,
  });

  const items = EXPLODE_LABELS.map((meta, i) => {
    // All labels on the right with fine horizontal leaders
    const x = 26 + (i % 2) * 1.5;
    const z = -10 + i * 4.2;

    const anchor = new THREE.Group();
    anchor.position.set(x, 0, z);
    root.add(anchor);

    // Dot at building-side anchor
    const dot = new THREE.Mesh(
      new THREE.SphereGeometry(0.22, 12, 10),
      new THREE.MeshBasicMaterial({ color: 0xc4a35a, depthTest: false })
    );
    dot.position.set(-14, 0, 0);
    dot.renderOrder = 11;
    anchor.add(dot);

    // Fine horizontal leader: building → label
    const leaderGeo = new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(-14, 0, 0),
      new THREE.Vector3(-1.2, 0, 0),
    ]);
    const leader = new THREE.Line(leaderGeo, lineMat.clone());
    leader.frustumCulled = false;
    leader.renderOrder = 10;
    anchor.add(leader);

    // Small elbow tick
    const tickGeo = new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(-1.2, -0.35, 0),
      new THREE.Vector3(-1.2, 0.35, 0),
    ]);
    const tick = new THREE.Line(tickGeo, lineMat.clone());
    tick.frustumCulled = false;
    anchor.add(tick);

    const sprite = makeLabelSprite(meta, false);
    sprite.position.set(0.4, 0, 0);
    sprite.center.set(0, 0.5);
    anchor.add(sprite);

    return { meta, anchor, leader, tick, dot, sprite, key: meta.key };
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
        obj.material.color.set(boardWhite ? 0x1a221e : 0x8a938c);
        obj.material.opacity = boardWhite ? 0.95 : 0.85;
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
