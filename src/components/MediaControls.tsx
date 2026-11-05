// Controles de música: anterior, play/pause, próxima, volume − e +.
// Funcionam com o player que estiver tocando (Spotify, YT Music, Deezer…).

import { StyleSheet, Text, View } from 'react-native';

import { colors, sizes, tabular } from '../config/theme';
import type { MediaControls as Media } from '../hooks/useMediaKeys';
import { BigButton } from './BigButton';
import { MinusIcon, NextIcon, PauseIcon, PlayIcon, PlusIcon, PreviousIcon } from './icons';

const ICON = 34;

export function MediaControls({ media }: { media: Media }) {
  const off = !media.available;
  return (
    <View style={styles.row}>
      <BigButton
        onPress={media.previous}
        disabled={off}
        accessibilityLabel="Música anterior"
        style={styles.transport}
      >
        <PreviousIcon size={ICON} color={colors.text} />
      </BigButton>
      <BigButton
        onPress={media.playPause}
        disabled={off}
        active={media.playing}
        accessibilityLabel={media.playing ? 'Pausar' : 'Tocar'}
        style={styles.transport}
      >
        {media.playing ? (
          <PauseIcon size={ICON} color={colors.accent} />
        ) : (
          <PlayIcon size={ICON} color={colors.text} />
        )}
      </BigButton>
      <BigButton
        onPress={media.next}
        disabled={off}
        accessibilityLabel="Próxima música"
        style={styles.transport}
      >
        <NextIcon size={ICON} color={colors.text} />
      </BigButton>

      <View style={styles.spacer} />

      <BigButton onPress={media.volumeDown} disabled={off} accessibilityLabel="Diminuir volume">
        <MinusIcon size={ICON} color={colors.text} />
      </BigButton>
      <VolumeBar current={media.volume.current} max={media.volume.max} available={!off} />
      <BigButton onPress={media.volumeUp} disabled={off} accessibilityLabel="Aumentar volume">
        <PlusIcon size={ICON} color={colors.text} />
      </BigButton>
    </View>
  );
}

function VolumeBar({ current, max, available }: { current: number; max: number; available: boolean }) {
  const segments = Math.max(1, Math.min(max, 30));
  // Se o máximo passar de 30 passos, agrupa para caber.
  const filled = max > 0 ? Math.round((current / max) * segments) : 0;
  return (
    <View style={styles.volume} accessibilityLabel={`Volume ${current} de ${max}`}>
      <Text style={[styles.volumeText, tabular]} allowFontScaling={false}>
        {available ? `VOL ${current}` : 'VOL --'}
      </Text>
      <View style={styles.segments}>
        {Array.from({ length: segments }, (_, i) => (
          <View
            key={i}
            style={[styles.segment, { backgroundColor: i < filled ? colors.accent : colors.track }]}
          />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'stretch',
    gap: sizes.gap,
    minHeight: 72,
  },
  transport: {
    flex: 1,
    maxWidth: 104,
  },
  spacer: {
    width: 4,
  },
  volume: {
    width: 104,
    justifyContent: 'center',
    gap: 6,
  },
  volumeText: {
    color: colors.textDim,
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1,
    textAlign: 'center',
  },
  segments: {
    flexDirection: 'row',
    gap: 2,
    height: 22,
  },
  segment: {
    flex: 1,
    borderRadius: 2,
  },
});
