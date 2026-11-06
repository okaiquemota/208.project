// Mais widgets da tela de início, no estilo dos widgets do CarPlay/iPhone:
// fundo liso, objetos reconhecíveis (relógio de ponteiros, calendário do
// mês, anel de bateria, bússola) e cor só nos detalhes.

import { Image } from 'expo-image';
import { useState } from 'react';
import { type LayoutChangeEvent, StyleSheet, Text, View } from 'react-native';
import Animated, { ZoomIn } from 'react-native-reanimated';

import { colors, font, sizes, tabular } from '../config/theme';
import type { BatteryInfo } from '../hooks/useBattery';
import type { GpsState } from '../hooks/useGps';
import type { InstalledApp } from '../hooks/useInstalledApps';
import type { MediaState } from '../hooks/useMedia';
import { useNow } from '../hooks/useNow';
import { useWeather } from '../hooks/useWeather';
import {
  DIAS_SEMANA_CURTOS,
  formatClock,
  formatDayMonth,
  formatWeekday,
  INICIAIS_SEMANA,
  MESES,
  monthGrid,
} from '../lib/datetime';
import { formatBattery } from '../lib/format';
import { toCardinal } from '../lib/geo';
import { describeWeather, formatTemp } from '../lib/weather';
import { useAccent } from '../state/settings';
import { AnalogClock, CompassDial, RingGauge } from './Dials';
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
import { enterText, exitFast } from './motion';
import { Touch } from './Touch';

/** Tamanho do espaço disponível (para os desenhos se ajustarem ao card). */
function useBox() {
  const [box, setBox] = useState({ w: 0, h: 0 });
  const onLayout = (e: LayoutChangeEvent) =>
    setBox({ w: e.nativeEvent.layout.width, h: e.nativeEvent.layout.height });
  return { box, onLayout };
}

const capitalize = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

// ---------- Relógio (ponteiros + hora digital) ----------

export function ClockWidget() {
  const accent = useAccent();
  const date = new Date(useNow(1000, true));
  const { box, onLayout } = useBox();
  const dial = Math.max(0, Math.min(box.h, box.w * 0.5));
  return (
    <View style={styles.card}>
      <View style={styles.row} onLayout={onLayout}>
        <AnalogClock size={dial} date={date} accent={accent.main} />
        <View style={styles.flex1}>
          <Text style={[font(30, '300'), tabular]} allowFontScaling={false}>
            {formatClock(date)}
          </Text>
          <Text style={font(14, '600')} numberOfLines={1} allowFontScaling={false}>
            {capitalize(formatWeekday(date))}
          </Text>
          <Text style={font(13, '500', colors.text2)} numberOfLines={1} allowFontScaling={false}>
            {formatDayMonth(date)}
          </Text>
        </View>
      </View>
    </View>
  );
}

// ---------- Calendário (dia de hoje + mês) ----------

export function CalendarWidget({ now }: { now: Date }) {
  const accent = useAccent();
  const weeks = monthGrid(now);
  const today = now.getDate();
  const { box, onLayout } = useBox();
  // Linhas: iniciais da semana + semanas do mês.
  const rowH = box.h > 0 ? box.h / (weeks.length + 1) : 14;
  const fs = Math.max(8, Math.min(12, rowH * 0.62));
  return (
    <View style={[styles.card, styles.row]}>
      <View style={styles.calLeft}>
        <Text style={font(13, '700', accent.main)} allowFontScaling={false}>
          {DIAS_SEMANA_CURTOS[now.getDay()]!.toUpperCase()}
        </Text>
        <Text style={[font(44, '300'), tabular, styles.calDay]} allowFontScaling={false}>
          {today}
        </Text>
        <Text style={font(12, '600', colors.text2)} allowFontScaling={false}>
          {capitalize(MESES[now.getMonth()]!)}
        </Text>
      </View>
      <View style={styles.calGrid} onLayout={onLayout}>
        <View style={[styles.calRow, { height: rowH }]}>
          {INICIAIS_SEMANA.map((d, i) => (
            <Text key={i} style={[font(fs, '700', colors.text3), styles.calCell]} allowFontScaling={false}>
              {d}
            </Text>
          ))}
        </View>
        {weeks.map((week, w) => (
          <View key={w} style={[styles.calRow, { height: rowH }]}>
            {week.map((d, i) => (
              <View key={i} style={styles.calCellBox}>
                {d === today ? (
                  <View
                    style={[
                      styles.calToday,
                      { backgroundColor: accent.main, width: rowH * 0.92, height: rowH * 0.92, borderRadius: rowH },
                    ]}
                  >
                    <Text style={[font(fs, '700'), tabular]} allowFontScaling={false}>
                      {d}
                    </Text>
                  </View>
                ) : (
                  <Text style={[font(fs, '500', i === 0 ? colors.text2 : colors.text), tabular]} allowFontScaling={false}>
                    {d ?? ''}
                  </Text>
                )}
              </View>
            ))}
          </View>
        ))}
      </View>
    </View>
  );
}

// ---------- Bateria (anel) ----------

const BATTERY_TEXT = {
  carregando: 'Carregando',
  'na-tomada': 'Na tomada',
  descarregando: 'Na bateria',
  'usb-fraca': 'USB fraca: a carga está caindo',
  desconhecido: 'Bateria do celular',
} as const;

export function BatteryWidget({ battery }: { battery: BatteryInfo }) {
  const { box, onLayout } = useBox();
  const ring = Math.max(0, Math.min(box.h, 96));
  const color = battery.alert ? colors.orange : battery.status === 'carregando' ? colors.green : colors.text;
  return (
    <View style={styles.card}>
      <View style={styles.row} onLayout={onLayout}>
        <RingGauge size={ring} ratio={Math.max(0, battery.level)} color={color} stroke={Math.max(6, ring * 0.09)}>
          <BoltIcon size={ring * 0.34} color={battery.status === 'carregando' ? colors.green : 'rgba(255,255,255,0.25)'} />
        </RingGauge>
        <View style={styles.flex1}>
          <Text style={[font(30, '300', battery.alert ? colors.orange : colors.text), tabular]} allowFontScaling={false}>
            {formatBattery(battery.level)}
          </Text>
          <Text style={font(14, '600', battery.alert ? colors.orange : colors.text2)} numberOfLines={2} allowFontScaling={false}>
            {BATTERY_TEXT[battery.status]}
          </Text>
        </View>
      </View>
    </View>
  );
}

// ---------- Clima ----------

export function WeatherWidget({ gps }: { gps: GpsState }) {
  const { weather, place, failed } = useWeather(gps.position);
  if (!weather) {
    return (
      <View style={[styles.card, styles.center]}>
        <Text style={[font(14, '600', colors.text2), styles.centerText]} allowFontScaling={false}>
          {!gps.position ? 'Esperando o GPS para o clima' : failed ? 'Sem internet para o clima' : 'Buscando o clima…'}
        </Text>
      </View>
    );
  }
  const { texto, icone } = describeWeather(weather.code, weather.isDay);
  return (
    <View style={styles.card}>
      <View style={styles.weatherTop}>
        <View style={styles.flex1}>
          <View style={styles.place}>
            <NavArrowIcon size={12} color={colors.text} rotation={45} />
            <Text style={font(14, '700')} numberOfLines={1} allowFontScaling={false}>
              {place ?? 'Aqui'}
            </Text>
          </View>
          <Text style={[font(46, '300'), tabular, styles.temp]} allowFontScaling={false}>
            {formatTemp(weather.tempC)}
          </Text>
        </View>
        <WeatherGlyph name={icone} size={44} />
      </View>
      <View>
        <Text style={font(13, '600')} numberOfLines={1} allowFontScaling={false}>
          {texto}
        </Text>
        {weather.minC !== null && weather.maxC !== null && (
          <Text style={[font(12, '500', colors.text2), tabular]} allowFontScaling={false}>
            {`Máx. ${formatTemp(weather.maxC)}  Mín. ${formatTemp(weather.minC)}`}
          </Text>
        )}
      </View>
    </View>
  );
}

// ---------- Bússola ----------

export function CompassWidget({ gps }: { gps: GpsState }) {
  const accent = useAccent();
  const { box, onLayout } = useBox();
  const dial = Math.max(0, Math.min(box.h, box.w * 0.5));
  const heading = gps.status === 'ok' ? gps.trip.headingDeg : null;
  const altitude = gps.position?.altitude ?? null;
  return (
    <View style={styles.card}>
      <View style={styles.row} onLayout={onLayout}>
        <CompassDial size={dial} heading={heading} accent={accent.main} />
        <View style={styles.flex1}>
          <Text style={font(30, '700', heading === null ? colors.text3 : colors.text)} allowFontScaling={false}>
            {heading === null ? '—' : toCardinal(heading)}
          </Text>
          <Text style={[font(15, '500', colors.text2), tabular]} allowFontScaling={false}>
            {heading === null ? 'parado' : `${Math.round(heading)}°`}
          </Text>
          <View style={styles.alt}>
            <MountainIcon size={14} color={colors.text3} />
            <Text style={[font(13, '600', colors.text2), tabular]} allowFontScaling={false}>
              {altitude === null ? '-- m' : `${Math.round(altitude)} m`}
            </Text>
          </View>
        </View>
      </View>
    </View>
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
    <View style={[styles.card, styles.miniCard]}>
      {art ? <Image source={art} style={StyleSheet.absoluteFill} contentFit="cover" blurRadius={50} /> : null}
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
          <Animated.View key={np?.title ?? 'nada'} entering={enterText} exiting={exitFast} style={styles.flex1}>
            <Text style={font(15, '700')} numberOfLines={2} allowFontScaling={false}>
              {np?.title || 'Nada tocando'}
            </Text>
            <Text style={font(12, '500', colors.text2)} numberOfLines={1} allowFontScaling={false}>
              {np?.artist || np?.appName || 'Toque para escolher'}
            </Text>
          </Animated.View>
        </Touch>
        <Touch
          onPress={media.playPause}
          disabled={!media.available}
          accessibilityLabel={media.playing ? 'Pausar' : 'Tocar'}
          pressScale={0.88}
          style={styles.miniPlay}
        >
          <Animated.View key={media.playing ? 'pause' : 'play'} entering={ZoomIn.springify().damping(14)}>
            {media.playing ? <PauseIcon size={22} color="#000" /> : <PlayIcon size={24} color="#000" />}
          </Animated.View>
        </Touch>
        <Touch
          onPress={media.next}
          disabled={!media.available}
          accessibilityLabel="Próxima música"
          visualSize={44}
          style={styles.miniNext}
        >
          <NextIcon size={26} color={colors.text} />
        </Touch>
      </View>
    </View>
  );
}

// ---------- Atalhos ----------

export function ShortcutsWidget({ apps, onOpen }: { apps: InstalledApp[]; onOpen: (pkg: string) => void }) {
  const four = apps.slice(0, 4);
  return (
    <View style={[styles.card, styles.shortcuts]}>
      {four.length === 0 ? (
        <Text style={font(14, '600', colors.text2)}>Nenhum app para mostrar</Text>
      ) : (
        four.map((app) => (
          <Touch
            key={app.package}
            onPress={() => onOpen(app.package)}
            accessibilityLabel={`Abrir ${app.label}`}
            style={styles.shortcut}
          >
            <Image source={app.icon} style={styles.shortcutIcon} contentFit="contain" transition={0} />
            <Text style={font(11, '600', colors.text2)} numberOfLines={1} allowFontScaling={false}>
              {app.label}
            </Text>
          </Touch>
        ))
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    minHeight: 0,
    borderRadius: sizes.cardRadius,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    padding: 14,
    overflow: 'hidden',
    justifyContent: 'space-between',
  },
  center: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  centerText: {
    textAlign: 'center',
  },
  row: {
    flex: 1,
    minHeight: 0,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  flex1: {
    flex: 1,
  },
  calLeft: {
    width: 64,
    justifyContent: 'center',
  },
  calDay: {
    marginVertical: -2,
  },
  calGrid: {
    flex: 1,
    alignSelf: 'stretch',
    justifyContent: 'center',
  },
  calRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  calCell: {
    flex: 1,
    textAlign: 'center',
  },
  calCellBox: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  calToday: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  weatherTop: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  place: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  temp: {
    marginTop: -2,
  },
  alt: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginTop: 6,
  },
  miniCard: {
    padding: 12,
    justifyContent: 'center',
  },
  miniShade: {
    backgroundColor: 'rgba(0,0,0,0.5)',
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
