import * as THREE from 'three';

/**
 * Plateau sun path for ~32°N.
 * minutesFromMidnight: 360 (06:00) → 1200 (20:00)
 */
export function minutesToClock(minutes) {
  const h = Math.floor(minutes / 60);
  const m = Math.floor(minutes % 60);
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

export function computeSunState(minutes, latitudeDeg = 32) {
  const hour = minutes / 60;
  // Map 6–20 to solar elevation curve peaking at 13:00 plateau time
  const t = THREE.MathUtils.clamp((hour - 6) / 14, 0, 1);
  const solarNoon = 13;
  const hourAngle = ((hour - solarNoon) / 12) * Math.PI;

  const lat = THREE.MathUtils.degToRad(latitudeDeg);
  // Approximate declination for a clear highland spring day
  const decl = THREE.MathUtils.degToRad(12);

  const sinEl =
    Math.sin(lat) * Math.sin(decl) +
    Math.cos(lat) * Math.cos(decl) * Math.cos(hourAngle);
  const elevation = Math.asin(THREE.MathUtils.clamp(sinEl, -1, 1));

  const cosAz = THREE.MathUtils.clamp(
    (Math.sin(decl) - Math.sin(elevation) * Math.sin(lat)) /
      (Math.cos(elevation) * Math.cos(lat) + 1e-6),
    -1,
    1
  );
  let azimuth = Math.acos(cosAz);
  if (hourAngle > 0) azimuth = Math.PI * 2 - azimuth;
  // Convert so 0 = north, increase clockwise → Three.js XZ (X east, Z south-ish)
  // Place sun: morning east (-X→+X depending), afternoon west
  const az = azimuth - Math.PI; // face southern sky hemisphere

  const distance = 120;
  const cosEl = Math.cos(elevation);
  const direction = new THREE.Vector3(
    Math.sin(az) * cosEl,
    Math.sin(elevation),
    Math.cos(az) * cosEl
  ).normalize();

  // Keep sun above horizon for shadow usefulness within slider range
  if (direction.y < 0.05) {
    direction.y = 0.05;
    direction.normalize();
  }

  const position = direction.clone().multiplyScalar(distance);

  // Irradiance proxy 0–1
  // Three.MathUtils.smoothstep(x, min, max) — not GLSL argument order
  const clearSky = THREE.MathUtils.smoothstep(direction.y, 0.02, 0.55);
  const diurnal = Math.sin(t * Math.PI);
  const irradiance = clearSky * (0.35 + 0.65 * diurnal);

  return {
    hour,
    elevation,
    azimuth: az,
    direction,
    position,
    irradiance,
  };
}

export function createSunRig(scene) {
  const hemi = new THREE.HemisphereLight(0xcfe4f2, 0x8a7a55, 0.55);
  scene.add(hemi);

  const ambient = new THREE.AmbientLight(0xdde6df, 0.22);
  scene.add(ambient);

  const sun = new THREE.DirectionalLight(0xfff1d6, 2.4);
  sun.castShadow = true;
  sun.shadow.mapSize.set(2048, 2048);
  sun.shadow.camera.near = 10;
  sun.shadow.camera.far = 220;
  sun.shadow.camera.left = -60;
  sun.shadow.camera.right = 60;
  sun.shadow.camera.top = 60;
  sun.shadow.camera.bottom = -60;
  sun.shadow.bias = -0.0002;
  sun.shadow.normalBias = 0.03;
  scene.add(sun);
  scene.add(sun.target);

  const sunOrb = new THREE.Mesh(
    new THREE.SphereGeometry(1.6, 24, 24),
    new THREE.MeshBasicMaterial({ color: 0xffe2a8 })
  );
  scene.add(sunOrb);

  const fill = new THREE.DirectionalLight(0xa8c4d8, 0.35);
  fill.position.set(-40, 30, -20);
  scene.add(fill);

  return { sun, sunOrb, hemi, ambient, fill };
}

export function applySunToRig(rig, sunState) {
  const { sun, sunOrb, hemi, ambient } = rig;
  sun.position.copy(sunState.position);
  sun.target.position.set(0, 4, 0);
  sun.target.updateMatrixWorld();
  sun.intensity = 0.6 + sunState.irradiance * 2.6;
  sun.color.setHSL(0.11 - sunState.irradiance * 0.02, 0.55, 0.78 + sunState.irradiance * 0.1);

  sunOrb.position.copy(sunState.position.clone().multiplyScalar(0.92));
  sunOrb.material.color.setHSL(0.12, 0.65, 0.7 + sunState.irradiance * 0.25);

  hemi.intensity = 0.35 + sunState.irradiance * 0.4;
  ambient.intensity = 0.14 + sunState.irradiance * 0.16;
}
