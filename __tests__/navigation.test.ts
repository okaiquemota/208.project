import { formatEta, guessManeuver, parseNavEntry, parseTripSummary, pickNavigation, streetOf } from '../src/lib/navigation';

const base = { key: 'k1', packageName: 'com.google.android.apps.maps', appName: 'Maps', postedAt: 10, iconUri: 'file:///seta.png' };

describe('parseNavEntry', () => {
  it('Maps: distância no título e a rua no texto', () => {
    const n = parseNavEntry({ ...base, title: '300 m', text: 'Vire à direita na R. Augusta', subText: '12 min · 5,2 km' })!;
    expect(n.distance).toBe('300 m');
    expect(n.distanceM).toBe(300);
    expect(n.instruction).toBe('Vire à direita na R. Augusta');
    expect(n.detail).toBe('12 min · 5,2 km');
    expect(n.maneuver).toBe('direita');
    expect(n.iconUri).toBe('file:///seta.png');
  });

  it('tudo numa frase: "Vire à esquerda em 1.2 km"', () => {
    const n = parseNavEntry({ ...base, title: 'Vire à esquerda em 1.2 km', text: '' })!;
    expect(n.distance).toBe('1,2 km');
    expect(n.distanceM).toBe(1200);
    expect(n.instruction).toBe('Vire à esquerda');
    expect(n.maneuver).toBe('esquerda');
  });

  it('distância no começo com vírgula: "Em 200 m, pegue o retorno"', () => {
    const n = parseNavEntry({ ...base, title: 'Em 200 m, pegue o retorno', text: 'Av. Paulista' })!;
    expect(n.distance).toBe('200 m');
    expect(n.instruction).toBe('pegue o retorno');
    expect(n.maneuver).toBe('retorno');
  });

  it('em inglês e pés', () => {
    const n = parseNavEntry({ ...base, title: '500 ft', text: 'Turn left onto Pine St' })!;
    expect(n.distance).toBe('500 ft');
    expect(n.distanceM).toBe(152);
    expect(n.maneuver).toBe('esquerda');
  });

  it('sem distância não é curva (ex.: "Waze em execução")', () => {
    expect(parseNavEntry({ ...base, title: 'Waze', text: 'Toque para voltar ao Waze' })).toBeNull();
    expect(parseNavEntry({ ...base, title: '', text: '' })).toBeNull();
  });

  it('"metros" e palavras com m no começo não enganam', () => {
    expect(parseNavEntry({ ...base, title: '3 motos à frente', text: 'Siga em frente' })).toBeNull();
  });

  it('lixo vira null', () => {
    expect(parseNavEntry(null)).toBeNull();
    expect(parseNavEntry({ title: '300 m' })).toBeNull();
  });
});

describe('pickNavigation', () => {
  it('pega a primeira notificação que tem curva', () => {
    const list = [
      { ...base, key: 'a', title: 'Waze', text: 'Em execução' },
      { ...base, key: 'b', title: '150 m', text: 'Mantenha-se à direita' },
    ];
    expect(pickNavigation(list)?.key).toBe('b');
    expect(pickNavigation([])).toBeNull();
    expect(pickNavigation('x')).toBeNull();
  });
});

describe('guessManeuver', () => {
  it('reconhece as manobras', () => {
    expect(guessManeuver('Na rotatória, pegue a 2ª saída')).toBe('rotatoria');
    expect(guessManeuver('Você chegou ao destino')).toBe('chegada');
    expect(guessManeuver('Siga pela Rod. dos Bandeirantes')).toBe('siga');
    expect(guessManeuver('Faça o retorno')).toBe('retorno');
  });
});

describe('streetOf', () => {
  it('separa a rua da instrução', () => {
    expect(streetOf('Vire à direita na R. Augusta')).toBe('R. Augusta');
    expect(streetOf('Vire à esquerda para a R. Bragança Paulista')).toBe('R. Bragança Paulista');
    expect(streetOf('Turn left onto Pine St')).toBe('Pine St');
    expect(streetOf('Mantenha-se à direita')).toBe('Mantenha-se à direita');
  });
});

describe('parseTripSummary', () => {
  const now = new Date(2026, 10, 6, 22, 37).getTime();
  it('minutos, distância e hora de chegada', () => {
    expect(parseTripSummary('26 min · 19 km · 23:03', now)).toEqual({ arrival: '23:03', minutes: 26, distance: '19 km' });
  });
  it('sem hora: calcula pelos minutos', () => {
    expect(parseTripSummary('26 min · 19 km', now)).toEqual({ arrival: '23:03', minutes: 26, distance: '19 km' });
  });
  it('horas e minutos', () => {
    expect(parseTripSummary('1 h 5 min · 82,4 km', now)?.minutes).toBe(65);
    expect(parseTripSummary('2 h · 150 km', now)?.minutes).toBe(120);
  });
  it('"Chegada às 7:05"', () => {
    expect(parseTripSummary('Chegada às 7:05', now)?.arrival).toBe('07:05');
  });
  it('nada reconhecível: null', () => {
    expect(parseTripSummary('', now)).toBeNull();
    expect(parseTripSummary('Rota mais rápida', now)).toBeNull();
  });
});

describe('formatEta', () => {
  it('minutos ou horas', () => {
    expect(formatEta(26)).toEqual({ value: '26', unit: 'min' });
    expect(formatEta(65)).toEqual({ value: '1:05', unit: 'h' });
  });
});
