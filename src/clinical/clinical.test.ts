import { describe, expect, it } from "vitest";
import { syntheticAdult } from "./examples";
import { evaluatePatient } from "./engine";
import { preventAscvd10, preventBand } from "./prevent";
import { renalStratification } from "./diabetes";
import { assessTargets } from "./targets";
import { parseDecimal } from "./numbers";
import type { PatientInput } from "./types";

const reference = {
  sex: "feminino" as const,
  ageYears: 50,
  totalCholesterol: 200,
  hdl: 45,
  sbp: 160,
  egfr: 90,
  diabetes: true,
  smoking: false,
  onAntihypertensive: true,
  onStatin: false,
  hba1c: null as number | null,
  uacr: null as number | null,
  establishedCardiovascularDisease: false,
};

describe("PREVENT-ASCVD 10 anos", () => {
  it("reproduz os casos femininos e masculinos do modelo básico", () => {
    const woman = preventAscvd10(reference);
    const man = preventAscvd10({ ...reference, sex: "masculino" });
    expect(woman.applicable).toBe(true);
    expect(woman.model).toBe("base");
    expect(woman.proportionRounded3).toBe(0.092);
    expect(man.proportionRounded3).toBe(0.102);
  });

  it("usa os modelos publicados de HbA1c, albuminúria e completo sem imputar privação social", () => {
    expect(preventAscvd10({ ...reference, hba1c: 9.2 }).proportionRounded3).toBe(0.103);
    expect(preventAscvd10({ ...reference, sex: "masculino", hba1c: 9.2 }).proportionRounded3).toBe(0.112);
    expect(preventAscvd10({ ...reference, uacr: 92 }).proportionRounded3).toBe(0.111);
    expect(preventAscvd10({ ...reference, sex: "masculino", uacr: 92 }).proportionRounded3).toBe(0.123);
    const fullWoman = preventAscvd10({ ...reference, hba1c: 9.2, uacr: 92 });
    const fullMan = preventAscvd10({ ...reference, sex: "masculino", hba1c: 9.2, uacr: 92 });
    expect(fullWoman.model).toBe("full");
    expect(fullWoman.proportionRounded3).toBe(0.121);
    expect(fullMan.proportionRounded3).toBe(0.126);
    expect(fullWoman.reasons.join(" ")).toMatch(/privação social ausente/i);
  });

  it("não calcula fora do domínio e não empurra o valor para o limite", () => {
    for (const age of [29, 80]) {
      const result = preventAscvd10({ ...reference, ageYears: age });
      expect(result.applicable).toBe(false);
      expect(result.probability).toBeNull();
    }
    expect(preventAscvd10({ ...reference, sbp: 89 }).probability).toBeNull();
    expect(preventAscvd10({ ...reference, sbp: 181 }).probability).toBeNull();
    expect(preventAscvd10({ ...reference, totalCholesterol: 129 }).probability).toBeNull();
    expect(preventAscvd10({ ...reference, totalCholesterol: 321 }).probability).toBeNull();
    expect(preventAscvd10({ ...reference, hdl: 19 }).probability).toBeNull();
    expect(preventAscvd10({ ...reference, hdl: 101 }).probability).toBeNull();
    expect(preventAscvd10({ ...reference, egfr: 14 }).probability).toBeNull();
    expect(preventAscvd10({ ...reference, egfr: 141 }).probability).toBeNull();
    expect(preventAscvd10({ ...reference, ageYears: 30 }).applicable).toBe(true);
    expect(preventAscvd10({ ...reference, ageYears: 79 }).applicable).toBe(true);
    expect(preventAscvd10({ ...reference, establishedCardiovascularDisease: true }).applicable).toBe(false);
  });

  it("classifica os cortes de 5% e 20% pelo valor não arredondado", () => {
    expect(preventBand(0.049999)).toBe("baixo");
    expect(preventBand(0.05)).toBe("intermediario");
    expect(preventBand(0.199999)).toBe("intermediario");
    expect(preventBand(0.2)).toBe("alto");
  });
});

function categoryOf(patch: Partial<PatientInput>) {
  return evaluatePatient(syntheticAdult(patch));
}

describe("estratificação SBC 2025", () => {
  it("separa LDL 159,9, 160, 189,9 e 190", () => {
    expect(categoryOf({ ldlCurrent: 159.9, totalCholesterol: 230, hdl: 50 }).stratification.category).not.toBe("intermediario");
    const at160 = categoryOf({ ageYears: 35, sex: "feminino", ldlCurrent: 160, totalCholesterol: 230, hdl: 55, sbp: 110, egfr: 100 });
    expect(at160.stratification.findings.some((item) => item.text.includes("160"))).toBe(true);
    expect(at160.stratification.category).toBe("intermediario");
    expect(categoryOf({ ageYears: 35, sex: "feminino", ldlCurrent: 189.9, totalCholesterol: 250, hdl: 50, sbp: 110, egfr: 100 }).stratification.category).toBe("intermediario");
    expect(categoryOf({ ldlCurrent: 190, totalCholesterol: 260, hdl: 50 }).stratification.category).toBe("alto");
  });

  it("aplica CAC 100 e 300 com operador estritamente maior", () => {
    expect(categoryOf({ cacAgatston: 100 }).stratification.category).not.toBe("alto");
    expect(categoryOf({ cacAgatston: 100.1, totalCholesterol: 180, hdl: 55, ldlCurrent: 100 }).stratification.category).toBe("alto");
    expect(categoryOf({ cacAgatston: 300 }).stratification.category).toBe("alto");
    expect(categoryOf({ cacAgatston: 300.1 }).stratification.category).toBe("muito_alto");
  });

  it("não converte Lp(a) e respeita os dois cortes", () => {
    const mildMg = categoryOf({
      ageYears: 40,
      sex: "feminino",
      ldlCurrent: 110,
      totalCholesterol: 180,
      hdl: 55,
      sbp: 112,
      egfr: 98,
      lpaValue: 50,
      lpaUnit: "mg/dL",
    });
    const mildNmol = categoryOf({
      ageYears: 40,
      sex: "feminino",
      ldlCurrent: 110,
      totalCholesterol: 180,
      hdl: 55,
      sbp: 112,
      egfr: 98,
      lpaValue: 50,
      lpaUnit: "nmol/L",
    });
    expect(mildMg.stratification.category).toBe("intermediario");
    expect(mildNmol.stratification.category).toBe("baixo");
    expect(categoryOf({ lpaValue: 180, lpaUnit: "mg/dL", ldlCurrent: 100, totalCholesterol: 180, hdl: 55 }).stratification.category).not.toBe("alto");
    expect(categoryOf({ lpaValue: 180.1, lpaUnit: "mg/dL" }).stratification.category).toBe("alto");
    expect(categoryOf({ lpaValue: 390, lpaUnit: "nmol/L", ldlCurrent: 100, totalCholesterol: 180, hdl: 55 }).stratification.findings.some((item) => item.text.includes("ultrapassa"))).toBe(false);
    expect(categoryOf({ lpaValue: 390.1, lpaUnit: "nmol/L" }).stratification.category).toBe("alto");
  });

  it("reclassifica uma única vez por agravante", () => {
    const low = categoryOf({
      ageYears: 40,
      sex: "feminino",
      ldlCurrent: 100,
      totalCholesterol: 170,
      hdl: 60,
      sbp: 110,
      egfr: 100,
      lpaValue: 10,
      lpaUnit: "mg/dL",
    });
    expect(low.stratification.category).toBe("baixo");
    const one = categoryOf({
      ageYears: 40,
      sex: "feminino",
      ldlCurrent: 100,
      totalCholesterol: 170,
      hdl: 60,
      sbp: 110,
      egfr: 100,
      lpaValue: 10,
      lpaUnit: "mg/dL",
      familyPremature: "sim",
      inflammatoryCondition: "sim",
    });
    expect(one.stratification.category).toBe("intermediario");
    const highScore = categoryOf({
      ldlCurrent: 190,
      totalCholesterol: 260,
      hdl: 45,
      familyPremature: "sim",
      inflammatoryCondition: "sim",
      hsCrp: 4,
    });
    expect(highScore.stratification.category).toBe("alto");
  });

  it("conta episódios distintos e não triplica o mesmo evento", () => {
    const single = categoryOf({
      priorEventStatus: "sim",
      episodes: [
        { id: "1", sca: true, iam: true, avcIsquemico: false, dapSintomatica: false, revascularizacao: true, yearsAgo: 8 },
      ],
      hypertension: "nao",
      diabetes: "nao",
    });
    expect(single.stratification.category).toBe("muito_alto");
    const extreme = categoryOf({
      priorEventStatus: "sim",
      diabetes: "sim",
      diabetesType: "dm2",
      diabetesDurationYears: 2,
      hypertension: "sim",
      cacAgatston: 0,
      uacr: 5,
      egfr: 95,
      episodes: [
        { id: "1", sca: false, iam: true, avcIsquemico: false, dapSintomatica: false, revascularizacao: false, yearsAgo: 8 },
      ],
    });
    expect(extreme.stratification.category).toBe("extremo");
    const two = categoryOf({
      priorEventStatus: "sim",
      episodes: [
        { id: "1", sca: false, iam: true, avcIsquemico: false, dapSintomatica: false, revascularizacao: false, yearsAgo: 6 },
        { id: "2", sca: false, iam: false, avcIsquemico: true, dapSintomatica: false, revascularizacao: false, yearsAgo: 3 },
      ],
    });
    expect(two.stratification.category).toBe("extremo");
  });

  it("percorre DM2 por idade, EAR, EMAR e matriz renal", () => {
    const dm = {
      diabetes: "sim" as const,
      diabetesType: "dm2" as const,
      diabetesDurationYears: 4,
      cacAgatston: 0,
      uacr: 8,
      egfr: 96,
      ldlCurrent: 110,
      totalCholesterol: 180,
      hdl: 50,
    };
    expect(categoryOf({ ...dm, ageYears: 49, sex: "masculino" }).stratification.category).toBe("intermediario");
    expect(categoryOf({ ...dm, ageYears: 50, sex: "masculino" }).stratification.category).toBe("alto");
    expect(categoryOf({ ...dm, ageYears: 55, sex: "feminino" }).stratification.category).toBe("intermediario");
    expect(categoryOf({ ...dm, ageYears: 56, sex: "feminino" }).stratification.category).toBe("alto");
    expect(categoryOf({ ...dm, ageYears: 40, sex: "masculino", hypertension: "sim" }).stratification.category).toBe("alto");
    expect(
      categoryOf({
        ...dm,
        ageYears: 40,
        sex: "masculino",
        hypertension: "sim",
        smoking: "sim",
        familyPremature: "sim",
      }).stratification.category,
    ).toBe("muito_alto");
    expect(categoryOf({ ...dm, ageYears: 40, sex: "masculino", retinopathyAdvanced: "sim" }).stratification.category).toBe("muito_alto");
    expect(renalStratification(95, 8).renal).toBe("nenhum");
    expect(renalStratification(95, 30).renal).toBe("alto");
    expect(renalStratification(95, 300).renal).toBe("muito_alto");
    expect(renalStratification(60, 10).renal).toBe("alto");
    expect(renalStratification(45, 10).renal).toBe("alto");
    expect(renalStratification(44, 10).renal).toBe("alto");
    expect(renalStratification(44, 30).renal).toBe("muito_alto");
    expect(renalStratification(29, null).renal).toBe("muito_alto");
    expect(categoryOf({ ...dm, ageYears: 42, sex: "feminino", egfr: 20, uacr: null }).stratification.category).toBe("muito_alto");
  });

  it("não replica o ramo etário de DM2 no DM1 e não fabrica ST1RE", () => {
    const dm1 = categoryOf({
      ageYears: 49,
      sex: "masculino",
      diabetes: "sim",
      diabetesType: "dm1",
      diabetesDurationYears: 8,
      cacAgatston: 0,
      uacr: 5,
      egfr: 100,
      ldlCurrent: 100,
      totalCholesterol: 170,
      hdl: 55,
      sbp: 116,
    });
    expect(dm1.stratification.diabetes.st1reIndicated).toBe(true);
    expect(dm1.stratification.category).not.toBe("alto");
    expect(dm1.stratification.preventApplied).toBe(false);
    expect(dm1.summaryText).toMatch(/INCOMPLETO/);
  });

  it("não gera percentual em jovem nem em idoso fora do PREVENT", () => {
    const young = categoryOf({
      ageYears: 25,
      ldlCurrent: 110,
      totalCholesterol: 180,
      hdl: 55,
      sbp: 110,
      egfr: 110,
    });
    expect(young.stratification.prevent?.applicable ?? false).toBe(false);
    expect(young.summaryText).not.toMatch(/PREVENT-ASCVD 10 anos, modelo/);
    const old = categoryOf({ ageYears: 82, ldlCurrent: 100, totalCholesterol: 180, hdl: 55 });
    expect(old.stratification.category).toBe("alto");
    expect(old.stratification.prevent?.probability ?? null).toBeNull();
  });

  it("mantém o LDL basal quando o valor atual caiu com tratamento", () => {
    const treated = categoryOf({
      onLipidTherapy: "sim",
      onStatin: "sim",
      ldlBaseline: 210,
      ldlCurrent: 80,
      totalCholesterol: 150,
      hdl: 50,
    });
    expect(treated.stratification.category).toBe("alto");
  });
});

describe("metas e tratamento", () => {
  it("não considera atingida a meta quando o LDL é igual ao corte", () => {
    for (const [category, ldl] of [
      ["baixo", 115],
      ["intermediario", 100],
      ["alto", 70],
      ["muito_alto", 50],
      ["extremo", 40],
    ] as const) {
      const atCut = assessTargets(syntheticAdult({ ldlCurrent: ldl, ldlBaseline: 200 }), category, false);
      expect(atCut.ldlAtGoal).toBe(false);
      expect(atCut.ldlGoalText).toBe(`Meta de LDL-c: abaixo de ${ldl} mg/dL`);
      const below = assessTargets(syntheticAdult({ ldlCurrent: ldl - 0.1, ldlBaseline: 200 }), category, false);
      expect(below.ldlAtGoal).toBe(true);
    }
  });

  it("avalia a redução percentual com o operador correto", () => {
    const reached = assessTargets(syntheticAdult({ ldlBaseline: 200, ldlCurrent: 140 }), "baixo", false);
    expect(reached.reductionAtGoal).toBe(true);
    const missed = assessTargets(syntheticAdult({ ldlBaseline: 200, ldlCurrent: 140.1 }), "baixo", false);
    expect(missed.reductionAtGoal).toBe(false);
    const half = assessTargets(syntheticAdult({ ldlBaseline: 200, ldlCurrent: 100 }), "alto", false);
    expect(half.reductionAtGoal).toBe(true);
    const halfMissed = assessTargets(syntheticAdult({ ldlBaseline: 200, ldlCurrent: 100.1 }), "alto", false);
    expect(halfMissed.reductionAtGoal).toBe(false);
    const noBaseline = assessTargets(syntheticAdult({ ldlBaseline: null, ldlCurrent: 80 }), "alto", false);
    expect(noBaseline.reductionObservedPercent).toBeNull();
    expect(noBaseline.additionalReductionLabel).toMatch(/não é a redução já alcançada/);
  });

  it("diferencia estilo de vida, início, manutenção, adesão, intolerância, gestação e triglicérides", () => {
    const low = categoryOf({
      ageYears: 40,
      sex: "feminino",
      ldlCurrent: 120,
      totalCholesterol: 190,
      hdl: 55,
      sbp: 112,
      egfr: 98,
      lpaValue: 10,
      lpaUnit: "mg/dL",
      lipidChangePersists: "nao",
    });
    expect(low.treatment.action).toMatch(/estilo de vida/i);

    const persistent = categoryOf({
      ageYears: 40,
      sex: "feminino",
      ldlCurrent: 150,
      totalCholesterol: 220,
      hdl: 50,
      sbp: 112,
      egfr: 98,
      lpaValue: 10,
      lpaUnit: "mg/dL",
      lipidChangePersists: "sim",
    });
    expect(persistent.treatment.action).toMatch(/Iniciar/);

    const kept = categoryOf({
      onLipidTherapy: "sim",
      onStatin: "sim",
      ldlCurrent: 60,
      totalCholesterol: 140,
      hdl: 55,
      ldlBaseline: 200,
      adherence: "adequada",
    });
    expect(kept.stratification.category).toBe("alto");
    expect(kept.treatment.action).toMatch(/Manter/);

    const poor = categoryOf({
      onLipidTherapy: "sim",
      onStatin: "sim",
      ldlCurrent: 120,
      ldlBaseline: 210,
      totalCholesterol: 190,
      hdl: 45,
      adherence: "inadequada",
    });
    expect(poor.treatment.action).toMatch(/adesão/i);

    const intolerant = categoryOf({
      ldlCurrent: 190,
      totalCholesterol: 260,
      hdl: 40,
      intolerance: "completa_confirmada",
    });
    expect(intolerant.treatment.action).toMatch(/intolerância completa/i);
    expect(intolerant.treatment.options.some((option) => option.title.match(/sem estatina/i))).toBe(true);

    const pregnant = categoryOf({ ldlCurrent: 190, totalCholesterol: 260, hdl: 40, pregnant: "sim" });
    expect(pregnant.stratification.category).toBe("alto");
    expect(pregnant.treatment.action).toMatch(/gestação/i);

    const tg = categoryOf({
      triglycerides: 620,
      tgPersistentAtLeast500: "sim",
      ldlCurrent: 120,
      totalCholesterol: 280,
      hdl: 40,
    });
    expect(tg.treatment.options.some((option) => option.title.match(/pancreatite/i))).toBe(true);
  });

  it("suspende a sugestão específica diante de medicamento não reconhecido ou interação", () => {
    const other = categoryOf({
      ldlCurrent: 190,
      totalCholesterol: 260,
      hdl: 40,
      otherMedicationNote: "fármaco hipotético",
    });
    expect(other.treatment.suspendedSpecificStatin).toBe(true);
    expect(other.treatment.alerts.join(" ")).toMatch(/não avaliada/i);
    const azole = categoryOf({
      ldlCurrent: 190,
      totalCholesterol: 260,
      hdl: 40,
      concomitant: ["itraconazol"],
    });
    expect(azole.treatment.alerts.join(" ")).toMatch(/itraconazol|Azólico/i);
  });

  it("aceita vírgula, limpa o estado e muda o resultado quando a entrada muda", () => {
    expect(parseDecimal("12,5")).toBe(12.5);
    expect(parseDecimal("")).toBeNull();
    expect(parseDecimal("0")).toBe(0);
    const first = evaluatePatient(syntheticAdult({ ldlCurrent: 90, totalCholesterol: 170, hdl: 60 }));
    const changed = evaluatePatient(syntheticAdult({ ldlCurrent: 210, totalCholesterol: 280, hdl: 50 }));
    expect(first.stratification.category).toBe("baixo");
    expect(changed.stratification.category).toBe("alto");
    expect(changed.summaryText).toContain("SBC 2025");
    expect(changed.summaryText).toContain("Alto");
    expect(changed.summaryText).not.toContain("Categoria: Baixo");
  });
});
