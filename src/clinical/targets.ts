import type { PatientInput, RiskCategory } from "./types";

export interface LipidTargets {
  ldl: number;
  reduction: number;
  nonHdl: number;
  apob: number;
}

export const TARGETS: Record<RiskCategory, LipidTargets> = {
  baixo: { ldl: 115, reduction: 0.3, nonHdl: 145, apob: 100 },
  intermediario: { ldl: 100, reduction: 0.3, nonHdl: 130, apob: 90 },
  alto: { ldl: 70, reduction: 0.5, nonHdl: 100, apob: 70 },
  muito_alto: { ldl: 50, reduction: 0.5, nonHdl: 80, apob: 55 },
  extremo: { ldl: 40, reduction: 0.5, nonHdl: 70, apob: 45 },
};

const EPSILON = 1e-9;

export interface TargetAssessment {
  category: RiskCategory;
  provisional: boolean;
  ldlGoalText: string;
  ldlCurrent: number | null;
  ldlAtGoal: boolean | null;
  nonHdl: number | null;
  nonHdlGoalText: string;
  nonHdlAtGoal: boolean | null;
  apob: number | null;
  apobGoalText: string;
  apobAtGoal: boolean | null;
  reductionGoalPercent: number;
  reductionObservedPercent: number | null;
  reductionAtGoal: boolean | null;
  reductionThresholdLdl: number | null;
  additionalReductionLabel: string | null;
  pharmacologicThresholdMet: boolean | null;
  notes: string[];
}

export function nonHdlCholesterol(total: number | null, hdl: number | null): number | null {
  if (total == null || hdl == null) return null;
  if (hdl > total) return null;
  return total - hdl;
}

export function assessTargets(
  input: PatientInput,
  category: RiskCategory,
  provisional: boolean,
): TargetAssessment {
  const goals = TARGETS[category];
  const notes: string[] = [];
  const nonHdl = nonHdlCholesterol(input.totalCholesterol, input.hdl);
  const ldl = input.ldlCurrent;
  const ldlAtGoal = ldl == null ? null : ldl < goals.ldl;
  const nonHdlAtGoal = nonHdl == null ? null : nonHdl < goals.nonHdl;
  const apobAtGoal = input.apob == null ? null : input.apob < goals.apob;
  if (ldl != null && ldl === goals.ldl) {
    notes.push("LDL-c igual ao corte não atingiu a meta, porque a meta é estritamente abaixo do valor.");
  }

  let reductionObservedPercent: number | null = null;
  let reductionAtGoal: boolean | null = null;
  let reductionThresholdLdl: number | null = null;
  if (input.ldlBaseline != null && input.ldlBaseline > 0 && ldl != null) {
    reductionObservedPercent = ((input.ldlBaseline - ldl) / input.ldlBaseline) * 100;
    reductionThresholdLdl = input.ldlBaseline * (1 - goals.reduction);
    reductionAtGoal = ldl <= reductionThresholdLdl + EPSILON;
  } else {
    notes.push("Sem LDL-c basal documentado, a redução percentual alcançada não pode ser calculada.");
  }

  const additionalReductionLabel =
    ldl != null
      ? `Redução adicional hipotética de ${Math.round(goals.reduction * 100)}% a partir do LDL atual: cerca de ${(ldl * goals.reduction).toFixed(0)} mg/dL. Isto não é a redução já alcançada.`
      : null;

  const ldlFar = ldl == null ? null : ldl >= goals.ldl + 30;
  const nonHdlFar = nonHdl == null ? null : nonHdl >= goals.nonHdl + 30;
  const pharmacologicThresholdMet =
    ldlFar == null && nonHdlFar == null ? null : Boolean(ldlFar || nonHdlFar);

  if (provisional) {
    notes.push("A meta acompanha o risco mínimo demonstrado e pode mudar se a categoria subir.");
  }

  return {
    category,
    provisional,
    ldlGoalText: `Meta de LDL-c: abaixo de ${goals.ldl} mg/dL`,
    ldlCurrent: ldl,
    ldlAtGoal,
    nonHdl,
    nonHdlGoalText: `Meta de não-HDL-c: abaixo de ${goals.nonHdl} mg/dL`,
    nonHdlAtGoal,
    apob: input.apob,
    apobGoalText: `Meta secundária de ApoB: abaixo de ${goals.apob} mg/dL`,
    apobAtGoal,
    reductionGoalPercent: goals.reduction * 100,
    reductionObservedPercent,
    reductionAtGoal,
    reductionThresholdLdl,
    additionalReductionLabel,
    pharmacologicThresholdMet,
    notes,
  };
}
