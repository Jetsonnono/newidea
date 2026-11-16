import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import './style.css';
import { createMaterials, setWireframeMode } from './materials.js';
import { createBuilding, setExplodedView } from './architecture/building.js';
import { updatePetalTracking } from './architecture/petals.js';
import { updateCaustics } from './architecture/atrium.js';
import { createEnvironment } from './environment.js';
import {
  computeSunState,
  createSunRig,
  applySunToRig,
} from './systems/sun.js';
import { createAtmosphere } from './systems/atmosphere.js';
import { createPostProcessing } from './systems/postprocessing.js';
import { computePowerKW, PEAK_KW } from './systems/power.js';
import { createViewController } from './systems/views.js';
import { exportScreenshot } from './systems/screenshot.js';
import { bindPanel } from './ui/panel.js';

const canvas = document.getElementById('scene-canvas');

const renderer = new THREE.WebGLRenderer({
  canvas,
  antialias: true,
  alpha: true,
  preserveDrawingBuffer: true,
  powerPreference: 'high-performance',
});
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 0.92;
renderer.outputColorSpace = THREE.SRGBColorSpace;

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(
  42,
  window.innerWidth / window.innerHeight,
  0.1,
  500
);
camera.position.set(28, 26, 32);

const controls = new OrbitControls(camera, canvas);
controls.target.set(0, 5, 0);
controls.enableDamping = true;
controls.dampingFactor = 0.06;
controls.maxPolarAngle = Math.PI * 0.49;
controls.minDistance = 3;
controls.maxDistance = 120;
controls.update();

const materials = createMaterials();
const env = createEnvironment(scene, materials);
const atmosphere = createAtmosphere(renderer, scene);
const sunRig = createSunRig(scene);
const building = createBuilding(materials);
scene.add(building);

const post = createPostProcessing(renderer, scene, camera);

const viewController = createViewController(camera, controls);
viewController.setView('aerial', true);

const state = {
  minutes: 720,
  explodeAmount: 0,
  wireframe: false,
  alignment: 0.8,
  envFrame: 0,
};

const ui = bindPanel({
  onTimeChange(minutes) {
    state.minutes = minutes;
  },
  onViewChange(view) {
    viewController.setView(view);
    state.wireframe = view === 'wireframe';
    setWireframeMode(building, materials, state.wireframe);
    // Soften bloom/SSAO in analytic wireframe mode
    post.setEnabled(!state.wireframe);
    if (state.wireframe) {
      scene.background = new THREE.Color(0x1e2622);
      scene.backgroundIntensity = 1;
    } else {
      atmosphere.updateEnvironment(true);
    }
    state.explodeTarget = view === 'explode' ? 1 : 0;
  },
  async onExport({ transparent }) {
    ui.setPanelVisible(false);
    await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
    await exportScreenshot(renderer, scene, camera, {
      transparent,
      composer: post.composer,
      onResizeComposer: post.setSize,
    });
    ui.setPanelVisible(true);
  },
});

state.explodeTarget = 0;
state.minutes = ui.getMinutes();

function syncSunAndSystems() {
  const sunState = computeSunState(state.minutes);
  applySunToRig(sunRig, sunState);

  atmosphere.setSunPosition(sunState.position);
  // Rebuild env map every ~20 frames or when sun jumps
  state.envFrame += 1;
  if (state.envFrame % 20 === 0) {
    atmosphere.updateEnvironment();
  }

  const alignment = updatePetalTracking(
    building.userData.parts.petals,
    sunState.direction
  );
  state.alignment = alignment;

  updateCaustics(
    building.userData.parts.atrium,
    sunState.direction,
    sunState.irradiance
  );

  const kw = computePowerKW(sunState.irradiance, alignment);
  ui.updatePower(kw, alignment, PEAK_KW);

  if (scene.fog) {
    scene.fog.color.setHSL(0.55, 0.1, 0.55 + sunState.irradiance * 0.08);
    scene.fog.density = state.wireframe ? 0.004 : 0.001;
  }

  // Exposure breathes with irradiance; stay conservative under ACES + bloom
  renderer.toneMappingExposure = 0.72 + sunState.irradiance * 0.14;
  if (scene.backgroundIntensity !== undefined) {
    scene.backgroundIntensity = 0.55 + sunState.irradiance * 0.2;
  }
  if (scene.environmentIntensity !== undefined) {
    scene.environmentIntensity = 0.4 + sunState.irradiance * 0.15;
  }

  return sunState;
}

function onResize() {
  const w = window.innerWidth;
  const h = window.innerHeight;
  camera.aspect = w / h;
  camera.updateProjectionMatrix();
  renderer.setSize(w, h);
  post.setSize(w, h);
}
window.addEventListener('resize', onResize);

const clock = new THREE.Clock();

function animate() {
  requestAnimationFrame(animate);
  const dt = Math.min(clock.getDelta(), 0.05);

  viewController.update(dt);

  state.explodeAmount = THREE.MathUtils.lerp(
    state.explodeAmount,
    state.explodeTarget ?? 0,
    1 - Math.pow(0.001, dt)
  );
  setExplodedView(building, state.explodeAmount);

  syncSunAndSystems();
  controls.update();
  post.render();
}

syncSunAndSystems();
atmosphere.updateEnvironment(true);
animate();

window.HelioMatrix = { scene, camera, building, materials, post, atmosphere };
