// Mapa 3D do painel (MapLibre + mapas gratuitos do OpenFreeMap): o estilo
// visual e as contas da câmera. Tudo puro, sem React.
//
// Visual no estilo do CarPlay/Waze: fundo cinza-escuro, ruas mais claras
// conforme a importância, prédios em 3D, só os nomes que importam (ruas e
// bairros) e nada de ícones de lojas poluindo a tela.

export type MapTheme = 'escuro' | 'claro';

/** Mapas vetoriais gratuitos, sem chave (dados do OpenStreetMap). */
export const TILES_URL = 'https://tiles.openfreemap.org/planet';
export const GLYPHS_URL = 'https://tiles.openfreemap.org/fonts/{fontstack}/{range}.pbf';
const FONT = ['Noto Sans Regular'];
const FONT_BOLD = ['Noto Sans Bold'];

type Palette = {
  background: string;
  water: string;
  park: string;
  building: string;
  casing: string;
  minor: string;
  medium: string;
  major: string;
  highway: string;
  label: string;
  halo: string;
  place: string;
};

export const PALETTES: Record<MapTheme, Palette> = {
  escuro: {
    background: '#25282C',
    water: '#1A2733',
    park: '#253128',
    building: '#3B4048',
    casing: '#1B1D20',
    minor: '#454A51',
    medium: '#565C64',
    major: '#6A7179',
    highway: '#7D858E',
    label: '#D5D9DE',
    halo: '#25282C',
    place: '#ECEEF0',
  },
  claro: {
    background: '#EEECE7',
    water: '#AAD0E0',
    park: '#D3E6C9',
    building: '#DEDAD2',
    casing: '#C8C4BC',
    minor: '#FFFFFF',
    medium: '#FFFFFF',
    major: '#FFF6D9',
    highway: '#FFE7A3',
    label: '#3C4043',
    halo: '#FFFFFF',
    place: '#202124',
  },
};

/** Nome em português quando existe, senão o nome local. */
const NAME = ['coalesce', ['get', 'name:pt'], ['get', 'name']];

/** Largura por zoom (cresce rápido de perto, como numa navegação). */
const width = (stops: [number, number][]) => ['interpolate', ['exponential', 1.5], ['zoom'], ...stops.flat()];

const ROAD_CLASSES = {
  highway: ['motorway', 'trunk'],
  major: ['primary'],
  medium: ['secondary', 'tertiary'],
  minor: ['minor', 'service'],
} as const;

const ROAD_WIDTHS: Record<keyof typeof ROAD_CLASSES, [number, number][]> = {
  highway: [[8, 1], [12, 3], [15, 9], [18, 28]],
  major: [[10, 1], [13, 3], [16, 10], [18, 22]],
  medium: [[11, 0.8], [14, 3], [16, 8], [18, 18]],
  minor: [[13, 0.5], [15, 2.5], [17, 7], [18, 12]],
};

/** Estilo completo do mapa (formato do MapLibre). */
export function carMapStyle(theme: MapTheme) {
  const c = PALETTES[theme];
  const roads = (Object.keys(ROAD_CLASSES) as (keyof typeof ROAD_CLASSES)[]).flatMap((kind) => {
    const filter = ['in', ['get', 'class'], ['literal', [...ROAD_CLASSES[kind]]]];
    const w = ROAD_WIDTHS[kind];
    return [
      {
        id: `rua-${kind}-borda`,
        type: 'line',
        source: 'openmaptiles',
        'source-layer': 'transportation',
        filter,
        layout: { 'line-cap': 'round', 'line-join': 'round' },
        paint: { 'line-color': c.casing, 'line-width': width(w.map(([z, v]) => [z, v + (z >= 14 ? 2 : 0.5)])) },
      },
      {
        id: `rua-${kind}`,
        type: 'line',
        source: 'openmaptiles',
        'source-layer': 'transportation',
        filter,
        layout: { 'line-cap': 'round', 'line-join': 'round' },
        paint: { 'line-color': c[kind], 'line-width': width(w) },
      },
    ];
  });

  return {
    version: 8,
    name: `painel208-${theme}`,
    glyphs: GLYPHS_URL,
    sources: {
      openmaptiles: { type: 'vector', url: TILES_URL },
    },
    layers: [
      { id: 'fundo', type: 'background', paint: { 'background-color': c.background } },
      {
        id: 'parques',
        type: 'fill',
        source: 'openmaptiles',
        'source-layer': 'park',
        paint: { 'fill-color': c.park, 'fill-opacity': 0.8 },
      },
      {
        id: 'vegetacao',
        type: 'fill',
        source: 'openmaptiles',
        'source-layer': 'landcover',
        filter: ['in', ['get', 'class'], ['literal', ['wood', 'grass']]],
        paint: { 'fill-color': c.park, 'fill-opacity': 0.6 },
      },
      {
        id: 'agua',
        type: 'fill',
        source: 'openmaptiles',
        'source-layer': 'water',
        paint: { 'fill-color': c.water },
      },
      ...roads,
      {
        id: 'predios-3d',
        type: 'fill-extrusion',
        source: 'openmaptiles',
        'source-layer': 'building',
        minzoom: 15,
        paint: {
          'fill-extrusion-color': c.building,
          // Prédios mais baixos que o real (70%) e translúcidos: dão o 3D sem tapar as ruas.
          'fill-extrusion-height': ['*', 0.7, ['coalesce', ['get', 'render_height'], 6]],
          'fill-extrusion-base': ['*', 0.7, ['coalesce', ['get', 'render_min_height'], 0]],
          'fill-extrusion-opacity': 0.55,
        },
      },
      {
        id: 'nomes-ruas',
        type: 'symbol',
        source: 'openmaptiles',
        'source-layer': 'transportation_name',
        minzoom: 13,
        layout: {
          'symbol-placement': 'line',
          'text-field': NAME,
          'text-font': FONT,
          'text-size': ['interpolate', ['linear'], ['zoom'], 13, 13, 17, 17],
          'text-max-angle': 30,
        },
        paint: { 'text-color': c.label, 'text-halo-color': c.halo, 'text-halo-width': 1.6 },
      },
      {
        id: 'nomes-lugares',
        type: 'symbol',
        source: 'openmaptiles',
        'source-layer': 'place',
        filter: ['in', ['get', 'class'], ['literal', ['city', 'town', 'suburb', 'neighbourhood']]],
        layout: {
          'text-field': NAME,
          'text-font': FONT_BOLD,
          'text-size': ['match', ['get', 'class'], 'city', 20, 'town', 18, 15],
          'text-transform': 'uppercase',
          'text-letter-spacing': 0.08,
          'text-max-width': 8,
        },
        paint: { 'text-color': c.place, 'text-halo-color': c.halo, 'text-halo-width': 1.6, 'text-opacity': 0.75 },
      },
    ],
  };
}

// ---------- Câmera ----------

/** Inclinação do modo 3D (graus). */
export const PITCH_3D = 50;
/** Onde o carro fica na tela, de cima (0) para baixo (1): um pouco abaixo do meio. */
export const CAR_Y = 0.7;
/** Ajuste de zoom com os botões +/−. */
export const ZOOM_OFFSET_MIN = -3;
export const ZOOM_OFFSET_MAX = 2;

/** Zoom pela velocidade: de perto na cidade, mais aberto na estrada. */
export function zoomForSpeed(kmh: number): number {
  const s = Math.max(0, Math.min(120, Number.isFinite(kmh) ? kmh : 0));
  // 0 km/h → 17,3 · 120 km/h → 15,5
  return Math.round((17.3 - (s / 120) * 1.8) * 100) / 100;
}

/**
 * Direção da câmera: segue o rumo do GPS andando; parado (ou sem rumo),
 * mantém a última, para o mapa não girar à toa no semáforo.
 */
export function nextBearing(previous: number, headingDeg: number | null | undefined, kmh: number): number {
  if (headingDeg == null || !Number.isFinite(headingDeg) || kmh < 5) return previous;
  return ((headingDeg % 360) + 360) % 360;
}

/**
 * Espaço em cima para o centro do mapa (o carro) ficar em CAR_Y da altura:
 * o MapLibre centraliza no meio da área que sobra depois do espaço.
 */
export function cameraPaddingTop(height: number, carY = CAR_Y): number {
  return Math.max(0, Math.round(height * (2 * carY - 1)));
}

export const clampZoomOffset = (v: number) => Math.max(ZOOM_OFFSET_MIN, Math.min(ZOOM_OFFSET_MAX, v));
