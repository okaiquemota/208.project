import {
  BATTERY_STATE as S,
  batteryStatus,
  isBatteryAlert,
  type PluggedTracker,
  trackPlugged,
} from '../src/lib/battery';

const start: PluggedTracker = { plugged: false, peakLevel: 0 };

/** Aplica leituras (nível, estado) em sequência e devolve o status final. */
function run(readings: [number, number][]) {
  let t = start;
  let status = batteryStatus(-1, S.UNKNOWN, t);
  for (const [level, state] of readings) {
    t = trackPlugged(t, level, state);
    status = batteryStatus(level, state, t);
  }
  return { t, status };
}

describe('bateria', () => {
  it('fora da tomada é descarregando (alerta)', () => {
    const { status } = run([[0.8, S.UNPLUGGED]]);
    expect(status).toBe('descarregando');
    expect(isBatteryAlert(status)).toBe(true);
  });

  it('carregando normal', () => {
    const { status } = run([
      [0.5, S.CHARGING],
      [0.51, S.CHARGING],
      [0.52, S.CHARGING],
    ]);
    expect(status).toBe('carregando');
    expect(isBatteryAlert(status)).toBe(false);
  });

  it('cheia ou carga pausada contam como na tomada', () => {
    expect(run([[1, S.FULL]]).status).toBe('na-tomada');
    expect(run([[0.85, S.NOT_CHARGING]]).status).toBe('na-tomada');
  });

  it('plugado mas caindo 2 pontos: USB fraca (alerta)', () => {
    const { status } = run([
      [0.6, S.CHARGING],
      [0.61, S.CHARGING],
      [0.6, S.CHARGING],
      [0.59, S.CHARGING],
    ]);
    expect(status).toBe('usb-fraca');
    expect(isBatteryAlert(status)).toBe(true);
  });

  it('cair só 1 ponto não alerta (oscilação normal)', () => {
    expect(
      run([
        [0.6, S.CHARGING],
        [0.59, S.CHARGING],
      ]).status,
    ).toBe('carregando');
  });

  it('desplugar e plugar de novo recomeça a contagem', () => {
    const { status } = run([
      [0.9, S.CHARGING],
      [0.8, S.UNPLUGGED],
      [0.8, S.CHARGING],
    ]);
    expect(status).toBe('carregando');
  });

  it('estado desconhecido não alerta', () => {
    const { status } = run([[0.5, S.UNKNOWN]]);
    expect(status).toBe('desconhecido');
    expect(isBatteryAlert(status)).toBe(false);
  });
});
