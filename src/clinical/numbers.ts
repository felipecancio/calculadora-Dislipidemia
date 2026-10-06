/** Aceita vírgula ou ponto. Vazio não vira zero. */
export function parseDecimal(raw: string): number | null {
  const trimmed = raw.trim().replace(/\s/g, "");
  if (!trimmed) return null;
  const normalized = trimmed.replace(",", ".");
  if (!/^[+-]?\d+(\.\d+)?$/.test(normalized)) return null;
  const value = Number(normalized);
  return Number.isFinite(value) ? value : null;
}

export function roundHalfUp(value: number, digits: number): number {
  const sign = value < 0 ? -1 : 1;
  const factor = 10 ** digits;
  let scaled = Math.abs(value) * factor;
  scaled = scaled + 0.5 + Math.sqrt(Number.EPSILON);
  scaled = Math.trunc(scaled);
  return (scaled / factor) * sign;
}

export function formatMg(value: number): string {
  const rounded = roundHalfUp(value, 1);
  const text = Number.isInteger(rounded) ? String(rounded) : rounded.toFixed(1);
  return text.replace(".", ",");
}

export function bmiKgM2(weightKg: number | null, heightCm: number | null): number | null {
  if (weightKg == null || heightCm == null || heightCm <= 0 || weightKg <= 0) return null;
  const meters = heightCm / 100;
  return weightKg / (meters * meters);
}
