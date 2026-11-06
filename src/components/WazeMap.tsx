// Card do mapa ao vivo do Waze (trânsito, alertas, polícia, acidentes…),
// usando o embed oficial numa WebView. O mapa segue o carro pelo GPS do
// painel; depois de mexer no mapa com o dedo, ele espera 20 s para voltar a
// seguir. Precisa de internet (dados móveis).

import { type ReactNode, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { WebView, type WebViewMessageEvent } from 'react-native-webview';

import { colors, font, sizes } from '../config/theme';
import type { GpsState } from '../hooks/useGps';
import { kmhToMs, type LatLng } from '../lib/geo';
import {
  isAllowedMapUrl,
  mapBootScript,
  NIGHT_BG,
  type MapPosition,
  type MapTheme,
  shouldRecenter,
  updatePositionScript,
  wazeEmbedUrl,
} from '../lib/wazeMap';
import { MapHud, type MapHudProps } from './MapHud';
import { Touch } from './Touch';

// A tipagem do pacote usa WebView<P = undefined>, que no TypeScript atual
// vira "props: never"; com <object> fica o tipo normal das props.
type MapWebView = WebView<object>;

type Props = {
  gps: GpsState;
  theme: MapTheme;
  /** Informações por cima do mapa (próxima curva, velocidade, Waze…). */
  hud: MapHudProps;
};

/** Posição do GPS do painel no formato do mapa. */
export function mapPositionOf(gps: GpsState): MapPosition | null {
  if (!gps.position) return null;
  const moving = gps.status === 'ok' && gps.trip.speedKmh > 3;
  return {
    latitude: gps.position.latitude,
    longitude: gps.position.longitude,
    accuracy: gps.accuracyM,
    heading: moving ? gps.trip.headingDeg : null,
    speed: gps.status === 'ok' ? kmhToMs(gps.trip.speedKmh) : null,
  };
}

export function WazeMap({ gps, theme, hud }: Props) {
  const pos = mapPositionOf(gps);
  // A página só carrega uma vez, na primeira posição; depois só mandamos a posição nova.
  const [start, setStart] = useState<MapPosition | null>(pos);
  const [failed, setFailed] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const web = useRef<MapWebView>(null);
  const ready = useRef(false);
  const lastCenter = useRef<LatLng | null>(null);
  const lastTouch = useRef(0);

  if (!start && pos) setStart(pos);

  // GPS mudou: manda ao mapa e, se o carro andou, centraliza.
  const lat = pos?.latitude;
  const lon = pos?.longitude;
  useEffect(() => {
    if (!ready.current || lat === undefined || lon === undefined || !pos) return;
    const recenter = shouldRecenter(lastCenter.current, pos, lastTouch.current, Date.now());
    if (recenter) lastCenter.current = { latitude: lat, longitude: lon };
    web.current?.injectJavaScript(updatePositionScript(pos, recenter));
    // Só a posição importa aqui (o resto vai junto dentro de pos).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lat, lon]);

  const onMessage = (e: WebViewMessageEvent) => {
    if (e.nativeEvent.data === 'toque') lastTouch.current = Date.now();
    if (e.nativeEvent.data === 'pronto') {
      ready.current = true;
      if (start) lastCenter.current = { latitude: start.latitude, longitude: start.longitude };
    }
  };

  if (!start) {
    return (
      <Shell hud={hud}>
        <ActivityIndicator color={colors.text2} />
        <Text style={[font(15, '600', colors.text2), styles.centerText]}>Esperando o GPS para abrir o mapa…</Text>
      </Shell>
    );
  }

  if (failed) {
    return (
      <Shell hud={hud}>
        <Text style={[font(16, '700', colors.text), styles.centerText]}>Mapa sem internet</Text>
        <Text style={[font(13, '500', colors.text2), styles.centerText]}>
          O mapa do Waze precisa de dados móveis ou Wi-Fi.
        </Text>
        <Touch
          onPress={() => {
            ready.current = false;
            setFailed(false);
            setAttempt((n) => n + 1);
          }}
          accessibilityLabel="Tentar de novo"
          style={styles.retry}
        >
          <Text style={font(15, '800', '#000')}>Tentar de novo</Text>
        </Touch>
      </Shell>
    );
  }

  return (
    <View style={[styles.card, theme === 'escuro' ? styles.dark : styles.light]}>
      <WebView<object>
        // Trocar o tema ou tentar de novo recria a página.
        key={`${theme}-${attempt}`}
        ref={web}
        source={{ uri: wazeEmbedUrl(start) }}
        injectedJavaScriptBeforeContentLoaded={mapBootScript(start, theme)}
        onMessage={onMessage}
        onShouldStartLoadWithRequest={(req) => isAllowedMapUrl(req.url, req.isTopFrame)}
        onError={() => setFailed(true)}
        setSupportMultipleWindows={false}
        javaScriptEnabled
        domStorageEnabled
        overScrollMode="never"
        startInLoadingState
        renderLoading={() => (
          <View style={[StyleSheet.absoluteFill, styles.center, theme === 'escuro' ? styles.dark : styles.light]}>
            <ActivityIndicator color={colors.text2} />
          </View>
        )}
        style={styles.web}
      />
      <MapHud {...hud} />
    </View>
  );
}

function Shell({ children, hud }: { children: ReactNode; hud: MapHudProps }) {
  return (
    <View style={[styles.card, styles.dark]}>
      <View style={[StyleSheet.absoluteFill, styles.center]}>{children}</View>
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
  dark: {
    backgroundColor: NIGHT_BG,
  },
  light: {
    backgroundColor: '#E9E6DF',
  },
  web: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  center: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    padding: 20,
  },
  centerText: {
    textAlign: 'center',
  },
  retry: {
    minHeight: 52,
    paddingHorizontal: 24,
    borderRadius: 26,
    backgroundColor: colors.text,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
