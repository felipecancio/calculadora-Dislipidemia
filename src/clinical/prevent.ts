import {
  baseFeminino,
  baseMasculino,
  fullFeminino,
  fullMasculino,
  hba1cFeminino,
  hba1cMasculino,
  uacrFeminino,
  uacrMasculino,
} from "./preventCoefficients";
import { roundHalfUp } from "./numbers";
import type { Sex } from "./types";

/**
 * PREVENT-ASCVD em 10 anos, equações de implementação de Khan et al. 2024.
 * Risco = exp(lp) / (1 + exp(lp)), com preditores centrados como no suplemento.
 * Colesterol: mmol/L = mg/dL × 0,02586.
 * Não há clampeamento: valor fora do domínio invalida o cálculo.
 */

export const PREVENT_LIMITS = {
  age: { min: 30, max: 79 },
  sbp: { min: 90, max: 180 },
  totalCholesterol: { min: 130, max: 320 },
  hdl: { min: 20, max: 100 },
  egfr: { min: 15, max: 140 },
  hba1c: { min: 4.5, max: 15 },
  uacr: { min: 0.1, max: 25000 },
} as const;

export type PreventModel = "base" | "hba1c" | "uacr" | "full";

export interface PreventInput {
  sex: Sex;
  ageYears: number;
  totalCholesterol: number;
  hdl: number;
  sbp: number;
  egfr: number;
  diabetes: boolean;
  smoking: boolean;
  onAntihypertensive: boolean;
  onStatin: boolean;
  hba1c: number | null;
  uacr: number | null;
  establishedCardiovascularDisease: boolean;
}

export interface PreventResult {
  applicable: boolean;
  model: PreventModel | null;
  probability: number | null;
  percent: number | null;
  percentOneDecimal: number | null;
  proportionRounded3: number | null;
  reasons: string[];
  blockedBy: string[];
  sourceIds: string[];
}

const CHOLESTEROL_TO_MMOL = 0.02586;

function inRange(value: number, min: number, max: number): boolean {
  return value >= min && value <= max;
}

function logistic(linearPredictor: number): number {
  const exp = Math.exp(linearPredictor);
  return exp / (1 + exp);
}

function dot(coefficients: number[], terms: number[]): number {
  if (coefficients.length !== terms.length) {
    throw new Error("Vetor de coeficientes incompatível com os termos.");
  }
  return coefficients.reduce((sum, coefficient, index) => sum + coefficient * terms[index], 0);
}

function baseTerms(input: PreventInput): number[] {
  const age = (input.ageYears - 55) / 10;
  const nonHdl = (input.totalCholesterol - input.hdl) * CHOLESTEROL_TO_MMOL - 3.5;
  const hdl = (input.hdl * CHOLESTEROL_TO_MMOL - 1.3) / 0.3;
  const sbpUnder110 = (Math.min(input.sbp, 110) - 110) / 20;
  const sbpAtLeast110 = (Math.max(input.sbp, 110) - 130) / 20;
  const diabetes = input.diabetes ? 1 : 0;
  const smoking = input.smoking ? 1 : 0;
  const bmiUnder30 = 0;
  const bmiAtLeast30 = 0;
  const egfrUnder60 = (Math.min(input.egfr, 60) - 60) / -15;
  const egfrAtLeast60 = (Math.max(input.egfr, 60) - 90) / -15;
  const bpTreatment = input.onAntihypertensive ? 1 : 0;
  const statin = input.onStatin ? 1 : 0;
  return [
    age,
    nonHdl,
    hdl,
    sbpUnder110,
    sbpAtLeast110,
    diabetes,
    smoking,
    bmiUnder30,
    bmiAtLeast30,
    egfrUnder60,
    egfrAtLeast60,
    bpTreatment,
    statin,
    bpTreatment * sbpAtLeast110,
    statin * nonHdl,
    age * nonHdl,
    age * hdl,
    age * sbpAtLeast110,
    age * diabetes,
    age * smoking,
    age * bmiAtLeast30,
    age * egfrUnder60,
  ];
}

function coefficients(model: PreventModel, sex: Sex): number[] {
  const table = {
    base: { feminino: baseFeminino, masculino: baseMasculino },
    hba1c: { feminino: hba1cFeminino, masculino: hba1cMasculino },
    uacr: { feminino: uacrFeminino, masculino: uacrMasculino },
    full: { feminino: fullFeminino, masculino: fullMasculino },
  } as const;
  return table[model][sex];
}

function selectModel(input: PreventInput, blocked: string[]): PreventModel | null {
  const hba1cPresent = input.hba1c != null;
  const uacrPresent = input.uacr != null;
  if (hba1cPresent && !inRange(input.hba1c as number, PREVENT_LIMITS.hba1c.min, PREVENT_LIMITS.hba1c.max)) {
    blocked.push(
      `HbA1c ${input.hba1c} está fora do intervalo ${PREVENT_LIMITS.hba1c.min}–${PREVENT_LIMITS.hba1c.max} do modelo com HbA1c.`,
    );
    return null;
  }
  if (uacrPresent && !inRange(input.uacr as number, PREVENT_LIMITS.uacr.min, PREVENT_LIMITS.uacr.max)) {
    blocked.push(
      `Relação albumina/creatinina ${input.uacr} está fora do intervalo ${PREVENT_LIMITS.uacr.min}–${PREVENT_LIMITS.uacr.max} do modelo com albuminúria.`,
    );
    return null;
  }
  if (hba1cPresent && uacrPresent) return "full";
  if (hba1cPresent) return "hba1c";
  if (uacrPresent) return "uacr";
  return "base";
}

export function preventAscvd10(input: PreventInput): PreventResult {
  const blocked: string[] = [];
  const reasons: string[] = [];
  const sourceIds = ["khan", "preventr", "recEscore", "secao42"];

  if (input.establishedCardiovascularDisease) {
    blocked.push(
      "Há doença cardiovascular aterosclerótica estabelecida ou revascularização. O PREVENT destina-se a adultos sem doença cardiovascular prévia.",
    );
  }
  if (!inRange(input.ageYears, PREVENT_LIMITS.age.min, PREVENT_LIMITS.age.max)) {
    blocked.push(
      `Idade ${input.ageYears} anos está fora do domínio de 30 a 79 anos. O percentual não é extrapolado.`,
    );
  }
  if (!inRange(input.sbp, PREVENT_LIMITS.sbp.min, PREVENT_LIMITS.sbp.max)) {
    blocked.push(
      `Pressão arterial sistólica ${input.sbp} mmHg está fora do intervalo ${PREVENT_LIMITS.sbp.min}–${PREVENT_LIMITS.sbp.max}. O valor não foi forçado ao limite.`,
    );
  }
  if (
    !inRange(
      input.totalCholesterol,
      PREVENT_LIMITS.totalCholesterol.min,
      PREVENT_LIMITS.totalCholesterol.max,
    )
  ) {
    blocked.push(
      `Colesterol total ${input.totalCholesterol} mg/dL está fora do intervalo ${PREVENT_LIMITS.totalCholesterol.min}–${PREVENT_LIMITS.totalCholesterol.max}.`,
    );
  }
  if (!inRange(input.hdl, PREVENT_LIMITS.hdl.min, PREVENT_LIMITS.hdl.max)) {
    blocked.push(
      `HDL-c ${input.hdl} mg/dL está fora do intervalo ${PREVENT_LIMITS.hdl.min}–${PREVENT_LIMITS.hdl.max}.`,
    );
  }
  if (input.hdl >= input.totalCholesterol) {
    blocked.push("HDL-c não pode ser maior ou igual ao colesterol total.");
  }
  if (!inRange(input.egfr, PREVENT_LIMITS.egfr.min, PREVENT_LIMITS.egfr.max)) {
    blocked.push(
      `TFGe ${input.egfr} está fora do intervalo ${PREVENT_LIMITS.egfr.min}–${PREVENT_LIMITS.egfr.max} mL/min/1,73 m².`,
    );
  }

  const model = blocked.length === 0 ? selectModel(input, blocked) : null;
  if (blocked.length > 0 || !model) {
    return {
      applicable: false,
      model: null,
      probability: null,
      percent: null,
      percentOneDecimal: null,
      proportionRounded3: null,
      reasons,
      blockedBy: blocked,
      sourceIds,
    };
  }

  const shared = baseTerms(input);
  let terms = [...shared, 1];
  if (model === "hba1c") {
    const centered = (input.hba1c as number) - 5.3;
    terms = [...shared, input.diabetes ? centered : 0, input.diabetes ? 0 : centered, 0, 1];
  } else if (model === "uacr") {
    terms = [...shared, Math.log(input.uacr as number), 0, 1];
  } else if (model === "full") {
    const centered = (input.hba1c as number) - 5.3;
    terms = [
      ...shared,
      0,
      0,
      1,
      Math.log(input.uacr as number),
      0,
      input.diabetes ? centered : 0,
      input.diabetes ? 0 : centered,
      0,
      1,
    ];
    reasons.push(
      "HbA1c e albuminúria foram informadas. Usa-se o modelo completo publicado, com indicador de índice de privação social ausente. Não se usa CEP nem privação social americana.",
    );
  } else {
    reasons.push("Preditores opcionais ausentes: modelo básico do PREVENT-ASCVD em 10 anos.");
  }

  reasons.push(
    "O IMC não entra no PREVENT-ASCVD destes modelos: os coeficientes de IMC são zero. O IMC pode ser usado só como agravante clínico da diretriz.",
  );

  const probability = logistic(dot(coefficients(model, input.sex), terms));
  const percent = probability * 100;
  return {
    applicable: true,
    model,
    probability,
    percent,
    percentOneDecimal: roundHalfUp(percent, 1),
    proportionRounded3: roundHalfUp(probability, 3),
    reasons,
    blockedBy: [],
    sourceIds,
  };
}

export function preventBand(probability: number): "baixo" | "intermediario" | "alto" {
  if (probability < 0.05) return "baixo";
  if (probability < 0.2) return "intermediario";
  return "alto";
}
