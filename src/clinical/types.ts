export type Tri = "sim" | "nao" | "nao_informado";

export type Sex = "feminino" | "masculino";

export type DiabetesType = "dm1" | "dm2";

export type LpaUnit = "mg/dL" | "nmol/L";

export type RiskCategory =
  | "baixo"
  | "intermediario"
  | "alto"
  | "muito_alto"
  | "extremo";

export type Adherence = "adequada" | "inadequada" | "nao_informada";

export type Intolerance =
  | "nenhuma"
  | "suspeita"
  | "parcial_confirmada"
  | "completa_confirmada";

export type ChildPugh = "nao_se_aplica" | "A" | "B" | "C" | "nao_informada";

export type Dialysis = "nao" | "hemodialise" | "peritoneal" | "nao_informada";

export type Obstruction =
  | "nao_informada"
  | "sem_obstrucao_conhecida"
  | "menor_50"
  | "igual_ou_maior_50";

export type FhStatus = "ausente" | "suspeita" | "confirmada" | "nao_informada";

export type ClassificationStatus =
  | "completa"
  | "incompleta"
  | "com_ressalvas"
  | "fora_de_escopo";

export interface Episode {
  id: string;
  sca: boolean;
  iam: boolean;
  avcIsquemico: boolean;
  dapSintomatica: boolean;
  revascularizacao: boolean;
  yearsAgo: number | null;
}

export interface PatientInput {
  ageYears: number | null;
  sex: Sex | null;
  totalCholesterol: number | null;
  hdl: number | null;
  ldlCurrent: number | null;
  triglycerides: number | null;
  ldlBaseline: number | null;
  sbp: number | null;
  egfr: number | null;
  weightKg: number | null;
  heightCm: number | null;
  smoking: Tri;
  diabetes: Tri;
  diabetesType: DiabetesType | null;
  diabetesDurationYears: number | null;
  hba1c: number | null;
  uacr: number | null;
  onAntihypertensive: Tri;
  hypertension: Tri;
  onLipidTherapy: Tri;
  onStatin: Tri;
  statinMaxTolerated: Tri;
  onEzetimibe: Tri;
  onAntiPcsk9: Tri;
  onBempedoic: Tri;
  onFibrate: Tri;
  adherence: Adherence;
  intolerance: Intolerance;
  lipidChangePersists: Tri;
  priorEventStatus: Tri;
  episodes: Episode[];
  obstruction: Obstruction;
  cacAgatston: number | null;
  cacPercentile: number | null;
  carotidPlaqueUnder50: Tri;
  coronaryPlaqueUnder50: Tri;
  aaa: Tri;
  familialHypercholesterolemia: FhStatus;
  lpaValue: number | null;
  lpaUnit: LpaUnit | null;
  familyPremature: Tri;
  adiposityManifestation: Tri;
  inflammatoryCondition: Tri;
  organTransplant: Tri;
  womenSpecificFactor: Tri;
  hsCrp: number | null;
  autonomicIncipient: Tri;
  autonomicEstablished: Tri;
  retinopathyMild: Tri;
  retinopathyAdvanced: Tri;
  pregnant: Tri;
  breastfeeding: Tri;
  intendingPregnancy: Tri;
  activeLiverDisease: Tri;
  childPugh: ChildPugh;
  dialysis: Dialysis;
  hypothyroidism: Tri;
  hypothyroidismCorrected: Tri;
  heartFailure: Tri;
  secondaryCauseSuspected: Tri;
  concomitant: string[];
  otherMedicationNote: string;
  apob: number | null;
  tgPersistentAtLeast500: Tri;
}

export interface SourceRef {
  id: string;
  short: string;
  detail: string;
}

export const CATEGORY_LABEL: Record<RiskCategory, string> = {
  baixo: "Baixo",
  intermediario: "Intermediário",
  alto: "Alto",
  muito_alto: "Muito alto",
  extremo: "Extremo",
};

export const CATEGORY_RANK: Record<RiskCategory, number> = {
  baixo: 1,
  intermediario: 2,
  alto: 3,
  muito_alto: 4,
  extremo: 5,
};

export function higherCategory(
  current: RiskCategory | null,
  next: RiskCategory,
): RiskCategory {
  if (!current || CATEGORY_RANK[next] > CATEGORY_RANK[current]) return next;
  return current;
}

export function emptyEpisode(): Episode {
  return {
    id: cryptoId(),
    sca: false,
    iam: false,
    avcIsquemico: false,
    dapSintomatica: false,
    revascularizacao: false,
    yearsAgo: null,
  };
}

export function cryptoId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `ep-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

export function emptyPatient(): PatientInput {
  return {
    ageYears: null,
    sex: null,
    totalCholesterol: null,
    hdl: null,
    ldlCurrent: null,
    triglycerides: null,
    ldlBaseline: null,
    sbp: null,
    egfr: null,
    weightKg: null,
    heightCm: null,
    smoking: "nao_informado",
    diabetes: "nao_informado",
    diabetesType: null,
    diabetesDurationYears: null,
    hba1c: null,
    uacr: null,
    onAntihypertensive: "nao_informado",
    hypertension: "nao_informado",
    onLipidTherapy: "nao_informado",
    onStatin: "nao_informado",
    statinMaxTolerated: "nao_informado",
    onEzetimibe: "nao_informado",
    onAntiPcsk9: "nao_informado",
    onBempedoic: "nao_informado",
    onFibrate: "nao_informado",
    adherence: "nao_informada",
    intolerance: "nenhuma",
    lipidChangePersists: "nao_informado",
    priorEventStatus: "nao_informado",
    episodes: [],
    obstruction: "nao_informada",
    cacAgatston: null,
    cacPercentile: null,
    carotidPlaqueUnder50: "nao_informado",
    coronaryPlaqueUnder50: "nao_informado",
    aaa: "nao_informado",
    familialHypercholesterolemia: "nao_informada",
    lpaValue: null,
    lpaUnit: null,
    familyPremature: "nao_informado",
    adiposityManifestation: "nao_informado",
    inflammatoryCondition: "nao_informado",
    organTransplant: "nao_informado",
    womenSpecificFactor: "nao_informado",
    hsCrp: null,
    autonomicIncipient: "nao_informado",
    autonomicEstablished: "nao_informado",
    retinopathyMild: "nao_informado",
    retinopathyAdvanced: "nao_informado",
    pregnant: "nao_informado",
    breastfeeding: "nao_informado",
    intendingPregnancy: "nao_informado",
    activeLiverDisease: "nao_informado",
    childPugh: "nao_se_aplica",
    dialysis: "nao_informada",
    hypothyroidism: "nao_informado",
    hypothyroidismCorrected: "nao_informado",
    heartFailure: "nao_informado",
    secondaryCauseSuspected: "nao_informado",
    concomitant: [],
    otherMedicationNote: "",
    apob: null,
    tgPersistentAtLeast500: "nao_informado",
  };
}
