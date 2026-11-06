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
      }),
    );
    expect(s.home.main).toBe('velocidade');
    expect(s.home.side).toEqual(['clima', null, null]);
    expect(s.accent).toBe('roxo');
    expect(s.speedAlertKmh).toBe(DEFAULT_SETTINGS.speedAlertKmh);
  });

  it('cor inválida volta ao padrão; player salvo de versões antigas é ignorado (sempre automático)', () => {
    const s = parseSettings(JSON.stringify({ accent: 'dourado', preferredPlayer: 'com.spotify.music' }));
    expect(s.accent).toBe('azul');
    expect('preferredPlayer' in s).toBe(false);
  });

  it('fundo: papel de parede (padrão) ou preto; valor estranho volta ao padrão', () => {
    expect(parseSettings(null).background).toBe('papel');
    expect(parseSettings(JSON.stringify({ background: 'preto' })).background).toBe('preto');
    expect(parseSettings(JSON.stringify({ background: 'neon' })).background).toBe('papel');
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

describe('mapa e widgets novos', () => {
  it('mapa como card principal e tema do mapa', () => {
    const s = parseSettings(JSON.stringify({ home: { main: 'mapa', side: ['curva', 'mensagens', 'miniplayer'] }, mapTheme: 'claro' }));
    expect(s.home.main).toBe('mapa');
    expect(s.home.side).toEqual(['curva', 'mensagens', 'miniplayer']);
    expect(s.mapTheme).toBe('claro');
  });

  it('tema do mapa inválido volta ao escuro', () => {
    expect(parseSettings(JSON.stringify({ mapTheme: 'neon' })).mapTheme).toBe('escuro');
    expect(parseSettings(null).mapTheme).toBe('escuro');
  });
});
