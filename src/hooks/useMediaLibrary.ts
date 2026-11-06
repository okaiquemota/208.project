// Todos os apps de música do celular (não só o Spotify): os instalados, o que
// cada um está tocando e qual o painel deve acompanhar.
//
// Os apps são achados sozinhos pelo serviço de mídia (como no Android Auto),
// sem precisar configurar nada. O player escolhido fica salvo nos Ajustes.

import * as IntentLauncher from 'expo-intent-launcher';
import { useCallback, useEffect, useMemo, useState } from 'react';

import MediaKeys from '../../modules/media-keys';
import {
  type MediaApp,
  type MediaSession,
  mergeMediaApps,
  parseMediaApps,
  parseSessions,
} from '../lib/nowPlaying';
import { useSettings } from '../state/settings';
import { useAppActive } from './useAppActive';
import { loadIcon } from './useInstalledApps';

const SESSIONS_POLL_MS = 3000;

export type MediaAppEntry = MediaApp & {
  session: MediaSession | null;
  /** Ícone do app ("data:image/png;base64,…") ou null enquanto carrega. */
  icon: string | null;
};

const readApps = () => {
  try {
    return parseMediaApps(MediaKeys?.getMediaApps());
  } catch {
    return [];
  }
};
const readSessions = () => {
  try {
    return parseSessions(MediaKeys?.getSessions());
  } catch {
    return [];
  }
};

export function useMediaLibrary() {
  const { settings, update } = useSettings();
  const preferred = settings.preferredPlayer;
  const [apps, setApps] = useState<MediaApp[]>(readApps);
  const [sessions, setSessions] = useState<MediaSession[]>(readSessions);
  const [icons, setIcons] = useState<Record<string, string | null>>({});

  // O módulo nativo precisa saber qual player acompanhar.
  useEffect(() => {
    try {
      MediaKeys?.setPreferredPlayer(preferred);
    } catch {
      // Build antigo sem essa função: segue no automático.
    }
  }, [preferred]);

  // Sessões mudam o tempo todo (abriu outro player, pausou…).
  useEffect(() => {
    const id = setInterval(() => setSessions(readSessions()), SESSIONS_POLL_MS);
    return () => clearInterval(id);
  }, []);

  // Instalou ou removeu um app de música enquanto estava fora do painel.
  useAppActive(() => {
    setApps(readApps());
    setSessions(readSessions());
  });

  const merged = useMemo(() => mergeMediaApps(apps, sessions), [apps, sessions]);

  // Carrega os ícones que faltam (uma vez por app).
  const missingKey = merged
    .map((m) => m.packageName)
    .filter((p) => !(p in icons))
    .join(',');
  useEffect(() => {
    if (!missingKey) return;
    let alive = true;
    const pkgs = missingKey.split(',');
    void Promise.all(pkgs.map(async (p) => [p, await loadIcon(p)] as const)).then((pairs) => {
      if (alive) setIcons((prev) => ({ ...prev, ...Object.fromEntries(pairs) }));
    });
    return () => {
      alive = false;
    };
  }, [missingKey]);

  const entries: MediaAppEntry[] = useMemo(
    () => merged.map((m) => ({ ...m, icon: icons[m.packageName] ?? null })),
    [merged, icons],
  );

  /** Escolhe o player que o painel acompanha (null = automático). */
  const select = useCallback(
    (pkg: string | null) => update((s) => (s.preferredPlayer === pkg ? s : { ...s, preferredPlayer: pkg })),
    [update],
  );

  /** Abre o app de música (ao lado, se o painel estiver em tela dividida). */
  const open = useCallback((pkg: string) => {
    try {
      if (MediaKeys?.openAdjacent(pkg)) return;
    } catch {
      // Cai no jeito normal.
    }
    try {
      IntentLauncher.openApplication(pkg);
    } catch {
      // App removido nesse meio tempo.
    }
  }, []);

  /** Ícone de um app qualquer (se já carregado). */
  const iconOf = useCallback((pkg: string | null | undefined) => (pkg ? (icons[pkg] ?? null) : null), [icons]);

  return { entries, preferred, select, open, iconOf };
}

export type MediaLibrary = ReturnType<typeof useMediaLibrary>;
