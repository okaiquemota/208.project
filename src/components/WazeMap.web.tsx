// Prévia no navegador: o mesmo embed num <iframe> (sem seguir o carro e sem
// o filtro noturno, que só dá para aplicar dentro da página no app).

import { StyleSheet, View } from 'react-native';

import { sizes } from '../config/theme';
import type { GpsState } from '../hooks/useGps';
import { type MapTheme, NIGHT_BG, wazeEmbedUrl } from '../lib/wazeMap';
import { MapHud, type MapHudProps } from './MapHud';

type Props = { gps: GpsState; theme: MapTheme; hud: MapHudProps };

export function WazeMap({ gps, theme, hud }: Props) {
  const pos = gps.position ?? { latitude: -23.5617, longitude: -46.656 };
  return (
    <View style={styles.card}>
      <iframe
        title="Mapa do Waze"
        src={wazeEmbedUrl(pos)}
        style={{
          border: 0,
          width: '100%',
          height: '100%',
          filter: theme === 'escuro' ? 'invert(.9) hue-rotate(180deg) saturate(.35) contrast(.82) brightness(1.08)' : undefined,
        }}
      />
      <MapHud {...hud} />
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    borderRadius: sizes.cardRadius,
    overflow: 'hidden',
    backgroundColor: NIGHT_BG,
  },
});
