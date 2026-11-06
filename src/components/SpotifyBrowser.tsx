// Escolher música no Spotify, dentro do painel, no estilo do Spotify no CarPlay:
// - em cima, as abas (seções do Spotify: tocadas recentemente, biblioteca…);
// - fileiras de capas grandes (playlists, álbuns, mixes);
// - tocar numa capa abre a playlist: capa grande, Tocar, Aleatório e as músicas;
// - o que está tocando aparece com barrinhas animadas.
// Tudo entra com movimento (capas em sequência, telas deslizando).

import { Image } from 'expo-image';
import { useEffect, useState } from 'react';
import { ActivityIndicator, type LayoutChangeEvent, ScrollView, StyleSheet, Text, View } from 'react-native';
import Animated, {
  FadeIn,
  FadeInRight,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';

import { colors, font, sizes } from '../config/theme';
import type { SpotifyShelf, SpotifyState } from '../hooks/useSpotify';
import { detailLayout, type SpotifyItem } from '../lib/spotify';
import { BackIcon, MusicIcon, PlayIcon, ShuffleIcon } from './icons';
import { enterItem, PlayingBars } from './motion';
import { Touch } from './Touch';

/** Verde do Spotify: o que está tocando e o botão de conectar. */
const SPOTIFY_GREEN = '#1ED760';
/** Capa nas fileiras (dp). */
const SHELF_TILE = 128;
/** Capa mínima na grade (dp). */
const GRID_MIN = 118;
const GAP = 12;
const PAD_X = 14;

type Props = {
  spotify: SpotifyState;
  /** Ícone do app do Spotify (do celular). */
  icon: string | null;
};

export function SpotifyBrowser({ spotify, icon }: Props) {
  const { status, error, errorDetail } = spotify;

  if (status !== 'conectado') {
    const text =
      status === 'indisponivel'
        ? 'Gere o app de novo para ativar o Spotify.'
        : status === 'sem-app'
          ? 'Instale o app do Spotify no celular.'
          : status === 'conectando'
            ? 'Conectando ao Spotify…'
            : (error ?? 'Suas playlists, músicas curtidas e mixes aqui no painel.');
    const canConnect = status === 'desconectado' || status === 'erro';
    return (
      <Animated.View entering={FadeIn.duration(250)} style={styles.center}>
        {icon ? <Image source={icon} style={styles.bigIcon} contentFit="contain" /> : <MusicIcon size={48} color={colors.text2} />}
        <Text style={[font(15, '600', status === 'erro' ? colors.orange : colors.text2), styles.centerText]}>{text}</Text>
        {status === 'erro' && errorDetail ? (
          <Text style={[font(11, '500', colors.text3), styles.centerText]} numberOfLines={3} selectable>
            {errorDetail}
          </Text>
        ) : null}
        {status === 'conectando' && <ActivityIndicator color={colors.text} />}
        {canConnect && (
          <Touch onPress={() => void spotify.connect()} accessibilityLabel="Conectar ao Spotify" style={styles.connect}>
            <Text style={font(16, '800', '#000')}>Conectar ao Spotify</Text>
          </Touch>
        )}
      </Animated.View>
    );
  }

  return spotify.detail ? <DetailView spotify={spotify} /> : <TabsView spotify={spotify} />;
}

// ---------- Abas + fileiras ----------

function TabsView({ spotify }: { spotify: SpotifyState }) {
  const { tabs, tabId, shelves, loading } = spotify;
  const [width, setWidth] = useState(0);
  const onLayout = (e: LayoutChangeEvent) => setWidth(e.nativeEvent.layout.width);

  return (
    <View style={styles.flex1} onLayout={onLayout}>
      <View style={styles.tabsBar}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabs}>
          {tabs.map((t) => {
            const active = t.id === tabId;
            return (
              <Touch
                key={t.id}
                onPress={() => spotify.selectTab(t.id)}
                accessibilityLabel={t.title}
                style={[styles.tab, active && styles.tabActive]}
              >
                <Text style={font(14, '700', active ? '#000' : colors.text)} numberOfLines={1} allowFontScaling={false}>
                  {t.title}
                </Text>
              </Touch>
            );
          })}
          {loading && <ActivityIndicator size="small" color={colors.text2} style={styles.tabSpinner} />}
        </ScrollView>
      </View>

      {/* Conteúdo da aba (troca com fade ao mudar de aba) */}
      <Animated.ScrollView
        key={tabId ?? 'vazio'}
        entering={FadeIn.duration(220)}
        contentContainerStyle={styles.shelves}
        showsVerticalScrollIndicator={false}
      >
        {shelves.map((shelf) =>
          shelf.title === null ? (
            <Grid key={shelf.id} items={shelf.items} width={width - PAD_X * 2} spotify={spotify} />
          ) : (
            <Shelf key={shelf.id} shelf={shelf} spotify={spotify} />
          ),
        )}
        {shelves.length === 0 && !loading && (
          <Text style={[font(14, '600', colors.text2), styles.empty]}>Nada aqui.</Text>
        )}
      </Animated.ScrollView>
    </View>
  );
}

function Shelf({ shelf, spotify }: { shelf: SpotifyShelf; spotify: SpotifyState }) {
  return (
    <View style={styles.shelf}>
      <Text style={[font(17, '800'), styles.shelfTitle]} numberOfLines={1} allowFontScaling={false}>
        {shelf.title}
      </Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.shelfRow}>
        {shelf.loading
          ? [0, 1, 2, 3].map((i) => <Skeleton key={i} size={SHELF_TILE} />)
          : shelf.items.map((item, i) => <Tile key={item.id} item={item} size={SHELF_TILE} index={i} spotify={spotify} />)}
      </ScrollView>
    </View>
  );
}

function Grid({ items, width, spotify }: { items: SpotifyItem[]; width: number; spotify: SpotifyState }) {
  if (width <= 0) return null;
  const cols = Math.max(2, Math.floor((width + GAP) / (GRID_MIN + GAP)));
  const size = Math.floor((width - GAP * (cols - 1)) / cols);
  return (
    <View style={styles.grid}>
      {items.map((item, i) => (
        <Tile key={item.id} item={item} size={size} index={i} spotify={spotify} />
      ))}
    </View>
  );
}

/** Capa com título; a que está tocando ganha as barrinhas e o título verde. */
function Tile({ item, size, index, spotify }: { item: SpotifyItem; size: number; index: number; spotify: SpotifyState }) {
  const image = item.image ? (spotify.images[item.image] ?? null) : null;
  const player = spotify.player;
  const playing = !!player && !!item.uri && (player.contextUri === item.uri || player.uri === item.uri);
  return (
    <Animated.View entering={enterItem(index)} style={{ width: size }}>
      <Touch onPress={() => void spotify.open(item)} accessibilityLabel={item.title} pressScale={0.95}>
        <View style={[styles.cover, { width: size, height: size }]}>
          {image ? (
            <Image source={image} style={StyleSheet.absoluteFill} contentFit="cover" transition={200} />
          ) : (
            <MusicIcon size={size * 0.3} color={colors.text3} />
          )}
          {playing && (
            <View style={styles.playingBadge}>
              <PlayingBars color={SPOTIFY_GREEN} playing={!player.isPaused} size={14} />
            </View>
          )}
        </View>
        <Text
          style={[font(13, '700', playing ? SPOTIFY_GREEN : colors.text), styles.tileTitle]}
          numberOfLines={1}
          allowFontScaling={false}
        >
          {item.title}
        </Text>
        {item.subtitle ? (
          <Text style={font(11, '500', colors.text2)} numberOfLines={1} allowFontScaling={false}>
            {item.subtitle}
          </Text>
        ) : null}
      </Touch>
    </Animated.View>
  );
}

/** Capa "carregando" que pulsa de leve. */
function Skeleton({ size }: { size: number }) {
  const o = useSharedValue(0.5);
  useEffect(() => {
    o.value = withRepeat(withTiming(1, { duration: 700 }), -1, true);
  }, [o]);
  const style = useAnimatedStyle(() => ({ opacity: o.value }));
  return (
    <View style={{ width: size }}>
      <Animated.View style={[styles.cover, styles.skeleton, { width: size, height: size }, style]} />
      <Animated.View style={[styles.skeletonLine, style]} />
    </View>
  );
}

// ---------- Playlist / álbum aberto ----------

function DetailView({ spotify }: { spotify: SpotifyState }) {
  const detail = spotify.detail!;
  const { item, items } = detail;
  const [width, setWidth] = useState(0);
  const image = item.image ? (spotify.images[item.image] ?? null) : null;
  const layout = detailLayout(items);
  const player = spotify.player;

  return (
    <Animated.View
      key={item.id}
      entering={FadeInRight.duration(280)}
      style={styles.flex1}
      onLayout={(e) => setWidth(e.nativeEvent.layout.width)}
    >
      <View style={styles.detailHeader}>
        <Touch onPress={spotify.back} accessibilityLabel="Voltar" visualSize={44} style={styles.backButton}>
          <BackIcon size={24} color={colors.text} />
        </Touch>
        <View style={styles.detailCover}>
          {image ? (
            <Image source={image} style={StyleSheet.absoluteFill} contentFit="cover" transition={200} />
          ) : (
            <MusicIcon size={34} color={colors.text3} />
          )}
        </View>
        <View style={styles.flex1}>
          <Text style={font(22, '800')} numberOfLines={2} adjustsFontSizeToFit minimumFontScale={0.8} allowFontScaling={false}>
            {item.title}
          </Text>
          {item.subtitle ? (
            <Text style={font(13, '600', colors.text2)} numberOfLines={1} allowFontScaling={false}>
              {item.subtitle}
            </Text>
          ) : null}
          {item.playable && (
            <View style={styles.detailButtons}>
              <Touch onPress={() => void spotify.playItem(item, false)} accessibilityLabel={`Tocar ${item.title}`} style={styles.playPill}>
                <PlayIcon size={20} color="#000" />
                <Text style={font(15, '800', '#000')}>Tocar</Text>
              </Touch>
              <Touch
                onPress={() => void spotify.playItem(item, true)}
                accessibilityLabel={`Tocar ${item.title} no aleatório`}
                style={styles.shufflePill}
              >
                <ShuffleIcon size={20} color={SPOTIFY_GREEN} />
                <Text style={font(15, '800')}>Aleatório</Text>
              </Touch>
            </View>
          )}
        </View>
        {spotify.loading && <ActivityIndicator size="small" color={colors.text2} />}
      </View>

      <ScrollView contentContainerStyle={styles.detailList} showsVerticalScrollIndicator={false}>
        {layout === 'capas' ? (
          <Grid items={items} width={width - PAD_X * 2} spotify={spotify} />
        ) : (
          items.map((track, i) => {
            const playing = !!player && !!track.uri && player.uri === track.uri;
            return (
              <Animated.View key={track.id} entering={enterItem(i)}>
                <Touch onPress={() => void spotify.open(track)} accessibilityLabel={track.title} pressScale={0.98} style={styles.trackRow}>
                  <View style={styles.trackIndex}>
                    {playing ? (
                      <PlayingBars color={SPOTIFY_GREEN} playing={!player.isPaused} size={16} />
                    ) : (
                      <Text style={font(14, '600', colors.text3)}>{i + 1}</Text>
                    )}
                  </View>
                  <View style={styles.flex1}>
                    <Text style={font(15, '700', playing ? SPOTIFY_GREEN : colors.text)} numberOfLines={1} allowFontScaling={false}>
                      {track.title}
                    </Text>
                    {track.subtitle ? (
                      <Text style={font(12, '500', colors.text2)} numberOfLines={1} allowFontScaling={false}>
                        {track.subtitle}
                      </Text>
                    ) : null}
                  </View>
                </Touch>
              </Animated.View>
            );
          })
        )}
        {items.length === 0 && !spotify.loading && (
          <Text style={[font(14, '600', colors.text2), styles.empty]}>Nada aqui.</Text>
        )}
      </ScrollView>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  flex1: {
    flex: 1,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    paddingHorizontal: 18,
  },
  centerText: {
    textAlign: 'center',
  },
  bigIcon: {
    width: 56,
    height: 56,
  },
  connect: {
    minHeight: 52,
    paddingHorizontal: 24,
    borderRadius: 26,
    backgroundColor: SPOTIFY_GREEN,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabsBar: {
    height: 54,
    flexShrink: 0,
  },
  tabs: {
    gap: 8,
    paddingHorizontal: PAD_X,
    alignItems: 'center',
    height: 54,
  },
  tab: {
    minHeight: 42,
    paddingHorizontal: 16,
    borderRadius: 21,
    backgroundColor: colors.fill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabActive: {
    backgroundColor: colors.text,
  },
  tabSpinner: {
    marginLeft: 4,
  },
  shelves: {
    paddingHorizontal: PAD_X,
    paddingBottom: 16,
    gap: 18,
  },
  shelf: {
    gap: 10,
  },
  shelfTitle: {
    marginLeft: 2,
  },
  shelfRow: {
    gap: GAP,
    paddingRight: PAD_X,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: GAP,
    rowGap: 16,
  },
  cover: {
    borderRadius: 8,
    overflow: 'hidden',
    backgroundColor: colors.fill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  playingBadge: {
    position: 'absolute',
    right: 8,
    bottom: 8,
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: 'rgba(0,0,0,0.75)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  tileTitle: {
    marginTop: 8,
  },
  skeleton: {
    backgroundColor: 'rgba(255,255,255,0.10)',
  },
  skeletonLine: {
    marginTop: 10,
    height: 10,
    width: '70%',
    borderRadius: 5,
    backgroundColor: 'rgba(255,255,255,0.10)',
  },
  detailHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingHorizontal: PAD_X,
    paddingBottom: 12,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.fill,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'flex-start',
  },
  detailCover: {
    width: 108,
    height: 108,
    borderRadius: 10,
    overflow: 'hidden',
    backgroundColor: colors.fill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  detailButtons: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 10,
  },
  playPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    minHeight: 48,
    paddingHorizontal: 20,
    borderRadius: 24,
    backgroundColor: SPOTIFY_GREEN,
  },
  shufflePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    minHeight: 48,
    paddingHorizontal: 18,
    borderRadius: 24,
    backgroundColor: colors.fill,
  },
  detailList: {
    paddingHorizontal: PAD_X,
    paddingBottom: 16,
    gap: 2,
  },
  trackRow: {
    minHeight: sizes.minTouch,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 6,
    borderRadius: 12,
  },
  trackIndex: {
    width: 26,
    alignItems: 'center',
  },
  empty: {
    padding: 12,
  },
});
