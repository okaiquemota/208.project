// A "casca" do app: barra lateral + a tela atual (Início, Música, Apps ou
// Ajustes). Os hooks de sistema (GPS, bateria, música…) rodam aqui, uma vez
// só, e os dados descem para as telas.
//
// Tela cheia (~914 × 411 dp no M51) ou tela dividida com o Waze (largura
// menor que 700 dp: layout compacto, só o card principal).

import { useMemo, useState } from 'react';
import { StyleSheet, useWindowDimensions, View } from 'react-native';
import { type EdgeInsets, useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppGrid, type GridTile } from '../components/AppGrid';
import { GearIcon } from '../components/icons';
import { type Page, Rail } from '../components/Rail';
import { Wallpaper } from '../components/Wallpaper';
import { CAR_APPS } from '../config/apps';
import { colors, COMPACT_BELOW_DP, sizes } from '../config/theme';
import { type BatteryInfo, useBattery } from '../hooks/useBattery';
import { useBurnInShift } from '../hooks/useBurnInShift';
import { useClock } from '../hooks/useClock';
import { type GpsState, useGps } from '../hooks/useGps';
import { type InstalledApp, useInstalledApps } from '../hooks/useInstalledApps';
import { type MediaState, useMedia } from '../hooks/useMedia';
import { type MediaLibrary, useMediaLibrary } from '../hooks/useMediaLibrary';
import { type SpotifyState, useSpotify } from '../hooks/useSpotify';
import { BURN_IN_MAX_SHIFT, type Offset } from '../lib/burnIn';
import { pickDockApps } from '../lib/carApps';
import { useAccent, useSettings } from '../state/settings';
import { HomeScreen } from './HomeScreen';
import { MusicScreen } from './MusicScreen';
import { SettingsScreen } from './SettingsScreen';

export function DashboardScreen() {
  const gps = useGps();
  const battery = useBattery();
  const now = useClock();
  const media = useMedia();
  const library = useMediaLibrary();
  // Spotify por dentro: reconecta sozinho na abertura se já foi autorizado.
  const spotify = useSpotify();
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

  const { apps, open } = shortcuts;
  const dock = useMemo(() => pickDockApps(apps).filter((a) => a.tipo !== 'musica'), [apps]);
  const shortcutApps = useMemo(() => apps.filter((a) => !dock.includes(a)), [apps, dock]);

  // Player: o que está tocando; se nada, o preferido; senão o primeiro app de música.
  const playingPkg = media.nowPlaying?.packageName ?? null;
  const defaultPlayer =
    library.entries.find((e) => e.packageName === library.preferred) ?? library.entries[0] ?? null;
  const playerPkg = playingPkg ?? defaultPlayer?.packageName ?? null;
  const playerIcon =
    library.iconOf(playerPkg) ?? apps.find((a) => a.package === playerPkg)?.icon ?? null;
  const openPlayer = () => {
    if (playerPkg) library.open(playerPkg);
  };

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
          media={media}
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
      content = <SettingsScreen gps={gps} media={media} library={library} onDone={() => setPage('inicio')} />;
      break;
    default:
      content = (
        <HomeScreen
          gps={gps}
          battery={battery}
          now={now}
          media={media}
          playerIcon={playerIcon}
          defaultPlayerName={defaultPlayer?.label ?? null}
          onOpenPlayer={openPlayer}
          onOpenMusic={() => setPage('musica')}
          shortcutApps={shortcutApps}
          onOpenApp={open}
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
          onOpenApp={open}
          page={page}
          onNavigate={setPage}
          speedKmh={gps.status === 'ok' ? gps.trip.speedKmh : null}
          compact={compact}
        />
        {content}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.bg,
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
