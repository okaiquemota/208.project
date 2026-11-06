// Widgets de instrumento, no espírito dos widgets do CarPlay e do painel
// analógico do próprio 208: fundo liso, sem título, o desenho diz o que é.
// - SpeedWidget: mostrador com marcações (acendem até a velocidade; ficam
//   vermelhas depois do limite), direção e sinal do GPS;
// - TripWidget: distância em destaque, tempo/média/máxima embaixo (segure para zerar);
// - VolumeWidget: volume da música em degraus.

import { useEffect, useRef, useState } from 'react';
import { type LayoutChangeEvent, StyleSheet, Text, Vibration, View } from 'react-native';

import { colors, font, SPEED_MAX_KMH, sizes, tabular } from '../config/theme';
import type { GpsState } from '../hooks/useGps';
import type { MediaState } from '../hooks/useMedia';
import { formatDuration, formatKm, formatKmh } from '../lib/format';
import { toCardinal } from '../lib/geo';
import { averageKmh } from '../lib/trip';
import { dialTicks, gpsSignalBars, volumeSegments } from '../lib/widgets';
import { useAccent, useSettings } from '../state/settings';
import { TickDial } from './Dials';
import { NavArrowIcon, ResetIcon, SignalBars, VolumeDownIcon, VolumeUpIcon } from './icons';
import { Touch } from './Touch';

/** Tamanho do espaço disponível (para os desenhos se ajustarem ao card). */
function useBox() {
  const [box, setBox] = useState({ w: 0, h: 0 });
  const onLayout = (e: LayoutChangeEvent) =>
    setBox({ w: e.nativeEvent.layout.width, h: e.nativeEvent.layout.height });
  return { box, onLayout };
}

// ---------- Velocidade ----------

/** 41 marcações de 0 a 200: uma a cada 5 km/h; maiores a cada 20. */
const TICKS = 41;
const MAJOR_EVERY = 4;
const SCALE_LABELS = ['0', '20', '40', '60', '80', '100', '120', '140', '160', '180', '200'];

/** Velocidade. `large` = versão do card principal (mostrador grande com números). */
export function SpeedWidget({ gps, large }: { gps: GpsState; large?: boolean }) {
  const accent = useAccent();
  const { speedAlertKmh } = useSettings().settings;
  const { box, onLayout } = useBox();
  const { status, trip } = gps;

  // 0 nos Ajustes = sem alerta.
  const alertAt = speedAlertKmh > 0 ? speedAlertKmh : Number.POSITIVE_INFINITY;
  const live = status === 'ok';
  const speed = live ? trip.speedKmh : null;
  const alert = speed !== null && speed > alertAt;
  const { lit, alertFrom } = dialTicks(speed, SPEED_MAX_KMH, alertAt, TICKS);
  const heading = live ? trip.headingDeg : null;

  if (status === 'sem-permissao' || status === 'desligado') {
    return (
      <View style={styles.card}>
        <Notice
          text={status === 'desligado' ? 'GPS desligado' : 'Permita a localização para ver a velocidade'}
          action={status === 'desligado' ? 'Ligar' : gps.canAskAgain ? 'Permitir' : 'Configurações'}
          onAction={status === 'desligado' ? gps.openLocationSettings : gps.requestPermission}
        />
      </View>
    );
  }

  const numberColor = speed === null ? colors.text3 : alert ? colors.red : colors.text;

  if (large) {
    const dial = Math.max(0, Math.min(box.w, box.h));
    return (
      <View style={[styles.card, styles.cardLarge]}>
        <View style={styles.largeHeader}>
          <Direction heading={heading} color={accent.soft} size={20} />
          <GpsStatus gps={gps} />
        </View>
        <View style={styles.largeDialBox} onLayout={onLayout}>
          <TickDial
            size={dial}
            startDeg={-125}
            endDeg={125}
            count={TICKS}
            lit={lit}
            alertFrom={alertFrom}
            litColor={colors.text}
            majorEvery={MAJOR_EVERY}
            labels={SCALE_LABELS}
          >
            <Text style={[font(dial * 0.26, '700', numberColor), tabular]} allowFontScaling={false}>
              {speed === null ? '--' : formatKmh(speed)}
            </Text>
            <Text style={font(Math.max(13, dial * 0.055), '600', colors.text2)} allowFontScaling={false}>
              km/h
            </Text>
          </TickDial>
        </View>
      </View>
    );
  }

  const dial = Math.max(0, Math.min(box.h, box.w * 0.56));
  return (
    <View style={styles.card}>
      <View style={styles.speedRow} onLayout={onLayout}>
        <TickDial
          size={dial}
          startDeg={-125}
          endDeg={125}
          count={TICKS}
          lit={lit}
          alertFrom={alertFrom}
          litColor={colors.text}
          majorEvery={MAJOR_EVERY}
        >
          <Text style={[font(dial * 0.33, '700', numberColor), tabular]} allowFontScaling={false}>
            {speed === null ? '--' : formatKmh(speed)}
          </Text>
          <Text style={font(Math.max(10, dial * 0.1), '600', colors.text2)} allowFontScaling={false}>
            km/h
          </Text>
        </TickDial>
        <View style={styles.speedInfo}>
          <Direction heading={heading} color={accent.soft} size={17} />
          <GpsStatus gps={gps} />
        </View>
      </View>
    </View>
  );
}

function Direction({ heading, color, size }: { heading: number | null; color: string; size: number }) {
  if (heading === null) {
    return (
      <Text style={font(size, '600', colors.text3)} allowFontScaling={false}>
        —
      </Text>
    );
  }
  return (
    <View style={styles.direction}>
      <NavArrowIcon size={size} color={color} rotation={heading} />
      <Text style={font(size + 4, '700')} allowFontScaling={false}>
        {toCardinal(heading)}
      </Text>
      <Text style={[font(size - 3, '500', colors.text2), tabular]} allowFontScaling={false}>
        {`${Math.round(heading)}°`}
      </Text>
    </View>
  );
}

function GpsStatus({ gps }: { gps: GpsState }) {
  let text: string;
  let color: string = colors.text2;
  switch (gps.status) {
    case 'ok':
      text = gps.accuracyM === null ? 'GPS' : `±${Math.round(gps.accuracyM)} m`;
      break;
    case 'procurando':
      text = 'procurando';
      break;
    case 'iniciando':
      text = 'iniciando';
      break;
    case 'desligado':
      text = 'desligado';
      color = colors.red;
      break;
    case 'sem-permissao':
      text = 'sem permissão';
      color = colors.red;
      break;
  }
  const bars = gps.status === 'ok' ? gpsSignalBars(gps.accuracyM) : 0;
  return (
    <View style={styles.gps}>
      <SignalBars bars={bars} color={bars >= 2 ? colors.text : bars === 1 ? colors.orange : colors.text3} size={16} />
      <Text style={[font(12, '600', color), tabular]} allowFontScaling={false}>
        {text}
      </Text>
    </View>
  );
}

function Notice({ text, action, onAction }: { text: string; action: string; onAction: () => void }) {
  return (
    <View style={styles.notice}>
      <Text allowFontScaling={false} style={font(15, '600', colors.text)} numberOfLines={2}>
        {text}
      </Text>
      <Touch onPress={onAction} accessibilityLabel={action} style={styles.noticeButton}>
        <Text allowFontScaling={false} style={font(15, '700', '#000')}>{action}</Text>
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

  const small = [
    { label: 'em movimento', value: formatDuration(trip.movingMs) },
    { label: 'média', value: formatKmh(averageKmh(trip)) },
    { label: 'máxima', value: formatKmh(trip.maxKmh) },
  ];

  return (
    <Touch
      onLongPress={handleLongPress}
      delayLongPress={LONG_PRESS_MS}
      accessibilityLabel="Dados da viagem"
      accessibilityHint="Segure para zerar a viagem"
      style={styles.card}
    >
      <View style={styles.tripMain}>
        <Text style={[font(40, '300'), tabular]} allowFontScaling={false} numberOfLines={1}>
          {formatKm(trip.distanceM)}
        </Text>
        <Text style={font(15, '500', colors.text2)} allowFontScaling={false}>
          km
        </Text>
        <View style={styles.flex1} />
        <ResetIcon size={18} color={colors.text3} />
      </View>
      <View style={styles.tripRow}>
        {justReset ? (
          <Text style={font(15, '600', colors.green)} allowFontScaling={false}>
            Viagem zerada
          </Text>
        ) : (
          small.map((s) => (
            <View key={s.label} style={styles.tripCell}>
              <Text style={[font(17, '600'), tabular]} numberOfLines={1} adjustsFontSizeToFit allowFontScaling={false}>
                {s.value}
              </Text>
              <Text style={font(11, '500', colors.text3)} numberOfLines={1} allowFontScaling={false}>
                {s.label}
              </Text>
            </View>
          ))
        )}
      </View>
    </Touch>
  );
}

// ---------- Volume ----------

const VOLUME_STEPS = 15;

export function VolumeWidget({ media }: { media: MediaState }) {
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
              { height: 6 + (i / (VOLUME_STEPS - 1)) * 22, backgroundColor: on ? colors.text : 'rgba(255,255,255,0.14)' },
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
    borderWidth: 1,
    borderColor: colors.cardBorder,
    padding: 14,
    overflow: 'hidden',
  },
  cardLarge: {
    padding: 20,
  },
  largeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  largeDialBox: {
    flex: 1,
    minHeight: 0,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
  },
  speedRow: {
    flex: 1,
    minHeight: 0,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  speedInfo: {
    flex: 1,
    justifyContent: 'center',
    gap: 10,
  },
  direction: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  gps: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  notice: {
    flex: 1,
    justifyContent: 'center',
    gap: 10,
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
  tripMain: {
    flex: 1,
    minHeight: 0,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  flex1: {
    flex: 1,
  },
  tripRow: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 40,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(255,255,255,0.14)',
    paddingTop: 8,
  },
  tripCell: {
    flex: 1,
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
