import * as THREE from 'three';
import { Sky } from 'three/examples/jsm/objects/Sky.js';

/**
 * High-altitude clear-sky environment via Sky shader + PMREM.
 * Sky is baked to an env/background map (not left as a raw HDR mesh in-scene)
 * so architectural materials stay readable under ACES + bloom.
 */
export function createAtmosphere(renderer, scene) {
  const sky = new Sky();
  sky.scale.setScalar(450);

  const skyUniforms = sky.material.uniforms;
  // Highland: low turbidity, crisp blue
  skyUniforms.turbidity.value = 2.2;
  skyUniforms.rayleigh.value = 1.8;
  skyUniforms.mieCoefficient.value = 0.004;
  skyUniforms.mieDirectionalG.value = 0.8;

  const pmrem = new THREE.PMREMGenerator(renderer);
  pmrem.compileEquirectangularShader();

  // Staging scene used only for env capture
  const skyScene = new THREE.Scene();
  skyScene.add(sky);

  const state = {
    sky,
    skyScene,
    pmrem,
    envRT: null,
    lastSun: new THREE.Vector3(1e9, 0, 0),
    dirty: true,
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
    scene.environmentIntensity = 0.48;
    // Use baked map as background — controllable brightness via intensity
    scene.background = state.envRT.texture;
    scene.backgroundIntensity = 0.72;
    scene.backgroundBlurriness = 0.08;
  }

  setSunPosition(new THREE.Vector3(40, 60, 20));
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
