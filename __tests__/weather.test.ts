import {
  describeWeather,
  formatTemp,
  needsWeatherRefresh,
  parseWeather,
  WEATHER_REFRESH_MS,
  weatherUrl,
} from '../src/lib/weather';

describe('clima', () => {
  it('monta o endereço do Open-Meteo com 3 casas na posição', () => {
    const url = weatherUrl(-23.55052, -46.633308);
    expect(url).toContain('latitude=-23.551');
    expect(url).toContain('longitude=-46.633');
    expect(url).toContain('current=temperature_2m,weather_code,is_day');
    expect(url.startsWith('https://api.open-meteo.com/')).toBe(true);
  });

  it('lê a resposta', () => {
    const w = parseWeather(
      {
        current: { temperature_2m: 23.6, weather_code: 3, is_day: 1 },
        daily: { temperature_2m_min: [17.2], temperature_2m_max: [27.9] },
      },
      -23.5,
      -46.6,
      1000,
    );
    expect(w).toEqual({
      tempC: 23.6,
      code: 3,
      isDay: true,
      minC: 17.2,
      maxC: 27.9,
      fetchedAt: 1000,
      latitude: -23.5,
      longitude: -46.6,
    });
  });

  it('resposta sem o essencial vira null; sem mín/máx ainda serve', () => {
    expect(parseWeather({}, 0, 0, 0)).toBeNull();
    expect(parseWeather(null, 0, 0, 0)).toBeNull();
    const w = parseWeather({ current: { temperature_2m: 10, weather_code: 0, is_day: 0 } }, 0, 0, 0);
    expect(w?.minC).toBeNull();
    expect(w?.isDay).toBe(false);
  });

  it('traduz os códigos do tempo', () => {
    expect(describeWeather(0, true)).toEqual({ texto: 'Céu limpo', icone: 'sol' });
    expect(describeWeather(0, false).icone).toBe('lua');
    expect(describeWeather(2, true).icone).toBe('parcial');
    expect(describeWeather(3, true).texto).toBe('Nublado');
    expect(describeWeather(45, true).icone).toBe('neblina');
    expect(describeWeather(53, true).icone).toBe('garoa');
    expect(describeWeather(63, true)).toEqual({ texto: 'Chuva', icone: 'chuva' });
    expect(describeWeather(82, true).texto).toBe('Chuva forte');
    expect(describeWeather(95, true).icone).toBe('tempestade');
    expect(describeWeather(73, true).icone).toBe('neve');
  });

  it('formata a temperatura', () => {
    expect(formatTemp(23.6)).toBe('24°');
    expect(formatTemp(-0.4)).toBe('0°');
    expect(formatTemp(-0.6)).toBe('-1°');
  });

  it('decide quando buscar de novo', () => {
    const last = { tempC: 20, code: 0, isDay: true, minC: null, maxC: null, fetchedAt: 0, latitude: -23.5, longitude: -46.6 };
    expect(needsWeatherRefresh(null, 0, 0, 0)).toBe(true);
    expect(needsWeatherRefresh(last, -23.5, -46.6, 60_000)).toBe(false);
    expect(needsWeatherRefresh(last, -23.5, -46.6, WEATHER_REFRESH_MS)).toBe(true);
    expect(needsWeatherRefresh(last, -23.7, -46.6, 60_000)).toBe(true);
  });
});
