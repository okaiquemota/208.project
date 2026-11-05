// Card "Tocando agora", no estilo do CarPlay: a capa ocupa o card inteiro,
// escurecida embaixo; título e artista grandes, barra fina de progresso e
// botões grandes (o pause é um quadrado claro arredondado).

import { Image } from 'expo-image';
import { StyleSheet, Text, View } from 'react-native';
import Svg, { Defs, LinearGradient, Rect, Stop } from 'react-native-svg';

import { colors, font, sizes, tabular } from '../config/theme';
import type { MediaState } from '../hooks/useMedia';
import { useNow } from '../hooks/useNow';
import {
  formatRemaining,
  formatTrackTime,
  currentPositionMs,
  progressRatio,
  tintFromArtwork,
} from '../lib/nowPlaying';
import {
  MinusIcon,
  MusicIcon,
  NextIcon,
  PauseIcon,
  PlayIcon,
  PlusIcon,
  PreviousIcon,
} from './icons';
import { Touch } from './Touch';

type Props = {
  media: MediaState;
  /** Ícone do player (ex.: Spotify), já carregado da lista de apps. */
  playerIcon: string | null;
  /** Nome do player padrão (primeiro app de música instalado). */
  defaultPlayerName: string | null;
  /** Abre o player (Spotify etc.). */
  onOpenPlayer: () => void;
  compact?: boolean;
};

export function NowPlayingCard({ media, playerIcon, defaultPlayerName, onOpenPlayer, compact }: Props) {
  const np = media.nowPlaying;
  const now = useNow(500, !!np?.isPlaying);
  const tint = tintFromArtwork(np?.artworkColor ?? null);

  // Textos conforme a situação (sem acesso, nada tocando, tocando).
  let title: string;
  let subtitle: string;
  let action: { label: string; onPress: () => void } | null = null;
  if (!media.available) {
    title = 'Música indisponível';
    subtitle = 'Gere o app de novo para ativar os controles';
  } else if (!media.hasAccess) {
    title = 'Mostrar a música aqui';
    subtitle = 'Libere o acesso a notificações';
    action = { label: 'Ativar', onPress: media.openAccessSettings };
  } else if (!np || (!np.title && !np.artist)) {
    title = 'Nada tocando';
    subtitle = defaultPlayerName ? `Abra o ${defaultPlayerName} e escolha uma música` : 'Abra um app de música';
    if (defaultPlayerName) action = { label: `Abrir ${defaultPlayerName}`, onPress: onOpenPlayer };
  } else {
    title = np.title || np.album || np.appName;
    subtitle = np.artist || np.album;
  }

  const hasTrack = !!np && (!!np.title || !!np.artist);
  const ratio = np && hasTrack ? progressRatio(np, now) : 0;
  const titleSize = compact ? 26 : 24;

  return (
    <View style={styles.card}>
      {/* Fundo: a capa (ou um degradê com a cor padrão) */}
      {np?.artworkUri ? (
        <Image
          source={np.artworkUri}
          style={StyleSheet.absoluteFill}
          contentFit="cover"
          transition={250}
          cachePolicy="none"
        />
      ) : (
        <Svg style={StyleSheet.absoluteFill} width="100%" height="100%">
          <Defs>
            <LinearGradient id="np-bg" x1="0" y1="0" x2="1" y2="1">
              <Stop offset="0" stopColor={tint} />
              <Stop offset="1" stopColor={colors.card} />
            </LinearGradient>
          </Defs>
          <Rect width="100%" height="100%" fill="url(#np-bg)" />
        </Svg>
      )}
      {/* Escurece embaixo para o texto branco ficar legível em qualquer capa */}
      <Svg style={StyleSheet.absoluteFill} width="100%" height="100%" pointerEvents="none">
        <Defs>
          <LinearGradient id="np-shade" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor="#000" stopOpacity={0.35} />
            <Stop offset="0.35" stopColor="#000" stopOpacity={0.05} />
            <Stop offset="0.6" stopColor="#000" stopOpacity={0.35} />
            <Stop offset="1" stopColor="#000" stopOpacity={0.88} />
          </LinearGradient>
        </Defs>
        <Rect width="100%" height="100%" fill="url(#np-shade)" />
      </Svg>

      <View style={styles.content}>
        {/* Topo: player à esquerda, volume à direita */}
        <View style={styles.topRow}>
          <Touch onPress={onOpenPlayer} accessibilityLabel="Abrir o player" visualSize={40}>
            {playerIcon ? (
              <Image source={playerIcon} style={styles.playerIcon} contentFit="contain" />
            ) : (
              <View style={[styles.playerIcon, styles.playerIconEmpty]}>
                <MusicIcon size={20} color={colors.text} />
              </View>
            )}
          </Touch>
          <View style={styles.volume}>
            <Touch
              onPress={media.volumeDown}
              disabled={!media.available}
              accessibilityLabel="Diminuir volume"
              visualSize={44}
              style={styles.volumeButton}
            >
              <MinusIcon size={22} color={colors.text} />
            </Touch>
            <Text style={[font(15, '700'), tabular, styles.volumeText]} allowFontScaling={false}>
              {media.available ? media.volume.current : '–'}
            </Text>
            <Touch
              onPress={media.volumeUp}
              disabled={!media.available}
              accessibilityLabel="Aumentar volume"
              visualSize={44}
              style={styles.volumeButton}
            >
              <PlusIcon size={22} color={colors.text} />
            </Touch>
          </View>
        </View>

        {/* Área livre: tocar abre o player */}
        <Touch onPress={onOpenPlayer} accessibilityLabel="Abrir o player" style={styles.spacer}>
          {!np?.artworkUri && (
            <View style={styles.bigNote}>
              <MusicIcon size={compact ? 84 : 72} color="rgba(255,255,255,0.18)" />
            </View>
          )}
        </Touch>

        <Text style={font(titleSize, '700')} numberOfLines={2} allowFontScaling={false}>
          {title}
        </Text>
        <Text style={[font(compact ? 19 : 17, '500', colors.text2), styles.subtitle]} numberOfLines={1} allowFontScaling={false}>
          {subtitle}
        </Text>

        {action && (
          <Touch onPress={action.onPress} accessibilityLabel={action.label} style={styles.actionButton}>
            <Text style={font(16, '700')} allowFontScaling={false}>
              {action.label}
            </Text>
          </Touch>
        )}

        {/* Progresso */}
        {hasTrack && np && (
          <View style={styles.progressBlock}>
            <View style={styles.progressTrack}>
              <View style={[styles.progressFill, { width: `${ratio * 100}%` }]} />
            </View>
            {np.durationMs > 0 && (
              <View style={styles.times}>
                <Text style={[font(12, '600', colors.text2), tabular]} allowFontScaling={false}>
                  {formatTrackTime(currentPositionMs(np, now))}
                </Text>
                <Text style={[font(12, '600', colors.text2), tabular]} allowFontScaling={false}>
                  {formatRemaining(np, now)}
                </Text>
              </View>
            )}
          </View>
        )}

        {/* Controles */}
        <View style={styles.controls}>
          <Touch
            onPress={media.previous}
            disabled={!media.available}
            accessibilityLabel="Música anterior"
            style={styles.sideButton}
          >
            <PreviousIcon size={36} color={colors.text} />
          </Touch>
          <Touch
            onPress={media.playPause}
            disabled={!media.available}
            accessibilityLabel={media.playing ? 'Pausar' : 'Tocar'}
            style={styles.playButton}
          >
            {media.playing ? <PauseIcon size={36} color="#000" /> : <PlayIcon size={36} color="#000" />}
          </Touch>
          <Touch
            onPress={media.next}
            disabled={!media.available}
            accessibilityLabel="Próxima música"
            style={styles.sideButton}
          >
            <NextIcon size={36} color={colors.text} />
          </Touch>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    borderRadius: sizes.cardRadius,
    overflow: 'hidden',
    backgroundColor: colors.card,
  },
  content: {
    flex: 1,
    padding: 18,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  playerIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  playerIconEmpty: {
    backgroundColor: colors.fill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  volume: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.35)',
    borderRadius: 24,
    paddingHorizontal: 2,
  },
  volumeButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  volumeText: {
    minWidth: 24,
    textAlign: 'center',
  },
  spacer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bigNote: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  subtitle: {
    marginTop: 4,
  },
  actionButton: {
    alignSelf: 'flex-start',
    marginTop: 12,
    minHeight: 48,
    paddingHorizontal: 22,
    borderRadius: 24,
    backgroundColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  progressBlock: {
    marginTop: 14,
  },
  progressTrack: {
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.track,
    overflow: 'hidden',
  },
  progressFill: {
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.text,
  },
  times: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 6,
  },
  controls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 12,
  },
  sideButton: {
    width: sizes.minTouch + 8,
    height: sizes.minTouch + 8,
    borderRadius: sizes.buttonRadius,
    alignItems: 'center',
    justifyContent: 'center',
  },
  playButton: {
    width: 80,
    height: 80,
    borderRadius: 24,
    backgroundColor: colors.primaryButton,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
