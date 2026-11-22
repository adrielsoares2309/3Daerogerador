import gsap from 'gsap';
import * as THREE from 'three';
import { OVERVIEW_CAMERA } from '../scene/setupScene.js';

/**
 * Gerencia as transições suaves de câmera e o anel/indicador visual 3D
 * que destaca o equipamento da etapa selecionada.
 */
export function createCameraFocusController(scene, camera, controls) {
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

  /**
   * Anima suavemente a posição da câmera e o alvo do OrbitControls para uma etapa.
   *
   * @param {Object} etapa - Objeto da etapa de ETAPAS_FISICA
   * @param {() => void} [onComplete]
   */
  function focusOnStage(etapa, onComplete) {
    if (activeTimeline) {
      activeTimeline.kill();
    }

    // Atualiza o indicador luminoso sob o equipamento
    highlightGroup.visible = true;
    highlightGroup.position.set(etapa.cameraTarget.x, 0.35, etapa.cameraTarget.z);
    ringMat.color.set(etapa.corTema || '#00f5d4');
    outerRingMat.color.set(etapa.corTema || '#38bdf8');

    // Escala do anel conforme a etapa
    const ringScale = etapa.numero === 5 || etapa.numero === 6 ? 3.5 : etapa.numero <= 3 ? 2.2 : 1.6;
    highlightGroup.scale.setScalar(ringScale);

    activeTimeline = gsap.timeline({
      defaults: { duration: 1.35, ease: 'power3.inOut' },
      onComplete: () => {
        controls.enabled = true;
        if (onComplete) onComplete();
      }
    });

    activeTimeline.to(
      camera.position,
      {
        x: etapa.cameraPos.x,
        y: Math.max(2.0, etapa.cameraPos.y),
        z: etapa.cameraPos.z
      },
      0
    );

    activeTimeline.to(
      controls.target,
      {
        x: etapa.cameraTarget.x,
        y: Math.max(0.8, etapa.cameraTarget.y),
        z: etapa.cameraTarget.z,
        onUpdate: () => {
          controls.update();
        }
      },
      0
    );
  }

  /**
   * Retorna suavemente ao enquadramento de Visão Geral de toda a cadeia.
   */
  function resetToOverview(onComplete) {
    if (activeTimeline) {
      activeTimeline.kill();
    }

    highlightGroup.visible = false;

    activeTimeline = gsap.timeline({
      defaults: { duration: 1.4, ease: 'power3.inOut' },
      onComplete: () => {
        controls.enabled = true;
        if (onComplete) onComplete();
      }
    });

    activeTimeline.to(
      camera.position,
      {
        x: OVERVIEW_CAMERA.position.x,
        y: OVERVIEW_CAMERA.position.y,
        z: OVERVIEW_CAMERA.position.z
      },
      0
    );

    activeTimeline.to(
      controls.target,
      {
        x: OVERVIEW_CAMERA.target.x,
        y: OVERVIEW_CAMERA.target.y,
        z: OVERVIEW_CAMERA.target.z,
        onUpdate: () => {
          controls.update();
        }
      },
      0
    );
  }

  function updateHighlightPulse(elapsedTime) {
    if (!highlightGroup.visible) return;
    ringMesh.rotation.z = elapsedTime * 0.5;
    outerRingMesh.rotation.z = -elapsedTime * 0.3;
  }

  return {
    focusOnStage,
    resetToOverview,
    updateHighlightPulse
  };
}
