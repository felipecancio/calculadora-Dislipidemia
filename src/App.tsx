import { useMemo, useState } from "react";
import { ClinicalForm } from "./components/ClinicalForm";
import { Results } from "./components/Results";
import { evaluatePatient } from "./clinical/engine";
import { syntheticAdult } from "./clinical/examples";
import { emptyPatient, type PatientInput } from "./clinical/types";

export function App() {
  const [input, setInput] = useState<PatientInput>(emptyPatient());
  const [formKey, setFormKey] = useState(0);
  const output = useMemo(() => evaluatePatient(input), [input]);

  function replace(next: PatientInput) {
    setInput(next);
    setFormKey((key) => key + 1);
  }

  return (
    <main className="app">
      <header>
        <h1>Calculadora de Dislipidemia — SBC 2025</h1>
        <p>Estratificação, metas lipídicas e estratégia hipolipemiante para adultos, na consulta.</p>
      </header>
      <div className="actions no-print" style={{ marginTop: 16 }}>
        <button type="button" className="primary" onClick={() => document.getElementById("resultado")?.scrollIntoView({ behavior: "smooth" })}>
          Ver resultado
        </button>
        <button
          type="button"
          onClick={() =>
            replace(
              syntheticAdult({
                ageYears: 54,
                sex: "feminino",
                totalCholesterol: 248,
                hdl: 46,
                ldlCurrent: 168,
                triglycerides: 180,
                sbp: 138,
                egfr: 78,
                onAntihypertensive: "sim",
                hypertension: "sim",
              }),
            )
          }
        >
          Exemplo sintético
        </button>
        <button type="button" onClick={() => replace(emptyPatient())}>
          Novo paciente
        </button>
      </div>
      <ClinicalForm key={formKey} input={input} onChange={setInput} />
      <div className="stack">
        <Results output={output} />
      </div>
      <footer>
        Base: Diretriz Brasileira de Dislipidemias e Prevenção da Aterosclerose — SBC 2025. Apoio à decisão clínica.
      </footer>
    </main>
  );
}
