import { useState } from "react";
import type { EngineOutput } from "../clinical/engine";
import { SOURCES } from "../clinical/clinicalSources";
import { CATEGORY_LABEL } from "../clinical/types";
import { formatMg } from "../clinical/numbers";

export function Results({ output }: { output: EngineOutput }) {
  const [copied, setCopied] = useState(false);
  const { stratification, targets, treatment, issues, bmi } = output;
  const category = stratification.category;
  const prevent = stratification.prevent;

  async function copySummary() {
    try {
      await navigator.clipboard.writeText(output.summaryText);
      setCopied(true);
      return;
    } catch {
      const area = document.createElement("textarea");
      area.value = output.summaryText;
      area.setAttribute("readonly", "");
      area.style.position = "fixed";
      area.style.left = "-9999px";
      document.body.appendChild(area);
      area.select();
      const ok = document.execCommand("copy");
      area.remove();
      setCopied(ok);
    }
  }

  return (
    <section className="card results" id="resultado" aria-live="polite">
      <h2>Resultado</h2>
      {stratification.status === "incompleta" || stratification.status === "fora_de_escopo" ? (
        <p className="note">{stratification.headline}</p>
      ) : null}
      <div className="result-grid">
        <article className={`metric ${category ?? ""} ${stratification.status === "incompleta" ? "incompleta" : ""}`}>
          <strong>Risco cardiovascular</strong>
          <p>{stratification.headline}</p>
          {prevent?.applicable && prevent.percent != null ? (
            <p>
              {`PREVENT-ASCVD em 10 anos${prevent.model ? `, modelo ${prevent.model}` : ""}: ${prevent.percent.toFixed(1).replace(".", ",")}%`}
              {stratification.preventApplied ? "" : " — exibido, sem classificar este ramo"}
            </p>
          ) : (
            <p>Percentual PREVENT não aplicável a este caso.</p>
          )}
        </article>
        <article className="metric">
          <strong>Meta de LDL-c</strong>
          {targets ? (
            <>
              <p>{targets.ldlGoalText}</p>
              <p>LDL-c atual: {targets.ldlCurrent == null ? "não informado" : `${formatMg(targets.ldlCurrent)} mg/dL`}</p>
              <p>
                {targets.ldlAtGoal == null
                  ? "Situação em relação à meta: não avaliável."
                  : targets.ldlAtGoal
                    ? "Situação: abaixo da meta."
                    : "Situação: meta não atingida."}
              </p>
            </>
          ) : (
            <p>A meta depende de uma categoria sustentada pelos dados.</p>
          )}
        </article>
        <article className="metric">
          <strong>Estratégia de tratamento</strong>
          <p>{treatment.action}</p>
          <p>{treatment.summary}</p>
        </article>
      </div>

      {targets ? (
        <div>
          <p>{targets.nonHdlGoalText}{targets.nonHdl == null ? "" : ` Valor atual: ${formatMg(targets.nonHdl)} mg/dL.`}</p>
          <p>
            Redução percentual desejada: ≥ {targets.reductionGoalPercent}%.{" "}
            {targets.reductionObservedPercent == null
              ? "A redução alcançada não pode ser calculada sem LDL-c basal."
              : `Redução observada: ${targets.reductionObservedPercent.toFixed(1).replace(".", ",")}%, ${targets.reductionAtGoal ? "atingida" : "não atingida"}.`}
          </p>
          {targets.additionalReductionLabel ? <p>{targets.additionalReductionLabel}</p> : null}
          {targets.apob != null ? (
            <p>
              {targets.apobGoalText}. ApoB informada: {formatMg(targets.apob)} mg/dL, meta secundária{" "}
              {targets.apobAtGoal ? "atingida" : "não atingida"}.
            </p>
          ) : (
            <p>{targets.apobGoalText}. ApoB não informada.</p>
          )}
        </div>
      ) : null}

      {bmi != null ? <p>IMC calculado: {bmi.toFixed(1).replace(".", ",")} kg/m². Não entra no PREVENT-ASCVD.</p> : null}

      {treatment.options.length > 0 ? (
        <div>
          <h3>Opções que podem compor a estratégia</h3>
          <ul>
            {treatment.options.map((option) => (
              <li key={option.title}>
                <strong>{option.title}.</strong> {option.detail} ({SOURCES[option.sourceId]?.short})
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      <div>
        <h3>Estilo de vida</h3>
        <ul>
          {treatment.lifestyle.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </div>

      {treatment.alerts.length > 0 ? (
        <div className="note">
          <strong>Alertas deste caso</strong>
          <ul>
            {treatment.alerts.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </div>
      ) : null}

      {stratification.missing.length > 0 ? (
        <div className="missing">
          <strong>Dados que faltam</strong>
          <ul>
            {stratification.missing.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </div>
      ) : null}

      {issues.length > 0 ? (
        <ul>
          {issues.map((issue) => (
            <li key={issue.message}>{issue.message}</li>
          ))}
        </ul>
      ) : null}

      <div>
        <h3>Acompanhamento</h3>
        <ul>
          {treatment.followUp.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </div>

      <details>
        <summary>Como chegamos a este resultado?</summary>
        <ol>
          {stratification.steps.map((step) => (
            <li key={step}>{step}</li>
          ))}
          {stratification.findings.map((finding) => (
            <li key={finding.text}>
              {CATEGORY_LABEL[finding.category]}: {finding.text} Fonte: {SOURCES[finding.sourceId]?.detail}
            </li>
          ))}
          {stratification.caveats.map((item) => (
            <li key={item}>{item}</li>
          ))}
          {prevent?.reasons.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ol>
      </details>

      <div className="actions no-print">
        <button type="button" className="primary" onClick={() => void copySummary()}>
          {copied ? "Resumo copiado" : "Copiar resumo"}
        </button>
        <button type="button" onClick={() => window.print()}>Imprimir</button>
        <a href="#resultado">Ir ao resultado</a>
      </div>
    </section>
  );
}
