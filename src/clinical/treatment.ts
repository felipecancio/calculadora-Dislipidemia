import type { TargetAssessment } from "./targets";
import type { PatientInput, RiskCategory } from "./types";
import type { Stratification } from "./risk";

export interface TherapyOption {
  title: string;
  detail: string;
  sourceId: string;
}

export interface TreatmentPlan {
  action: string;
  summary: string;
  lifestyle: string[];
  options: TherapyOption[];
  alerts: string[];
  followUp: string[];
  suspendedSpecificStatin: boolean;
}

const LIFESTYLE = [
  "Medidas de estilo de vida em todas as categorias: gordura saturada abaixo de 7% das calorias, sem gordura trans, fibras, controle de peso quando houver sobrepeso e cessação do tabagismo.",
  "Atividade física: pelo menos 150 minutos por semana de atividade aeróbica moderada ou 75 minutos de atividade vigorosa.",
  "Não se recomenda álcool para prevenir ou tratar aterosclerose, nem tratamento para elevar o HDL-c.",
];

function reproductiveBlock(input: PatientInput): boolean {
  return input.pregnant === "sim" || input.breastfeeding === "sim" || input.intendingPregnancy === "sim";
}

function liverBlocksStatin(input: PatientInput): boolean {
  return input.childPugh === "C" || input.activeLiverDisease === "sim";
}

interface InteractionNote {
  text: string;
  suspendsUsualStatinChoice: boolean;
}

function interactions(input: PatientInput): InteractionNote[] {
  const selected = new Set(input.concomitant);
  const notes: InteractionNote[] = [];
  if (selected.has("varfarina")) {
    notes.push({
      text: "Varfarina: monitorar o INR ao iniciar ou ajustar a estatina. A exceção citada é a pravastatina.",
      suspendsUsualStatinChoice: false,
    });
  }
  if (selected.has("doac")) {
    notes.push({
      text: "Anticoagulantes orais diretos podem ser coadministrados com estatina, segundo a Tabela 8.2.",
      suspendsUsualStatinChoice: false,
    });
  }
  if (selected.has("itraconazol")) {
    notes.push({
      text: "Azólico potente: sinvastatina e lovastatina são contraindicadas com itraconazol. Alternativas citadas: pravastatina, fluvastatina ou rosuvastatina com monitoramento.",
      suspendsUsualStatinChoice: true,
    });
  }
  if (selected.has("ip")) {
    notes.push({
      text: "Inibidor de protease: evitar sinvastatina e lovastatina; atorvastatina é desaconselhada com IP potente; cautela com rosuvastatina e lopinavir/ritonavir. Pravastatina e pitavastatina são as mais seguras citadas.",
      suspendsUsualStatinChoice: true,
    });
  }
  if (selected.has("efavirenz")) {
    notes.push({
      text: "Efavirenz pode reduzir atorvastatina, sinvastatina e pravastatina. Monitorar o efeito e ajustar a dose se preciso.",
      suspendsUsualStatinChoice: false,
    });
  }
  if (selected.has("verapamil")) {
    notes.push({
      text: "Verapamil: sinvastatina no máximo 20 mg/dia e lovastatina no máximo 40 mg/dia.",
      suspendsUsualStatinChoice: true,
    });
  }
  if (selected.has("diltiazem")) {
    notes.push({
      text: "Diltiazem aumenta a exposição de sinvastatina e lovastatina e o risco de miopatia. A diretriz não fixa um teto numérico próprio para o diltiazem; a escolha da estatina fica sem sugestão específica.",
      suspendsUsualStatinChoice: true,
    });
  }
  if (selected.has("amlodipina")) {
    notes.push({
      text: "Anlodipino: sinvastatina no máximo 20 mg/dia.",
      suspendsUsualStatinChoice: true,
    });
  }
  if (selected.has("amiodarona")) {
    notes.push({
      text: "Amiodarona: sinvastatina no máximo 20 mg/dia e lovastatina no máximo 40 mg/dia. Sem ajuste citado para atorvastatina, rosuvastatina, pravastatina, fluvastatina e pitavastatina.",
      suspendsUsualStatinChoice: true,
    });
  }
  if (selected.has("ciclosporina") || selected.has("imunossupressor_mtor")) {
    notes.push({
      text: "Imunossupressor (ciclosporina, tacrolimo, everolimo ou sirolimo): evitar lovastatina, sinvastatina e pitavastatina. Se indispensável: fluvastatina até 40 mg/dia, pravastatina até 20 mg/dia ou rosuvastatina até 5 mg/dia. Atorvastatina acima de 10 mg/dia exige monitorização rigorosa.",
      suspendsUsualStatinChoice: true,
    });
  }
  if (selected.has("claritromicina")) {
    notes.push({
      text: "Claritromicina ou eritromicina: evitar sinvastatina, lovastatina e atorvastatina.",
      suspendsUsualStatinChoice: true,
    });
  }
  if (selected.has("azitromicina")) {
    notes.push({
      text: "Azitromicina pode ser usada com as estatinas, segundo a seção 8.7.3.7.",
      suspendsUsualStatinChoice: false,
    });
  }
  if (selected.has("genfibrozila")) {
    notes.push({
      text: "Genfibrozila: evitar com lovastatina, pravastatina e sinvastatina. Cautela com atorvastatina, pitavastatina e rosuvastatina. Fluvastatina não tem a restrição de dose citada.",
      suspendsUsualStatinChoice: true,
    });
  }
  if (selected.has("fenofibrato")) {
    notes.push({
      text: "Fenofibrato tem perfil mais favorável e a associação com estatina é considerada razoável quando indicada.",
      suspendsUsualStatinChoice: false,
    });
  }
  if (input.otherMedicationNote?.trim()) {
    notes.push({
      text: `Medicamento informado fora da lista estruturada (${input.otherMedicationNote.trim()}): interação não avaliada. A sugestão específica de estatina fica suspensa.`,
      suspendsUsualStatinChoice: true,
    });
  }
  return notes;
}

function tgBranch(input: PatientInput, category: RiskCategory | null, alerts: string[], options: TherapyOption[]) {
  if (input.triglycerides == null) return;
  if (input.triglycerides >= 500) {
    alerts.push("Triglicérides ≥ 500 mg/dL abrem um objetivo separado: prevenção de pancreatite. Isso não substitui a meta de LDL-c.");
    if (input.tgPersistentAtLeast500 === "sim") {
      options.push({
        title: "Fibrato para risco de pancreatite",
        detail: "Triglicérides persistentemente ≥ 500 mg/dL apesar de medidas de estilo de vida: fibrato é recomendado para reduzir o risco de pancreatite.",
        sourceId: "recFarmaco",
      });
    } else if (input.tgPersistentAtLeast500 === "nao_informado") {
      alerts.push("A indicação de fibrato depende de persistência após medidas de estilo de vida, que não foi informada.");
    }
    return;
  }
  if (input.triglycerides >= 150 && category && ["alto", "muito_alto", "extremo"].includes(category)) {
    alerts.push(
      "Triglicérides entre 150 e 499 mg/dL com doença aterosclerótica ou alto risco: icosapenta etila 4 g/dia é citado, mas não está disponível no Brasil. Formulações de EPA com DHA não são recomendadas para prevenir eventos.",
    );
  }
}

export function planTreatment(
  input: PatientInput,
  stratification: Stratification,
  targets: TargetAssessment | null,
): TreatmentPlan {
  const alerts: string[] = [];
  const options: TherapyOption[] = [];
  const followUp: string[] = [];
  const category = stratification.category;
  const interactionNotes = interactions(input);
  const suspendStatin = interactionNotes.some((note) => note.suspendsUsualStatinChoice);
  alerts.push(...interactionNotes.map((note) => note.text));

  if (stratification.outOfScope) {
    return {
      action: "Fora do escopo",
      summary: "Não há estratégia de adulto para menores de 18 anos nesta versão.",
      lifestyle: [],
      options: [],
      alerts,
      followUp: [],
      suspendedSpecificStatin: false,
    };
  }

  if (input.hypothyroidism === "sim" && input.hypothyroidismCorrected !== "sim") {
    alerts.push(
      "Hipotireoidismo: repor levotiroxina e reavaliar o perfil lipídico. Até a normalização hormonal há mais vulnerabilidade a sintomas musculares, e a dislipidemia pode responder à reposição.",
    );
  }
  if (input.secondaryCauseSuspected === "sim") {
    alerts.push("Há causa secundária suspeita. Confira hipotireoidismo, síndrome nefrótica, colestase e medicamentos antes de atribuir a falha ao esquema.");
  }
  if (input.heartFailure === "sim" && category && ["muito_alto", "extremo"].includes(category)) {
    alerts.push("Insuficiência cardíaca com doença aterosclerótica: manter a estatina se a sobrevida for clinicamente aceitável. Não suspender só pela insuficiência cardíaca.");
  }
  if (input.childPugh === "A" || input.childPugh === "B") {
    alerts.push("Cirrose Child-Pugh A ou B: a diretriz considera que estatina pode ser usada. Child-Pugh C desaconselha.");
  }
  if (input.intolerance === "suspeita") {
    alerts.push("Queixa ainda não confirma intolerância completa. O caminho é investigar, e não retirar definitivamente a estatina.");
  }

  tgBranch(input, category, alerts, options);

  const atGoal = targets?.ldlAtGoal === true && targets.nonHdlAtGoal !== false;
  const aboveGoal = targets?.ldlAtGoal === false || targets?.nonHdlAtGoal === false;
  const onTreatment = input.onLipidTherapy === "sim" || input.onStatin === "sim" || input.onEzetimibe === "sim" || input.onAntiPcsk9 === "sim";
  const poorAdherence = input.adherence === "inadequada";
  const completeIntolerance = input.intolerance === "completa_confirmada";
  const partialIntolerance = input.intolerance === "parcial_confirmada";

  if (!category || !targets) {
    return {
      action: "Decisão dependente de dado clínico ausente",
      summary: "A estratégia medicamentosa fica em aberto enquanto a categoria não puder ser sustentada.",
      lifestyle: LIFESTYLE,
      options,
      alerts,
      followUp: ["Repetir a estratificação quando os dados faltantes estiverem disponíveis."],
      suspendedSpecificStatin: suspendStatin,
    };
  }

  if (reproductiveBlock(input)) {
    const veryHighOrFh =
      category === "muito_alto" ||
      category === "extremo" ||
      input.familialHypercholesterolemia === "confirmada";
    alerts.push(
      input.breastfeeding === "sim"
        ? "Amamentação: o esquema habitual com estatina não é sugerido."
        : "Gestação ou intenção de engravidar: não sugerir o esquema habitual.",
    );
    if (input.pregnant === "sim" && veryHighOrFh) {
      options.push({
        title: "Decisão compartilhada, não um esquema automático",
        detail:
          "Em risco muito alto e/ou HF, a manutenção da estatina na gestação pode ser considerada. Se mantida, interromper no primeiro trimestre e reintroduzir no terceiro. A pravastatina é a estatina com maior evidência de segurança citada.",
        sourceId: "secao915",
      });
    }
    return {
      action: "Ajustar por gestação, intenção de engravidar ou amamentação",
      summary: "A categoria e a meta permanecem. O esquema habitual com estatina fica suspenso.",
      lifestyle: LIFESTYLE,
      options,
      alerts,
      followUp: ["Reavaliar o hipolipemiante ao fim da gestação ou da amamentação."],
      suspendedSpecificStatin: true,
    };
  }

  if (liverBlocksStatin(input)) {
    alerts.push(
      input.childPugh === "C"
        ? "Child-Pugh C: estatina desaconselhada. Nenhuma molécula específica é sugerida."
        : "Doença hepática ativa informada sem classe de Child-Pugh: a sugestão específica de estatina fica suspensa.",
    );
    return {
      action: "Ajustar por doença hepática",
      summary: "A meta lipídica permanece, sem sugestão do esquema habitual de estatina.",
      lifestyle: LIFESTYLE,
      options,
      alerts,
      followUp: ["Definir a condição hepática antes de escolher o hipolipemiante."],
      suspendedSpecificStatin: true,
    };
  }

  if (input.dialysis === "hemodialise") {
    alerts.push(
      onTreatment
        ? "Hemodiálise: a diretriz recomenda manter o hipolipemiante que já estava em uso."
        : "Hemodiálise: o benefício de introduzir hipolipemiante é controverso. Não se sugere iniciar estatina só pela categoria.",
    );
    return {
      action: onTreatment ? "Manter o tratamento já em uso" : "Não iniciar estatina só pela hemodiálise",
      summary: onTreatment
        ? "Manter a terapia prévia. A meta calculada continua visível para acompanhamento."
        : "Introdução não sugerida. A categoria e a meta ficam registradas.",
      lifestyle: LIFESTYLE,
      options,
      alerts,
      followUp: [],
      suspendedSpecificStatin: true,
    };
  }

  if (poorAdherence && onTreatment && aboveGoal) {
    alerts.push("Adesão inadequada: corrija o uso atual antes de propor outra classe como se a adesão fosse adequada.");
    return {
      action: "Corrigir a adesão antes de intensificar",
      summary: "A meta não foi atingida, mas a próxima conduta é revisar adesão, dose tolerada e causas secundárias.",
      lifestyle: LIFESTYLE,
      options,
      alerts,
      followUp: ["Repetir o perfil lipídico cerca de 4 semanas após regularizar o uso."],
      suspendedSpecificStatin: suspendStatin,
    };
  }

  if (completeIntolerance) {
    options.push({
      title: "Combinação sem estatina",
      detail:
        "Intolerância completa confirmada: ácido bempedoico com ezetimiba, ou terapia anti-PCSK9 com ou sem ezetimiba, conforme a meta. Inclisirana é alternativa aos anticorpos monoclonais.",
      sourceId: "recFarmaco",
    });
    if (!suspendStatin) {
      options.push({
        title: "Não recolocar estatina em dose plena",
        detail: "A intolerância completa confirmada afasta o esquema habitual. Intolerância parcial é outro caminho.",
        sourceId: "secao8",
      });
    }
    return {
      action: "Ajustar por intolerância completa",
      summary: "Estratégia combinada sem depender de estatina em dose habitual.",
      lifestyle: LIFESTYLE,
      options,
      alerts,
      followUp: ["Reavaliar o perfil lipídico cerca de 4 semanas após o ajuste."],
      suspendedSpecificStatin: true,
    };
  }

  if (partialIntolerance) {
    options.push({
      title: "Estatina em esquema tolerado, com outro agente",
      detail:
        "Intolerância parcial: reduzir a frequência, trocar a estatina ou associar ezetimiba, ácido bempedoico ou anti-PCSK9. Não trate como intolerância completa.",
      sourceId: "secao8",
    });
  }

  const intensity = category === "baixo" || category === "intermediario" ? "moderada ou conforme a meta" : "alta";
  const statinPhrase = suspendStatin
    ? "Estatina de alta intensidade fica como classe, sem molécula específica, por interação ou dado não avaliado."
    : `Estatina de ${intensity === "alta" ? "alta intensidade (redução média de LDL-c de 50% ou mais)" : "intensidade compatível com a meta"}. A diretriz não traz uma tabela de miligramas para escolher a dose só pelo LDL atual.`;

  if (category === "baixo" || category === "intermediario") {
    const persistent = input.lipidChangePersists === "sim";
    const threshold = targets.pharmacologicThresholdMet === true;
    if (atGoal && onTreatment) {
      return finish("Manter o tratamento", "LDL-c e não-HDL-c disponíveis estão na meta. Mantenha estilo de vida e o esquema atual.", options, alerts, followUp, suspendStatin, true);
    }
    if (threshold && persistent && !completeIntolerance) {
      options.unshift({
        title: onTreatment ? "Intensificar a terapia" : "Iniciar estatina",
        detail: `${statinPhrase} A indicação existe porque o LDL-c ou o não-HDL-c está persistentemente pelo menos 30 mg/dL acima da meta.`,
        sourceId: "recMetas",
      });
      return finish(
        onTreatment ? "Intensificar" : "Iniciar medicamento",
        "Risco baixo ou intermediário com elevação persistente de pelo menos 30 mg/dL acima da meta.",
        options,
        alerts,
        followUp,
        suspendStatin,
        false,
      );
    }
    if (threshold && input.lipidChangePersists !== "sim") {
      alerts.push("O valor está pelo menos 30 mg/dL acima da meta, mas a persistência não foi confirmada. Não inicie medicamento só pelo número de hoje.");
    } else if (aboveGoal) {
      alerts.push("Estar acima da meta, sem chegar a 30 mg/dL além dela, não indica medicamento automático nesta categoria.");
    }
    return finish(
      "Medidas de estilo de vida",
      "Sem indicação automática de medicamento neste momento.",
      options,
      alerts,
      followUp,
      suspendStatin,
      atGoal === true,
    );
  }

  if (input.dialysis === "peritoneal" && (category === "muito_alto" || category === "extremo") && !onTreatment) {
    options.push({
      title: "Estatina pode ser considerada na diálise peritoneal",
      detail: "Em diálise peritoneal e risco muito alto, a diretriz admite introduzir estatina. Hemodiálise é outra situação.",
      sourceId: "secao95",
    });
  }

  const fhOrVeryHighLdl =
    input.familialHypercholesterolemia === "confirmada" ||
    (input.ldlBaseline != null && input.ldlBaseline >= 190) ||
    (input.ldlCurrent != null && input.ldlCurrent >= 190);

  if (category === "extremo") {
    options.unshift({
      title: "Estatina de alta intensidade + ezetimiba + anti-PCSK9",
      detail: `${statinPhrase} Terapia inicial tríplice para risco extremo. Anti-PCSK9 inclui evolocumabe, alirocumabe ou inclisirana.`,
      sourceId: "recFarmaco",
    });
  } else if (category === "muito_alto") {
    options.unshift({
      title: "Estatina de alta intensidade + ezetimiba, e considerar anti-PCSK9",
      detail: `${statinPhrase} A associação precoce de anti-PCSK9 entra conforme a necessidade de atingir a meta.`,
      sourceId: "recFarmaco",
    });
  } else {
    options.unshift({
      title: "Estatina de alta intensidade + ezetimiba",
      detail: `${statinPhrase} Terapia inicial do alto risco. ${fhOrVeryHighLdl ? "HF ou LDL-c ≥ 190 mg/dL também começa com esta combinação." : ""}`.trim(),
      sourceId: "recFarmaco",
    });
  }

  if (onTreatment && aboveGoal) {
    if (input.statinMaxTolerated !== "sim") {
      alerts.push("Antes de trocar de classe, confirme adesão, dose máxima tolerada e causas secundárias.");
    }
    if (input.onEzetimibe !== "sim") {
      options.push({
        title: "Acrescentar ezetimiba se ainda não estiver em uso",
        detail: "Quem não atinge a meta com estatina em dose máxima tolerada pode receber ezetimiba ou anti-PCSK9.",
        sourceId: "recFarmaco",
      });
    }
    if (input.onEzetimibe === "sim" && input.onAntiPcsk9 !== "sim" && input.statinMaxTolerated === "sim") {
      options.push({
        title: "Acrescentar anti-PCSK9 ou ácido bempedoico",
        detail: "Meta não atingida com estatina de alta intensidade e ezetimiba: adicionar anti-PCSK9 ou ácido bempedoico. Ácido bempedoico 180 mg/dia é a dose citada no texto. Não some percentuais de redução como se a resposta individual fosse garantida.",
        sourceId: "secao713",
      });
    }
    return finish(
      "Intensificar",
      "A meta ainda não foi atingida. A intensificação depende de adesão, dose máxima tolerada e do que já está em uso.",
      options,
      alerts,
      followUp,
      suspendStatin,
      false,
    );
  }

  if (onTreatment && atGoal) {
    return finish("Manter o tratamento", "O esquema atual encontra a meta absoluta disponível. Confira também a redução percentual quando houver LDL basal.", options, alerts, followUp, suspendStatin, true);
  }

  return finish(
    "Iniciar medicamento associado ao estilo de vida",
    "Categoria com recomendação de terapia farmacológica desde o início, respeitadas as ressalvas deste caso.",
    options,
    alerts,
    followUp,
    suspendStatin,
    false,
  );
}

function finish(
  action: string,
  summary: string,
  options: TherapyOption[],
  alerts: string[],
  followUp: string[],
  suspendedSpecificStatin: boolean,
  atGoal: boolean,
): TreatmentPlan {
  const lifestyleOnly = action === "Medidas de estilo de vida";
  followUp.unshift(
    lifestyleOnly
      ? "Reavaliar o perfil lipídico depois das medidas de estilo de vida, para confirmar se a elevação persiste."
      : atGoal
        ? "Depois da meta atingida, repetir o perfil lipídico em cerca de um ano, ou antes se houver suspeita de má adesão ou efeito adverso."
        : "Repetir o perfil lipídico cerca de 4 semanas após o início ou o ajuste da estatina.",
  );
  followUp.push(
    "CK e enzimas hepáticas de rotina não são recomendadas sem sintoma muscular, sinal de hepatotoxicidade ou mudança de terapia. CK basal e ALT/AST podem ser consideradas antes de iniciar, sobretudo se o risco muscular ou hepático for alto.",
  );
  return {
    action,
    summary,
    lifestyle: LIFESTYLE,
    options,
    alerts,
    followUp,
    suspendedSpecificStatin,
  };
}
