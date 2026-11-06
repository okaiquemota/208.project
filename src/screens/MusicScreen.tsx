// Tela de música: o player (em coluna, à esquerda) e, ao lado, a escolha de
// música no Spotify, como no Spotify do CarPlay (abas, fileiras de capas,
// playlist com Tocar e Aleatório). O player é sempre automático: mostra o que
// estiver tocando, de qualquer app.
// Na tela dividida: a escolha de música e um mini player embaixo.

import { StyleSheet, View } from 'react-native';
import Animated from 'react-native-reanimated';

import { MiniPlayerWidget } from '../components/MoreWidgets';
import { enterItem } from '../components/motion';
import { NowPlayingCard } from '../components/NowPlayingCard';
import { SpotifyBrowser } from '../components/SpotifyBrowser';
import { SPOTIFY_PACKAGE } from '../config/spotify';
import { colors, sizes } from '../config/theme';
import type { MediaState } from '../hooks/useMedia';
import type { MediaLibrary } from '../hooks/useMediaLibrary';
import type { SpotifyState } from '../hooks/useSpotify';

type Props = {
  media: MediaState;
  library: MediaLibrary;
  spotify: SpotifyState;
  playerIcon: string | null;
  defaultPlayerName: string | null;
  onOpenPlayer: () => void;
  compact: boolean;
};

export function MusicScreen({ media, library, spotify, playerIcon, defaultPlayerName, onOpenPlayer, compact }: Props) {
  const browser = (
    <View style={styles.browserCard}>
      <SpotifyBrowser spotify={spotify} icon={library.iconOf(SPOTIFY_PACKAGE)} />
    </View>
  );

  if (compact) {
    return (
      <View style={styles.column}>
        {browser}
        <View style={styles.miniBar}>
          <MiniPlayerWidget media={media} playerIcon={playerIcon} onOpenMusic={onOpenPlayer} />
        </View>
      </View>
    );
  }

  return (
    <>
      <Animated.View entering={enterItem(0)} style={styles.player}>
        <NowPlayingCard
          media={media}
          playerIcon={playerIcon}
          defaultPlayerName={defaultPlayerName}
          onOpenPlayer={onOpenPlayer}
          layout="vertical"
        />
      </Animated.View>
      <Animated.View entering={enterItem(1)} style={styles.browser}>
        {browser}
      </Animated.View>
    </>
  );
}

const styles = StyleSheet.create({
  player: {
    flex: 1,
  },
  browser: {
    flex: 1.75,
  },
  column: {
    flex: 1,
    gap: sizes.gap,
  },
  browserCard: {
    flex: 1,
    borderRadius: sizes.cardRadius,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    paddingTop: 12,
    overflow: 'hidden',
  },
  miniBar: {
    height: 84,
  },
});
