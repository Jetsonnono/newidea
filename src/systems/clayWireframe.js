import * as THREE from 'three';

/**
 * Architecture-school clay model + EdgesGeometry overlays.
 */
export function createClayWireframeController(building) {
  const state = {
    active: false,
    backups: [],
    edgeGroup: null,
  };

  const clayMat = new THREE.MeshStandardMaterial({
    color: 0xf2f0ea,
    roughness: 0.92,
    metalness: 0.02,
    envMapIntensity: 0.15,
    name: 'clayPlaster',
  });

  const edgeMat = new THREE.LineBasicMaterial({
    color: 0x3f4542,
    transparent: true,
    opacity: 0.78,
    depthTest: true,
    name: 'clayEdge',
  });

  function enable() {
    if (state.active) return;
    state.active = true;
    state.backups = [];

    state.edgeGroup = new THREE.Group();
    state.edgeGroup.name = 'ClayEdgeOverlays';
    building.add(state.edgeGroup);

    building.traverse((obj) => {
      if (!obj.isMesh || !obj.geometry) return;
      if (obj.userData?.isEdgeHelper) return;
      if (obj.name === 'CausticsOverlay' || obj.parent?.name === 'CausticSpots') {
        obj.userData._clayPrevVisible = obj.visible;
        obj.visible = false;
        return;
      }

      state.backups.push({
        mesh: obj,
        material: obj.material,
        castShadow: obj.castShadow,
        receiveShadow: obj.receiveShadow,
      });

      // Shared clay look (clone so wireframe toggles don't fight)
      const mat = clayMat.clone();
      // Keep slight translucency off for solid massing
      if (Array.isArray(obj.material)) {
        obj.material = obj.material.map(() => mat.clone());
      } else {
        obj.material = mat;
      }
      obj.castShadow = true;
      obj.receiveShadow = true;

      // Edges for terraces, steel ribs, petal silhouettes
      try {
        const edges = new THREE.EdgesGeometry(obj.geometry, 28);
        const lines = new THREE.LineSegments(edges, edgeMat);
        lines.userData.isEdgeHelper = true;
        // Match mesh transform via parenting
        obj.add(lines);
        lines.userData._clayOwned = true;
      } catch {
        // Some geometries may not support edges
      }
    });
  }

  function disable() {
    if (!state.active) return;
    state.active = false;

    building.traverse((obj) => {
      if (obj.userData?._clayOwned) {
        obj.parent?.remove(obj);
        obj.geometry?.dispose?.();
        delete obj.userData._clayOwned;
      }
      if (obj.userData?._clayPrevVisible !== undefined) {
        obj.visible = obj.userData._clayPrevVisible;
        delete obj.userData._clayPrevVisible;
      }
    });

    state.backups.forEach(({ mesh, material, castShadow, receiveShadow }) => {
      mesh.material = material;
      mesh.castShadow = castShadow;
      mesh.receiveShadow = receiveShadow;
    });
    state.backups = [];

    if (state.edgeGroup) {
      building.remove(state.edgeGroup);
      state.edgeGroup = null;
    }
  }

  return {
    enable,
    disable,
    get active() {
      return state.active;
    },
  };
}
