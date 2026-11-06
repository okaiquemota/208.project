import type { NowPlayingInfo } from '../src/lib/nowPlaying';
import {
  parseSpotifyPlayer,
  shouldUseSpotify,
  spotifyActions,
  spotifyCommandOf,
  spotifyToNowPlaying,
} from '../src/lib/spotifyPlayer';

const raw = {
  uri: 'spotify:track:1',
  title: 'Céu Aberto',
  artist: 'Banda A, Banda B',
  album: 'Viagem',
  durationMs: 214000,
  positionMs: 83000,
  capturedAt: 1000,
  playbackSpeed: 1,
  isPaused: false,
  shuffle: true,
  repeat: 2,
  canSkipNext: true,
  canSkipPrev: true,
  canToggleShuffle: true,
  canRepeat: true,
  isEpisode: false,
  liked: true,
  canLike: true,
  artworkUri: 'file:///capa.jpg',
  artworkColor: '#7A4A8C',
  contextTitle: 'Músicas Curtidas',
  contextUri: 'spotify:user:x:collection',
};

const media = (over: Partial<NowPlayingInfo> = {}): NowPlayingInfo => ({
  packageName: 'com.google.android.apps.youtube.music',
  appName: 'YT Music',
  title: 'Outra',
  artist: 'X',
  album: '',
  durationMs: 1,
  positionMs: 0,
  capturedAt: 0,
  playbackSpeed: 1,
  isPlaying: true,
  artworkUri: null,
  artworkColor: null,
  artworkRemoteUri: null,
  customActions: [],
  ...over,
});

describe('parseSpotifyPlayer', () => {
  it('lê o estado completo', () => {
    const s = parseSpotifyPlayer(raw)!;
    expect(s.title).toBe('Céu Aberto');
    expect(s.repeat).toBe('all');
    expect(s.liked).toBe(true);
    expect(s.artworkUri).toBe('file:///capa.jpg');
  });

  it('sem música ou lixo vira null', () => {
    expect(parseSpotifyPlayer(null)).toBeNull();
    expect(parseSpotifyPlayer('x')).toBeNull();
    expect(parseSpotifyPlayer({ title: '', uri: '' })).toBeNull();
  });

  it('valores faltando ganham padrões seguros', () => {
    const s = parseSpotifyPlayer({ uri: 'spotify:track:2', liked: 'sim', repeat: 9, durationMs: -5 })!;
    expect(s.isPaused).toBe(true);
    expect(s.liked).toBeNull();
    expect(s.repeat).toBe('off');
    expect(s.durationMs).toBe(0);
    expect(s.artworkUri).toBeNull();
  });
});

describe('spotifyActions', () => {
  it('coração aceso, aleatório e repetir ligados', () => {
    const a = spotifyActions(parseSpotifyPlayer(raw)!);
    expect(a.map((x) => x.action)).toEqual(['spotify:unlike', 'spotify:shuffle', 'spotify:repeat']);
    expect(a.every((x) => x.active)).toBe(true);
    expect(a[0]?.glyph).toBe('heart-filled');
  });

  it('desligados e repetir uma música', () => {
    const a = spotifyActions(parseSpotifyPlayer({ ...raw, liked: false, shuffle: false, repeat: 1 })!);
    expect(a[0]).toMatchObject({ action: 'spotify:like', glyph: 'heart', active: false });
    expect(a[1]?.active).toBe(false);
    expect(a[2]).toMatchObject({ glyph: 'repeat-one', active: true });
  });

  it('esconde o que o Spotify não deixa (ex.: anúncio)', () => {
    const a = spotifyActions(
      parseSpotifyPlayer({ ...raw, liked: false, canLike: false, canToggleShuffle: false, canRepeat: false })!,
    );
    expect(a).toEqual([]);
  });
});

describe('spotifyToNowPlaying', () => {
  it('converte para o card do player', () => {
    const np = spotifyToNowPlaying(parseSpotifyPlayer(raw)!);
    expect(np.packageName).toBe('com.spotify.music');
    expect(np.appName).toBe('Spotify');
    expect(np.isPlaying).toBe(true);
    expect(np.playbackSpeed).toBe(1);
    expect(np.customActions).toHaveLength(3);
    expect(np.context).toBe('Músicas Curtidas');
  });

  it('pausado: velocidade 0 (a barra para)', () => {
    const np = spotifyToNowPlaying(parseSpotifyPlayer({ ...raw, isPaused: true })!);
    expect(np.isPlaying).toBe(false);
    expect(np.playbackSpeed).toBe(0);
  });
});

describe('shouldUseSpotify', () => {
  const sp = parseSpotifyPlayer(raw)!;
  const paused = parseSpotifyPlayer({ ...raw, isPaused: true })!;

  it('sem Spotify conectado: não', () => {
    expect(shouldUseSpotify(media(), null)).toBe(false);
  });
  it('sem outro player (ou sem acesso a notificações): sim', () => {
    expect(shouldUseSpotify(null, paused)).toBe(true);
    expect(shouldUseSpotify(media({ title: '', artist: '' }), paused)).toBe(true);
  });
  it('o player do Android já é o Spotify: sim', () => {
    expect(shouldUseSpotify(media({ packageName: 'com.spotify.music' }), paused)).toBe(true);
  });
  it('outro app tocando: não', () => {
    expect(shouldUseSpotify(media({ isPlaying: true }), sp)).toBe(false);
  });
  it('Spotify tocando e o outro parado: sim', () => {
    expect(shouldUseSpotify(media({ isPlaying: false }), sp)).toBe(true);
    expect(shouldUseSpotify(media({ isPlaying: false }), paused)).toBe(false);
  });
});

describe('spotifyCommandOf', () => {
  it('só aceita os botões do Spotify', () => {
    expect(spotifyCommandOf('spotify:like')).toBe('like');
    expect(spotifyCommandOf('spotify:repeat')).toBe('repeat');
    expect(spotifyCommandOf('spotify:apagar')).toBeNull();
    expect(spotifyCommandOf('com.spotify.music.THUMBS_UP')).toBeNull();
  });
});
