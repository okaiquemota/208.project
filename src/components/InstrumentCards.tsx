// Cards do "painel de instrumentos", na coluna ao lado do player:
// - SpeedCard: velocímetro em anel, direção e status do GPS;
// - TripCard: distância, tempo, média e máxima (segure para zerar).

import { useEffect, useRef, useState } from 'react';
import { type LayoutChangeEvent, StyleSheet, Text, Vibration, View } from 'react-native';
import Svg, { Defs, LinearGradient, Path, Stop } from 'react-native-svg';

import { colors, font, SPEED_ALERT_KMH, SPEED_MAX_KMH, sizes, tabular } from '../config/theme';
import type { GpsState, GpsStatus } from '../hooks/useGps';
import { formatDuration, formatKm, formatKmh } from '../lib/format';
import { describeArc, GAUGE_END_DEG, GAUGE_START_DEG, speedToAngle } from '../lib/gauge';
import { toCardinal } from '../lib/geo';
import { averageKmh, DEFAULT_RULES } from '../lib/trip';
import { NavArrowIcon } from './icons';
import { Touch } from './Touch';

/** Card do velocímetro: direção, status do GPS e o anel com a velocidade. */
export function SpeedCard({ gps }: { gps: GpsState }) {
  return (
    <View style={styles.card}>
      <GaugeArea gps={gps} />
    </View>
  );
}

/** Card da viagem: distância, tempo, média e máxima (segure para zerar). */
export function TripCard({ gps }: { gps: GpsState }) {
  return (
    <View style={[styles.card, styles.tripCard]}>
      <TripStats gps={gps} />
    </View>
  );
}

// ---------- Velocímetro ----------

function gpsLabel(status: GpsStatus, accuracyM: number | null): { text: string; color: string } {
  switch (status) {
    case 'ok': {
      const acc = accuracyM === null ? '' : ` ±${Math.round(accuracyM)} m`;
      return accuracyM !== null && accuracyM > DEFAULT_RULES.maxAccuracyM
        ? { text: `GPS fraco${acc}`, color: colors.orange }
        : { text: `GPS${acc}`, color: colors.text2 };
    }
    case 'procurando':
      return { text: 'Procurando GPS…', color: colors.text2 };
    case 'iniciando':
      return { text: 'Iniciando GPS…', color: colors.text2 };
    case 'desligado':
      return { text: 'GPS desligado', color: colors.red };
    case 'sem-permissao':
      return { text: 'Sem permissão', color: colors.red };
  }
}

function GaugeArea({ gps }: { gps: GpsState }) {
  const [box, setBox] = useState({ w: 0, h: 0 });
  const onLayout = (e: LayoutChangeEvent) =>
    setBox({ w: e.nativeEvent.layout.width, h: e.nativeEvent.layout.height });

  const { status, trip } = gps;
  const label = gpsLabel(status, gps.accuracyM);
  const heading = trip.headingDeg;

  return (
    <View style={styles.gaugeArea}>
      {/* Direção e GPS */}
      <View style={styles.headerRow}>
        {heading !== null && status === 'ok' ? (
          <View style={styles.directionChip}>
            <NavArrowIcon size={18} color={colors.accentSoft} rotation={heading} />
            <Text style={font(17, '800')} allowFontScaling={false}>
              {toCardinal(heading)}
            </Text>
          </View>
        ) : null}
        <View style={[styles.dot, { backgroundColor: label.color }]} />
        <Text style={[font(13, '600', label.color), tabular]} numberOfLines={1} allowFontScaling={false}>
          {label.text}
        </Text>
      </View>

      <View style={styles.gaugeBox} onLayout={onLayout}>
        {status === 'sem-permissao' ? (
          <Notice
            title="Sem acesso à localização"
            body="O GPS mostra a velocidade e os dados da viagem."
            action={gps.canAskAgain ? 'Permitir localização' : 'Abrir configurações'}
            onAction={gps.requestPermission}
          />
        ) : status === 'desligado' ? (
          <Notice
            title="GPS desligado"
            body="Ligue a localização do celular."
            action="Ligar localização"
            onAction={gps.openLocationSettings}
          />
        ) : (
          <Ring
            size={Math.floor(Math.min(box.w, box.h))}
            speedKmh={status === 'ok' ? trip.speedKmh : null}
          />
        )}
      </View>
    </View>
  );
}

function Ring({ size, speedKmh }: { size: number; speedKmh: number | null }) {
  if (size <= 0) return null;
  const stroke = Math.max(10, size * 0.06);
  const c = size / 2;
  const r = size / 2 - stroke / 2 - 2;
  const value = speedKmh ?? 0;
  const alert = speedKmh !== null && value > SPEED_ALERT_KMH;
  const angle = speedToAngle(value, SPEED_MAX_KMH);
  const alertStart = speedToAngle(SPEED_ALERT_KMH, SPEED_MAX_KMH);
  const numberSize = Math.round(size * 0.3);

  return (
    <View style={{ width: size, height: size }}>
      <Svg width={size} height={size}>
        <Defs>
          <LinearGradient id="ring" x1="0" y1="1" x2="1" y2="0">
            <Stop offset="0" stopColor={alert ? colors.orange : colors.accent} />
            <Stop offset="1" stopColor={alert ? colors.red : colors.accentSoft} />
          </LinearGradient>
        </Defs>
        <Path
          d={describeArc(c, c, r, GAUGE_START_DEG, GAUGE_END_DEG)}
          stroke={colors.fill}
          strokeWidth={stroke}
          strokeLinecap="round"
          fill="none"
        />
        {/* Trecho acima de 120 marcado de leve no trilho */}
        <Path
          d={describeArc(c, c, r, alertStart, GAUGE_END_DEG)}
          stroke={colors.red}
          strokeOpacity={0.22}
          strokeWidth={stroke}
          strokeLinecap="round"
          fill="none"
        />
        {value > 0.5 && (
          <Path
            d={describeArc(c, c, r, GAUGE_START_DEG, angle)}
            stroke="url(#ring)"
            strokeWidth={stroke}
            strokeLinecap="round"
            fill="none"
          />
        )}
      </Svg>
      <View pointerEvents="none" style={[StyleSheet.absoluteFill, styles.center]}>
        <Text
          style={[
            font(numberSize, '800', speedKmh === null ? colors.text3 : alert ? colors.red : colors.text),
            tabular,
            { lineHeight: numberSize * 1.1, marginTop: -size * 0.04 },
          ]}
          allowFontScaling={false}
        >
          {speedKmh === null ? '--' : formatKmh(value)}
        </Text>
        <Text style={font(Math.round(size * 0.065), '600', colors.text2)} allowFontScaling={false}>
          km/h
        </Text>
      </View>
    </View>
  );
}

function Notice({
  title,
  body,
  action,
  onAction,
}: {
  title: string;
  body: string;
  action: string;
  onAction: () => void;
}) {
  return (
    <View style={styles.notice}>
      <Text style={[font(18, '700', colors.red), styles.centerText]}>{title}</Text>
      <Text style={[font(14, '500', colors.text2), styles.centerText]}>{body}</Text>
      <Touch onPress={onAction} accessibilityLabel={action} style={styles.noticeButton}>
        <Text style={font(16, '700')}>{action}</Text>
      </Touch>
    </View>
  );
}

// ---------- Viagem ----------

const LONG_PRESS_MS = 800;
const FLASH_MS = 1500;

function TripStats({ gps }: { gps: GpsState }) {
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

  const rows = [
    { label: 'Distância', value: formatKm(trip.distanceM), unit: 'km' },
    { label: 'Tempo', value: formatDuration(trip.movingMs), unit: '' },
    { label: 'Média', value: formatKmh(averageKmh(trip)), unit: 'km/h' },
    { label: 'Máxima', value: formatKmh(trip.maxKmh), unit: 'km/h' },
  ];

  return (
    <Touch
      onLongPress={handleLongPress}
      delayLongPress={LONG_PRESS_MS}
      accessibilityLabel="Dados da viagem"
      accessibilityHint="Segure para zerar a viagem"
      style={styles.stats}
    >
      <View style={styles.statsHeader}>
        <Text style={font(14, '700')} allowFontScaling={false}>
          Viagem
        </Text>
        <Text style={font(11, '600', justReset ? colors.accentSoft : colors.text3)} allowFontScaling={false}>
          {justReset ? 'ZERADA' : 'segure para zerar'}
        </Text>
      </View>
      <View style={styles.grid}>
        {rows.map((row) => (
          <View key={row.label} style={styles.statCell}>
            <Text style={font(11, '700', colors.text3)} allowFontScaling={false}>
              {row.label.toUpperCase()}
            </Text>
            <View style={styles.statValue}>
              <Text
                style={[font(24, '700'), tabular]}
                numberOfLines={1}
                adjustsFontSizeToFit
                minimumFontScale={0.75}
                allowFontScaling={false}
              >
                {row.value}
              </Text>
              {row.unit !== '' && (
                <Text style={font(12, '600', colors.text2)} allowFontScaling={false}>
                  {row.unit}
                </Text>
              )}
            </View>
          </View>
        ))}
      </View>
    </Touch>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    borderRadius: sizes.cardRadius,
    backgroundColor: colors.card,
    padding: 16,
  },
  tripCard: {
    paddingVertical: 14,
  },
  gaugeArea: {
    flex: 1,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    minHeight: 22,
  },
  directionChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginRight: 4,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  gaugeBox: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
  },
  center: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  centerText: {
    textAlign: 'center',
  },
  notice: {
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 4,
  },
  noticeButton: {
    marginTop: 4,
    minHeight: 50,
    paddingHorizontal: 18,
    borderRadius: 25,
    backgroundColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stats: {
    flex: 1,
  },
  statsHeader: {
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
  statCell: {
    width: '50%',
    gap: 1,
  },
  statValue: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 4,
    paddingRight: 6,
  },
});
