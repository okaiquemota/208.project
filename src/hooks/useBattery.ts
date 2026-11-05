import { useBatteryLevel, useBatteryState } from 'expo-battery';
import { useEffect, useState } from 'react';

import {
  batteryStatus,
  type BatteryStatus,
  isBatteryAlert,
  type PluggedTracker,
  trackPlugged,
} from '../lib/battery';

export type BatteryInfo = {
  /** Nível de 0 a 1 (ou -1 se indisponível). */
  level: number;
  status: BatteryStatus;
  /** true quando deve aparecer em destaque (descarregando ou USB fraca). */
  alert: boolean;
};

/** Bateria do M51: nível, se está carregando e se a USB do carro está dando conta. */
export function useBattery(): BatteryInfo {
  const level = useBatteryLevel();
  const state = useBatteryState();
  const [tracker, setTracker] = useState<PluggedTracker>({ plugged: false, peakLevel: 0 });

  useEffect(() => {
    setTracker((prev) => trackPlugged(prev, level, state));
  }, [level, state]);

  const status = batteryStatus(level, state, tracker);
  return { level, status, alert: isBatteryAlert(status) };
}
