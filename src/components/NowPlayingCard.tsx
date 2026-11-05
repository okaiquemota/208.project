// Player de música no estilo do Spotify: fundo em degradê com a cor da capa,
// capa grande, título e artista fortes, barra de progresso com bolinha, botão
// de play branco e redondo e os botões extras do próprio player (no Spotify:
// curtir, aleatório, repetir), com os ícones dele.

import { Image } from 'expo-image';
import { useState } from 'react';
import { type LayoutChangeEvent, StyleSheet, Text, View } from 'react-native';
import Svg, { Defs, LinearGradient, Rect, Stop } from 'react-native-svg';

import { colors, font, sizes, tabular } from '../config/theme';
import type { MediaState } from '../hooks/useMedia';
import { useNow } from '../hooks/useNow';
import {
  currentPositionMs,
  formatRemaining,
  formatTrackTime,
  type PlayerAction,
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

/** Fundo base do player (o mesmo cinza-quase-preto do Spotify). */
const BASE = '#121212';
const PAD = 20;
/** Altura do bloco de baixo: progresso + botões. */
const BOTTOM_BLOCK = 128;

export function NowPlayingCard({ media, playerIcon, defaultPlayerName, onOpenPlayer, compact }: Props) {
  const np = media.nowPlaying;
  const now = useNow(500, !!np?.isPlaying);
  const [box, setBox] = useState({ w: 0, h: 0 });
  const onLayout = (e: LayoutChangeEvent) =>
    setBox({ w: e.nativeEvent.layout.width, h: e.nativeEvent.layout.height });

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
  const tint = tintFromArtwork(np?.artworkColor ?? null, '#2A3550');
  const playerName = np?.appName ?? defaultPlayerName ?? 'Música';

  // Capa: o maior quadrado que cabe ao lado do texto, sem empurrar os botões.
  const art = Math.max(
    96,
    Math.min(box.w * (compact ? 0.42 : 0.4), box.h - PAD * 2 - BOTTOM_BLOCK - 12, 240),
  );

  // Botões extras do player: um de cada lado do bloco central.
  const [leftAction, rightAction] = pickSideActions(np?.customActions ?? []);

  return (
    <View style={styles.card} onLayout={onLayout}>
      <Svg style={StyleSheet.absoluteFill} width="100%" height="100%">
        <Defs>
          <LinearGradient id="np-bg" x1="0" y1="0" x2="0.35" y2="1">
            <Stop offset="0" stopColor={tint} />
            <Stop offset="0.85" stopColor={BASE} />
          </LinearGradient>
        </Defs>
        <Rect width="100%" height="100%" fill="url(#np-bg)" />
      </Svg>

      <View style={styles.content}>
        <View style={styles.top}>
          {/* Capa (tocar abre o player) */}
          <Touch onPress={onOpenPlayer} accessibilityLabel={`Abrir o ${playerName}`}>
            <View style={[styles.art, { width: art, height: art }]}>
              {np?.artworkUri || np?.artworkRemoteUri ? (
                <Image
                  // A capa em alta vem do link; a do arquivo aparece enquanto carrega.
                  source={np.artworkRemoteUri ?? np.artworkUri}
                  placeholder={np.artworkRemoteUri ? np.artworkUri : undefined}
                  style={StyleSheet.absoluteFill}
                  contentFit="cover"
                  transition={250}
                  cachePolicy={np.artworkRemoteUri ? 'memory-disk' : 'none'}
                />
              ) : (
                <View style={styles.artEmpty}>
                  <MusicIcon size={art * 0.42} color="rgba(255,255,255,0.35)" />
                </View>
              )}
            </View>
          </Touch>

          {/* Player, título e artista */}
          <View style={styles.info}>
            <View style={styles.infoTop}>
              <View style={styles.source}>
                {playerIcon ? (
                  <Image source={playerIcon} style={styles.sourceIcon} contentFit="contain" />
                ) : (
                  <MusicIcon size={18} color={colors.text2} />
                )}
                {!compact && (
                  <Text style={font(12, '700', colors.text2)} numberOfLines={1} allowFontScaling={false}>
                    {playerName.toUpperCase()}
                  </Text>
                )}
              </View>
              <VolumePill media={media} />
            </View>

            <View style={styles.titles}>
              <Text
                style={font(compact ? 22 : 27, '800')}
                numberOfLines={2}
                adjustsFontSizeToFit
                minimumFontScale={0.8}
                allowFontScaling={false}
              >
                {title}
              </Text>
              <Text
                style={[font(compact ? 16 : 18, '500', colors.text2), styles.subtitle]}
                numberOfLines={1}
                allowFontScaling={false}
              >
                {subtitle}
              </Text>
              {action && (
                <Touch onPress={action.onPress} accessibilityLabel={action.label} style={styles.actionButton}>
                  <Text style={font(15, '800', '#000')} allowFontScaling={false}>
                    {action.label}
                  </Text>
                </Touch>
              )}
            </View>
          </View>
        </View>

        {/* Progresso */}
        <View style={styles.progressBlock}>
          {hasTrack && np ? (
            <ProgressBar ratio={progressRatio(np, now)} />
          ) : (
            <View style={styles.progressTrack} />
          )}
          <View style={styles.times}>
            <Text style={[font(12, '600', colors.text2), tabular]} allowFontScaling={false}>
              {hasTrack && np && np.durationMs > 0 ? formatTrackTime(currentPositionMs(np, now)) : ' '}
            </Text>
            <Text style={[font(12, '600', colors.text2), tabular]} allowFontScaling={false}>
              {hasTrack && np ? formatRemaining(np, now) : ' '}
            </Text>
          </View>
        </View>

        {/* Controles */}
        <View style={styles.controls}>
          <ActionButton action={leftAction} onPress={media.sendAction} />
          <Touch
            onPress={media.previous}
            disabled={!media.available}
            accessibilityLabel="Música anterior"
            style={styles.sideButton}
          >
            <PreviousIcon size={38} color={colors.text} />
          </Touch>
          <Touch
            onPress={media.playPause}
            disabled={!media.available}
            accessibilityLabel={media.playing ? 'Pausar' : 'Tocar'}
            style={styles.playButton}
          >
            {media.playing ? <PauseIcon size={34} color="#000" /> : <PlayIcon size={36} color="#000" />}
          </Touch>
          <Touch
            onPress={media.next}
            disabled={!media.available}
            accessibilityLabel="Próxima música"
            style={styles.sideButton}
          >
            <NextIcon size={38} color={colors.text} />
          </Touch>
          <ActionButton action={rightAction} onPress={media.sendAction} />
        </View>
      </View>
    </View>
  );
}

/**
 * Escolhe os dois botões extras que aparecem ao lado dos controles.
 * Dá preferência a curtir (esquerda) e aleatório/repetir (direita).
 */
function pickSideActions(actions: PlayerAction[]): [PlayerAction | null, PlayerAction | null] {
  if (actions.length === 0) return [null, null];
  const has = (a: PlayerAction, words: string[]) => {
    const text = `${a.action} ${a.name}`.toLowerCase();
    return words.some((w) => text.includes(w));
  };
  const like = actions.find((a) => has(a, ['like', 'curti', 'heart', 'favorit', 'library', 'bibliotec', 'add']));
  const rest = actions.filter((a) => a !== like);
  const shuffle =
    rest.find((a) => has(a, ['shuffle', 'aleat'])) ?? rest.find((a) => has(a, ['repeat', 'repet'])) ?? rest[0];
  const left = like ?? rest.find((a) => a !== shuffle) ?? null;
  return [left, shuffle ?? null];
}

/** Botão extra do player (ícone do próprio app) ou um espaço vazio do mesmo tamanho. */
function ActionButton({ action, onPress }: { action: PlayerAction | null; onPress: (a: string) => void }) {
  if (!action) return <View style={styles.extraButton} />;
  return (
    <Touch onPress={() => onPress(action.action)} accessibilityLabel={action.name} style={styles.extraButton}>
      {action.iconUri ? (
        <Image source={action.iconUri} style={styles.extraIcon} contentFit="contain" transition={0} />
      ) : (
        <Text style={font(11, '700', colors.text2)} numberOfLines={2} allowFontScaling={false}>
          {action.name}
        </Text>
      )}
    </Touch>
  );
}

function ProgressBar({ ratio }: { ratio: number }) {
  const pct = `${Math.max(0, Math.min(1, ratio)) * 100}%` as const;
  return (
    <View style={styles.progressTrack}>
      <View style={[styles.progressFill, { width: pct }]} />
      <View style={[styles.knob, { left: pct }]} />
    </View>
  );
}

function VolumePill({ media }: { media: MediaState }) {
  return (
    <View style={styles.volume}>
      <Touch
        onPress={media.volumeDown}
        disabled={!media.available}
        accessibilityLabel="Diminuir volume"
        visualSize={42}
        style={styles.volumeButton}
      >
        <MinusIcon size={20} color={colors.text} />
      </Touch>
      <Text style={[font(14, '700'), tabular, styles.volumeText]} allowFontScaling={false}>
        {media.available ? media.volume.current : '–'}
      </Text>
      <Touch
        onPress={media.volumeUp}
        disabled={!media.available}
        accessibilityLabel="Aumentar volume"
        visualSize={42}
        style={styles.volumeButton}
      >
        <PlusIcon size={20} color={colors.text} />
      </Touch>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    borderRadius: sizes.cardRadius,
    overflow: 'hidden',
    backgroundColor: BASE,
  },
  content: {
    flex: 1,
    padding: PAD,
  },
  top: {
    flex: 1,
    flexDirection: 'row',
    gap: 18,
  },
  art: {
    borderRadius: 10,
    overflow: 'hidden',
    backgroundColor: 'rgba(255,255,255,0.08)',
    // Sombra (Android usa elevation)
    elevation: 12,
    shadowColor: '#000',
    shadowOpacity: 0.5,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
  },
  artEmpty: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  info: {
    flex: 1,
    justifyContent: 'space-between',
  },
  infoTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  source: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexShrink: 1,
  },
  sourceIcon: {
    width: 22,
    height: 22,
    borderRadius: 11,
  },
  titles: {
    justifyContent: 'flex-end',
  },
  subtitle: {
    marginTop: 4,
  },
  actionButton: {
    alignSelf: 'flex-start',
    marginTop: 12,
    minHeight: 46,
    paddingHorizontal: 22,
    borderRadius: 23,
    backgroundColor: colors.text,
    alignItems: 'center',
    justifyContent: 'center',
  },
  volume: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.3)',
    borderRadius: 22,
  },
  volumeButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
  },
  volumeText: {
    minWidth: 20,
    textAlign: 'center',
  },
  progressBlock: {
    marginTop: 16,
  },
  progressTrack: {
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(255,255,255,0.25)',
    justifyContent: 'center',
  },
  progressFill: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    borderRadius: 2,
    backgroundColor: colors.text,
  },
  knob: {
    position: 'absolute',
    width: 12,
    height: 12,
    marginLeft: -6,
    borderRadius: 6,
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
    marginTop: 8,
  },
  extraButton: {
    width: sizes.minTouch,
    height: sizes.minTouch,
    borderRadius: sizes.minTouch / 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  extraIcon: {
    width: 30,
    height: 30,
  },
  sideButton: {
    width: sizes.minTouch + 4,
    height: sizes.minTouch + 4,
    borderRadius: (sizes.minTouch + 4) / 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  playButton: {
    width: 76,
    height: 76,
    borderRadius: 38,
    backgroundColor: colors.text,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
