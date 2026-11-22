import gsap from 'gsap';
import * as THREE from 'three';
import { OVERVIEW_CAMERA } from '../scene/setupScene.js';

/**
 * Gerencia as transições suaves de câmera (compatíveis tanto com o Modo Livre
 * quanto com o Modo Órbita) e o anel/indicador visual 3D de foco no equipamento.
 */
export function createCameraFocusController(scene, camera, navigationControls) {
  // Indicador luminoso 3D no solo/equipamento para destacar o componente em foco
  const highlightGroup = new THREE.Group();
  highlightGroup.name = 'Equipment_Focus_Indicator';
  highlightGroup.visible = false;

  const ringGeo = new THREE.RingGeometry(4.5, 5.4, 48);
  ringGeo.rotateX(-Math.PI / 2);
  const ringMat = new THREE.MeshBasicMaterial({
    color: 0x00f5d4,
    side: THREE.DoubleSide,
    transparent: true,
    opacity: 0.75
  });
  const ringMesh = new THREE.Mesh(ringGeo, ringMat);
  highlightGroup.add(ringMesh);

  const outerRingGeo = new THREE.RingGeometry(6.2, 6.5, 48);
  outerRingGeo.rotateX(-Math.PI / 2);
  const outerRingMat = new THREE.MeshBasicMaterial({
    color: 0x38bdf8,
    side: THREE.DoubleSide,
    transparent: true,
    opacity: 0.4
  });
  const outerRingMesh = new THREE.Mesh(outerRingGeo, outerRingMat);
  highlightGroup.add(outerRingMesh);

  scene.add(highlightGroup);

  let activeTimeline = null;
  const lookTargetProxy = new THREE.Vector3();

  function cancelTransition() {
    if (activeTimeline) {
      activeTimeline.kill();
      activeTimeline = null;
      navigationControls.endTransition();
    }
  }

  /**
   * Anima suavemente a posição e orientação da câmera para um destino (pos + lookAt),
   * funcionando de forma idêntica no Modo Livre e no Modo Órbita.
   */
  function animateCameraTo(destPos, destLookAt, duration = 1.35, onComplete) {
    if (activeTimeline) {
      activeTimeline.kill();
      activeTimeline = null;
    }

    // Captura o alvo atual de visão antes de pausar os controles
    navigationControls.getCurrentLookTarget(lookTargetProxy);
    navigationControls.beginTransition();

    const finalTarget = new THREE.Vector3(
      destLookAt.x,
      Math.max(0.8, destLookAt.y),
      destLookAt.z
    );

    activeTimeline = gsap.timeline({
      defaults: { duration, ease: 'power3.inOut' },
      onComplete: () => {
        activeTimeline = null;
        navigationControls.endTransition(finalTarget);
        if (onComplete) onComplete();
      }
    });

    activeTimeline.to(
      camera.position,
      {
        x: destPos.x,
        y: Math.max(2.0, destPos.y),
        z: destPos.z
      },
      0
    );

    activeTimeline.to(
      lookTargetProxy,
      {
        x: finalTarget.x,
        y: finalTarget.y,
        z: finalTarget.z,
        onUpdate: () => {
          navigationControls.syncLookAt(lookTargetProxy);
        }
      },
      0
    );
  }

  /**
   * Anima suavemente a câmera para focar o equipamento de uma etapa específica.
   *
   * @param {Object} etapa - Objeto da etapa de ETAPAS_FISICA
   * @param {() => void} [onComplete]
   */
  function focusOnStage(etapa, onComplete) {
    highlightGroup.visible = true;
    highlightGroup.position.set(etapa.cameraTarget.x, 0.35, etapa.cameraTarget.z);
    ringMat.color.set(etapa.corTema || '#00f5d4');
    outerRingMat.color.set(etapa.corTema || '#38bdf8');

    const ringScale =
      etapa.numero === 5 || etapa.numero === 6 ? 3.5 : etapa.numero <= 3 ? 2.2 : 1.6;
    highlightGroup.scale.setScalar(ringScale);

    animateCameraTo(etapa.cameraPos, etapa.cameraTarget, 1.35, onComplete);
  }

  /**
   * Redefine a posição e orientação inicial da câmera (Visão Geral padrão).
   */
  function resetToOverview(onComplete) {
    highlightGroup.visible = false;
    animateCameraTo(OVERVIEW_CAMERA.position, OVERVIEW_CAMERA.target, 1.35, onComplete);
  }

  /**
   * Enquadra dinamicamente toda a estrutura 3D da usina (do aerogerador à residência)
   * considerando o aspect ratio atual da viewport para compatibilidade com qualquer resolução.
   *
   * @param {Object<string, THREE.Object3D>} equipmentGroups
   * @param {() => void} [onComplete]
   */
  function frameFullStructure(equipmentGroups, onComplete) {
    highlightGroup.visible = false;

    const bounds = new THREE.Box3();
    Object.values(equipmentGroups || {}).forEach((group) => {
      if (group) {
        group.updateMatrixWorld(true);
        bounds.expandByObject(group);
      }
    });

    if (bounds.isEmpty()) {
      resetToOverview(onComplete);
      return;
    }

    const center = new THREE.Vector3();
    const size = new THREE.Vector3();
    bounds.getCenter(center);
    bounds.getSize(size);

    const vFov = THREE.MathUtils.degToRad(camera.fov);
    const hFov = 2 * Math.atan(Math.tan(vFov / 2) * Math.max(camera.aspect, 0.6));

    const distForWidth = (size.x * 0.56) / Math.tan(hFov / 2);
    const distForHeight = (Math.max(size.y, 90) * 0.65) / Math.tan(vFov / 2);
    const fitDistance = THREE.MathUtils.clamp(
      Math.max(distForWidth, distForHeight) + size.z * 0.45,
      240,
      580
    );

    const destTarget = {
      x: center.x,
      y: Math.max(18, center.y * 0.45),
      z: center.z
    };

    const destPos = {
      x: center.x + fitDistance * 0.04,
      y: Math.max(105, fitDistance * 0.36),
      z: center.z + fitDistance * 0.92
    };

    animateCameraTo(destPos, destTarget, 1.4, onComplete);
  }

  function updateHighlightPulse(elapsedTime) {
    if (!highlightGroup.visible) return;
    ringMesh.rotation.z = elapsedTime * 0.5;
    outerRingMesh.rotation.z = -elapsedTime * 0.3;
  }

  return {
    focusOnStage,
    resetToOverview,
    frameFullStructure,
    cancelTransition,
    updateHighlightPulse
  };
}
