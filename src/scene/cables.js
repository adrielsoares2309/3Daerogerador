import * as THREE from 'three';
import { CHAIN_ANCHORS } from './loadModels.js';

/**
 * Cores regulamentares por faixa de tensão conforme especificação científica:
 * - Saída do gerador (690 V a 1.000 V): Verde/ciano (#00f5d4)
 * - Rede coletora (34,5 kV): Amarelo (#facc15)
 * - Transmissão (138 / 230 / 500 kV): Vermelho (#ef4444)
 * - Distribuição primária (13,8 kV): Laranja (#f97316)
 * - Distribuição secundária e consumo (127 / 220 / 380 V): Azul (#3b82f6)
 */
export const VOLTAGE_COLORS = {
  generatorBT: 0x00f5d4,
  collectorMT: 0xfacc15,
  transmissionAT: 0xef4444,
  primaryDist: 0xf97316,
  secondaryDist: 0x3b82f6
};

/**
 * Constrói todos os cabos elétricos da cadeia utilizando curvas tridimensionais
 * CatmullRomCurve3 (com catenárias naturais) e prepara os caminhos para os pulsos luminosos.
 *
 * IMPORTANTE: O fluxo elétrico começa na saída elétrica do gerador/conversor na nacele
 * (nunca saindo diretamente das pás) e vai até a tomada residencial.
 *
 * @param {THREE.Scene} scene
 */
export function createEnergyCables(scene) {
  const cablesGroup = new THREE.Group();
  cablesGroup.name = 'Electrical_Cables_Network';

  const animatedCircuits = [];

  /**
   * Cria um cabo 3D com TubeGeometry e registra sua curva para animação de pulsos de energia.
   */
  function addCableSegment({
    id,
    etapaAssociada,
    points,
    colorHex,
    radius = 0.14,
    pulseCount = 5,
    pulseSpeed = 0.22,
    pulseRadius = 0.36
  }) {
    const curve = new THREE.CatmullRomCurve3(points, false, 'catmullrom', 0.5);
    const tubularSegments = Math.max(32, points.length * 16);
    const tubeGeo = new THREE.TubeGeometry(curve, tubularSegments, radius, 8, false);

    const tubeMat = new THREE.MeshStandardMaterial({
      color: colorHex,
      emissive: colorHex,
      emissiveIntensity: 0.28,
      roughness: 0.4,
      metalness: 0.5
    });

    const tubeMesh = new THREE.Mesh(tubeGeo, tubeMat);
    tubeMesh.name = `Cable_${id}`;
    cablesGroup.add(tubeMesh);

    animatedCircuits.push({
      id,
      etapaAssociada,
      curve,
      colorHex,
      pulseCount,
      pulseSpeed,
      pulseRadius,
      tubeMesh,
      tubeMat
    });
  }

  // =========================================================================
  // 1. SAÍDA DO GERADOR / CONVERSOR (690 V a 1.000 V) — COR: VERDE / CIANO
  // Desce pelo interior da torre do aerogerador até o transformador elevador na base
  // =========================================================================
  addCableSegment({
    id: 'gerador-para-trafo-base',
    etapaAssociada: 3,
    colorHex: VOLTAGE_COLORS.generatorBT,
    radius: 0.22,
    pulseCount: 6,
    pulseSpeed: 0.26,
    pulseRadius: 0.48,
    points: [
      CHAIN_ANCHORS.turbineMain.generatorOut,
      new THREE.Vector3(-250, 50, -25),
      new THREE.Vector3(-250, 25, -25),
      CHAIN_ANCHORS.turbineMain.towerBottomOut,
      new THREE.Vector3(-246, 2.2, -23.5),
      CHAIN_ANCHORS.stepUpPadTransformer.lowVoltageIn
    ]
  });

  // =========================================================================
  // 2. REDE COLETORA DE MÉDIA TENSÃO (34,5 kV) — COR: AMARELO
  // Conecta a saída do transformador da turbina (e turbinas do parque) à Subestação Elevadora
  // =========================================================================
  addCableSegment({
    id: 'rede-coletora-principal-34kv',
    etapaAssociada: 4,
    colorHex: VOLTAGE_COLORS.collectorMT,
    radius: 0.22,
    pulseCount: 8,
    pulseSpeed: 0.22,
    pulseRadius: 0.52,
    points: [
      CHAIN_ANCHORS.stepUpPadTransformer.mediumVoltageOut,
      new THREE.Vector3(-232, 1.4, -15),
      new THREE.Vector3(-205, 1.2, -4),
      new THREE.Vector3(-175, 1.2, 6),
      new THREE.Vector3(-152, 2.0, 11),
      CHAIN_ANCHORS.stepUpSubstation.collectorIn
    ]
  });

  // Ramais coletores das outras duas turbinas do parque convergindo para a subestação
  addCableSegment({
    id: 'rede-coletora-turbina-2',
    etapaAssociada: 4,
    colorHex: VOLTAGE_COLORS.collectorMT,
    radius: 0.16,
    pulseCount: 5,
    pulseSpeed: 0.20,
    pulseRadius: 0.42,
    points: [
      new THREE.Vector3(-285, 2.0, -76),
      new THREE.Vector3(-260, 1.2, -45),
      new THREE.Vector3(-205, 1.2, -4)
    ]
  });

  addCableSegment({
    id: 'rede-coletora-turbina-3',
    etapaAssociada: 4,
    colorHex: VOLTAGE_COLORS.collectorMT,
    radius: 0.16,
    pulseCount: 5,
    pulseSpeed: 0.21,
    pulseRadius: 0.42,
    points: [
      new THREE.Vector3(-210, 2.0, -80),
      new THREE.Vector3(-190, 1.2, -38),
      new THREE.Vector3(-175, 1.2, 6)
    ]
  });

  // =========================================================================
  // 3. LINHAS DE TRANSMISSÃO DE ALTA TENSÃO (138 / 230 / 500 kV) — COR: VERMELHO
  // Sistema Trifásico (Fases A, B, C) com catenária realista entre Subestação Elevadora -> Torres -> Subestação Abaixadora
  // =========================================================================
  const sag1 = [20.5, 17.5, 13.5]; // Altura no meio do vão Subestação Elevadora -> Torre 1
  const sag2 = [23.0, 18.0, 13.0]; // Altura no meio do vão Torre 1 -> Torre 2
  const sag3 = [20.5, 17.5, 13.5]; // Altura no meio do vão Torre 2 -> Subestação Abaixadora

  for (let phase = 0; phase < 3; phase++) {
    const startSub = CHAIN_ANCHORS.stepUpSubstation.highVoltageGantryOut[phase];
    const p1Arm = CHAIN_ANCHORS.pylon1.armsLeft[phase];
    const p2Arm = CHAIN_ANCHORS.pylon2.armsLeft[phase];
    const endSub = CHAIN_ANCHORS.stepDownSubstation.highVoltageGantryIn[phase];

    // Vão 1: Subestação Elevadora -> Torre 1
    const mid1 = new THREE.Vector3().addVectors(startSub, p1Arm).multiplyScalar(0.5);
    mid1.y = sag1[phase];

    // Vão 2: Torre 1 -> Torre 2
    const mid2 = new THREE.Vector3().addVectors(p1Arm, p2Arm).multiplyScalar(0.5);
    mid2.y = sag2[phase];

    // Vão 3: Torre 2 -> Subestação Abaixadora
    const mid3 = new THREE.Vector3().addVectors(p2Arm, endSub).multiplyScalar(0.5);
    mid3.y = sag3[phase];

    addCableSegment({
      id: `transmissao-at-fase-${phase + 1}`,
      etapaAssociada: 5,
      colorHex: VOLTAGE_COLORS.transmissionAT,
      radius: 0.16,
      pulseCount: 10,
      pulseSpeed: 0.18 + phase * 0.01,
      pulseRadius: 0.52,
      points: [startSub, mid1, p1Arm, mid2, p2Arm, mid3, endSub]
    });
  }

  // Segundo circuito trifásico nos braços direitos das torres
  for (let phase = 0; phase < 3; phase++) {
    const startSub = CHAIN_ANCHORS.stepUpSubstation.highVoltageGantryOut[phase].clone().add(new THREE.Vector3(0, 0, 3));
    const p1Arm = CHAIN_ANCHORS.pylon1.armsRight[phase];
    const p2Arm = CHAIN_ANCHORS.pylon2.armsRight[phase];
    const endSub = CHAIN_ANCHORS.stepDownSubstation.highVoltageGantryIn[phase].clone().add(new THREE.Vector3(0, 0, 3));

    const mid1 = new THREE.Vector3().addVectors(startSub, p1Arm).multiplyScalar(0.5);
    mid1.y = sag1[phase];
    const mid2 = new THREE.Vector3().addVectors(p1Arm, p2Arm).multiplyScalar(0.5);
    mid2.y = sag2[phase];
    const mid3 = new THREE.Vector3().addVectors(p2Arm, endSub).multiplyScalar(0.5);
    mid3.y = sag3[phase];

    addCableSegment({
      id: `transmissao-at-circ2-fase-${phase + 1}`,
      etapaAssociada: 5,
      colorHex: VOLTAGE_COLORS.transmissionAT,
      radius: 0.13,
      pulseCount: 7,
      pulseSpeed: 0.19,
      pulseRadius: 0.44,
      points: [startSub, mid1, p1Arm, mid2, p2Arm, mid3, endSub]
    });
  }

  // =========================================================================
  // 4. REDE DE DISTRIBUIÇÃO PRIMÁRIA URBANA (13,8 kV) — COR: LARANJA
  //Três fios no topo dos postes urbanos conectando a Subestação Abaixadora -> Poste 1 -> Poste 2 -> Transformador de Poste
  // =========================================================================
  for (let phase = 0; phase < 3; phase++) {
    const subOut = CHAIN_ANCHORS.stepDownSubstation.primaryDistOut[phase];
    const pole1Top = CHAIN_ANCHORS.pole1.primaryTop[phase];
    const pole2Top = CHAIN_ANCHORS.pole2.primaryTop[phase];

    const midSubPole1 = new THREE.Vector3().addVectors(subOut, pole1Top).multiplyScalar(0.5);
    midSubPole1.y = 10.6;

    const midPole1Pole2 = new THREE.Vector3().addVectors(pole1Top, pole2Top).multiplyScalar(0.5);
    midPole1Pole2.y = 12.2;

    const points = [subOut, midSubPole1, pole1Top, midPole1Pole2, pole2Top];
    if (phase === 1) {
      // Descida pela chave fusível até a bucha primária do transformador de poste
      points.push(
        new THREE.Vector3(221.6, 12.0, 5.0),
        CHAIN_ANCHORS.pole2.transformerIn
      );
    }

    addCableSegment({
      id: `distribuicao-primaria-13kv-fase-${phase + 1}`,
      etapaAssociada: 6,
      colorHex: VOLTAGE_COLORS.primaryDist,
      radius: 0.12,
      pulseCount: 7,
      pulseSpeed: 0.24,
      pulseRadius: 0.42,
      points
    });
  }

  // =========================================================================
  // 5. REDE SECUNDÁRIA E RAMAL RESIDENCIAL (127 V / 220 V / 380 V) — COR: AZUL
  // Saída em baixa tensão do transformador do poste -> Rede secundária -> Padrão de Entrada -> Medidor -> QDC -> Tomada
  // =========================================================================
  addCableSegment({
    id: 'rede-secundaria-entre-postes',
    etapaAssociada: 7,
    colorHex: VOLTAGE_COLORS.secondaryDist,
    radius: 0.11,
    pulseCount: 4,
    pulseSpeed: 0.22,
    pulseRadius: 0.36,
    points: [
      CHAIN_ANCHORS.pole2.secondaryOut,
      new THREE.Vector3(201, 8.5, 5.4),
      CHAIN_ANCHORS.pole1.secondaryLow
    ]
  });

  addCableSegment({
    id: 'ramal-ligacao-ate-tomada-residencial',
    etapaAssociada: 7,
    colorHex: VOLTAGE_COLORS.secondaryDist,
    radius: 0.13,
    pulseCount: 8,
    pulseSpeed: 0.28,
    pulseRadius: 0.42,
    points: [
      CHAIN_ANCHORS.pole2.transformerBox,
      CHAIN_ANCHORS.pole2.secondaryOut,
      new THREE.Vector3(238, 7.2, 6.3),
      CHAIN_ANCHORS.residence.serviceMastTop,
      CHAIN_ANCHORS.residence.meterBox,
      new THREE.Vector3(255.5, 1.8, 6.5),
      CHAIN_ANCHORS.residence.qdcBoard,
      new THREE.Vector3(261.2, 1.6, 5.0),
      CHAIN_ANCHORS.residence.internalSocket
    ]
  });

  scene.add(cablesGroup);

  return {
    cablesGroup,
    animatedCircuits
  };
}
