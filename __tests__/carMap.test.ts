import {
  CAR_Y,
  cameraPaddingTop,
  carMapStyle,
  clampZoomOffset,
  nextBearing,
  PALETTES,
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
  it('zoom diminui com a velocidade e fica nos limites', () => {
    expect(zoomForSpeed(0)).toBe(17.3);
    expect(zoomForSpeed(60)).toBeCloseTo(16.4, 5);
    expect(zoomForSpeed(120)).toBe(15.5);
    expect(zoomForSpeed(200)).toBe(15.5);
    expect(zoomForSpeed(-5)).toBe(17.3);
    expect(zoomForSpeed(Number.NaN)).toBe(17.3);
  });

  it('direção: segue o GPS andando; parado mantém a anterior', () => {
    expect(nextBearing(10, 90, 40)).toBe(90);
    expect(nextBearing(10, 90, 2)).toBe(10);
    expect(nextBearing(10, null, 40)).toBe(10);
    expect(nextBearing(0, -90, 40)).toBe(270);
    expect(nextBearing(0, 450, 40)).toBe(90);
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
