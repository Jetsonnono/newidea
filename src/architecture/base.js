import * as THREE from 'three';

/**
 * Three-tier streamlined white concrete + earth-covered base
 * with sunken courtyard and V2G vehicle ramp.
 */
export function createBase(materials) {
  const group = new THREE.Group();
  group.name = 'Base';

  const tiers = [
    { y: 0.35, sx: 42, sz: 34, h: 0.7, earth: false },
    { y: 1.15, sx: 34, sz: 27, h: 0.9, earth: true },
    { y: 2.05, sx: 26, sz: 20, h: 0.9, earth: true },
  ];

  tiers.forEach((tier, index) => {
    const shape = createStreamlineFootprint(tier.sx, tier.sz, 0.12 + index * 0.02);
    const geo = new THREE.ExtrudeGeometry(shape, {
      depth: tier.h,
      bevelEnabled: true,
      bevelThickness: 0.08,
      bevelSize: 0.12,
      bevelSegments: 3,
      curveSegments: 48,
    });
    geo.rotateX(-Math.PI / 2);
    geo.translate(0, tier.y - tier.h / 2, 0);

    const mesh = new THREE.Mesh(geo, materials.concrete);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    mesh.name = `Tier${index + 1}`;
    mesh.userData.layer = 'base';
    mesh.userData.restY = mesh.position.y;
    group.add(mesh);

    if (tier.earth) {
      const berm = new THREE.Mesh(
        new THREE.TorusGeometry(
          Math.min(tier.sx, tier.sz) * 0.42,
          0.35,
          10,
          64,
          Math.PI * 1.35
        ),
        materials.earthFill
      );
      berm.rotation.x = Math.PI / 2;
      berm.rotation.z = -0.35;
      berm.position.set(-tier.sx * 0.08, tier.y + 0.05, tier.sz * 0.18);
      berm.castShadow = true;
      berm.receiveShadow = true;
      berm.userData.layer = 'earth';
      berm.userData.restY = berm.position.y;
      group.add(berm);
    }
  });

  // Sunken courtyard carved into the lowest plaza
  const court = new THREE.Mesh(
    new THREE.CylinderGeometry(5.2, 5.8, 1.4, 48),
    materials.courtyard
  );
  court.position.set(-6.5, -0.2, 4.5);
  court.receiveShadow = true;
  court.userData.layer = 'courtyard';
  court.userData.restY = court.position.y;
  group.add(court);

  const courtRim = new THREE.Mesh(
    new THREE.TorusGeometry(5.5, 0.18, 8, 48),
    materials.concrete
  );
  courtRim.rotation.x = Math.PI / 2;
  courtRim.position.set(-6.5, 0.55, 4.5);
  courtRim.castShadow = true;
  courtRim.userData.layer = 'courtyard';
  courtRim.userData.restY = courtRim.position.y;
  group.add(courtRim);

  // V2G parking ramp
  const rampGroup = createV2GRamp(materials);
  rampGroup.position.set(10, 0.05, 8);
  rampGroup.userData.layer = 'ramp';
  group.add(rampGroup);

  // Soft retaining walls around courtyard
  const wall = new THREE.Mesh(
    new THREE.TorusGeometry(5.9, 0.22, 6, 40, Math.PI * 1.15),
    materials.concrete
  );
  wall.rotation.x = Math.PI / 2;
  wall.rotation.z = 0.55;
  wall.position.set(-6.5, 0.2, 4.5);
  wall.castShadow = true;
  wall.userData.layer = 'courtyard';
  wall.userData.restY = wall.position.y;
  group.add(wall);

  // Charging stalls markers on ramp apron
  for (let i = 0; i < 3; i += 1) {
    const pad = new THREE.Mesh(
      new THREE.BoxGeometry(2.4, 0.06, 4.6),
      materials.road
    );
    pad.position.set(14.5 + i * 3.1, 0.38, 11.2);
    pad.rotation.y = -0.35;
    pad.receiveShadow = true;
    pad.userData.layer = 'ramp';
    pad.userData.restY = pad.position.y;
    group.add(pad);

    const post = new THREE.Mesh(
      new THREE.CylinderGeometry(0.08, 0.1, 1.4, 10),
      materials.steel
    );
    post.position.set(13.4 + i * 3.1, 1.05, 9.4);
    post.castShadow = true;
    post.userData.layer = 'ramp';
    post.userData.restY = post.position.y;
    group.add(post);
  }

  return group;
}

function createStreamlineFootprint(width, depth, roundness) {
  const shape = new THREE.Shape();
  const hw = width / 2;
  const hd = depth / 2;
  const r = Math.min(hw, hd) * roundness * 8;

  shape.moveTo(-hw + r, -hd);
  shape.lineTo(hw - r, -hd);
  shape.quadraticCurveTo(hw, -hd, hw, -hd + r);
  shape.lineTo(hw * 0.92, hd * 0.35);
  shape.quadraticCurveTo(hw * 0.85, hd, hw * 0.4, hd);
  shape.lineTo(-hw * 0.55, hd * 0.92);
  shape.quadraticCurveTo(-hw, hd * 0.85, -hw, hd * 0.25);
  shape.lineTo(-hw, -hd + r);
  shape.quadraticCurveTo(-hw, -hd, -hw + r, -hd);
  return shape;
}

function createV2GRamp(materials) {
  const group = new THREE.Group();
  group.name = 'V2GRamp';

  const points = [];
  for (let i = 0; i <= 24; i += 1) {
    const t = i / 24;
    const x = t * 8;
    const y = (1 - t) * 1.8;
    const z = Math.sin(t * Math.PI) * 1.2 + t * 4;
    points.push(new THREE.Vector3(x, y, z));
  }
  const curve = new THREE.CatmullRomCurve3(points);
  const rampGeo = new THREE.TubeGeometry(curve, 64, 1.6, 6, false);
  const ramp = new THREE.Mesh(rampGeo, materials.ramp);
  ramp.castShadow = true;
  ramp.receiveShadow = true;
  ramp.userData.restY = 0;
  group.add(ramp);

  // Flattened driving surface strip
  const deck = new THREE.Mesh(
    new THREE.BoxGeometry(10, 0.12, 3.4),
    materials.road
  );
  deck.position.set(5.2, 0.55, 3.2);
  deck.rotation.set(-0.18, -0.2, 0.05);
  deck.receiveShadow = true;
  deck.userData.restY = deck.position.y;
  group.add(deck);

  return group;
}
