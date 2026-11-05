import {
  bearingDegrees,
  distanceMeters,
  kmhToMs,
  msToKmh,
  normalizeDegrees,
  toCardinal,
} from '../src/lib/geo';

describe('geo', () => {
  it('converte m/s ↔ km/h', () => {
    expect(msToKmh(10)).toBeCloseTo(36);
    expect(kmhToMs(36)).toBeCloseTo(10);
  });

  it('distância de 1 grau de latitude ≈ 111,2 km', () => {
    const d = distanceMeters({ latitude: 0, longitude: 0 }, { latitude: 1, longitude: 0 });
    expect(d).toBeGreaterThan(111_100);
    expect(d).toBeLessThan(111_300);
  });

  it('distância São Paulo (Sé) → Rio (Centro) ≈ 360 km', () => {
    const sp = { latitude: -23.5505, longitude: -46.6333 };
    const rj = { latitude: -22.9068, longitude: -43.1729 };
    const km = distanceMeters(sp, rj) / 1000;
    expect(km).toBeGreaterThan(350);
    expect(km).toBeLessThan(370);
  });

  it('distância de um ponto para ele mesmo é 0', () => {
    const p = { latitude: -23.5, longitude: -46.6 };
    expect(distanceMeters(p, p)).toBe(0);
  });

  it('rumo para os quatro lados', () => {
    const o = { latitude: 0, longitude: 0 };
    expect(bearingDegrees(o, { latitude: 1, longitude: 0 })).toBeCloseTo(0);
    expect(bearingDegrees(o, { latitude: 0, longitude: 1 })).toBeCloseTo(90);
    expect(bearingDegrees(o, { latitude: -1, longitude: 0 })).toBeCloseTo(180);
    expect(bearingDegrees(o, { latitude: 0, longitude: -1 })).toBeCloseTo(270);
  });

  it('normaliza ângulos', () => {
    expect(normalizeDegrees(370)).toBe(10);
    expect(normalizeDegrees(-10)).toBe(350);
    expect(normalizeDegrees(360)).toBe(0);
  });

  it('pontos cardeais em português', () => {
    expect(toCardinal(0)).toBe('N');
    expect(toCardinal(22)).toBe('N');
    expect(toCardinal(23)).toBe('NE');
    expect(toCardinal(45)).toBe('NE');
    expect(toCardinal(90)).toBe('L');
    expect(toCardinal(135)).toBe('SE');
    expect(toCardinal(180)).toBe('S');
    expect(toCardinal(225)).toBe('SO');
    expect(toCardinal(270)).toBe('O');
    expect(toCardinal(315)).toBe('NO');
    expect(toCardinal(338)).toBe('N');
    expect(toCardinal(359.9)).toBe('N');
    expect(toCardinal(-90)).toBe('O');
  });
});
