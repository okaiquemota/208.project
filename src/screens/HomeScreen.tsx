// Tela de início modular: um card principal (player ou velocidade) e uma
// coluna com até 3 widgets, tudo escolhido nos Ajustes.

import { StyleSheet, View } from 'react-native';

import { SpeedWidget, TripWidget, VolumeWidget } from '../components/InstrumentCards';
import {
  BatteryWidget,
  ClockWidget,
  CompassWidget,
  EmptyWidget,
  MiniPlayerWidget,
  ShortcutsWidget,
  WeatherWidget,
} from '../components/MoreWidgets';
import { NowPlayingCard } from '../components/NowPlayingCard';
import { sizes } from '../config/theme';
import type { BatteryInfo } from '../hooks/useBattery';
import type { GpsState } from '../hooks/useGps';
import type { InstalledApp } from '../hooks/useInstalledApps';
import type { MediaState } from '../hooks/useMedia';
import { COMPACT_WIDGETS, type SideWidgetId } from '../lib/settings';
import { useSettings } from '../state/settings';

export type HomeProps = {
  gps: GpsState;
  battery: BatteryInfo;
  now: Date;
  media: MediaState;
  /** Ícone do player atual (qualquer app de música). */
  playerIcon: string | null;
  defaultPlayerName: string | null;
  onOpenPlayer: () => void;
  onOpenMusic: () => void;
  /** Apps para o widget de atalhos. */
  shortcutApps: InstalledApp[];
  onOpenApp: (pkg: string) => void;
  compact: boolean;
};

export function HomeScreen(props: HomeProps) {
  const { settings } = useSettings();
  const { main, side } = settings.home;

  const mainCard =
    main === 'velocidade' ? (
      <SpeedWidget gps={props.gps} large />
    ) : (
      <NowPlayingCard
        media={props.media}
        playerIcon={props.playerIcon}
        defaultPlayerName={props.defaultPlayerName}
        onOpenPlayer={props.onOpenPlayer}
        compact={props.compact}
      />
    );

  // Tela dividida (Waze ao lado) ou coluna toda vazia: só o card principal.
  const hasSide = side.some((w) => w !== null);
  if (props.compact || !hasSide) return <View style={styles.full}>{mainCard}</View>;

  return (
    <>
      <View style={styles.main}>{mainCard}</View>
      <View style={styles.side}>
        {side.map((id, i) => (
          <View
            key={`${i}-${id ?? 'vazio'}`}
            style={id && COMPACT_WIDGETS.includes(id) ? styles.slotCompact : styles.slot}
          >
            {renderSideWidget(id, props)}
          </View>
        ))}
      </View>
    </>
  );
}

function renderSideWidget(id: SideWidgetId | null, p: HomeProps) {
  switch (id) {
    case 'velocidade':
      return <SpeedWidget gps={p.gps} />;
    case 'viagem':
      return <TripWidget gps={p.gps} />;
    case 'volume':
      return <VolumeWidget media={p.media} />;
    case 'relogio':
      return <ClockWidget now={p.now} />;
    case 'bateria':
      return <BatteryWidget battery={p.battery} />;
    case 'clima':
      return <WeatherWidget gps={p.gps} />;
    case 'bussola':
      return <CompassWidget gps={p.gps} />;
    case 'miniplayer':
      return <MiniPlayerWidget media={p.media} playerIcon={p.playerIcon} onOpenMusic={p.onOpenMusic} />;
    case 'atalhos':
      return <ShortcutsWidget apps={p.shortcutApps} onOpen={p.onOpenApp} />;
    default:
      return <EmptyWidget />;
  }
}

const styles = StyleSheet.create({
  full: {
    flex: 1,
  },
  main: {
    flex: 1.9,
  },
  side: {
    flex: 1,
    gap: sizes.gap,
    minHeight: 0,
  },
  slot: {
    flex: 1,
    minHeight: 0,
  },
  slotCompact: {
    flexGrow: 0,
    flexShrink: 0,
  },
});
