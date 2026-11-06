// Mais widgets para a tela de início (escolhidos nos Ajustes):
// Relógio, Bateria, Clima, Bússola, Mini player e Atalhos.

import { Image } from 'expo-image';
import type { ReactNode } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Svg, { Defs, LinearGradient, Rect, Stop } from 'react-native-svg';

import { colors, font, sizes, tabular } from '../config/theme';
import type { BatteryInfo } from '../hooks/useBattery';
import type { GpsState } from '../hooks/useGps';
import type { InstalledApp } from '../hooks/useInstalledApps';
import type { MediaState } from '../hooks/useMedia';
import { useWeather } from '../hooks/useWeather';
import { formatClock, formatDayMonth, formatWeekday } from '../lib/datetime';
import { formatBattery } from '../lib/format';
import { toCardinal } from '../lib/geo';
import { describeWeather, formatTemp } from '../lib/weather';
import { useAccent } from '../state/settings';
import {
  BoltIcon,
  MountainIcon,
  MusicIcon,
  NavArrowIcon,
  NextIcon,
  PauseIcon,
  PlayIcon,
  WeatherGlyph,
} from './icons';
import { Touch } from './Touch';

/** Cartão base dos widgets, com degradê leve no topo. */
function Card({ children, tint, style }: { children: ReactNode; tint?: string; style?: object }) {
  return (
    <View style={[styles.card, style]}>
      {tint ? (
        <Svg style={StyleSheet.absoluteFill} width="100%" height="100%" pointerEvents="none">
          <Defs>
            <LinearGradient id={`tint-${tint}`} x1="0" y1="0" x2="0.6" y2="1">
              <Stop offset="0" stopColor={tint} stopOpacity={0.3} />
              <Stop offset="1" stopColor={tint} stopOpacity={0} />
            </LinearGradient>
          </Defs>
          <Rect width="100%" height="100%" fill={`url(#tint-${tint})`} />
        </Svg>
      ) : null}
      {children}
    </View>
  );
}

const capitalize = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

// ---------- Relógio ----------

export function ClockWidget({ now }: { now: Date }) {
  const accent = useAccent();
  return (
    <Card tint={accent.main} style={styles.center}>
      <Text style={[font(46, '800'), tabular, styles.tight]} allowFontScaling={false} adjustsFontSizeToFit numberOfLines={1}>
        {formatClock(now)}
      </Text>
      <Text style={font(14, '700', colors.text)} allowFontScaling={false}>
        {capitalize(formatWeekday(now))}
      </Text>
      <Text style={font(12, '600', colors.text2)} allowFontScaling={false}>
        {formatDayMonth(now)}
      </Text>
    </Card>
  );
}

// ---------- Bateria ----------

const BATTERY_TEXT = {
  carregando: 'Carregando',
  'na-tomada': 'Na tomada',
  descarregando: 'Na bateria',
  'usb-fraca': 'USB fraca: a carga está caindo',
  desconhecido: '',
} as const;

export function BatteryWidget({ battery }: { battery: BatteryInfo }) {
  const level = Math.max(0, battery.level);
  const color = battery.alert ? colors.orange : battery.status === 'carregando' ? colors.green : colors.text;
  return (
    <Card tint={battery.alert ? colors.orange : colors.green}>
      <View style={styles.rowBetween}>
        <Text style={font(12, '800', colors.text2)} allowFontScaling={false}>
          BATERIA
        </Text>
        {battery.status === 'carregando' && <BoltIcon size={18} color={colors.green} />}
      </View>
      <Text style={[font(36, '800', color), tabular, styles.tight]} allowFontScaling={false}>
        {formatBattery(battery.level)}
      </Text>
      <View style={styles.batteryTrack}>
        <View style={[styles.batteryFill, { width: `${level * 100}%`, backgroundColor: color }]} />
      </View>
      <Text style={font(12, '600', battery.alert ? colors.orange : colors.text2)} numberOfLines={1} allowFontScaling={false}>
        {BATTERY_TEXT[battery.status]}
      </Text>
    </Card>
  );
}

// ---------- Clima ----------

export function WeatherWidget({ gps }: { gps: GpsState }) {
  const { weather, failed } = useWeather(gps.position);
  if (!weather) {
    return (
      <Card style={styles.center}>
        <WeatherGlyph name="nublado" size={40} />
        <Text style={[font(14, '600', colors.text2), styles.centerText]} allowFontScaling={false}>
          {!gps.position ? 'Esperando o GPS…' : failed ? 'Sem internet para o clima' : 'Buscando o clima…'}
        </Text>
      </Card>
    );
  }
  const { texto, icone } = describeWeather(weather.code, weather.isDay);
  return (
    <Card tint={weather.isDay ? '#0A84FF' : '#5E5CE6'}>
      <View style={styles.weatherRow}>
        <WeatherGlyph name={icone} size={46} />
        <Text style={[font(38, '800'), tabular]} allowFontScaling={false}>
          {formatTemp(weather.tempC)}
        </Text>
      </View>
      <Text style={font(14, '700')} numberOfLines={1} allowFontScaling={false}>
        {texto}
      </Text>
      {weather.minC !== null && weather.maxC !== null && (
        <Text style={[font(12, '600', colors.text2), tabular]} allowFontScaling={false}>
          mín {formatTemp(weather.minC)} · máx {formatTemp(weather.maxC)}
        </Text>
      )}
    </Card>
  );
}

// ---------- Bússola ----------

export function CompassWidget({ gps }: { gps: GpsState }) {
  const accent = useAccent();
  const heading = gps.status === 'ok' ? gps.trip.headingDeg : null;
  const altitude = gps.position?.altitude ?? null;
  return (
    <Card tint={accent.main}>
      <Text style={font(12, '800', colors.text2)} allowFontScaling={false}>
        DIREÇÃO
      </Text>
      <View style={styles.compassRow}>
        <View style={[styles.compassDial, { borderColor: accent.soft }]}>
          <NavArrowIcon size={28} color={heading === null ? colors.text3 : accent.soft} rotation={heading ?? 0} />
        </View>
        <View>
          <Text style={font(28, '800', heading === null ? colors.text3 : colors.text)} allowFontScaling={false}>
            {heading === null ? '--' : toCardinal(heading)}
          </Text>
          <Text style={[font(14, '700', colors.text2), tabular]} allowFontScaling={false}>
            {heading === null ? 'parado' : `${Math.round(heading)}°`}
          </Text>
        </View>
      </View>
      <View style={styles.altRow}>
        <MountainIcon size={16} color={colors.text2} />
        <Text style={[font(14, '700', colors.text2), tabular]} allowFontScaling={false}>
          {altitude === null ? 'altitude --' : `${Math.round(altitude)} m de altitude`}
        </Text>
      </View>
    </Card>
  );
}

// ---------- Mini player ----------

export function MiniPlayerWidget({
  media,
  playerIcon,
  onOpenMusic,
}: {
  media: MediaState;
  playerIcon: string | null;
  onOpenMusic: () => void;
}) {
  const np = media.nowPlaying;
  const art = np?.artworkRemoteUri ?? np?.artworkUri ?? null;
  return (
    <Card style={styles.miniCard}>
      {art ? (
        <Image source={art} style={StyleSheet.absoluteFill} contentFit="cover" blurRadius={50} />
      ) : null}
      <View style={[StyleSheet.absoluteFill, styles.miniShade]} />
      <View style={styles.miniRow}>
        <Touch onPress={onOpenMusic} accessibilityLabel="Abrir a tela de música" style={styles.miniTop}>
          <View style={styles.miniArt}>
            {art ? (
              <Image source={art} style={StyleSheet.absoluteFill} contentFit="cover" />
            ) : playerIcon ? (
              <Image source={playerIcon} style={styles.miniIcon} contentFit="contain" />
            ) : (
              <MusicIcon size={26} color={colors.text2} />
            )}
          </View>
          <View style={styles.flex1}>
            <Text style={font(15, '800')} numberOfLines={2} allowFontScaling={false}>
              {np?.title || 'Nada tocando'}
            </Text>
            <Text style={font(12, '600', colors.text2)} numberOfLines={1} allowFontScaling={false}>
              {np?.artist || np?.appName || 'Toque para escolher'}
            </Text>
          </View>
        </Touch>
        <Touch onPress={media.playPause} disabled={!media.available} accessibilityLabel={media.playing ? 'Pausar' : 'Tocar'} style={styles.miniPlay}>
          {media.playing ? <PauseIcon size={22} color="#000" /> : <PlayIcon size={24} color="#000" />}
        </Touch>
        <Touch onPress={media.next} disabled={!media.available} accessibilityLabel="Próxima música" visualSize={44} style={styles.miniNext}>
          <NextIcon size={26} color={colors.text} />
        </Touch>
      </View>
    </Card>
  );
}

// ---------- Atalhos ----------

export function ShortcutsWidget({ apps, onOpen }: { apps: InstalledApp[]; onOpen: (pkg: string) => void }) {
  const four = apps.slice(0, 4);
  return (
    <Card style={styles.shortcuts}>
      {four.length === 0 ? (
        <Text style={font(14, '600', colors.text2)}>Nenhum app para mostrar</Text>
      ) : (
        four.map((app) => (
          <Touch key={app.package} onPress={() => onOpen(app.package)} accessibilityLabel={`Abrir ${app.label}`} style={styles.shortcut}>
            <Image source={app.icon} style={styles.shortcutIcon} contentFit="contain" transition={0} />
            <Text style={font(11, '700', colors.text2)} numberOfLines={1} allowFontScaling={false}>
              {app.label}
            </Text>
          </Touch>
        ))
      )}
    </Card>
  );
}

/** Posição vazia (escolhida como "Nenhum" nos Ajustes). */
export function EmptyWidget() {
  return <View style={[styles.card, styles.empty]} />;
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    minHeight: 0,
    borderRadius: sizes.cardRadius,
    backgroundColor: colors.card,
    padding: 14,
    overflow: 'hidden',
    justifyContent: 'space-between',
  },
  empty: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
    borderStyle: 'dashed',
  },
  center: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
  },
  centerText: {
    textAlign: 'center',
    marginTop: 6,
  },
  tight: {
    includeFontPadding: false,
  },
  rowBetween: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  batteryTrack: {
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.fill,
    overflow: 'hidden',
  },
  batteryFill: {
    height: 8,
    borderRadius: 4,
  },
  weatherRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  compassRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  compassDial: {
    width: 52,
    height: 52,
    borderRadius: 26,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  altRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  miniCard: {
    padding: 12,
    justifyContent: 'center',
  },
  miniShade: {
    backgroundColor: 'rgba(0,0,0,0.45)',
  },
  miniRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  miniTop: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  miniArt: {
    width: 54,
    height: 54,
    borderRadius: 8,
    overflow: 'hidden',
    backgroundColor: colors.fill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  miniIcon: {
    width: 34,
    height: 34,
  },
  flex1: {
    flex: 1,
  },
  miniPlay: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: colors.text,
    alignItems: 'center',
    justifyContent: 'center',
  },
  miniNext: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  shortcuts: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingHorizontal: 6,
  },
  shortcut: {
    width: 64,
    alignItems: 'center',
    gap: 6,
    paddingVertical: 6,
    borderRadius: 16,
  },
  shortcutIcon: {
    width: 48,
    height: 48,
  },
});
