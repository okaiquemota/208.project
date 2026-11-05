// Dados da viagem: distância, tempo em movimento, média e máxima.
// Segurar (0,8 s) em qualquer card zera tudo. O celular vibra e os
// títulos mostram "zerado" por um instante: confirmação sem popup.

import { useEffect, useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, Vibration, View } from 'react-native';

import { colors, sizes, tabular } from '../config/theme';
import { formatDuration, formatKm, formatKmh } from '../lib/format';
import { averageKmh, type TripState } from '../lib/trip';

type Props = {
  trip: TripState;
  onReset: () => void;
};

const LONG_PRESS_MS = 800;
const FLASH_MS = 1500;

export function TripCards({ trip, onReset }: Props) {
  const [justReset, setJustReset] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current);
    },
    [],
  );

  const handleLongPress = () => {
    onReset();
    Vibration.vibrate(40);
    setJustReset(true);
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => setJustReset(false), FLASH_MS);
  };

  const cards = [
    { label: 'Distância', value: formatKm(trip.distanceM), unit: 'km' },
    { label: 'Tempo', value: formatDuration(trip.movingMs), unit: '' },
    { label: 'Média', value: formatKmh(averageKmh(trip)), unit: 'km/h' },
    { label: 'Máxima', value: formatKmh(trip.maxKmh), unit: 'km/h' },
  ];

  return (
    <Pressable
      onLongPress={handleLongPress}
      delayLongPress={LONG_PRESS_MS}
      accessibilityRole="button"
      accessibilityLabel="Dados da viagem"
      accessibilityHint="Segure para zerar a viagem"
      style={styles.row}
    >
      {({ pressed }) =>
        cards.map((c) => (
          <View key={c.label} style={[styles.card, pressed && styles.cardPressed]}>
            <View style={styles.labelRow}>
              <Text
                style={[styles.label, justReset && styles.labelReset]}
                numberOfLines={1}
                adjustsFontSizeToFit
                minimumFontScale={0.75}
                allowFontScaling={false}
              >
                {justReset ? 'ZERADO' : c.label.toUpperCase()}
              </Text>
              {c.unit !== '' && (
                <Text style={styles.unit} allowFontScaling={false}>
                  {c.unit}
                </Text>
              )}
            </View>
            <Text
              style={[styles.value, tabular]}
              numberOfLines={1}
              adjustsFontSizeToFit
              minimumFontScale={0.7}
              allowFontScaling={false}
            >
              {c.value}
            </Text>
          </View>
        ))
      }
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    gap: sizes.gap,
  },
  card: {
    flex: 1,
    minHeight: 76,
    borderRadius: sizes.radius,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 10,
    paddingVertical: 8,
    justifyContent: 'center',
  },
  cardPressed: {
    borderColor: colors.accent,
  },
  labelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    gap: 4,
  },
  label: {
    flexShrink: 1,
    color: colors.textDim,
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  labelReset: {
    color: colors.accent,
  },
  value: {
    marginTop: 2,
    color: colors.text,
    fontSize: 32,
    fontWeight: '700',
    includeFontPadding: false,
  },
  unit: {
    color: colors.textFaint,
    fontSize: 12,
    fontWeight: '700',
  },
});
