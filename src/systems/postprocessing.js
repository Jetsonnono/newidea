import * as THREE from 'three';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
import { SSAOPass } from 'three/examples/jsm/postprocessing/SSAOPass.js';
import { OutputPass } from 'three/examples/jsm/postprocessing/OutputPass.js';

/**
 * Film-grade stack: render → SSAO → bloom → ACES output.
 */
export function createPostProcessing(renderer, scene, camera) {
  const size = new THREE.Vector2();
  renderer.getSize(size);

  const composer = new EffectComposer(renderer);
  composer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  composer.setSize(size.x, size.y);

  const renderPass = new RenderPass(scene, camera);
  composer.addPass(renderPass);

  const ssaoPass = new SSAOPass(scene, camera, size.x, size.y);
  ssaoPass.kernelRadius = 8;
  ssaoPass.minDistance = 0.003;
  ssaoPass.maxDistance = 0.06;
  ssaoPass.output = SSAOPass.OUTPUT.Default;
  composer.addPass(ssaoPass);

  // Brief targets strength 0.35 / threshold 0.85; slightly softened so
  // white concrete + transmission glass stay legible under ACES.
  const bloomPass = new UnrealBloomPass(
    new THREE.Vector2(size.x, size.y),
    0.28,
    0.38,
    0.87
  );
  composer.addPass(bloomPass);

  const outputPass = new OutputPass();
  composer.addPass(outputPass);

  function setSize(w, h) {
    composer.setSize(w, h);
    ssaoPass.setSize(w, h);
    bloomPass.setSize(w, h);
  }

  function setEnabled(enabled) {
    // Keep render+output always; toggle enhancement passes
    ssaoPass.enabled = enabled;
    bloomPass.enabled = enabled;
  }

  return {
    composer,
    renderPass,
    ssaoPass,
    bloomPass,
    setSize,
    setEnabled,
    render() {
      composer.render();
    },
  };
}
