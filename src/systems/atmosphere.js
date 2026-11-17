import * as THREE from 'three';
import { Sky } from 'three/examples/jsm/objects/Sky.js';

/**
 * High-altitude clear azure sky (#1e5aa8 → #a8d0f0) via Sky + PMREM.
 */
export function createAtmosphere(renderer, scene) {
  const sky = new Sky();
  sky.scale.setScalar(450);

  const skyUniforms = sky.material.uniforms;
  // Crisp high-altitude blue — low turbidity, strong Rayleigh
  skyUniforms.turbidity.value = 1.4;
  skyUniforms.rayleigh.value = 2.6;
  skyUniforms.mieCoefficient.value = 0.0025;
  skyUniforms.mieDirectionalG.value = 0.85;

  const pmrem = new THREE.PMREMGenerator(renderer);
  pmrem.compileEquirectangularShader();

  const skyScene = new THREE.Scene();
  skyScene.add(sky);

  // Soft zenith→horizon color wash as fallback / fill
  const hemi = new THREE.HemisphereLight(0x1e5aa8, 0xa8d0f0, 0.35);
  scene.add(hemi);

  const state = {
    sky,
    skyScene,
    pmrem,
    envRT: null,
    lastSun: new THREE.Vector3(1e9, 0, 0),
    dirty: true,
    hemi,
  };

  function setSunPosition(sunPos) {
    skyUniforms['sunPosition'].value.copy(sunPos);
    if (state.lastSun.distanceToSquared(sunPos) > 9 || state.dirty) {
      state.lastSun.copy(sunPos);
      state.dirty = true;
    }
  }

  function updateEnvironment(force = false) {
    if (!state.dirty && !force) return;
    state.dirty = false;
    if (state.envRT) state.envRT.dispose();
    state.envRT = pmrem.fromScene(skyScene, 0.01);
    scene.environment = state.envRT.texture;
    scene.environmentIntensity = 0.42;
    scene.background = state.envRT.texture;
    scene.backgroundIntensity = 0.95;
    scene.backgroundBlurriness = 0.04;
  }

  setSunPosition(new THREE.Vector3(40, 70, 25));
  updateEnvironment(true);

  return {
    sky,
    setSunPosition,
    updateEnvironment,
    dispose() {
      if (state.envRT) state.envRT.dispose();
      pmrem.dispose();
    },
  };
}
