// No navegador o mapa nativo não existe: mostra só o fundo e as informações.
// (A prévia de desenvolvimento usa uma versão com o MapLibre da web.)

import { StyleSheet, View } from 'react-native';

import { sizes } from '../config/theme';
import type { GpsState } from '../hooks/useGps';
import { type MapTheme, PALETTES } from '../lib/carMap';
import { MapHud, type MapHudProps } from './MapHud';

type Props = { gps: GpsState; theme: MapTheme; hud: Omit<MapHudProps, 'controls'> };

export function CarMap({ theme, hud }: Props) {
  return (
    <View style={[styles.card, { backgroundColor: PALETTES[theme].background }]}>
      <MapHud {...hud} />
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    borderRadius: sizes.cardRadius,
    overflow: 'hidden',
  },
});
