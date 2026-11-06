// Clima onde o carro está (Open-Meteo). Só roda quando o widget de clima
// está na tela, e busca de novo a cada 20 min ou quando o carro anda ~10 km.

import { useEffect, useRef, useState } from 'react';

import { needsWeatherRefresh, parseWeather, type Weather, weatherUrl } from '../lib/weather';
import type { GpsPosition } from './useGps';

/** De quanto em quanto tempo conferimos se precisa atualizar (parado). */
const CHECK_MS = 60_000;

export type WeatherState = {
  weather: Weather | null;
  /** A última busca falhou (sem internet?). */
  failed: boolean;
};

export function useWeather(position: GpsPosition | null): WeatherState {
  const [weather, setWeather] = useState<Weather | null>(null);
  const [failed, setFailed] = useState(false);
  const [tick, setTick] = useState(0);
  const last = useRef<Weather | null>(null);
  const busy = useRef(false);
  const mounted = useRef(true);

  useEffect(() => {
    mounted.current = true;
    const id = setInterval(() => setTick((t) => t + 1), CHECK_MS);
    return () => {
      mounted.current = false;
      clearInterval(id);
    };
  }, []);

  // Arredonda a posição: não precisa reavaliar a cada metro andado.
  const lat = position ? Math.round(position.latitude * 100) / 100 : null;
  const lon = position ? Math.round(position.longitude * 100) / 100 : null;

  useEffect(() => {
    if (lat === null || lon === null || busy.current) return;
    if (!needsWeatherRefresh(last.current, lat, lon, Date.now())) return;
    busy.current = true;
    fetch(weatherUrl(lat, lon))
      .then((r) => r.json())
      .then((json) => {
        const w = parseWeather(json, lat, lon, Date.now());
        if (!w) throw new Error('resposta sem clima');
        last.current = w;
        if (mounted.current) {
          setWeather(w);
          setFailed(false);
        }
      })
      .catch(() => {
        if (mounted.current) setFailed(true);
      })
      .finally(() => {
        busy.current = false;
      });
  }, [lat, lon, tick]);

  return { weather, failed };
}
