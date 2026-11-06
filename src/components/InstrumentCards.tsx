// Widgets da coluna ao lado do player, com cara de painel de carro:
// - SpeedWidget: velocidade grande, barra de "LEDs", bússola e sinal do GPS;
// - TripWidget: distância, tempo, média e máxima com ícones (segure para zerar);
// - VolumeWidget: volume da música com barra em degraus.

import { useEffect, useRef, useState } from 'react';
import { StyleSheet, Text, Vibration, View } from 'react-native';
import Svg, { Defs, RadialGradient, Rect, Stop } from 'react-native-svg';

import { colors, font, SPEED_MAX_KMH, sizes, tabular } from '../config/theme';
import type { GpsState } from '../hooks/useGps';
import type { MediaState } from '../hooks/useMedia';
import { formatDuration, formatKm, formatKmh } from '../lib/format';
import { toCardinal } from '../lib/geo';
import { averageKmh } from '../lib/trip';
import { gpsSignalBars, speedLeds, volumeSegments } from '../lib/widgets';
import { useAccent, useSettings } from '../state/settings';
import {
  ClockIcon,
  GaugeIcon,
  NavArrowIcon,
  PeakIcon,
  RouteIcon,
  SignalBars,
  VolumeDownIcon,
  VolumeUpIcon,
} from './icons';
import { Touch } from './Touch';

// ---------- Velocidade ----------

const LED_COUNT = 24;

/** Velocidade. `large` = versão do card principal (número enorme). */
export function SpeedWidget({ gps, large }: { gps: GpsState; large?: boolean }) {
  const { status, trip } = gps;
  const accent = useAccent();
  const { speedAlertKmh } = useSettings().settings;
  // 0 nos Ajustes = sem alerta (nunca fica vermelho).
  const alertAt = speedAlertKmh > 0 ? speedAlertKmh : Number.POSITIVE_INFINITY;
  const live = status === 'ok';
  const speed = live ? trip.speedKmh : null;
  const alert = speed !== null && speed > alertAt;
  const heading = trip.headingDeg;
  const leds = speedLeds(speed, SPEED_MAX_KMH, alertAt, LED_COUNT);
  const glow = alert ? colors.red : accent.main;
  const numberSize = large ? 150 : 68;

  return (
    <View style={[styles.card, large && styles.cardLarge]}>
      {/* Brilho suave atrás do número */}
      <Svg style={StyleSheet.absoluteFill} width="100%" height="100%" pointerEvents="none">
        <Defs>
          <RadialGradient id={large ? 'speed-glow-l' : 'speed-glow'} cx="30%" cy="55%" r="70%">
            <Stop offset="0" stopColor={glow} stopOpacity={live ? 0.28 : 0.08} />
            <Stop offset="1" stopColor={glow} stopOpacity={0} />
          </RadialGradient>
        </Defs>
        <Rect width="100%" height="100%" fill={`url(#${large ? 'speed-glow-l' : 'speed-glow'})`} />
      </Svg>

      <View style={styles.speedHeader}>
        {live && heading !== null ? (
          <View style={styles.compass}>
            <NavArrowIcon size={large ? 22 : 16} color={accent.soft} rotation={heading} />
            <Text style={font(large ? 22 : 15, '800')} allowFontScaling={false}>
              {toCardinal(heading)}
            </Text>
          </View>
        ) : (
          <Text style={font(large ? 16 : 13, '700', colors.text2)} allowFontScaling={false}>
            VELOCIDADE
          </Text>
        )}
        <GpsStatus gps={gps} />
      </View>

      {status === 'sem-permissao' ? (
        <Notice
          text="Permita a localização para ver a velocidade"
          action={gps.canAskAgain ? 'Permitir' : 'Configurações'}
          onAction={gps.requestPermission}
        />
      ) : status === 'desligado' ? (
        <Notice text="GPS desligado" action="Ligar" onAction={gps.openLocationSettings} />
      ) : (
        <>
          <View style={[styles.speedRow, large && styles.speedRowLarge]}>
            <Text
              style={[
                font(numberSize, '800', speed === null ? colors.text3 : alert ? colors.red : colors.text),
                tabular,
                { lineHeight: numberSize * 1.12 },
              ]}
              allowFontScaling={false}
            >
              {speed === null ? '--' : formatKmh(speed)}
            </Text>
            <Text style={font(large ? 26 : 17, '700', colors.text2)} allowFontScaling={false}>
              km/h
            </Text>
          </View>
          <View style={[styles.leds, large && styles.ledsLarge]}>
            {leds.map((led, i) => (
              <View
                key={i}
                style={[
                  styles.led,
                  {
                    backgroundColor: led.on
                      ? led.alert
                        ? ledAlertColor(i)
                        : i < LED_COUNT * 0.3
                          ? accent.main
                          : accent.soft
                      : colors.fill,
                  },
                ]}
              />
            ))}
          </View>
        </>
      )}
    </View>
  );
}

/** LEDs acima do limite: laranja → vermelho. */
const ledAlertColor = (i: number) => (i < LED_COUNT * 0.8 ? colors.orange : colors.red);

function GpsStatus({ gps }: { gps: GpsState }) {
  let text: string;
  let color: string = colors.text2;
  switch (gps.status) {
    case 'ok':
      text = gps.accuracyM === null ? 'GPS' : `±${Math.round(gps.accuracyM)} m`;
      break;
    case 'procurando':
      text = 'Procurando…';
      break;
    case 'iniciando':
      text = 'Iniciando…';
      break;
    case 'desligado':
      text = 'Desligado';
      color = colors.red;
      break;
    case 'sem-permissao':
      text = 'Sem permissão';
      color = colors.red;
      break;
  }
  const bars = gps.status === 'ok' ? gpsSignalBars(gps.accuracyM) : 0;
  return (
    <View style={styles.gps}>
      <SignalBars bars={bars} color={bars >= 2 ? colors.green : bars === 1 ? colors.orange : colors.text3} />
      <Text style={[font(12, '700', color), tabular]} allowFontScaling={false}>
        {text}
      </Text>
    </View>
  );
}

function Notice({ text, action, onAction }: { text: string; action: string; onAction: () => void }) {
  return (
    <View style={styles.notice}>
      <Text style={[font(15, '700', colors.text), styles.noticeText]} numberOfLines={2}>
        {text}
      </Text>
      <Touch onPress={onAction} accessibilityLabel={action} style={styles.noticeButton}>
        <Text style={font(15, '800', '#000')}>{action}</Text>
      </Touch>
    </View>
  );
}

// ---------- Viagem ----------

const LONG_PRESS_MS = 800;
const FLASH_MS = 1500;

export function TripWidget({ gps }: { gps: GpsState }) {
  const { trip } = gps;
  const [justReset, setJustReset] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current);
    },
    [],
  );

  const handleLongPress = () => {
    gps.resetTrip();
    Vibration.vibrate(40);
    setJustReset(true);
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => setJustReset(false), FLASH_MS);
  };

  const cells = [
    { label: 'Distância', value: formatKm(trip.distanceM), unit: 'km', Icon: RouteIcon, color: '#0A84FF' },
    { label: 'Tempo', value: formatDuration(trip.movingMs), unit: '', Icon: ClockIcon, color: '#BF5AF2' },
    { label: 'Média', value: formatKmh(averageKmh(trip)), unit: 'km/h', Icon: GaugeIcon, color: '#30D158' },
    { label: 'Máxima', value: formatKmh(trip.maxKmh), unit: 'km/h', Icon: PeakIcon, color: '#FF9F0A' },
  ];

  return (
    <Touch
      onLongPress={handleLongPress}
      delayLongPress={LONG_PRESS_MS}
      accessibilityLabel="Dados da viagem"
      accessibilityHint="Segure para zerar a viagem"
      style={[styles.card, styles.tripCard]}
    >
      <View style={styles.tripHeader}>
        <Text style={font(12, '800', colors.text2)} allowFontScaling={false}>
          VIAGEM
        </Text>
        <Text style={font(11, '600', justReset ? colors.green : colors.text3)} allowFontScaling={false}>
          {justReset ? 'zerada ✓' : 'segure para zerar'}
        </Text>
      </View>
      <View style={styles.grid}>
        {cells.map(({ label, value, unit, Icon, color }) => (
          <View key={label} style={styles.cell}>
            <View style={[styles.iconCircle, { backgroundColor: `${color}2E` }]}>
              <Icon size={17} color={color} />
            </View>
            <View style={styles.cellText}>
              <View style={styles.valueRow}>
                <Text
                  style={[font(21, '800'), tabular]}
                  numberOfLines={1}
                  adjustsFontSizeToFit
                  minimumFontScale={0.7}
                  allowFontScaling={false}
                >
                  {value}
                </Text>
                {unit !== '' && (
                  <Text style={font(11, '700', colors.text2)} allowFontScaling={false}>
                    {unit}
                  </Text>
                )}
              </View>
              <Text style={font(11, '600', colors.text3)} allowFontScaling={false}>
                {label}
              </Text>
            </View>
          </View>
        ))}
      </View>
    </Touch>
  );
}

// ---------- Volume ----------

const VOLUME_STEPS = 15;

export function VolumeWidget({ media }: { media: MediaState }) {
  const accent = useAccent();
  const segments = volumeSegments(media.volume.current, media.volume.max, VOLUME_STEPS);
  return (
    <View style={[styles.card, styles.volumeCard]}>
      <Touch
        onPress={media.volumeDown}
        disabled={!media.available}
        accessibilityLabel="Diminuir volume"
        visualSize={48}
        style={styles.volumeButton}
      >
        <VolumeDownIcon size={26} color={colors.text} />
      </Touch>
      <View style={styles.volumeBars} accessibilityLabel={`Volume ${media.volume.current} de ${media.volume.max}`}>
        {segments.map((on, i) => (
          <View
            key={i}
            style={[
              styles.volumeBar,
              { height: 8 + (i / (VOLUME_STEPS - 1)) * 20, backgroundColor: on ? accent.soft : colors.fill },
            ]}
          />
        ))}
      </View>
      <Touch
        onPress={media.volumeUp}
        disabled={!media.available}
        accessibilityLabel="Aumentar volume"
        visualSize={48}
        style={styles.volumeButton}
      >
        <VolumeUpIcon size={26} color={colors.text} />
      </Touch>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    minHeight: 0,
    borderRadius: sizes.cardRadius,
    backgroundColor: colors.card,
    padding: 16,
    overflow: 'hidden',
  },
  speedHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: 24,
  },
  compass: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: colors.fill,
    borderRadius: 12,
    paddingHorizontal: 9,
    paddingVertical: 3,
  },
  gps: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  speedRow: {
    flex: 1,
    minHeight: 0,
    flexDirection: 'row',
    alignItems: 'baseline',
    alignSelf: 'flex-start',
    gap: 8,
    marginTop: 2,
  },
  cardLarge: {
    padding: 24,
  },
  speedRowLarge: {
    alignSelf: 'center',
    alignItems: 'baseline',
    justifyContent: 'center',
  },
  ledsLarge: {
    height: 20,
    gap: 5,
  },
  leds: {
    flexDirection: 'row',
    gap: 3,
    height: 12,
  },
  led: {
    flex: 1,
    borderRadius: 2,
  },
  notice: {
    flex: 1,
    justifyContent: 'center',
    gap: 10,
  },
  noticeText: {
    textAlign: 'left',
  },
  noticeButton: {
    alignSelf: 'flex-start',
    minHeight: 44,
    paddingHorizontal: 20,
    borderRadius: 22,
    backgroundColor: colors.text,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tripCard: {
    paddingVertical: 12,
  },
  tripHeader: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
  },
  grid: {
    flex: 1,
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignContent: 'space-around',
  },
  cell: {
    width: '50%',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingRight: 4,
  },
  iconCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cellText: {
    flex: 1,
  },
  valueRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 3,
  },
  volumeCard: {
    // Altura fixa: não cresce nem encolhe.
    flexGrow: 0,
    flexShrink: 0,
    flexBasis: 64,
    height: 64,
    paddingVertical: 0,
    paddingHorizontal: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  volumeButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  volumeBars: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 3,
    height: 28,
  },
  volumeBar: {
    flex: 1,
    borderRadius: 2,
  },
});
