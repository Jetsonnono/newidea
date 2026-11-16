import * as THREE from 'three';

/**
 * Export a 4K PNG with transparent or pure white background.
 * Uses EffectComposer when provided so bloom/SSAO are baked in.
 */
export async function exportScreenshot(
  renderer,
  scene,
  camera,
  { transparent = false, composer = null, onResizeComposer = null } = {}
) {
  const width = 3840;
  const height = 2160;

  const prevSize = new THREE.Vector2();
  renderer.getSize(prevSize);
  const prevPixelRatio = renderer.getPixelRatio();
  const prevClear = renderer.getClearColor(new THREE.Color());
  const prevAlpha = renderer.getClearAlpha();
  const prevBackground = scene.background;
  const prevEnvHidden = [];
  const prevFog = scene.fog;

  scene.traverse((obj) => {
    if (obj.userData?.hideOnExport) {
      prevEnvHidden.push({ obj, visible: obj.visible });
      obj.visible = false;
    }
  });

  if (transparent) {
    scene.background = null;
    scene.fog = null;
    renderer.setClearColor(0x000000, 0);
  } else {
    scene.background = new THREE.Color(0xffffff);
    scene.fog = null;
    renderer.setClearColor(0xffffff, 1);
  }

  renderer.setPixelRatio(1);
  renderer.setSize(width, height, false);
  if (onResizeComposer) onResizeComposer(width, height);

  if (composer && !transparent) {
    composer.render();
  } else {
    // Transparent export: skip bloom (it needs opaque clear)
    renderer.render(scene, camera);
  }

  const dataURL = renderer.domElement.toDataURL('image/png');

  prevEnvHidden.forEach(({ obj, visible }) => {
    obj.visible = visible;
  });
  scene.background = prevBackground;
  scene.fog = prevFog;
  renderer.setClearColor(prevClear, prevAlpha);
  renderer.setPixelRatio(prevPixelRatio);
  renderer.setSize(prevSize.x, prevSize.y, false);
  if (onResizeComposer) onResizeComposer(prevSize.x, prevSize.y);

  downloadDataURL(
    dataURL,
    transparent ? 'helio-matrix-4k-transparent.png' : 'helio-matrix-4k-white.png'
  );
}

function downloadDataURL(dataURL, filename) {
  const a = document.createElement('a');
  a.href = dataURL;
  a.download = filename;
  a.click();
}
