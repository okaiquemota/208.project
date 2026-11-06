// Próxima curva, lida da notificação do app de navegação (Waze, Maps…).
//
// Cada app escreve a notificação de um jeito ("300 m" no título e a rua no
// texto, ou "Vire à direita em 300 m"…). Em vez de depender de um formato,
// procuramos a distância em qualquer campo e usamos o resto como instrução.
// Notificação sem distância (ex.: "Waze em execução") não é curva: some.

export type Maneuver = 'esquerda' | 'direita' | 'retorno' | 'rotatoria' | 'chegada' | 'siga';

export type NavInfo = {
  key: string;
  packageName: string;
  appName: string;
  /** Distância até a manobra, pronta para mostrar ("300 m", "1,2 km"). */
  distance: string;
  /** Distância em metros (para ordenar/alertar). */
  distanceM: number;
  /** O que fazer ("Vire à direita na R. Augusta"). */
  instruction: string;
  /** Só a rua ("R. Augusta"), se der para separar; senão a instrução inteira. */
  street: string;
  /** Linha extra (tempo, distância total, chegada), se houver. */
  detail: string;
  maneuver: Maneuver;
  /** Seta desenhada pelo próprio app (PNG), se houver. */
  iconUri: string | null;
  postedAt: number;
};

const DIST_RE = /(\d+(?:[.,]\d+)?)\s?(km|m|mi|ft)(?![a-zà-ú])/i;
const METERS: Record<string, number> = { km: 1000, m: 1, mi: 1609.34, ft: 0.3048 };

const str = (v: unknown) => (typeof v === 'string' ? v.trim() : '');
const num = (v: unknown) => (typeof v === 'number' && Number.isFinite(v) ? v : 0);

/** "1.2" ou "1,2" → número; mostra com vírgula, como no Brasil. */
function readDistance(text: string): { label: string; meters: number; match: string } | null {
  const m = DIST_RE.exec(text);
  if (!m || m[1] === undefined || m[2] === undefined) return null;
  const value = Number(m[1].replace(',', '.'));
  if (!Number.isFinite(value)) return null;
  const unit = m[2].toLowerCase();
  return { label: `${m[1].replace('.', ',')} ${unit}`, meters: value * (METERS[unit] ?? 1), match: m[0] };
}

/** Tira a distância e as palavrinhas em volta ("em", "in", "daqui a"…). */
function stripDistance(text: string, match: string): string {
  return text
    .replace(match, ' ')
    .replace(/\b(em|in|daqui a|após|after)\s*(?=[,.\-–·]|$)/gi, ' ')
    .replace(/^\s*(em|in|daqui a|após|after)\b/i, ' ')
    .replace(/\s{2,}/g, ' ')
    .replace(/^[\s,.\-–·]+|[\s,.\-–·]+$/g, '')
    .trim();
}

const hasWords = (s: string) => (s.match(/[a-zà-ú]/gi) ?? []).length >= 3;

/** Adivinha o desenho da seta pelo texto (quando o app não manda a seta). */
export function guessManeuver(instruction: string): Maneuver {
  const t = instruction.toLowerCase();
  if (/retorno|meia[- ]volta|u-turn|make a u/.test(t)) return 'retorno';
  if (/rotat[óo]ria|roundabout|rotunda|bal[ãa]o/.test(t)) return 'rotatoria';
  if (/chegou|chegada|destino|arriv|destination/.test(t)) return 'chegada';
  if (/esquerda|\bleft\b/.test(t)) return 'esquerda';
  if (/direita|\bright\b/.test(t)) return 'direita';
  return 'siga';
}

/** Separa a rua da instrução ("Vire à direita na R. Augusta" → "R. Augusta"). */
export function streetOf(instruction: string): string {
  const m = /\b(?:na|no|nas|nos|pela|pelo|para a|para o|em direção (?:à|ao|a)|sentido|onto|toward|towards|on)\s+(.+)$/i.exec(
    instruction,
  );
  const street = m?.[1]?.trim();
  return street && /[a-zà-ú]{2}/i.test(street) ? street : instruction;
}

export type TripSummary = {
  /** Hora de chegada ("23:03"). */
  arrival: string | null;
  /** Minutos até chegar. */
  minutes: number | null;
  /** Distância que falta ("19 km"). */
  distance: string | null;
};

const pad2 = (n: number) => String(n).padStart(2, '0');

/**
 * Resumo da viagem a partir da linha extra da notificação
 * ("26 min · 19 km · 23:03"). Sem a hora de chegada, calcula pelos minutos.
 */
export function parseTripSummary(detail: string, nowMs: number): TripSummary | null {
  if (!detail) return null;
  const hm = /(?:(\d+)\s*h(?:oras?|r)?\s*)?(\d+)\s*min/i.exec(detail);
  const onlyH = hm ? null : /(\d+)\s*h(?:oras?|r)?\b/i.exec(detail);
  const minutes = hm ? Number(hm[1] ?? 0) * 60 + Number(hm[2]) : onlyH ? Number(onlyH[1]) * 60 : null;
  const dist = readDistance(detail.replace(/\d+\s*min/gi, ' '));
  const clock = /\b([01]?\d|2[0-3]):([0-5]\d)\b/.exec(detail);
  let arrival = clock ? `${pad2(Number(clock[1]))}:${clock[2]}` : null;
  if (!arrival && minutes !== null) {
    const at = new Date(nowMs + minutes * 60_000);
    arrival = `${pad2(at.getHours())}:${pad2(at.getMinutes())}`;
  }
  if (arrival === null && minutes === null && !dist) return null;
  return { arrival, minutes, distance: dist?.label ?? null };
}

/** Minutos para mostrar: "26" (min) ou "1:05" (h). */
export function formatEta(minutes: number): { value: string; unit: string } {
  if (minutes < 60) return { value: String(minutes), unit: 'min' };
  return { value: `${Math.floor(minutes / 60)}:${pad2(minutes % 60)}`, unit: 'h' };
}

/** Lê uma notificação de navegação; null se ela não tiver uma curva. */
export function parseNavEntry(raw: unknown): NavInfo | null {
  if (typeof raw !== 'object' || raw === null) return null;
  const r = raw as Record<string, unknown>;
  const key = str(r.key);
  if (!key) return null;
  const fields = [str(r.title), str(r.text), str(r.bigText)].filter((f, i, all) => f && all.indexOf(f) === i);

  const at = fields.findIndex((f) => readDistance(f) !== null);
  const field = fields[at];
  const dist = field !== undefined ? readDistance(field) : null;
  if (!field || !dist) return null;

  // Instrução: o resto do campo da distância, ou o outro campo com texto.
  const rest = stripDistance(field, dist.match);
  const others = fields.filter((_, i) => i !== at).map((f) => {
    const d = readDistance(f);
    return d ? stripDistance(f, d.match) : f;
  });
  const instruction = (hasWords(rest) ? [rest, ...others] : others).find(hasWords) ?? rest;

  return {
    key,
    packageName: str(r.packageName),
    appName: str(r.appName) || str(r.packageName),
    distance: dist.label,
    distanceM: Math.round(dist.meters),
    instruction,
    street: streetOf(instruction),
    detail: str(r.subText),
    maneuver: guessManeuver(instruction),
    iconUri: str(r.iconUri) || null,
    postedAt: num(r.postedAt),
  };
}

/** Das notificações de navegação (mais recente primeiro), a primeira com curva. */
export function pickNavigation(raw: unknown): NavInfo | null {
  if (!Array.isArray(raw)) return null;
  for (const entry of raw) {
    const nav = parseNavEntry(entry);
    if (nav) return nav;
  }
  return null;
}
