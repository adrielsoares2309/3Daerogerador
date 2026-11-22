import * as THREE from 'three';

/**
 * Permite clicar diretamente nos equipamentos 3D da cena usando THREE.Raycaster,
 * além dos hotspots HTML do CSS2DRenderer, sem conflitar com arrastos de câmera (OrbitControls).
 *
 * @param {Object} params
 * @param {THREE.Camera} params.camera
 * @param {HTMLElement} params.domElement
 * @param {Object<string, THREE.Object3D>} params.equipmentGroups
 * @param {Array} params.etapas
 * @param {(etapaNumber: number) => void} params.onSelectStage
 */
export function setupSceneInteractions({
  camera,
  domElement,
  equipmentGroups,
  etapas,
  onSelectStage,
  isPointerLocked = () => false
}) {
  const raycaster = new THREE.Raycaster();
  const pointer = new THREE.Vector2();
  const pointerDownPos = new THREE.Vector2();
  let isDragging = false;

  // Mapeia cada malha ao número da etapa correspondente
  const interactiveObjects = [];
  const equipToStageMap = {};
  etapas.forEach((etapa) => {
    // Caso duas etapas apontem para partes da turbina, a seleção por clique na malha abre a etapa principal
    if (!equipToStageMap[etapa.equipamentoAlvo]) {
      equipToStageMap[etapa.equipamentoAlvo] = etapa.numero;
    }
  });

  Object.entries(equipmentGroups).forEach(([equipKey, group]) => {
    const stageNum = equipToStageMap[equipKey];
    if (!stageNum) return;
    group.traverse((child) => {
      if (child.isMesh) {
        child.userData.stageNumber = stageNum;
        interactiveObjects.push(child);
      }
    });
  });

  function onPointerDown(event) {
    pointerDownPos.set(event.clientX, event.clientY);
    isDragging = false;
  }

  function onPointerMove(event) {
    if (pointerDownPos.distanceTo(new THREE.Vector2(event.clientX, event.clientY)) > 6) {
      isDragging = true;
    }
  }

  function onPointerUp(event) {
    if (isDragging || event.button !== 0 || isPointerLocked()) return;

    const rect = domElement.getBoundingClientRect();
    pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

    raycaster.setFromCamera(pointer, camera);
    const intersects = raycaster.intersectObjects(interactiveObjects, false);

    if (intersects.length > 0) {
      const hit = intersects[0].object;
      if (hit.userData?.stageNumber) {
        onSelectStage(hit.userData.stageNumber);
      }
    }
  }

  domElement.addEventListener('pointerdown', onPointerDown);
  domElement.addEventListener('pointermove', onPointerMove);
  domElement.addEventListener('pointerup', onPointerUp);

  return {
    dispose() {
      domElement.removeEventListener('pointerdown', onPointerDown);
      domElement.removeEventListener('pointermove', onPointerMove);
      domElement.removeEventListener('pointerup', onPointerUp);
    }
  };
}
