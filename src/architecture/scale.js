import * as THREE from 'three';

/**
 * Scale references: 12 white silhouette figures (1.75 m) + weather mast.
 */
export function createScaleRefs(materials) {
  const group = new THREE.Group();
  group.name = 'ScaleRefs';

  const spots = [
    // Entry ramp
    [14, 0.05, 16],
    [16, 0.05, 18],
    [12, 0.05, 14],
    // Sunken courtyard
    [-2, -0.35, 10],
    [-4, -0.35, 11],
    [0, -0.35, 9],
    // Roof terraces matching stacked-belt tier tops
    [8, 1.7, -4],
    [-6, 1.7, 2],
    [4, 3.05, 3],
    [-3, 3.05, -2],
    [2, 4.25, 0],
    [-5, 4.25, 1],
  ];

  spots.forEach((p, i) => {
    const fig = createFigure(materials);
    fig.position.set(p[0], p[1], p[2]);
    fig.rotation.y = (i * 0.7) % (Math.PI * 2);
    fig.userData.layer = 'base';
    fig.userData.restY = p[1];
    group.add(fig);
  });

  const tower = createWeatherTower(materials);
  tower.position.set(28, 0, 4);
  tower.userData.layer = 'base';
  tower.userData.restY = 0;
  group.add(tower);

  return group;
}

function createFigure(materials) {
  const g = new THREE.Group();
  // Strict 1.75 m silhouette
  const mat = materials.wireWhite;
  const body = new THREE.Mesh(new THREE.CapsuleGeometry(0.18, 0.85, 4, 8), mat);
  body.position.y = 0.95;
  body.castShadow = true;
  g.add(body);

  const head = new THREE.Mesh(new THREE.SphereGeometry(0.16, 10, 8), mat);
  head.position.y = 1.58;
  head.castShadow = true;
  g.add(head);

  const legL = new THREE.Mesh(new THREE.CapsuleGeometry(0.07, 0.45, 3, 6), mat);
  legL.position.set(-0.1, 0.35, 0);
  g.add(legL);
  const legR = legL.clone();
  legR.position.x = 0.1;
  g.add(legR);

  return g;
}

function createWeatherTower(materials) {
  const g = new THREE.Group();
  g.name = 'WeatherTower';

  const mast = new THREE.Mesh(
    new THREE.CylinderGeometry(0.08, 0.12, 18, 10),
    materials.wireWhite
  );
  mast.position.y = 9;
  mast.castShadow = true;
  g.add(mast);

  // Lattice rings
  for (let i = 0; i < 6; i += 1) {
    const ring = new THREE.Mesh(
      new THREE.TorusGeometry(0.55 + i * 0.05, 0.025, 6, 16),
      materials.wireWhite
    );
    ring.rotation.x = Math.PI / 2;
    ring.position.y = 2 + i * 2.5;
    g.add(ring);

    for (let j = 0; j < 4; j += 1) {
      const a = (j / 4) * Math.PI * 2;
      const brace = new THREE.Mesh(
        new THREE.CylinderGeometry(0.02, 0.02, 2.4, 4),
        materials.wireWhite
      );
      brace.position.set(
        Math.cos(a) * 0.5,
        2 + i * 2.5 + 1.1,
        Math.sin(a) * 0.5
      );
      brace.rotation.z = Math.cos(a) * 0.35;
      brace.rotation.x = Math.sin(a) * 0.35;
      g.add(brace);
    }
  }

  // Instrument cage at top
  const cage = new THREE.Mesh(
    new THREE.BoxGeometry(1.2, 0.8, 1.2),
    new THREE.MeshStandardMaterial({
      color: 0xf4f4f0,
      wireframe: true,
      roughness: 0.5,
    })
  );
  cage.position.y = 18.2;
  g.add(cage);

  const anemometer = new THREE.Mesh(
    new THREE.SphereGeometry(0.25, 10, 8),
    materials.steel
  );
  anemometer.position.y = 18.9;
  g.add(anemometer);

  return g;
}
