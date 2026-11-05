/** Volume da música: passo atual e passo máximo (no M51 costuma ir de 0 a 15). */
export type VolumeInfo = {
  current: number;
  max: number;
};

/**
 * O que está tocando agora, lido da sessão de mídia do player.
 * Só existe com o "Acesso a notificações" liberado.
 */
export type NowPlayingInfo = {
  /** Pacote do player, ex.: "com.spotify.music". */
  packageName: string;
  /** Nome do player, ex.: "Spotify". */
  appName: string;
  title: string;
  artist: string;
  album: string;
  /** Duração da música em ms (0 se o player não informar). */
  durationMs: number;
  /** Posição em ms no instante `capturedAt`. */
  positionMs: number;
  /** Horário (Date.now) em que a posição foi lida. */
  capturedAt: number;
  playbackSpeed: number;
  isPlaying: boolean;
  /** Capa salva em arquivo ("file://…"), ou null. */
  artworkUri: string | null;
  /** Cor média da capa ("#RRGGBB"), ou null. */
  artworkColor: string | null;
  /** Link da capa em alta resolução (https), se o player informar. */
  artworkRemoteUri: string | null;
  /** Botões extras do player (no Spotify: curtir, aleatório, repetir…). */
  customActions: PlayerAction[];
};

/** Botão extra oferecido pelo próprio player. */
export type PlayerAction = {
  /** Código interno da ação (mandado de volta em sendCustomAction). */
  action: string;
  /** Nome legível, ex.: "Adicionar às Músicas Curtidas". */
  name: string;
  /** Ícone do próprio player, em PNG ("file://…"), ou null. */
  iconUri: string | null;
};

export type MediaKeysEvents = {
  onNowPlayingChange: (event: { nowPlaying: NowPlayingInfo | null }) => void;
};
