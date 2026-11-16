import * as THREE from 'three';

/**
 * Hyperbolic steel lattice shell with amber / lapis BIPV glazing.
 * Colored caustic spots are projected onto the floor as textured discs.
 */
export function createAtrium(materials) {
  const group = new THREE.Group();
  group.name = 'Atrium';
  group.position.y = 2.4;

  const radius = 9.5;
  const height = 11;
  const radialSeg = 48;
  const heightSeg = 18;

  const shellGeo = createHyperboloidGeometry(radius, height, radialSeg, heightSeg);
  const glass = new THREE.Mesh(shellGeo, materials.bipvAmber);
  // Blend two materials via vertex colors / dual shells
  glass.material = createGradientBIPVMaterial(materials);
  glass.castShadow = true;
  glass.receiveShadow = true;
  glass.name = 'BIPVShell';
  glass.userData.layer = 'atriumGlass';
  glass.userData.restY = 0;
  group.add(glass);

  // Steel diagrid
  const lattice = createDiagrid(radius, height, 16, 10, materials.steel);
  lattice.userData.layer = 'atriumSteel';
  lattice.userData.restY = 0;
  group.add(lattice);

  // Ring beams
  for (let i = 0; i < 5; i += 1) {
    const t = i / 4;
    const y = t * height;
    const r = hyperboloidRadius(radius, height, y);
    const ring = new THREE.Mesh(
      new THREE.TorusGeometry(r, 0.07, 8, 64),
      materials.steel
    );
    ring.rotation.x = Math.PI / 2;
    ring.position.y = y;
    ring.castShadow = true;
    ring.userData.layer = 'atriumSteel';
    ring.userData.restY = y;
    group.add(ring);
  }

  // Interior floor disc for light play
  const floor = new THREE.Mesh(
    new THREE.CircleGeometry(8.2, 64),
    new THREE.MeshStandardMaterial({
      color: 0xd8ddd4,
      roughness: 0.55,
      metalness: 0.05,
      name: 'atriumFloor',
    })
  );
  floor.rotation.x = -Math.PI / 2;
  floor.position.y = 0.02;
  floor.receiveShadow = true;
  floor.userData.layer = 'atriumFloor';
  floor.userData.restY = floor.position.y;
  group.add(floor);

  // Colored light spots (caustics stand-ins)
  const spots = new THREE.Group();
  spots.name = 'CausticSpots';
  spots.userData.layer = 'caustics';
  const palette = [0xc9893a, 0x1f4d7a, 0xd4a05a, 0x3a6ea5, 0xb87333, 0x245f86];
  for (let i = 0; i < 14; i += 1) {
    const spot = new THREE.Mesh(
      new THREE.CircleGeometry(0.35 + Math.random() * 0.55, 24),
      new THREE.MeshBasicMaterial({
        color: palette[i % palette.length],
        transparent: true,
        opacity: 0.28,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
      })
    );
    spot.rotation.x = -Math.PI / 2;
    const a = (i / 14) * Math.PI * 2;
    const d = 1.2 + (i % 5) * 1.05;
    spot.position.set(Math.cos(a) * d, 0.04, Math.sin(a) * d * 0.85);
    spot.userData.phase = Math.random() * Math.PI * 2;
    spot.userData.restY = spot.position.y;
    spots.add(spot);
  }
  group.add(spots);
  group.userData.causticSpots = spots;

  // Inner walkway ring
  const walk = new THREE.Mesh(
    new THREE.RingGeometry(5.8, 7.4, 64),
    materials.concrete
  );
  walk.rotation.x = -Math.PI / 2;
  walk.position.y = 0.03;
  walk.receiveShadow = true;
  walk.userData.layer = 'atriumFloor';
  walk.userData.restY = walk.position.y;
  group.add(walk);

  return group;
}

function hyperboloidRadius(baseR, height, y) {
  const t = (y / height) * 2 - 1;
  return baseR * Math.sqrt(1 + t * t * 0.55) * (0.72 + 0.28 * Math.cos(t * Math.PI * 0.5));
}

function createHyperboloidGeometry(baseR, height, radialSeg, heightSeg) {
  const positions = [];
  const normals = [];
  const uvs = [];
  const indices = [];
  const colors = [];

  for (let j = 0; j <= heightSeg; j += 1) {
    const v = j / heightSeg;
    const y = v * height;
    const r = hyperboloidRadius(baseR, height, y);
    for (let i = 0; i <= radialSeg; i += 1) {
      const u = i / radialSeg;
      const theta = u * Math.PI * 2;
      const x = Math.cos(theta) * r;
      const z = Math.sin(theta) * r;
      positions.push(x, y, z);
      const nx = Math.cos(theta);
      const nz = Math.sin(theta);
      normals.push(nx, 0.15, nz);
      uvs.push(u, v);
      // amber → lapis vertical/azimuth blend
      const amber = 1 - Math.abs(Math.sin(theta * 2)) * 0.55;
      colors.push(
        0.78 * amber + 0.12 * (1 - amber),
        0.54 * amber + 0.3 * (1 - amber),
        0.23 * amber + 0.48 * (1 - amber)
      );
    }
  }

  for (let j = 0; j < heightSeg; j += 1) {
    for (let i = 0; i < radialSeg; i += 1) {
      const a = j * (radialSeg + 1) + i;
      const b = a + radialSeg + 1;
      indices.push(a, b, a + 1);
      indices.push(b, b + 1, a + 1);
    }
  }

  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geo.setAttribute('normal', new THREE.Float32BufferAttribute(normals, 3));
  geo.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
  geo.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
  geo.setIndex(indices);
  geo.computeVertexNormals();
  return geo;
}

function createGradientBIPVMaterial(materials) {
  const mat = materials.bipvAmber.clone();
  mat.vertexColors = true;
  mat.color.set(0xffffff);
  mat.name = 'bipvGradient';
  mat.transmission = 0.68;
  mat.opacity = 0.86;
  mat.transparent = true;
  mat.roughness = 0.14;
  mat.thickness = 0.5;
  mat.attenuationColor = new THREE.Color(0xb8884a);
  mat.attenuationDistance = 1.6;
  mat.side = THREE.DoubleSide;
  return mat;
}

function createDiagrid(baseR, height, meridians, rings, material) {
  const group = new THREE.Group();
  group.name = 'Diagrid';

  for (let m = 0; m < meridians; m += 1) {
    const theta = (m / meridians) * Math.PI * 2;
    const pts = [];
    for (let k = 0; k <= rings; k += 1) {
      const y = (k / rings) * height;
      const r = hyperboloidRadius(baseR, height, y);
      const twist = (k / rings) * 0.55;
      pts.push(
        new THREE.Vector3(
          Math.cos(theta + twist) * r,
          y,
          Math.sin(theta + twist) * r
        )
      );
    }
    const curve = new THREE.CatmullRomCurve3(pts);
    const tube = new THREE.Mesh(
      new THREE.TubeGeometry(curve, 32, 0.045, 5, false),
      material
    );
    tube.castShadow = true;
    tube.userData.restY = 0;
    group.add(tube);

    // Counter-twist set
    const pts2 = pts.map((p, k) => {
      const y = (k / rings) * height;
      const r = hyperboloidRadius(baseR, height, y);
      const twist = -(k / rings) * 0.55;
      return new THREE.Vector3(
        Math.cos(theta + twist) * r,
        y,
        Math.sin(theta + twist) * r
      );
    });
    const curve2 = new THREE.CatmullRomCurve3(pts2);
    const tube2 = new THREE.Mesh(
      new THREE.TubeGeometry(curve2, 32, 0.04, 5, false),
      material
    );
    tube2.castShadow = true;
    tube2.userData.restY = 0;
    group.add(tube2);
  }

  return group;
}

export function updateCaustics(atrium, sunDir, intensity) {
  const spots = atrium?.userData?.causticSpots;
  if (!spots) return;
  const t = performance.now() * 0.00035;
  spots.children.forEach((spot, i) => {
    const phase = spot.userData.phase || 0;
    spot.material.opacity = 0.12 + intensity * 0.32 + Math.sin(t + phase) * 0.05;
    const drift = 0.15 * Math.sin(t * 0.7 + i);
    spot.scale.setScalar(0.85 + intensity * 0.45 + drift);
    // Soft bias toward sun azimuth projection
    spot.position.x += sunDir.x * 0.002;
    spot.position.z += sunDir.z * 0.002;
    const len = Math.hypot(spot.position.x, spot.position.z);
    if (len > 7) {
      spot.position.x *= 0.98;
      spot.position.z *= 0.98;
    }
  });
}
