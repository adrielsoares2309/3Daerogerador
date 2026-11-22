import * as THREE from 'three';

/**
 * Gerencia todas as animações contínuas da cena 3D com delta time (independente de FPS):
 * 1. Rotação física das pás do aerogerador no eixo Z local do nó "Turbine" (sem girar a torre ou nacele).
 * 2. Pulsos luminosos de energia percorrendo os cabos usando InstancedMesh (alta performance, zero alocações no loop).
 * 3. Destaque visual dos cabos da etapa selecionada.
 */
export function createAnimationSystem(scene, rotorNodes, animatedCircuits) {
  let isPaused = false;
  let windSpeedMps = 10; // Sincronizado com o Simulador de Geração Eólica
  let activeStageNumber = null;

  // Calcula total de partículas/pulsos para usar um único InstancedMesh ou um por faixa de cor
  const sphereGeo = new THREE.SphereGeometry(1, 12, 12);
  const pulseGroups = [];
  const dummy = new THREE.Object3D();
  const tempPoint = new THREE.Vector3();

  animatedCircuits.forEach((circuit) => {
    const mat = new THREE.MeshBasicMaterial({
      color: circuit.colorHex
    });

    const instancedMesh = new THREE.InstancedMesh(sphereGeo, mat, circuit.pulseCount);
    instancedMesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    instancedMesh.name = `Pulses_${circuit.id}`;
    scene.add(instancedMesh);

    const offsets = [];
    for (let i = 0; i < circuit.pulseCount; i++) {
      offsets.push(i / circuit.pulseCount);
    }

    pulseGroups.push({
      circuit,
      instancedMesh,
      mat,
      offsets
    });
  });

  /**
   * Loop de atualização executado a cada frame via requestAnimationFrame(delta).
   * Não aloca novos objetos vetoriais na memória.
   *
   * @param {number} delta - Tempo decorrido desde o último frame em segundos
   * @param {number} elapsedTime - Tempo total acumulado em segundos
   */
  function update(delta, elapsedTime) {
    // Limita delta caso a aba tenha ficado em segundo plano
    const safeDelta = Math.min(delta, 0.1);

    if (!isPaused) {
      // 1. Rotação das pás do aerogerador proporcional à velocidade do vento
      // Em 10 m/s -> ~15 RPM = 1.57 rad/s. Abaixo do cut-in (3 m/s) ou acima do cut-out (25 m/s), desacelera.
      let angularVelocity = 0;
      if (windSpeedMps >= 3 && windSpeedMps <= 25) {
        const effectiveWind = Math.min(windSpeedMps, 15);
        angularVelocity = (effectiveWind / 10) * 1.35;
      }

      for (let i = 0; i < rotorNodes.length; i++) {
        const item = rotorNodes[i];
        // O eixo do cubo em wind_turbine.glb aponta ao longo de Z local
        item.node.rotation.z -= safeDelta * angularVelocity * item.speedMultiplier;
      }

      // 2. Atualização dos pulsos luminosos nos cabos elétricos
      const flowSpeedFactor = windSpeedMps >= 3 && windSpeedMps <= 25 ? Math.max(0.45, windSpeedMps / 10) : 0.15;

      for (let g = 0; g < pulseGroups.length; g++) {
        const group = pulseGroups[g];
        const { circuit, instancedMesh, offsets } = group;
        const isHighlighted = activeStageNumber === null || activeStageNumber === circuit.etapaAssociada;
        const baseScale = circuit.pulseRadius * (isHighlighted ? 1.22 : 0.75);

        for (let i = 0; i < offsets.length; i++) {
          offsets[i] = (offsets[i] + safeDelta * circuit.pulseSpeed * flowSpeedFactor) % 1.0;
          const t = offsets[i];

          circuit.curve.getPointAt(t, tempPoint);
          dummy.position.copy(tempPoint);

          // Efeito sutil de pulsação senoidal
          const pulseWave = 0.88 + 0.24 * Math.sin(elapsedTime * 5 + i * 1.7);
          dummy.scale.setScalar(baseScale * pulseWave);
          dummy.updateMatrix();
          instancedMesh.setMatrixAt(i, dummy.matrix);
        }
        instancedMesh.instanceMatrix.needsUpdate = true;
      }
    }
  }

  /**
   * Destaca os cabos relacionados à etapa selecionada (ou restaura todos na visão geral).
   *
   * @param {number|null} stageNumber
   */
  function setHighlightedStage(stageNumber) {
    activeStageNumber = stageNumber;
    for (let g = 0; g < pulseGroups.length; g++) {
      const { circuit } = pulseGroups[g];
      const isMatch = stageNumber === null || circuit.etapaAssociada === stageNumber;
      circuit.tubeMat.emissiveIntensity = isMatch ? 0.55 : 0.12;
      circuit.tubeMat.opacity = isMatch ? 1.0 : 0.45;
      circuit.tubeMat.transparent = !isMatch;
    }
  }

  function setPaused(paused) {
    isPaused = Boolean(paused);
    return isPaused;
  }

  function togglePaused() {
    isPaused = !isPaused;
    return isPaused;
  }

  function setWindSpeed(speedMps) {
    windSpeedMps = Number(speedMps) || 10;
  }

  return {
    update,
    setHighlightedStage,
    setPaused,
    togglePaused,
    setWindSpeed,
    get isPaused() {
      return isPaused;
    }
  };
}
