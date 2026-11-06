// Navegador do Spotify dentro do painel: listas com capa, título e subtítulo
// (como o Spotify no CarPlay). Tocar abre a seção/pasta ou toca o item.

import { Image } from 'expo-image';
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from 'react-native';

import { colors, font, sizes } from '../config/theme';
import type { SpotifyState } from '../hooks/useSpotify';
import type { SpotifyItem } from '../lib/spotify';
import { BackIcon, MusicIcon, PlayIcon } from './icons';
import { Touch } from './Touch';

/** Verde do Spotify, só no botão de conectar. */
const SPOTIFY_GREEN = '#1ED760';

type Props = {
  spotify: SpotifyState;
  /** Ícone do app do Spotify (do celular). */
  icon: string | null;
};

export function SpotifyBrowser({ spotify, icon }: Props) {
  const { status, error, current, depth, loading, images } = spotify;

  if (status !== 'conectado' || !current) {
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
      <View style={styles.center}>
        {icon ? <Image source={icon} style={styles.bigIcon} contentFit="contain" /> : <MusicIcon size={48} color={colors.text2} />}
        <Text style={[font(15, '600', status === 'erro' ? colors.orange : colors.text2), styles.centerText]}>{text}</Text>
        {status === 'conectando' && <ActivityIndicator color={colors.text} />}
        {canConnect && (
          <Touch onPress={() => void spotify.connect()} accessibilityLabel="Conectar ao Spotify" style={styles.connect}>
            <Text style={font(16, '800', '#000')}>Conectar ao Spotify</Text>
          </Touch>
        )}
      </View>
    );
  }

  const parent = current.parent;
  return (
    <View style={styles.flex1}>
      <View style={styles.header}>
        {depth > 1 ? (
          <Touch onPress={spotify.back} accessibilityLabel="Voltar" visualSize={40} style={styles.backButton}>
            <BackIcon size={22} color={colors.text} />
          </Touch>
        ) : null}
        <Text style={[font(16, '800'), styles.flex1]} numberOfLines={1}>
          {current.title}
        </Text>
        {loading && <ActivityIndicator size="small" color={colors.text2} />}
        {parent?.playable && (
          <Touch onPress={() => void spotify.play(parent)} accessibilityLabel={`Tocar ${parent.title}`} style={styles.playAll}>
            <PlayIcon size={18} color="#000" />
            <Text style={font(13, '800', '#000')}>Tocar</Text>
          </Touch>
        )}
      </View>
      <ScrollView contentContainerStyle={styles.list} showsVerticalScrollIndicator={false}>
        {current.items.map((item) => (
          <Row key={item.id} item={item} image={item.image ? (images[item.image] ?? null) : null} onPress={() => void spotify.open(item)} />
        ))}
        {current.items.length === 0 && !loading && (
          <Text style={[font(14, '600', colors.text2), styles.empty]}>Nada aqui.</Text>
        )}
      </ScrollView>
    </View>
  );
}

function Row({ item, image, onPress }: { item: SpotifyItem; image: string | null; onPress: () => void }) {
  return (
    <Touch onPress={onPress} accessibilityLabel={item.title} style={styles.row}>
      <View style={styles.cover}>
        {image ? (
          <Image source={image} style={StyleSheet.absoluteFill} contentFit="cover" transition={150} />
        ) : (
          <MusicIcon size={20} color={colors.text3} />
        )}
      </View>
      <View style={styles.flex1}>
        <Text style={font(15, '700')} numberOfLines={1} allowFontScaling={false}>
          {item.title}
        </Text>
        {item.subtitle ? (
          <Text style={font(12, '500', colors.text2)} numberOfLines={1} allowFontScaling={false}>
            {item.subtitle}
          </Text>
        ) : null}
      </View>
      {item.hasChildren ? (
        <Text style={font(20, '400', colors.text3)}>›</Text>
      ) : item.playable ? (
        <PlayIcon size={16} color={colors.text2} />
      ) : null}
    </Touch>
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
    paddingBottom: 6,
    minHeight: 44,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.fill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  playAll: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    minHeight: 40,
    paddingHorizontal: 14,
    borderRadius: 20,
    backgroundColor: colors.text,
  },
  list: {
    paddingHorizontal: 8,
    paddingBottom: 10,
    gap: 2,
  },
  row: {
    minHeight: sizes.minTouch,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 8,
    borderRadius: 14,
  },
  cover: {
    width: 48,
    height: 48,
    borderRadius: 6,
    overflow: 'hidden',
    backgroundColor: colors.fill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  empty: {
    padding: 12,
  },
});
