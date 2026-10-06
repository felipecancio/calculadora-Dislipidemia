import { NumberField, SelectField, TriField } from "./Fields";
import { emptyEpisode, type Episode, type PatientInput } from "../clinical/types";

const DRUGS = [
  ["varfarina", "Varfarina"],
  ["doac", "Anticoagulante oral direto"],
  ["itraconazol", "Itraconazol ou azólico potente"],
  ["ip", "Inibidor de protease"],
  ["efavirenz", "Efavirenz"],
  ["verapamil", "Verapamil"],
  ["diltiazem", "Diltiazem"],
  ["amlodipina", "Anlodipino"],
  ["amiodarona", "Amiodarona"],
  ["ciclosporina", "Ciclosporina"],
  ["imunossupressor_mtor", "Tacrolimo, everolimo ou sirolimo"],
  ["claritromicina", "Claritromicina ou eritromicina"],
  ["azitromicina", "Azitromicina"],
  ["genfibrozila", "Genfibrozila"],
  ["fenofibrato", "Fenofibrato"],
] as const;

export function ClinicalForm({
  input,
  onChange,
}: {
  input: PatientInput;
  onChange: (input: PatientInput) => void;
}) {
  const set = <K extends keyof PatientInput>(key: K, value: PatientInput[K]) => {
    onChange({ ...input, [key]: value });
  };
  const showWoman = input.sex !== "masculino";

  return (
    <div className="stack no-print">
      <fieldset className="card">
        <legend>Dados e exames</legend>
        <div className="grid two">
          <NumberField id="idade" label="Idade" unit="anos" value={input.ageYears} onChange={(value) => set("ageYears", value)} />
          <SelectField
            id="sexo"
            label="Sexo utilizado na equação"
            value={input.sex ?? ""}
            onChange={(value) => set("sex", value === "feminino" || value === "masculino" ? value : null)}
            options={[
              { value: "", label: "Não informado" },
              { value: "feminino", label: "Feminino" },
              { value: "masculino", label: "Masculino" },
            ]}
          />
          <NumberField id="ct" label="Colesterol total" unit="mg/dL" value={input.totalCholesterol} onChange={(value) => set("totalCholesterol", value)} />
          <NumberField id="hdl" label="HDL-c" unit="mg/dL" value={input.hdl} onChange={(value) => set("hdl", value)} />
          <NumberField id="ldl" label="LDL-c atual" unit="mg/dL" value={input.ldlCurrent} onChange={(value) => set("ldlCurrent", value)} />
          <NumberField id="ldl-basal" label="LDL-c basal, antes do tratamento" unit="mg/dL" value={input.ldlBaseline} onChange={(value) => set("ldlBaseline", value)} />
          <NumberField id="tg" label="Triglicérides" unit="mg/dL" value={input.triglycerides} onChange={(value) => set("triglycerides", value)} />
          <NumberField id="pas" label="Pressão arterial sistólica" unit="mmHg" value={input.sbp} onChange={(value) => set("sbp", value)} />
          <NumberField id="tfge" label="TFGe" unit="mL/min/1,73 m²" value={input.egfr} onChange={(value) => set("egfr", value)} />
          <NumberField id="peso" label="Peso" unit="kg" value={input.weightKg} onChange={(value) => set("weightKg", value)} />
          <NumberField id="altura" label="Altura" unit="cm" value={input.heightCm} onChange={(value) => set("heightCm", value)} />
          <NumberField id="apob" label="ApoB, se disponível" unit="mg/dL" value={input.apob} onChange={(value) => set("apob", value)} />
        </div>
        <div className="grid" style={{ marginTop: 12 }}>
          <TriField label="Tabagismo atual (cigarro nos últimos 30 dias, para o PREVENT)" value={input.smoking} onChange={(value) => set("smoking", value)} />
          <TriField label="Diabetes" value={input.diabetes} onChange={(value) => set("diabetes", value)} />
          <TriField label="Uso de anti-hipertensivo" value={input.onAntihypertensive} onChange={(value) => set("onAntihypertensive", value)} />
          <TriField label="Uso atual de hipolipemiante" value={input.onLipidTherapy} onChange={(value) => set("onLipidTherapy", value)} />
        </div>
        {input.diabetes === "sim" ? (
          <div className="grid two" style={{ marginTop: 12 }}>
            <SelectField
              id="tipo-dm"
              label="Tipo de diabetes"
              value={input.diabetesType ?? ""}
              onChange={(value) => set("diabetesType", value === "dm1" || value === "dm2" ? value : null)}
              options={[
                { value: "", label: "Não informado" },
                { value: "dm2", label: "Tipo 2" },
                { value: "dm1", label: "Tipo 1" },
              ]}
            />
            <NumberField id="duracao-dm" label="Duração do diabetes" unit="anos" value={input.diabetesDurationYears} onChange={(value) => set("diabetesDurationYears", value)} />
            <NumberField id="hba1c" label="HbA1c" unit="%" value={input.hba1c} onChange={(value) => set("hba1c", value)} />
            <NumberField id="uacr" label="Albumina/creatinina urinária" unit="mg/g" value={input.uacr} onChange={(value) => set("uacr", value)} />
            <TriField label="Retinopatia não proliferativa leve" value={input.retinopathyMild} onChange={(value) => set("retinopathyMild", value)} />
            <TriField label="Retinopatia moderada, grave, proliferativa ou em progressão" value={input.retinopathyAdvanced} onChange={(value) => set("retinopathyAdvanced", value)} />
            <TriField label="Neuropatia autonômica incipiente" value={input.autonomicIncipient} onChange={(value) => set("autonomicIncipient", value)} />
            <TriField label="Neuropatia autonômica instalada (dois testes alterados)" value={input.autonomicEstablished} onChange={(value) => set("autonomicEstablished", value)} />
          </div>
        ) : null}
      </fieldset>

      <fieldset className="card">
        <legend>História clínica</legend>
        <div className="grid">
          <TriField label="Evento cardiovascular aterosclerótico prévio" value={input.priorEventStatus} onChange={(value) => set("priorEventStatus", value)} />
          <TriField label="Hipertensão arterial" value={input.hypertension} onChange={(value) => set("hypertension", value)} />
          <SelectField
            id="obstrucao"
            label="Obstrução arterial conhecida"
            value={input.obstruction}
            onChange={(value) => set("obstruction", value as PatientInput["obstruction"])}
            options={[
              { value: "nao_informada", label: "Não informada" },
              { value: "sem_obstrucao_conhecida", label: "Sem obstrução conhecida" },
              { value: "menor_50", label: "Placa ou obstrução < 50%" },
              { value: "igual_ou_maior_50", label: "Obstrução ≥ 50%" },
            ]}
          />
          <SelectField
            id="hf"
            label="Hipercolesterolemia familiar"
            value={input.familialHypercholesterolemia}
            onChange={(value) => set("familialHypercholesterolemia", value as PatientInput["familialHypercholesterolemia"])}
            options={[
              { value: "nao_informada", label: "Não informada" },
              { value: "ausente", label: "Ausente" },
              { value: "suspeita", label: "Suspeita, sem diagnóstico confirmado" },
              { value: "confirmada", label: "Confirmada" },
            ]}
          />
        </div>
        {input.priorEventStatus === "sim" ? (
          <div className="stack">
            <p>Cada bloco é um episódio distinto. SCA, infarto e angioplastia do mesmo episódio não contam como três eventos.</p>
            {input.episodes.map((episode, index) => (
              <EpisodeEditor
                key={episode.id}
                index={index}
                episode={episode}
                onChange={(next) => {
                  const episodes = input.episodes.slice();
                  episodes[index] = next;
                  set("episodes", episodes);
                }}
                onRemove={() => set("episodes", input.episodes.filter((item) => item.id !== episode.id))}
              />
            ))}
            <button type="button" className="text-button" onClick={() => set("episodes", [...input.episodes, emptyEpisode()])}>
              Adicionar episódio
            </button>
          </div>
        ) : null}
        <div className="grid two" style={{ marginTop: 12 }}>
          <NumberField id="cac" label="CAC" unit="UA" value={input.cacAgatston} onChange={(value) => set("cacAgatston", value)} />
          <NumberField id="cac-p" label="Percentil do CAC" unit="%" value={input.cacPercentile} onChange={(value) => set("cacPercentile", value)} />
          <NumberField id="lpa" label="Lp(a)" value={input.lpaValue} onChange={(value) => set("lpaValue", value)} />
          <SelectField
            id="lpa-unidade"
            label="Unidade da Lp(a)"
            value={input.lpaUnit ?? ""}
            onChange={(value) => set("lpaUnit", value === "mg/dL" || value === "nmol/L" ? value : null)}
            options={[
              { value: "", label: "Não informada" },
              { value: "mg/dL", label: "mg/dL" },
              { value: "nmol/L", label: "nmol/L" },
            ]}
          />
          <NumberField id="pcr" label="PCR ultrassensível" unit="mg/L" value={input.hsCrp} onChange={(value) => set("hsCrp", value)} />
        </div>
        <details>
          <summary>Agravantes e aterosclerose subclínica</summary>
          <div className="grid">
            <TriField label="Placa carotídea < 50%" value={input.carotidPlaqueUnder50} onChange={(value) => set("carotidPlaqueUnder50", value)} />
            <TriField label="Placa coronária < 50%" value={input.coronaryPlaqueUnder50} onChange={(value) => set("coronaryPlaqueUnder50", value)} />
            <TriField label="Aneurisma de aorta abdominal" value={input.aaa} onChange={(value) => set("aaa", value)} />
            <TriField label="Parente de primeiro grau com evento cardiovascular prematuro (homens < 55 anos, mulheres < 65 anos)" value={input.familyPremature} onChange={(value) => set("familyPremature", value)} />
            <TriField label="Adiposidade, esteatose hepática ou síndrome metabólica" value={input.adiposityManifestation} onChange={(value) => set("adiposityManifestation", value)} />
            <TriField label="Condição inflamatória crônica (artrite reumatoide, psoríase, lúpus, doença inflamatória intestinal ou HIV)" value={input.inflammatoryCondition} onChange={(value) => set("inflammatoryCondition", value)} />
            <TriField label="Transplante de órgão" value={input.organTransplant} onChange={(value) => set("organTransplant", value)} />
            {showWoman ? (
              <TriField label="Fator específico da mulher: menarca ≤ 12 ou ≥ 17 anos, pré-eclâmpsia, eclâmpsia, hipertensão ou diabetes gestacional, parto prematuro, restrição de crescimento, três ou mais abortos, ou menopausa < 40 anos" value={input.womenSpecificFactor} onChange={(value) => set("womenSpecificFactor", value)} />
            ) : null}
          </div>
        </details>
      </fieldset>

      <fieldset className="card">
        <legend>Tratamento atual e condições especiais</legend>
        <div className="grid">
          <TriField label="Uso atual de estatina" value={input.onStatin} onChange={(value) => set("onStatin", value)} />
          <TriField label="Estatina em dose máxima tolerada" value={input.statinMaxTolerated} onChange={(value) => set("statinMaxTolerated", value)} />
          <TriField label="Ezetimiba" value={input.onEzetimibe} onChange={(value) => set("onEzetimibe", value)} />
          <TriField label="Terapia anti-PCSK9" value={input.onAntiPcsk9} onChange={(value) => set("onAntiPcsk9", value)} />
          <TriField label="Ácido bempedoico" value={input.onBempedoic} onChange={(value) => set("onBempedoic", value)} />
          <TriField label="Fibrato" value={input.onFibrate} onChange={(value) => set("onFibrate", value)} />
          <SelectField
            id="adesao"
            label="Adesão"
            value={input.adherence}
            onChange={(value) => set("adherence", value as PatientInput["adherence"])}
            options={[
              { value: "nao_informada", label: "Não informada" },
              { value: "adequada", label: "Adequada" },
              { value: "inadequada", label: "Inadequada" },
            ]}
          />
          <SelectField
            id="intolerancia"
            label="Intolerância a estatina"
            value={input.intolerance}
            onChange={(value) => set("intolerance", value as PatientInput["intolerance"])}
            options={[
              { value: "nenhuma", label: "Não há" },
              { value: "suspeita", label: "Suspeita, não confirmada" },
              { value: "parcial_confirmada", label: "Parcial confirmada" },
              { value: "completa_confirmada", label: "Completa confirmada" },
            ]}
          />
          <TriField label="A alteração lipídica persiste após estilo de vida ou tratamento" value={input.lipidChangePersists} onChange={(value) => set("lipidChangePersists", value)} />
          <TriField label="Triglicérides ≥ 500 mg/dL persistem após estilo de vida" value={input.tgPersistentAtLeast500} onChange={(value) => set("tgPersistentAtLeast500", value)} />
        </div>
        <details>
          <summary>Situações que mudam a escolha do medicamento</summary>
          <div className="grid">
            {showWoman ? (
              <>
                <TriField label="Gestação" value={input.pregnant} onChange={(value) => set("pregnant", value)} />
                <TriField label="Amamentação" value={input.breastfeeding} onChange={(value) => set("breastfeeding", value)} />
                <TriField label="Intenção de engravidar" value={input.intendingPregnancy} onChange={(value) => set("intendingPregnancy", value)} />
              </>
            ) : null}
            <TriField label="Doença hepática ativa" value={input.activeLiverDisease} onChange={(value) => set("activeLiverDisease", value)} />
            <SelectField
              id="child"
              label="Child-Pugh, se cirrose"
              value={input.childPugh}
              onChange={(value) => set("childPugh", value as PatientInput["childPugh"])}
              options={[
                { value: "nao_se_aplica", label: "Não se aplica" },
                { value: "nao_informada", label: "Não informada" },
                { value: "A", label: "A" },
                { value: "B", label: "B" },
                { value: "C", label: "C" },
              ]}
            />
            <SelectField
              id="dialise"
              label="Diálise"
              value={input.dialysis}
              onChange={(value) => set("dialysis", value as PatientInput["dialysis"])}
              options={[
                { value: "nao_informada", label: "Não informada" },
                { value: "nao", label: "Não" },
                { value: "hemodialise", label: "Hemodiálise" },
                { value: "peritoneal", label: "Diálise peritoneal" },
              ]}
            />
            <TriField label="Hipotireoidismo clínico" value={input.hypothyroidism} onChange={(value) => set("hypothyroidism", value)} />
            <TriField label="Função tireoidiana já corrigida" value={input.hypothyroidismCorrected} onChange={(value) => set("hypothyroidismCorrected", value)} />
            <TriField label="Insuficiência cardíaca" value={input.heartFailure} onChange={(value) => set("heartFailure", value)} />
            <TriField label="Causa secundária de dislipidemia em investigação" value={input.secondaryCauseSuspected} onChange={(value) => set("secondaryCauseSuspected", value)} />
          </div>
          <div className="check-list" style={{ marginTop: 12 }}>
            {DRUGS.map(([id, label]) => (
              <label key={id}>
                <input
                  type="checkbox"
                  checked={input.concomitant.includes(id)}
                  onChange={(event) => {
                    const next = new Set(input.concomitant);
                    if (event.target.checked) next.add(id);
                    else next.delete(id);
                    set("concomitant", [...next]);
                  }}
                />
                <span>{label}</span>
              </label>
            ))}
          </div>
          <label className="field" htmlFor="outro-med" style={{ marginTop: 12 }}>
            <span>Outro medicamento concomitante</span>
            <textarea
              id="outro-med"
              value={input.otherMedicationNote}
              onChange={(event) => set("otherMedicationNote", event.target.value)}
            />
          </label>
        </details>
      </fieldset>
    </div>
  );
}

function EpisodeEditor({
  episode,
  index,
  onChange,
  onRemove,
}: {
  episode: Episode;
  index: number;
  onChange: (episode: Episode) => void;
  onRemove: () => void;
}) {
  const toggle = (key: keyof Episode) => {
    if (typeof episode[key] !== "boolean") return;
    onChange({ ...episode, [key]: !episode[key] });
  };
  const flags: [keyof Episode, string][] = [
    ["sca", "SCA"],
    ["iam", "Infarto"],
    ["avcIsquemico", "AVC isquêmico"],
    ["dapSintomatica", "Doença arterial periférica sintomática"],
    ["revascularizacao", "Revascularização"],
  ];
  return (
    <div className="episode">
      <strong>Episódio {index + 1}</strong>
      <div className="check-list">
        {flags.map(([key, label]) => (
          <label key={key}>
            <input type="checkbox" checked={Boolean(episode[key])} onChange={() => toggle(key)} />
            <span>{label}</span>
          </label>
        ))}
      </div>
      <NumberField
        id={`anos-${episode.id}`}
        label="Há quantos anos"
        unit="anos"
        value={episode.yearsAgo}
        onChange={(value) => onChange({ ...episode, yearsAgo: value })}
      />
      <button type="button" onClick={onRemove}>Remover episódio</button>
    </div>
  );
}
