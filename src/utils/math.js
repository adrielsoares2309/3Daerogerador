/**
 * Utilitários matemáticos e físicos para a simulação e cadeia de geração eólica.
 * Todas as equações utilizam unidades do Sistema Internacional (SI).
 */

/**
 * Calcula os resultados do modelo matemático simplificado de geração eólica.
 *
 * @param {Object} params
 * @param {number} params.raio - Raio do rotor R (m)
 * @param {number} params.velocidade - Velocidade do vento v (m/s)
 * @param {number} params.densidade - Densidade do ar rho (kg/m³)
 * @param {number} params.cp - Coeficiente de potência Cp (adimensional, <= 16/27)
 * @param {number} [params.rendimentoPosRotor=0.94] - Eficiência global pós-rotor (transmissão + gerador + conversor)
 * @param {number} [params.relacaoTransmissao=80] - Relação da caixa multiplicadora (ex: 1:80)
 * @param {number} [params.tsr=7] - Tip Speed Ratio ilustrativo para estimar rotação
 */
export function calcularSimulacaoEolica({
  raio = 40,
  velocidade = 10,
  densidade = 1.225,
  cp = 0.45,
  rendimentoPosRotor = 0.94,
  relacaoTransmissao = 80
} = {}) {
  const LIMITE_BETZ = 16 / 27; // ~0.59259259...
  const cpEfetivo = Math.min(Math.max(cp, 0.05), LIMITE_BETZ);

  // Área varrida pelas pás: A = pi * R^2 (m²)
  const area = Math.PI * Math.pow(raio, 2);

  // Vazão mássica de ar: m_dot = rho * A * v (kg/s)
  const vazaoMassica = densidade * area * velocidade;

  // Potência disponível no vento: P_vento = 1/2 * rho * A * v^3 (W)
  const potenciaVentoW = 0.5 * densidade * area * Math.pow(velocidade, 3);

  // Potência mecânica capturada pelo rotor: P_rotor = P_vento * Cp (W)
  const potenciaRotorW = potenciaVentoW * cpEfetivo;

  // Potência elétrica estimada na saída: P_eletrica = P_rotor * eta (W)
  const potenciaEletricaW = potenciaRotorW * rendimentoPosRotor;

  // Estimativa cinemática ilustrativa (em 10 m/s e R=40 m -> ~15 RPM)
  // v_ponta = omega * R; para 15 RPM com R=40m e v=10m/s, omega = 15 * 2*pi / 60 = 1.5708 rad/s -> TSR = 6.283
  const rpmRotor = velocidade < 3 ? 0 : Math.min(22, (velocidade / 10) * (40 / Math.max(raio, 1)) * 15);
  const omegaRotor = (rpmRotor * 2 * Math.PI) / 60;
  const torqueRotorNm = omegaRotor > 0.01 ? potenciaRotorW / omegaRotor : 0;
  const rpmGerador = rpmRotor * relacaoTransmissao;

  // Corrente trifásica ilustrativa na saída do conversor (690 V, cos(phi) = 0.98)
  const tensaoGeradorV = 690;
  const cosPhi = 0.98;
  const correnteSaidaGeradorA = potenciaEletricaW / (Math.sqrt(3) * tensaoGeradorV * cosPhi);

  // Corrente após elevação para 34,5 kV na rede coletora
  const correnteRedeColetoraA = potenciaEletricaW / (Math.sqrt(3) * 34500 * cosPhi);

  // Status operacional na curva de potência ilustrativa
  let regiaoOperacao = 'Região 2 — Operação parcial (MPPT)';
  let statusCor = '#10b981';
  if (velocidade < 3) {
    regiaoOperacao = 'Região 1 — Abaixo do Cut-in (3 m/s): Rotor parado';
    statusCor = '#94a3b8';
  } else if (velocidade >= 12 && velocidade <= 25) {
    regiaoOperacao = 'Região 3 — Acima da velocidade nominal (12 m/s): Controle de Pitch ativo';
    statusCor = '#f59e0b';
  } else if (velocidade > 25) {
    regiaoOperacao = 'Região 4 — Acima do Cut-out (25 m/s): Parada de proteção';
    statusCor = '#ef4444';
  }

  return {
    raio,
    velocidade,
    densidade,
    cp: cpEfetivo,
    limiteBetz: LIMITE_BETZ,
    area,
    vazaoMassica,
    potenciaVentoW,
    potenciaVentoMW: potenciaVentoW / 1e6,
    potenciaRotorW,
    potenciaRotorMW: potenciaRotorW / 1e6,
    potenciaEletricaW,
    potenciaEletricaMW: potenciaEletricaW / 1e6,
    rpmRotor,
    omegaRotor,
    torqueRotorkNm: torqueRotorNm / 1e3,
    rpmGerador,
    correnteSaidaGeradorA,
    correnteRedeColetoraA,
    regiaoOperacao,
    statusCor
  };
}

/**
 * Gera série de dados da curva P(v) para o gráfico interativo do simulador.
 */
export function gerarCurvaVelocidadePotencia({ raio = 40, densidade = 1.225, cp = 0.45 } = {}) {
  const area = Math.PI * raio * raio;
  const pontos = [];
  for (let v = 0; v <= 22; v += 1) {
    const pVentoMW = (0.5 * densidade * area * Math.pow(v, 3)) / 1e6;
    const pRotorMW = pVentoMW * cp;
    const pEletricaMW = pRotorMW * 0.94;
    pontos.push({ v, pVentoMW, pRotorMW, pEletricaMW });
  }
  return pontos;
}

/**
 * Formata números no padrão brasileiro (vírgula decimal, ponto de milhar).
 */
export function formatarNumeroBR(valor, casasDecimais = 2) {
  if (!Number.isFinite(valor)) return '0';
  return valor.toLocaleString('pt-BR', {
    minimumFractionDigits: casasDecimais,
    maximumFractionDigits: casasDecimais
  });
}
