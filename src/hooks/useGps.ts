// GPS do painel: permissão, GPS ligado/desligado, leituras a cada 1 s
// e a viagem acumulada (src/lib/trip.ts).

import * as IntentLauncher from 'expo-intent-launcher';
import * as Location from 'expo-location';
import { useCallback, useEffect, useReducer, useRef, useState } from 'react';
import { Linking } from 'react-native';

import { addFix, createTrip, type GpsFix, resetTrip, type TripState } from '../lib/trip';
import { useAppActive } from './useAppActive';

export type GpsStatus =
  /** Ainda verificando permissão e GPS. */
  | 'iniciando'
  /** Permissão de localização negada. */
  | 'sem-permissao'
  /** Localização do celular desligada. */
  | 'desligado'
  /** Ligado, mas sem leitura recente (garagem, túnel, logo depois de ligar). */
  | 'procurando'
  /** Recebendo leituras. */
  | 'ok';

/** Sem leitura nova por esse tempo, consideramos que o sinal sumiu. */
const STALE_AFTER_MS = 5_000;
/** De quanto em quanto tempo conferimos se o GPS foi desligado/ligado. */
const SERVICES_CHECK_MS = 3_000;

type Action = { type: 'fix'; fix: GpsFix } | { type: 'reset' };

function tripReducer(state: TripState, action: Action): TripState {
  switch (action.type) {
    case 'fix':
      return addFix(state, action.fix);
    case 'reset':
      return resetTrip(state);
  }
}

const toFix = (loc: Location.LocationObject): GpsFix => ({
  latitude: loc.coords.latitude,
  longitude: loc.coords.longitude,
  accuracy: loc.coords.accuracy,
  speed: loc.coords.speed,
  heading: loc.coords.heading,
  timestamp: loc.timestamp,
});

export type GpsState = {
  status: GpsStatus;
  trip: TripState;
  /** Precisão da última leitura, em metros. */
  accuracyM: number | null;
  /** Se a permissão foi negada de vez (o Android não pergunta mais). */
  canAskAgain: boolean;
  resetTrip: () => void;
  /** Pede a permissão de novo, ou abre as configurações do app se não der mais. */
  requestPermission: () => void;
  /** Abre a tela de localização do Android. */
  openLocationSettings: () => void;
};

export function useGps(): GpsState {
  const [trip, dispatch] = useReducer(tripReducer, undefined, createTrip);
  const [permission, setPermission] = useState<'verificando' | 'ok' | 'negada'>('verificando');
  const [canAskAgain, setCanAskAgain] = useState(true);
  const [servicesOn, setServicesOn] = useState<boolean | null>(null);
  const [accuracyM, setAccuracyM] = useState<number | null>(null);
  const [lastFixAt, setLastFixAt] = useState<number | null>(null);
  const [now, setNow] = useState(() => Date.now());
  const watchKey = useRef(0);

  // 1) Permissão: confere e, se der, pede (o Android mostra o pedido dele uma vez).
  const checkPermission = useCallback(async (ask: boolean) => {
    try {
      let res = await Location.getForegroundPermissionsAsync();
      if (!res.granted && ask && res.canAskAgain) {
        res = await Location.requestForegroundPermissionsAsync();
      }
      setPermission(res.granted ? 'ok' : 'negada');
      setCanAskAgain(res.canAskAgain);
    } catch {
      setPermission('negada');
    }
  }, []);

  useEffect(() => {
    void checkPermission(true);
  }, [checkPermission]);

  // 2) Localização do celular ligada? Confere de tempos em tempos.
  // Quando desliga, a leitura do passo 3 é encerrada; quando volta a ligar,
  // ela é criada de novo (alguns aparelhos não retomam sozinhos).
  const checkServices = useCallback(async () => {
    try {
      setServicesOn(await Location.hasServicesEnabledAsync());
    } catch {
      setServicesOn(false);
    }
  }, []);

  useEffect(() => {
    if (permission !== 'ok') return;
    void checkServices();
    const id = setInterval(checkServices, SERVICES_CHECK_MS);
    return () => clearInterval(id);
  }, [permission, checkServices]);

  // Voltando para o app (ex.: depois de mexer nas configurações), confere tudo de novo.
  useAppActive(() => {
    void checkPermission(false);
    void checkServices();
  });

  // 3) Leituras do GPS: precisão máxima, a cada 1 s, mesmo parado.
  useEffect(() => {
    if (permission !== 'ok' || servicesOn !== true) return;
    const key = ++watchKey.current;
    let sub: Location.LocationSubscription | null = null;
    let cancelled = false;

    Location.watchPositionAsync(
      {
        accuracy: Location.Accuracy.BestForNavigation,
        timeInterval: 1000,
        distanceInterval: 0,
      },
      (loc) => {
        if (cancelled || key !== watchKey.current) return;
        dispatch({ type: 'fix', fix: toFix(loc) });
        setAccuracyM(loc.coords.accuracy);
        setLastFixAt(Date.now());
      },
      () => {
        // Erro do GPS (normalmente: desligaram a localização). A checagem periódica cuida.
        void checkServices();
      },
    )
      .then((s) => {
        if (cancelled) s.remove();
        else sub = s;
      })
      .catch(() => void checkServices());

    return () => {
      cancelled = true;
      sub?.remove();
    };
  }, [permission, servicesOn, checkServices]);

  // Relógio interno para perceber quando o sinal sumiu.
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  let status: GpsStatus;
  if (permission === 'verificando') status = 'iniciando';
  else if (permission === 'negada') status = 'sem-permissao';
  else if (servicesOn === null) status = 'iniciando';
  else if (!servicesOn) status = 'desligado';
  else if (lastFixAt === null || now - lastFixAt > STALE_AFTER_MS) status = 'procurando';
  else status = 'ok';

  const requestPermission = useCallback(() => {
    if (canAskAgain) void checkPermission(true);
    else void Linking.openSettings();
  }, [canAskAgain, checkPermission]);

  const openLocationSettings = useCallback(() => {
    IntentLauncher.startActivityAsync(IntentLauncher.ActivityAction.LOCATION_SOURCE_SETTINGS).catch(
      () => undefined,
    );
  }, []);

  const reset = useCallback(() => dispatch({ type: 'reset' }), []);

  return {
    status,
    trip,
    accuracyM,
    canAskAgain,
    resetTrip: reset,
    requestPermission,
    openLocationSettings,
  };
}
