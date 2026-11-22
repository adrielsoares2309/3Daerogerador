import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader.js';
import { findTurbineRotorNode, inspectLoadedModel } from '../utils/modelInspection.js';

/**
 * Coordenadas âncora exatas de toda a cadeia de geração, transmissão e distribuição
 * para alinhamento perfeito entre modelos 3D, cabos, pulsos e hotspots.
 */
export const CHAIN_ANCHORS = {
  // 1. Parque Eólico (Turbina Principal + 2 Turbinas de Fundo)
  turbineMain: {
    base: new THREE.Vector3(-250, 0, -25),
    hub: new THREE.Vector3(-250, 70, -28.78),
    nacelle: new THREE.Vector3(-250, 70, -25),
    generatorOut: new THREE.Vector3(-250, 68.5, -25),
    towerBottomOut: new THREE.Vector3(-250, 2.5, -25)
  },
  // 2. Transformador Elevador da Turbina (690 V -> 34,5 kV)
  stepUpPadTransformer: {
    center: new THREE.Vector3(-241, 2.2, -21),
    lowVoltageIn: new THREE.Vector3(-242.6, 2.4, -21.8),
    mediumVoltageOut: new THREE.Vector3(-239.2, 3.6, -20.2)
  },
  // 3. Subestação Elevadora (34,5 kV -> 230/500 kV)
  stepUpSubstation: {
    center: new THREE.Vector3(-120, 0, 15),
    collectorIn: new THREE.Vector3(-142, 4.5, 12),
    highVoltageGantryOut: [
      new THREE.Vector3(-98, 13.5, 11),
      new THREE.Vector3(-98, 13.5, 15),
      new THREE.Vector3(-98, 13.5, 19)
    ]
  },
  // 4. Torres de Transmissão de Alta Tensão (138 / 230 / 500 kV)
  pylon1: {
    base: new THREE.Vector3(-42, 0, -15),
    armsLeft: [
      new THREE.Vector3(-42, 30.5, -19.5),
      new THREE.Vector3(-42, 24.5, -20.5),
      new THREE.Vector3(-42, 18.5, -19.5)
    ],
    armsRight: [
      new THREE.Vector3(-42, 30.5, -10.5),
      new THREE.Vector3(-42, 24.5, -9.5),
      new THREE.Vector3(-42, 18.5, -10.5)
    ],
    shieldTop: new THREE.Vector3(-42, 38.2, -15)
  },
  pylon2: {
    base: new THREE.Vector3(42, 0, -15),
    armsLeft: [
      new THREE.Vector3(42, 30.5, -19.5),
      new THREE.Vector3(42, 24.5, -20.5),
      new THREE.Vector3(42, 18.5, -19.5)
    ],
    armsRight: [
      new THREE.Vector3(42, 30.5, -10.5),
      new THREE.Vector3(42, 24.5, -9.5),
      new THREE.Vector3(42, 18.5, -10.5)
    ],
    shieldTop: new THREE.Vector3(42, 38.2, -15)
  },
  // 5. Subestação Abaixadora (230/500 kV -> 13,8 kV)
  stepDownSubstation: {
    center: new THREE.Vector3(120, 0, 15),
    highVoltageGantryIn: [
      new THREE.Vector3(98, 13.5, 11),
      new THREE.Vector3(98, 13.5, 15),
      new THREE.Vector3(98, 13.5, 19)
    ],
    primaryDistOut: [
      new THREE.Vector3(142, 9.5, 4.2),
      new THREE.Vector3(142, 9.5, 5.0),
      new THREE.Vector3(142, 9.5, 5.8)
    ]
  },
  // 6. Postes Urbanos e Transformador de Poste (13,8 kV -> 127/220 V)
  pole1: {
    base: new THREE.Vector3(180, 0, 5),
    primaryTop: [
      new THREE.Vector3(180, 13.5, 4.1),
      new THREE.Vector3(180, 13.5, 5.0),
      new THREE.Vector3(180, 13.5, 5.9)
    ],
    secondaryLow: new THREE.Vector3(180, 9.4, 5.4)
  },
  pole2: {
    base: new THREE.Vector3(222, 0, 5),
    primaryTop: [
      new THREE.Vector3(222, 13.5, 4.1),
      new THREE.Vector3(222, 13.5, 5.0),
      new THREE.Vector3(222, 13.5, 5.9)
    ],
    transformerIn: new THREE.Vector3(221.3, 10.6, 5.0),
    transformerBox: new THREE.Vector3(221.2, 9.8, 5.0),
    secondaryOut: new THREE.Vector3(222.2, 9.0, 5.4)
  },
  // 7. Padrão de Entrada e Residência (127/220 V)
  residence: {
    center: new THREE.Vector3(266, 0, 5),
    serviceMastTop: new THREE.Vector3(253.5, 6.4, 7.2),
    meterBox: new THREE.Vector3(253.5, 1.8, 7.2),
    qdcBoard: new THREE.Vector3(258.0, 2.2, 5.5),
    internalSocket: new THREE.Vector3(264.5, 1.2, 4.5)
  }
};

/**
 * Carrega todos os modelos .glb originais do repositório de maneira assíncrona,
 * posiciona-os na cadeia espacial e retorna referências para animação e destaque.
 *
 * @param {THREE.Scene} scene
 * @param {(progress: number, statusText: string) => void} onProgress
 */
export async function loadAllModels(scene, onProgress = () => {}) {
  const manager = new THREE.LoadingManager();
  const gltfLoader = new GLTFLoader(manager);

  // Configura DRACOLoader caso algum modelo futuro utilize compressão Draco
  const dracoLoader = new DRACOLoader();
  dracoLoader.setDecoderPath('./draco/');
  gltfLoader.setDRACOLoader(dracoLoader);

  const equipmentGroups = {
    'turbina-rotor': new THREE.Group(),
    'turbina-nacele': new THREE.Group(),
    'turbina-gerador': new THREE.Group(),
    'transformador-base': new THREE.Group(),
    'subestacao-elevadora': new THREE.Group(),
    'distribuicao-urbana': new THREE.Group(),
    'residencia-consumo': new THREE.Group()
  };

  Object.entries(equipmentGroups).forEach(([key, grp]) => {
    grp.name = `EquipGroup_${key}`;
    scene.add(grp);
  });

  const rotorNodes = [];
  const inspectionReports = [];

  const loadGltf = (url, label, weightStart, weightEnd) =>
    new Promise((resolve, reject) => {
      onProgress(weightStart, `Carregando ${label}...`);
      gltfLoader.load(
        url,
        (gltf) => {
          onProgress(weightEnd, `${label} carregado.`);
          resolve(gltf);
        },
        (xhr) => {
          if (xhr.lengthComputable && xhr.total > 0) {
            const ratio = xhr.loaded / xhr.total;
            const current = Math.round(weightStart + ratio * (weightEnd - weightStart));
            onProgress(current, `Carregando ${label} (${Math.round(ratio * 100)}%)...`);
          }
        },
        (err) => {
          reject(new Error(`Falha ao carregar ${url}: ${err?.message || err}`));
        }
      );
    });

  // 1. Carrega Aerogerador (wind_turbine.glb)
  const turbineGltf = await loadGltf('./wind_turbine.glb', 'Aerogerador 3D (wind_turbine.glb)', 5, 25);
  const mainTurbine = turbineGltf.scene;
  mainTurbine.position.copy(CHAIN_ANCHORS.turbineMain.base);

  mainTurbine.traverse((child) => {
    if (child.isMesh) {
      child.castShadow = true;
      child.receiveShadow = true;
    }
  });

  const mainRotor = findTurbineRotorNode(mainTurbine);
  if (mainRotor) {
    rotorNodes.push({ node: mainRotor, speedMultiplier: 1.0 });
  }

  equipmentGroups['turbina-rotor'].add(mainTurbine);
  inspectionReports.push(inspectLoadedModel(mainTurbine, 'wind_turbine.glb'));

  // Duas turbinas adicionais no parque eólico ao fundo para compor a Rede Coletora
  const bgTurbineOffsets = [
    { pos: new THREE.Vector3(-285, 0, -78), scale: 0.85, speed: 0.92 },
    { pos: new THREE.Vector3(-210, 0, -82), scale: 0.85, speed: 1.06 }
  ];
  bgTurbineOffsets.forEach((cfg, idx) => {
    const clone = mainTurbine.clone(true);
    clone.position.copy(cfg.pos);
    clone.scale.setScalar(cfg.scale);
    const cloneRotor = findTurbineRotorNode(clone);
    if (cloneRotor) {
      rotorNodes.push({ node: cloneRotor, speedMultiplier: cfg.speed });
    }
    scene.add(clone);
    clone.name = `WindTurbine_Park_${idx + 2}`;
  });

  // Construção do Transformador Elevador da Base (Etapa 4: 690 V -> 34,5 kV) e módulo interno didático da Nacele
  buildTurbineTransformerAndCutaway(equipmentGroups);

  // 2. Carrega Torre de Transmissão (high_voltage_pylon.glb)
  const pylonGltf = await loadGltf('./high_voltage_pylon.glb', 'Torres de Alta Tensão (high_voltage_pylon.glb)', 26, 40);
  const pylonTemplate = pylonGltf.scene;
  inspectionReports.push(inspectLoadedModel(pylonTemplate, 'high_voltage_pylon.glb'));

  // Normaliza origem da torre e escala para ~38 m de altura
  pylonTemplate.updateMatrixWorld(true);
  const pylonBox = new THREE.Box3().setFromObject(pylonTemplate);
  const pylonCenter = new THREE.Vector3();
  pylonBox.getCenter(pylonCenter);

  [CHAIN_ANCHORS.pylon1.base, CHAIN_ANCHORS.pylon2.base].forEach((basePos, idx) => {
    const pylonWrapper = new THREE.Group();
    pylonWrapper.name = `HighVoltagePylon_${idx + 1}`;
    const instance = pylonTemplate.clone(true);
    const scale = 1.15;
    instance.scale.setScalar(scale);
    instance.position.set(
      -pylonCenter.x * scale,
      -pylonBox.min.y * scale,
      -pylonCenter.z * scale
    );
    instance.traverse((c) => {
      if (c.isMesh) {
        c.castShadow = true;
        c.receiveShadow = true;
        if (c.material) {
          c.material = c.material.clone();
          c.material.color = new THREE.Color(0x94a3b8);
          c.material.metalness = 0.65;
          c.material.roughness = 0.35;
        }
      }
    });
    pylonWrapper.position.copy(basePos);
    pylonWrapper.add(instance);
    equipmentGroups['subestacao-elevadora'].add(pylonWrapper);
  });

  // 3. Carrega Poste Urbano com Transformador (power_pole_3d_game_asset.glb)
  const poleGltf = await loadGltf('./power_pole_3d_game_asset.glb', 'Poste Urbano e Transformador (power_pole_3d_game_asset.glb)', 41, 56);
  const poleTemplate = poleGltf.scene;
  inspectionReports.push(inspectLoadedModel(poleTemplate, 'power_pole_3d_game_asset.glb'));

  poleTemplate.updateMatrixWorld(true);
  const poleBox = new THREE.Box3().setFromObject(poleTemplate);
  const poleCenter = new THREE.Vector3();
  poleBox.getCenter(poleCenter);

  [CHAIN_ANCHORS.pole1.base, CHAIN_ANCHORS.pole2.base].forEach((basePos, idx) => {
    const poleWrapper = new THREE.Group();
    poleWrapper.name = `UrbanPowerPole_${idx + 1}`;
    const instance = poleTemplate.clone(true);
    const scale = 1.4; // Altura ~14 m para destaque visual claro no projetor
    instance.scale.setScalar(scale);
    instance.position.set(
      -poleCenter.x * scale,
      -poleBox.min.y * scale,
      -poleCenter.z * scale
    );
    instance.traverse((c) => {
      if (c.isMesh) {
        c.castShadow = true;
        c.receiveShadow = true;
      }
    });
    poleWrapper.position.copy(basePos);
    poleWrapper.add(instance);
    equipmentGroups['distribuicao-urbana'].add(poleWrapper);
  });

  // 4. Carrega Residência Moderna (modern_home.glb)
  const homeGltf = await loadGltf('./modern_home.glb', 'Residência e Instalação Elétrica (modern_home.glb)', 57, 72);
  const homeRaw = homeGltf.scene;
  inspectionReports.push(inspectLoadedModel(homeRaw, 'modern_home.glb'));

  // Remove as esferas gigantes de Area Light exportadas do editor 3D que distorcem o bounding box
  const spheresToHide = [];
  homeRaw.traverse((child) => {
    const nName = (child.name || '').toLowerCase();
    if (nName.includes('sphere') || nName.includes('area light')) {
      spheresToHide.push(child);
    }
    if (child.isMesh) {
      child.castShadow = true;
      child.receiveShadow = true;
    }
  });
  spheresToHide.forEach((s) => {
    s.visible = false;
  });

  // Escala de milímetros para metros (0.0014 -> casa com ~10 m de altura)
  const homeWrapper = new THREE.Group();
  homeWrapper.name = 'ModernHome_Residence';
  const homeScale = 0.0014;
  homeRaw.scale.setScalar(homeScale);
  homeRaw.updateMatrixWorld(true);

  // Calcula bounding box apenas das malhas visíveis da casa
  const homeBox = new THREE.Box3();
  homeRaw.traverse((c) => {
    if (c.isMesh && c.visible) {
      c.geometry.computeBoundingBox();
      const b = c.geometry.boundingBox.clone().applyMatrix4(c.matrixWorld);
      homeBox.union(b);
    }
  });
  const homeCenter = new THREE.Vector3();
  homeBox.getCenter(homeCenter);

  homeRaw.position.set(-homeCenter.x, -homeBox.min.y, -homeCenter.z);
  homeWrapper.position.copy(CHAIN_ANCHORS.residence.center);
  homeWrapper.add(homeRaw);
  equipmentGroups['residencia-consumo'].add(homeWrapper);

  // Adiciona Padrão de Entrada, Medidor kWh, Quadro de Distribuição (QDC), Aterramento e Tomada interna visível
  buildResidentialElectricalInfrastructure(equipmentGroups['residencia-consumo']);

  // 5. Carrega Subestação Completa (substation_bimfra.glb - 182 MB)
  // Utilizamos compartilhamento de BufferGeometry entre a Subestação Elevadora e a Subestação Abaixadora
  // para evitar duplicar os 6,6 milhões de vértices na memória de vídeo (VRAM).
  const subGltf = await loadGltf('./substation_bimfra.glb', 'Subestações Elevadora e Abaixadora (substation_bimfra.glb)', 73, 98);
  const subRaw = subGltf.scene;
  inspectionReports.push(inspectLoadedModel(subRaw, 'substation_bimfra.glb'));

  subRaw.updateMatrixWorld(true);
  const subBox = new THREE.Box3().setFromObject(subRaw);
  const subCenter = new THREE.Vector3();
  subBox.getCenter(subCenter);

  const subScale = 0.48;

  // Subestação Elevadora (Etapa 5: 34,5 kV -> 230/500 kV)
  const subElevadoraWrapper = new THREE.Group();
  subElevadoraWrapper.name = 'Substation_StepUp';
  subRaw.scale.setScalar(subScale);
  subRaw.position.set(
    -subCenter.x * subScale,
    -subBox.min.y * subScale,
    -subCenter.z * subScale
  );
  // Desativa castShadow nas 139 malhas densas da subestação para garantir 60 FPS em GPUs integradas
  subRaw.traverse((c) => {
    if (c.isMesh) {
      c.castShadow = false;
      c.receiveShadow = true;
    }
  });
  subElevadoraWrapper.position.copy(CHAIN_ANCHORS.stepUpSubstation.center);
  subElevadoraWrapper.add(subRaw);
  equipmentGroups['subestacao-elevadora'].add(subElevadoraWrapper);

  // Subestação Abaixadora (Etapa 6: 230/500 kV -> 13,8 kV) — clone leve compartilhando as mesmas geometrias e materiais
  const subAbaixadoraWrapper = new THREE.Group();
  subAbaixadoraWrapper.name = 'Substation_StepDown';
  const subClone = subRaw.clone(true);
  subAbaixadoraWrapper.position.copy(CHAIN_ANCHORS.stepDownSubstation.center);
  subAbaixadoraWrapper.rotation.y = Math.PI; // Espelha orientação para entrada AT à esquerda e saída 13,8 kV à direita
  subAbaixadoraWrapper.add(subClone);
  equipmentGroups['distribuicao-urbana'].add(subAbaixadoraWrapper);

  onProgress(100, 'Cadeia 3D pronta.');

  return {
    equipmentGroups,
    rotorNodes,
    inspectionReports
  };
}

/**
 * Constrói o Transformador Elevador Pad-Mounted na base da turbina (690 V -> 34,5 kV)
 * e os indicadores tridimensionais dos componentes internos da nacele (Etapas 2, 3 e 4).
 */
function buildTurbineTransformerAndCutaway(equipmentGroups) {
  const trafoGroup = new THREE.Group();
  trafoGroup.name = 'PadMounted_Transformer_34kV';
  const pos = CHAIN_ANCHORS.stepUpPadTransformer.center;

  // Base de concreto do transformador
  const padGeo = new THREE.BoxGeometry(5.2, 0.5, 4.2);
  const padMat = new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.85 });
  const pad = new THREE.Mesh(padGeo, padMat);
  pad.position.set(pos.x, 0.25, pos.z);
  pad.receiveShadow = true;
  trafoGroup.add(pad);

  // Tanque principal do transformador elevador (690 V -> 34,5 kV)
  const tankGeo = new THREE.BoxGeometry(3.4, 3.2, 2.6);
  const tankMat = new THREE.MeshStandardMaterial({
    color: 0x0f766e,
    metalness: 0.55,
    roughness: 0.35
  });
  const tank = new THREE.Mesh(tankGeo, tankMat);
  tank.position.set(pos.x, 2.1, pos.z);
  tank.castShadow = true;
  tank.receiveShadow = true;
  trafoGroup.add(tank);

  // Aletas radiadoras laterais
  const finGeo = new THREE.BoxGeometry(0.18, 2.6, 2.2);
  const finMat = new THREE.MeshStandardMaterial({ color: 0x115e59, metalness: 0.6, roughness: 0.4 });
  for (let i = -3; i <= 3; i++) {
    const fin = new THREE.Mesh(finGeo, finMat);
    fin.position.set(pos.x + i * 0.45, 2.1, pos.z + 1.38);
    trafoGroup.add(fin);
  }

  // 3 Buchas isoladoras de Média Tensão (34,5 kV) no topo do transformador
  const bushingGeo = new THREE.CylinderGeometry(0.14, 0.2, 1.1, 16);
  const bushingMat = new THREE.MeshStandardMaterial({
    color: 0xfacc15,
    emissive: 0xfacc15,
    emissiveIntensity: 0.25,
    roughness: 0.3
  });
  [-0.8, 0, 0.8].forEach((offsetX) => {
    const bushing = new THREE.Mesh(bushingGeo, bushingMat);
    bushing.position.set(pos.x + offsetX, 4.1, pos.z);
    trafoGroup.add(bushing);
  });

  equipmentGroups['transformador-base'].add(trafoGroup);

  // Representação esquemática 3D interna da Nacele (visível ao focar nas Etapas 2 e 3)
  const nacelleInternal = new THREE.Group();
  nacelleInternal.name = 'Nacelle_Internal_Diagram3D';
  const nacPos = CHAIN_ANCHORS.turbineMain.nacelle;

  // Eixo de baixa rotação + Caixa Multiplicadora + Gerador + Conversor (semi-transparentes/luminosos)
  const shaftGeo = new THREE.CylinderGeometry(0.28, 0.28, 3.2, 16);
  shaftGeo.rotateX(Math.PI / 2);
  const shaftMat = new THREE.MeshStandardMaterial({
    color: 0x38bdf8,
    emissive: 0x0284c7,
    emissiveIntensity: 0.5,
    metalness: 0.8,
    roughness: 0.2
  });
  const lowShaft = new THREE.Mesh(shaftGeo, shaftMat);
  lowShaft.position.set(nacPos.x, nacPos.y, nacPos.z - 2.0);
  nacelleInternal.add(lowShaft);

  // Gearbox (Caixa Multiplicadora 1:80)
  const gearGeo = new THREE.CylinderGeometry(0.95, 0.95, 1.8, 20);
  gearGeo.rotateX(Math.PI / 2);
  const gearMat = new THREE.MeshStandardMaterial({
    color: 0x2dd4bf,
    emissive: 0x0d9488,
    emissiveIntensity: 0.45,
    metalness: 0.6,
    roughness: 0.3
  });
  const gearbox = new THREE.Mesh(gearGeo, gearMat);
  gearbox.position.set(nacPos.x, nacPos.y, nacPos.z - 0.1);
  nacelleInternal.add(gearbox);

  // Gerador Síncrono / Indução + Conversor PWM
  const genGeo = new THREE.CylinderGeometry(1.1, 1.1, 2.2, 24);
  genGeo.rotateX(Math.PI / 2);
  const genMat = new THREE.MeshStandardMaterial({
    color: 0x00f5d4,
    emissive: 0x00f5d4,
    emissiveIntensity: 0.5,
    metalness: 0.5,
    roughness: 0.25
  });
  const generator = new THREE.Mesh(genGeo, genMat);
  generator.position.set(nacPos.x, nacPos.y, nacPos.z + 2.2);
  nacelleInternal.add(generator);

  equipmentGroups['turbina-nacele'].add(nacelleInternal);
}

/**
 * Constrói o Padrão de Entrada residencial (poste do ramal, caixa do medidor kWh),
 * haste de aterramento, Quadro de Distribuição (QDC) e ponto de tomada interna iluminado.
 */
function buildResidentialElectricalInfrastructure(residenceGroup) {
  const infraGroup = new THREE.Group();
  infraGroup.name = 'Residential_Electrical_Entry';

  const mastTop = CHAIN_ANCHORS.residence.serviceMastTop;
  const meterPos = CHAIN_ANCHORS.residence.meterBox;
  const qdcPos = CHAIN_ANCHORS.residence.qdcBoard;
  const socketPos = CHAIN_ANCHORS.residence.internalSocket;

  // 1. Pontalete / Poste do Padrão de Entrada
  const mastGeo = new THREE.CylinderGeometry(0.12, 0.15, mastTop.y, 12);
  const mastMat = new THREE.MeshStandardMaterial({ color: 0x475569, roughness: 0.7, metalness: 0.3 });
  const mast = new THREE.Mesh(mastGeo, mastMat);
  mast.position.set(mastTop.x, mastTop.y / 2, mastTop.z);
  mast.castShadow = true;
  infraGroup.add(mast);

  // 2. Caixa do Medidor de Energia (Relógio kWh)
  const meterGeo = new THREE.BoxGeometry(0.65, 0.85, 0.45);
  const meterMat = new THREE.MeshStandardMaterial({
    color: 0x1e293b,
    emissive: 0x3b82f6,
    emissiveIntensity: 0.35,
    metalness: 0.5,
    roughness: 0.3
  });
  const meterBox = new THREE.Mesh(meterGeo, meterMat);
  meterBox.position.copy(meterPos);
  infraGroup.add(meterBox);

  // 3. Haste de Aterramento no solo junto ao padrão
  const groundRodGeo = new THREE.CylinderGeometry(0.06, 0.06, 1.4, 10);
  const groundRodMat = new THREE.MeshStandardMaterial({
    color: 0xd97706,
    emissive: 0xb45309,
    emissiveIntensity: 0.3,
    metalness: 0.85,
    roughness: 0.2
  });
  const groundRod = new THREE.Mesh(groundRodGeo, groundRodMat);
  groundRod.position.set(meterPos.x, 0.7, meterPos.z + 0.5);
  infraGroup.add(groundRod);

  // 4. Quadro de Distribuição de Circuitos (QDC com Disjuntores)
  const qdcGeo = new THREE.BoxGeometry(0.55, 0.75, 0.25);
  const qdcMat = new THREE.MeshStandardMaterial({
    color: 0x0284c7,
    emissive: 0x38bdf8,
    emissiveIntensity: 0.45,
    metalness: 0.4,
    roughness: 0.3
  });
  const qdcMesh = new THREE.Mesh(qdcGeo, qdcMat);
  qdcMesh.position.copy(qdcPos);
  infraGroup.add(qdcMesh);

  // 5. Tomada Residencial / Carga Ativa (ponto luminoso no interior da residência)
  const socketGeo = new THREE.SphereGeometry(0.42, 16, 16);
  const socketMat = new THREE.MeshStandardMaterial({
    color: 0x60a5fa,
    emissive: 0x3b82f6,
    emissiveIntensity: 1.2,
    roughness: 0.1
  });
  const socketMesh = new THREE.Mesh(socketGeo, socketMat);
  socketMesh.position.copy(socketPos);
  infraGroup.add(socketMesh);

  residenceGroup.add(infraGroup);
}
