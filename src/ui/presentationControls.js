/**
 * Gerencia a Barra Inferior de Apresentação, o Modo Apresentação em projetor,
 * o indicador de etapa atual no cabeçalho e os atalhos de teclado:
 * - Seta direita (ArrowRight): próxima etapa
 * - Seta esquerda (ArrowLeft): etapa anterior
 * - Home: visão geral
 * - Esc: fechar painel / sair do modo apresentação
 * - F: tela cheia
 * (Não captura atalhos quando o usuário está digitando em campos de texto/input)
 */
export function createPresentationControls({
  etapas,
  onSelectStage,
  onOverview,
  onFreeExplore,
  onEscape,
  onToggleFullscreen
}) {
  let currentStageNumber = null; // null = Visão Geral / Exploração Livre
  let isPresentationMode = false;

  const btnPrev = document.getElementById('nav-btn-prev');
  const btnNext = document.getElementById('nav-btn-next');
  const btnOverview = document.getElementById('nav-btn-overview');
  const btnHeaderOverview = document.getElementById('header-btn-overview');
  const btnFreeExplore = document.getElementById('nav-btn-free');
  const btnPresentationMode = document.getElementById('btn-presentation-mode');

  const headerStageBadge = document.getElementById('header-current-stage');
  const progressStepsContainer = document.getElementById('nav-progress-steps');

  // Constrói os 7 botões de progresso sequencial na barra inferior
  if (progressStepsContainer) {
    progressStepsContainer.innerHTML = etapas
      .map(
        (etapa) => `
        <button
          type="button"
          class="progress-step-dot"
          data-stage="${etapa.numero}"
          style="--dot-color: ${etapa.corTema}"
          title="Etapa ${etapa.numero}: ${etapa.titulo}"
          aria-label="Ir para Etapa ${etapa.numero}"
        >
          <span class="step-num">${etapa.numero}</span>
          <span class="step-short-label">${etapa.tituloCurto.replace(/^\d+\.\s*/, '')}</span>
        </button>
      `
      )
      .join('');

    progressStepsContainer.querySelectorAll('.progress-step-dot').forEach((dot) => {
      dot.addEventListener('click', () => {
        const num = parseInt(dot.dataset.stage, 10);
        if (num) onSelectStage(num);
      });
    });
  }

  function goNext() {
    if (currentStageNumber === null) {
      onSelectStage(1);
    } else if (currentStageNumber < etapas.length) {
      onSelectStage(currentStageNumber + 1);
    }
  }

  function goPrev() {
    if (currentStageNumber === null) {
      onSelectStage(etapas.length);
    } else if (currentStageNumber > 1) {
      onSelectStage(currentStageNumber - 1);
    }
  }

  if (btnPrev) btnPrev.addEventListener('click', goPrev);
  if (btnNext) btnNext.addEventListener('click', goNext);

  if (btnOverview) {
    btnOverview.addEventListener('click', () => {
      onOverview();
    });
  }
  if (btnHeaderOverview) {
    btnHeaderOverview.addEventListener('click', () => {
      onOverview();
    });
  }

  if (btnFreeExplore) {
    btnFreeExplore.addEventListener('click', () => {
      setPresentationMode(false);
      onFreeExplore();
    });
  }

  function setPresentationMode(active) {
    isPresentationMode = Boolean(active);
    document.body.classList.toggle('presentation-mode-active', isPresentationMode);
    if (btnPresentationMode) {
      btnPresentationMode.classList.toggle('is-active', isPresentationMode);
      btnPresentationMode.innerHTML = isPresentationMode
        ? '<span>📽</span> Sair da Apresentação'
        : '<span>📽</span> Modo Apresentação';
    }
    if (isPresentationMode && currentStageNumber === null) {
      onSelectStage(1);
    }
  }

  if (btnPresentationMode) {
    btnPresentationMode.addEventListener('click', () => {
      setPresentationMode(!isPresentationMode);
    });
  }

  /**
   * Atualiza os indicadores visuais da etapa atual no cabeçalho e na barra inferior.
   *
   * @param {number|null} stageNumber
   */
  function updateActiveStageUI(stageNumber) {
    currentStageNumber = stageNumber;
    const etapa = etapas.find((e) => e.numero === stageNumber);

    if (headerStageBadge) {
      if (etapa) {
        headerStageBadge.textContent = `Etapa ${etapa.numero}/7: ${etapa.tituloCurto.replace(/^\d+\.\s*/, '')}`;
        headerStageBadge.style.borderColor = etapa.corTema;
        headerStageBadge.style.color = '#ffffff';
      } else {
        headerStageBadge.textContent = 'Visão Geral — Cadeia Completa (7 Etapas)';
        headerStageBadge.style.borderColor = 'rgba(56, 189, 248, 0.4)';
        headerStageBadge.style.color = '#bae6fd';
      }
    }

    if (progressStepsContainer) {
      progressStepsContainer.querySelectorAll('.progress-step-dot').forEach((dot) => {
        const num = parseInt(dot.dataset.stage, 10);
        dot.classList.toggle('is-active', num === stageNumber);
        dot.classList.toggle('is-completed', stageNumber !== null && num < stageNumber);
      });
    }

    if (btnOverview) {
      btnOverview.classList.toggle('is-active', stageNumber === null);
    }
  }

  // Listener de atalhos de teclado (ignorando quando o foco está em inputs)
  function onKeyDown(event) {
    const tag = document.activeElement?.tagName?.toLowerCase();
    const isEditable =
      tag === 'input' ||
      tag === 'textarea' ||
      tag === 'select' ||
      document.activeElement?.isContentEditable;

    if (isEditable) return;

    if (event.key === 'ArrowRight') {
      event.preventDefault();
      goNext();
    } else if (event.key === 'ArrowLeft') {
      event.preventDefault();
      goPrev();
    } else if (event.key === 'Home') {
      event.preventDefault();
      onOverview();
    } else if (event.key === 'Escape') {
      event.preventDefault();
      if (isPresentationMode) {
        setPresentationMode(false);
      }
      onEscape();
    } else if (event.key === 'f' || event.key === 'F') {
      if (!event.ctrlKey && !event.metaKey && !event.altKey) {
        event.preventDefault();
        onToggleFullscreen();
      }
    }
  }

  window.addEventListener('keydown', onKeyDown);

  return {
    updateActiveStageUI,
    setPresentationMode,
    get currentStageNumber() {
      return currentStageNumber;
    },
    get isPresentationMode() {
      return isPresentationMode;
    }
  };
}
