// Barra lateral preta, como no CarPlay/Android Auto:
// - em cima: bateria, hora e data (e a velocidade, no modo compacto);
// - no meio: navegação (Início, Música, Apps) e os apps fixos (dock).

import { Image } from 'expo-image';
import type { ReactNode } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { colors, font, sizes, tabular } from '../config/theme';
import type { BatteryInfo } from '../hooks/useBattery';
import type { InstalledApp } from '../hooks/useInstalledApps';
import { formatClock, formatDateShort } from '../lib/datetime';
import { formatBattery, formatKmh } from '../lib/format';
import { useAccent, useSettings } from '../state/settings';
import { BatteryIcon, BoltIcon, GridIcon, HomeIcon, MusicIcon } from './icons';
import { Touch } from './Touch';

export type Page = 'inicio' | 'musica' | 'apps' | 'ajustes';

type Props = {
  now: Date;
  battery: BatteryInfo;
  dock: InstalledApp[];
  onOpenApp: (pkg: string) => void;
  page: Page;
  onNavigate: (page: Page) => void;
  /** Velocidade para mostrar no modo compacto (null = sem leitura). */
  speedKmh?: number | null;
  compact?: boolean;
};

const BUTTON = 56;

export function Rail({ now, battery, dock, onOpenApp, page, onNavigate, speedKmh, compact }: Props) {
  const accent = useAccent();
  const { speedAlertKmh } = useSettings().settings;
  const batteryColor = battery.alert ? colors.orange : colors.text;
  const speedAlert = speedKmh != null && speedAlertKmh > 0 && speedKmh > speedAlertKmh;

  const nav: { page: Page; label: string; icon: (color: string) => ReactNode }[] = [
    { page: 'inicio', label: 'Início', icon: (c) => <HomeIcon size={28} color={c} /> },
    { page: 'musica', label: 'Música', icon: (c) => <MusicIcon size={26} color={c} /> },
    { page: 'apps', label: 'Apps e ajustes', icon: (c) => <GridIcon size={26} color={c} /> },
  ];

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
        <Text style={[font(23, '700'), tabular]} allowFontScaling={false}>
          {formatClock(now)}
        </Text>
        {!battery.alert && (
          <Text style={font(11, '600', colors.text2)} numberOfLines={1} allowFontScaling={false}>
            {formatDateShort(now)}
          </Text>
        )}
        {compact && (
          <View style={styles.speed}>
            <Text
              style={[font(32, '800', speedKmh == null ? colors.text3 : speedAlert ? colors.red : colors.text), tabular]}
              allowFontScaling={false}
            >
              {speedKmh == null ? '--' : formatKmh(speedKmh)}
            </Text>
            <Text style={font(10, '700', colors.text2)} allowFontScaling={false}>
              KM/H
            </Text>
          </View>
        )}
      </View>

      <View style={styles.buttons}>
        {nav.map((item) => {
          const active = page === item.page || (item.page === 'apps' && page === 'ajustes');
          return (
            <Touch
              key={item.page}
              onPress={() => onNavigate(item.page)}
              accessibilityLabel={item.label}
              style={[styles.navButton, active && { backgroundColor: accent.main }]}
            >
              {item.icon(colors.text)}
            </Touch>
          );
        })}
        {!compact &&
          dock.slice(0, 2).map((app) => (
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
    </View>
  );
}

const styles = StyleSheet.create({
  rail: {
    width: sizes.rail,
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 6,
  },
  top: {
    alignItems: 'center',
    gap: 1,
  },
  batteryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  speed: {
    alignItems: 'center',
    marginTop: 6,
  },
  buttons: {
    alignItems: 'center',
    gap: 6,
  },
  navButton: {
    width: BUTTON,
    height: BUTTON,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dockButton: {
    width: BUTTON,
    height: BUTTON,
    borderRadius: BUTTON / 2,
    backgroundColor: '#1F2025',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.10)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  dockIcon: {
    width: 42,
    height: 42,
  },
});
