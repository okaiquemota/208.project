// Leitura do estado da bateria para o painel.
//
// Problema real: a USB de muitos carros entrega pouca corrente. Com GPS,
// tela no máximo e música, o celular pode gastar mais do que recebe e ir
// descarregando mesmo "plugado". Por isso, além do estado que o Android
// informa, acompanhamos o nível: se cair enquanto está na tomada, avisamos.

/** Mesmos valores do enum BatteryState do expo-battery. */
export const BATTERY_STATE = {
  UNKNOWN: 0,
  UNPLUGGED: 1,
  CHARGING: 2,
  FULL: 3,
  NOT_CHARGING: 4,
} as const;

export type BatteryStatus =
  /** Carregando normalmente. */
  | 'carregando'
  /** Na tomada e cheia (ou o Android pausou a carga para proteger a bateria). */
  | 'na-tomada'
  /** Fora da tomada: gastando bateria. */
  | 'descarregando'
  /** Na tomada, mas o nível está caindo: a USB não dá conta. */
  | 'usb-fraca'
  | 'desconhecido';

/** Quanto o nível pode cair (0 a 1) na tomada antes de avisar. 0,02 = 2 pontos. */
export const PLUGGED_DROP_ALERT = 0.02;

/** Acompanhamento do nível enquanto está na tomada. */
export type PluggedTracker = {
  plugged: boolean;
  /** Maior nível visto desde que foi plugado. */
  peakLevel: number;
};

export const isPluggedState = (state: number) =>
  state === BATTERY_STATE.CHARGING ||
  state === BATTERY_STATE.FULL ||
  state === BATTERY_STATE.NOT_CHARGING;

/** Atualiza o acompanhamento com uma leitura nova (função pura). */
export function trackPlugged(prev: PluggedTracker, level: number, state: number): PluggedTracker {
  const plugged = isPluggedState(state);
  if (!plugged || level < 0) return { plugged, peakLevel: plugged ? prev.peakLevel : 0 };
  // Acabou de plugar: começa a contar daqui.
  if (!prev.plugged) return { plugged: true, peakLevel: level };
  return { plugged: true, peakLevel: Math.max(prev.peakLevel, level) };
}

/** Decide o que mostrar a partir do estado do Android e do acompanhamento. */
export function batteryStatus(level: number, state: number, tracker: PluggedTracker): BatteryStatus {
  if (state === BATTERY_STATE.UNPLUGGED) return 'descarregando';
  if (!isPluggedState(state)) return 'desconhecido';
  if (level >= 0 && tracker.plugged && tracker.peakLevel - level >= PLUGGED_DROP_ALERT - 1e-9) {
    return 'usb-fraca';
  }
  return state === BATTERY_STATE.CHARGING ? 'carregando' : 'na-tomada';
}

/** Situações em que o painel destaca a bateria com a cor de alerta. */
export const isBatteryAlert = (status: BatteryStatus) =>
  status === 'descarregando' || status === 'usb-fraca';
