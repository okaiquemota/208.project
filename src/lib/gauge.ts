// Geometria do mostrador em arco do velocímetro.
//
// O arco tem 240°: começa embaixo à esquerda (0 km/h) e termina embaixo à
// direita (200 km/h), deixando a parte de baixo aberta para a direção.
// Ângulos aqui são "de relógio": 0° aponta para cima e cresce no sentido horário.

export const GAUGE_START_DEG = -120;
export const GAUGE_END_DEG = 120;
export const GAUGE_SWEEP_DEG = GAUGE_END_DEG - GAUGE_START_DEG;

export type Point = { x: number; y: number };

/** Limita um valor ao intervalo [min, max]. */
export const clamp = (v: number, min: number, max: number) => Math.min(max, Math.max(min, v));

/** Ângulo do ponteiro para uma velocidade (fora da escala fica no limite). */
export function speedToAngle(kmh: number, maxKmh: number): number {
  const ratio = maxKmh > 0 ? clamp(kmh / maxKmh, 0, 1) : 0;
  return GAUGE_START_DEG + ratio * GAUGE_SWEEP_DEG;
}

/** Ponto na circunferência para um ângulo "de relógio". */
export function polarToCartesian(cx: number, cy: number, r: number, angleDeg: number): Point {
  const rad = ((angleDeg - 90) * Math.PI) / 180;
  return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
}

/** Caminho SVG ("d") de um arco entre dois ângulos, no sentido horário. */
export function describeArc(
  cx: number,
  cy: number,
  r: number,
  startDeg: number,
  endDeg: number,
): string {
  if (endDeg - startDeg <= 0.01) return '';
  const start = polarToCartesian(cx, cy, r, startDeg);
  const end = polarToCartesian(cx, cy, r, endDeg);
  const largeArc = endDeg - startDeg > 180 ? 1 : 0;
  const f = (n: number) => n.toFixed(2);
  return `M ${f(start.x)} ${f(start.y)} A ${f(r)} ${f(r)} 0 ${largeArc} 1 ${f(end.x)} ${f(end.y)}`;
}

/** Marcações da escala: de `step` em `step` km/h, de 0 até o máximo. */
export function gaugeTicks(maxKmh: number, step: number): number[] {
  const ticks: number[] = [];
  for (let v = 0; v <= maxKmh + 1e-9; v += step) ticks.push(v);
  return ticks;
}
