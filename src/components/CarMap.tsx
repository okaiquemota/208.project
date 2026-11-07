// Mapa 3D do painel, no estilo do CarPlay/Waze (MapLibre, mapas gratuitos do
// OpenFreeMap, sem chave):
// - câmera inclinada que segue o carro e gira com a direção (o carro sempre
//   "para cima"), deslizando entre uma leitura do GPS e outra;
// - direção pelo próprio deslocamento (o carro nunca parece andar de lado);
// - zoom pela velocidade (bem de perto na cidade, aberto na estrada);
// - prédios em 3D, nomes de ruas e bairros em português;
// - por cima: próxima curva, chegada, velocidade, Waze, zoom e 3D/2D.
// O mapa não arrasta com o dedo (o carro fica sempre no lugar); os botões
// grandes cuidam do zoom. Rota e trânsito: Waze ao lado.

import { Camera, Map, type MapProps } from '@maplibre/maplibre-react-native';
import { useMemo, useState } from 'react';
import { type LayoutChangeEvent, StyleSheet, Text, View } from 'react-native';

import { colors, font, sizes } from '../config/theme';
import type { GpsState } from '../hooks/useGps';
import {
  cameraPaddingTop,
  CAR_Y,
  carMapStyle,
  clampZoomOffset,
  initialCourse,
  type MapTheme,
  PALETTES,
  PITCH_3D,
  updateCourse,
  zoomForSpeed,
} from '../lib/carMap';
import { CarArrow } from './CarArrow';
import { MapHud, type MapHudProps } from './MapHud';

type Props = {
  gps: GpsState;
  theme: MapTheme;
  /** Informações por cima do mapa (curva, velocidade, Waze…). */
  hud: Omit<MapHudProps, 'controls'>;
};

/** Centro inicial antes do GPS (Praça da Sé, São Paulo). */
const FALLBACK: [number, number] = [-46.6339, -23.5503];
const ARROW = 56;

export function CarMap({ gps, theme, hud }: Props) {
  const [height, setHeight] = useState(0);
  const [zoomOffset, setZoomOffset] = useState(0);
  const [mode, setMode] = useState<'3d' | '2d'>('3d');
  // O estilo é montado em src/lib (puro e testado); aqui só vira o tipo do MapLibre.
  const style = useMemo(() => carMapStyle(theme) as unknown as MapProps['mapStyle'], [theme]);

  const speed = gps.status === 'ok' ? gps.trip.speedKmh : 0;
  const pos = gps.position;
  // Direção pelo deslocamento do carro (o mapa anda sempre "para cima", sem o
  // carro parecer andar de lado); parado, o mapa não gira.
  const [course, setCourse] = useState(() => initialCourse(gps.status === 'ok' ? gps.trip.headingDeg : null));
  const nextCourse = updateCourse(course, pos);
  if (nextCourse !== course) setCourse(nextCourse);
  const bearing = nextCourse.bearing;

  const center: [number, number] = pos ? [pos.longitude, pos.latitude] : FALLBACK;

  const onLayout = (e: LayoutChangeEvent) => setHeight(e.nativeEvent.layout.height);

  return (
    <View style={[styles.card, { backgroundColor: PALETTES[theme].background }]} onLayout={onLayout}>
      <Map
        style={StyleSheet.absoluteFill}
        mapStyle={style}
        dragPan={false}
        touchZoom={false}
        doubleTapZoom={false}
        doubleTapHoldZoom={false}
        touchRotate={false}
        touchPitch={false}
        logo={false}
        compass={false}
        scaleBar={false}
        attribution
        attributionPosition={{ bottom: 4, right: 4 }}
      >
        <Camera
          center={center}
          zoom={zoomForSpeed(speed) + zoomOffset}
          bearing={bearing}
          pitch={mode === '3d' ? PITCH_3D : 0}
          padding={{ top: cameraPaddingTop(height) }}
          duration={1000}
          easing="linear"
        />
      </Map>

      {/* O carro: sempre no mesmo ponto, apontando para cima (o mapa gira por baixo) */}
      {pos && height > 0 ? (
        <View pointerEvents="none" style={[styles.arrow, { top: height * CAR_Y - ARROW / 2 }]}>
          <CarArrow size={ARROW} flat={mode === '2d'} />
        </View>
      ) : null}
      {!pos && (
        <View pointerEvents="none" style={styles.waiting}>
          <Text allowFontScaling={false} style={font(13, '700', colors.text)}>
            Esperando o GPS…
          </Text>
        </View>
      )}

      <MapHud
        {...hud}
        controls={{
          mode,
          onToggleMode: () => setMode((m) => (m === '3d' ? '2d' : '3d')),
          onZoomIn: () => setZoomOffset((z) => clampZoomOffset(z + 1)),
          onZoomOut: () => setZoomOffset((z) => clampZoomOffset(z - 1)),
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    borderRadius: sizes.cardRadius,
    overflow: 'hidden',
  },
  arrow: {
    position: 'absolute',
    left: '50%',
    marginLeft: -ARROW / 2,
  },
  waiting: {
    position: 'absolute',
    alignSelf: 'center',
    top: '45%',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 16,
    backgroundColor: 'rgba(0,0,0,0.75)',
  },
});
