import katex from 'katex';
import { calcularSimulacaoEolica, formatarNumeroBR, gerarCurvaVelocidadePotencia } from '../utils/math.js';

/**
 * Gerencia o Simulador Interativo "SIMULAÇÃO DE GERAÇÃO EÓLICA",
 * o modal de Ajuda/Atalhos e a Legenda de Tensões do HUD.
 *
 * Parâmetros padrão obrigatórios:
 * - Raio do rotor: 40 m -> Área: ~5.026,5 m²
 * - Velocidade do vento: 10 m/s -> Potência disponível: ~3,08 MW
 * - Densidade do ar: 1,225 kg/m³
 * - Coeficiente de potência Cp: 0,45 -> Potência mecânica: ~1,39 MW
 * - Rendimento pós-rotor: 0,94 -> Potência elétrica estimada: ~1,30 MW
 */
export function createHudAndSimulatorController({ onWindSpeedChange, onTogglePause }) {
  const simModal = document.getElementById('simulator-modal');
  const btnOpenSim = document.getElementById('btn-open-simulator');
  const btnCloseSim = document.getElementById('btn-close-simulator');

  const helpModal = document.getElementById('help-modal');
  const btnOpenHelp = document.getElementById('btn-open-help');
  const btnCloseHelp = document.getElementById('btn-close-help');

  const btnFullscreen = document.getElementById('btn-fullscreen');
  const btnToggleAnim = document.getElementById('btn-toggle-anim');

  // Inputs do Simulador
  const inputRaio = document.getElementById('sim-input-raio');
  const numRaio = document.getElementById('sim-num-raio');
  const inputVento = document.getElementById('sim-input-vento');
  const numVento = document.getElementById('sim-num-vento');
  const inputDensidade = document.getElementById('sim-input-densidade');
  const numDensidade = document.getElementById('sim-num-densidade');
  const inputCp = document.getElementById('sim-input-cp');
  const numCp = document.getElementById('sim-num-cp');
  const btnResetSim = document.getElementById('btn-reset-simulator');

  // Impede que eventos nos modais interfiram no OrbitControls
  [simModal, helpModal].forEach((m) => {
    if (!m) return;
    m.addEventListener('wheel', (e) => e.stopPropagation());
    m.addEventListener('pointerdown', (e) => e.stopPropagation());
  });

  // Renderiza as equações do simulador e rótulos inline com KaTeX
  const simFormulasContainer = document.getElementById('sim-katex-formulas');
  if (simFormulasContainer) {
    const eqs = [
      'A = \\pi R^2',
      'P_{\\text{vento}} = \\frac{1}{2}\\rho A v^3',
      'P_{\\text{rotor}} = P_{\\text{vento}} \\cdot C_p',
      'P_{\\text{elétrica}} = P_{\\text{rotor}} \\times 0,94'
    ];
    simFormulasContainer.innerHTML = eqs
      .map((latex) => {
        try {
          return `<span class="sim-eq-pill">${katex.renderToString(latex, { throwOnError: false })}</span>`;
        } catch {
          return `<span class="sim-eq-pill">${latex}</span>`;
        }
      })
      .join('');
  }

  if (simModal) {
    simModal.querySelectorAll('.sim-label-row label, .kpi-label, .kpi-sub, .sim-secondary-metrics span, .sim-chart-header span').forEach((el) => {
      if (el.innerHTML.includes('$')) {
        el.innerHTML = el.innerHTML.replace(/\$([^$]+)\$/g, (_, tex) => {
          try {
            return katex.renderToString(tex, { throwOnError: false, displayMode: false });
          } catch {
            return tex;
          }
        });
      }
    });
  }

  function updateSimulation() {
    const raio = parseFloat(inputRaio?.value || '40');
    const velocidade = parseFloat(inputVento?.value || '10');
    const densidade = parseFloat(inputDensidade?.value || '1.225');
    const cp = parseFloat(inputCp?.value || '0.45');

    if (numRaio) numRaio.value = String(raio);
    if (numVento) numVento.value = String(velocidade);
    if (numDensidade) numDensidade.value = String(densidade);
    if (numCp) numCp.value = String(cp);

    const res = calcularSimulacaoEolica({ raio, velocidade, densidade, cp });

    // Atualiza cards de resultado
    const elArea = document.getElementById('sim-res-area');
    const elPVento = document.getElementById('sim-res-pvento');
    const elPRotor = document.getElementById('sim-res-protor');
    const elPEletrica = document.getElementById('sim-res-peletrica');
    const elVazao = document.getElementById('sim-res-vazao');
    const elRpm = document.getElementById('sim-res-rpm');
    const elCorrente = document.getElementById('sim-res-corrente');
    const elRegiao = document.getElementById('sim-res-regiao');

    if (elArea) elArea.textContent = `${formatarNumeroBR(res.area, 1)} m²`;
    if (elPVento) elPVento.textContent = `${formatarNumeroBR(res.potenciaVentoMW, 2)} MW`;
    if (elPRotor) elPRotor.textContent = `${formatarNumeroBR(res.potenciaRotorMW, 2)} MW`;
    if (elPEletrica) elPEletrica.textContent = `${formatarNumeroBR(res.potenciaEletricaMW, 2)} MW`;
    if (elVazao) elVazao.textContent = `${formatarNumeroBR(res.vazaoMassica / 1000, 1)} t/s (${formatarNumeroBR(res.vazaoMassica, 0)} kg/s)`;
    if (elRpm) elRpm.textContent = `${formatarNumeroBR(res.rpmRotor, 1)} RPM → Gerador (1:80): ${formatarNumeroBR(res.rpmGerador, 0)} RPM`;
    if (elCorrente) elCorrente.textContent = `${formatarNumeroBR(res.correnteSaidaGeradorA, 0)} A (690 V) → ${formatarNumeroBR(res.correnteRedeColetoraA, 1)} A (34,5 kV)`;
    if (elRegiao) {
      elRegiao.textContent = res.regiaoOperacao;
      elRegiao.style.color = res.statusCor;
    }

    // Atualiza a velocidade de rotação das pás na cena 3D em tempo real
    if (onWindSpeedChange) {
      onWindSpeedChange(velocidade);
    }

    // Renderiza o gráfico SVG da curva P(v) com destaque para a velocidade atual
    renderPowerCurveChart(res);
  }

  function renderPowerCurveChart(res) {
    const svgContainer = document.getElementById('sim-chart-container');
    if (!svgContainer) return;

    const serie = gerarCurvaVelocidadePotencia({
      raio: res.raio,
      densidade: res.densidade,
      cp: res.cp
    });

    const width = 520;
    const height = 195;
    const padL = 48;
    const padR = 20;
    const padT = 18;
    const padB = 34;
    const plotW = width - padL - padR;
    const plotH = height - padT - padB;

    const maxV = 22;
    const maxP = Math.max(10, serie[serie.length - 1].pVentoMW * 0.65);

    const toX = (v) => padL + (Math.min(v, maxV) / maxV) * plotW;
    const toY = (p) => padT + plotH - (Math.min(p, maxP) / maxP) * plotH;

    const pathVento = serie
      .map((pt, idx) => `${idx === 0 ? 'M' : 'L'}${toX(pt.v).toFixed(1)},${toY(pt.pVentoMW).toFixed(1)}`)
      .join(' ');
    const pathRotor = serie
      .map((pt, idx) => `${idx === 0 ? 'M' : 'L'}${toX(pt.v).toFixed(1)},${toY(pt.pRotorMW).toFixed(1)}`)
      .join(' ');
    const pathEletrica = serie
      .map((pt, idx) => `${idx === 0 ? 'M' : 'L'}${toX(pt.v).toFixed(1)},${toY(pt.pEletricaMW).toFixed(1)}`)
      .join(' ');

    const curX = toX(res.velocidade);
    const curYEl = toY(res.potenciaEletricaMW);
    const curYRot = toY(res.potenciaRotorMW);

    svgContainer.innerHTML = `
      <svg viewBox="0 0 ${width} ${height}" class="sim-curve-svg" role="img" aria-label="Gráfico de Potência versus Velocidade do Vento">
        <!-- Linhas de grade horizontais -->
        <line x1="${padL}" y1="${padT}" x2="${width - padR}" y2="${padT}" stroke="#1e293b" stroke-width="1"/>
        <line x1="${padL}" y1="${padT + plotH * 0.5}" x2="${width - padR}" y2="${padT + plotH * 0.5}" stroke="#1e293b" stroke-width="1"/>
        <line x1="${padL}" y1="${padT + plotH}" x2="${width - padR}" y2="${padT + plotH}" stroke="#334155" stroke-width="1.5"/>
        <line x1="${padL}" y1="${padT}" x2="${padL}" y2="${padT + plotH}" stroke="#334155" stroke-width="1.5"/>

        <!-- Curvas P_vento, P_rotor e P_eletrica -->
        <path d="${pathVento}" fill="none" stroke="#38bdf8" stroke-width="1.8" stroke-dasharray="4 3"/>
        <path d="${pathRotor}" fill="none" stroke="#facc15" stroke-width="2.2"/>
        <path d="${pathEletrica}" fill="none" stroke="#00f5d4" stroke-width="2.6"/>

        <!-- Linha vertical da velocidade atual -->
        <line x1="${curX}" y1="${padT}" x2="${curX}" y2="${padT + plotH}" stroke="#f43f5e" stroke-width="1.5" stroke-dasharray="3 3"/>
        <circle cx="${curX}" cy="${curYRot}" r="4.5" fill="#facc15" stroke="#0f172a" stroke-width="1.5"/>
        <circle cx="${curX}" cy="${curYEl}" r="5.5" fill="#00f5d4" stroke="#0f172a" stroke-width="1.5"/>

        <!-- Rótulos dos eixos -->
        <text x="${padL - 6}" y="${padT + 8}" fill="#94a3b8" font-size="10" text-anchor="end">${formatarNumeroBR(maxP, 1)} MW</text>
        <text x="${padL - 6}" y="${padT + plotH * 0.5 + 4}" fill="#94a3b8" font-size="10" text-anchor="end">${formatarNumeroBR(maxP * 0.5, 1)} MW</text>
        <text x="${padL - 6}" y="${padT + plotH}" fill="#94a3b8" font-size="10" text-anchor="end">0</text>

        <text x="${toX(0)}" y="${height - 10}" fill="#94a3b8" font-size="10" text-anchor="middle">0 m/s</text>
        <text x="${toX(5)}" y="${height - 10}" fill="#94a3b8" font-size="10" text-anchor="middle">5 m/s</text>
        <text x="${toX(10)}" y="${height - 10}" fill="#e2e8f0" font-size="10" font-weight="700" text-anchor="middle">10 m/s</text>
        <text x="${toX(15)}" y="${height - 10}" fill="#94a3b8" font-size="10" text-anchor="middle">15 m/s</text>
        <text x="${toX(20)}" y="${height - 10}" fill="#94a3b8" font-size="10" text-anchor="middle">20 m/s</text>

        <!-- Destaque do ponto atual -->
        <text x="${Math.min(curX + 8, width - 115)}" y="${Math.max(curYEl - 8, 26)}" fill="#00f5d4" font-size="11" font-weight="700">
          v = ${formatarNumeroBR(res.velocidade, 1)} m/s → ${formatarNumeroBR(res.potenciaEletricaMW, 2)} MW
        </text>
      </svg>
    `;
  }

  // Sincroniza sliders (range) e inputs numéricos
  function bindSliderAndNumber(rangeEl, numEl, min, max) {
    if (!rangeEl || !numEl) return;
    rangeEl.addEventListener('input', () => {
      numEl.value = rangeEl.value;
      updateSimulation();
    });
    numEl.addEventListener('input', () => {
      const val = parseFloat(numEl.value);
      if (Number.isFinite(val)) {
        const clamped = Math.min(Math.max(val, min), max);
        rangeEl.value = String(clamped);
        updateSimulation();
      }
    });
  }

  bindSliderAndNumber(inputRaio, numRaio, 10, 80);
  bindSliderAndNumber(inputVento, numVento, 0, 25);
  bindSliderAndNumber(inputDensidade, numDensidade, 0.9, 1.4);
  bindSliderAndNumber(inputCp, numCp, 0.1, 0.59);

  if (btnResetSim) {
    btnResetSim.addEventListener('click', () => {
      if (inputRaio) inputRaio.value = '40';
      if (inputVento) inputVento.value = '10';
      if (inputDensidade) inputDensidade.value = '1.225';
      if (inputCp) inputCp.value = '0.45';
      updateSimulation();
    });
  }

  // Abertura e fechamento do modal do Simulador
  if (btnOpenSim && simModal) {
    btnOpenSim.addEventListener('click', () => {
      simModal.classList.toggle('is-open');
      if (helpModal) helpModal.classList.remove('is-open');
      updateSimulation();
    });
  }
  if (btnCloseSim && simModal) {
    btnCloseSim.addEventListener('click', () => {
      simModal.classList.remove('is-open');
    });
  }

  // Abertura e fechamento do modal de Ajuda
  if (btnOpenHelp && helpModal) {
    btnOpenHelp.addEventListener('click', () => {
      helpModal.classList.toggle('is-open');
      if (simModal) simModal.classList.remove('is-open');
    });
  }
  if (btnCloseHelp && helpModal) {
    btnCloseHelp.addEventListener('click', () => {
      helpModal.classList.remove('is-open');
    });
  }

  // Controle de pausar/retomar animações
  if (btnToggleAnim) {
    btnToggleAnim.addEventListener('click', () => {
      if (onTogglePause) {
        const paused = onTogglePause();
        btnToggleAnim.textContent = paused ? '▶ Retomar Fluxo' : '⏸ Pausar Fluxo';
        btnToggleAnim.classList.toggle('is-paused', paused);
      }
    });
  }

  // Controle de Tela Cheia (Fullscreen)
  function toggleFullscreen() {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen?.().catch(() => {});
    } else {
      document.exitFullscreen?.().catch(() => {});
    }
  }

  if (btnFullscreen) {
    btnFullscreen.addEventListener('click', toggleFullscreen);
  }

  // Inicializa cálculo padrão (R=40m, v=10m/s, rho=1,225, Cp=0,45)
  updateSimulation();

  return {
    updateSimulation,
    toggleFullscreen,
    isAnyModalOpen() {
      return Boolean(
        simModal?.classList.contains('is-open') ||
        helpModal?.classList.contains('is-open')
      );
    },
    closeAllModals() {
      if (simModal) simModal.classList.remove('is-open');
      if (helpModal) helpModal.classList.remove('is-open');
    }
  };
}
