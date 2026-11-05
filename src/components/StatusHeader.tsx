// Topo da coluna direita: relógio grande, data, bateria e status do GPS.

import { StyleSheet, Text, View } from 'react-native';

import { colors, tabular } from '../config/theme';
import type { BatteryInfo } from '../hooks/useBattery';
import type { GpsStatus } from '../hooks/useGps';
import type { BatteryStatus } from '../lib/battery';
import { formatClock, formatDayMonth, formatWeekday } from '../lib/datetime';
import { formatBattery } from '../lib/format';
import { DEFAULT_RULES } from '../lib/trip';
import { BatteryIcon, BoltIcon } from './icons';

type Props = {
  now: Date;
  battery: BatteryInfo;
  gpsStatus: GpsStatus;
  accuracyM: number | null;
};

export function StatusHeader({ now, battery, gpsStatus, accuracyM }: Props) {
  return (
    <View style={styles.row}>
      <Text style={[styles.clock, tabular]} allowFontScaling={false}>
        {formatClock(now)}
      </Text>
      <View style={styles.dateBox}>
        <Text style={styles.weekday} numberOfLines={1} allowFontScaling={false}>
          {formatWeekday(now)}
        </Text>
        <Text style={styles.date} numberOfLines={1} allowFontScaling={false}>
          {formatDayMonth(now)}
        </Text>
      </View>
      <View style={styles.right}>
        <BatteryBadge battery={battery} />
        <GpsBadge status={gpsStatus} accuracyM={accuracyM} />
      </View>
    </View>
  );
}

const BATTERY_LABEL: Record<BatteryStatus, string> = {
  carregando: 'carregando',
  'na-tomada': 'na tomada',
  descarregando: 'descarregando',
  'usb-fraca': 'USB fraca',
  desconhecido: '',
};

function BatteryBadge({ battery }: { battery: BatteryInfo }) {
  const color = battery.alert ? colors.alert : colors.text;
  const label = BATTERY_LABEL[battery.status];
  return (
    <View style={styles.badge}>
      {battery.status === 'carregando' && <BoltIcon size={16} color={colors.accent} />}
      <BatteryIcon level={battery.level} color={color} width={28} />
      <Text style={[styles.badgeValue, tabular, { color }]} allowFontScaling={false}>
        {formatBattery(battery.level)}
      </Text>
      {label !== '' && (
        <Text
          style={[styles.badgeLabel, battery.alert && styles.alertLabel]}
          allowFontScaling={false}
        >
          {label}
        </Text>
      )}
    </View>
  );
}

function gpsText(status: GpsStatus, accuracyM: number | null): { text: string; color: string } {
  switch (status) {
    case 'ok': {
      const acc = accuracyM === null ? '' : ` ±${Math.round(accuracyM)} m`;
      const weak = accuracyM !== null && accuracyM > DEFAULT_RULES.maxAccuracyM;
      return weak
        ? { text: `GPS fraco${acc}`, color: colors.textDim }
        : { text: `GPS${acc}`, color: colors.accent };
    }
    case 'procurando':
      return { text: 'Sem sinal do GPS', color: colors.textDim };
    case 'desligado':
      return { text: 'GPS desligado', color: colors.alert };
    case 'sem-permissao':
      return { text: 'GPS sem permissão', color: colors.alert };
    case 'iniciando':
      return { text: 'Iniciando GPS', color: colors.textDim };
  }
}

function GpsBadge({ status, accuracyM }: { status: GpsStatus; accuracyM: number | null }) {
  const { text, color } = gpsText(status, accuracyM);
  return (
    <View style={styles.badge}>
      <View style={[styles.dot, { backgroundColor: color }]} />
      <Text style={[styles.badgeLabel, tabular, { color }]} allowFontScaling={false}>
        {text}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  clock: {
    color: colors.text,
    fontSize: 50,
    lineHeight: 56,
    fontWeight: '700',
    includeFontPadding: false,
  },
  dateBox: {
    flex: 1,
  },
  weekday: {
    color: colors.text,
    fontSize: 17,
    fontWeight: '600',
  },
  date: {
    color: colors.textDim,
    fontSize: 16,
    fontWeight: '500',
  },
  right: {
    alignItems: 'flex-end',
    gap: 4,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  badgeValue: {
    fontSize: 18,
    fontWeight: '700',
  },
  badgeLabel: {
    color: colors.textDim,
    fontSize: 14,
    fontWeight: '600',
  },
  alertLabel: {
    color: colors.alert,
  },
  dot: {
    width: 9,
    height: 9,
    borderRadius: 5,
  },
});
