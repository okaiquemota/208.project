// Barra lateral preta, como no CarPlay/Android Auto: bateria e hora em cima,
// três apps fixos no meio e o botão que alterna painel ↔ apps embaixo.
// No modo compacto (tela dividida com o Waze), mostra também a velocidade.

import { Image } from 'expo-image';
import { StyleSheet, Text, View } from 'react-native';

import { colors, font, SPEED_ALERT_KMH, sizes, tabular } from '../config/theme';
import type { BatteryInfo } from '../hooks/useBattery';
import type { InstalledApp } from '../hooks/useInstalledApps';
import { formatClock } from '../lib/datetime';
import { formatBattery, formatKmh } from '../lib/format';
import { BatteryIcon, BoltIcon, DashboardIcon, GridIcon } from './icons';
import { Touch } from './Touch';

type Props = {
  now: Date;
  battery: BatteryInfo;
  dock: InstalledApp[];
  onOpenApp: (pkg: string) => void;
  page: 'painel' | 'apps';
  onTogglePage: () => void;
  /** Velocidade para mostrar no modo compacto (null = sem leitura). */
  speedKmh?: number | null;
  compact?: boolean;
};

const DOCK_ICON = 46;
const DOCK_BUTTON = 60;

export function Rail({ now, battery, dock, onOpenApp, page, onTogglePage, speedKmh, compact }: Props) {
  const batteryColor = battery.alert ? colors.orange : colors.text;
  const speedAlert = speedKmh != null && speedKmh > SPEED_ALERT_KMH;

  return (
    <View style={styles.rail}>
      <View style={styles.top}>
        <View style={styles.batteryRow}>
          {battery.status === 'carregando' && <BoltIcon size={12} color={colors.green} />}
          <BatteryIcon level={battery.level} color={batteryColor} width={22} />
          <Text style={[font(12, '700', batteryColor), tabular]} allowFontScaling={false}>
            {formatBattery(battery.level)}
          </Text>
        </View>
        {battery.alert && (
          <Text style={font(10, '700', colors.orange)} allowFontScaling={false}>
            {battery.status === 'usb-fraca' ? 'USB FRACA' : 'NA BATERIA'}
          </Text>
        )}
        <Text style={[font(23, '700'), tabular, styles.clock]} allowFontScaling={false}>
          {formatClock(now)}
        </Text>
        {compact && (
          <View style={styles.speed}>
            <Text
              style={[font(34, '800', speedKmh == null ? colors.text3 : speedAlert ? colors.red : colors.text), tabular]}
              allowFontScaling={false}
            >
              {speedKmh == null ? '--' : formatKmh(speedKmh)}
            </Text>
            <Text style={font(11, '700', colors.text2)} allowFontScaling={false}>
              KM/H
            </Text>
          </View>
        )}
      </View>

      <View style={styles.dock}>
        {dock.map((app) => (
          <Touch
            key={app.package}
            onPress={() => onOpenApp(app.package)}
            accessibilityLabel={`Abrir ${app.label}`}
            style={styles.dockButton}
          >
            <Image source={app.icon} style={styles.dockIcon} contentFit="contain" transition={0} />
          </Touch>
        ))}
      </View>

      <Touch
        onPress={onTogglePage}
        accessibilityLabel={page === 'painel' ? 'Mostrar todos os apps' : 'Voltar ao painel'}
        style={styles.toggle}
      >
        {page === 'painel' ? (
          <GridIcon size={30} color={colors.text} />
        ) : (
          <DashboardIcon size={30} color={colors.text} />
        )}
      </Touch>
    </View>
  );
}

const styles = StyleSheet.create({
  rail: {
    width: sizes.rail,
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
  },
  top: {
    alignItems: 'center',
    gap: 2,
  },
  batteryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  clock: {
    marginTop: 2,
  },
  speed: {
    alignItems: 'center',
    marginTop: 8,
  },
  dock: {
    alignItems: 'center',
    gap: 12,
  },
  dockButton: {
    width: DOCK_BUTTON,
    height: DOCK_BUTTON,
    borderRadius: DOCK_BUTTON / 2,
    backgroundColor: '#1F2025',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.10)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  dockIcon: {
    width: DOCK_ICON,
    height: DOCK_ICON,
  },
  toggle: {
    width: DOCK_BUTTON,
    height: DOCK_BUTTON,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
