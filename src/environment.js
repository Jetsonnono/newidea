import * as THREE from 'three';

export function createEnvironment(scene, materials) {
  const group = new THREE.Group();
  group.name = 'Environment';

  // Plateau ground
  const ground = new THREE.Mesh(
    new THREE.CircleGeometry(120, 96),
    materials.ground
  );
  ground.rotation.x = -Math.PI / 2;
  ground.position.y = -0.02;
  ground.receiveShadow = true;
  ground.userData.hideOnExport = false;
  group.add(ground);

  // Soft rolling dunes / berms
  for (let i = 0; i < 8; i += 1) {
    const a = (i / 8) * Math.PI * 2 + 0.4;
    const d = 38 + (i % 3) * 10;
    const mound = new THREE.Mesh(
      new THREE.SphereGeometry(8 + (i % 4), 24, 16, 0, Math.PI * 2, 0, Math.PI * 0.5),
      materials.earthFill
    );
    mound.position.set(Math.cos(a) * d, -1.2, Math.sin(a) * d);
    mound.scale.set(1.4, 0.35 + (i % 3) * 0.08, 1.1);
    mound.receiveShadow = true;
    mound.castShadow = true;
    group.add(mound);
  }

  // Approach road
  const road = new THREE.Mesh(
    new THREE.PlaneGeometry(12, 60),
    materials.road
  );
  road.rotation.x = -Math.PI / 2;
  road.position.set(16, 0.01, 28);
  road.rotation.z = -0.45;
  road.receiveShadow = true;
  group.add(road);

  // Sky dome (gradient via shader)
  const sky = createSkyDome();
  sky.userData.hideOnExport = true;
  group.add(sky);

  // Distant ridge silhouettes
  const ridgeMat = new THREE.MeshStandardMaterial({
    color: 0x6d7d88,
    roughness: 1,
    metalness: 0,
    flatShading: true,
  });
  for (let i = 0; i < 5; i += 1) {
    const ridge = new THREE.Mesh(
      new THREE.ConeGeometry(18 + i * 3, 10 + i * 2, 5),
      ridgeMat
    );
    const a = -1.2 + i * 0.45;
    ridge.position.set(Math.cos(a) * 95, 2, Math.sin(a) * 95 - 20);
    ridge.rotation.y = a;
    ridge.userData.hideOnExport = true;
    group.add(ridge);
  }

  scene.add(group);
  scene.fog = new THREE.FogExp2(0xb9c6b4, 0.0038);
  scene.background = new THREE.Color(0xb7c8c4);

  return { group, sky, ground };
}

function createSkyDome() {
  const geo = new THREE.SphereGeometry(180, 48, 32);
  const mat = new THREE.ShaderMaterial({
    side: THREE.BackSide,
    depthWrite: false,
    uniforms: {
      topColor: { value: new THREE.Color(0x6fa4c8) },
      midColor: { value: new THREE.Color(0xc5d6cf) },
      bottomColor: { value: new THREE.Color(0xd8c49a) },
      offset: { value: 12 },
      exponent: { value: 0.7 },
    },
    vertexShader: `
      varying vec3 vWorldPosition;
      void main() {
        vec4 worldPosition = modelMatrix * vec4(position, 1.0);
        vWorldPosition = worldPosition.xyz;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: `
      uniform vec3 topColor;
      uniform vec3 midColor;
      uniform vec3 bottomColor;
      uniform float offset;
      uniform float exponent;
      varying vec3 vWorldPosition;
      void main() {
        float h = normalize(vWorldPosition + vec3(0.0, offset, 0.0)).y;
        float t = max(pow(max(h, 0.0), exponent), 0.0);
        vec3 col = mix(bottomColor, midColor, smoothstep(-0.2, 0.35, h));
        col = mix(col, topColor, t);
        gl_FragColor = vec4(col, 1.0);
      }
    `,
  });
  return new THREE.Mesh(geo, mat);
}

export function updateSkyForSun(env, sunState) {
  if (!env?.sky?.material?.uniforms) return;
  const u = env.sky.material.uniforms;
  const irr = sunState.irradiance;
  u.topColor.value.setHSL(0.56, 0.45, 0.35 + irr * 0.25);
  u.midColor.value.setHSL(0.45, 0.18, 0.7 + irr * 0.08);
  u.bottomColor.value.setHSL(0.1, 0.35 + (1 - irr) * 0.2, 0.62);
}
