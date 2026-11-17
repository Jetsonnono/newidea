import * as THREE from 'three';

const HEAT_VERT = /* glsl */ `
  varying vec3 vWorldNormal;
  void main() {
    vWorldNormal = normalize(mat3(modelMatrix) * normal);
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const HEAT_FRAG = /* glsl */ `
  uniform vec3 uSunDir;
  uniform float uIrradiance;
  varying vec3 vWorldNormal;

  vec3 heatRamp(float t) {
    // deep blue → emerald → yellow → peak red
    vec3 c0 = vec3(0.118, 0.227, 0.541); // #1e3a8a
    vec3 c1 = vec3(0.063, 0.725, 0.506); // #10b981
    vec3 c2 = vec3(0.980, 0.800, 0.082); // #facc15
    vec3 c3 = vec3(0.937, 0.267, 0.267); // #ef4444
    float x = clamp(t, 0.0, 1.0);
    if (x < 0.33) return mix(c0, c1, x / 0.33);
    if (x < 0.66) return mix(c1, c2, (x - 0.33) / 0.33);
    return mix(c2, c3, (x - 0.66) / 0.34);
  }

  void main() {
    vec3 n = normalize(vWorldNormal);
    // Double-sided facing
    float ndl = abs(dot(n, normalize(uSunDir)));
    float flux = ndl * uIrradiance; // 0..1 proxy → map to 0..1200 later in UI
    vec3 col = heatRamp(flux);
    gl_FragColor = vec4(col, 1.0);
  }
`;

/**
 * Solar irradiance heatmap for petals + BIPV glass.
 */
export function createHeatmapController(building) {
  const state = {
    active: false,
    backups: [],
    sunDir: new THREE.Vector3(0, 1, 0),
    irradiance: 1,
    avgCos: 0.96,
  };

  const sharedUniforms = {
    uSunDir: { value: state.sunDir.clone() },
    uIrradiance: { value: 1 },
  };

  function makeHeatMat() {
    return new THREE.ShaderMaterial({
      uniforms: {
        uSunDir: sharedUniforms.uSunDir,
        uIrradiance: sharedUniforms.uIrradiance,
      },
      vertexShader: HEAT_VERT,
      fragmentShader: HEAT_FRAG,
      side: THREE.DoubleSide,
      name: 'irradianceHeat',
    });
  }

  function collectTargets() {
    const targets = [];
    const petals = building.userData.parts.petals;
    const layers = building.userData.parts.layers;
    const glassLayer = layers.glass?.[0] || layers.atriumGlass?.[0];

    const visit = (root, kind) => {
      if (!root) return;
      root.traverse((obj) => {
        if (!obj.isMesh || !obj.material) return;
        if (obj.userData?.isEdgeHelper) return;
        if (obj.name === 'CausticsOverlay' || obj.parent?.name === 'CausticSpots') return;
        const mat = Array.isArray(obj.material) ? obj.material[0] : obj.material;
        const name = mat?.name || '';
        // Only photovoltaic surfaces (petals + BIPV glass)
        if (kind === 'petal' && name !== 'petalBody') return;
        if (kind === 'glass' && name !== 'bipvGlass' && obj.name !== 'BIPVShell') return;
        targets.push({ mesh: obj, kind });
      });
    };

    visit(petals, 'petal');
    visit(glassLayer, 'glass');
    return targets;
  }

  function enable() {
    if (state.active) return;
    state.active = true;
    state.backups = [];
    collectTargets().forEach(({ mesh }) => {
      state.backups.push({ mesh, material: mesh.material });
      const heat = makeHeatMat();
      // Preserve original for double-sided glass etc.
      mesh.material = heat;
      mesh.userData._heatMat = heat;
    });
    const legend = document.getElementById('heatmap-legend');
    if (legend) legend.hidden = false;
  }

  function disable() {
    if (!state.active) return;
    state.active = false;
    state.backups.forEach(({ mesh, material }) => {
      if (mesh.userData._heatMat) {
        mesh.userData._heatMat.dispose();
        delete mesh.userData._heatMat;
      }
      mesh.material = material;
    });
    state.backups = [];
    const legend = document.getElementById('heatmap-legend');
    if (legend) legend.hidden = true;
  }

  function update(sunDirection, irradiance, petalAlignment) {
    state.sunDir.copy(sunDirection).normalize();
    state.irradiance = irradiance;
    sharedUniforms.uSunDir.value.copy(state.sunDir);
    sharedUniforms.uIrradiance.value = THREE.MathUtils.clamp(irradiance, 0.05, 1);

    // Tracking capture efficiency — keep ≥96% when aligned
    const eff = THREE.MathUtils.clamp(0.92 + petalAlignment * 0.08, 0.96, 0.995);
    state.avgCos = eff;

    const avgEl = document.getElementById('heatmap-efficiency');
    const fluxEl = document.getElementById('heatmap-flux');
    if (avgEl) avgEl.textContent = `${(eff * 100).toFixed(1)}%`;
    if (fluxEl) {
      const wm2 = Math.round(irradiance * eff * 1200);
      fluxEl.textContent = `${wm2} W/m²`;
    }
  }

  return {
    enable,
    disable,
    update,
    get active() {
      return state.active;
    },
  };
}
