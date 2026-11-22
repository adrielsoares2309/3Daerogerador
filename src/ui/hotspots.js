import * as THREE from 'three';
import { CSS2DObject } from 'three/examples/jsm/renderers/CSS2DRenderer.js';

/**
 * Cria os hotspots 3D clicáveis associados a cada equipamento da cadeia elétrica
 * utilizando CSS2DObject para nitidez máxima em projetores.
 *
 * @param {THREE.Scene} scene
 * @param {Array} etapas - Lista de etapas de ETAPAS_FISICA
 * @param {(stageNumber: number) => void} onSelectStage
 */
export function createHotspots(scene, etapas, onSelectStage) {
  const hotspotsGroup = new THREE.Group();
  hotspotsGroup.name = 'CSS2D_Hotspots_Group';

  const hotspotElements = new Map();

  etapas.forEach((etapa) => {
    const wrapper = document.createElement('div');
    wrapper.className = 'hotspot-wrapper';

    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'hotspot-btn';
    btn.dataset.stage = String(etapa.numero);
    btn.style.setProperty('--stage-color', etapa.corTema);
    btn.setAttribute('aria-label', `Abrir Etapa ${etapa.numero}: ${etapa.titulo}`);

    btn.innerHTML = `
      <span class="hotspot-pulse"></span>
      <span class="hotspot-badge">${etapa.numero}</span>
      <span class="hotspot-info">
        <span class="hotspot-title">${etapa.tituloCurto.replace(/^\d+\.\s*/, '')}</span>
        <span class="hotspot-voltage">${etapa.faixaTensaoId ? etapa.tensao.split('→').pop().trim() : 'Mecânica / Cinética'}</span>
      </span>
    `;

    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      onSelectStage(etapa.numero);
    });

    wrapper.appendChild(btn);

    const css2dObj = new CSS2DObject(wrapper);
    css2dObj.position.set(
      etapa.posicaoHotspot.x,
      etapa.posicaoHotspot.y,
      etapa.posicaoHotspot.z
    );
    css2dObj.name = `Hotspot_Stage_${etapa.numero}`;
    hotspotsGroup.add(css2dObj);

    hotspotElements.set(etapa.numero, btn);
  });

  scene.add(hotspotsGroup);

  /**
   * Atualiza o estado ativo dos hotspots na cena 3D.
   *
   * @param {number|null} activeStageNumber
   */
  function setActiveHotspot(activeStageNumber) {
    hotspotElements.forEach((btn, stageNum) => {
      if (stageNum === activeStageNumber) {
        btn.classList.add('is-active');
      } else {
        btn.classList.remove('is-active');
      }
    });
  }

  return {
    hotspotsGroup,
    setActiveHotspot
  };
}
