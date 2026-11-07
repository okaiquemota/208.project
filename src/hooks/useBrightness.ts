// Brilho da tela do painel (expo-brightness). Vale só enquanto o painel está
// aberto: ao sair, o celular volta ao brilho dele. Não precisa de permissão.
// "Automático" devolve o controle ao celular (inclusive o brilho automático).

import * as ScreenBrightness from 'expo-brightness';
import { useCallback, useEffect, useState } from 'react';

import { type Brightness, stepBrightness } from '../lib/settings';
import { useSettings } from '../state/settings';
import { useAppActive } from './useAppActive';

export function useBrightness() {
  const { settings, update } = useSettings();
  const value = settings.brightness;
  // Brilho do celular (para os botões − e + começarem dele no automático).
  const [systemLevel, setSystemLevel] = useState(0.6);

  const apply = useCallback(() => {
    const done =
      value === 'auto' ? ScreenBrightness.restoreSystemBrightnessAsync() : ScreenBrightness.setBrightnessAsync(value);
    done.catch(() => undefined);
    if (value === 'auto') {
      ScreenBrightness.getBrightnessAsync()
        .then((b) => setSystemLevel(Math.round(b * 10) / 10))
        .catch(() => undefined);
    }
  }, [value]);

  useEffect(() => {
    apply();
  }, [apply]);
  // Voltando de outro app (ou da tela dividida), aplica de novo.
  useAppActive(apply);

  const set = useCallback((b: Brightness) => update((s) => ({ ...s, brightness: b })), [update]);
  const step = useCallback(
    (up: boolean) =>
      update((s) => ({ ...s, brightness: stepBrightness(s.brightness === 'auto' ? systemLevel : s.brightness, up) })),
    [update, systemLevel],
  );

  return { value, level: value === 'auto' ? systemLevel : value, set, step };
}

export type BrightnessState = ReturnType<typeof useBrightness>;
