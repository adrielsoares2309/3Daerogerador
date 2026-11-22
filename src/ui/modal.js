import katex from 'katex';

/**
 * Gerencia o Painel Lateral Direito (glassmorphism) com o conteúdo físico,
 * componentes, valores típicos, curiosidades, diagramas internos de Raio-X (Nacele / Eletrônica de Potência)
 * e equações matemáticas renderizadas offline via KaTeX.
 */
export function createStageModalController({ onClose, onSelectStage, totalStages = 7 }) {
  const panelEl = document.getElementById('stage-detail-panel');
  const contentEl = document.getElementById('stage-panel-body');
  const closeBtn = document.getElementById('btn-close-stage-panel');

  if (closeBtn) {
    closeBtn.addEventListener('click', () => {
      hide();
      if (onClose) onClose();
    });
  }

  // Impede que a rolagem do painel lateral mova o zoom do OrbitControls
  if (panelEl) {
    panelEl.addEventListener('wheel', (e) => {
      e.stopPropagation();
    });
    panelEl.addEventListener('pointerdown', (e) => {
      e.stopPropagation();
    });
  }

  /**
   * Renderiza uma string LaTeX com KaTeX de maneira segura e síncrona (100% offline).
   */
  function renderLatex(latexStr, displayMode = true) {
    try {
      return katex.renderToString(latexStr, {
        displayMode,
        throwOnError: false,
        strict: false
      });
    } catch (err) {
      return `<code>${latexStr}</code>`;
    }
  }

  /**
   * Gera o diagrama interativo complementar de estrutura interna quando o usuário
   * seleciona a Etapa 2 (Nacele e Transmissão) ou Etapa 3 (Gerador e Conversores PWM),
   * visto que o arquivo wind_turbine.glb possui apenas a malha externa da nacele.
   */
  function buildInternalStructureDiagram(etapa) {
    if (etapa.numero === 2) {
      return `
        <div class="internal-xray-card">
          <div class="xray-header">
            <span class="xray-tag">INSPEÇÃO INTERNA DA NACELE (RAIO-X TÉCNICO)</span>
            <span class="xray-note">Diagrama complementar da transmissão mecânica e controle</span>
          </div>
          <svg class="xray-svg" viewBox="0 0 640 210" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Estrutura interna da nacele">
            <defs>
              <linearGradient id="nacelleBg" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stop-color="#0f172a"/>
                <stop offset="100%" stop-color="#1e293b"/>
              </linearGradient>
            </defs>
            <!-- Carenagem da Nacele -->
            <rect x="110" y="32" width="490" height="135" rx="18" fill="url(#nacelleBg)" stroke="#38bdf8" stroke-width="2" stroke-dasharray="6 4"/>
            <!-- Torre -->
            <path d="M310 167 L295 208 L365 208 L350 167 Z" fill="#334155" stroke="#64748b" stroke-width="2"/>
            <text x="330" y="195" fill="#cbd5e1" font-size="11" text-anchor="middle" font-weight="600">TORRE + YAW</text>

            <!-- Cubo / Hub e Pás -->
            <path d="M45 98 C45 65, 110 55, 110 55 L110 142 C110 142, 45 132, 45 98 Z" fill="#0284c7" stroke="#38bdf8" stroke-width="2"/>
            <rect x="82" y="10" width="14" height="48" rx="4" fill="#e2e8f0"/>
            <rect x="82" y="140" width="14" height="48" rx="4" fill="#e2e8f0"/>
            <text x="77" y="102" fill="#ffffff" font-size="11" font-weight="700" text-anchor="middle">HUB + PITCH</text>

            <!-- Eixo de Baixa Rotação (5-20 RPM) -->
            <rect x="110" y="90" width="105" height="18" fill="#38bdf8"/>
            <rect x="148" y="80" width="18" height="38" rx="3" fill="#94a3b8" stroke="#e2e8f0"/>
            <text x="162" y="68" fill="#7dd3fc" font-size="11" text-anchor="middle" font-weight="600">Eixo Lento (15 RPM)</text>
            <text x="162" y="135" fill="#cbd5e1" font-size="10" text-anchor="middle">Mancal Principal</text>

            <!-- Caixa Multiplicadora (Gearbox 1:80) -->
            <rect x="215" y="62" width="115" height="74" rx="8" fill="#0d9488" stroke="#2dd4bf" stroke-width="2"/>
            <text x="272" y="94" fill="#ffffff" font-size="12" font-weight="700" text-anchor="middle">MULTIPLICADORA</text>
            <text x="272" y="112" fill="#ccfbf1" font-size="10" text-anchor="middle">Planetária + Paralelas (1:80)</text>

            <!-- Eixo de Alta Rotação + Freio -->
            <rect x="330" y="93" width="75" height="12" fill="#facc15"/>
            <rect x="358" y="76" width="14" height="46" rx="2" fill="#ef4444"/>
            <text x="367" y="56" fill="#fde047" font-size="11" text-anchor="middle" font-weight="600">Eixo Rápido (1.200 RPM)</text>
            <text x="367" y="138" fill="#fca5a5" font-size="10" text-anchor="middle">Freio a Disco</text>

            <!-- Gerador Elétrico -->
            <rect x="405" y="58" width="105" height="82" rx="10" fill="#0369a1" stroke="#00f5d4" stroke-width="2"/>
            <text x="457" y="95" fill="#ffffff" font-size="12" font-weight="700" text-anchor="middle">GERADOR</text>
            <text x="457" y="112" fill="#a5f3fc" font-size="10" text-anchor="middle">PMSG / DFIG</text>

            <!-- Anemômetro e Biruta + SCADA -->
            <line x1="570" y1="32" x2="570" y2="10" stroke="#94a3b8" stroke-width="3"/>
            <circle cx="570" cy="10" r="6" fill="#38bdf8"/>
            <text x="545" y="22" fill="#e2e8f0" font-size="10" text-anchor="end">Anemômetro / Biruta</text>
            <rect x="522" y="64" width="64" height="70" rx="6" fill="#1e293b" stroke="#64748b"/>
            <text x="554" y="96" fill="#38bdf8" font-size="11" font-weight="700" text-anchor="middle">SCADA</text>
            <text x="554" y="112" fill="#cbd5e1" font-size="9" text-anchor="middle">Controle</text>
          </svg>
        </div>
      `;
    }

    if (etapa.numero === 3) {
      return `
        <div class="internal-xray-card">
          <div class="xray-header">
            <span class="xray-tag">ARQUITETURA DE ELETRÔNICA DE POTÊNCIA</span>
            <span class="xray-note">Condicionamento da energia: Frequência variável → 60 Hz da rede</span>
          </div>
          <div class="power-electronics-chain">
            <div class="pe-block">
              <span class="pe-step">1. Gerador Trifásico</span>
              <strong>CA Variável</strong>
              <small>Rotor magnético + Estator (120°)</small>
            </div>
            <span class="pe-arrow">→</span>
            <div class="pe-block">
              <span class="pe-step">2. Retificador</span>
              <strong>CA → CC</strong>
              <small>Ponte de Diodos / IGBTs</small>
            </div>
            <span class="pe-arrow">→</span>
            <div class="pe-block">
              <span class="pe-step">3. Barramento CC</span>
              <strong>DC Link</strong>
              <small>Capacitores ($E = \\frac{1}{2}CV^2$)</small>
            </div>
            <span class="pe-arrow">→</span>
            <div class="pe-block">
              <span class="pe-step">4. Inversor PWM</span>
              <strong>CC → CA 60 Hz</strong>
              <small>IGBTs (690 V a 1.000 V)</small>
            </div>
          </div>
        </div>
      `;
    }

    return '';
  }

  /**
   * Exibe o painel lateral preenchido com todos os dados científicos da etapa.
   *
   * @param {Object} etapa
   */
  function showStage(etapa) {
    if (!panelEl || !contentEl) return;

    const formulasHtml = etapa.formulas
      .map(
        (f) => `
        <div class="formula-card">
          <div class="formula-title">${f.nome}</div>
          <div class="formula-math">${renderLatex(f.latex, true)}</div>
          <div class="formula-desc">${f.descricao}</div>
        </div>
      `
      )
      .join('');

    const explicacaoHtml = etapa.explicacaoDetalhada
      .map(
        (bloco) => `
        <div class="didactic-block">
          <h4 class="didactic-block-title">${bloco.titulo}</h4>
          <p class="didactic-block-text">${bloco.texto}</p>
        </div>
      `
      )
      .join('');

    const componentesHtml = etapa.componentes
      .map(
        (c) => `
        <li class="component-item">
          <strong class="component-name">${c.nome}:</strong>
          <span class="component-func">${c.funcao}</span>
        </li>
      `
      )
      .join('');

    const valoresHtml = etapa.valoresTipicos
      .map(
        (v) => `
        <div class="metric-row">
          <span class="metric-label">${v.rotulo}</span>
          <span class="metric-value">${v.valor}</span>
        </div>
      `
      )
      .join('');

    const observacoesHtml = etapa.observacoesTecnicas
      .map((obs) => `<li class="tech-note-item">${obs}</li>`)
      .join('');

    const internalDiagramHtml = buildInternalStructureDiagram(etapa);

    contentEl.innerHTML = `
      <div class="stage-panel-header-meta" style="--stage-accent: ${etapa.corTema}">
        <div class="stage-badge-row">
          <span class="stage-number-pill">ETAPA ${etapa.numero} DE ${totalStages}</span>
          <span class="stage-category-pill">${etapa.categoria}</span>
        </div>
        <h2 class="stage-main-title">${etapa.titulo}</h2>
        <p class="stage-subtitle">${etapa.subtitulo}</p>
        <div class="stage-voltage-banner">
          <span class="voltage-icon">⚡</span>
          <div>
            <span class="voltage-label">Nível de Tensão / Regime:</span>
            <strong class="voltage-value">${etapa.tensao}</strong>
          </div>
        </div>
      </div>

      <section class="panel-section">
        <h3 class="section-heading">Resumo Físico</h3>
        <p class="summary-highlight">${etapa.resumoFisico}</p>
      </section>

      ${internalDiagramHtml}

      <section class="panel-section">
        <h3 class="section-heading">Modelagem Matemática e Leis Físicas</h3>
        <div class="formulas-grid">
          ${formulasHtml}
        </div>
      </section>

      <section class="panel-section">
        <h3 class="section-heading">Explicação Física Detalhada</h3>
        <div class="didactic-blocks-list">
          ${explicacaoHtml}
        </div>
      </section>

      <section class="panel-section">
        <h3 class="section-heading">Valores de Referência e Grandezas Típicas</h3>
        <div class="metrics-table">
          ${valoresHtml}
        </div>
      </section>

      <section class="panel-section">
        <h3 class="section-heading">Componentes Envolvidos</h3>
        <ul class="components-list">
          ${componentesHtml}
        </ul>
      </section>

      <section class="panel-section">
        <h3 class="section-heading">Precisão Científica e Observações Técnicas</h3>
        <ul class="tech-notes-list">
          ${observacoesHtml}
        </ul>
      </section>

      <div class="panel-footer-nav">
        <button type="button" class="panel-nav-btn" id="panel-btn-prev" ${etapa.numero <= 1 ? 'disabled' : ''}>
          ← Etapa Anterior
        </button>
        <button type="button" class="panel-nav-btn panel-nav-btn-primary" id="panel-btn-next" ${etapa.numero >= totalStages ? 'disabled' : ''}>
          Próxima Etapa →
        </button>
      </div>
    `;

    // Renderiza eventual LaTeX inline no diagrama de eletrônica de potência
    const peInlineMath = contentEl.querySelector('.power-electronics-chain');
    if (peInlineMath) {
      peInlineMath.innerHTML = peInlineMath.innerHTML.replace(
        /\$E = \\frac\{1\}\{2\}CV\^2\$/,
        renderLatex('E = \\tfrac{1}{2}CV^2', false)
      );
    }

    const prevBtn = contentEl.querySelector('#panel-btn-prev');
    const nextBtn = contentEl.querySelector('#panel-btn-next');
    if (prevBtn) {
      prevBtn.addEventListener('click', () => {
        if (etapa.numero > 1) onSelectStage(etapa.numero - 1);
      });
    }
    if (nextBtn) {
      nextBtn.addEventListener('click', () => {
        if (etapa.numero < totalStages) onSelectStage(etapa.numero + 1);
      });
    }

    panelEl.classList.add('is-open');
    contentEl.scrollTop = 0;
  }

  function hide() {
    if (panelEl) {
      panelEl.classList.remove('is-open');
    }
  }

  function isOpen() {
    return panelEl ? panelEl.classList.contains('is-open') : false;
  }

  return {
    showStage,
    hide,
    isOpen,
    renderLatex
  };
}
