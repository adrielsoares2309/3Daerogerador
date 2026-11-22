import * as THREE from 'three';
import { CSS2DRenderer } from 'three/examples/jsm/renderers/CSS2DRenderer.js';
import { createNavigationControls } from './navigationControls.js';

export const OVERVIEW_CAMERA = {
  position: { x: 15, y: 115, z: 270 },
  target: { x: 10, y: 20, z: 0 }
};

/**
 * Calcula a altura analítica do terreno na coordenada (x, z) para evitar que a câmera
 * atravesse o solo ou o relevo distante.
 */
export function getTerrainHeightAt(x, z) {
  if (z < -110) {
    const dist = Math.abs(z + 110);
    return (
      Math.sin(x * 0.012) * Math.cos(z * 0.015) * Math.min(dist * 0.18, 28) +
      Math.max(0, (dist - 20) * 0.12)
    );
  }
  return 0.24;
}

/**
 * Inicializa a cena Three.js, câmera, WebGLRenderer, CSS2DRenderer, OrbitControls,
 * iluminação industrial/científica e terreno contínuo.
 *
 * @param {HTMLElement} container - Container principal da cena 3D
 * @param {HTMLElement} labelContainer - Container sobreposto para rótulos CSS2D
 */
export function setupScene(container, labelContainer, navigationCallbacks = {}) {
  const width = window.innerWidth;
  const height = window.innerHeight;

  // 1. Cena com estética tecnológica / CAD / simulador industrial
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x070d19);
  scene.fog = new THREE.FogExp2(0x070d19, 0.0011);

  // 2. Câmera (near reduzido para inspeção aproximada de detalhes sem recorte)
  const camera = new THREE.PerspectiveCamera(45, width / height, 0.25, 2200);
  camera.position.set(
    OVERVIEW_CAMERA.position.x,
    OVERVIEW_CAMERA.position.y,
    OVERVIEW_CAMERA.position.z
  );

  // 3. WebGLRenderer otimizado (DPR limitado a Math.min(window.devicePixelRatio, 2))
  const renderer = new THREE.WebGLRenderer({
    antialias: true,
    powerPreference: 'high-performance'
  });
  renderer.setSize(width, height);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.15;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  container.appendChild(renderer.domElement);

  // 4. CSS2DRenderer para Hotspots nítidos e acessíveis
  const labelRenderer = new CSS2DRenderer();
  labelRenderer.setSize(width, height);
  labelRenderer.domElement.className = 'css2d-overlay';
  labelContainer.appendChild(labelRenderer.domElement);

  // 5. Sistema de navegação 3D (Modo Livre padrão + Modo Órbita alternativo)
  const navigationControls = createNavigationControls({
    camera,
    domElement: renderer.domElement,
    initialPosition: OVERVIEW_CAMERA.position,
    initialTarget: OVERVIEW_CAMERA.target,
    getTerrainHeightAt,
    ...navigationCallbacks
  });

  // 6. Iluminação científica e ambiental
  const hemiLight = new THREE.HemisphereLight(0x93c5fd, 0x1e293b, 1.35);
  hemiLight.position.set(0, 200, 0);
  scene.add(hemiLight);

  const dirLight = new THREE.DirectionalLight(0xf8fafc, 2.2);
  dirLight.position.set(-120, 220, 160);
  dirLight.castShadow = true;
  dirLight.shadow.mapSize.width = 2048;
  dirLight.shadow.mapSize.height = 2048;
  dirLight.shadow.camera.near = 20;
  dirLight.shadow.camera.far = 650;
  const d = 310;
  dirLight.shadow.camera.left = -d;
  dirLight.shadow.camera.right = d;
  dirLight.shadow.camera.top = d;
  dirLight.shadow.camera.bottom = -d;
  dirLight.shadow.bias = -0.0005;
  scene.add(dirLight);

  const fillLight = new THREE.DirectionalLight(0x38bdf8, 0.75);
  fillLight.position.set(180, 90, -140);
  scene.add(fillLight);

  // 7. Terreno contínuo e ambiente técnico (Grid CAD + Zonas demarcadas)
  buildEnvironmentAndTerrain(scene);

  // 8. Responsividade (16:9, 4:3, projetores, mobile)
  function onWindowResize() {
    const w = window.innerWidth;
    const h = window.innerHeight;
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    renderer.setSize(w, h);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    labelRenderer.setSize(w, h);
  }
  window.addEventListener('resize', onWindowResize);

  // 9. Limpeza de recursos
  function disposeScene() {
    window.removeEventListener('resize', onWindowResize);
    navigationControls.dispose();
    renderer.dispose();
  }

  return {
    scene,
    camera,
    renderer,
    labelRenderer,
    controls: navigationControls,
    navigationControls,
    onWindowResize,
    disposeScene
  };
}

/**
 * Constrói o terreno contínuo, malha de engenharia, estradas/zonas técnicas
 * e domo de céu escuro estilizado.
 */
function buildEnvironmentAndTerrain(scene) {
  const envGroup = new THREE.Group();
  envGroup.name = 'Environment_Terrain';

  // Solo principal contínuo
  const groundGeo = new THREE.PlaneGeometry(1600, 1000, 64, 40);
  groundGeo.rotateX(-Math.PI / 2);

  // Leve relevo nas bordas distantes (Z < -120) mantendo a faixa central (Z entre -90 e +90) plana
  const posAttr = groundGeo.attributes.position;
  for (let i = 0; i < posAttr.count; i++) {
    const x = posAttr.getX(i);
    const z = posAttr.getZ(i);
    if (z < -110) {
      const dist = Math.abs(z + 110);
      const hill =
        Math.sin(x * 0.012) * Math.cos(z * 0.015) * Math.min(dist * 0.18, 28) +
        Math.max(0, (dist - 20) * 0.12);
      posAttr.setY(i, hill);
    }
  }
  groundGeo.computeVertexNormals();

  const groundMat = new THREE.MeshStandardMaterial({
    color: 0x0f172a,
    roughness: 0.92,
    metalness: 0.08
  });
  const groundMesh = new THREE.Mesh(groundGeo, groundMat);
  groundMesh.receiveShadow = true;
  envGroup.add(groundMesh);

  // Grid técnico CAD sobre o terreno plano
  const gridHelper = new THREE.GridHelper(900, 90, 0x1e3a5f, 0x132038);
  gridHelper.position.y = 0.04;
  envGroup.add(gridHelper);

  // Plataforma / Corredor industrial da cadeia elétrica
  const corridorGeo = new THREE.PlaneGeometry(660, 120);
  corridorGeo.rotateX(-Math.PI / 2);
  const corridorMat = new THREE.MeshStandardMaterial({
    color: 0x131e31,
    roughness: 0.85,
    metalness: 0.12
  });
  const corridorMesh = new THREE.Mesh(corridorGeo, corridorMat);
  corridorMesh.position.set(5, 0.06, 0);
  corridorMesh.receiveShadow = true;
  envGroup.add(corridorMesh);

  // Bases demarcadas para cada setor da cadeia (Geração, Subestação Elevadora, Transmissão, Subestação Abaixadora, Urbano)
  const zones = [
    { x: -255, z: -25, w: 68, d: 68, color: 0x0d9488 }, // Parque Eólico
    { x: -120, z: 15, w: 58, d: 52, color: 0xeab308 },  // Subestação Elevadora
    { x: 0, z: -15, w: 140, d: 40, color: 0xef4444 },    // Corredor de Transmissão AT
    { x: 120, z: 15, w: 58, d: 52, color: 0xf97316 },   // Subestação Abaixadora
    { x: 225, z: 5, w: 115, d: 54, color: 0x3b82f6 }    // Rede Urbana e Residência
  ];

  const plateMatBase = new THREE.MeshStandardMaterial({
    color: 0x1e293b,
    roughness: 0.8,
    metalness: 0.2
  });

  zones.forEach((z) => {
    // Base de concreto / brita técnica
    const padGeo = new THREE.BoxGeometry(z.w, 0.22, z.d);
    const padMesh = new THREE.Mesh(padGeo, plateMatBase);
    padMesh.position.set(z.x, 0.11, z.z);
    padMesh.receiveShadow = true;
    envGroup.add(padMesh);

    // Borda luminosa sutil indicando a zona funcional
    const edgesGeo = new THREE.EdgesGeometry(padGeo);
    const edgesMat = new THREE.LineBasicMaterial({
      color: z.color,
      transparent: true,
      opacity: 0.45
    });
    const edges = new THREE.LineSegments(edgesGeo, edgesMat);
    edges.position.copy(padMesh.position);
    envGroup.add(edges);
  });

  // Via urbana asfaltada ao lado dos postes e da residência
  const roadGeo = new THREE.PlaneGeometry(125, 10);
  roadGeo.rotateX(-Math.PI / 2);
  const roadMat = new THREE.MeshStandardMaterial({
    color: 0x090d16,
    roughness: 0.9,
    metalness: 0.05
  });
  const road = new THREE.Mesh(roadGeo, roadMat);
  road.position.set(222, 0.24, 16);
  road.receiveShadow = true;
  envGroup.add(road);

  scene.add(envGroup);
}
