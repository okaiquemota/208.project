import {
  angleDelta,
  CAR_Y,
  cameraPaddingTop,
  carMapStyle,
  clampZoomOffset,
  initialCourse,
  PALETTES,
  updateCourse,
  zoomForSpeed,
} from '../src/lib/carMap';

describe('carMapStyle', () => {
  it('estilo válido: versão 8, fonte de mapas e camadas sem id repetido', () => {
    for (const theme of ['escuro', 'claro'] as const) {
      const s = carMapStyle(theme);
      expect(s.version).toBe(8);
      expect(s.sources.openmaptiles.url).toContain('openfreemap');
      const ids = s.layers.map((l) => l.id);
      expect(new Set(ids).size).toBe(ids.length);
    }
  });

  it('tem prédios 3D, nomes de ruas e o fundo do tema', () => {
    const s = carMapStyle('escuro');
    const types = s.layers.map((l) => l.type);
    expect(types).toContain('fill-extrusion');
    expect(s.layers.find((l) => l.id === 'nomes-ruas')).toBeDefined();
    expect(s.layers[0]?.paint).toEqual({ 'background-color': PALETTES.escuro.background });
  });

  it('borda de cada rua vem antes (embaixo) da rua', () => {
    const ids = carMapStyle('claro').layers.map((l) => l.id);
    expect(ids.indexOf('rua-major-borda')).toBeLessThan(ids.indexOf('rua-major'));
  });
});

describe('câmera', () => {
  it('zoom (de perto) diminui com a velocidade e fica nos limites', () => {
    expect(zoomForSpeed(0)).toBe(18.2);
    expect(zoomForSpeed(60)).toBeCloseTo(17.4, 5);
    expect(zoomForSpeed(120)).toBe(16.6);
    expect(zoomForSpeed(200)).toBe(16.6);
    expect(zoomForSpeed(-5)).toBe(18.2);
    expect(zoomForSpeed(Number.NaN)).toBe(18.2);
  });

  it('espaço em cima põe o carro abaixo do meio', () => {
    expect(cameraPaddingTop(400)).toBe(Math.round(400 * (2 * CAR_Y - 1)));
    expect(cameraPaddingTop(400, 0.5)).toBe(0);
    expect(cameraPaddingTop(400, 0.3)).toBe(0);
  });

  it('ajuste de zoom tem limite', () => {
    expect(clampZoomOffset(5)).toBe(2);
    expect(clampZoomOffset(-9)).toBe(-3);
    expect(clampZoomOffset(1)).toBe(1);
  });
});

describe('direção pelo deslocamento', () => {
  const base = { latitude: -23.55, longitude: -46.63 };
  // ~0,00009° de latitude ≈ 10 m
  const norte = { latitude: base.latitude + 0.00009, longitude: base.longitude };
  const leste = { latitude: base.latitude, longitude: base.longitude + 0.0001 };

  it('primeiro ponto só vira referência', () => {
    const c = updateCourse(initialCourse(null), base);
    expect(c.anchor).toEqual(base);
    expect(c.bearing).toBe(0);
  });

  it('andou para o leste: gira para lá (suave)', () => {
    let c = updateCourse(initialCourse(0), base);
    c = updateCourse(c, leste);
    expect(c.bearing).toBeGreaterThan(50);
    expect(c.bearing).toBeLessThan(70);
    const again = updateCourse(c, { latitude: leste.latitude, longitude: leste.longitude + 0.0001 });
    expect(again.bearing).toBeGreaterThan(c.bearing);
  });

  it('parado ou andou pouco (< 6 m): não gira e devolve o mesmo objeto', () => {
    const c = updateCourse(updateCourse(initialCourse(30), base), norte);
    const quase = { latitude: norte.latitude + 0.00002, longitude: norte.longitude };
    expect(updateCourse(c, quase)).toBe(c);
    expect(updateCourse(c, null)).toBe(c);
  });

  it('vira pelo lado mais curto (350° → 10° passa pelo norte)', () => {
    const c = { anchor: base, bearing: 350 };
    const next = updateCourse(c, norte); // alvo 0°
    expect(next.bearing).toBeGreaterThan(350);
    expect(angleDelta(350, 10)).toBe(20);
    expect(angleDelta(10, 350)).toBe(-20);
  });
});
