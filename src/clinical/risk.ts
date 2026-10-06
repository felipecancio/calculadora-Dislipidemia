import { assessDiabetes, type DiabetesBranch } from "./diabetes";
import { bmiKgM2 } from "./numbers";
import { preventAscvd10, preventBand, type PreventResult } from "./prevent";
import {
  CATEGORY_LABEL,
  CATEGORY_RANK,
  higherCategory,
  type ClassificationStatus,
  type Episode,
  type PatientInput,
  type RiskCategory,
  type Tri,
} from "./types";

export interface Finding {
  category: RiskCategory;
  text: string;
  sourceId: string;
}

export interface Stratification {
  outOfScope: boolean;
  status: ClassificationStatus;
  category: RiskCategory | null;
  headline: string;
  findings: Finding[];
  missing: string[];
  caveats: string[];
  prevent: PreventResult | null;
  preventApplied: boolean;
  aggravants: string[];
  diabetes: DiabetesBranch;
  steps: string[];
}

function gapCanRaise(gap: string, minimum: RiskCategory | null): boolean {
  const rank = minimum ? CATEGORY_RANK[minimum] : 0;
  if (gap.startsWith("Lp(a)")) return rank < CATEGORY_RANK.alto;
  if (gap.startsWith("obstrução")) return rank < CATEGORY_RANK.muito_alto;
  if (gap.startsWith("agravantes")) return rank < CATEGORY_RANK.alto;
  if (gap.startsWith("LDL-c basal")) return rank < CATEGORY_RANK.alto;
  if (gap.startsWith("dados do PREVENT") || gap.startsWith("LDL-c atual")) return rank < CATEGORY_RANK.alto;
  if (gap.startsWith("EAR") || gap.startsWith("EMAR") || gap.startsWith("duração") || gap.startsWith("DM1") || gap.startsWith("DM2")) {
    return rank < CATEGORY_RANK.muito_alto;
  }
  if (gap.includes("Steno") || gap.includes("ST1RE")) return rank < CATEGORY_RANK.alto;
  if (gap === "tabagismo atual") return rank < CATEGORY_RANK.alto;
  if (gap === "diabetes" || gap === "descrição do episódio cardiovascular") return rank < CATEGORY_RANK.extremo;
  if (gap.startsWith("história de evento")) return rank < CATEGORY_RANK.extremo;
  return true;
}

function isMajor(episode: Episode): boolean {
  return episode.sca || episode.iam || episode.avcIsquemico || episode.dapSintomatica;
}

function ldlReference(input: PatientInput): {
  value: number | null;
  usedBaseline: boolean;
  baselineMissingWhileTreated: boolean;
} {
  const treated = input.onLipidTherapy === "sim" || input.onStatin === "sim";
  if (input.ldlBaseline != null && input.ldlCurrent != null) {
    return {
      value: Math.max(input.ldlBaseline, input.ldlCurrent),
      usedBaseline: input.ldlBaseline >= input.ldlCurrent,
      baselineMissingWhileTreated: false,
    };
  }
  if (input.ldlBaseline != null) {
    return { value: input.ldlBaseline, usedBaseline: true, baselineMissingWhileTreated: false };
  }
  return {
    value: input.ldlCurrent,
    usedBaseline: false,
    baselineMissingWhileTreated: treated && (input.ldlCurrent == null || input.ldlCurrent < 190),
  };
}

function lpaHigh(input: PatientInput): { high: boolean; aggravant: boolean; text: string | null; missing: boolean } {
  if (input.lpaValue == null || input.lpaUnit == null) {
    return { high: false, aggravant: false, text: null, missing: true };
  }
  if (input.lpaUnit === "mg/dL") {
    return {
      high: input.lpaValue > 180,
      aggravant: input.lpaValue >= 50,
      text: `Lp(a) ${input.lpaValue} mg/dL`,
      missing: false,
    };
  }
  return {
    high: input.lpaValue > 390,
    aggravant: input.lpaValue >= 125,
    text: `Lp(a) ${input.lpaValue} nmol/L`,
    missing: false,
  };
}

export function stratify(input: PatientInput): Stratification {
  const findings: Finding[] = [];
  const missing: string[] = [];
  const caveats: string[] = [];
  const steps: string[] = [];
  const diabetes = assessDiabetes(input);

  if (input.ageYears != null && input.ageYears < 18) {
    return {
      outOfScope: true,
      status: "fora_de_escopo",
      category: null,
      headline: "Fora do escopo: esta versão é para adultos.",
      findings: [],
      missing: [],
      caveats: ["Menores de 18 anos não são classificados por este algoritmo."],
      prevent: null,
      preventApplied: false,
      aggravants: [],
      diabetes,
      steps: ["Idade inferior a 18 anos."],
    };
  }

  if (input.ageYears == null) missing.push("idade");
  if (input.sex == null) missing.push("sexo utilizado na equação");
  if (input.diabetes === "nao_informado") missing.push("diabetes");
  if (input.smoking === "nao_informado") missing.push("tabagismo atual");
  if (input.priorEventStatus === "nao_informado") missing.push("história de evento cardiovascular aterosclerótico");

  const episodes = input.priorEventStatus === "sim" ? input.episodes : [];
  if (input.priorEventStatus === "sim" && episodes.length === 0) {
    missing.push("descrição do episódio cardiovascular");
  }
  const majorEpisodes = episodes.filter(isMajor);
  const revascOutside = episodes.filter((episode) => episode.revascularizacao && !isMajor(episode));
  const established =
    majorEpisodes.length > 0 ||
    revascOutside.length > 0 ||
    episodes.some((episode) => episode.revascularizacao) ||
    input.obstruction === "igual_ou_maior_50";

  const conditions: string[] = [];
  const unknownConditions: string[] = [];
  if (input.ageYears == null) unknownConditions.push("idade ≥ 65 anos");
  else if (input.ageYears >= 65) conditions.push("idade ≥ 65 anos");
  if (input.familialHypercholesterolemia === "confirmada") conditions.push("hipercolesterolemia familiar");
  else if (input.familialHypercholesterolemia === "nao_informada") unknownConditions.push("hipercolesterolemia familiar");
  if (input.familialHypercholesterolemia === "suspeita") {
    caveats.push("HF suspeita não é diagnóstico confirmado e não entra como condição de risco extremo.");
  }
  if (revascOutside.length > 0) {
    conditions.push("revascularização fora do evento maior");
  }
  if (input.diabetes === "sim") conditions.push("diabetes");
  else if (input.diabetes === "nao_informado") unknownConditions.push("diabetes");
  if (input.hypertension === "sim") conditions.push("hipertensão arterial");
  else if (input.hypertension === "nao_informado") unknownConditions.push("hipertensão arterial");
  if (input.egfr == null) unknownConditions.push("TFGe entre 15 e 59");
  else if (input.egfr >= 15 && input.egfr <= 59) conditions.push("TFGe entre 15 e 59 mL/min/1,73 m²");
  else if (input.egfr < 15) {
    caveats.push("TFGe < 15 não preenche o intervalo 15–59 da Tabela 4.2. Diálise é avaliada à parte, na escolha do medicamento.");
  }
  if (input.smoking === "sim") conditions.push("tabagismo atual");
  else if (input.smoking === "nao_informado") unknownConditions.push("tabagismo atual");

  const persistentLdl =
    input.onStatin === "sim" &&
    input.statinMaxTolerated === "sim" &&
    input.onEzetimibe === "sim" &&
    input.lipidChangePersists === "sim" &&
    input.ldlCurrent != null &&
    input.ldlCurrent >= 100;
  if (persistentLdl) {
    conditions.push("LDL-c ≥ 100 mg/dL apesar de estatina em dose máxima tolerada e ezetimiba");
  } else if (
    input.ldlCurrent != null &&
    input.ldlCurrent >= 100 &&
    (input.onStatin === "nao_informado" ||
      input.statinMaxTolerated === "nao_informado" ||
      input.onEzetimibe === "nao_informado" ||
      input.lipidChangePersists === "nao_informado")
  ) {
    unknownConditions.push("LDL-c persistentemente ≥ 100 em estatina máxima e ezetimiba");
  }

  const datedRecent = majorEpisodes.some((episode) => episode.yearsAgo != null && episode.yearsAgo < 2);
  const undatedMajor = majorEpisodes.some((episode) => episode.yearsAgo == null);
  if (datedRecent) conditions.push("evento agudo aterosclerótico há menos de 2 anos");
  if (undatedMajor) unknownConditions.push("tempo do evento, para a condição de evento há menos de 2 anos");

  const excludingRecency = conditions.filter((item) => item !== "evento agudo aterosclerótico há menos de 2 anos");
  let extremePending = false;
  if (majorEpisodes.length >= 2) {
    findings.push({
      category: "extremo",
      text: `${majorEpisodes.length} episódios maiores distintos. Infarto, SCA e revascularização do mesmo episódio contam uma vez.`,
      sourceId: "tabela42",
    });
  } else if (majorEpisodes.length === 1 && excludingRecency.length >= 2) {
    findings.push({
      category: "extremo",
      text: `Um evento maior e ${excludingRecency.length} condições de alto risco, sem usar a recência do mesmo episódio como condição extra: ${excludingRecency.join("; ")}.`,
      sourceId: "tabela42",
    });
  } else if (majorEpisodes.length === 1) {
    const knownWithRecency = conditions.length;
    const possible = knownWithRecency + unknownConditions.length;
    if (knownWithRecency >= 2 || possible >= 2) {
      extremePending = true;
      caveats.push(
        "Risco extremo fica pendente: ou a recência do mesmo episódio precisaria contar como condição de alto risco, ou falta dado para completar duas condições. O risco mínimo já demonstrado pelo evento é muito alto.",
      );
    }
  }

  if (majorEpisodes.length > 0 || revascOutside.length > 0 || episodes.some((episode) => episode.revascularizacao)) {
    findings.push({
      category: "muito_alto",
      text:
        majorEpisodes.length > 0
          ? "Evento aterosclerótico cardiovascular prévio, contado por episódio distinto."
          : "Revascularização arterial prévia.",
      sourceId: "tabela41",
    });
  }
  if (input.obstruction === "igual_ou_maior_50") {
    findings.push({
      category: "muito_alto",
      text: "Obstrução arterial ≥ 50%. No ponto exatamente igual a 50%, prevalece a Tabela 4.1 e a Figura 4.1.",
      sourceId: "figura41",
    });
  } else if (input.obstruction === "menor_50") {
    findings.push({
      category: "alto",
      text: "Obstrução ou placa conhecida < 50%: aterosclerose subclínica.",
      sourceId: "tabela41",
    });
  } else if (input.obstruction === "nao_informada") {
    missing.push("obstrução arterial conhecida");
  }

  if (input.cacAgatston != null) {
    if (input.cacAgatston > 300) {
      findings.push({ category: "muito_alto", text: `CAC ${input.cacAgatston} UA é maior que 300.`, sourceId: "tabela41" });
    } else if (input.cacAgatston > 100) {
      findings.push({ category: "alto", text: `CAC ${input.cacAgatston} UA é maior que 100 e não é maior que 300.`, sourceId: "tabela44" });
    }
  }
  if (input.cacPercentile != null && input.cacPercentile > 75) {
    findings.push({
      category: "alto",
      text: `Percentil de CAC ${input.cacPercentile} é maior que 75.`,
      sourceId: "tabela44",
    });
  }
  if (input.carotidPlaqueUnder50 === "sim") {
    findings.push({ category: "alto", text: "Placa carotídea < 50%.", sourceId: "tabela41" });
  }
  if (input.coronaryPlaqueUnder50 === "sim") {
    findings.push({ category: "alto", text: "Placa coronária < 50% na angiotomografia.", sourceId: "tabela41" });
  }
  if (input.aaa === "sim") {
    findings.push({ category: "alto", text: "Aneurisma de aorta abdominal.", sourceId: "tabela41" });
  }
  if (
    input.familialHypercholesterolemia === "confirmada" &&
    input.cacAgatston != null &&
    input.cacAgatston > 100
  ) {
    findings.push({
      category: "muito_alto",
      text: "HF com CAC > 100 UA.",
      sourceId: "tabela44",
    });
  }

  const ldl = ldlReference(input);
  if (ldl.value != null) {
    if (ldl.value >= 190) {
      findings.push({
        category: "alto",
        text: ldl.usedBaseline
          ? `LDL-c basal ou o maior valor histórico é ${ldl.value} mg/dL (≥ 190). O valor tratado não rebaixa esta categoria.`
          : `LDL-c ${ldl.value} mg/dL é ≥ 190.`,
        sourceId: "tabela41",
      });
    } else if (ldl.value >= 160) {
      findings.push({
        category: "intermediario",
        text: `LDL-c ${ldl.value} mg/dL está na faixa 160 a < 190 mg/dL (160–189 na diretriz).`,
        sourceId: "tabela41",
      });
    }
  } else if (input.onLipidTherapy !== "sim" && input.onStatin !== "sim") {
    missing.push("LDL-c atual");
  }
  if (ldl.baselineMissingWhileTreated) {
    missing.push("LDL-c basal antes do tratamento, para não rebaixar quem já esteve em faixa mais alta");
    caveats.push("Há hipolipemiante e o LDL-c basal não foi informado. O LDL atual não é tratado como se fosse o basal.");
  }

  const lpa = lpaHigh(input);
  if (lpa.high && lpa.text) {
    findings.push({
      category: "alto",
      text: `${lpa.text} ultrapassa o corte de alto risco da Tabela 4.1 (> 180 mg/dL ou > 390 nmol/L). Não houve conversão entre unidades.`,
      sourceId: "lpaTexto",
    });
  } else if (lpa.missing) {
    missing.push("Lp(a), com a unidade mg/dL ou nmol/L");
  }

  if (input.ageYears != null && input.ageYears >= 80 && !established) {
    findings.push({
      category: "alto",
      text: "Idade ≥ 80 anos: a seção 4.8 descreve este grupo como alto risco, sem percentual do PREVENT.",
      sourceId: "secao48",
    });
  }

  if (diabetes.applies && diabetes.category) {
    findings.push({
      category: diabetes.category,
      text: diabetes.notes.join(" ") || "Ramo de diabetes.",
      sourceId: diabetes.category === "muito_alto" ? "tabela48" : "tabela45",
    });
    if (diabetes.minimumOnly || diabetes.pending) {
      missing.push(...diabetes.unknownEars.map((item) => `EAR: ${item}`));
      missing.push(...diabetes.unknownEmar.map((item) => `EMAR: ${item}`));
    }
  } else if (diabetes.applies && diabetes.pending) {
    missing.push(...diabetes.notes);
    missing.push(...diabetes.unknownEars.map((item) => `EAR: ${item}`));
    missing.push(...diabetes.unknownEmar.map((item) => `EMAR: ${item}`));
  }
  if (diabetes.st1reIndicated) {
    caveats.push(
      "O ST1RE está indicado e não foi calculado. O PREVENT, se exibido, não classifica este ramo de DM1.",
    );
  }

  const preventReady =
    input.ageYears != null &&
    input.sex != null &&
    input.totalCholesterol != null &&
    input.hdl != null &&
    input.sbp != null &&
    input.egfr != null &&
    input.diabetes !== "nao_informado" &&
    input.smoking !== "nao_informado" &&
    input.onAntihypertensive !== "nao_informado" &&
    input.onStatin !== "nao_informado";

  let prevent: PreventResult | null = null;
  let preventApplied = false;
  if (preventReady) {
    prevent = preventAscvd10({
      sex: input.sex as NonNullable<PatientInput["sex"]>,
      ageYears: input.ageYears as number,
      totalCholesterol: input.totalCholesterol as number,
      hdl: input.hdl as number,
      sbp: input.sbp as number,
      egfr: input.egfr as number,
      diabetes: input.diabetes === "sim",
      smoking: input.smoking === "sim",
      onAntihypertensive: input.onAntihypertensive === "sim",
      onStatin: input.onStatin === "sim",
      hba1c: input.hba1c,
      uacr: input.uacr,
      establishedCardiovascularDisease: established,
    });
  } else if (input.ageYears != null && input.ageYears >= 30 && input.ageYears <= 79 && !established) {
    missing.push("dados do PREVENT-ASCVD (colesterol total, HDL-c, PAS, TFGe, anti-hipertensivo e estatina)");
  }

  const aggravants: string[] = [];
  const unresolvedAggravants: string[] = [];
  const bmi = bmiKgM2(input.weightKg, input.heightCm);
  if (bmi != null && bmi >= 30) aggravants.push(`IMC ${bmi.toFixed(1).replace(".", ",")} kg/m²`);
  const mark = (value: Tri, label: string) => {
    if (value === "sim") aggravants.push(label);
    else if (value === "nao_informado") unresolvedAggravants.push(label);
  };
  mark(input.familyPremature, "história familiar de doença cardiovascular prematura");
  if (!(bmi != null && bmi >= 30)) mark(input.adiposityManifestation, "adiposidade, esteatose ou síndrome metabólica");
  mark(input.inflammatoryCondition, "condição inflamatória crônica");
  mark(input.organTransplant, "transplante de órgão");
  if (input.sex === "feminino") mark(input.womenSpecificFactor, "fator específico da mulher");
  else if (input.sex == null) unresolvedAggravants.push("fatores específicos da mulher, porque o sexo não foi informado");
  if (lpa.aggravant && !lpa.high && lpa.text) aggravants.push(lpa.text);
  else if (lpa.missing) unresolvedAggravants.push("Lp(a)");
  if (input.hsCrp == null) unresolvedAggravants.push("PCR ultrassensível");
  else if (input.hsCrp >= 2) aggravants.push(`PCR-us ${input.hsCrp} mg/L`);

  if (prevent?.applicable && prevent.probability != null && !diabetes.st1reIndicated) {
    preventApplied = true;
    const band = preventBand(prevent.probability);
    const shown = prevent.percentOneDecimal;
    if (shown != null && ((band === "baixo" && shown >= 5) || (band === "intermediario" && (shown < 5 || shown >= 20)) || (band === "alto" && shown < 20))) {
      caveats.push(
        `O percentual com uma casa (${shown.toFixed(1).replace(".", ",")}%) não coincide com a faixa do valor não arredondado. A categoria usa o valor da equação, sem arredondar para o corte.`,
      );
    }
    if (band === "alto") {
      findings.push({
        category: "alto",
        text: `PREVENT-ASCVD em 10 anos de ${(prevent.percent ?? 0).toFixed(2).replace(".", ",")}% é ≥ 20%. Agravante não cria um degrau adicional.`,
        sourceId: "tabela41",
      });
    } else if (aggravants.length > 0) {
      findings.push({
        category: band === "baixo" ? "intermediario" : "alto",
        text:
          band === "baixo"
            ? `PREVENT < 5% com agravante (${aggravants.join("; ")}): reclassificação única para intermediário.`
            : `PREVENT de 5% a < 20% com agravante (${aggravants.join("; ")}): reclassificação única para alto.`,
        sourceId: "tabela41",
      });
    } else if (unresolvedAggravants.length === 0 && input.diabetes !== "sim") {
      findings.push({
        category: band,
        text:
          band === "baixo"
            ? `PREVENT < 5%, sem agravante e sem DM2.`
            : `PREVENT de 5% a < 20%, sem agravante.`,
        sourceId: "tabela41",
      });
    } else if (unresolvedAggravants.length > 0) {
      findings.push({
        category: band,
        text: `PREVENT na faixa ${band === "baixo" ? "< 5%" : "5% a < 20%"} antes dos agravantes. A reclassificação ainda depende de dados ausentes.`,
        sourceId: "tabela43",
      });
      missing.push(`agravantes não avaliados: ${unresolvedAggravants.join(", ")}`);
    }
    steps.push(`PREVENT modelo ${prevent.model}, proporção ${prevent.probability.toFixed(4)}.`);
  } else if (prevent && !prevent.applicable) {
    caveats.push(...prevent.blockedBy);
    if (input.ageYears != null && (input.ageYears < 30 || input.ageYears > 79)) {
      steps.push("PREVENT fora do domínio etário; nenhum percentual foi fabricado.");
    }
  }

  if (input.ageYears != null && input.ageYears >= 18 && input.ageYears < 30 && aggravants.length > 0) {
    caveats.push(
      "Há agravante antes dos 30 anos. A seção 4.9 autoriza considerá-lo, mas não define a categoria de destino. Ele não cria sozinho uma categoria.",
    );
  }

  const ranks = findings.map((finding) => finding.category);
  const minimum = ranks.reduce<RiskCategory | null>((current, category) => higherCategory(current, category), null);
  const uniqueMissing = [...new Set(missing)].filter((gap) => gapCanRaise(gap, minimum));
  const couldRise =
    uniqueMissing.length > 0 ||
    (extremePending && (!minimum || CATEGORY_RANK[minimum] < CATEGORY_RANK.extremo)) ||
    ((diabetes.minimumOnly || diabetes.pending) &&
      (!minimum || CATEGORY_RANK[minimum] < CATEGORY_RANK.muito_alto));
  let status: ClassificationStatus = "completa";
  if (minimum == null && (couldRise || uniqueMissing.length > 0)) status = "incompleta";
  else if (couldRise) status = "incompleta";
  else if (caveats.length > 0 && minimum != null) status = "com_ressalvas";

  if (input.diabetes === "sim" && diabetes.category == null && diabetes.pending && minimum == null) {
    status = "incompleta";
  }

  const category = minimum;
  let headline = "Classificação indisponível com os dados atuais.";
  if (category && status === "incompleta") {
    headline = `Classificação incompleta. Risco mínimo demonstrado: ${CATEGORY_LABEL[category]}.`;
  } else if (category && status === "com_ressalvas") {
    headline = `Risco ${CATEGORY_LABEL[category]}, com ressalvas.`;
  } else if (category) {
    headline = `Risco ${CATEGORY_LABEL[category]}.`;
  } else if (status === "incompleta") {
    headline = "Classificação incompleta. Ainda não há categoria mínima demonstrada.";
  }

  const top = findings
    .filter((finding) => category && CATEGORY_RANK[finding.category] === CATEGORY_RANK[category])
    .map((finding) => finding.text);
  if (top[0]) steps.unshift(top[0]);

  return {
    outOfScope: false,
    status,
    category,
    headline,
    findings,
    missing: uniqueMissing,
    caveats,
    prevent,
    preventApplied,
    aggravants,
    diabetes,
    steps,
  };
}
