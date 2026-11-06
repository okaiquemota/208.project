// Cálculos dos widgets do painel (sem React, com teste).

/**
 * Força do sinal do GPS em barrinhas (0 a 4), como o sinal do celular.
 * Baseado na precisão: quanto menor o raio de erro, mais barras.
 */
export function gpsSignalBars(accuracyM: number | null): number {
  if (accuracyM === null || !Number.isFinite(accuracyM) || accuracyM < 0) return 0;
  if (accuracyM <= 5) return 4;
  if (accuracyM <= 12) return 3;
  if (accuracyM <= 35) return 2;
  return 1;
}

export type LedSegment = {
  /** Aceso (até a velocidade atual). */
  on: boolean;
  /** Faixa acima do limite de alerta (pinta de laranja/vermelho). */
  alert: boolean;
};

/**
 * Barra de "LEDs" do velocímetro: `count` segmentos de 0 até `maxKmh`.
 * Acende os segmentos até a velocidade atual (pelo menos um, se andando).
 */
export function speedLeds(
  speedKmh: number | null,
  maxKmh: number,
  alertKmh: number,
  count: number,
): LedSegment[] {
  const v = speedKmh !== null && Number.isFinite(speedKmh) ? Math.max(0, speedKmh) : 0;
  const lit = v <= 0 ? 0 : Math.max(1, Math.min(count, Math.round((v / maxKmh) * count)));
  return Array.from({ length: count }, (_, i) => ({
    on: i < lit,
    // O segmento i representa a faixa que termina em (i+1)/count do máximo.
    alert: ((i + 1) / count) * maxKmh > alertKmh,
  }));
}

/** Volume em segmentos para a barra (ex.: 9 de 15 → 9 acesos de 15). */
export function volumeSegments(current: number, max: number, count: number): boolean[] {
  const ratio = max > 0 ? Math.max(0, Math.min(1, current / max)) : 0;
  const lit = Math.round(ratio * count);
  return Array.from({ length: count }, (_, i) => i < lit);
}

/**
 * Mostrador do velocímetro com `count` marcações de 0 a `maxKmh`.
 * Devolve quantas acendem (até a velocidade atual) e a partir de qual
 * marcação a cor é de alerta (as que passam do limite).
 */
export function dialTicks(
  speedKmh: number | null,
  maxKmh: number,
  alertKmh: number,
  count: number,
): { lit: number; alertFrom: number } {
  const stepKmh = maxKmh / (count - 1);
  const v = speedKmh !== null && Number.isFinite(speedKmh) ? Math.max(0, speedKmh) : 0;
  const lit = v < 0.5 ? 0 : Math.min(count, Math.round(v / stepKmh) + 1);
  const alertFrom = Number.isFinite(alertKmh) ? Math.floor(alertKmh / stepKmh + 1e-9) + 1 : Number.POSITIVE_INFINITY;
  return { lit, alertFrom };
}
