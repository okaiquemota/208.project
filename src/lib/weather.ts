// Clima pelo Open-Meteo (gratuito, sem cadastro nem chave).
// Aqui ficam as partes puras: montar o endereço, ler a resposta e traduzir
// o código do tempo (padrão WMO) para texto e ícone em português.

export type WeatherIcon = 'sol' | 'lua' | 'parcial' | 'nublado' | 'neblina' | 'garoa' | 'chuva' | 'tempestade' | 'neve';

export type Weather = {
  tempC: number;
  minC: number | null;
  maxC: number | null;
  code: number;
  isDay: boolean;
  /** Quando foi buscado (Date.now). */
  fetchedAt: number;
  latitude: number;
  longitude: number;
};

/** Endereço da previsão para um ponto (temperatura atual, código do tempo e mín/máx do dia). */
export function weatherUrl(latitude: number, longitude: number): string {
  const lat = latitude.toFixed(3);
  const lon = longitude.toFixed(3);
  return (
    `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}` +
    '&current=temperature_2m,weather_code,is_day' +
    '&daily=temperature_2m_max,temperature_2m_min&forecast_days=1&timezone=auto'
  );
}

const finite = (v: unknown): number | null => (typeof v === 'number' && Number.isFinite(v) ? v : null);

/** Lê a resposta do Open-Meteo. Devolve null se faltar o essencial. */
export function parseWeather(json: unknown, latitude: number, longitude: number, now: number): Weather | null {
  if (typeof json !== 'object' || json === null) return null;
  const j = json as Record<string, any>;
  const temp = finite(j.current?.temperature_2m);
  const code = finite(j.current?.weather_code);
  if (temp === null || code === null) return null;
  return {
    tempC: temp,
    code,
    isDay: j.current?.is_day !== 0,
    minC: finite(j.daily?.temperature_2m_min?.[0]),
    maxC: finite(j.daily?.temperature_2m_max?.[0]),
    fetchedAt: now,
    latitude,
    longitude,
  };
}

/** Código do tempo (WMO) → texto curto e ícone. */
export function describeWeather(code: number, isDay: boolean): { texto: string; icone: WeatherIcon } {
  if (code === 0) return { texto: isDay ? 'Céu limpo' : 'Noite limpa', icone: isDay ? 'sol' : 'lua' };
  if (code === 1 || code === 2) return { texto: 'Parcialmente nublado', icone: isDay ? 'parcial' : 'nublado' };
  if (code === 3) return { texto: 'Nublado', icone: 'nublado' };
  if (code === 45 || code === 48) return { texto: 'Neblina', icone: 'neblina' };
  if (code >= 51 && code <= 57) return { texto: 'Garoa', icone: 'garoa' };
  if ((code >= 61 && code <= 67) || (code >= 80 && code <= 82)) {
    return { texto: code === 65 || code === 82 ? 'Chuva forte' : 'Chuva', icone: 'chuva' };
  }
  if ((code >= 71 && code <= 77) || code === 85 || code === 86) return { texto: 'Neve', icone: 'neve' };
  if (code >= 95) return { texto: 'Tempestade', icone: 'tempestade' };
  return { texto: 'Tempo instável', icone: 'nublado' };
}

/** Temperatura arredondada com o símbolo: 23.6 → "24°". */
export const formatTemp = (c: number) => `${Math.round(c)}°`;

/** De quanto em quanto tempo atualizar o clima. */
export const WEATHER_REFRESH_MS = 20 * 60_000;

/**
 * Precisa buscar de novo? Sim se nunca buscou, se passou o tempo de
 * atualização ou se o carro andou mais de ~10 km desde a última busca.
 */
export function needsWeatherRefresh(
  last: Weather | null,
  latitude: number,
  longitude: number,
  now: number,
): boolean {
  if (!last) return true;
  if (now - last.fetchedAt >= WEATHER_REFRESH_MS) return true;
  // ~0,09° ≈ 10 km (aproximação simples, suficiente para clima).
  return Math.abs(last.latitude - latitude) > 0.09 || Math.abs(last.longitude - longitude) > 0.09;
}
