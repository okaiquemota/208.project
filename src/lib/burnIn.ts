// Proteção contra burn-in (marca permanente em tela AMOLED).
//
// Os números e bordas ficam sempre no mesmo lugar por horas. A cada minuto
// deslocamos a interface inteira 1–2 dp, percorrendo esta lista em ciclo.
// O movimento é pequeno demais para incomodar, mas espalha o desgaste dos pixels.

export type Offset = { x: number; y: number };

/** Um anel de 1 dp e depois um anel de 2 dp em volta da posição original. */
export const BURN_IN_OFFSETS: readonly Offset[] = [
  { x: 0, y: 0 },
  { x: 1, y: 0 },
  { x: 1, y: 1 },
  { x: 0, y: 1 },
  { x: -1, y: 1 },
  { x: -1, y: 0 },
  { x: -1, y: -1 },
  { x: 0, y: -1 },
  { x: 1, y: -1 },
  { x: 2, y: 0 },
  { x: 2, y: 2 },
  { x: 0, y: 2 },
  { x: -2, y: 2 },
  { x: -2, y: 0 },
  { x: -2, y: -2 },
  { x: 0, y: -2 },
  { x: 2, y: -2 },
];

/** Maior deslocamento possível, para reservar margem no layout. */
export const BURN_IN_MAX_SHIFT = 2;

/** Intervalo entre deslocamentos. */
export const BURN_IN_INTERVAL_MS = 60_000;

/** Deslocamento do passo `step` (0, 1, 2…), voltando ao início no fim da lista. */
export function burnInOffset(step: number): Offset {
  const n = BURN_IN_OFFSETS.length;
  const i = ((Math.floor(step) % n) + n) % n;
  return BURN_IN_OFFSETS[i] as Offset;
}
