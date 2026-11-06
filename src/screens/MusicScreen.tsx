// Tela de música: o player grande e, ao lado, duas abas:
// - Spotify: suas playlists, curtidas e mixes, tocando sem sair do painel;
// - Apps: TODOS os apps de música do celular (achados sozinhos). Tocar num
//   app escolhe ele como o player que o painel acompanha e, se ele ainda não
//   tiver música carregada, abre o app.

import { Image } from 'expo-image';
import { type ReactNode, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

import { CheckIcon, MusicIcon } from '../components/icons';
import { NowPlayingCard } from '../components/NowPlayingCard';
import { SpotifyBrowser } from '../components/SpotifyBrowser';
import { Touch } from '../components/Touch';
import { colors, font, sizes } from '../config/theme';
import type { MediaState } from '../hooks/useMedia';
import type { MediaLibrary } from '../hooks/useMediaLibrary';
import type { SpotifyState } from '../hooks/useSpotify';
import { useAccent } from '../state/settings';

type Props = {
  media: MediaState;
  library: MediaLibrary;
  spotify: SpotifyState;
  playerIcon: string | null;
  defaultPlayerName: string | null;
  onOpenPlayer: () => void;
  compact: boolean;
};

const SPOTIFY_PACKAGE = 'com.spotify.music';

export function MusicScreen({ media, library, spotify, playerIcon, defaultPlayerName, onOpenPlayer, compact }: Props) {
  const accent = useAccent();
  const current = media.nowPlaying?.packageName ?? null;
  const hasSpotify = spotify.status !== 'sem-app' && spotify.status !== 'indisponivel';
  const [tab, setTab] = useState<'spotify' | 'apps'>(hasSpotify ? 'spotify' : 'apps');

  const choose = (pkg: string, hasSession: boolean) => {
    library.select(pkg);
    if (!hasSession) library.open(pkg);
  };

  const player = (
    <NowPlayingCard
      media={media}
      playerIcon={playerIcon}
      defaultPlayerName={defaultPlayerName}
      onOpenPlayer={onOpenPlayer}
      compact={compact}
    />
  );
  if (compact) return <View style={styles.full}>{player}</View>;

  return (
    <>
      <View style={styles.player}>{player}</View>
      <View style={styles.listCard}>
        <View style={styles.tabs}>
          {hasSpotify && (
            <TabButton label="Spotify" active={tab === 'spotify'} onPress={() => setTab('spotify')} />
          )}
          <TabButton label="Apps de música" active={tab === 'apps' || !hasSpotify} onPress={() => setTab('apps')} />
        </View>
        {tab === 'spotify' && hasSpotify ? (
          <SpotifyBrowser spotify={spotify} icon={library.iconOf(SPOTIFY_PACKAGE)} />
        ) : (
        <ScrollView contentContainerStyle={styles.list} showsVerticalScrollIndicator={false}>
          <Row
            title="Automático"
            subtitle="Acompanha o que estiver tocando"
            icon={<MusicIcon size={24} color={colors.text} />}
            selected={library.preferred === null}
            accent={accent.main}
            onPress={() => library.select(null)}
          />
          {library.entries.map((app) => {
            const s = app.session;
            const subtitle = s?.isPlaying
              ? `Tocando: ${s.title || 'música'}`
              : s
                ? s.title
                  ? `Pausado: ${s.title}`
                  : 'Pausado'
                : 'Toque para abrir';
            return (
              <Row
                key={app.packageName}
                title={app.label}
                subtitle={subtitle}
                icon={app.icon}
                live={s?.isPlaying === true}
                current={current === app.packageName}
                selected={library.preferred === app.packageName}
                accent={accent.main}
                onPress={() => choose(app.packageName, s !== null)}
              />
            );
          })}
          {library.entries.length === 0 && (
            <Text style={[font(14, '600', colors.text2), styles.emptyText]}>
              Nenhum app de música encontrado.
            </Text>
          )}
        </ScrollView>
        )}
      </View>
    </>
  );
}

function TabButton({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) {
  return (
    <Touch onPress={onPress} accessibilityLabel={label} style={[styles.tab, active && styles.tabActive]}>
      <Text style={font(13, '700', active ? '#000' : colors.text2)} allowFontScaling={false}>
        {label}
      </Text>
    </Touch>
  );
}

function Row({
  title,
  subtitle,
  icon,
  selected,
  current,
  live,
  accent,
  onPress,
}: {
  title: string;
  subtitle: string;
  icon: string | ReactNode | null;
  selected: boolean;
  current?: boolean;
  live?: boolean;
  accent: string;
  onPress: () => void;
}) {
  return (
    <Touch
      onPress={onPress}
      accessibilityLabel={title}
      style={[styles.row, current && styles.rowCurrent]}
    >
      <View style={styles.rowIcon}>
        {typeof icon === 'string' ? (
          <Image source={icon} style={styles.appIcon} contentFit="contain" transition={0} />
        ) : icon ? (
          icon
        ) : (
          <View style={styles.iconPlaceholder} />
        )}
      </View>
      <View style={styles.rowText}>
        <Text style={font(16, '700')} numberOfLines={1} allowFontScaling={false}>
          {title}
        </Text>
        <Text style={font(12, '600', live ? colors.green : colors.text2)} numberOfLines={1} allowFontScaling={false}>
          {subtitle}
        </Text>
      </View>
      {selected && (
        <View style={[styles.check, { backgroundColor: accent }]}>
          <CheckIcon size={16} color={colors.text} />
        </View>
      )}
    </Touch>
  );
}

const styles = StyleSheet.create({
  full: {
    flex: 1,
  },
  player: {
    flex: 1.8,
  },
  listCard: {
    flex: 1,
    borderRadius: sizes.cardRadius,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    paddingTop: 12,
    overflow: 'hidden',
  },
  tabs: {
    flexDirection: 'row',
    gap: 6,
    paddingHorizontal: 12,
    marginBottom: 8,
  },
  tab: {
    minHeight: 40,
    paddingHorizontal: 14,
    borderRadius: 20,
    backgroundColor: colors.fill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabActive: {
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
    borderRadius: 16,
  },
  rowCurrent: {
    backgroundColor: colors.fill,
  },
  rowIcon: {
    width: 42,
    height: 42,
    alignItems: 'center',
    justifyContent: 'center',
  },
  appIcon: {
    width: 42,
    height: 42,
  },
  iconPlaceholder: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: colors.fill,
  },
  rowText: {
    flex: 1,
  },
  check: {
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    padding: 12,
  },
});
