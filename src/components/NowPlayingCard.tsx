// Player de música no estilo do Spotify / CarPlay:
// - a capa, bem desfocada, vira o fundo do card inteiro;
// - a capa nítida fica à esquerda, com o título e o artista centralizados ao lado;
// - embaixo, a barra de progresso com bolinha e os botões (play branco e
//   redondo). Dos lados, os botões do próprio player (curtir, aleatório) ou,
//   no modo compacto (tela dividida), o volume.

import { Image } from 'expo-image';
import { type ReactNode, useState } from 'react';
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
  HeartFilledIcon,
  HeartIcon,
  MusicIcon,
  NextIcon,
  PauseIcon,
  PlayIcon,
  PreviousIcon,
  RepeatIcon,
  RepeatOneIcon,
  ShuffleIcon,
  VolumeDownIcon,
  VolumeUpIcon,
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

const PAD = 20;
/** Verde do Spotify: botão ligado (coração aceso, aleatório ligado…). */
const ACTIVE_GREEN = '#1ED760';
const GLYPHS = {
  heart: HeartIcon,
  'heart-filled': HeartFilledIcon,
  shuffle: ShuffleIcon,
  repeat: RepeatIcon,
  'repeat-one': RepeatOneIcon,
} as const;
/** Altura do bloco de baixo: progresso + botões. */
const BOTTOM_BLOCK = 118;

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
    subtitle = defaultPlayerName ? `Escolha uma música no ${defaultPlayerName}` : 'Abra um app de música';
    if (defaultPlayerName) action = { label: `Abrir ${defaultPlayerName}`, onPress: onOpenPlayer };
  } else {
    title = np.title || np.album || np.appName;
    subtitle = np.artist || np.album;
  }

  const hasTrack = !!np && (!!np.title || !!np.artist);
  const artUri = np?.artworkRemoteUri ?? np?.artworkUri ?? null;
  const playerName = np?.appName ?? defaultPlayerName ?? 'Música';
  const tint = tintFromArtwork(np?.artworkColor ?? null, '#26324D');

  // Capa: o maior quadrado que cabe em cima dos botões, deixando espaço pro texto.
  const art = Math.max(
    90,
    Math.min(box.h - PAD * 2 - BOTTOM_BLOCK - 10, box.w * (compact ? 0.4 : 0.42), 250),
  );

  const [leftAction, rightAction] = pickSideActions(np?.customActions ?? []);

  return (
    <View style={styles.card} onLayout={onLayout}>
      {/* Fundo: a capa desfocada (ou um degradê com a cor padrão) */}
      {artUri ? (
        <Image
          source={artUri}
          style={StyleSheet.absoluteFill}
          contentFit="cover"
          blurRadius={60}
          transition={400}
          cachePolicy={np?.artworkRemoteUri ? 'memory-disk' : 'none'}
        />
      ) : null}
      <Svg style={StyleSheet.absoluteFill} width="100%" height="100%" pointerEvents="none">
        <Defs>
          <LinearGradient id="np-bg" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor={artUri ? '#000' : tint} stopOpacity={artUri ? 0.25 : 1} />
            <Stop offset="1" stopColor={artUri ? '#000' : '#101010'} stopOpacity={artUri ? 0.7 : 1} />
          </LinearGradient>
        </Defs>
        <Rect width="100%" height="100%" fill="url(#np-bg)" />
      </Svg>

      <View style={styles.content}>
        <View style={styles.top}>
          {/* Capa nítida (tocar abre o player) */}
          <Touch onPress={onOpenPlayer} accessibilityLabel={`Abrir o ${playerName}`}>
            <View style={[styles.art, { width: art, height: art }]}>
              {artUri ? (
                <Image
                  source={artUri}
                  placeholder={np?.artworkRemoteUri ? np.artworkUri : undefined}
                  style={StyleSheet.absoluteFill}
                  contentFit="cover"
                  transition={250}
                  cachePolicy={np?.artworkRemoteUri ? 'memory-disk' : 'none'}
                />
              ) : (
                <View style={styles.artEmpty}>
                  <MusicIcon size={art * 0.4} color="rgba(255,255,255,0.4)" />
                </View>
              )}
            </View>
          </Touch>

          {/* Player, título e artista, centralizados com a capa */}
          <View style={styles.info}>
            <View style={styles.source}>
              {playerIcon ? (
                <Image source={playerIcon} style={styles.sourceIcon} contentFit="contain" />
              ) : (
                <MusicIcon size={16} color={colors.text2} />
              )}
              <Text style={font(11, '700', colors.text2)} numberOfLines={1} allowFontScaling={false}>
                {compact ? playerName.toUpperCase() : `TOCANDO NO ${playerName.toUpperCase()}`}
              </Text>
            </View>
            <Text
              style={font(compact ? 22 : 28, '800')}
              numberOfLines={2}
              adjustsFontSizeToFit
              minimumFontScale={0.75}
              allowFontScaling={false}
            >
              {title}
            </Text>
            <Text style={font(compact ? 16 : 18, '600', colors.text2)} numberOfLines={1} allowFontScaling={false}>
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

        {/* Progresso */}
        <View style={styles.progressBlock}>
          <ProgressBar ratio={hasTrack && np ? progressRatio(np, now) : 0} visible={hasTrack} />
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
          {compact ? (
            <SideButton onPress={media.volumeDown} label="Diminuir volume" disabled={!media.available}>
              <VolumeDownIcon size={28} color={colors.text} />
            </SideButton>
          ) : (
            <ActionButton action={leftAction} onPress={media.sendAction} />
          )}
          <SideButton onPress={media.previous} label="Música anterior" disabled={!media.available}>
            <PreviousIcon size={36} color={colors.text} />
          </SideButton>
          <Touch
            onPress={media.playPause}
            disabled={!media.available}
            accessibilityLabel={media.playing ? 'Pausar' : 'Tocar'}
            style={styles.playButton}
          >
            {media.playing ? <PauseIcon size={32} color="#000" /> : <PlayIcon size={34} color="#000" />}
          </Touch>
          <SideButton onPress={media.next} label="Próxima música" disabled={!media.available}>
            <NextIcon size={36} color={colors.text} />
          </SideButton>
          {compact ? (
            <SideButton onPress={media.volumeUp} label="Aumentar volume" disabled={!media.available}>
              <VolumeUpIcon size={28} color={colors.text} />
            </SideButton>
          ) : (
            <ActionButton action={rightAction} onPress={media.sendAction} />
          )}
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

function SideButton({
  onPress,
  label,
  disabled,
  children,
}: {
  onPress: () => void;
  label: string;
  disabled?: boolean;
  children: ReactNode;
}) {
  return (
    <Touch onPress={onPress} disabled={disabled} accessibilityLabel={label} style={styles.sideButton}>
      {children}
    </Touch>
  );
}

/** Botão extra do player (ícone do próprio app) ou um espaço vazio do mesmo tamanho. */
function ActionButton({ action, onPress }: { action: PlayerAction | null; onPress: (a: string) => void }) {
  if (!action) return <View style={styles.sideButton} />;
  const Glyph = action.glyph ? GLYPHS[action.glyph] : null;
  return (
    <Touch onPress={() => onPress(action.action)} accessibilityLabel={action.name} style={styles.sideButton}>
      {Glyph ? (
        <>
          <Glyph size={28} color={action.active ? ACTIVE_GREEN : colors.text} />
          {/* Pontinho embaixo quando ligado, como no Spotify */}
          {action.active && action.glyph !== 'heart-filled' ? <View style={styles.activeDot} /> : null}
        </>
      ) : action.iconUri ? (
        <Image source={action.iconUri} style={styles.extraIcon} contentFit="contain" transition={0} />
      ) : (
        <Text style={[font(11, '700', colors.text2), styles.extraText]} numberOfLines={2} allowFontScaling={false}>
          {action.name}
        </Text>
      )}
    </Touch>
  );
}

function ProgressBar({ ratio, visible }: { ratio: number; visible: boolean }) {
  const pct = `${Math.max(0, Math.min(1, ratio)) * 100}%` as const;
  return (
    <View style={styles.progressTrack}>
      {visible && (
        <>
          <View style={[styles.progressFill, { width: pct }]} />
          <View style={[styles.knob, { left: pct }]} />
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    borderRadius: sizes.cardRadius,
    overflow: 'hidden',
    backgroundColor: '#121212',
  },
  content: {
    flex: 1,
    padding: PAD,
  },
  top: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 18,
  },
  art: {
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: 'rgba(255,255,255,0.08)',
    elevation: 14,
    shadowColor: '#000',
    shadowOpacity: 0.55,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 10 },
  },
  artEmpty: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  info: {
    flex: 1,
    justifyContent: 'center',
    gap: 4,
  },
  source: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    marginBottom: 4,
  },
  sourceIcon: {
    width: 20,
    height: 20,
    borderRadius: 10,
  },
  actionButton: {
    alignSelf: 'flex-start',
    marginTop: 10,
    minHeight: 46,
    paddingHorizontal: 22,
    borderRadius: 23,
    backgroundColor: colors.text,
    alignItems: 'center',
    justifyContent: 'center',
  },
  progressBlock: {
    marginTop: 14,
  },
  progressTrack: {
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(255,255,255,0.28)',
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
    marginTop: 4,
  },
  sideButton: {
    width: sizes.minTouch,
    height: sizes.minTouch,
    borderRadius: sizes.minTouch / 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  activeDot: {
    position: 'absolute',
    bottom: 8,
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: ACTIVE_GREEN,
  },
  extraIcon: {
    width: 28,
    height: 28,
  },
  extraText: {
    textAlign: 'center',
  },
  playButton: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: colors.text,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
