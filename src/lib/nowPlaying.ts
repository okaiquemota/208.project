// "Tocando agora": validação dos dados do player, posição da música em tempo
// real, formato de tempo e a cor de fundo tirada da capa.

import type {
  MediaApp,
  MediaSession,
  NowPlayingInfo,
  PlayerAction,
} from '../../modules/media-keys/src/MediaKeys.types';

export type { MediaApp, MediaSession, NowPlayingInfo, PlayerAction };

const num = (v: unknown, fallback = 0) => (typeof v === 'number' && Number.isFinite(v) ? v : fallback);
const str = (v: unknown) => (typeof v === 'string' ? v : '');
const HEX_RE = /^#[0-9A-Fa-f]{6}$/;

/** Converte o que veio do Kotlin num objeto seguro (ou null se não der). */
export function parseNowPlaying(raw: unknown): NowPlayingInfo | null {
  if (typeof raw !== 'object' || raw === null) return null;
  const r = raw as Record<string, unknown>;
  const packageName = str(r.packageName);
  if (!packageName) return null;
  const artworkColor = str(r.artworkColor);
  const artworkUri = str(r.artworkUri);
  const remote = str(r.artworkRemoteUri);
  return {
    packageName,
    appName: str(r.appName) || packageName,
    title: str(r.title),
    artist: str(r.artist),
    album: str(r.album),
    durationMs: Math.max(0, num(r.durationMs)),
    positionMs: Math.max(0, num(r.positionMs)),
    capturedAt: num(r.capturedAt),
    playbackSpeed: num(r.playbackSpeed, 1) || 1,
    isPlaying: r.isPlaying === true,
    artworkUri: artworkUri || null,
    artworkColor: HEX_RE.test(artworkColor) ? artworkColor : null,
    artworkRemoteUri: /^https?:\/\//.test(remote) ? remote : null,
    customActions: parseActions(r.customActions),
  };
}

/** Botões extras do player: só os que têm código de ação. */
function parseActions(raw: unknown): PlayerAction[] {
  if (!Array.isArray(raw)) return [];
  const out: PlayerAction[] = [];
  for (const item of raw) {
    if (typeof item !== 'object' || item === null) continue;
    const a = item as Record<string, unknown>;
    const action = str(a.action);
    if (!action) continue;
    out.push({ action, name: str(a.name), iconUri: str(a.iconUri) || null });
  }
  return out;
}

/**
 * Posição atual da música. O player informa a posição num instante; enquanto
 * toca, somamos o tempo que passou desde então (assim a barra anda sozinha).
 */
export function currentPositionMs(np: NowPlayingInfo, nowMs: number): number {
  let pos = np.positionMs;
  if (np.isPlaying && np.capturedAt > 0) {
    pos += Math.max(0, nowMs - np.capturedAt) * np.playbackSpeed;
  }
  if (np.durationMs > 0) pos = Math.min(pos, np.durationMs);
  return Math.max(0, pos);
}

/** Fração tocada, de 0 a 1 (0 quando a duração é desconhecida). */
export function progressRatio(np: NowPlayingInfo, nowMs: number): number {
  if (np.durationMs <= 0) return 0;
  return Math.min(1, currentPositionMs(np, nowMs) / np.durationMs);
}

/** Tempo de música: "3:07", ou "1:02:03" acima de uma hora. */
export function formatTrackTime(ms: number): string {
  const total = Math.max(0, Math.floor(ms / 1000));
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  const ss = s < 10 ? `0${s}` : String(s);
  if (h > 0) return `${h}:${m < 10 ? `0${m}` : m}:${ss}`;
  return `${m}:${ss}`;
}

/** Tempo restante com sinal de menos: "-2:10". */
export function formatRemaining(np: NowPlayingInfo, nowMs: number): string {
  if (np.durationMs <= 0) return '';
  return `-${formatTrackTime(np.durationMs - currentPositionMs(np, nowMs))}`;
}

type Rgb = { r: number; g: number; b: number };

export function hexToRgb(hex: string): Rgb | null {
  if (!HEX_RE.test(hex)) return null;
  const n = parseInt(hex.slice(1), 16);
  return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 };
}

const toHex = ({ r, g, b }: Rgb) =>
  `#${[r, g, b].map((c) => Math.round(c).toString(16).padStart(2, '0')).join('')}`.toUpperCase();

/**
 * Cor de fundo do card a partir da cor média da capa: mantém o tom, mas
 * escurece (o texto branco precisa continuar legível) e evita cinza apagado.
 */
export function tintFromArtwork(hex: string | null, fallback = '#1B2A4A'): string {
  const rgb = hex ? hexToRgb(hex) : null;
  if (!rgb) return fallback;
  const max = Math.max(rgb.r, rgb.g, rgb.b);
  const min = Math.min(rgb.r, rgb.g, rgb.b);
  if (max < 8) return fallback; // capa quase toda preta: usa o padrão
  // Realça a saturação um pouco (capas costumam dar médias acinzentadas).
  const boost = (c: number) => min + (c - min) * 1.5;
  const sat = { r: boost(rgb.r), g: boost(rgb.g), b: boost(rgb.b) };
  const satMax = Math.max(sat.r, sat.g, sat.b) || 1;
  // O canal mais forte vai para 120 (escuro, mas com cor).
  const k = 120 / satMax;
  return toHex({
    r: Math.min(255, sat.r * k),
    g: Math.min(255, sat.g * k),
    b: Math.min(255, sat.b * k),
  });
}

/** Lista de apps de música vinda do Kotlin, validada. */
export function parseMediaApps(raw: unknown): MediaApp[] {
  if (!Array.isArray(raw)) return [];
  const seen = new Set<string>();
  const out: MediaApp[] = [];
  for (const item of raw) {
    if (typeof item !== 'object' || item === null) continue;
    const r = item as Record<string, unknown>;
    const packageName = str(r.packageName);
    if (!packageName || seen.has(packageName)) continue;
    seen.add(packageName);
    out.push({ packageName, label: str(r.label) || packageName });
  }
  return out;
}

/** Sessões de mídia vindas do Kotlin, validadas. */
export function parseSessions(raw: unknown): MediaSession[] {
  if (!Array.isArray(raw)) return [];
  const out: MediaSession[] = [];
  for (const item of raw) {
    if (typeof item !== 'object' || item === null) continue;
    const r = item as Record<string, unknown>;
    const packageName = str(r.packageName);
    if (!packageName) continue;
    out.push({
      packageName,
      appName: str(r.appName) || packageName,
      isPlaying: r.isPlaying === true,
      title: str(r.title),
      artist: str(r.artist),
    });
  }
  return out;
}

/**
 * Junta os apps de música instalados com as sessões abertas: cada app vem
 * com a sessão dele (se houver). Apps com sessão tocando aparecem primeiro.
 */
export function mergeMediaApps(
  apps: MediaApp[],
  sessions: MediaSession[],
): (MediaApp & { session: MediaSession | null })[] {
  const byPkg = new Map(sessions.map((s) => [s.packageName, s]));
  const list = apps.map((a) => ({ ...a, session: byPkg.get(a.packageName) ?? null }));
  // Sessões de apps que não apareceram na busca (ex.: navegador tocando áudio).
  for (const s of sessions) {
    if (!apps.some((a) => a.packageName === s.packageName)) {
      list.push({ packageName: s.packageName, label: s.appName, session: s });
    }
  }
  const rank = (x: { session: MediaSession | null }) => (x.session?.isPlaying ? 0 : x.session ? 1 : 2);
  return list.sort((a, b) => rank(a) - rank(b));
}
