import {
  DEFAULT_SETTINGS,
  normalizeSide,
  parseSettings,
  setMainWidget,
  setSideWidget,
  SIDE_SLOTS,
  sideOptions,
} from '../src/lib/settings';

describe('configurações: leitura do que está salvo', () => {
  it('nada salvo (primeira vez) usa o padrão', () => {
    expect(parseSettings(null)).toEqual(DEFAULT_SETTINGS);
    expect(parseSettings('')).toEqual(DEFAULT_SETTINGS);
  });

  it('JSON quebrado não derruba o app', () => {
    expect(parseSettings('{isso não é json')).toEqual(DEFAULT_SETTINGS);
    expect(parseSettings('42')).toEqual(DEFAULT_SETTINGS);
  });

  it('mantém o que é válido e corrige o resto', () => {
    const s = parseSettings(
      JSON.stringify({
        home: { main: 'velocidade', side: ['clima', 'foguete', 'clima'] },
        accent: 'roxo',
        speedAlertKmh: 333,
        preferredPlayer: 'com.spotify.music',
      }),
    );
    expect(s.home.main).toBe('velocidade');
    expect(s.home.side).toEqual(['clima', null, null]);
    expect(s.accent).toBe('roxo');
    expect(s.speedAlertKmh).toBe(DEFAULT_SETTINGS.speedAlertKmh);
    expect(s.preferredPlayer).toBe('com.spotify.music');
  });

  it('cor e player inválidos voltam ao padrão', () => {
    const s = parseSettings(JSON.stringify({ accent: 'dourado', preferredPlayer: 'spotify; rm -rf' }));
    expect(s.accent).toBe('azul');
    expect(s.preferredPlayer).toBeNull();
  });

  it('alerta desligado (0) é válido', () => {
    expect(parseSettings(JSON.stringify({ speedAlertKmh: 0 })).speedAlertKmh).toBe(0);
  });

  it('o padrão não é alterado por quem usa o resultado', () => {
    const s = parseSettings(null);
    s.home.side[0] = 'clima';
    expect(DEFAULT_SETTINGS.home.side[0]).toBe('velocidade');
  });
});

describe('configurações: coluna da direita', () => {
  it('sempre tem o número certo de posições', () => {
    expect(normalizeSide([], 'player')).toHaveLength(SIDE_SLOTS);
    expect(normalizeSide(['viagem', 'volume', 'clima', 'bateria'], 'player')).toEqual(['viagem', 'volume', 'clima']);
  });

  it('mini player não vai pra coluna quando o principal já é o player', () => {
    expect(normalizeSide(['miniplayer', 'viagem'], 'player')).toEqual([null, 'viagem', null]);
    expect(normalizeSide(['miniplayer', 'viagem'], 'velocidade')).toEqual(['miniplayer', 'viagem', null]);
    expect(sideOptions('player')).not.toContain('miniplayer');
    expect(sideOptions('velocidade')).toContain('miniplayer');
  });

  it('colocar um widget que já está em outra posição troca os dois de lugar', () => {
    const s = setSideWidget(DEFAULT_SETTINGS, 0, 'volume');
    expect(s.home.side).toEqual(['volume', 'viagem', 'velocidade']);
  });

  it('dá pra esvaziar uma posição', () => {
    expect(setSideWidget(DEFAULT_SETTINGS, 1, null).home.side).toEqual(['velocidade', null, 'volume']);
  });

  it('posição fora da faixa não muda nada', () => {
    expect(setSideWidget(DEFAULT_SETTINGS, 5, 'clima')).toBe(DEFAULT_SETTINGS);
  });

  it('trocar o principal para o player tira o mini player da coluna', () => {
    const comMini = { ...DEFAULT_SETTINGS, home: { main: 'velocidade' as const, side: ['miniplayer', 'viagem', 'volume'] as const } };
    const s = setMainWidget({ ...comMini, home: { ...comMini.home, side: [...comMini.home.side] } }, 'player');
    expect(s.home.main).toBe('player');
    expect(s.home.side).toEqual([null, 'viagem', 'volume']);
  });
});
