// Tela de início modular: um card principal (player, mapa do Waze ou
// velocidade) e uma coluna com até 3 widgets, tudo escolhido nos Ajustes.

import { StyleSheet, View } from 'react-native';
import Animated from 'react-native-reanimated';

import { MessagesWidget, NextTurnWidget } from '../components/CarNotificationWidgets';
import { SpeedWidget, TripWidget, VolumeWidget } from '../components/InstrumentCards';
import {
  BatteryWidget,
  CalendarWidget,
  ClockWidget,
  CompassWidget,
  MiniPlayerWidget,
  ShortcutsWidget,
  WeatherWidget,
} from '../components/MoreWidgets';
import { enterItem } from '../components/motion';
import { NowPlayingCard } from '../components/NowPlayingCard';
import type { WazeActions } from '../components/MapHud';
import { WazeMap } from '../components/WazeMap';
import { sizes } from '../config/theme';
import type { BatteryInfo } from '../hooks/useBattery';
import type { CarNotificationsState } from '../hooks/useCarNotifications';
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
  /** Próxima curva e conversas (das notificações). */
  notifications: Pick<CarNotificationsState, 'navigation' | 'chats' | 'open'>;
  /** "Acesso a notificações" liberado (o de verdade, não o do Spotify). */
  notificationAccess: boolean;
  onOpenAccess: () => void;
  onOpenMessages: () => void;
  /** Botões do Waze de verdade no mapa (null se não estiver instalado). */
  waze: WazeActions | null;
  whatsappIcon: string | null;
  compact: boolean;
};

export function HomeScreen(props: HomeProps) {
  const { settings } = useSettings();
  const { main, side } = settings.home;

  const mainCard =
    main === 'velocidade' ? (
      <SpeedWidget gps={props.gps} large />
    ) : main === 'mapa' ? (
      <WazeMap
        gps={props.gps}
        theme={settings.mapTheme}
        hud={{
          nav: props.notifications.navigation,
          onOpenNav: props.notifications.open,
          speedKmh: props.gps.status === 'ok' ? props.gps.trip.speedKmh : null,
          speedAlertKmh: settings.speedAlertKmh,
          waze: props.waze,
          now: props.now.getTime(),
          compact: props.compact,
        }}
      />
    ) : (
      <NowPlayingCard
        media={props.media}
        playerIcon={props.playerIcon}
        defaultPlayerName={props.defaultPlayerName}
        onOpenPlayer={props.onOpenPlayer}
        compact={props.compact}
      />
    );

  // Posições vazias somem: os outros widgets crescem para ocupar o espaço.
  const widgets = side.filter((w): w is SideWidgetId => w !== null);

  // Tela dividida (Waze ao lado) ou coluna toda vazia: só o card principal.
  // Tela dividida (Waze do outro lado): como o painel do CarPlay, a próxima
  // curva em cima (quando há rota) e a música embaixo.
  if (props.compact) {
    const nav = props.notifications.navigation;
    return (
      <View style={styles.dashboard}>
        {nav && (
          <Animated.View key="curva" entering={enterItem(0)} style={styles.turnSlot}>
            <NextTurnWidget
              nav={nav}
              hasAccess={props.notificationAccess}
              onOpenAccess={props.onOpenAccess}
              onOpen={props.notifications.open}
            />
          </Animated.View>
        )}
        <Animated.View entering={enterItem(nav ? 1 : 0)} style={styles.full}>
          {main === 'velocidade' ? (
            <SpeedWidget gps={props.gps} large />
          ) : (
            <NowPlayingCard
              media={props.media}
              playerIcon={props.playerIcon}
              defaultPlayerName={props.defaultPlayerName}
              onOpenPlayer={props.onOpenPlayer}
              compact
            />
          )}
        </Animated.View>
      </View>
    );
  }

  if (widgets.length === 0) {
    return (
      <Animated.View entering={enterItem(0)} style={styles.full}>
        {mainCard}
      </Animated.View>
    );
  }

  return (
    <>
      <Animated.View entering={enterItem(0)} style={styles.main}>
        {mainCard}
      </Animated.View>
      <View style={styles.side}>
        {widgets.map((id, i) => (
          <Animated.View key={id} entering={enterItem(i + 1)} style={COMPACT_WIDGETS.includes(id) ? styles.slotCompact : styles.slot}>
            {renderSideWidget(id, props)}
          </Animated.View>
        ))}
      </View>
    </>
  );
}

function renderSideWidget(id: SideWidgetId, p: HomeProps) {
  switch (id) {
    case 'velocidade':
      return <SpeedWidget gps={p.gps} />;
    case 'viagem':
      return <TripWidget gps={p.gps} />;
    case 'volume':
      return <VolumeWidget media={p.media} />;
    case 'relogio':
      return <ClockWidget />;
    case 'calendario':
      return <CalendarWidget now={p.now} />;
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
    case 'curva':
      return (
        <NextTurnWidget
          nav={p.notifications.navigation}
          hasAccess={p.notificationAccess}
          onOpenAccess={p.onOpenAccess}
          onOpen={p.notifications.open}
        />
      );
    case 'mensagens':
      return (
        <MessagesWidget
          chats={p.notifications.chats}
          hasAccess={p.notificationAccess}
          icon={p.whatsappIcon}
          now={p.now.getTime()}
          onOpenAccess={p.onOpenAccess}
          onOpenMessages={p.onOpenMessages}
        />
      );
  }
}

const styles = StyleSheet.create({
  full: {
    flex: 1,
  },
  dashboard: {
    flex: 1,
    gap: sizes.gap,
  },
  turnSlot: {
    height: 112,
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
