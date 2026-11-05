// A tela do painel, no estilo CarPlay.
//
// Tela cheia (~914 × 411 dp no M51):
//  ┌──────┬────────────────────────────────┬─────────────┐
//  │ 14:32│  (capa desfocada no fundo)     │ ➤NE   ▂▄▆ ±4│
//  │      │ ┌──────┐ TOCANDO NO SPOTIFY    │ 87 km/h     │
//  │  (W) │ │ capa │ Título                │ ▮▮▮▮▮▯▯▯▯▯  │
//  │  (S) │ └──────┘ Artista               ├─────────────┤
//  │  (Z) │ ━━━━━━━━●──────────────────────│ VIAGEM 2×2  │
//  │  ▦   │  ♡    ⏮     ( ▶ )     ⏭    ⤮  ├─────────────┤
//  │      │                                │ 🔈 ▁▂▃▅▆ 🔊 │
//  └──────┴────────────────────────────────┴─────────────┘
//
// Tela dividida com o Waze (largura < 700 dp): só a barra lateral (com a
// velocidade) e o card da música. O Waze ocupa a outra metade.
//
// Para crescer (OBD2, Uber, "próxima curva" do Waze…): cada card é um
// componente independente com o seu hook.

import { useMemo, useState } from 'react';
import { StyleSheet, useWindowDimensions, View } from 'react-native';
import { type EdgeInsets, useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppGrid } from '../components/AppGrid';
import { SpeedWidget, TripWidget, VolumeWidget } from '../components/InstrumentCards';
import { NowPlayingCard } from '../components/NowPlayingCard';
import { Rail } from '../components/Rail';
import { CAR_APPS } from '../config/apps';
import { colors, COMPACT_BELOW_DP, sizes } from '../config/theme';
import { type BatteryInfo, useBattery } from '../hooks/useBattery';
import { useBurnInShift } from '../hooks/useBurnInShift';
import { useClock } from '../hooks/useClock';
import { type GpsState, useGps } from '../hooks/useGps';
import { type InstalledApp, useInstalledApps } from '../hooks/useInstalledApps';
import { type MediaState, useMedia } from '../hooks/useMedia';
import { BURN_IN_MAX_SHIFT, type Offset } from '../lib/burnIn';
import { pickDockApps } from '../lib/carApps';

export function DashboardScreen() {
  const gps = useGps();
  const battery = useBattery();
  const now = useClock();
  const media = useMedia();
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
  shortcuts: { apps: InstalledApp[]; loading: boolean; open: (pkg: string) => void };
  shift: Offset;
  insets: EdgeInsets;
  /** Tela inicial (usado na prévia com dados de exemplo). */
  initialPage?: 'painel' | 'apps';
};

/** Só desenha (sem hooks de sistema): dá pra renderizar com dados de exemplo. */
export function DashboardView({
  gps,
  battery,
  now,
  media,
  shortcuts,
  shift,
  insets,
  initialPage = 'painel',
}: DashboardViewProps) {
  const { width } = useWindowDimensions();
  const compact = width < COMPACT_BELOW_DP;
  const [page, setPage] = useState<'painel' | 'apps'>(initialPage);

  const { apps, open } = shortcuts;
  const dock = useMemo(() => pickDockApps(apps), [apps]);

  // Player: o que está tocando; se nada, o primeiro app de música instalado.
  const defaultPlayer = useMemo(() => apps.find((a) => a.tipo === 'musica') ?? null, [apps]);
  const playingPkg = media.nowPlaying?.packageName;
  const player = useMemo(
    () => (playingPkg ? (apps.find((a) => a.package === playingPkg) ?? null) : defaultPlayer),
    [apps, playingPkg, defaultPlayer],
  );
  const openPlayer = () => {
    const pkg = playingPkg ?? defaultPlayer?.package;
    if (pkg) open(pkg);
  };

  const openFromGrid = (pkg: string) => {
    open(pkg);
    setPage('painel');
  };

  // Margem fixa + margem reservada para o deslocamento anti burn-in.
  const pad = sizes.screenPadding + BURN_IN_MAX_SHIFT;

  const nowPlaying = (
    <NowPlayingCard
      media={media}
      playerIcon={player?.icon ?? null}
      defaultPlayerName={defaultPlayer?.label ?? null}
      onOpenPlayer={openPlayer}
      compact={compact}
    />
  );

  return (
    <View style={styles.root}>
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
          onTogglePage={() => setPage((p) => (p === 'painel' ? 'apps' : 'painel'))}
          speedKmh={gps.status === 'ok' ? gps.trip.speedKmh : null}
          compact={compact}
        />
        {page === 'apps' ? (
          <AppGrid
            apps={apps}
            loading={shortcuts.loading}
            onOpen={openFromGrid}
            columns={compact ? 3 : 5}
          />
        ) : compact ? (
          <View style={styles.compactMain}>{nowPlaying}</View>
        ) : (
          <>
            <View style={styles.player}>{nowPlaying}</View>
            <View style={styles.side}>
              <View style={styles.speed}>
                <SpeedWidget gps={gps} />
              </View>
              <View style={styles.trip}>
                <TripWidget gps={gps} />
              </View>
              <VolumeWidget media={media} />
            </View>
          </>
        )}
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
  player: {
    flex: 1.9,
  },
  side: {
    flex: 1,
    gap: sizes.gap,
    minHeight: 0,
  },
  // minHeight 0: deixa os cards encolherem até a parte deles (o volume tem altura fixa).
  speed: {
    flex: 1.25,
    minHeight: 0,
  },
  trip: {
    flex: 1,
    minHeight: 0,
  },
  compactMain: {
    flex: 1,
  },
});
