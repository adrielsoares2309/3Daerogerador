/**
 * Base de dados científica e didática das 7 etapas da cadeia de geração,
 * transmissão e distribuição de energia eólica.
 *
 * Todas as equações utilizam notação LaTeX renderizada via KaTeX offline.
 * Valores ilustrativos são explicitamente identificados como tal.
 */

export const CODIGO_CORES_TENSAO = [
  {
    id: 'geracao-bt',
    etapa: 'Saída do gerador / conversor',
    tensao: '690 V a 1.000 V (CA Trifásica)',
    corHex: '#00f5d4',
    corNome: 'Verde / Ciano'
  },
  {
    id: 'rede-coletora-mt',
    etapa: 'Rede coletora do parque',
    tensao: '34,5 kV (Média Tensão)',
    corHex: '#facc15',
    corNome: 'Amarelo'
  },
  {
    id: 'transmissao-at',
    etapa: 'Linhas de transmissão',
    tensao: '138 kV / 230 kV / 500 kV (Alta Tensão)',
    corHex: '#ef4444',
    corNome: 'Vermelho'
  },
  {
    id: 'distribuicao-primaria',
    etapa: 'Distribuição primária urbana',
    tensao: '13,8 kV (Média Tensão Urbana)',
    corHex: '#f97316',
    corNome: 'Laranja'
  },
  {
    id: 'distribuicao-secundaria',
    etapa: 'Distribuição secundária / Consumo',
    tensao: '127 V / 220 V / 380 V (Baixa Tensão)',
    corHex: '#3b82f6',
    corNome: 'Azul'
  }
];

export const ETAPAS_FISICA = [
  {
    id: 'etapa-1-vento-aerodinamica',
    numero: 1,
    tituloCurto: '1. Energia do Vento',
    titulo: 'Energia do vento e aerodinâmica das pás',
    subtitulo: 'Conversão da energia cinética atmosférica em potência mecânica rotacional',
    categoria: 'Mecânica dos Fluidos e Aerodinâmica',
    tensao: 'Não aplicável nesta etapa (Conversão Cinética → Mecânica)',
    faixaTensaoId: null,
    corTema: '#38bdf8',
    equipamentoAlvo: 'turbina-rotor',
    posicaoHotspot: { x: -250, y: 74, z: -22 },
    cameraPos: { x: -205, y: 82, z: 48 },
    cameraTarget: { x: -250, y: 68, z: -25 },
    resumoFisico:
      'O vento é o movimento de massas de ar provocado por diferenças de pressão atmosférica, resultantes do aquecimento desigual da superfície terrestre pela radiação solar. As pás do aerogerador atuam como aerofólios que convertem parte dessa energia cinética em torque mecânico no rotor.',
    explicacaoDetalhada: [
      {
        titulo: 'Origem do Vento e Vazão Mássica',
        texto:
          'Toda massa de ar em movimento possui energia cinética proporcional ao quadrado de sua velocidade. Quando o vento atravessa a área circular varrida pelas pás do rotor, estabelece-se um fluxo contínuo de massa de ar por segundo (vazão mássica). Para um rotor com raio ilustrativo de 40 m e vento a 10 m/s, cerca de 61,6 toneladas de ar cruzam o plano das pás a cada segundo.'
      },
      {
        titulo: 'Lei Cúbica da Potência do Vento',
        texto:
          'Como a potência representa a taxa de transferência de energia por unidade de tempo, o produto da vazão mássica pela energia cinética específica faz com que a potência disponível no vento dependa do cubo da velocidade. Consequentemente, dobrar a velocidade do vento multiplica por oito (2³ = 8) a potência disponível.'
      },
      {
        titulo: 'Aerofólio, Sustentação, Arrasto e Torção das Pás',
        texto:
          'As pás possuem perfil aerodinâmico (aerofólio). O vento relativo — soma vetorial da velocidade do vento incidente com a velocidade tangencial da pá — gera uma distribuição de pressão que resulta em duas forças: Sustentação (Lift, perpendicular ao escoamento relativo) e Arrasto (Drag, paralela ao escoamento). A componente tangencial da sustentação produz o torque que gira o rotor. Como a velocidade tangencial cresce do cubo até a ponta (v_t = ω·r), a pá é construída com uma torção geométrica progressiva para manter o ângulo de ataque ótimo em toda a sua extensão.'
      },
      {
        titulo: 'Limite de Betz: Por que não extrair 100%?',
        texto:
          'Uma turbina jamais pode capturar 100% da energia cinética do vento: se isso ocorresse, o ar pararia completamente imediatamente atrás do rotor, bloqueando a passagem de novas massas de ar. O físico Albert Betz demonstrou pela conservação de massa e quantidade de movimento que o limite teórico máximo para uma turbina ideal é 16/27 (aproximadamente 59,3%). Turbinas reais operam com coeficiente de potência (Cp) inferior a esse limite devido a perdas aerodinâmicas, vórtices de ponta de pá e atrito viscoso.'
      }
    ],
    componentes: [
      { nome: 'Pás Aerodinâmicas (Aerofólios)', funcao: 'Perfis com torção ao longo do raio que geram força de sustentação e torque.' },
      { nome: 'Área Varrida pelo Rotor (A)', funcao: 'Seção circular transversal de captação do fluxo de ar.' },
      { nome: 'Cubo do Rotor (Hub)', funcao: 'Concentra o torque produzido pelas três pás e o transfere ao eixo principal.' }
    ],
    formulas: [
      {
        nome: 'Energia Cinética de uma Massa de Ar',
        latex: 'E_c = \\frac{1}{2} m v^2',
        descricao: 'Ec em joules (J), massa m em kg e velocidade v em m/s.'
      },
      {
        nome: 'Área Varrida e Vazão Mássica',
        latex: 'A = \\pi R^2 \\quad \\Longrightarrow \\quad \\dot{m} = \\rho A v',
        descricao: 'Raio do rotor R (m), área A (m²), densidade do ar ρ (kg/m³) e vazão mássica (kg/s).'
      },
      {
        nome: 'Potência Disponível no Vento',
        latex: 'P_{\\text{vento}} = \\frac{1}{2} \\rho A v^3',
        descricao: 'A potência cresce com o cubo da velocidade: dobrar v multiplica P por 8.'
      },
      {
        nome: 'Torque e Potência Mecânica Rotacional',
        latex: '\\tau = F_t \\cdot r \\quad \\text{e} \\quad P_{\\text{mec}} = \\tau \\cdot \\omega',
        descricao: 'Torque τ (N·m), força tangencial Ft (N), raio r (m) e velocidade angular ω (rad/s).'
      },
      {
        nome: 'Limite de Betz e Potência Capturada pelo Rotor',
        latex: 'C_{p,\\max} = \\frac{16}{27} \\approx 59,3\\% \\quad \\Longrightarrow \\quad P_{\\text{rotor}} = \\frac{1}{2} \\rho A v^3 C_p',
        descricao: 'Cp é o coeficiente de potência real do rotor (tipicamente entre 0,40 e 0,50 em operação ótima).'
      }
    ],
    valoresTipicos: [
      { rotulo: 'Densidade padrão do ar (nível do mar, 15 °C)', valor: '1,225 kg/m³' },
      { rotulo: 'Raio ilustrativo de turbina comercial', valor: '40 m (Área ≈ 5.026,5 m²)' },
      { rotulo: 'Limite teórico de Betz (Cp máximo ideal)', valor: '16/27 ≈ 59,3%' },
      { rotulo: 'Coeficiente de potência típico real (Cp)', valor: '0,42 a 0,48 (42% a 48%)' },
      { rotulo: 'Relação cúbica (vento 5 m/s → 10 m/s → 20 m/s)', valor: 'Potência relativa: 1× → 8× → 64×' }
    ],
    observacoesTecnicas: [
      'Atenção conceitual: O Limite de Betz (59,3%) não é a eficiência real de qualquer turbina, mas sim a barreira física máxima teórica de extração aerodinâmica em escoamento livre.',
      'Diferença fundamental: Energia (medida em joules ou kWh) é a capacidade acumulada de realizar trabalho; Potência (medida em watts ou MW) é a taxa instantânea de conversão de energia por segundo (1 W = 1 J/s).'
    ]
  },

  {
    id: 'etapa-2-estrutura-interna-transmissao',
    numero: 2,
    tituloCurto: '2. Nacele e Controle',
    titulo: 'Estrutura interna, transmissão e controle',
    subtitulo: 'Cinemática rotacional, multiplicação de velocidade e automação da nacele',
    categoria: 'Engenharia Mecânica e Automação Industrial',
    tensao: 'Não aplicável diretamente nesta etapa (Transmissão Mecânica e Controle)',
    faixaTensaoId: null,
    corTema: '#2dd4bf',
    equipamentoAlvo: 'turbina-nacele',
    posicaoHotspot: { x: -246, y: 70, z: -29 },
    cameraPos: { x: -222, y: 74, z: -6 },
    cameraTarget: { x: -250, y: 70, z: -28 },
    temInspecaoInterna: true,
    resumoFisico:
      'No topo da torre encontra-se a nacele, que abriga o trem de força mecânico e os sistemas de controle. O rotor gira em baixa rotação e altíssimo torque; a caixa multiplicadora eleva a velocidade angular para o patamar exigido pelo gerador elétrico convencional, enquanto os sistemas de automação (Pitch, Yaw e SCADA) garantem eficiência e segurança.',
    explicacaoDetalhada: [
      {
        titulo: 'Trem de Força Mecânico na Nacele',
        texto:
          'O cubo (hub) transfere o movimento das pás ao eixo principal de baixa rotação, sustentado por mancais e rolamentos de alta capacidade que suportam cargas radiais, axiais e momentos fletores. Em turbinas com transmissão mecânica, esse eixo aciona uma caixa multiplicadora (gearbox) composta por estágios de engrenagens planetárias (solar, planetárias e coroa) e engrenagens paralelas, entregando alta rotação e menor torque ao eixo de alta velocidade ligado ao gerador.'
      },
      {
        titulo: 'Conservação de Potência na Transmissão',
        texto:
          'Desconsiderando as perdas por atrito nas engrenagens, a potência mecânica (P = τ · ω) conserva-se entre a entrada e a saída da caixa multiplicadora. Assim, em uma relação ilustrativa de 1:80, elevar a rotação de 15 RPM para 1.200 RPM reduz o torque no eixo rápido na mesma proporção de 80 vezes.'
      },
      {
        titulo: 'Turbinas Direct Drive (Acionamento Direto)',
        texto:
          'Nem todo aerogerador utiliza caixa multiplicadora. Nas turbinas direct drive, o rotor mecânico é acoplado diretamente a um gerador síncrono de múltiplos polos de grande diâmetro, projetado especificamente para induzir tensão mesmo em baixíssimas rotações (5 a 20 RPM). Isso elimina a caixa de engrenagens, reduzindo o número de peças sujeitas a desgaste e manutenção.'
      },
      {
        titulo: 'Automação, Controle (Pitch, Yaw, SCADA) e Curva de Potência',
        texto:
          'No exterior da nacele, o anemômetro mede a velocidade do vento e a biruta identifica sua direção. O controlador aciona o sistema de Yaw (motores e coroa dentada no topo da torre) para alinhar a nacele frente ao vento, e o sistema de Pitch (atuadores no cubo) para girar as pás em torno de seu eixo longitudinal. O sistema opera em 4 regiões da curva de potência: permanece parado abaixo do cut-in (~3 m/s); maximiza a captura entre 3 e 12 m/s; limita a potência pela variação do pitch entre a velocidade nominal (~12 m/s) e o cut-out (~25 m/s); e aciona o pitch de bandeira e o freio mecânico a disco acima de 25 m/s para proteção estrutural. Tudo é supervisionado remotamente via SCADA.'
      }
    ],
    componentes: [
      { nome: 'Cubo (Hub) e Sistema de Pitch', funcao: 'Fixa as pás e gira seu ângulo de ataque para controlar a potência ou frear aerodinamicamente.' },
      { nome: 'Eixo de Baixa Rotação, Mancais e Rolamentos', funcao: 'Transmitem torque elevado (~5 a 20 RPM) absorvendo esforços axiais e radiais.' },
      { nome: 'Caixa Multiplicadora (Planetárias + Paralelas)', funcao: 'Aumenta a velocidade angular (ex: relação 1:80) para o eixo de alta rotação.' },
      { nome: 'Eixo de Alta Rotação e Freio Mecânico', funcao: 'Conecta a saída da multiplicadora ao gerador e possui freio a disco para parada segura.' },
      { nome: 'Anemômetro, Biruta, Yaw e SCADA', funcao: 'Medem vento, orientam a nacele e supervisionam alarmes, vibração e temperatura.' }
    ],
    formulas: [
      {
        nome: 'Relação de Transmissão Mecânica',
        latex: 'i = \\frac{n_{\\text{saída}}}{n_{\\text{entrada}}} = \\frac{\\omega_2}{\\omega_1} \\approx \\frac{\\tau_1}{\\tau_2}',
        descricao: 'Ao multiplicar a velocidade angular por i, o torque no eixo de alta rotação é dividido por i (desprezando perdas).'
      },
      {
        nome: 'Exemplo Ilustrativo de Multiplicação (1:80)',
        latex: 'n_{\\text{saída}} = 15\\text{ RPM} \\times 80 = 1.200\\text{ RPM}',
        descricao: 'Converte a rotação lenta das pás em velocidade adequada para geradores convencionais.'
      },
      {
        nome: 'Velocidade Tangencial ao Longo da Pá',
        latex: 'v_t = \\omega \\cdot r = \\frac{2\\pi n}{60} \\cdot r',
        descricao: 'Relaciona a rotação em RPM com a velocidade linear em qualquer raio r.'
      }
    ],
    valoresTipicos: [
      { rotulo: 'Rotação típica do rotor eólico (baixa velocidade)', valor: '5 a 20 RPM (ilustrativo: 15 RPM)' },
      { rotulo: 'Relação de transmissão ilustrativa (Gearbox)', valor: '1:80 (Saída: 1.200 RPM)' },
      { rotulo: 'Velocidade de partida (Cut-in ilustrativo)', valor: '3 m/s' },
      { rotulo: 'Velocidade de potência nominal (ilustrativa)', valor: '12 m/s' },
      { rotulo: 'Velocidade de corte de segurança (Cut-out ilustrativo)', valor: '25 m/s' }
    ],
    observacoesTecnicas: [
      'Atenção: Como o modelo 3D externo da turbina representa a carenagem fechada da nacele, utilize o diagrama técnico interativo de Raio-X da Nacele neste painel para inspecionar a disposição interna real dos componentes.',
      'Não confunda rotor mecânico (conjunto externo de cubo + pás movido pelo vento) com rotor eletromagnético (parte girante interna do gerador elétrico que produz o campo magnético).'
    ]
  },

  {
    id: 'etapa-3-gerador-eletronica-potencia',
    numero: 3,
    tituloCurto: '3. Gerador e Conversores',
    titulo: 'Conversão eletromagnética e condicionamento da energia',
    subtitulo: 'Lei de Faraday-Lenz, geração trifásica e eletrônica de potência (CA → CC → CA 60 Hz)',
    categoria: 'Eletromagnetismo e Eletrônica de Potência',
    tensao: '690 V a 1.000 V (CA Trifásica sincronizada em 60 Hz)',
    faixaTensaoId: 'geracao-bt',
    corTema: '#00f5d4',
    equipamentoAlvo: 'turbina-gerador',
    posicaoHotspot: { x: -250, y: 38, z: -24 },
    cameraPos: { x: -218, y: 46, z: 12 },
    cameraTarget: { x: -250, y: 40, z: -25 },
    temInspecaoInterna: true,
    resumoFisico:
      'O gerador elétrico converte a potência mecânica do eixo em potência elétrica por meio da Indução Eletromagnética (Lei de Faraday-Lenz). Como a velocidade do vento varia constantemente, a frequência gerada também varia; por isso, conversores eletrônicos de potência (Retificador → Barramento CC → Inversor PWM) são indispensáveis para entregar energia perfeitamente estabilizada em 60 Hz.',
    explicacaoDetalhada: [
      {
        titulo: 'Lei de Faraday e Lei de Lenz no Gerador',
        texto:
          'O gerador é constituído pelo rotor eletromagnético (parte girante que produz o campo magnético por ímãs permanentes ou eletroímãs) e pelo estator (parte fixa com bobinas de cobre). Ao girar o rotor, o fluxo magnético Φ_B que atravessa as espiras do estator varia no tempo, induzindo uma força eletromotriz (ε). Pelo sinal negativo da Lei de Lenz, quando o gerador fornece corrente a uma carga, o campo induzido cria um conjugado eletromagnético resistente que se opõe ao movimento, exigindo torque mecânico contínuo do vento.'
      },
      {
        titulo: 'Corrente Alternada Trifásica (Defasagem de 120°)',
        texto:
          'O estator possui três conjuntos de bobinas distribuídos espacialmente a 120° elétricos entre si. A rotação do campo magnético induz três tensões senoidais de mesma amplitude e frequência, defasadas em 120°, formando um sistema trifásico equilibrado ideal para geração e transporte eficiente de potência.'
      },
      {
        titulo: 'Arquiteturas de Geradores: PMSG vs. DFIG',
        texto:
          'Duas famílias predominam: (1) PMSG (Gerador Síncrono de Ímãs Permanentes), que dispensa excitação externa no rotor, permite projetos multipolos (inclusive direct drive) e utiliza conversor pleno (100% da potência); e (2) DFIG (Gerador de Indução Duplamente Alimentado), usado com caixa multiplicadora, cujo estator liga-se diretamente à rede enquanto um conversor parcial conectado ao rotor bobinado controla a frequência de escorregamento e a potência reativa.'
      },
      {
        titulo: 'Por que usar Eletrônica de Potência? (Gerador → Retificador → DC Link → Inversor PWM)',
        texto:
          'O gerador eólico NÃO produz diretamente 60 Hz constantes quando o vento oscila. Para compatibilizar a geração com a rede elétrica brasileira (60 Hz), a energia percorre três estágios no conversor pleno: (1) Retificador (ponte de diodos ou IGBTs) que converte a CA de frequência variável em Corrente Contínua (CC); (2) Barramento CC (DC Link) com banco de capacitores que armazena energia no campo elétrico e filtra oscilações, desacoplando o gerador da rede; e (3) Inversor PWM (Modulação por Largura de Pulso com chaves IGBT), que chaveia em alta frequência para sintetizar uma onda CA trifásica senoidal pura em 60 Hz, controlando tensão, frequência e fator de potência.'
      }
    ],
    componentes: [
      { nome: 'Rotor Magnético e Estator Trifásico', funcao: 'Produzem campo magnético girante e induzem tensões trifásicas defasadas de 120°.' },
      { nome: 'Gerador PMSG ou DFIG', funcao: 'Realiza a conversão eletromecânica de energia em velocidade variável.' },
      { nome: 'Retificador Trifásico (Diodos / IGBTs)', funcao: 'Converte a corrente alternada (CA) de frequência variável do gerador em corrente contínua (CC).' },
      { nome: 'Barramento CC (DC Link) e Capacitores', funcao: 'Estabiliza a tensão contínua e desacopla a dinâmica mecânica do rotor da frequência da rede.' },
      { nome: 'Inversor Trifásico PWM (IGBTs)', funcao: 'Sintetiza corrente alternada trifásica sincronizada em 60 Hz para injeção na rede.' }
    ],
    formulas: [
      {
        nome: 'Lei da Indução de Faraday-Lenz',
        latex: '\\varepsilon = -N \\frac{d\\Phi_B}{dt}',
        descricao: 'Força eletromotriz induzida ε (V), número de espiras N e taxa de variação do fluxo magnético ΦB (Wb/s). O sinal negativo expressa a Lei de Lenz.'
      },
      {
        nome: 'Tensões Trifásicas Equilibradas (Defasagem de 120°)',
        latex: 'v_A(t) = V_m\\sin(\\omega t), \\quad v_B(t) = V_m\\sin(\\omega t - 120^\\circ), \\quad v_C(t) = V_m\\sin(\\omega t - 240^\\circ)',
        descricao: 'Três fases senoidais simétricas geradas nos enrolamentos do estator.'
      },
      {
        nome: 'Energia Armazenada nos Capacitores do Barramento CC',
        latex: 'E_{\\text{cap}} = \\frac{1}{2} C V^2',
        descricao: 'Energia E (J), capacitância C (F) e tensão contínua V (V) no DC Link.'
      },
      {
        nome: 'Potência Elétrica Ativa Trifásica',
        latex: 'P = \\sqrt{3} \\cdot V_L \\cdot I_L \\cdot \\cos\\varphi',
        descricao: 'Tensão de linha VL (V), corrente de linha IL (A) e fator de potência cos φ.'
      }
    ],
    valoresTipicos: [
      { rotulo: 'Tensão de saída ilustrativa do gerador/inversor', valor: '690 V a 1.000 V (CA Trifásica)' },
      { rotulo: 'Frequência nominal sincronizada na saída do inversor', valor: '60 Hz (padrão do SIN no Brasil)' },
      { rotulo: 'Defasagem elétrica entre as fases A, B e C', valor: '120° (2π/3 rad)' },
      { rotulo: 'Corrente ilustrativa para 1,30 MW em 690 V (cos φ = 0,98)', valor: '≈ 1.110 A por fase (muito elevada para longas distâncias)' }
    ],
    observacoesTecnicas: [
      'Precisão científica: Diferencie Corrente Alternada (CA), na qual portadores de carga oscilam periodicamente invertendo sentido, de Corrente Contínua (CC), na qual a polaridade da tensão no barramento permanece unidirecional.',
      'Diferencie Tensão (diferença de potencial elétrico, em volts - V) de Corrente (fluxo ordenado de cargas elétricas por segundo, em ampères - A).'
    ]
  },

  {
    id: 'etapa-4-transformador-rede-coletora',
    numero: 4,
    tituloCurto: '4. Trafo e Rede Coletora',
    titulo: 'Elevação da tensão e rede coletora de média tensão',
    subtitulo: 'Indução mútua no transformador do aerogerador (690 V → 34,5 kV)',
    categoria: 'Eletromagnetismo Aplicado e Redes de Média Tensão',
    tensao: 'Entrada: 690 V a 1.000 V → Saída: 34,5 kV (CA Trifásica)',
    faixaTensaoId: 'rede-coletora-mt',
    corTema: '#facc15',
    equipamentoAlvo: 'transformador-base',
    posicaoHotspot: { x: -242, y: 8, z: -20 },
    cameraPos: { x: -215, y: 18, z: 10 },
    cameraTarget: { x: -244, y: 6, z: -22 },
    resumoFisico:
      'A energia que deixa o conversor em baixa tensão (690 V a 1.000 V) possui corrente elétrica superior a 1.000 A. Para transportá-la pelo parque eólico até a subestação sem perdas proibitivas nem cabos de seção impraticável, um transformador elevador na base da turbina eleva a tensão para 34,5 kV por indução mútua, reduzindo a corrente na mesma proporção.',
    explicacaoDetalhada: [
      {
        titulo: 'Por que elevar a tensão logo na base da turbina?',
        texto:
          'Pela expressão da potência trifásica (P = √3 · V · I · cos φ), para transportar uma mesma potência ativa, a corrente elétrica é inversamente proporcional à tensão. Em 690 V, uma turbina de 1,30 MW demanda cerca de 1.110 A. Ao elevar a tensão em 50 vezes (para 34.500 V = 34,5 kV), a corrente cai 50 vezes, passando para cerca de 22,2 A.'
      },
      {
        titulo: 'Física do Transformador: Núcleo Ferromagnético e Indução Mútua',
        texto:
          'O transformador opera exclusivamente em corrente alternada. A corrente alternada no enrolamento primário (N1 espiras) cria um fluxo magnético variável no tempo que fica confinado e guiado por um núcleo ferromagnético laminado de alta permeabilidade. Esse mesmo fluxo variável atravessa o enrolamento secundário (N2 espiras), induzindo nele uma tensão proporcional à relação do número de espiras.'
      },
      {
        titulo: 'Transformador Elevador (N2 > N1)',
        texto:
          'Como o enrolamento secundário possui muito mais espiras que o primário (N2 > N1), a tensão no secundário é multiplicada (V2 > V1). Pela conservação da energia em um transformador ideal (V1 · I1 = V2 · I2), o aumento da tensão implica a redução inversamente proporcional da corrente elétrica (I2 < I1).'
      },
      {
        titulo: 'Rede Coletora de Média Tensão (34,5 kV)',
        texto:
          'A saída em 34,5 kV alimenta a rede coletora do parque eólico — composta por cabos subterrâneos isolados ou linhas aéreas de média tensão — que interliga as diversas turbinas do parque e conduz toda a potência gerada até o barramento de entrada da subestação elevadora central.'
      }
    ],
    componentes: [
      { nome: 'Transformador Elevador Pad-Mounted (Base da Torre)', funcao: 'Eleva a tensão de geração (690–1.000 V) para média tensão (34,5 kV).' },
      { nome: 'Núcleo Ferromagnético Laminado', funcao: 'Conduz o fluxo magnético alternado entre as bobinas reduzindo perdas por correntes parasitas (Foucault).' },
      { nome: 'Enrolamento Primário (BT) e Secundário (MT)', funcao: 'Bobinas com relação de espiras N2/N1 que definem o ganho de tensão.' },
      { nome: 'Rede Coletora Subterrânea / Aérea (34,5 kV)', funcao: 'Recolhe a energia das turbinas do parque e a entrega à subestação elevadora.' }
    ],
    formulas: [
      {
        nome: 'Relação de Transformação de Tensões',
        latex: '\\frac{V_2}{V_1} = \\frac{N_2}{N_1}',
        descricao: 'A razão entre as tensões secundária (V2) e primária (V1) é igual à razão entre os números de espiras N2 e N1.'
      },
      {
        nome: 'Relação Inversa de Correntes (Transformador Ideal)',
        latex: '\\frac{I_2}{I_1} = \\frac{N_1}{N_2} \\quad \\Longrightarrow \\quad V_1 I_1 = V_2 I_2',
        descricao: 'Ao elevar a tensão em 50 vezes (690 V → 34,5 kV), a corrente elétrica é reduzida em 50 vezes.'
      }
    ],
    valoresTipicos: [
      { rotulo: 'Tensão no enrolamento primário (V1)', valor: '690 V a 1.000 V (ilustrativo: 690 V)' },
      { rotulo: 'Tensão no enrolamento secundário (V2 - Rede Coletora)', valor: '34,5 kV (34.500 V)' },
      { rotulo: 'Relação de transformação ilustrativa (34.500 / 690)', valor: '1 : 50 (N2 = 50 × N1)' },
      { rotulo: 'Redução de corrente (para 1,30 MW)', valor: 'De ~1.110 A (em 690 V) para ~22,2 A (em 34,5 kV)' }
    ],
    observacoesTecnicas: [
      'Por que o transformador não funciona em Corrente Contínua (CC) estacionária? Porque uma corrente contínua constante produz fluxo magnético constante (dΦB/dt = 0), e pela Lei de Faraday não há tensão induzida sem variação temporal de fluxo.'
    ]
  },

  {
    id: 'etapa-5-subestacao-elevadora-transmissao',
    numero: 5,
    tituloCurto: '5. Subestação e Transmissão',
    titulo: 'Subestação elevadora e linhas de transmissão',
    subtitulo: 'Transporte em alta tensão (138 / 230 / 500 kV) e minimização do Efeito Joule',
    categoria: 'Sistemas de Potência e Transmissão em Alta Tensão',
    tensao: 'Entrada: 34,5 kV → Transmissão: 138 kV, 230 kV ou 500 kV',
    faixaTensaoId: 'transmissao-at',
    corTema: '#ef4444',
    equipamentoAlvo: 'subestacao-elevadora',
    posicaoHotspot: { x: -120, y: 24, z: 15 },
    cameraPos: { x: -75, y: 45, z: 95 },
    cameraTarget: { x: -95, y: 18, z: 10 },
    resumoFisico:
      'Parques eólicos localizam-se em regiões de ventos intensos (litoral ou chapadas), frequentemente a centenas de quilômetros dos grandes centros urbanos. A subestação elevadora concentra a energia da rede coletora (34,5 kV) e eleva a tensão para Alta ou Extra-Alta Tensão (138 kV, 230 kV ou 500 kV), reduzindo drasticamente as perdas térmicas por Efeito Joule nas linhas de transmissão.',
    explicacaoDetalhada: [
      {
        titulo: 'Concentração de Potência na Subestação Elevadora',
        texto:
          'A subestação do parque recebe os circuitos de 34,5 kV de dezenas de aerogeradores. Através de barramentos, chaves seccionadoras, disjuntores de alta tensão e transformadores de força resfriados a óleo isolante, a tensão é elevada para níveis do Sistema Interligado Nacional (138 kV, 230 kV ou 500 kV).'
      },
      {
        titulo: 'Física do Efeito Joule nas Linhas de Transmissão',
        texto:
          'Todo condutor metálico possui resistência elétrica (R = ρ_el · L / A_cabo). Quando a corrente elétrica I percorre centenas de quilômetros de linha, os elétrons colidem com a rede cristalina do metal, dissipando potência elétrica sob a forma de calor. Essa perda térmica é governada pela Lei de Joule: P_perda = R · I².'
      },
      {
        titulo: 'Demonstração Comparativa: Multiplicar V por 10 reduz perdas em 100 vezes',
        texto:
          'Como a potência transmitida é P = √3 · V · I · cos φ, a corrente na linha vale I = P / (√3 · V · cos φ). Substituindo na equação de Joule, obtemos que a perda resistiva é inversamente proporcional ao quadrado da tensão (P_perda ∝ 1/V²). Portanto, mantendo constantes a potência transmitida, a resistência do cabo e o fator de potência: se multiplicarmos a tensão por 10, a corrente elétrica cai 10 vezes (I/10) e as perdas por aquecimento caem 10² = 100 vezes!'
      },
      {
        titulo: 'Engenharia das Torres e Cabos CAA (ACSR)',
        texto:
          'As torres metálicas treliçadas sustentam os condutores a grande altura do solo por segurança contra arcos elétricos. Os cabos são do tipo CAA (Condutor de Alumínio com Alma de Aço): os fios externos de alumínio conduzem a corrente com baixo peso específico e custo reduzido em relação ao cobre, enquanto o núcleo central de aço garante resistência à tração mecânica dos grandes vãos. Cadeias de isoladores de vidro temperado ou porcelana impedem que a alta tensão escoe para a estrutura metálica aterrada da torre.'
      }
    ],
    componentes: [
      { nome: 'Transformadores Elevadores de Potência', funcao: 'Elevam a tensão de 34,5 kV para 138 kV, 230 kV ou 500 kV.' },
      { nome: 'Disjuntores, Seccionadoras e Para-raios de Subestação', funcao: 'Interrompem correntes de falta, isolam barramentos para manutenção e desviam surtos atmosféricos à malha de terra.' },
      { nome: 'Torres Metálicas Treliçadas de Alta Tensão', funcao: 'Sustentam os circuitos trifásicos e cabos para-raios com distâncias seguras de isolamento.' },
      { nome: 'Cadeias de Isoladores (Vidro / Porcelana / Poliméricos)', funcao: 'Isolam eletricamente os cabos energizados em relação à estrutura metálica da torre.' },
      { nome: 'Cabos de Alumínio com Alma de Aço (CAA / ACSR)', funcao: 'Aliam a condutividade e leveza do alumínio à resistência mecânica à tração do aço.' }
    ],
    formulas: [
      {
        nome: 'Perda de Potência por Efeito Joule',
        latex: 'P_{\\text{perda}} = R \\cdot I^2',
        descricao: 'Potência dissipada em calor (W) em função da resistência da linha R (Ω) e do quadrado da corrente I (A).'
      },
      {
        nome: 'Perda Resistiva em Função da Tensão de Transmissão',
        latex: 'I = \\frac{P}{\\sqrt{3}\\,V\\cos\\varphi} \\quad \\Longrightarrow \\quad P_{\\text{perda}} = R \\cdot \\frac{P^2}{3\\,V^2\\cos^2\\varphi}',
        descricao: 'Demonstra matematicamente que a perda na linha cai com o quadrado da tensão de linha V.'
      },
      {
        nome: 'Demonstração Comparativa (Tensão multiplicada por 10)',
        latex: 'V\' = 10V \\implies I\' = \\frac{I}{10} \\implies P\'_{\\text{perda}} = R\\left(\\frac{I}{10}\\right)^2 = \\frac{P_{\\text{perda}}}{100}',
        descricao: 'Elevar a tensão em 10× reduz a corrente em 10× e reduz a perda por Efeito Joule em 100×.'
      }
    ],
    valoresTipicos: [
      { rotulo: 'Tensão de entrada na subestação elevadora', valor: '34,5 kV (Média Tensão)' },
      { rotulo: 'Tensões típicas de transmissão no Brasil (ilustrativas)', valor: '138 kV, 230 kV e 500 kV' },
      { rotulo: 'Fator de redução de corrente ao elevar a tensão em 10×', valor: 'Corrente 10 vezes menor (I / 10)' },
      { rotulo: 'Fator de redução de perdas térmicas ao elevar a tensão em 10×', valor: 'Perdas 100 vezes menores (P_perda / 100)' }
    ],
    observacoesTecnicas: [
      'Distinção essencial: Geração é a conversão primária de energia em eletricidade na usina; Transmissão é o transporte em alta tensão e longa distância entre subestações; Distribuição é a entrega capilar em média e baixa tensão dentro das cidades.'
    ]
  },

  {
    id: 'etapa-6-subestacao-abaixadora-distribuicao-urbana',
    numero: 6,
    tituloCurto: '6. Subestação e Poste Urbano',
    titulo: 'Subestação abaixadora e rede primária urbana',
    subtitulo: 'Rebaixamento para média tensão urbana (13,8 kV) e transformador de distribuição no poste',
    categoria: 'Subestação de Distribuição e Rede Primária Urbana',
    tensao: 'Entrada: 138/230/500 kV → Rede Primária: 13,8 kV → Saída do Poste: 127/220 V ou 220/380 V',
    faixaTensaoId: 'distribuicao-primaria',
    corTema: '#f97316',
    equipamentoAlvo: 'distribuicao-urbana',
    posicaoHotspot: { x: 185, y: 14, z: 5 },
    cameraPos: { x: 170, y: 26, z: 58 },
    cameraTarget: { x: 178, y: 12, z: 5 },
    resumoFisico:
      'Ao chegar à periferia das cidades, linhas de 138 kV a 500 kV não podem adentrar ruas residenciais devido ao risco de arco elétrico e às grandes faixas de segurança necessárias. Uma subestação abaixadora reduz a tensão para a rede de distribuição primária (tipicamente 13,8 kV), que percorre o topo dos postes urbanos até os transformadores de poste, onde é novamente rebaixada para a baixa tensão de consumo.',
    explicacaoDetalhada: [
      {
        titulo: 'Subestação Abaixadora e Proteção Seletiva',
        texto:
          'Na entrada da zona urbana, transformadores abaixadores de potência reduzem a alta tensão da transmissão (138 kV, 230 kV ou 500 kV) para média tensão de distribuição (padrão ilustrativo de 13,8 kV no Brasil). A subestação conta com para-raios, transformadores de corrente e potencial (TCs e TPs), relés digitais de proteção e disjuntores que monitoram os alimentadores urbanos, desligando automaticamente um circuito caso ocorra curto-circuito por queda de árvore ou colisão.'
      },
      {
        titulo: 'Rede de Distribuição Primária (13,8 kV)',
        texto:
          'Os três condutores que correm no nível mais alto dos postes urbanos compõem a rede primária trifásica em 13,8 kV. Eles são sustentados sobre cruzetas (de concreto, madeira ou fibra) por meio de isoladores de pino ou disco, mantendo afastamento seguro entre as fases e o poste.'
      },
      {
        titulo: 'Chaves Fusíveis e Transformador de Poste',
        texto:
          'Em cada quarteirão ou setor de consumo, uma derivação da rede primária de 13,8 kV passa por chaves fusíveis (conhecidas como "canelas") e para-raios poliméricos antes de alimentar o primário do transformador de distribuição instalado no poste. Em caso de sobrecarga severa ou curto-circuito interno, o elo fusível funde-se e o cartucho da chave abre-se visivelmente por gravidade, isolando o defeito.'
      },
      {
        titulo: 'Tensão de Linha vs. Tensão de Fase no Secundário (Estrela Aterrada)',
        texto:
          'O secundário do transformador de poste é geralmente conectado em configuração Estrela com neutro aterrado (Y-aterrado), disponibilizando quatro condutores na rede secundária: três fases (A, B, C) e um neutro (N). Devido à defasagem geométrica de 120° entre os fasores das fases, a tensão de linha (medida entre duas fases quaisquer, V_L) é igual a √3 (≈ 1,732) vezes a tensão de fase (medida entre uma fase e o neutro, V_F). Por isso existem os padrões comerciais 127 V / 220 V (pois 127 × √3 ≈ 220 V) e 220 V / 380 V (pois 220 × √3 ≈ 381 V).'
      }
    ],
    componentes: [
      { nome: 'Subestação Abaixadora (Transformadores, Disjuntores e Relés)', funcao: 'Rebaixa a alta tensão de transmissão para 13,8 kV e protege os alimentadores urbanos.' },
      { nome: 'Rede Primária (13,8 kV), Cruzetas e Isoladores', funcao: 'Três condutores de média tensão instalados no topo dos postes urbanos.' },
      { nome: 'Chaves Fusíveis e Para-raios de Distribuição', funcao: 'Protegem o transformador de poste contra sobrecorrentes de curto-circuito e descargas atmosféricas.' },
      { nome: 'Transformador de Distribuição em Poste', funcao: 'Rebaixa os 13,8 kV da rede primária para a baixa tensão secundária (127/220 V ou 220/380 V).' }
    ],
    formulas: [
      {
        nome: 'Relação de Transformação Abaixadora (N2 < N1)',
        latex: 'V_2 = V_1 \\cdot \\frac{N_2}{N_1} \\quad (\\text{com } N_2 < N_1 \\implies V_2 < V_1)',
        descricao: 'O enrolamento secundário possui menos espiras que o primário, reduzindo a tensão para níveis seguros.'
      },
      {
        nome: 'Relação entre Tensão de Linha e Tensão de Fase (Sistema Trifásico em Estrela)',
        latex: 'V_{\\text{linha}} = \\sqrt{3} \\cdot V_{\\text{fase}}',
        descricao: 'Explica por que sistemas com 127 V fase-neutro possuem 220 V fase-fase (127 × 1,732 ≈ 220 V), e 220 V fase-neutro possuem 380 V fase-fase.'
      }
    ],
    valoresTipicos: [
      { rotulo: 'Tensão de entrada na subestação abaixadora', valor: '138 kV, 230 kV ou 500 kV' },
      { rotulo: 'Tensão da rede de distribuição primária urbana', valor: '13,8 kV (13.800 V)' },
      { rotulo: 'Padrão secundário 1 (Fase-Neutro / Fase-Fase)', valor: '127 V / 220 V (127 × √3 ≈ 220 V)' },
      { rotulo: 'Padrão secundário 2 (Fase-Neutro / Fase-Fase)', valor: '220 V / 380 V (220 × √3 ≈ 381 V)' }
    ],
    observacoesTecnicas: [
      'Precisão física: Não existe "rede de 110 V" padronizada no sistema moderno brasileiro; o valor nominal correto da tensão de fase associada ao sistema de linha 220 V trifásico é 127 V, decorrente da relação trigonométrica exata 220 / √3 ≈ 127,02 V.'
    ]
  },

  {
    id: 'etapa-7-rede-secundaria-residencia',
    numero: 7,
    tituloCurto: '7. Consumo Residencial',
    titulo: 'Distribuição final e consumo residencial',
    subtitulo: 'Rede secundária, padrão de entrada, proteção (disjuntores e aterramento) e energia em kWh',
    categoria: 'Instalações Elétricas Residenciais e Consumo Final',
    tensao: '127 V / 220 V ou 220 V / 380 V (CA 60 Hz)',
    faixaTensaoId: 'distribuicao-secundaria',
    corTema: '#3b82f6',
    equipamentoAlvo: 'residencia-consumo',
    posicaoHotspot: { x: 265, y: 10, z: 5 },
    cameraPos: { x: 242, y: 18, z: 38 },
    cameraTarget: { x: 265, y: 7, z: 5 },
    resumoFisico:
      'Na última etapa da cadeia, a energia em baixa tensão percorre a rede secundária abaixo do transformador do poste e deriva pelo ramal de ligação até o padrão de entrada da residência. Após passar pelo medidor de energia (que integra a potência no tempo em kWh) e pelo quadro de distribuição com disjuntores e barramento de aterramento, a energia alimenta tomadas, iluminação e eletrodomésticos.',
    explicacaoDetalhada: [
      {
        titulo: 'Rede Secundária, Ramal de Ligação e Modalidades de Fornecimento',
        texto:
          'Abaixo do transformador de poste correm os 4 condutores da rede secundária (3 Fases + 1 Neutro). O ramal de ligação conecta o poste ao padrão de entrada da residência em três configurações possíveis conforme a carga instalada: (1) Monofásica (2 condutores: 1 Fase + 1 Neutro), para pequenas cargas; (2) Bifásica (3 condutores: 2 Fases + 1 Neutro), permitindo simultaneamente tensão de fase (ex: 127 V) e tensão de linha (ex: 220 V para chuveiros e ar-condicionado); e (3) Trifásica (4 condutores: 3 Fases + 1 Neutro), para residências de maior porte ou oficinas com motores.'
      },
      {
        titulo: 'Padrão de Entrada e Medidor de Energia Elétrica (kWh)',
        texto:
          'No padrão de entrada fica o medidor de energia elétrica. É fundamental não confundir Potência (W ou kW, taxa instantânea de uso de energia) com Energia Elétrica Consumida (Wh ou kWh, produto da potência pelo intervalo de tempo de operação). O faturamento mensal mede a energia total convertida em trabalho térmico, luminoso ou mecânico nos aparelhos da residência.'
      },
      {
        titulo: 'Exemplo Prático de Consumo Elétrico',
        texto:
          'Considere uma lâmpada ou equipamento com potência constante P = 100 W permanecendo ligado durante um intervalo de tempo Δt = 10 horas. A energia elétrica consumida será E = P × Δt = 100 W × 10 h = 1.000 Wh = 1 kWh (equivalente no SI a 3,6 × 10⁶ joules).'
      },
      {
        titulo: 'Quadro de Distribuição (QDC), Disjuntores e Aterramento até a Tomada',
        texto:
          'Do medidor, os cabos seguem ao Quadro de Distribuição de Circuitos (QDC) no interior da residência, onde a instalação é dividida em circuitos independentes (iluminação, tomadas de uso geral e tomadas de uso específico). Os disjuntores termomagnéticos protegem os cabos contra sobrecorrentes: o elemento bimetálico (térmico) atua em sobrecargas prolongadas e a bobina magnética atua instantaneamente em curtos-circuitos, evitando incêndios. Já o sistema de aterramento (condutor verde/verde-amarelo ligado ao terceiro pino das tomadas e a hastes cobreadas no solo), aliado ao dispositivo DR, desvia correntes de fuga na carcaça de aparelhos, protegendo as pessoas contra choques elétricos.'
      }
    ],
    componentes: [
      { nome: 'Rede Secundária (3 Fases + Neutro) e Ramal de Ligação', funcao: 'Conduz a baixa tensão do poste até o ponto de entrega da unidade consumidora.' },
      { nome: 'Padrão de Entrada e Medidor de Energia (kWh)', funcao: 'Ponto de conexão oficial com disjuntor geral e medição da energia ativa consumida.' },
      { nome: 'Quadro de Distribuição (QDC) e Disjuntores Termomagnéticos', funcao: 'Divide os circuitos internos e interrompe automaticamente sobrecorrentes (sobrecarga e curto-circuito).' },
      { nome: 'Malha de Aterramento (Condutor PE)', funcao: 'Oferece caminho de baixa impedância para a terra, protegendo usuários contra choques por falha de isolamento.' },
      { nome: 'Circuitos Terminais, Tomadas e Cargas Residenciais', funcao: 'Pontos finais onde a energia elétrica gerada pelo vento é convertida em luz, calor e movimento.' }
    ],
    formulas: [
      {
        nome: 'Energia Elétrica Consumida',
        latex: 'E = P \\cdot \\Delta t',
        descricao: 'Energia E em watt-hora (Wh) ou quilowatt-hora (kWh), potência P (W ou kW) e tempo de uso Δt (h). No SI: 1 kWh = 3,6 × 10⁶ J.'
      },
      {
        nome: 'Exemplo Prático (Carga de 100 W por 10 horas)',
        latex: 'E = 100\\text{ W} \\times 10\\text{ h} = 1.000\\text{ Wh} = 1\\text{ kWh}',
        descricao: 'Demonstra a conversão direta entre potência instantânea (W) e consumo acumulado (kWh).'
      },
      {
        nome: 'Corrente Demandada por uma Carga Monofásica / Bifásica',
        latex: 'I = \\frac{P}{V \\cdot \\cos\\varphi}',
        descricao: 'Permite dimensionar a seção dos condutores (mm²) e a corrente nominal do disjuntor de proteção.'
      }
    ],
    valoresTipicos: [
      { rotulo: 'Fornecimento Monofásico (2 fios)', valor: '1 Fase + 1 Neutro (127 V ou 220 V)' },
      { rotulo: 'Fornecimento Bifásico (3 fios)', valor: '2 Fases + 1 Neutro (127/220 V)' },
      { rotulo: 'Fornecimento Trifásico (4 fios)', valor: '3 Fases + 1 Neutro (127/220 V ou 220/380 V)' },
      { rotulo: 'Exemplo prático (100 W durante 10 h)', valor: '1.000 Wh = 1 kWh (3,6 MJ)' },
      { rotulo: 'Frequência da tensão nas tomadas residenciais', valor: '60 Hz (Corrente Alternada senoidal)' }
    ],
    observacoesTecnicas: [
      'Resumo da função das proteções: O disjuntor termomagnético protege os condutores e a instalação contra sobrecorrentes (sobrecarga e curto-circuito), prevenindo o superaquecimento por Efeito Joule. O aterramento elétrico (junto ao dispositivo DR) protege a vida humana contra choques elétricos.'
    ]
  }
];
