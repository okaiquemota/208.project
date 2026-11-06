// A "casca" do app: barra lateral + a tela atual (Início, Música, Apps,
// Ajustes ou Mensagens). Os hooks de sistema (GPS, bateria, música…) rodam aqui, uma vez
// só, e os dados descem para as telas.
//
// Tela cheia (~914 × 411 dp no M51) ou tela dividida com o Waze (largura
// menor que 700 dp: layout compacto, só o card principal).

import { useMemo, useState } from 'react';
import { Linking, StyleSheet, useWindowDimensions, View } from 'react-native';
import Animated from 'react-native-reanimated';
import { type EdgeInsets, useSafeAreaInsets } from 'react-native-safe-area-context';

import MediaKeys from '../../modules/media-keys';
import { AppGrid, type GridTile } from '../components/AppGrid';
import { GearIcon } from '../components/icons';
import { enterPage } from '../components/motion';
import type { WazeActions } from '../components/MapHud';
import { type Page, Rail } from '../components/Rail';
import { Wallpaper } from '../components/Wallpaper';
import { CAR_APPS } from '../config/apps';
import { SPOTIFY_PACKAGE } from '../config/spotify';
import { colors, COMPACT_BELOW_DP, sizes } from '../config/theme';
import { type BatteryInfo, useBattery } from '../hooks/useBattery';
import { type CarNotificationsState, useCarNotifications } from '../hooks/useCarNotifications';
import { useBurnInShift } from '../hooks/useBurnInShift';
import { useClock } from '../hooks/useClock';
import { type GpsState, useGps } from '../hooks/useGps';
import { type InstalledApp, useInstalledApps } from '../hooks/useInstalledApps';
import { type MediaState, useMedia } from '../hooks/useMedia';
import { type MediaLibrary, useMediaLibrary } from '../hooks/useMediaLibrary';
import { usePlayer } from '../hooks/usePlayer';
import { type SplitScreenState, useSplitScreen } from '../hooks/useSplitScreen';
import { type SpotifyState, useSpotify } from '../hooks/useSpotify';
import { BURN_IN_MAX_SHIFT, type Offset } from '../lib/burnIn';
import { pickDockApps } from '../lib/carApps';
import { wazeFavoriteUrl } from '../lib/wazeMap';
import { useAccent, useSettings } from '../state/settings';
import { HomeScreen } from './HomeScreen';
import { MessagesScreen } from './MessagesScreen';
import { MusicScreen } from './MusicScreen';
import { SettingsScreen } from './SettingsScreen';

const CHAT_PACKAGES = ['com.whatsapp', 'com.whatsapp.w4b'];
const WAZE_PACKAGE = 'com.waze';

export function DashboardScreen() {
  const gps = useGps();
  const battery = useBattery();
  const now = useClock();
  const media = useMedia();
  const library = useMediaLibrary();
  // Spotify por dentro: reconecta sozinho na abertura se já foi autorizado.
  const spotify = useSpotify();
  // Próxima curva (Waze/Maps) e WhatsApp, pelas notificações.
  const notifications = useCarNotifications();
  // Waze + painel lado a lado com um toque.
  const split = useSplitScreen();
  const shortcuts = useInstalledApps(CAR_APPS);
  const shift = useBurnInShift();
  // Furo da câmera (Infinity-O) e afins: o conteúdo não fica embaixo dele.
  const insets = useSafeAreaInsets();

  return (
    <DashboardView
      gps={gps}
      battery={battery}
      now={now}
      media={media}
      library={library}
      spotify={spotify}
      notifications={notifications}
      split={split}
      shortcuts={shortcuts}
      shift={shift}
      insets={insets}
    />
  );
}

export type DashboardViewProps = {
  gps: GpsState;
  battery: BatteryInfo;
  now: Date;
  media: MediaState;
  library: MediaLibrary;
  spotify: SpotifyState;
  notifications: CarNotificationsState;
  split: SplitScreenState;
  shortcuts: { apps: InstalledApp[]; loading: boolean; open: (pkg: string) => void };
  shift: Offset;
  insets: EdgeInsets;
  /** Tela inicial (usado na prévia com dados de exemplo). */
  initialPage?: Page;
};

/** Só desenha (sem hooks de sistema): dá pra renderizar com dados de exemplo. */
export function DashboardView({
  gps,
  battery,
  now,
  media,
  library,
  spotify,
  notifications,
  split,
  shortcuts,
  shift,
  insets,
  initialPage = 'inicio',
}: DashboardViewProps) {
  const { width } = useWindowDimensions();
  const compact = width < COMPACT_BELOW_DP;
  const [page, setPage] = useState<Page>(initialPage);
  const accent = useAccent();
  const { background } = useSettings().settings;
  // O player do card: sessão de mídia do Android ou conexão direta com o Spotify.
  const player = usePlayer(media, spotify);

  const { apps, open } = shortcuts;
  const dock = useMemo(() => pickDockApps(apps).filter((a) => a.tipo !== 'musica'), [apps]);
  const shortcutApps = useMemo(() => apps.filter((a) => !dock.includes(a)), [apps, dock]);

  // Player (sempre automático): o que está tocando; se nada, o Spotify; senão o primeiro app de música.
  const playingPkg = player.nowPlaying?.packageName ?? null;
  const defaultPlayer =
    library.entries.find((e) => e.packageName === SPOTIFY_PACKAGE) ?? library.entries[0] ?? null;
  const playerPkg = playingPkg ?? defaultPlayer?.packageName ?? null;
  const playerIcon =
    library.iconOf(playerPkg) ?? apps.find((a) => a.package === playerPkg)?.icon ?? null;
  const openPlayer = () => {
    if (playerPkg) library.open(playerPkg);
  };

  // WhatsApp e Waze: os de verdade, instalados no celular.
  const whatsapp = apps.find((a) => CHAT_PACKAGES.includes(a.package)) ?? null;
  const waze = apps.find((a) => a.package === WAZE_PACKAGE) ?? null;
  // Apps de navegação (Waze, Maps): abrem lado a lado com o painel, como no CarPlay.
  const openNav = (pkg: string) => {
    if (!split.openSplit(pkg)) open(pkg);
  };
  // No dock: WhatsApp abre as mensagens dentro do painel; navegação abre lado a lado.
  const openDockApp = (pkg: string) => {
    if (notifications.available && CHAT_PACKAGES.includes(pkg)) setPage('mensagens');
    else if (dock.find((a) => a.package === pkg)?.tipo === 'navegacao') openNav(pkg);
    else open(pkg);
  };
  const badges = whatsapp ? { [whatsapp.package]: notifications.chats.length } : undefined;
  const wazeActions: WazeActions | null = waze
    ? {
        open: () => openNav(waze.package),
        navigateTo: (favorite) => {
          const url = wazeFavoriteUrl(favorite);
          let opened = false;
          try {
            opened = MediaKeys?.openUrlAdjacent(url, WAZE_PACKAGE) ?? false;
          } catch {
            opened = false;
          }
          if (!opened) void Linking.openURL(url).catch(() => undefined);
        },
        icon: waze.icon,
      }
    : null;

  // Grade de apps: Ajustes + a lista do app.json + apps de música achados sozinhos.
  const tiles: GridTile[] = useMemo(() => {
    const list: GridTile[] = [
      {
        key: 'ajustes',
        label: 'Ajustes',
        icon: (
          <View style={[styles.settingsTile, { backgroundColor: accent.main }]}>
            <GearIcon size={40} color={colors.text} />
          </View>
        ),
        onPress: () => setPage('ajustes'),
      },
    ];
    for (const a of apps) list.push({ key: a.package, label: a.label, icon: a.icon, onPress: () => open(a.package) });
    for (const m of library.entries) {
      if (!apps.some((a) => a.package === m.packageName)) {
        list.push({ key: m.packageName, label: m.label, icon: m.icon, onPress: () => library.open(m.packageName) });
      }
    }
    return list;
  }, [apps, library, open, accent.main]);

  // Margem fixa + margem reservada para o deslocamento anti burn-in.
  const pad = sizes.screenPadding + BURN_IN_MAX_SHIFT;

  let content;
  switch (page) {
    case 'musica':
      content = (
        <MusicScreen
          media={player}
          library={library}
          spotify={spotify}
          playerIcon={playerIcon}
          defaultPlayerName={defaultPlayer?.label ?? null}
          onOpenPlayer={openPlayer}
          compact={compact}
        />
      );
      break;
    case 'apps':
      content = <AppGrid tiles={tiles} columns={compact ? 3 : 5} />;
      break;
    case 'ajustes':
      content = <SettingsScreen gps={gps} media={media} split={split} onDone={() => setPage('inicio')} />;
      break;
    case 'mensagens':
      content = (
        <MessagesScreen
          notifications={notifications}
          hasAccess={media.hasAccess}
          onOpenAccess={media.openAccessSettings}
          icon={whatsapp?.icon ?? null}
          compact={compact}
        />
      );
      break;
    default:
      content = (
        <HomeScreen
          gps={gps}
          battery={battery}
          now={now}
          media={player}
          playerIcon={playerIcon}
          defaultPlayerName={defaultPlayer?.label ?? null}
          onOpenPlayer={openPlayer}
          onOpenMusic={() => setPage('musica')}
          shortcutApps={shortcutApps}
          onOpenApp={open}
          notifications={notifications}
          notificationAccess={media.hasAccess}
          onOpenAccess={media.openAccessSettings}
          onOpenMessages={() => setPage('mensagens')}
          waze={wazeActions}
          whatsappIcon={whatsapp?.icon ?? null}
          compact={compact}
        />
      );
  }

  return (
    <View style={styles.root}>
      {background === 'papel' && <Wallpaper main={accent.main} soft={accent.soft} />}
      <View
        style={[
          styles.frame,
          {
            paddingTop: pad + insets.top,
            paddingBottom: pad + insets.bottom,
            paddingLeft: insets.left + 2,
            paddingRight: pad + insets.right,
            transform: [{ translateX: shift.x }, { translateY: shift.y }],
          },
        ]}
      >
        <Rail
          now={now}
          battery={battery}
          dock={dock}
          onOpenApp={openDockApp}
          badges={badges}
          activeApp={page === 'mensagens' ? (whatsapp?.package ?? null) : null}
          page={page}
          onNavigate={setPage}
          speedKmh={gps.status === 'ok' ? gps.trip.speedKmh : null}
          compact={compact}
        />
        {/* Tela nova entra com um fade suave */}
        <Animated.View key={page} entering={enterPage} style={styles.page}>
          {content}
        </Animated.View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  page: {
    flex: 1,
    flexDirection: 'row',
    gap: sizes.gap,
  },
  frame: {
    flex: 1,
    flexDirection: 'row',
    gap: sizes.gap,
  },
  settingsTile: {
    width: 72,
    height: 72,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
