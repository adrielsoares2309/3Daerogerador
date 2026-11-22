import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { PointerLockControls } from 'three/examples/jsm/controls/PointerLockControls.js';

const _PI_2 = Math.PI / 2;
const PITCH_MARGIN = 0.08; // Evita inversão vertical (gimbal flip) perto de ±90°
const MIN_GROUND_CLEARANCE = 1.65;
const MAX_ALTITUDE = 420;
const CAMERA_COLLISION_RADIUS = 1.35;

const WORLD_BOUNDS = {
  minX: -680,
  maxX: 680,
  minZ: -440,
  maxZ: 500
};

const BASE_MOVE_SPEED = 42; // m/s (adequado à escala de ~550 m da usina)
const FAST_MULTIPLIER = 2.8; // Shift
const SLOW_MULTIPLIER = 0.25; // Ctrl
const ACCEL_RATE = 10.0;
const DECEL_RATE = 8.5;
const DRAG_LOOK_SENSITIVITY = 0.0024;
const SCROLL_DOLLY_IMPULSE = 14.0;

/**
 * Gerencia a navegação 3D unificada com dois modos mutuamente exclusivos:
 * - 'free': Navegação livre estilo Blender/BIM (WASD + Q/E + Mouse/PointerLock + Scroll + Shift/Ctrl)
 * - 'orbit': Modo órbita clássico (OrbitControls) preservado como alternativa
 *
 * Garante que apenas um sistema controle a câmera por vez, com aceleração/desaceleração
 * suaves, proteção contra travamento de teclas, colisão leve com terreno/objetos e
 * compatibilidade total com transições GSAP e elementos da interface.
 */
export function createNavigationControls({
  camera,
  domElement,
  initialPosition,
  initialTarget,
  getTerrainHeightAt = () => 0,
  isUiBlockingInput = () => false,
  onUserInteractionStart = null,
  onModeChange = null,
  onPointerLockChange = null,
  onSpeedModeChange = null
}) {
  // 1. Instancia OrbitControls (desativado por padrão pois iniciamos em modo livre)
  const orbitControls = new OrbitControls(camera, domElement);
  orbitControls.enableDamping = true;
  orbitControls.dampingFactor = 0.06;
  orbitControls.minDistance = 4;
  orbitControls.maxDistance = 760;
  orbitControls.maxPolarAngle = Math.PI / 2 - 0.02;
  orbitControls.minPolarAngle = 0.05;
  orbitControls.target.set(initialTarget.x, initialTarget.y, initialTarget.z);
  orbitControls.enabled = false;

  // 2. Instancia PointerLockControls para rotação imersiva no modo livre
  const pointerLockControls = new PointerLockControls(camera, domElement);
  pointerLockControls.minPolarAngle = PITCH_MARGIN;
  pointerLockControls.maxPolarAngle = Math.PI - PITCH_MARGIN;
  pointerLockControls.pointerSpeed = 0.95;
  pointerLockControls.enabled = true;

  // Orienta a câmera inicialmente para o target inicial
  camera.position.set(initialPosition.x, initialPosition.y, initialPosition.z);
  camera.lookAt(initialTarget.x, initialTarget.y, initialTarget.z);

  // Estado interno
  let mode = 'free'; // 'free' | 'orbit'
  let isTransitioning = false;
  let isDragLooking = false;
  let activePointerId = null;
  let lastPointerX = 0;
  let lastPointerY = 0;
  let lastUnlockTimestamp = 0;
  let currentSpeedMode = 'normal'; // 'normal' | 'fast' | 'slow'

  const pressedCodes = new Set();
  const velocity = new THREE.Vector3();
  const scrollVelocity = new THREE.Vector3();
  const desiredVelocity = new THREE.Vector3();
  const moveDirection = new THREE.Vector3();
  const forwardVec = new THREE.Vector3();
  const rightVec = new THREE.Vector3();
  const euler = new THREE.Euler(0, 0, 0, 'YXZ');
  const nextPos = new THREE.Vector3();

  // Lista leve de AABBs para evitar atravessar equipamentos sólidos
  let colliders = [];

  function isEditableTarget(target) {
    if (!target) return false;
    const tag = target.tagName?.toLowerCase();
    return (
      tag === 'input' ||
      tag === 'textarea' ||
      tag === 'select' ||
      Boolean(target.isContentEditable)
    );
  }

  function isInteractiveUiElement(target) {
    if (!target || target === domElement) return false;
    return Boolean(
      target.closest(
        'button, a, input, select, textarea, .hud-header, .hud-bottom-bar, .stage-detail-panel, .floating-modal, .voltage-legend-panel, .nav-hud-indicator, .hotspot-btn'
      )
    );
  }

  function clearInputState() {
    pressedCodes.clear();
    isDragLooking = false;
    activePointerId = null;
    velocity.set(0, 0, 0);
    scrollVelocity.set(0, 0, 0);
    updateSpeedMode('normal');
  }

  function updateSpeedMode(nextSpeedMode) {
    if (nextSpeedMode !== currentSpeedMode) {
      currentSpeedMode = nextSpeedMode;
      if (onSpeedModeChange) onSpeedModeChange(currentSpeedMode);
    }
  }

  function getActiveSpeedMultiplier() {
    const isShift =
      pressedCodes.has('ShiftLeft') || pressedCodes.has('ShiftRight');
    const isCtrl =
      pressedCodes.has('ControlLeft') || pressedCodes.has('ControlRight');

    if (isShift && !isCtrl) {
      updateSpeedMode('fast');
      return FAST_MULTIPLIER;
    }
    if (isCtrl && !isShift) {
      updateSpeedMode('slow');
      return SLOW_MULTIPLIER;
    }
    updateSpeedMode('normal');
    return 1.0;
  }

  function clampCameraToTerrainAndBounds(pos) {
    pos.x = THREE.MathUtils.clamp(pos.x, WORLD_BOUNDS.minX, WORLD_BOUNDS.maxX);
    pos.z = THREE.MathUtils.clamp(pos.z, WORLD_BOUNDS.minZ, WORLD_BOUNDS.maxZ);
    const groundY = getTerrainHeightAt(pos.x, pos.z);
    const minY = groundY + MIN_GROUND_CLEARANCE;
    if (pos.y < minY) {
      pos.y = minY;
      if (velocity.y < 0) velocity.y = 0;
      if (scrollVelocity.y < 0) scrollVelocity.y = 0;
    } else if (pos.y > MAX_ALTITUDE) {
      pos.y = MAX_ALTITUDE;
      if (velocity.y > 0) velocity.y = 0;
    }
  }

  /**
   * Verifica se uma esfera centrada em `pos` com raio `CAMERA_COLLISION_RADIUS`
   * colide com algum volume AABB registrado.
   */
  function collidesWithEquipment(pos) {
    const r = CAMERA_COLLISION_RADIUS;
    for (let i = 0; i < colliders.length; i++) {
      const box = colliders[i];
      if (
        pos.x + r > box.min.x &&
        pos.x - r < box.max.x &&
        pos.y + r > box.min.y &&
        pos.y - r < box.max.y &&
        pos.z + r > box.min.z &&
        pos.z - r < box.max.z
      ) {
        return true;
      }
    }
    return false;
  }

  /**
   * Aplica o deslocamento com resolução deslizante por eixo (sliding collision),
   * impedindo atravessar equipamentos sem travar o movimento paralelo à superfície.
   */
  function applyMovementWithCollision(dx, dy, dz) {
    if (colliders.length === 0) {
      camera.position.x += dx;
      camera.position.y += dy;
      camera.position.z += dz;
      clampCameraToTerrainAndBounds(camera.position);
      return;
    }

    // Se a câmera já estiver dentro de algum volume (ex: transição externa), permite sair livremente
    const alreadyInside = collidesWithEquipment(camera.position);

    if (dx !== 0) {
      nextPos.set(camera.position.x + dx, camera.position.y, camera.position.z);
      if (alreadyInside || !collidesWithEquipment(nextPos)) {
        camera.position.x = nextPos.x;
      } else {
        velocity.x = 0;
        scrollVelocity.x = 0;
      }
    }

    if (dy !== 0) {
      nextPos.set(camera.position.x, camera.position.y + dy, camera.position.z);
      if (alreadyInside || !collidesWithEquipment(nextPos)) {
        camera.position.y = nextPos.y;
      } else {
        velocity.y = 0;
        scrollVelocity.y = 0;
      }
    }

    if (dz !== 0) {
      nextPos.set(camera.position.x, camera.position.y, camera.position.z + dz);
      if (alreadyInside || !collidesWithEquipment(nextPos)) {
        camera.position.z = nextPos.z;
      } else {
        velocity.z = 0;
        scrollVelocity.z = 0;
      }
    }

    clampCameraToTerrainAndBounds(camera.position);
  }

  /**
   * Constrói lista otimizada de caixas de colisão (AABB) a partir dos grupos 3D carregados.
   * Ignora caixas vazias/muito grandes (> 42 m) para permitir entrar no pátio das subestações
   * e caminhar sob torres, bloqueando apenas volumes sólidos compactos.
   */
  function setCollidableGroups(equipmentGroups) {
    const boxes = [];
    const size = new THREE.Vector3();

    Object.values(equipmentGroups || {}).forEach((group) => {
      if (!group) return;
      group.updateMatrixWorld(true);
      group.traverse((child) => {
        if (!child.isMesh || !child.visible) return;
        const box = new THREE.Box3().setFromObject(child);
        if (box.isEmpty()) return;
        box.getSize(size);
        const maxDim = Math.max(size.x, size.y, size.z);
        const minDim = Math.min(size.x, size.y, size.z);
        // Filtra apenas volumes sólidos relevantes (nem microdetalhes nem envelopes gigantes)
        if (maxDim >= 1.2 && maxDim <= 38 && minDim >= 0.45) {
          boxes.push(box);
        }
      });
    });

    colliders = boxes;
  }

  // Proteção de solo também no modo Órbita
  function onOrbitChange() {
    if (mode !== 'orbit' || isTransitioning) return;
    if (orbitControls.target.y < 0.5) {
      orbitControls.target.y = 0.5;
    }
    const groundY = getTerrainHeightAt(camera.position.x, camera.position.z);
    const minY = groundY + MIN_GROUND_CLEARANCE;
    if (camera.position.y < minY) {
      camera.position.y = minY;
    }
  }
  orbitControls.addEventListener('change', onOrbitChange);

  // Listeners do PointerLockControls
  function handlePointerLock() {
    isDragLooking = false;
    activePointerId = null;
    if (onUserInteractionStart) onUserInteractionStart();
    if (onPointerLockChange) onPointerLockChange(true);
  }

  function handlePointerUnlock() {
    lastUnlockTimestamp = performance.now();
    pressedCodes.clear();
    updateSpeedMode('normal');
    if (onPointerLockChange) onPointerLockChange(false);
  }

  pointerLockControls.addEventListener('lock', handlePointerLock);
  pointerLockControls.addEventListener('unlock', handlePointerUnlock);

  // Eventos de teclado (modo livre)
  const MOVEMENT_CODES = new Set([
    'KeyW',
    'KeyS',
    'KeyA',
    'KeyD',
    'KeyQ',
    'KeyE',
    'ShiftLeft',
    'ShiftRight',
    'ControlLeft',
    'ControlRight'
  ]);

  function onKeyDown(event) {
    if (mode !== 'free') return;
    if (isEditableTarget(document.activeElement) || isUiBlockingInput()) return;
    if (event.metaKey || event.altKey) return;

    const code = event.code;
    if (!MOVEMENT_CODES.has(code)) return;

    // Previne atalhos do navegador como Ctrl+S / Ctrl+D / Ctrl+A durante navegação precisa
    if (
      event.ctrlKey &&
      (code === 'KeyS' || code === 'KeyD' || code === 'KeyA' || code === 'KeyQ' || code === 'KeyE')
    ) {
      event.preventDefault();
    }

    if (
      code === 'KeyW' ||
      code === 'KeyS' ||
      code === 'KeyA' ||
      code === 'KeyD' ||
      code === 'KeyQ' ||
      code === 'KeyE'
    ) {
      if (isTransitioning && onUserInteractionStart) {
        onUserInteractionStart();
      }
    }

    pressedCodes.add(code);
    getActiveSpeedMultiplier();
  }

  function onKeyUp(event) {
    if (pressedCodes.has(event.code)) {
      pressedCodes.delete(event.code);
      getActiveSpeedMultiplier();
    }
  }

  // Rotação da câmera por arrasto do mouse no modo livre (quando Pointer Lock não está ativo)
  function onPointerDown(event) {
    if (mode !== 'free') return;
    if (pointerLockControls.isLocked) return;
    if (isUiBlockingInput() || isInteractiveUiElement(event.target)) return;
    if (event.button !== 0 && event.button !== 1 && event.button !== 2) return;

    isDragLooking = true;
    activePointerId = event.pointerId;
    lastPointerX = event.clientX;
    lastPointerY = event.clientY;
    domElement.classList.add('is-free-dragging');
  }

  function onPointerMove(event) {
    if (mode !== 'free' || !isDragLooking || pointerLockControls.isLocked) return;
    if (activePointerId !== null && event.pointerId !== activePointerId) return;

    const deltaX = event.clientX - lastPointerX;
    const deltaY = event.clientY - lastPointerY;
    lastPointerX = event.clientX;
    lastPointerY = event.clientY;

    if (Math.abs(deltaX) > 0 || Math.abs(deltaY) > 0) {
      if (isTransitioning && onUserInteractionStart) {
        onUserInteractionStart();
      }
      euler.setFromQuaternion(camera.quaternion, 'YXZ');
      euler.y -= deltaX * DRAG_LOOK_SENSITIVITY;
      euler.x -= deltaY * DRAG_LOOK_SENSITIVITY;
      euler.x = THREE.MathUtils.clamp(
        euler.x,
        -_PI_2 + PITCH_MARGIN,
        _PI_2 - PITCH_MARGIN
      );
      euler.z = 0;
      camera.quaternion.setFromEuler(euler);
    }
  }

  function onPointerUp(event) {
    if (activePointerId !== null && event.pointerId !== activePointerId) return;
    isDragLooking = false;
    activePointerId = null;
    domElement.classList.remove('is-free-dragging');
  }

  function onContextMenu(event) {
    if (mode === 'free') {
      event.preventDefault();
    }
  }

  // Duplo clique no canvas no modo livre ativa Pointer Lock para olhar livremente sem segurar botão
  function onDoubleClick(event) {
    if (mode !== 'free') return;
    if (isUiBlockingInput() || isInteractiveUiElement(event.target)) return;
    if (!pointerLockControls.isLocked) {
      lockPointer();
    }
  }

  // Scroll do mouse no modo livre: aproximação / afastamento suave na direção da câmera
  function onWheel(event) {
    if (mode !== 'free') return;
    if (isUiBlockingInput() || isInteractiveUiElement(event.target)) return;

    event.preventDefault();
    if (isTransitioning && onUserInteractionStart) {
      onUserInteractionStart();
    }

    const directionSign = -Math.sign(event.deltaY);
    if (directionSign === 0) return;

    const speedMult = getActiveSpeedMultiplier();
    const magnitude =
      Math.min(Math.abs(event.deltaY) / 100, 2.5) * SCROLL_DOLLY_IMPULSE * speedMult;

    camera.getWorldDirection(forwardVec).normalize();
    scrollVelocity.addScaledVector(forwardVec, directionSign * magnitude * 3.2);
  }

  // Tratamento para perda de foco da janela / troca de aba
  function onWindowBlur() {
    clearInputState();
    domElement.classList.remove('is-free-dragging');
  }

  function onVisibilityChange() {
    if (document.hidden) {
      clearInputState();
      domElement.classList.remove('is-free-dragging');
    }
  }

  // Registra listeners
  window.addEventListener('keydown', onKeyDown);
  window.addEventListener('keyup', onKeyUp);
  window.addEventListener('pointermove', onPointerMove);
  window.addEventListener('pointerup', onPointerUp);
  window.addEventListener('pointercancel', onPointerUp);
  window.addEventListener('blur', onWindowBlur);
  document.addEventListener('visibilitychange', onVisibilityChange);

  domElement.addEventListener('pointerdown', onPointerDown);
  domElement.addEventListener('contextmenu', onContextMenu);
  domElement.addEventListener('dblclick', onDoubleClick);
  domElement.addEventListener('wheel', onWheel, { passive: false });

  // API de controle de modos
  function setMode(nextMode) {
    if (nextMode !== 'free' && nextMode !== 'orbit') return mode;
    if (nextMode === mode) return mode;

    clearInputState();
    domElement.classList.remove('is-free-dragging');

    if (nextMode === 'orbit') {
      if (pointerLockControls.isLocked) {
        pointerLockControls.unlock();
      }
      pointerLockControls.enabled = false;

      // Posiciona o target do OrbitControls à frente da câmera para transição sem saltos
      camera.getWorldDirection(forwardVec).normalize();
      const targetDist = THREE.MathUtils.clamp(camera.position.y * 1.15, 22, 130);
      orbitControls.target
        .copy(camera.position)
        .addScaledVector(forwardVec, targetDist);
      if (orbitControls.target.y < 1.0) {
        orbitControls.target.y = 1.0;
      }

      mode = 'orbit';
      orbitControls.enabled = true;
      orbitControls.update();
    } else {
      orbitControls.enabled = false;
      mode = 'free';
      pointerLockControls.enabled = true;
    }

    if (onModeChange) onModeChange(mode);
    return mode;
  }

  function toggleMode() {
    return setMode(mode === 'free' ? 'orbit' : 'free');
  }

  function lockPointer() {
    if (mode !== 'free') {
      setMode('free');
    }
    try {
      pointerLockControls.lock();
    } catch {
      // Ignora caso o navegador rejeite Pointer Lock fora de gesto do usuário
    }
  }

  function unlockPointer() {
    if (pointerLockControls.isLocked) {
      pointerLockControls.unlock();
    }
  }

  // Integração com transições suaves de câmera (GSAP em cameraFocus.js)
  function beginTransition() {
    isTransitioning = true;
    clearInputState();
    if (pointerLockControls.isLocked) {
      pointerLockControls.unlock();
    }
    orbitControls.enabled = false;
    pointerLockControls.enabled = false;
  }

  function syncLookAt(targetVec) {
    camera.lookAt(targetVec);
    orbitControls.target.copy(targetVec);
  }

  function endTransition(finalTarget) {
    isTransitioning = false;
    if (finalTarget) {
      orbitControls.target.copy(finalTarget);
      camera.lookAt(finalTarget);
    }
    if (mode === 'orbit') {
      orbitControls.enabled = true;
      orbitControls.update();
    } else {
      pointerLockControls.enabled = true;
    }
  }

  function getCurrentLookTarget(out = new THREE.Vector3()) {
    if (mode === 'orbit') {
      return out.copy(orbitControls.target);
    }
    camera.getWorldDirection(forwardVec).normalize();
    return out.copy(camera.position).addScaledVector(forwardVec, 60);
  }

  /**
   * Atualização por frame (chamada no loop requestAnimationFrame).
   *
   * @param {number} delta - Delta time em segundos
   */
  function update(delta) {
    const safeDelta = Math.min(delta, 0.1);

    if (isTransitioning) return;

    if (mode === 'orbit') {
      orbitControls.update();
      return;
    }

    if (isUiBlockingInput()) {
      clearInputState();
      return;
    }

    // Modo livre: calcula direção de movimento com base na orientação da câmera
    moveDirection.set(0, 0, 0);

    const forwardInput =
      (pressedCodes.has('KeyW') ? 1 : 0) - (pressedCodes.has('KeyS') ? 1 : 0);
    const rightInput =
      (pressedCodes.has('KeyD') ? 1 : 0) - (pressedCodes.has('KeyA') ? 1 : 0);
    const verticalInput =
      (pressedCodes.has('KeyE') ? 1 : 0) - (pressedCodes.has('KeyQ') ? 1 : 0);

    if (forwardInput !== 0) {
      camera.getWorldDirection(forwardVec).normalize();
      moveDirection.addScaledVector(forwardVec, forwardInput);
    }

    if (rightInput !== 0) {
      // Vetor lateral sempre horizontal (sem inclinação lateral/roll)
      camera.getWorldDirection(forwardVec);
      rightVec.crossVectors(forwardVec, camera.up).normalize();
      moveDirection.addScaledVector(rightVec, rightInput);
    }

    if (verticalInput !== 0) {
      moveDirection.y += verticalInput;
    }

    const hasInput = moveDirection.lengthSq() > 0;
    const speedMult = getActiveSpeedMultiplier();

    if (hasInput) {
      moveDirection.normalize();
      desiredVelocity.copy(moveDirection).multiplyScalar(BASE_MOVE_SPEED * speedMult);
      const accelAlpha = 1 - Math.exp(-ACCEL_RATE * safeDelta);
      velocity.lerp(desiredVelocity, accelAlpha);
    } else {
      const decelAlpha = 1 - Math.exp(-DECEL_RATE * safeDelta);
      velocity.lerp(desiredVelocity.set(0, 0, 0), decelAlpha);
      if (velocity.lengthSq() < 0.0004) {
        velocity.set(0, 0, 0);
      }
    }

    // Decaimento suave do impulso de scroll
    if (scrollVelocity.lengthSq() > 0.0004) {
      const scrollDecay = Math.exp(-10.5 * safeDelta);
      scrollVelocity.multiplyScalar(scrollDecay);
    } else {
      scrollVelocity.set(0, 0, 0);
    }

    const dx = (velocity.x + scrollVelocity.x) * safeDelta;
    const dy = (velocity.y + scrollVelocity.y) * safeDelta;
    const dz = (velocity.z + scrollVelocity.z) * safeDelta;

    if (dx !== 0 || dy !== 0 || dz !== 0) {
      applyMovementWithCollision(dx, dy, dz);
    }
  }

  function dispose() {
    clearInputState();
    window.removeEventListener('keydown', onKeyDown);
    window.removeEventListener('keyup', onKeyUp);
    window.removeEventListener('pointermove', onPointerMove);
    window.removeEventListener('pointerup', onPointerUp);
    window.removeEventListener('pointercancel', onPointerUp);
    window.removeEventListener('blur', onWindowBlur);
    document.removeEventListener('visibilitychange', onVisibilityChange);

    domElement.removeEventListener('pointerdown', onPointerDown);
    domElement.removeEventListener('contextmenu', onContextMenu);
    domElement.removeEventListener('dblclick', onDoubleClick);
    domElement.removeEventListener('wheel', onWheel);

    orbitControls.removeEventListener('change', onOrbitChange);
    pointerLockControls.removeEventListener('lock', handlePointerLock);
    pointerLockControls.removeEventListener('unlock', handlePointerUnlock);

    orbitControls.dispose();
    pointerLockControls.dispose();
  }

  return {
    update,
    setMode,
    toggleMode,
    lockPointer,
    unlockPointer,
    beginTransition,
    syncLookAt,
    endTransition,
    getCurrentLookTarget,
    setCollidableGroups,
    dispose,
    getMode: () => mode,
    isPointerLocked: () => pointerLockControls.isLocked,
    wasJustUnlocked: () => performance.now() - lastUnlockTimestamp < 250,
    getSpeedMode: () => currentSpeedMode,
    orbitControls,
    pointerLockControls
  };
}
