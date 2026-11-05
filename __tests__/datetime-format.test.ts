import {
  formatClock,
  formatDateLong,
  formatDayMonth,
  formatWeekday,
  formatDateShort,
  msUntilNextMinute,
  pad2,
} from '../src/lib/datetime';
import {
  formatBattery,
  formatDecimal,
  formatDuration,
  formatKm,
  formatKmh,
} from '../src/lib/format';

describe('data e hora em português', () => {
  // 5 de novembro de 2026 é uma quinta-feira. Mês em Date começa em 0.
  const d = new Date(2026, 10, 5, 9, 7, 30, 250);

  it('relógio com 24 horas e zero à esquerda', () => {
    expect(formatClock(d)).toBe('09:07');
    expect(formatClock(new Date(2026, 0, 1, 23, 59))).toBe('23:59');
    expect(formatClock(new Date(2026, 0, 1, 0, 0))).toBe('00:00');
  });

  it('data por extenso', () => {
    expect(formatDateLong(d)).toBe('quinta-feira, 5 de novembro');
    expect(formatDateLong(new Date(2026, 2, 1))).toBe('domingo, 1 de março');
  });

  it('data curta', () => {
    expect(formatDateShort(d)).toBe('qui, 5 nov');
    expect(formatDateShort(new Date(2026, 10, 7))).toBe('sáb, 7 nov');
  });

  it('pad2', () => {
    expect(pad2(0)).toBe('00');
    expect(pad2(9)).toBe('09');
    expect(pad2(10)).toBe('10');
  });

  it('tempo até a próxima virada de minuto', () => {
    expect(msUntilNextMinute(d)).toBe(60_000 - 30_250);
    expect(msUntilNextMinute(new Date(2026, 0, 1, 0, 0, 0, 0))).toBe(60_000);
  });
});

describe('formatação', () => {
  it('decimal com vírgula', () => {
    expect(formatDecimal(12.345)).toBe('12,3');
    expect(formatDecimal(NaN)).toBe('0,0');
  });

  it('km trunca (não arredonda pra cima) e some com as casas acima de 100 km', () => {
    expect(formatKm(0)).toBe('0,0');
    expect(formatKm(12_399)).toBe('12,3');
    expect(formatKm(950)).toBe('0,9');
    expect(formatKm(123_456)).toBe('123');
    expect(formatKm(-5)).toBe('0,0');
  });

  it('km/h arredondado', () => {
    expect(formatKmh(87.4)).toBe('87');
    expect(formatKmh(87.5)).toBe('88');
    expect(formatKmh(-1)).toBe('0');
    expect(formatKmh(NaN)).toBe('0');
  });

  it('duração', () => {
    expect(formatDuration(0)).toBe('00:00');
    expect(formatDuration(65_000)).toBe('01:05');
    expect(formatDuration(3_723_000)).toBe('1:02:03');
    expect(formatDuration(-1)).toBe('00:00');
  });

  it('bateria', () => {
    expect(formatBattery(0.784)).toBe('78%');
    expect(formatBattery(1)).toBe('100%');
    expect(formatBattery(-1)).toBe('--%');
  });
});

describe('data em duas linhas', () => {
  it('dia da semana e dia/mês separados', () => {
    const d = new Date(2026, 10, 5);
    expect(formatWeekday(d)).toBe('quinta-feira');
    expect(formatDayMonth(d)).toBe('5 de novembro');
  });
});
