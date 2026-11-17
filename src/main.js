import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import './style.css';
import { createMaterials } from './materials.js';
import {
  createBuilding,
  setExplodedView,
  getExhibitionLayerHeights,
} from './architecture/building.js';
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
import { createCalloutSystem } from './systems/callouts.js';
import { createHeatmapController } from './systems/heatmap.js';
import { createClayWireframeController } from './systems/clayWireframe.js';
import { computePowerKW, PEAK_KW } from './systems/power.js';
import { createViewController } from './systems/views.js';
import { exportScreenshot } from './systems/screenshot.js';
import { bindPanel } from './ui/panel.js';

const canvas = document.getElementById('scene-canvas');
const appEl = document.getElementById('app');

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
camera.position.set(36, 18, 38);

const controls = new OrbitControls(camera, canvas);
controls.target.set(0, 5, 2);
controls.enableDamping = true;
controls.dampingFactor = 0.06;
controls.maxPolarAngle = Math.PI * 0.49;
controls.minDistance = 3;
controls.maxDistance = 140;
controls.update();

const materials = createMaterials();
const env = createEnvironment(scene, materials);
const atmosphere = createAtmosphere(renderer, scene);
const sunRig = createSunRig(scene);
const building = createBuilding(materials);
scene.add(building);

const post = createPostProcessing(renderer, scene, camera);
const callouts = createCalloutSystem(scene);
const heatmap = createHeatmapController(building);
const clay = createClayWireframeController(building);

const viewController = createViewController(camera, controls);
viewController.setView('aerial', true);

const state = {
  minutes: 720,
  explodeAmount: 0,
  explodeTarget: 0,
  mode: 'aerial',
  boardWhite: false,
  alignment: 0.8,
  envFrame: 0,
  prevEnvVisible: true,
};

function setEnvironmentVisible(visible) {
  if (env?.group) env.group.visible = visible;
  if (sunRig?.sunOrb) sunRig.sunOrb.visible = visible;
  if (visible) {
    if (!scene.fog) scene.fog = new THREE.FogExp2(0xd8e2ec, 0.0006);
  } else {
    scene.fog = null;
  }
}

function applyBoardPresentation(enabled) {
  state.boardWhite = enabled;
  appEl.classList.toggle('board-mode', enabled && state.mode === 'explode');
  callouts.setBoardStyle(enabled);

  if (enabled && state.mode === 'explode') {
    setEnvironmentVisible(false);
    scene.background = new THREE.Color(0xffffff);
    scene.backgroundIntensity = 1;
    scene.environmentIntensity = 0.35;
    post.setEnabled(false);
    renderer.toneMappingExposure = 1.05;
  } else if (state.mode !== 'wireframe' && state.mode !== 'heatmap') {
    setEnvironmentVisible(true);
    atmosphere.updateEnvironment(true);
    post.setEnabled(true);
  }
}

function clearAnalysisModes() {
  heatmap.disable();
  clay.disable();
  callouts.setVisible(false);
  appEl.classList.remove('board-mode');
}

function enterMode(mode) {
  const prev = state.mode;
  state.mode = mode;
  clearAnalysisModes();

  // Default presentation restore
  setEnvironmentVisible(true);
  post.setEnabled(true);

  if (mode === 'explode') {
    state.explodeTarget = 1;
    callouts.setVisible(true);
    applyBoardPresentation(ui.isBoardWhite());
  } else {
    state.explodeTarget = 0;
    if (prev === 'explode' && !ui.isBoardWhite()) {
      atmosphere.updateEnvironment(true);
    }
  }

  if (mode === 'heatmap') {
    heatmap.enable();
    post.setEnabled(true);
    // Keep sky readable behind heat colors
    scene.backgroundIntensity = 0.45;
  }

  if (mode === 'wireframe') {
    clay.enable();
    post.setEnabled(false);
    setEnvironmentVisible(true);
    scene.background = new THREE.Color(0xd8ddd6);
    scene.backgroundIntensity = 1;
    scene.fog = new THREE.FogExp2(0xd8e2ec, 0.0006);
  } else if (mode !== 'explode' || !ui.isBoardWhite()) {
    atmosphere.updateEnvironment(true);
  }

  viewController.setView(mode);
}

const ui = bindPanel({
  onTimeChange(minutes) {
    state.minutes = minutes;
  },
  onViewChange(view) {
    enterMode(view);
  },
  onBoardWhiteChange(checked) {
    if (state.mode === 'explode') applyBoardPresentation(checked);
    else state.boardWhite = checked;
  },
  async onExport({ transparent, board }) {
    const wantBoard = !!board || (state.mode === 'explode' && ui.isBoardWhite());
    ui.setPanelVisible(false);

    const prevBoard = state.boardWhite;
    if (wantBoard && state.mode !== 'explode') {
      // Temporarily jump to explode board for export
      enterMode('explode');
      ui.setBoardWhite(true);
      applyBoardPresentation(true);
      // Wait for explode animation to settle
      for (let i = 0; i < 45; i += 1) {
        state.explodeAmount = THREE.MathUtils.lerp(state.explodeAmount, 1, 0.18);
        setExplodedView(building, state.explodeAmount);
        callouts.syncToLayers(getExhibitionLayerHeights(building, state.explodeAmount));
        await new Promise((r) => requestAnimationFrame(r));
      }
    } else {
      await new Promise((r) =>
        requestAnimationFrame(() => requestAnimationFrame(r))
      );
    }

    await exportScreenshot(renderer, scene, camera, {
      transparent: transparent && !wantBoard,
      composer: wantBoard || state.mode === 'wireframe' ? null : post.composer,
      onResizeComposer: post.setSize,
      forceWhite: wantBoard,
    });

    ui.setPanelVisible(true);
    if (wantBoard && !prevBoard && state.mode === 'explode') {
      // keep board if user had it on via checkbox during export-board from other mode
    }
  },
});

state.minutes = ui.getMinutes();

function syncSunAndSystems() {
  const sunState = computeSunState(state.minutes);
  applySunToRig(sunRig, sunState);

  atmosphere.setSunPosition(sunState.position);
  state.envFrame += 1;
  if (
    state.envFrame % 20 === 0 &&
    state.mode !== 'wireframe' &&
    !(state.mode === 'explode' && state.boardWhite)
  ) {
    atmosphere.updateEnvironment();
  }

  const alignment = updatePetalTracking(
    building.userData.parts.petals,
    sunState.direction
  );
  state.alignment = alignment;

  if (state.mode !== 'heatmap' && state.mode !== 'wireframe') {
    updateCaustics(
      building.userData.parts.atrium,
      sunState.direction,
      sunState.irradiance
    );
  }

  if (heatmap.active) {
    heatmap.update(sunState.direction, sunState.irradiance, alignment);
  }

  const kw = computePowerKW(sunState.irradiance, alignment);
  ui.updatePower(kw, alignment, PEAK_KW);

  if (scene.fog && state.mode !== 'wireframe' && !(state.boardWhite && state.mode === 'explode')) {
    // Clear highland air — low density so Kunlun ridges stay readable
    scene.fog.color.setHSL(0.58, 0.18, 0.88 + sunState.irradiance * 0.03);
    scene.fog.density = 0.0006;
  }

  if (!(state.boardWhite && state.mode === 'explode') && state.mode !== 'wireframe') {
    renderer.toneMappingExposure = 0.72 + sunState.irradiance * 0.14;
    if (scene.backgroundIntensity !== undefined && state.mode !== 'heatmap') {
      scene.backgroundIntensity = 0.55 + sunState.irradiance * 0.2;
    }
    if (scene.environmentIntensity !== undefined) {
      scene.environmentIntensity = 0.4 + sunState.irradiance * 0.15;
    }
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
  callouts.setSize(w, h);
}
window.addEventListener('resize', onResize);

const clock = new THREE.Clock();

function animate() {
  requestAnimationFrame(animate);
  const dt = Math.min(clock.getDelta(), 0.05);

  viewController.update(dt);

  state.explodeAmount = THREE.MathUtils.lerp(
    state.explodeAmount,
    state.explodeTarget,
    1 - Math.pow(0.0008, dt)
  );
  setExplodedView(building, state.explodeAmount);

  if (state.mode === 'explode') {
    callouts.syncToLayers(getExhibitionLayerHeights(building, state.explodeAmount));
  }

  syncSunAndSystems();
  controls.update();

  if (state.mode === 'wireframe' || (state.mode === 'explode' && state.boardWhite)) {
    renderer.render(scene, camera);
  } else {
    post.render();
  }
  callouts.render();
}

syncSunAndSystems();
atmosphere.updateEnvironment(true);
animate();

window.HelioMatrix = {
  scene,
  camera,
  building,
  materials,
  post,
  atmosphere,
  heatmap,
  clay,
  callouts,
};
