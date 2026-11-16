import * as THREE from 'three';

export const VIEW_PRESETS = {
  aerial: {
    label: '鸟瞰全景',
    position: new THREE.Vector3(38, 32, 42),
    target: new THREE.Vector3(0, 6, 0),
  },
  human: {
    label: '人视仰拍',
    position: new THREE.Vector3(8, 1.7, 28),
    target: new THREE.Vector3(0, 10, 0),
  },
  atrium: {
    label: '中庭室内光影',
    position: new THREE.Vector3(1.2, 6.8, 7.2),
    target: new THREE.Vector3(-0.5, 4.2, -1.5),
  },
  explode: {
    label: '结构爆炸图',
    position: new THREE.Vector3(52, 36, 46),
    target: new THREE.Vector3(0, 16, 0),
  },
  wireframe: {
    label: '白模线框分析模式',
    position: new THREE.Vector3(-32, 22, 36),
    target: new THREE.Vector3(0, 8, 0),
  },
};

export function createViewController(camera, controls) {
  const state = {
    current: 'aerial',
    animating: false,
    fromPos: new THREE.Vector3(),
    toPos: new THREE.Vector3(),
    fromTarget: new THREE.Vector3(),
    toTarget: new THREE.Vector3(),
    t: 1,
  };

  function setView(key, instant = false) {
    const preset = VIEW_PRESETS[key];
    if (!preset) return;
    state.current = key;
    state.fromPos.copy(camera.position);
    state.fromTarget.copy(controls.target);
    state.toPos.copy(preset.position);
    state.toTarget.copy(preset.target);
    state.t = instant ? 1 : 0;
    state.animating = !instant;
    if (instant) {
      camera.position.copy(state.toPos);
      controls.target.copy(state.toTarget);
      controls.update();
    }
  }

  function update(dt = 1 / 60) {
    if (!state.animating) return state.current;
    state.t = Math.min(1, state.t + dt * 1.2);
    const e = easeInOutCubic(state.t);
    camera.position.lerpVectors(state.fromPos, state.toPos, e);
    controls.target.lerpVectors(state.fromTarget, state.toTarget, e);
    controls.update();
    if (state.t >= 1) state.animating = false;
    return state.current;
  }

  return {
    setView,
    update,
    get current() {
      return state.current;
    },
  };
}

function easeInOutCubic(t) {
  return t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2;
}
