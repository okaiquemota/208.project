import { dialTicks, gpsSignalBars, speedLeds, volumeSegments } from '../src/lib/widgets';

describe('sinal do GPS em barrinhas', () => {
  it('quanto mais preciso, mais barras', () => {
    expect(gpsSignalBars(3)).toBe(4);
    expect(gpsSignalBars(5)).toBe(4);
    expect(gpsSignalBars(8)).toBe(3);
    expect(gpsSignalBars(20)).toBe(2);
    expect(gpsSignalBars(35)).toBe(2);
    expect(gpsSignalBars(80)).toBe(1);
  });

  it('sem leitura é zero', () => {
    expect(gpsSignalBars(null)).toBe(0);
    expect(gpsSignalBars(NaN)).toBe(0);
    expect(gpsSignalBars(-1)).toBe(0);
  });
});

describe('LEDs do velocímetro', () => {
  const on = (leds: { on: boolean }[]) => leds.filter((l) => l.on).length;

  it('parado: tudo apagado; sem leitura também', () => {
    expect(on(speedLeds(0, 200, 120, 20))).toBe(0);
    expect(on(speedLeds(null, 200, 120, 20))).toBe(0);
  });

  it('acende proporcional à velocidade', () => {
    expect(on(speedLeds(100, 200, 120, 20))).toBe(10);
    expect(on(speedLeds(200, 200, 120, 20))).toBe(20);
    expect(on(speedLeds(260, 200, 120, 20))).toBe(20);
  });

  it('andando devagar acende pelo menos um', () => {
    expect(on(speedLeds(3, 200, 120, 20))).toBe(1);
  });

  it('segmentos acima de 120 km/h são de alerta', () => {
    const leds = speedLeds(0, 200, 120, 20);
    // 20 segmentos de 10 km/h: os 12 primeiros vão até 120, os 8 últimos passam.
    expect(leds.filter((l) => l.alert)).toHaveLength(8);
    expect(leds[11]!.alert).toBe(false);
    expect(leds[12]!.alert).toBe(true);
  });
});

describe('segmentos do volume', () => {
  it('proporcional ao máximo do aparelho', () => {
    expect(volumeSegments(9, 15, 15).filter(Boolean)).toHaveLength(9);
    expect(volumeSegments(15, 15, 10).filter(Boolean)).toHaveLength(10);
    expect(volumeSegments(0, 15, 10).filter(Boolean)).toHaveLength(0);
  });

  it('máximo desconhecido não acende nada', () => {
    expect(volumeSegments(5, 0, 10).filter(Boolean)).toHaveLength(0);
  });
});

describe('marcações do velocímetro', () => {
  // 41 marcações de 0 a 200: uma a cada 5 km/h.
  it('acende até a velocidade atual (contando a do zero)', () => {
    expect(dialTicks(0, 200, 120, 41).lit).toBe(0);
    expect(dialTicks(null, 200, 120, 41).lit).toBe(0);
    expect(dialTicks(5, 200, 120, 41).lit).toBe(2);
    expect(dialTicks(87, 200, 120, 41).lit).toBe(18);
    expect(dialTicks(250, 200, 120, 41).lit).toBe(41);
  });

  it('as marcações depois de 120 km/h são de alerta', () => {
    // Marcação 24 = 120 km/h (ainda normal); a 25 (125 km/h) já é alerta.
    expect(dialTicks(0, 200, 120, 41).alertFrom).toBe(25);
  });

  it('alerta desligado nunca fica vermelho', () => {
    expect(dialTicks(180, 200, Number.POSITIVE_INFINITY, 41).alertFrom).toBe(Number.POSITIVE_INFINITY);
  });
});
