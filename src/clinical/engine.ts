import { CATEGORY_LABEL, type PatientInput } from "./types";
import { stratify } from "./risk";
import { assessTargets, type TargetAssessment } from "./targets";
import { planTreatment, type TreatmentPlan } from "./treatment";
import type { Stratification } from "./risk";
import { validatePatient, type ValidationIssue } from "./validation";
import { bmiKgM2, formatMg } from "./numbers";
import { SOURCES } from "./clinicalSources";

export interface EngineOutput {
  issues: ValidationIssue[];
  stratification: Stratification;
  targets: TargetAssessment | null;
  treatment: TreatmentPlan;
  summaryText: string;
  bmi: number | null;
}

const MODEL_LABEL: Record<string, string> = {
  base: "básico",
  hba1c: "com HbA1c",
  uacr: "com albuminúria",
  full: "completo, com privação social ausente",
};

export function evaluatePatient(input: PatientInput): EngineOutput {
  const issues = validatePatient(input);
  const stratification = stratify(input);
  const blocking = issues.some((issue) =>
    ["hdl", "ldlCurrent", "totalCholesterol"].includes(issue.field),
  );
  const targets =
    stratification.category && !blocking
      ? assessTargets(input, stratification.category, stratification.status === "incompleta")
      : null;
  const treatment = planTreatment(input, stratification, targets);
  const bmi = bmiKgM2(input.weightKg, input.heightCm);
  return {
    issues,
    stratification,
    targets,
    treatment,
    bmi,
    summaryText: buildSummary(input, stratification, targets, treatment, issues),
  };
}

function buildSummary(
  input: PatientInput,
  stratification: Stratification,
  targets: TargetAssessment | null,
  treatment: TreatmentPlan,
  issues: ValidationIssue[],
): string {
  const lines: string[] = [];
  if (stratification.status === "incompleta" || stratification.status === "fora_de_escopo") {
    lines.push("RESULTADO INCOMPLETO — não interpretar como classificação definitiva.");
  }
  lines.push("Calculadora de Dislipidemia — SBC 2025");
  lines.push("Apoio à decisão clínica. Não é prescrição e não substitui o julgamento da médica.");
  lines.push("");
  lines.push(`Idade: ${input.ageYears ?? "não informada"} anos`);
  lines.push(`Sexo na equação: ${input.sex ?? "não informado"}`);
  lines.push(`Colesterol total: ${fmt(input.totalCholesterol)} mg/dL`);
  lines.push(`HDL-c: ${fmt(input.hdl)} mg/dL`);
  lines.push(`LDL-c atual: ${fmt(input.ldlCurrent)} mg/dL`);
  lines.push(`LDL-c basal: ${fmt(input.ldlBaseline)} mg/dL`);
  lines.push(`Triglicérides: ${fmt(input.triglycerides)} mg/dL`);
  lines.push(`PAS: ${fmt(input.sbp)} mmHg`);
  lines.push(`TFGe: ${fmt(input.egfr)} mL/min/1,73 m²`);
  lines.push("");
  lines.push(`Situação: ${stratification.headline}`);
  if (stratification.category) {
    lines.push(`Categoria: ${CATEGORY_LABEL[stratification.category]}`);
  }
  const main = stratification.findings[0];
  if (main) lines.push(`Regra principal: ${main.text} (${SOURCES[main.sourceId]?.short ?? main.sourceId})`);
  const prevent = stratification.prevent;
  if (prevent?.applicable && prevent.percent != null && prevent.model) {
    lines.push(
      `PREVENT-ASCVD 10 anos, modelo ${MODEL_LABEL[prevent.model]}: ${prevent.percent.toFixed(2).replace(".", ",")}%${stratification.preventApplied ? "" : " (não usado para classificar este caso)"}`,
    );
  } else if (prevent && !prevent.applicable) {
    lines.push(`PREVENT não calculado: ${prevent.blockedBy[0] ?? "fora do domínio"}`);
  }
  if (targets) {
    lines.push(targets.ldlGoalText);
    lines.push(
      targets.ldlAtGoal == null
        ? "Atingimento do LDL-c: não avaliável."
        : targets.ldlAtGoal
          ? "LDL-c atual está abaixo da meta."
          : "LDL-c atual não atingiu a meta.",
    );
    lines.push(targets.nonHdlGoalText);
    lines.push(`Redução percentual desejada: ≥ ${targets.reductionGoalPercent}%.`);
    lines.push(
      targets.reductionObservedPercent == null
        ? "Redução alcançada: não calculada, sem LDL basal."
        : `Redução observada: ${targets.reductionObservedPercent.toFixed(1).replace(".", ",")}% (${targets.reductionAtGoal ? "atingida" : "não atingida"}).`,
    );
  }
  lines.push(`Estratégia: ${treatment.action}. ${treatment.summary}`);
  for (const option of treatment.options) lines.push(`- ${option.title}: ${option.detail}`);
  if (stratification.missing.length) {
    lines.push(`Pendências: ${stratification.missing.join("; ")}`);
  }
  if (issues.length) lines.push(`Inconsistências: ${issues.map((issue) => issue.message).join(" ")}`);
  lines.push("Diretriz: Arq Bras Cardiol. 2025;122(9):e20250640. DOI 10.36660/abc.20250640.");
  lines.push("Equação: PREVENT-ASCVD 10 anos, Khan et al., Circulation 2024;149:430-449.");
  return lines.join("\n");
}

function fmt(value: number | null): string {
  return value == null ? "não informado" : formatMg(value);
}
