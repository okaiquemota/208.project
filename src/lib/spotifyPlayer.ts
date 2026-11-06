// Player do Spotify pela conexão direta (App Remote): valida o estado que vem
// do Kotlin, converte para o formato do card do player e decide quando usar
// esta fonte no lugar da sessão de mídia do Android.

import { SPOTIFY_PACKAGE } from '../config/spotify';
import type { NowPlayingInfo, PlayerAction } from './nowPlaying';

export type SpotifyRepeat = 'off' | 'one' | 'all';

export type SpotifyPlayerState = {
  uri: string;
  title: string;
  artist: string;
  album: string;
  durationMs: number;
  positionMs: number;
  capturedAt: number;
  playbackSpeed: number;
  isPaused: boolean;
  shuffle: boolean;
  repeat: SpotifyRepeat;
  canSkipNext: boolean;
  canSkipPrev: boolean;
  canToggleShuffle: boolean;
  canRepeat: boolean;
  isEpisode: boolean;
  /** Está nas Curtidas (null = ainda conferindo). */
  liked: boolean | null;
  canLike: boolean;
  /** Capa grande em arquivo ("file://…"). */
  artworkUri: string | null;
  artworkColor: string | null;
  /** De onde está tocando ("Músicas Curtidas", "Daily Mix 1"…), se souber. */
  contextTitle: string | null;
  contextUri: string | null;
};

const str = (v: unknown) => (typeof v === 'string' ? v : '');
const num = (v: unknown) => (typeof v === 'number' && Number.isFinite(v) ? v : 0);
const bool = (v: unknown, fallback: boolean) => (typeof v === 'boolean' ? v : fallback);
const strOrNull = (v: unknown) => (typeof v === 'string' && v ? v : null);

/** Modo de repetir do SDK: 0 = desligado, 1 = repetir a música, 2 = repetir tudo. */
function parseRepeat(v: unknown): SpotifyRepeat {
  if (v === 1) return 'one';
  if (v === 2) return 'all';
  return 'off';
}

/** Converte o estado do Kotlin; null se não houver música. */
export function parseSpotifyPlayer(raw: unknown): SpotifyPlayerState | null {
  if (typeof raw !== 'object' || raw === null) return null;
  const r = raw as Record<string, unknown>;
  const title = str(r.title);
  const uri = str(r.uri);
  if (!uri && !title) return null;
  return {
    uri,
    title,
    artist: str(r.artist),
    album: str(r.album),
    durationMs: Math.max(0, num(r.durationMs)),
    positionMs: Math.max(0, num(r.positionMs)),
    capturedAt: num(r.capturedAt),
    playbackSpeed: num(r.playbackSpeed),
    isPaused: bool(r.isPaused, true),
    shuffle: bool(r.shuffle, false),
    repeat: parseRepeat(r.repeat),
    canSkipNext: bool(r.canSkipNext, true),
    canSkipPrev: bool(r.canSkipPrev, true),
    canToggleShuffle: bool(r.canToggleShuffle, true),
    canRepeat: bool(r.canRepeat, true),
    isEpisode: bool(r.isEpisode, false),
    liked: typeof r.liked === 'boolean' ? r.liked : null,
    canLike: bool(r.canLike, true),
    artworkUri: strOrNull(r.artworkUri),
    artworkColor: strOrNull(r.artworkColor),
    contextTitle: strOrNull(r.contextTitle),
    contextUri: strOrNull(r.contextUri),
  };
}

/** Botões do Spotify ao lado dos controles: curtir, aleatório e repetir. */
export function spotifyActions(s: SpotifyPlayerState): PlayerAction[] {
  const out: PlayerAction[] = [];
  if (s.canLike || s.liked) {
    out.push(
      s.liked
        ? { action: 'spotify:unlike', name: 'Remover das Músicas Curtidas', iconUri: null, glyph: 'heart-filled', active: true }
        : { action: 'spotify:like', name: 'Curtir', iconUri: null, glyph: 'heart', active: false },
    );
  }
  if (s.canToggleShuffle) {
    out.push({
      action: 'spotify:shuffle',
      name: s.shuffle ? 'Desligar aleatório' : 'Ligar aleatório',
      iconUri: null,
      glyph: 'shuffle',
      active: s.shuffle,
    });
  }
  if (s.canRepeat) {
    out.push({
      action: 'spotify:repeat',
      name: s.repeat === 'off' ? 'Repetir' : s.repeat === 'all' ? 'Repetir a música' : 'Desligar repetir',
      iconUri: null,
      glyph: s.repeat === 'one' ? 'repeat-one' : 'repeat',
      active: s.repeat !== 'off',
    });
  }
  return out;
}

/** Estado do Spotify no formato do card do player. */
export function spotifyToNowPlaying(s: SpotifyPlayerState): NowPlayingInfo {
  return {
    packageName: SPOTIFY_PACKAGE,
    appName: 'Spotify',
    title: s.title,
    artist: s.artist,
    album: s.album,
    durationMs: s.durationMs,
    positionMs: s.positionMs,
    capturedAt: s.capturedAt,
    playbackSpeed: s.isPaused ? 0 : s.playbackSpeed > 0 ? s.playbackSpeed : 1,
    isPlaying: !s.isPaused,
    artworkUri: s.artworkUri,
    artworkColor: s.artworkColor,
    artworkRemoteUri: null,
    customActions: spotifyActions(s),
    context: s.contextTitle,
  };
}

/**
 * Usa a conexão direta com o Spotify no player?
 * - sim, se nenhum outro player tem música carregada (ou sem acesso a notificações);
 * - sim, se o player atual do Android é o próprio Spotify;
 * - sim, se o Spotify está tocando e o outro player está parado;
 * - não, se outro app está tocando.
 */
export function shouldUseSpotify(media: NowPlayingInfo | null, spotify: SpotifyPlayerState | null): boolean {
  if (!spotify) return false;
  if (!media || (!media.title && !media.artist)) return true;
  if (media.packageName === SPOTIFY_PACKAGE) return true;
  return !spotify.isPaused && !media.isPlaying;
}

/** Tira o prefixo "spotify:" das ações dos botões (null se não for do Spotify). */
export function spotifyCommandOf(action: string) {
  const cmd = action.startsWith('spotify:') ? action.slice('spotify:'.length) : null;
  return cmd === 'like' || cmd === 'unlike' || cmd === 'shuffle' || cmd === 'repeat' ? cmd : null;
}
