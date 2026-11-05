// Controles de música usando o módulo nativo local "media-keys".
// Se o módulo não estiver no build, `available` vem false e os botões
// aparecem desativados (o app continua funcionando).

import { useCallback, useEffect, useRef, useState } from 'react';

import MediaKeys, { type VolumeInfo } from '../../modules/media-keys';

/** De quanto em quanto tempo olhamos se está tocando e qual o volume. */
const POLL_MS = 1000;

export type MediaControls = {
  available: boolean;
  /** Algum app está tocando áudio agora. */
  playing: boolean;
  volume: VolumeInfo;
  playPause: () => void;
  next: () => void;
  previous: () => void;
  volumeUp: () => void;
  volumeDown: () => void;
};

const EMPTY_VOLUME: VolumeInfo = { current: 0, max: 0 };

export function useMediaKeys(): MediaControls {
  const available = MediaKeys !== null;
  const [playing, setPlaying] = useState(false);
  const [volume, setVolume] = useState<VolumeInfo>(EMPTY_VOLUME);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);

  const refresh = useCallback(() => {
    if (!MediaKeys) return;
    try {
      setPlaying(MediaKeys.isMusicActive());
      const v = MediaKeys.getVolume();
      setVolume((prev) => (prev.current === v.current && prev.max === v.max ? prev : v));
    } catch {
      // Falha pontual do sistema de áudio: tenta de novo no próximo ciclo.
    }
  }, []);

  useEffect(() => {
    refresh();
    const id = setInterval(refresh, POLL_MS);
    const pending = timers.current;
    return () => {
      clearInterval(id);
      pending.forEach(clearTimeout);
    };
  }, [refresh]);

  /** O player demora um pouco pra reagir à tecla: confere logo depois. */
  const refreshSoon = useCallback(() => {
    timers.current.push(setTimeout(refresh, 250), setTimeout(refresh, 900));
    if (timers.current.length > 20) timers.current.splice(0, timers.current.length - 20);
  }, [refresh]);

  const run = useCallback(
    (action: (m: NonNullable<typeof MediaKeys>) => unknown) => () => {
      if (!MediaKeys) return;
      try {
        action(MediaKeys);
      } catch {
        // Sem popup de erro dirigindo: só não faz nada.
      }
      refreshSoon();
    },
    [refreshSoon],
  );

  const changeVolume = useCallback(
    (up: boolean) => () => {
      if (!MediaKeys) return;
      try {
        setVolume(up ? MediaKeys.volumeUp() : MediaKeys.volumeDown());
      } catch {
        refresh();
      }
    },
    [refresh],
  );

  return {
    available,
    playing,
    volume,
    playPause: run((m) => {
      m.playPause();
      setPlaying((p) => !p); // resposta imediata no ícone; o refresh confirma
    }),
    next: run((m) => m.next()),
    previous: run((m) => m.previous()),
    volumeUp: changeVolume(true),
    volumeDown: changeVolume(false),
  };
}
