import type { PatientInput, RiskCategory, Tri } from "./types";

export type RenalClass = "nenhum" | "alto" | "muito_alto" | "indeterminado";

export interface DiabetesBranch {
  applies: boolean;
  category: RiskCategory | null;
  minimumOnly: boolean;
  pending: boolean;
  st1reIndicated: boolean;
  earNames: string[];
  unknownEars: string[];
  emarNames: string[];
  unknownEmar: string[];
  renal: RenalClass;
  renalText: string;
  notes: string[];
  sourceIds: string[];
}

function triAdds(value: Tri, label: string, present: string[], unknown: string[]) {
  if (value === "sim") present.push(label);
  else if (value === "nao_informado") unknown.push(label);
}

export function renalStratification(egfr: number | null, uacr: number | null): {
  renal: RenalClass;
  text: string;
  couldBeVeryHigh: boolean;
} {
  if (egfr == null) {
    return {
      renal: "indeterminado",
      couldBeVeryHigh: true,
      text: "TFGe ausente: a matriz renal do diabetes não foi posicionada.",
    };
  }
  if (egfr < 30) {
    return {
      renal: "muito_alto",
      couldBeVeryHigh: false,
      text: "TFGe < 30 mL/min/1,73 m²: risco muito alto em todas as faixas de albuminúria (G4–G5).",
    };
  }

  const stage = egfr >= 90 ? "G1" : egfr >= 60 ? "G2" : egfr >= 45 ? "G3a" : "G3b";

  if (stage === "G1") {
    if (uacr == null) {
      return {
        renal: "indeterminado",
        couldBeVeryHigh: true,
        text: "TFGe ≥ 90 sem albuminúria: a célula normal não é estratificador renal; microalbuminúria seria risco alto e macroalbuminúria, muito alto.",
      };
    }
    if (uacr < 30) {
      return {
        renal: "nenhum",
        couldBeVeryHigh: false,
        text: "G1 com albuminúria < 30 mg/g: sem estratificador renal. Vale idade, EAR e EMAR.",
      };
    }
    if (uacr < 300) {
      return { renal: "alto", couldBeVeryHigh: false, text: "G1 com albuminúria de 30 a 299 mg/g: risco alto." };
    }
    return { renal: "muito_alto", couldBeVeryHigh: false, text: "G1 com albuminúria ≥ 300 mg/g: risco muito alto." };
  }

  if (stage === "G2" || stage === "G3a") {
    if (uacr == null) {
      return {
        renal: "alto",
        couldBeVeryHigh: true,
        text: `${stage}: sem albuminúria, o mínimo da matriz é risco alto; macroalbuminúria tornaria o risco muito alto.`,
      };
    }
    if (uacr < 300) {
      return { renal: "alto", couldBeVeryHigh: false, text: `${stage} com albuminúria < 300 mg/g: risco alto.` };
    }
    return { renal: "muito_alto", couldBeVeryHigh: false, text: `${stage} com albuminúria ≥ 300 mg/g: risco muito alto.` };
  }

  if (uacr == null) {
    return {
      renal: "alto",
      couldBeVeryHigh: true,
      text: "G3b: sem albuminúria, o mínimo é risco alto; albuminúria ≥ 30 mg/g é risco muito alto.",
    };
  }
  if (uacr < 30) {
    return { renal: "alto", couldBeVeryHigh: false, text: "G3b com albuminúria < 30 mg/g: risco alto." };
  }
  return { renal: "muito_alto", couldBeVeryHigh: false, text: "G3b com albuminúria ≥ 30 mg/g: risco muito alto." };
}

export function assessDiabetes(input: PatientInput): DiabetesBranch {
  const empty: DiabetesBranch = {
    applies: false,
    category: null,
    minimumOnly: false,
    pending: false,
    st1reIndicated: false,
    earNames: [],
    unknownEars: [],
    emarNames: [],
    unknownEmar: [],
    renal: "nenhum",
    renalText: "",
    notes: [],
    sourceIds: ["tabela45", "tabela46", "tabela47", "tabela48", "secao46"],
  };
  if (input.diabetes !== "sim") return empty;

  const branch: DiabetesBranch = { ...empty, applies: true, earNames: [], unknownEars: [], emarNames: [], unknownEmar: [], notes: [] };
  if (!input.diabetesType) {
    branch.pending = true;
    branch.notes.push("Diabetes informado sem tipo. O ramo de DM1 não repete o de DM2.");
    return branch;
  }

  const ear: string[] = [];
  const unknownEar: string[] = [];
  const emar: string[] = [];
  const unknownEmar: string[] = [];

  if (input.diabetesType === "dm2") {
    if (input.diabetesDurationYears == null) unknownEar.push("duração do DM2 (EAR se > 10 anos)");
    else if (input.diabetesDurationYears > 10) ear.push("DM2 há mais de 10 anos");
  }

  triAdds(input.familyPremature, "história familiar de doença arterial coronária prematura", ear, unknownEar);
  triAdds(input.adiposityManifestation, "síndrome metabólica, adiposidade ou esteatose", ear, unknownEar);
  triAdds(input.hypertension, "hipertensão arterial", ear, unknownEar);
  triAdds(input.smoking, "tabagismo ativo", ear, unknownEar);

  if (input.autonomicEstablished === "sim") {
    emar.push("neuropatia autonômica cardiovascular instalada");
  } else {
    triAdds(input.autonomicIncipient, "neuropatia autonômica incipiente", ear, unknownEar);
    if (input.autonomicEstablished === "nao_informado") {
      unknownEmar.push("neuropatia autonômica instalada");
    }
  }

  if (input.retinopathyAdvanced === "sim") {
    emar.push("retinopatia moderada a grave, proliferativa ou em progressão");
  } else {
    triAdds(input.retinopathyMild, "retinopatia não proliferativa leve", ear, unknownEar);
    if (input.retinopathyAdvanced === "nao_informado") {
      unknownEmar.push("retinopatia avançada");
    }
  }

  const renal = renalStratification(input.egfr, input.uacr);
  branch.renal = renal.renal;
  branch.renalText = renal.text;
  if (renal.renal === "alto") ear.push("doença renal estratificada como risco alto");
  if (renal.renal === "muito_alto") emar.push("EMAR renal");
  if (renal.renal === "indeterminado") unknownEar.push("matriz renal incompleta");
  if (renal.couldBeVeryHigh && renal.renal !== "muito_alto") {
    unknownEmar.push("albuminúria capaz de tornar a matriz renal de muito alto risco");
  }

  if (input.cacAgatston == null) unknownEar.push("CAC entre 10 e 300 UA");
  else if (input.cacAgatston >= 10 && input.cacAgatston <= 300) ear.push("CAC entre 10 e 300 UA");

  triAdds(input.carotidPlaqueUnder50, "placa carotídea < 50%", ear, unknownEar);
  triAdds(input.coronaryPlaqueUnder50, "placa coronária < 50%", ear, unknownEar);
  triAdds(input.aaa, "aneurisma de aorta abdominal", ear, unknownEar);

  if (input.obstruction === "igual_ou_maior_50") emar.push("obstrução arterial ≥ 50%");
  else if (input.obstruction === "nao_informada") unknownEmar.push("estenose arterial");

  const totalCholesterol = input.totalCholesterol;
  const ldlForEmar = Math.max(input.ldlCurrent ?? Number.NEGATIVE_INFINITY, input.ldlBaseline ?? Number.NEGATIVE_INFINITY);
  if ((totalCholesterol != null && totalCholesterol > 310) || (Number.isFinite(ldlForEmar) && ldlForEmar > 190)) {
    emar.push("hipercolesterolemia grave (CT > 310 ou LDL-c > 190 mg/dL)");
  } else if (totalCholesterol == null && input.ldlCurrent == null && input.ldlBaseline == null) {
    unknownEmar.push("CT ou LDL-c para hipercolesterolemia grave");
  }

  if (input.diabetesType === "dm1") {
    const age = input.ageYears;
    const duration = input.diabetesDurationYears;
    if (duration == null || age == null) {
      unknownEmar.push("duração do DM1 e idade ao diagnóstico");
    } else if (duration > 20 && age - duration > 18) {
      emar.push("DM1 com duração > 20 anos, diagnosticado após os 18 anos");
    } else if (duration === 20 || (duration > 20 && age - duration <= 18)) {
      branch.notes.push(
        "DM1 com duração de 20 anos, ou com mais de 20 anos e diagnóstico até os 18 anos, não cai no EMAR de duração nem no ST1RE (< 20 anos). Sem outro estratificador, a categoria desse subgrupo fica pendente.",
      );
      branch.pending = true;
    }
  }

  if (ear.length >= 3) emar.push("três ou mais EAR");

  branch.earNames = ear;
  branch.unknownEars = unknownEar;
  branch.emarNames = emar;
  branch.unknownEmar = unknownEmar;

  const emarPossible = emar.length > 0 || unknownEmar.length > 0 || unknownEar.length > 0;
  const definiteEmar = emar.length > 0;

  if (definiteEmar) {
    branch.category = "muito_alto";
    branch.notes.push(`EMAR: ${emar.join("; ")}.`);
    return branch;
  }

  if (input.diabetesType === "dm2" && input.ageYears != null && input.sex) {
    const ageHigh = input.sex === "masculino" ? input.ageYears >= 50 : input.ageYears >= 56;
    if (ear.length >= 1) {
      branch.category = "alto";
      branch.minimumOnly = emarPossible;
      branch.notes.push(`EAR (${ear.length}): ${ear.join("; ")}.`);
      if (emarPossible) branch.notes.push("Ainda não é possível excluir muito alto risco por dado de EMAR ausente.");
      return branch;
    }
    if (ageHigh && unknownEar.length === 0 && unknownEmar.length === 0) {
      branch.category = "alto";
      branch.notes.push(
        input.sex === "masculino"
          ? "DM2 em homem ≥ 50 anos, sem EAR e sem EMAR."
          : "DM2 em mulher ≥ 56 anos, sem EAR e sem EMAR.",
      );
      return branch;
    }
    if (ageHigh) {
      branch.category = "alto";
      branch.minimumOnly = true;
      branch.notes.push(
        "A idade do DM2 já sustenta no mínimo alto risco; estratificadores ausentes poderiam chegar a muito alto.",
      );
      return branch;
    }
    if (unknownEar.length === 0 && unknownEmar.length === 0 && !branch.pending) {
      branch.category = "intermediario";
      branch.notes.push(
        input.sex === "masculino"
          ? "DM2 em homem < 50 anos, sem EAR e sem EMAR."
          : "DM2 em mulher < 56 anos, sem EAR e sem EMAR.",
      );
      return branch;
    }
    branch.pending = true;
    branch.notes.push("DM2 abaixo do corte de idade, com estratificador não informado: não se confirma o ramo intermediário.");
    return branch;
  }

  if (input.diabetesType === "dm1") {
    if (ear.length >= 1) {
      branch.category = "alto";
      branch.minimumOnly = emarPossible;
      branch.notes.push(`DM1 com EAR: ${ear.join("; ")}.`);
      return branch;
    }
    const duration = input.diabetesDurationYears;
    if (
      duration != null &&
      duration < 20 &&
      unknownEar.length === 0 &&
      unknownEmar.length === 0 &&
      !branch.pending
    ) {
      branch.st1reIndicated = true;
      branch.pending = true;
      branch.notes.push(
        "DM1 com menos de 20 anos de duração, sem EAR e sem EMAR: a diretriz indica o Steno Type 1 Risk Engine. Os coeficientes do ST1RE não estão nesta versão, então não há percentual nem categoria substituta pelo ramo de DM2.",
      );
      return branch;
    }
    branch.pending = true;
    if (duration == null) branch.notes.push("Duração do DM1 não informada.");
    return branch;
  }

  branch.pending = true;
  branch.notes.push("Idade ou sexo ausentes para o ramo de DM2.");
  return branch;
}
