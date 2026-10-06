import { useState } from "react";
import { parseDecimal } from "../clinical/numbers";
import type { Tri } from "../clinical/types";

export function NumberField({
  label,
  unit,
  value,
  onChange,
  id,
}: {
  label: string;
  unit?: string;
  value: number | null;
  onChange: (value: number | null) => void;
  id: string;
}) {
  const [text, setText] = useState(value == null ? "" : String(value).replace(".", ","));
  return (
    <label className="field" htmlFor={id}>
      <span>
        {label}
        {unit ? <span className="unit"> ({unit})</span> : null}
      </span>
      <input
        id={id}
        inputMode="decimal"
        autoComplete="off"
        value={text}
        onChange={(event) => {
          const next = event.target.value;
          setText(next);
          if (!next.trim()) onChange(null);
          else {
            const parsed = parseDecimal(next);
            if (parsed != null) onChange(parsed);
          }
        }}
      />
    </label>
  );
}

const TRI_OPTIONS: { id: Tri; label: string }[] = [
  { id: "sim", label: "Sim" },
  { id: "nao", label: "Não" },
  { id: "nao_informado", label: "Não informado" },
];

export function TriField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: Tri;
  onChange: (value: Tri) => void;
}) {
  return (
    <div className="field">
      <span>{label}</span>
      <div className="tri" role="group" aria-label={label}>
        {TRI_OPTIONS.map((option) => (
          <button
            key={option.id}
            type="button"
            aria-pressed={value === option.id}
            onClick={() => onChange(option.id)}
          >
            {option.label}
          </button>
        ))}
      </div>
    </div>
  );
}

export function SelectField({
  label,
  value,
  onChange,
  options,
  id,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: { value: string; label: string }[];
  id: string;
}) {
  return (
    <label className="field" htmlFor={id}>
      <span>{label}</span>
      <select id={id} value={value} onChange={(event) => onChange(event.target.value)}>
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}
