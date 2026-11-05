// Formatação dos números da tela (padrão brasileiro: vírgula decimal).

import { pad2 } from './datetime';

/** Número com casas decimais fixas e vírgula: 12.345 → "12,3". */
export function formatDecimal(value: number, digits = 1): string {
  const safe = Number.isFinite(value) ? value : 0;
  return safe.toFixed(digits).replace('.', ',');
}

/** Metros → km com 1 casa ("12,3"). Abaixo de 100 km usa 1 casa; acima, sem casas. */
export function formatKm(meters: number): string {
  const km = Math.max(0, meters) / 1000;
  return km >= 100 ? String(Math.floor(km)) : formatDecimal(Math.floor(km * 10) / 10, 1);
}

/** Velocidade arredondada, sem casas ("87"). */
export function formatKmh(kmh: number): string {
  if (!Number.isFinite(kmh) || kmh < 0) return '0';
  return String(Math.round(kmh));
}

/** Duração: "12:05" (abaixo de 1 hora) ou "1:02:03". */
export function formatDuration(ms: number): string {
  const totalS = Math.max(0, Math.floor(ms / 1000));
  const h = Math.floor(totalS / 3600);
  const m = Math.floor((totalS % 3600) / 60);
  const s = totalS % 60;
  return h > 0 ? `${h}:${pad2(m)}:${pad2(s)}` : `${pad2(m)}:${pad2(s)}`;
}

/** Bateria de 0 a 1 → "78%". Valor inválido (-1 quando indisponível) vira "--%". */
export function formatBattery(level: number): string {
  if (!Number.isFinite(level) || level < 0) return '--%';
  return `${Math.round(Math.min(1, level) * 100)}%`;
}
