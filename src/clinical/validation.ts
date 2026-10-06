import type { PatientInput } from "./types";

export interface ValidationIssue {
  field: string;
  message: string;
}

export function validatePatient(input: PatientInput): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  const reject = (field: string, value: number | null, label: string) => {
    if (value == null) return;
    if (value < 0) issues.push({ field, message: `${label} não pode ser negativo.` });
  };
  reject("ageYears", input.ageYears, "Idade");
  reject("totalCholesterol", input.totalCholesterol, "Colesterol total");
  reject("hdl", input.hdl, "HDL-c");
  reject("ldlCurrent", input.ldlCurrent, "LDL-c atual");
  reject("ldlBaseline", input.ldlBaseline, "LDL-c basal");
  reject("triglycerides", input.triglycerides, "Triglicérides");
  reject("sbp", input.sbp, "Pressão arterial sistólica");
  reject("egfr", input.egfr, "TFGe");
  reject("hba1c", input.hba1c, "HbA1c");
  reject("uacr", input.uacr, "Relação albumina/creatinina");
  reject("lpaValue", input.lpaValue, "Lp(a)");
  reject("hsCrp", input.hsCrp, "PCR-us");
  reject("apob", input.apob, "ApoB");
  reject("cacAgatston", input.cacAgatston, "CAC");
  if (input.ageYears != null && input.ageYears > 120) {
    issues.push({ field: "ageYears", message: "Idade acima de 120 anos não é aceita." });
  }
  if (
    input.totalCholesterol != null &&
    input.hdl != null &&
    input.hdl > input.totalCholesterol
  ) {
    issues.push({ field: "hdl", message: "HDL-c maior que o colesterol total é inconsistente." });
  }
  if (
    input.totalCholesterol != null &&
    input.ldlCurrent != null &&
    input.ldlCurrent > input.totalCholesterol
  ) {
    issues.push({ field: "ldlCurrent", message: "LDL-c atual maior que o colesterol total é inconsistente." });
  }
  if (
    input.totalCholesterol != null &&
    input.hdl != null &&
    input.ldlCurrent != null &&
    input.hdl <= input.totalCholesterol &&
    input.ldlCurrent > input.totalCholesterol - input.hdl
  ) {
    issues.push({
      field: "ldlVersusNonHdl",
      message: "LDL-c atual maior que o não-HDL-c é inconsistente. Confira colesterol total, HDL-c e LDL-c.",
    });
  }
  if (input.lpaValue != null && input.lpaUnit == null) {
    issues.push({ field: "lpaUnit", message: "Informe a unidade da Lp(a). Não converta mg/dL em nmol/L." });
  }
  if (input.diabetes === "sim" && input.diabetesType == null) {
    issues.push({ field: "diabetesType", message: "Informe se o diabetes é tipo 1 ou tipo 2." });
  }
  return issues;
}
