import * as THREE from 'three';

/**
 * Inspeciona um Object3D carregado via GLTFLoader, calculando seu bounding box,
 * dimensões reais, centro geométrico e localizando nós internos para animação.
 *
 * @param {THREE.Object3D} rootObject
 * @param {string} label
 */
export function inspectLoadedModel(rootObject, label = 'Model') {
  rootObject.updateMatrixWorld(true);
  const box = new THREE.Box3().setFromObject(rootObject);
  const size = new THREE.Vector3();
  const center = new THREE.Vector3();
  box.getSize(size);
  box.getCenter(center);

  let meshCount = 0;
  let vertexCount = 0;
  const nodeNames = [];

  rootObject.traverse((child) => {
    if (child.name) nodeNames.push(child.name);
    if (child.isMesh) {
      meshCount++;
      const pos = child.geometry?.attributes?.position;
      if (pos) vertexCount += pos.count;
    }
  });

  return {
    label,
    box,
    size,
    center,
    meshCount,
    vertexCount,
    nodeNames
  };
}

/**
 * Localiza o nó do rotor (cubo + pás) na hierarquia do aerogerador.
 * No modelo wind_turbine.glb existente, o nó "Turbine" possui pivô exato no eixo do cubo
 * (Y = 70.0 m, Z = -3.78 m em coordenadas do mundo do modelo), separado de "Tower".
 *
 * @param {THREE.Object3D} turbineRoot
 * @returns {THREE.Object3D|null}
 */
export function findTurbineRotorNode(turbineRoot) {
  let rotorNode = null;

  turbineRoot.traverse((child) => {
    if (rotorNode) return;
    // Prioriza o nó transformador 'Turbine' que agrupa o rotor com pivô no cubo
    if (child.name === 'Turbine' && !child.isMesh) {
      rotorNode = child;
    }
  });

  if (!rotorNode) {
    turbineRoot.traverse((child) => {
      if (rotorNode) return;
      const lower = (child.name || '').toLowerCase();
      if (
        (lower.includes('rotor') || lower.includes('turbine') || lower.includes('blade') || lower.includes('pas')) &&
        !lower.includes('tower') &&
        !lower.includes('wind turbine.fbx')
      ) {
        rotorNode = child;
      }
    });
  }

  return rotorNode;
}
