import {
  currentPositionMs,
  formatRemaining,
  formatTrackTime,
  hexToRgb,
  type NowPlayingInfo,
  parseNowPlaying,
  progressRatio,
  tintFromArtwork,
} from '../src/lib/nowPlaying';

const base: NowPlayingInfo = {
  packageName: 'com.spotify.music',
  appName: 'Spotify',
  title: 'Música',
  artist: 'Artista',
  album: 'Álbum',
  durationMs: 200_000,
  positionMs: 60_000,
  capturedAt: 1_000_000,
  playbackSpeed: 1,
  isPlaying: true,
  artworkUri: 'file:///capa.jpg',
  artworkColor: '#336699',
};

describe('tocando agora: dados do player', () => {
  it('aceita os dados do Kotlin', () => {
    expect(parseNowPlaying({ ...base })).toEqual(base);
  });

  it('sem pacote não vale', () => {
    expect(parseNowPlaying({ ...base, packageName: '' })).toBeNull();
    expect(parseNowPlaying(null)).toBeNull();
    expect(parseNowPlaying('x')).toBeNull();
  });

  it('corrige campos estranhos', () => {
    const np = parseNowPlaying({
      packageName: 'com.x.y',
      durationMs: 'abc',
      positionMs: -5,
      playbackSpeed: 0,
      isPlaying: 'sim',
      artworkUri: '',
      artworkColor: 'azul',
    });
    expect(np).toMatchObject({
      appName: 'com.x.y',
      title: '',
      durationMs: 0,
      positionMs: 0,
      playbackSpeed: 1,
      isPlaying: false,
      artworkUri: null,
      artworkColor: null,
    });
  });
});

describe('tocando agora: posição da música', () => {
  it('tocando, a posição anda com o relógio', () => {
    expect(currentPositionMs(base, 1_000_000)).toBe(60_000);
    expect(currentPositionMs(base, 1_005_000)).toBe(65_000);
  });

  it('pausado, a posição fica parada', () => {
    expect(currentPositionMs({ ...base, isPlaying: false }, 1_005_000)).toBe(60_000);
  });

  it('não passa do fim da música', () => {
    expect(currentPositionMs(base, 1_000_000 + 999_000)).toBe(200_000);
    expect(progressRatio(base, 1_000_000 + 999_000)).toBe(1);
  });

  it('respeita a velocidade (podcast em 1,5x)', () => {
    expect(currentPositionMs({ ...base, playbackSpeed: 1.5 }, 1_002_000)).toBe(63_000);
  });

  it('fração tocada', () => {
    expect(progressRatio(base, 1_000_000)).toBeCloseTo(0.3);
    expect(progressRatio({ ...base, durationMs: 0 }, 1_000_000)).toBe(0);
  });
});

describe('tocando agora: textos de tempo', () => {
  it('formato m:ss e h:mm:ss', () => {
    expect(formatTrackTime(0)).toBe('0:00');
    expect(formatTrackTime(7_000)).toBe('0:07');
    expect(formatTrackTime(187_000)).toBe('3:07');
    expect(formatTrackTime(3_723_000)).toBe('1:02:03');
  });

  it('tempo restante', () => {
    expect(formatRemaining(base, 1_000_000)).toBe('-2:20');
    expect(formatRemaining({ ...base, durationMs: 0 }, 1_000_000)).toBe('');
  });
});

describe('tocando agora: cor do fundo pela capa', () => {
  it('lê hexadecimal', () => {
    expect(hexToRgb('#FF8000')).toEqual({ r: 255, g: 128, b: 0 });
    expect(hexToRgb('laranja')).toBeNull();
  });

  it('escurece mantendo o tom', () => {
    const t = hexToRgb(tintFromArtwork('#FF8000'))!;
    expect(Math.max(t.r, t.g, t.b)).toBe(120);
    expect(t.r).toBeGreaterThan(t.g);
    expect(t.g).toBeGreaterThan(t.b);
  });

  it('capa clara não deixa o fundo claro (texto branco continua legível)', () => {
    const t = hexToRgb(tintFromArtwork('#F0F0E0'))!;
    expect(Math.max(t.r, t.g, t.b)).toBeLessThanOrEqual(120);
  });

  it('sem cor ou capa preta usa o padrão', () => {
    expect(tintFromArtwork(null)).toBe('#1B2A4A');
    expect(tintFromArtwork('#000000')).toBe('#1B2A4A');
    expect(tintFromArtwork('xx', '#111111')).toBe('#111111');
  });
});
