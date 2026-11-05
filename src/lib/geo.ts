// Funções de geografia usadas pelo velocímetro e pela viagem.
// Tudo puro (sem React, sem módulo nativo) para poder testar com Jest.

export type LatLng = {
  latitude: number;
  longitude: number;
};

/** Raio médio da Terra em metros (o mesmo usado pela maioria dos GPS). */
const EARTH_RADIUS_M = 6_371_008.8;

const toRad = (deg: number) => (deg * Math.PI) / 180;
const toDeg = (rad: number) => (rad * 180) / Math.PI;

/** Converte metros por segundo para km/h. */
export const msToKmh = (ms: number) => ms * 3.6;

/** Converte km/h para metros por segundo. */
export const kmhToMs = (kmh: number) => kmh / 3.6;

/**
 * Distância em metros entre dois pontos, pela fórmula de haversine.
 * Para trechos de poucos metros (1 leitura por segundo) o erro é desprezível.
 */
export function distanceMeters(a: LatLng, b: LatLng): number {
  const dLat = toRad(b.latitude - a.latitude);
  const dLon = toRad(b.longitude - a.longitude);
  const lat1 = toRad(a.latitude);
  const lat2 = toRad(b.latitude);
  const h =
    Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) ** 2;
  return 2 * EARTH_RADIUS_M * Math.asin(Math.min(1, Math.sqrt(h)));
}

/** Normaliza um ângulo para o intervalo [0, 360). */
export function normalizeDegrees(deg: number): number {
  const d = deg % 360;
  return d < 0 ? d + 360 : d;
}

/**
 * Rumo (azimute) de A para B em graus: 0 = norte, 90 = leste, 180 = sul, 270 = oeste.
 * Usado quando o GPS não informa a direção (coords.heading).
 */
export function bearingDegrees(a: LatLng, b: LatLng): number {
  const lat1 = toRad(a.latitude);
  const lat2 = toRad(b.latitude);
  const dLon = toRad(b.longitude - a.longitude);
  const y = Math.sin(dLon) * Math.cos(lat2);
  const x = Math.cos(lat1) * Math.sin(lat2) - Math.sin(lat1) * Math.cos(lat2) * Math.cos(dLon);
  return normalizeDegrees(toDeg(Math.atan2(y, x)));
}

/** Pontos cardeais e colaterais em português (L = leste, O = oeste). */
export const CARDINAIS = ['N', 'NE', 'L', 'SE', 'S', 'SO', 'O', 'NO'] as const;
export type Cardinal = (typeof CARDINAIS)[number];

/**
 * Converte graus em um dos 8 pontos cardeais.
 * Cada ponto cobre 45°, centrado nele: N vai de 337,5° a 22,5°.
 */
export function toCardinal(deg: number): Cardinal {
  const index = Math.round(normalizeDegrees(deg) / 45) % 8;
  return CARDINAIS[index] as Cardinal;
}
