// A tela única do painel (paisagem, ~914 × 411 dp no M51).
//
//  ┌──── 40% ────┬──────────────── 60% ─────────────────┐
//  │             │ relógio · data · bateria · GPS        │
//  │ velocímetro │ distância · tempo · média · máxima    │
//  │             │ ⏮ ⏯ ⏭            − volume +           │
//  │             │ atalhos de apps                       │
//  └─────────────┴───────────────────────────────────────┘
//
// Para crescer (OBD2, "tocando agora"): cada faixa da direita é um componente
// independente com o seu hook. Um card novo entra aqui sem mexer nos outros.

import { StyleSheet, View } from 'react-native';
import { type EdgeInsets, useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppShortcuts } from '../components/AppShortcuts';
import { MediaControls } from '../components/MediaControls';
import { SpeedPanel } from '../components/SpeedPanel';
import { StatusHeader } from '../components/StatusHeader';
import { TripCards } from '../components/TripCards';
import { CAR_APPS } from '../config/apps';
import { colors, sizes } from '../config/theme';
import { type BatteryInfo, useBattery } from '../hooks/useBattery';
import { useBurnInShift } from '../hooks/useBurnInShift';
import { useClock } from '../hooks/useClock';
import { type GpsState, useGps } from '../hooks/useGps';
import { type InstalledApp, useInstalledApps } from '../hooks/useInstalledApps';
import { type MediaControls as MediaControlsState, useMediaKeys } from '../hooks/useMediaKeys';
import { BURN_IN_MAX_SHIFT, type Offset } from '../lib/burnIn';

export function DashboardScreen() {
  const gps = useGps();
  const battery = useBattery();
  const now = useClock();
  const media = useMediaKeys();
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
  media: MediaControlsState;
  shortcuts: { apps: InstalledApp[]; loading: boolean; open: (pkg: string) => void };
  shift: Offset;
  insets: EdgeInsets;
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
}: DashboardViewProps) {
  // Margem fixa + margem reservada para o deslocamento anti burn-in.
  const pad = sizes.screenPadding + BURN_IN_MAX_SHIFT;

  return (
    <View style={styles.root}>
      <View
        style={[
          styles.frame,
          {
            paddingTop: pad + insets.top,
            paddingBottom: pad + insets.bottom,
            paddingLeft: pad + insets.left,
            paddingRight: pad + insets.right,
            transform: [{ translateX: shift.x }, { translateY: shift.y }],
          },
        ]}
      >
        <View style={styles.left}>
          <SpeedPanel gps={gps} />
        </View>
        <View style={styles.right}>
          <StatusHeader
            now={now}
            battery={battery}
            gpsStatus={gps.status}
            accuracyM={gps.accuracyM}
          />
          <TripCards trip={gps.trip} onReset={gps.resetTrip} />
          <MediaControls media={media} />
          <AppShortcuts apps={shortcuts.apps} loading={shortcuts.loading} onOpen={shortcuts.open} />
        </View>
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
    gap: sizes.gap * 1.5,
  },
  left: {
    flex: 4,
  },
  right: {
    flex: 6,
    justifyContent: 'space-between',
    gap: sizes.gap,
  },
});
