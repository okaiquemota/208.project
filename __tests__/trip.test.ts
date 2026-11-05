import {
  addFix,
  averageKmh,
  createTrip,
  DEFAULT_RULES,
  type GpsFix,
  resetTrip,
  type TripState,
} from '../src/lib/trip';

// 1 grau de latitude ≈ 111.195 m (mesmo raio usado em geo.ts).
const METERS_PER_DEG_LAT = (Math.PI / 180) * 6_371_008.8;
const BASE = { latitude: -23.55, longitude: -46.63 };

/** Leitura a `northM` metros ao norte do ponto base, no segundo `t`. */
function fix(t: number, northM: number, extra: Partial<GpsFix> = {}): GpsFix {
  return {
    latitude: BASE.latitude + northM / METERS_PER_DEG_LAT,
    longitude: BASE.longitude,
    accuracy: 5,
    speed: null,
    heading: null,
    timestamp: t * 1000,
    ...extra,
  };
}

/** Aplica várias leituras em sequência. */
const run = (fixes: GpsFix[], state: TripState = createTrip()) =>
  fixes.reduce((s, f) => addFix(s, f), state);

/** Andando para o norte a `ms` m/s durante `seconds` segundos, a partir de t0. */
function drive(t0: number, startM: number, seconds: number, ms: number, extra: Partial<GpsFix> = {}) {
  const out: GpsFix[] = [];
  for (let i = 0; i <= seconds; i++) out.push(fix(t0 + i, startM + i * ms, extra));
  return out;
}

describe('viagem: caso normal', () => {
  it('começa zerada', () => {
    const s = createTrip();
    expect(s.distanceM).toBe(0);
    expect(s.movingMs).toBe(0);
    expect(averageKmh(s)).toBe(0);
  });

  it('soma distância e tempo andando a 36 km/h (10 m/s) por 10 s', () => {
    const s = run(drive(0, 0, 10, 10, { speed: 10 }));
    expect(s.distanceM).toBeCloseTo(100, 0);
    expect(s.movingMs).toBe(10_000);
    expect(s.speedKmh).toBeCloseTo(36, 5);
    expect(s.maxKmh).toBeCloseTo(36, 5);
    expect(averageKmh(s)).toBeCloseTo(36, 0);
  });

  it('não altera o estado recebido (função pura)', () => {
    const s0 = createTrip();
    const copy = JSON.stringify(s0);
    addFix(s0, fix(0, 0, { speed: 10 }));
    expect(JSON.stringify(s0)).toBe(copy);
  });

  it('ignora leitura repetida ou fora de ordem', () => {
    const s1 = run(drive(0, 0, 2, 10, { speed: 10 }));
    expect(addFix(s1, fix(1, 50, { speed: 10 }))).toBe(s1);
    expect(addFix(s1, fix(2, 50, { speed: 10 }))).toBe(s1);
  });
});

describe('regra: abaixo de 3 km/h conta como parado', () => {
  it('parado com GPS tremendo não soma distância nem tempo', () => {
    // Pontos pulando 0,5 m pra lá e pra cá, velocidade do GPS 0,5 m/s (1,8 km/h).
    const fixes = Array.from({ length: 30 }, (_, i) => fix(i, i % 2 === 0 ? 0 : 0.5, { speed: 0.5 }));
    const s = run(fixes);
    expect(s.distanceM).toBe(0);
    expect(s.movingMs).toBe(0);
    expect(s.speedKmh).toBe(0);
  });

  it('2,9 km/h é parado e 3 km/h já é movimento', () => {
    const slow = run(drive(0, 0, 5, 2.9 / 3.6, { speed: 2.9 / 3.6 }));
    expect(slow.distanceM).toBe(0);
    expect(slow.movingMs).toBe(0);
    const ok = run(drive(0, 0, 5, 3 / 3.6, { speed: 3 / 3.6 }));
    expect(ok.movingMs).toBe(5000);
    expect(ok.distanceM).toBeCloseTo(5 * (3 / 3.6), 1);
  });

  it('a distância parado não acumula quando volta a andar', () => {
    const parado = Array.from({ length: 10 }, (_, i) => fix(i, (i % 3) * 0.7, { speed: 0 }));
    const andando = drive(10, 0, 5, 10, { speed: 10 });
    const s = run([...parado, ...andando]);
    // Só os 5 trechos andando (o primeiro ponto andando sai do último ponto parado).
    expect(s.distanceM).toBeGreaterThan(48);
    expect(s.distanceM).toBeLessThan(52);
  });
});

describe('regra: precisão pior que 35 m não soma distância', () => {
  it('leituras imprecisas não somam distância, mas somam tempo se o GPS diz que estamos andando', () => {
    const s = run(drive(0, 0, 5, 10, { speed: 10, accuracy: 50 }));
    expect(s.distanceM).toBe(0);
    expect(s.movingMs).toBe(5000);
    expect(s.speedKmh).toBeCloseTo(36, 5);
  });

  it('35 m exatos ainda valem', () => {
    const s = run(drive(0, 0, 3, 10, { speed: 10, accuracy: 35 }));
    expect(s.distanceM).toBeCloseTo(30, 0);
  });

  it('precisão desconhecida (null) é tratada como ruim', () => {
    const s = run(drive(0, 0, 3, 10, { speed: 10, accuracy: null }));
    expect(s.distanceM).toBe(0);
  });

  it('um ponto ruim no meio não entra na conta: a distância liga os pontos bons', () => {
    const fixes = drive(0, 0, 4, 10, { speed: 10 });
    // O ponto do segundo 2 vem 80 m fora do lugar e com precisão de 60 m.
    fixes[2] = fix(2, 100, { speed: 10, accuracy: 60 });
    const s = run(fixes);
    expect(s.distanceM).toBeCloseTo(40, 0);
  });
});

describe('regra: intervalo maior que 10 s não liga os pontos', () => {
  it('túnel: some o sinal por 30 s e o trecho do túnel não é somado', () => {
    const antes = drive(0, 0, 5, 10, { speed: 10 }); // 50 m
    const depois = drive(35, 350, 5, 10, { speed: 10 }); // reaparece 300 m depois
    const s = run([...antes, ...depois]);
    expect(s.distanceM).toBeCloseTo(100, 0);
    expect(s.movingMs).toBe(10_000);
  });

  it('10 s exatos ainda ligam os pontos', () => {
    const s = run([fix(0, 0, { speed: 10 }), fix(10, 100, { speed: 10 })]);
    expect(s.distanceM).toBeCloseTo(100, 0);
    expect(s.movingMs).toBe(10_000);
  });

  it('sem velocidade do GPS logo depois do buraco, mostra 0 até ter dois pontos', () => {
    const s = run([fix(0, 0, { speed: 10 }), fix(20, 200)]);
    expect(s.speedKmh).toBe(0);
    expect(s.distanceM).toBe(0);
  });
});

describe('regra: saltos acima de 250 km/h são descartados', () => {
  it('ponto que "teletransporta" 500 m em 1 s é ignorado', () => {
    const fixes = drive(0, 0, 4, 10, { speed: 10 });
    fixes.splice(2, 0, fix(2.5, 520)); // salto falso no meio
    const s = run(fixes);
    expect(s.distanceM).toBeCloseTo(40, 0);
    expect(s.maxKmh).toBeCloseTo(36, 5);
  });

  it('velocidade do GPS acima de 250 km/h é ignorada', () => {
    const fixes = drive(0, 0, 3, 10, { speed: 10 });
    const ruim = fix(4, 40, { speed: 300 / 3.6 });
    const s = run([...fixes, ruim]);
    expect(s.maxKmh).toBeCloseTo(36, 5);
    expect(s.lastTimestamp).toBe(3000);
  });

  it('se a âncora era um ponto errado, o sistema se recupera depois do intervalo máximo', () => {
    // Primeiro ponto "bom" mas 5 km fora; os seguintes parecem saltos e são descartados
    // até passar 10 s, quando um ponto novo vira âncora.
    const errado = fix(0, -5000, { speed: 0 });
    const certos = drive(1, 0, 15, 10, { speed: 10 });
    const s = run([errado, ...certos]);
    expect(s.anchor?.timestamp).toBe(16_000);
    expect(s.distanceM).toBeGreaterThan(0);
    expect(s.maxKmh).toBeLessThan(DEFAULT_RULES.maxJumpKmh);
  });
});

describe('regra: speed null ou negativo é calculado por distância/tempo', () => {
  it('speed null', () => {
    const s = run(drive(0, 0, 5, 20)); // 20 m/s = 72 km/h
    expect(s.speedKmh).toBeCloseTo(72, 0);
    expect(s.maxKmh).toBeCloseTo(72, 0);
    expect(s.distanceM).toBeCloseTo(100, 0);
  });

  it('speed negativo (-1 = desconhecido no Android)', () => {
    const s = run(drive(0, 0, 5, 20, { speed: -1 }));
    expect(s.speedKmh).toBeCloseTo(72, 0);
  });

  it('primeira leitura sem speed mostra 0', () => {
    const s = addFix(createTrip(), fix(0, 0));
    expect(s.speedKmh).toBe(0);
  });
});

describe('direção', () => {
  it('usa o heading do GPS quando existe', () => {
    const s = run(drive(0, 0, 3, 10, { speed: 10, heading: 95 }));
    expect(s.headingDeg).toBe(95);
  });

  it('sem heading, calcula pelo rumo entre os pontos (indo para o norte = 0°)', () => {
    const s = run(drive(0, 0, 3, 10, { speed: 10 }));
    expect(s.headingDeg).toBeCloseTo(0, 3);
  });

  it('indo para o sul dá 180°', () => {
    const s = run(drive(0, 0, 3, -10, { speed: 10 }));
    expect(s.headingDeg).toBeCloseTo(180, 3);
  });

  it('parado mantém a última direção', () => {
    const andando = drive(0, 0, 3, 10, { speed: 10, heading: 270 });
    const parado = [fix(4, 30, { speed: 0, heading: 12 }), fix(5, 30, { speed: 0, heading: 200 })];
    const s = run([...andando, ...parado]);
    expect(s.headingDeg).toBe(270);
  });
});

describe('zerar a viagem', () => {
  it('zera contadores mas mantém velocidade, direção e âncora', () => {
    const s = run(drive(0, 0, 5, 10, { speed: 10, heading: 45 }));
    const z = resetTrip(s);
    expect(z.distanceM).toBe(0);
    expect(z.movingMs).toBe(0);
    expect(z.maxKmh).toBe(0);
    expect(z.speedKmh).toBe(s.speedKmh);
    expect(z.headingDeg).toBe(45);
    expect(z.anchor).toBe(s.anchor);
    // Continua contando a partir do ponto atual.
    const depois = addFix(z, fix(6, 60, { speed: 10 }));
    expect(depois.distanceM).toBeCloseTo(10, 0);
  });
});
