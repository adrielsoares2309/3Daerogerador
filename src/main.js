import * as THREE from 'three';
import 'katex/dist/katex.min.css';
import './style.css';

import { ETAPAS_FISICA } from './data/etapasFisica.js';
import { setupScene } from './scene/setupScene.js';
import { loadAllModels } from './scene/loadModels.js';
import { createEnergyCables } from './scene/cables.js';
import { createAnimationSystem } from './scene/animations.js';
import { setupSceneInteractions } from './scene/interactions.js';
import { createCameraFocusController } from './ui/cameraFocus.js';
import { createHotspots } from './ui/hotspots.js';
import { createStageModalController } from './ui/modal.js';
import { createHudAndSimulatorController } from './ui/hud.js';
import { createPresentationControls } from './ui/presentationControls.js';

async function initApplication() {
  const canvasContainer = document.getElementById('canvas-container');
  const labelContainer = document.getElementById('css2d-container');
  const loadingOverlay = document.getElementById('loading-overlay');
  const loadingBarFill = document.getElementById('loading-bar-fill');
  const loadingStatusText = document.getElementById('loading-status-text');
  const loadingPercentText = document.getElementById('loading-percent-text');

  function updateLoadingUI(percent, message) {
    if (loadingBarFill) loadingBarFill.style.width = `${percent}%`;
    if (loadingPercentText) loadingPercentText.textContent = `${percent}%`;
    if (loadingStatusText) loadingStatusText.textContent = message;
  }

  // 1. Inicializa Cena 3D, Câmera, Renderers e OrbitControls
  const { scene, camera, renderer, labelRenderer, controls } = setupScene(
    canvasContainer,
    labelContainer
  );

  // 2. Cria rede de cabos tridimensionais (CatmullRomCurve3) por faixa de tensão
  const { animatedCircuits } = createEnergyCables(scene);

  // 3. Carrega modelos 3D existentes (.glb) com tratamento de progresso e erro
  let rotorNodes = [];
  let equipmentGroups = {};

  try {
    const loaded = await loadAllModels(scene, updateLoadingUI);
    rotorNodes = loaded.rotorNodes;
    equipmentGroups = loaded.equipmentGroups;
  } catch (error) {
    console.error('Erro ao carregar modelos 3D:', error);
    if (loadingStatusText) {
      loadingStatusText.textContent = `Aviso: ${error.message}. Continuando visualização...`;
      loadingStatusText.style.color = '#f87171';
    }
  }

  // 4. Inicializa sistema de animação (pás do rotor com delta time + pulsos luminosos nos cabos)
  const animationSystem = createAnimationSystem(scene, rotorNodes, animatedCircuits);

  // 5. Inicializa controlador de foco de câmera (GSAP)
  const cameraController = createCameraFocusController(scene, camera, controls);

  // 6. Inicializa Hotspots 3D (CSS2DObject) e Painel Lateral Didático (KaTeX)
  let presentationControls = null;

  const stageModal = createStageModalController({
    totalStages: ETAPAS_FISICA.length,
    onClose: () => {
      hotspots.setActiveHotspot(null);
      animationSystem.setHighlightedStage(null);
      if (presentationControls) {
        presentationControls.updateActiveStageUI(null);
      }
    },
    onSelectStage: (stageNumber) => selectStage(stageNumber)
  });

  const hotspots = createHotspots(scene, ETAPAS_FISICA, (stageNumber) => {
    selectStage(stageNumber);
  });

  // 7. Função central de seleção de etapa (sincroniza câmera, painel, cabos, hotspots e barra inferior)
  function selectStage(stageNumber) {
    const etapa = ETAPAS_FISICA.find((e) => e.numero === stageNumber);
    if (!etapa) return;

    hotspots.setActiveHotspot(etapa.numero);
    animationSystem.setHighlightedStage(etapa.numero);
    stageModal.showStage(etapa);
    cameraController.focusOnStage(etapa);

    if (presentationControls) {
      presentationControls.updateActiveStageUI(etapa.numero);
    }
  }

  function returnToOverview() {
    stageModal.hide();
    hotspots.setActiveHotspot(null);
    animationSystem.setHighlightedStage(null);
    cameraController.resetToOverview();
    if (presentationControls) {
      presentationControls.updateActiveStageUI(null);
    }
  }

  function enterFreeExploration() {
    stageModal.hide();
    hotspots.setActiveHotspot(null);
    animationSystem.setHighlightedStage(null);
    if (presentationControls) {
      presentationControls.updateActiveStageUI(null);
    }
  }

  // 8. Inicializa HUD, Simulador Matemático de Geração Eólica e Ajuda
  const hudController = createHudAndSimulatorController({
    onWindSpeedChange: (speedMps) => {
      animationSystem.setWindSpeed(speedMps);
    },
    onTogglePause: () => animationSystem.togglePaused()
  });

  // 9. Inicializa Controles de Apresentação e Atalhos de Teclado
  presentationControls = createPresentationControls({
    etapas: ETAPAS_FISICA,
    onSelectStage: (stageNum) => selectStage(stageNum),
    onOverview: () => returnToOverview(),
    onFreeExplore: () => enterFreeExploration(),
    onEscape: () => {
      hudController.closeAllModals();
      if (stageModal.isOpen()) {
        enterFreeExploration();
      }
    },
    onToggleFullscreen: () => hudController.toggleFullscreen()
  });

  // 10. Interação direta por clique nas malhas 3D (Raycaster)
  setupSceneInteractions({
    camera,
    domElement: renderer.domElement,
    equipmentGroups,
    etapas: ETAPAS_FISICA,
    onSelectStage: (stageNumber) => selectStage(stageNumber)
  });

  // Oculta tela de carregamento suavemente
  if (loadingOverlay) {
    setTimeout(() => {
      loadingOverlay.classList.add('is-hidden');
    }, 350);
  }

  // 11. Loop de renderização com requestAnimationFrame e THREE.Clock (delta time)
  const clock = new THREE.Clock();

  function animate() {
    requestAnimationFrame(animate);

    const delta = clock.getDelta();
    const elapsedTime = clock.getElapsedTime();

    controls.update();
    animationSystem.update(delta, elapsedTime);
    cameraController.updateHighlightPulse(elapsedTime);

    renderer.render(scene, camera);
    labelRenderer.render(scene, camera);
  }

  animate();
}

initApplication();
