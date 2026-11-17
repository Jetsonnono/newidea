import * as THREE from 'three';
import {
  createAsymmetricDomeGeometry,
  sampleDomePoint,
} from '../geometry/helpers.js';
import { createCausticsTexture } from '../materials/perovskiteTextures.js';

const DOME = {
  baseR: 13.5,
  height: 7.8,
  southTilt: 0.18,
  asymmetry: 0.14,
};

/**
 * Asymmetric hyperbolic BIPV atrium:
 * - outer gradient glass shell
 * - inner white diagrid (instanced tubes + node spheres)
 */
export function createAtrium(materials) {
  const group = new THREE.Group();
  group.name = 'Atrium';
  // World Y is applied by building layer groups
  group.position.y = 0;

  // —— Outer BIPV glass ——
  const glassGeo = createAsymmetricDomeGeometry(DOME, 56, 24);
  // Open oculus: shrink top ring visually by discarding? Keep soft crown hole via scale
  const glass = new THREE.Mesh(glassGeo, materials.bipvGlass);
  glass.name = 'BIPVShell';
  glass.castShadow = true;
  glass.receiveShadow = true;
  // Allow soft contact shadows on adjacent opaque surfaces
  glass.material.shadowSide = THREE.FrontSide;
  glass.userData.layer = 'atriumGlass';
  glass.userData.restY = 0;
  group.add(glass);

  // Soft oculus rim
  const rim = new THREE.Mesh(
    new THREE.TorusGeometry(2.4, 0.12, 10, 48),
    materials.steel
  );
  rim.rotation.x = Math.PI / 2;
  rim.position.set(0.4, DOME.height * 0.88, 1.35);
  rim.castShadow = true;
  rim.userData.layer = 'atriumSteel';
  rim.userData.restY = rim.position.y;
  group.add(rim);

  // —— Inner white diagrid ——
  const diagrid = createDiagridInstanced(materials.steel, 18, 10);
  diagrid.userData.layer = 'atriumSteel';
  diagrid.userData.restY = 0;
  group.add(diagrid);

  // Ring beams
  for (let i = 0; i < 6; i += 1) {
    const v = 0.08 + (i / 5) * 0.82;
    const pts = [];
    for (let k = 0; k <= 64; k += 1) {
      const u = k / 64;
      pts.push(sampleDomePoint(u, v, DOME));
    }
    const curve = new THREE.CatmullRomCurve3(pts, true);
    const ring = new THREE.Mesh(
      new THREE.TubeGeometry(curve, 96, 0.055, 6, true),
      materials.steel
    );
    ring.castShadow = true;
    ring.userData.layer = 'atriumSteel';
    ring.userData.restY = 0;
    group.add(ring);
  }

  // Interior floor + walkway
  const floor = new THREE.Mesh(
    new THREE.CircleGeometry(11.2, 64),
    materials.courtyard
  );
  floor.rotation.x = -Math.PI / 2;
  floor.position.y = 0.02;
  floor.receiveShadow = true;
  floor.userData.layer = 'atriumFloor';
  floor.userData.restY = floor.position.y;
  group.add(floor);

  const walk = new THREE.Mesh(
    new THREE.RingGeometry(7.2, 10.2, 64),
    materials.concrete
  );
  walk.rotation.x = -Math.PI / 2;
  walk.position.y = 0.04;
  walk.receiveShadow = true;
  walk.userData.layer = 'atriumFloor';
  walk.userData.restY = walk.position.y;
  group.add(walk);

  // Interior tree
  const trunk = new THREE.Mesh(
    new THREE.CylinderGeometry(0.25, 0.38, 4.2, 12),
    materials.earthFill
  );
  trunk.position.y = 2.1;
  trunk.castShadow = true;
  trunk.userData.layer = 'atriumFloor';
  trunk.userData.restY = trunk.position.y;
  group.add(trunk);

  const canopy = new THREE.Mesh(
    new THREE.SphereGeometry(2.8, 16, 12),
    materials.shrub
  );
  canopy.position.y = 5.2;
  canopy.scale.set(1.15, 0.8, 1.15);
  canopy.castShadow = true;
  canopy.userData.layer = 'atriumFloor';
  canopy.userData.restY = canopy.position.y;
  group.add(canopy);

  // Interior columns
  [-1, 1].forEach((sx) => {
    [-1, 1].forEach((sz) => {
      const col = new THREE.Mesh(
        new THREE.CylinderGeometry(0.55, 0.65, 7.5, 16),
        materials.concrete
      );
      col.position.set(sx * 4.2, 3.75, sz * 3.6);
      col.castShadow = true;
      col.userData.layer = 'cores';
      col.userData.restY = col.position.y;
      group.add(col);
    });
  });

  // Dynamic colored caustics overlay (moves with sun)
  const spots = new THREE.Group();
  spots.name = 'CausticSpots';
  spots.userData.layer = 'caustics';

  const causticsTex = createCausticsTexture(512);
  causticsTex.repeat.set(2.2, 2.2);
  const causticsMat = new THREE.MeshBasicMaterial({
    map: causticsTex,
    transparent: true,
    opacity: 0.55,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    toneMapped: false,
  });
  const causticsPlane = new THREE.Mesh(
    new THREE.PlaneGeometry(18, 18, 1, 1),
    causticsMat
  );
  causticsPlane.rotation.x = -Math.PI / 2;
  causticsPlane.position.y = 0.06;
  causticsPlane.userData.restY = 0.06;
  causticsPlane.name = 'CausticsOverlay';
  spots.add(causticsPlane);
  spots.userData.overlay = causticsPlane;
  spots.userData.causticsTex = causticsTex;

  // Accent discs for sharper amber / lapis pools
  const palette = [0xc9893a, 0x1f4d7a, 0xd4a05a, 0x3a6ea5, 0xc45a2a];
  for (let i = 0; i < 12; i += 1) {
    const spot = new THREE.Mesh(
      new THREE.CircleGeometry(0.35 + (i % 4) * 0.12, 20),
      new THREE.MeshBasicMaterial({
        color: palette[i % palette.length],
        transparent: true,
        opacity: 0.28,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        toneMapped: false,
      })
    );
    spot.rotation.x = -Math.PI / 2;
    const a = (i / 12) * Math.PI * 2;
    const d = 1.6 + (i % 5) * 0.85;
    spot.position.set(Math.cos(a) * d, 0.07, Math.sin(a) * d * 0.9);
    spot.userData.phase = i * 0.7;
    spot.userData.baseX = spot.position.x;
    spot.userData.baseZ = spot.position.z;
    spot.userData.restY = spot.position.y;
    spots.add(spot);
  }
  group.add(spots);
  group.userData.causticSpots = spots;
  group.userData.dome = DOME;

  // Warm golden point lights — amber glow through BIPV from inside
  const warmA = new THREE.PointLight(0xffaa33, 2.4, 22, 1.6);
  warmA.position.set(0, 3.2, 0);
  warmA.castShadow = false;
  warmA.userData.layer = 'atriumFloor';
  warmA.userData.restY = warmA.position.y;
  group.add(warmA);

  const warmB = new THREE.PointLight(0xffaa33, 1.35, 16, 1.8);
  warmB.position.set(2.5, 5.8, -1.2);
  warmB.castShadow = false;
  warmB.userData.layer = 'atriumFloor';
  warmB.userData.restY = warmB.position.y;
  group.add(warmB);

  const warmC = new THREE.PointLight(0xffcc66, 1.1, 14, 1.8);
  warmC.position.set(-2.2, 4.5, 2.0);
  warmC.castShadow = false;
  warmC.userData.layer = 'atriumFloor';
  warmC.userData.restY = warmC.position.y;
  group.add(warmC);

  group.userData.warmLights = [warmA, warmB, warmC];

  return group;
}

function createDiagridInstanced(material, meridians, rings) {
  const group = new THREE.Group();
  group.name = 'Diagrid';

  const strutGeo = new THREE.CylinderGeometry(0.07, 0.07, 1, 6);
  strutGeo.translate(0, 0.5, 0); // pivot at bottom
  const nodeGeo = new THREE.SphereGeometry(0.12, 8, 8);

  const strutDummy = new THREE.Object3D();
  const nodeDummy = new THREE.Object3D();

  // Collect strut transforms
  const strutMats = [];
  const nodeMats = [];
  const up = new THREE.Vector3(0, 1, 0);

  for (let m = 0; m < meridians; m += 1) {
    for (let k = 0; k < rings; k += 1) {
      const v0 = k / rings;
      const v1 = (k + 1) / rings;
      const u0 = m / meridians;
      // Primary diagonal
      const u1a = (m + 1) / meridians;
      // Counter diagonal
      const u1b = (m - 1 + meridians) / meridians;

      [[u0, v0, u1a, v1], [u0, v0, u1b, v1]].forEach(([ua, va, ub, vb]) => {
        const p0 = sampleDomePoint(ua, va, DOME);
        const p1 = sampleDomePoint(ub, vb, DOME);
        const dir = new THREE.Vector3().subVectors(p1, p0);
        const len = dir.length();
        strutDummy.position.copy(p0);
        strutDummy.quaternion.setFromUnitVectors(up, dir.clone().normalize());
        strutDummy.scale.set(1, len, 1);
        strutDummy.updateMatrix();
        strutMats.push(strutDummy.matrix.clone());
      });

      const node = sampleDomePoint(u0, v0, DOME);
      nodeDummy.position.copy(node);
      nodeDummy.scale.setScalar(1);
      nodeDummy.updateMatrix();
      nodeMats.push(nodeDummy.matrix.clone());
    }
  }

  const struts = new THREE.InstancedMesh(strutGeo, material, strutMats.length);
  strutMats.forEach((mat, i) => struts.setMatrixAt(i, mat));
  struts.instanceMatrix.needsUpdate = true;
  struts.castShadow = true;
  struts.userData.restY = 0;
  struts.userData.layer = 'atriumSteel';
  group.add(struts);

  const nodes = new THREE.InstancedMesh(nodeGeo, material, nodeMats.length);
  nodeMats.forEach((mat, i) => nodes.setMatrixAt(i, mat));
  nodes.instanceMatrix.needsUpdate = true;
  nodes.castShadow = true;
  nodes.userData.restY = 0;
  nodes.userData.layer = 'atriumSteel';
  group.add(nodes);

  return group;
}

export function updateCaustics(atrium, sunDir, intensity) {
  const spots = atrium?.userData?.causticSpots;
  if (!spots) return;
  const t = performance.now() * 0.00035;
  const shift = 3.2 * (1 - THREE.MathUtils.clamp(sunDir.y, 0.05, 1));

  // Scroll caustics texture opposite to sun azimuth so pools track light
  const tex = spots.userData.causticsTex;
  if (tex) {
    tex.offset.x = -sunDir.x * 0.35 + t * 0.02;
    tex.offset.y = -sunDir.z * 0.35 + t * 0.015;
  }
  const overlay = spots.userData.overlay;
  if (overlay) {
    overlay.position.x = -sunDir.x * shift * 0.55;
    overlay.position.z = -sunDir.z * shift * 0.55;
    overlay.material.opacity = 0.28 + intensity * 0.45;
    overlay.rotation.z = Math.atan2(sunDir.x, sunDir.z) * 0.25;
  }

  spots.children.forEach((spot, i) => {
    if (spot === overlay || spot.userData.baseX === undefined) return;
    const phase = spot.userData.phase || 0;
    spot.material.opacity = 0.14 + intensity * 0.38 + Math.sin(t + phase) * 0.05;
    spot.scale.setScalar(0.9 + intensity * 0.45 + 0.1 * Math.sin(t * 0.7 + i));
    spot.position.x = spot.userData.baseX - sunDir.x * shift;
    spot.position.z = spot.userData.baseZ - sunDir.z * shift;
  });
}
