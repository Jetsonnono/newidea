import * as THREE from 'three';

/**
 * Export a 4K PNG with transparent or pure white background.
 */
export async function exportScreenshot(renderer, scene, camera, { transparent = false } = {}) {
  const width = 3840;
  const height = 2160;

  const prevSize = new THREE.Vector2();
  renderer.getSize(prevSize);
  const prevPixelRatio = renderer.getPixelRatio();
  const prevClear = renderer.getClearColor(new THREE.Color());
  const prevAlpha = renderer.getClearAlpha();
  const prevBackground = scene.background;
  const prevEnvHidden = [];

  // Hide sky/ground helpers that break transparency / white plate
  scene.traverse((obj) => {
    if (obj.userData?.hideOnExport) {
      prevEnvHidden.push({ obj, visible: obj.visible });
      obj.visible = false;
    }
  });

  if (transparent) {
    scene.background = null;
    renderer.setClearColor(0x000000, 0);
  } else {
    scene.background = new THREE.Color(0xffffff);
    renderer.setClearColor(0xffffff, 1);
  }

  renderer.setPixelRatio(1);
  renderer.setSize(width, height, false);
  renderer.render(scene, camera);

  const dataURL = renderer.domElement.toDataURL('image/png');

  // Restore
  prevEnvHidden.forEach(({ obj, visible }) => {
    obj.visible = visible;
  });
  scene.background = prevBackground;
  renderer.setClearColor(prevClear, prevAlpha);
  renderer.setPixelRatio(prevPixelRatio);
  renderer.setSize(prevSize.x, prevSize.y, false);

  downloadDataURL(dataURL, transparent ? 'helio-matrix-4k-transparent.png' : 'helio-matrix-4k-white.png');
}

function downloadDataURL(dataURL, filename) {
  const a = document.createElement('a');
  a.href = dataURL;
  a.download = filename;
  a.click();
}
