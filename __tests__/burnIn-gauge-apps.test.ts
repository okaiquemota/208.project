import { BURN_IN_MAX_SHIFT, BURN_IN_OFFSETS, burnInOffset } from '../src/lib/burnIn';
import { isValidPackageName, parseCarApps, pickDockApps } from '../src/lib/carApps';
import {
  describeArc,
  GAUGE_END_DEG,
  GAUGE_START_DEG,
  gaugeTicks,
  polarToCartesian,
  speedToAngle,
} from '../src/lib/gauge';

describe('anti burn-in', () => {
  it('começa na posição original', () => {
    expect(burnInOffset(0)).toEqual({ x: 0, y: 0 });
  });

  it('volta ao início no fim do ciclo', () => {
    const n = BURN_IN_OFFSETS.length;
    expect(burnInOffset(n)).toEqual(burnInOffset(0));
    expect(burnInOffset(n + 3)).toEqual(burnInOffset(3));
    expect(burnInOffset(-1)).toEqual(burnInOffset(n - 1));
  });

  it('nunca passa do deslocamento máximo e cada passo anda no máximo 2 dp', () => {
    BURN_IN_OFFSETS.forEach((o, i) => {
      expect(Math.abs(o.x)).toBeLessThanOrEqual(BURN_IN_MAX_SHIFT);
      expect(Math.abs(o.y)).toBeLessThanOrEqual(BURN_IN_MAX_SHIFT);
      const next = burnInOffset(i + 1);
      expect(Math.abs(next.x - o.x)).toBeLessThanOrEqual(2);
      expect(Math.abs(next.y - o.y)).toBeLessThanOrEqual(2);
    });
  });

  it('não repete posição dentro do ciclo', () => {
    const keys = new Set(BURN_IN_OFFSETS.map((o) => `${o.x},${o.y}`));
    expect(keys.size).toBe(BURN_IN_OFFSETS.length);
  });
});

describe('geometria do velocímetro', () => {
  it('0 km/h no começo do arco e 200 no fim', () => {
    expect(speedToAngle(0, 200)).toBe(GAUGE_START_DEG);
    expect(speedToAngle(200, 200)).toBe(GAUGE_END_DEG);
    expect(speedToAngle(100, 200)).toBe(0);
  });

  it('fora da escala fica no limite', () => {
    expect(speedToAngle(-10, 200)).toBe(GAUGE_START_DEG);
    expect(speedToAngle(260, 200)).toBe(GAUGE_END_DEG);
  });

  it('0° aponta para cima e 90° para a direita', () => {
    const up = polarToCartesian(100, 100, 50, 0);
    expect(up.x).toBeCloseTo(100);
    expect(up.y).toBeCloseTo(50);
    const right = polarToCartesian(100, 100, 50, 90);
    expect(right.x).toBeCloseTo(150);
    expect(right.y).toBeCloseTo(100);
  });

  it('arco maior que 180° usa a flag large-arc', () => {
    expect(describeArc(100, 100, 50, -120, 120)).toContain(' 0 1 1 ');
    expect(describeArc(100, 100, 50, -120, 0)).toContain(' 0 0 1 ');
    expect(describeArc(100, 100, 50, 10, 10)).toBe('');
  });

  it('marcações de 20 em 20 até 200', () => {
    expect(gaugeTicks(200, 20)).toEqual([0, 20, 40, 60, 80, 100, 120, 140, 160, 180, 200]);
  });
});

describe('lista de atalhos', () => {
  it('valida nomes de pacote', () => {
    expect(isValidPackageName('com.waze')).toBe(true);
    expect(isValidPackageName('deezer.android.app')).toBe(true);
    expect(isValidPackageName('waze')).toBe(false);
    expect(isValidPackageName('com..waze')).toBe(false);
    expect(isValidPackageName('com.waze; rm -rf')).toBe(false);
  });

  it('descarta itens inválidos e repetidos e usa o pacote quando falta o nome', () => {
    const apps = parseCarApps([
      { label: 'Waze', package: 'com.waze' },
      { label: 'Waze de novo', package: 'com.waze' },
      { package: 'com.whatsapp' },
      { label: 'Sem pacote' },
      'com.spotify.music',
      null,
    ]);
    expect(apps).toEqual([
      { label: 'Waze', package: 'com.waze', tipo: 'outro' },
      { label: 'com.whatsapp', package: 'com.whatsapp', tipo: 'outro' },
    ]);
  });

  it('lê o tipo (navegação, música…) e usa "outro" quando falta ou é inválido', () => {
    const apps = parseCarApps([
      { label: 'Waze', package: 'com.waze', tipo: 'navegacao' },
      { label: 'Spotify', package: 'com.spotify.music', tipo: 'musica' },
      { label: 'X', package: 'com.x.y', tipo: 'jogo' },
    ]);
    expect(apps.map((a) => a.tipo)).toEqual(['navegacao', 'musica', 'outro']);
  });

  it('barra lateral: um app de navegação, um de música e um de comunicação', () => {
    const apps = parseCarApps([
      { label: 'Waze', package: 'com.waze', tipo: 'navegacao' },
      { label: 'Maps', package: 'com.google.android.apps.maps', tipo: 'navegacao' },
      { label: 'Spotify', package: 'com.spotify.music', tipo: 'musica' },
      { label: 'Deezer', package: 'deezer.android.app', tipo: 'musica' },
      { label: 'WhatsApp', package: 'com.whatsapp', tipo: 'comunicacao' },
    ]);
    expect(pickDockApps(apps).map((a) => a.label)).toEqual(['Waze', 'Spotify', 'WhatsApp']);
  });

  it('barra lateral completa com os próximos quando falta um tipo', () => {
    const apps = parseCarApps([
      { label: 'Waze', package: 'com.waze', tipo: 'navegacao' },
      { label: 'Maps', package: 'com.google.android.apps.maps', tipo: 'navegacao' },
      { label: 'Spotify', package: 'com.spotify.music', tipo: 'musica' },
    ]);
    expect(pickDockApps(apps).map((a) => a.label)).toEqual(['Waze', 'Spotify', 'Maps']);
    expect(pickDockApps([])).toEqual([]);
  });

  it('valor que não é lista vira lista vazia', () => {
    expect(parseCarApps(undefined)).toEqual([]);
    expect(parseCarApps({})).toEqual([]);
  });
});
