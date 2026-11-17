import * as THREE from 'three';

/** Hash → 0..1 */
export function hash2(x, y) {
  const s = Math.sin(x * 127.1 + y * 311.7) * 43758.5453;
  return s - Math.floor(s);
}

/** Value noise */
export function valueNoise(x, y) {
  const x0 = Math.floor(x);
  const y0 = Math.floor(y);
  const fx = x - x0;
  const fy = y - y0;
  const ux = fx * fx * (3 - 2 * fx);
  const uy = fy * fy * (3 - 2 * fy);
  const a = hash2(x0, y0);
  const b = hash2(x0 + 1, y0);
  const c = hash2(x0, y0 + 1);
  const d = hash2(x0 + 1, y0 + 1);
  return THREE.MathUtils.lerp(
    THREE.MathUtils.lerp(a, b, ux),
    THREE.MathUtils.lerp(c, d, ux),
    uy
  );
}

export function fbm(x, y, octaves = 4) {
  let amp = 0.5;
  let freq = 1;
  let sum = 0;
  let norm = 0;
  for (let i = 0; i < octaves; i += 1) {
    sum += valueNoise(x * freq, y * freq) * amp;
    norm += amp;
    amp *= 0.5;
    freq *= 2.05;
  }
  return sum / norm;
}

/**
 * Organic closed footprint — teardrop / kidney for terrace tiers.
 * scaleX/Z in meters, lobe controls asymmetry.
 */
export function createOrganicShape(scaleX, scaleZ, lobe = 0.18, samples = 72) {
  const shape = new THREE.Shape();
  for (let i = 0; i <= samples; i += 1) {
    const t = (i / samples) * Math.PI * 2;
    // Superellipse-ish with soft south bulge + west indent
    const r =
      1 +
      lobe * Math.cos(t) +
      lobe * 0.55 * Math.cos(2 * t + 0.4) -
      lobe * 0.35 * Math.sin(3 * t);
    const x = Math.cos(t) * scaleX * 0.5 * r;
    const y = Math.sin(t) * scaleZ * 0.5 * (r * 0.92 + 0.08 * Math.cos(t));
    if (i === 0) shape.moveTo(x, y);
    else shape.lineTo(x, y);
  }
  return shape;
}

export function extrudeOrganicSlab(scaleX, scaleZ, height, lobe, materials, bevel = 0.22) {
  const shape = createOrganicShape(scaleX, scaleZ, lobe, 96);
  const geo = new THREE.ExtrudeGeometry(shape, {
    depth: height,
    bevelEnabled: true,
    bevelThickness: bevel,
    bevelSize: bevel * 0.95,
    bevelSegments: 6,
    curveSegments: 96,
  });
  geo.rotateX(-Math.PI / 2);
  // Center vertically so top sits near height
  geo.translate(0, height / 2, 0);
  const mesh = new THREE.Mesh(geo, materials);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  return mesh;
}

/**
 * Parametric twisted airfoil / leaf petal.
 * Length along +Z from base to tip; width along X; thickness Y.
 */
export function createTwistedLeafGeometry({
  length = 6.5,
  width = 2.4,
  thickness = 0.08,
  camber = 0.45,
  twist = 0.55,
  tipDroop = 0.55,
  segsL = 36,
  segsW = 14,
} = {}) {
  const positions = [];
  const normals = [];
  const uvs = [];
  const indices = [];

  for (let j = 0; j <= segsL; j += 1) {
    const v = j / segsL;
    // Organic leaf width: narrow hitch → broad mid → fine tip
    const widthProfile =
      Math.pow(Math.sin(Math.pow(v, 0.62) * Math.PI), 0.85) *
      (1 - Math.pow(v, 2.4) * 0.2);
    const halfW = (width * 0.5) * Math.max(0.05, widthProfile);
    const droop = Math.pow(v, 1.85) * tipDroop;
    const twistAngle = (v - 0.28) * twist;
    const archBase = Math.sin(v * Math.PI) * camber;

    for (let i = 0; i <= segsW; i += 1) {
      const u = i / segsW;
      const x0 = THREE.MathUtils.lerp(-halfW, halfW, u);
      // Airfoil section: thicker near mid-chord, thin edges
      const edge = 1 - Math.pow(Math.abs(u * 2 - 1), 1.6);
      const y0 = thickness * edge * (0.35 + 0.65 * Math.sin(v * Math.PI));
      const arch = archBase * (0.7 + 0.3 * edge);
      // Top surface camber varies across width
      const ySurf = y0 + arch * (1 - Math.abs(u * 2 - 1) * 0.35) - droop;

      const cosT = Math.cos(twistAngle);
      const sinT = Math.sin(twistAngle);
      const x = x0 * cosT - ySurf * sinT * 0.25;
      const y = x0 * sinT * 0.15 + ySurf;
      const z = v * length;

      positions.push(x, y, z);
      uvs.push(u, v);
      // Approximate normal (refined after)
      normals.push(0, 1, 0);
    }
  }

  for (let j = 0; j < segsL; j += 1) {
    for (let i = 0; i < segsW; i += 1) {
      const a = j * (segsW + 1) + i;
      const b = a + segsW + 1;
      indices.push(a, b, a + 1);
      indices.push(b, b + 1, a + 1);
    }
  }

  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geo.setAttribute('normal', new THREE.Float32BufferAttribute(normals, 3));
  geo.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
  geo.setIndex(indices);
  geo.computeVertexNormals();
  return geo;
}

/** Sample a latitude/longitude style point on an asymmetric dome shell. */
export function sampleDomePoint(u, v, {
  baseR = 13.5,
  height = 7.8,
  southTilt = 0.18,
  asymmetry = 0.14,
} = {}) {
  // v: 0 base → 1 apex; u: 0..1 around
  // Low, wide, droplet-like asymmetric shell (ref: exploded + aerial)
  const theta = u * Math.PI * 2;
  const profile =
    Math.pow(1 - Math.pow(v, 1.15), 0.72) *
    (0.92 + 0.08 * Math.cos(v * Math.PI));
  const oval =
    1 +
    asymmetry * Math.cos(theta - 0.4) +
    asymmetry * 0.45 * Math.sin(2 * theta + 0.5) -
    asymmetry * 0.2 * Math.cos(3 * theta);
  const r = baseR * Math.max(0.12, profile) * oval;
  const y = Math.sin(v * Math.PI * 0.5) * height;
  let x = Math.cos(theta) * r;
  let z = Math.sin(theta) * r;
  // South lean
  x += southTilt * y * 0.2;
  z += southTilt * y * 1.1;
  return new THREE.Vector3(x, y, z);
}

export function createAsymmetricDomeGeometry(opts = {}, radial = 48, heightSeg = 22) {
  const positions = [];
  const normals = [];
  const uvs = [];
  const colors = [];
  const indices = [];

  for (let j = 0; j <= heightSeg; j += 1) {
    const v = j / heightSeg;
    for (let i = 0; i <= radial; i += 1) {
      const u = i / radial;
      const p = sampleDomePoint(u, v, opts);
      positions.push(p.x, p.y, p.z);
      uvs.push(u, v);
      // Gradient: lapis (base) → amber → terracotta (crown)
      const c = domeGradientColor(v, u);
      colors.push(c.r, c.g, c.b);
      normals.push(0, 1, 0);
    }
  }

  for (let j = 0; j < heightSeg; j += 1) {
    for (let i = 0; i < radial; i += 1) {
      const a = j * (radial + 1) + i;
      const b = a + radial + 1;
      indices.push(a, a + 1, b);
      indices.push(b, a + 1, b + 1);
    }
  }

  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geo.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
  geo.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
  geo.setAttribute('normal', new THREE.Float32BufferAttribute(normals, 3));
  geo.setIndex(indices);
  geo.computeVertexNormals();
  return geo;
}

export function domeGradientColor(v, u) {
  // Saturated lapis → amber gold → terracotta
  const lapis = new THREE.Color(0x1a5caa);
  const amber = new THREE.Color(0xe8a040);
  const terra = new THREE.Color(0xd45228);
  const azimuthWarm = 0.5 + 0.5 * Math.sin((u - 0.15) * Math.PI * 2); // south-west warmer
  let c;
  if (v < 0.45) {
    c = lapis.clone().lerp(amber, (v / 0.45) * (0.55 + 0.45 * azimuthWarm));
  } else {
    c = amber.clone().lerp(terra, ((v - 0.45) / 0.55) * (0.4 + 0.6 * azimuthWarm));
  }
  // Boost gem saturation without blowing value
  c.offsetHSL(0, 0.12, 0.02);
  return c;
}

export const GOLDEN_ANGLE = (137.5 * Math.PI) / 180;
