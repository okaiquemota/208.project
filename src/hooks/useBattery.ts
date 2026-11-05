import { useBatteryLevel, useBatteryState } from 'expo-battery';
import { useState } from 'react';

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

const UNPLUGGED: PluggedTracker = { plugged: false, peakLevel: 0 };

/** Bateria do M51: nível, se está carregando e se a USB do carro está dando conta. */
export function useBattery(): BatteryInfo {
  const level = useBatteryLevel();
  const state = useBatteryState();

  // Acompanhamento do nível na tomada. Atualizado durante a renderização
  // quando chega leitura nova (padrão do React para "estado derivado").
  const [seen, setSeen] = useState(() => ({
    level,
    state,
    tracker: trackPlugged(UNPLUGGED, level, state),
  }));
  let tracker = seen.tracker;
  if (seen.level !== level || seen.state !== state) {
    tracker = trackPlugged(seen.tracker, level, state);
    setSeen({ level, state, tracker });
  }

  const status = batteryStatus(level, state, tracker);
  return { level, status, alert: isBatteryAlert(status) };
}
