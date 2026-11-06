// Informações por cima do mapa, no estilo do Waze no CarPlay:
// - em cima, à esquerda: card preto com a seta, a distância e a rua;
// - embaixo, à esquerda: chegada, minutos e km que faltam (com rota ativa)
//   ou os atalhos Casa e Trabalho (sem rota);
// - em cima, à direita: a velocidade num círculo e o botão do Waze.
// Tudo que leva ao Waze abre o app de verdade (rota e voz), ao lado.

import { Image } from 'expo-image';
import type { ReactNode } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, { FadeInLeft } from 'react-native-reanimated';

import { colors, font, tabular } from '../config/theme';
import { formatKmh } from '../lib/format';
import { formatEta, type NavInfo, parseTripSummary } from '../lib/navigation';
import type { WazeFavorite } from '../lib/waze';
import { ManeuverArrow } from './CarNotificationWidgets';
import { HomeIcon, MinusIcon, PlusIcon, WorkIcon } from './icons';
import { Touch } from './Touch';

/** Botões que levam ao Waze de verdade. */
export type WazeActions = {
  open: () => void;
  navigateTo: (favorite: WazeFavorite) => void;
  icon: string | null;
};

export type MapHudProps = {
  nav: NavInfo | null;
  /** Abre a notificação de navegação (volta para a rota no app). */
  onOpenNav: (key: string) => void;
  /** Velocidade do GPS (null = sem leitura). */
  speedKmh: number | null;
  /** Acima disso o círculo fica vermelho (0 = sem alerta). */
  speedAlertKmh: number;
  waze: WazeActions | null;
  now: number;
  compact: boolean;
  /** Botões do mapa: zoom e 3D/2D (só no mapa nativo). */
  controls?: {
    mode: '3d' | '2d';
    onToggleMode: () => void;
    onZoomIn: () => void;
    onZoomOut: () => void;
  };
};

const PANEL = 'rgba(0,0,0,0.88)';

export function MapHud({ nav, onOpenNav, speedKmh, speedAlertKmh, waze, now, compact, controls }: MapHudProps) {
  const summary = nav ? parseTripSummary(nav.detail, now) : null;
  const alert = speedKmh != null && speedAlertKmh > 0 && speedKmh > speedAlertKmh;

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="box-none">
      {/* Próxima manobra */}
      {nav && (
        <Animated.View key={nav.instruction} entering={FadeInLeft.duration(260)} style={styles.turnWrap}>
          <Touch
            onPress={() => onOpenNav(nav.key)}
            accessibilityLabel={`${nav.instruction}, em ${nav.distance}. Abrir ${nav.appName}`}
            style={[styles.panel, styles.turn, compact && styles.turnCompact]}
          >
            <View style={styles.turnTop}>
              <ManeuverArrow nav={nav} size={compact ? 40 : 52} />
              <Text style={[font(compact ? 26 : 34, '800'), tabular]} numberOfLines={1} allowFontScaling={false}>
                {nav.distance}
              </Text>
            </View>
            <Text style={font(compact ? 14 : 17, '600')} numberOfLines={2} allowFontScaling={false}>
              {nav.street}
            </Text>
          </Touch>
        </Animated.View>
      )}

      {/* Velocidade e botão do Waze */}
      <View style={styles.right} pointerEvents="box-none">
        {/* Na tela dividida a velocidade já está na barra lateral. */}
        {!compact && (
          <View style={[styles.speed, alert && styles.speedAlert]}>
            <Text style={[font(24, '800', alert ? colors.red : colors.text), tabular]} allowFontScaling={false}>
              {speedKmh == null ? '--' : formatKmh(speedKmh)}
            </Text>
            <Text style={font(9, '700', colors.text2)} allowFontScaling={false}>
              KM/H
            </Text>
          </View>
        )}
        {waze && (
          <Touch onPress={waze.open} accessibilityLabel="Abrir o Waze ao lado" style={styles.wazeButton}>
            {waze.icon ? (
              <Image source={waze.icon} style={styles.wazeIcon} contentFit="contain" transition={0} />
            ) : (
              <Text allowFontScaling={false} style={font(12, '800', '#000')}>Waze</Text>
            )}
          </Touch>
        )}
      </View>

      {/* Zoom e 3D/2D, embaixo à direita (botões grandes, sem gestos no mapa) */}
      {controls && (
        <View style={styles.controls} pointerEvents="box-none">
          <Touch onPress={controls.onToggleMode} accessibilityLabel={controls.mode === '3d' ? 'Ver em 2D' : 'Ver em 3D'} style={[styles.panel, styles.control]}>
            <Text allowFontScaling={false} style={font(15, '800')}>
              {controls.mode === '3d' ? '2D' : '3D'}
            </Text>
          </Touch>
          <View style={[styles.panel, styles.zoom]}>
            <Touch onPress={controls.onZoomIn} accessibilityLabel="Aproximar" style={styles.control}>
              <PlusIcon size={22} color={colors.text} />
            </Touch>
            <View style={styles.zoomDivider} />
            <Touch onPress={controls.onZoomOut} accessibilityLabel="Afastar" style={styles.control}>
              <MinusIcon size={22} color={colors.text} />
            </Touch>
          </View>
        </View>
      )}

      {/* Embaixo: resumo da viagem, ou Casa/Trabalho */}
      {summary ? (
        <Touch
          onPress={() => nav && onOpenNav(nav.key)}
          accessibilityLabel="Resumo da viagem"
          style={[styles.panel, styles.summary]}
        >
          {summary.arrival && <Stat value={summary.arrival} label="chegada" />}
          {summary.minutes !== null && <Stat {...asStat(formatEta(summary.minutes))} />}
          {summary.distance && <Stat {...splitDistance(summary.distance)} />}
        </Touch>
      ) : !nav && waze ? (
        <View style={styles.favorites} pointerEvents="box-none">
          <Pill onPress={() => waze.navigateTo('home')} label="Casa" a11y="Rota para Casa no Waze">
            <HomeIcon size={20} color={colors.text} />
          </Pill>
          <Pill onPress={() => waze.navigateTo('work')} label="Trabalho" a11y="Rota para o Trabalho no Waze">
            <WorkIcon size={18} color={colors.text} />
          </Pill>
        </View>
      ) : null}
    </View>
  );
}

const asStat = ({ value, unit }: { value: string; unit: string }) => ({ value, label: unit });

/** "19 km" → valor "19", legenda "km". */
function splitDistance(label: string) {
  const i = label.lastIndexOf(' ');
  return i > 0 ? { value: label.slice(0, i), label: label.slice(i + 1) } : { value: label, label: '' };
}

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <View style={styles.stat}>
      <Text style={[font(21, '800'), tabular]} allowFontScaling={false}>
        {value}
      </Text>
      <Text style={font(14, '500', colors.text2)} allowFontScaling={false}>
        {label}
      </Text>
    </View>
  );
}

function Pill({ onPress, label, a11y, children }: { onPress: () => void; label: string; a11y: string; children: ReactNode }) {
  return (
    <Touch onPress={onPress} accessibilityLabel={a11y} style={[styles.panel, styles.pill]}>
      {children}
      <Text style={font(15, '700')} allowFontScaling={false}>
        {label}
      </Text>
    </Touch>
  );
}

const styles = StyleSheet.create({
  panel: {
    backgroundColor: PANEL,
    borderRadius: 14,
  },
  turnWrap: {
    position: 'absolute',
    top: 10,
    left: 10,
  },
  turn: {
    maxWidth: 300,
    minWidth: 200,
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 6,
  },
  turnCompact: {
    maxWidth: 230,
    minWidth: 160,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  turnTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  right: {
    position: 'absolute',
    top: 10,
    right: 10,
    alignItems: 'center',
    gap: 10,
  },
  speed: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: PANEL,
    borderWidth: 3,
    borderColor: 'rgba(255,255,255,0.85)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  speedAlert: {
    borderColor: colors.red,
    backgroundColor: '#fff',
  },
  wazeButton: {
    width: 56,
    height: 56,
    borderRadius: 16,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#33CCFF',
  },
  wazeIcon: {
    width: 56,
    height: 56,
  },
  controls: {
    position: 'absolute',
    right: 10,
    bottom: 30,
    alignItems: 'center',
    gap: 8,
  },
  control: {
    width: 52,
    height: 52,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 14,
  },
  zoom: {
    alignItems: 'center',
  },
  zoomDivider: {
    width: 30,
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  summary: {
    position: 'absolute',
    left: 10,
    bottom: 26,
    flexDirection: 'row',
    gap: 22,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  stat: {
    alignItems: 'center',
  },
  favorites: {
    position: 'absolute',
    left: 10,
    bottom: 26,
    flexDirection: 'row',
    gap: 8,
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    minHeight: 48,
    paddingHorizontal: 16,
  },
});
