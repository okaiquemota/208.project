// Música no painel: o que está tocando (capa, título, progresso) e os controles.
//
// Usa o módulo nativo local "media-keys". Três situações:
// - módulo ausente (build antigo/Expo Go): botões desativados, app segue normal;
// - sem "Acesso a notificações": botões funcionam (teclas de mídia), sem capa/título;
// - com acesso: tudo, e os botões controlam o player direto.

import { useCallback, useEffect, useRef, useState } from 'react';

import MediaKeys, { type VolumeInfo } from '../../modules/media-keys';
import { type NowPlayingInfo, parseNowPlaying } from '../lib/nowPlaying';
import { useAppActive } from './useAppActive';

/** De quanto em quanto tempo conferimos volume e se está tocando. */
const POLL_MS = 1000;
/** Releitura completa de segurança (caso algum aviso do player se perca). */
const FULL_REFRESH_MS = 5000;

export type MediaState = {
  /** O módulo nativo está no build. */
  available: boolean;
  /** "Acesso a notificações" liberado (capa, título e progresso). */
  hasAccess: boolean;
  nowPlaying: NowPlayingInfo | null;
  /** Está tocando (do player, ou do sistema de áudio se não houver acesso). */
  playing: boolean;
  volume: VolumeInfo;
  playPause: () => void;
  next: () => void;
  previous: () => void;
  volumeUp: () => void;
  volumeDown: () => void;
  /** Abre a tela do Android para liberar o acesso. */
  openAccessSettings: () => void;
  /** Aperta um botão extra do player (curtir, aleatório…). */
  sendAction: (action: string) => void;
};

const EMPTY_VOLUME: VolumeInfo = { current: 0, max: 0 };

/** Lê um valor do módulo nativo sem deixar uma falha derrubar a tela. */
function safeRead<T>(read: () => T | undefined | null, fallback: T): T {
  try {
    return read() ?? fallback;
  } catch {
    return fallback;
  }
}

const readNowPlaying = () => safeRead(() => parseNowPlaying(MediaKeys?.getNowPlaying()), null);

export function useMedia(): MediaState {
  const available = MediaKeys !== null;
  // Valores iniciais lidos direto do módulo; depois eventos e timers mantêm atualizado.
  const [hasAccess, setHasAccess] = useState(() =>
    safeRead(() => MediaKeys?.hasNotificationAccess(), false),
  );
  const [nowPlaying, setNowPlaying] = useState<NowPlayingInfo | null>(readNowPlaying);
  const [musicActive, setMusicActive] = useState(() =>
    safeRead(() => MediaKeys?.isMusicActive(), false),
  );
  const [volume, setVolume] = useState<VolumeInfo>(() =>
    safeRead(() => MediaKeys?.getVolume(), EMPTY_VOLUME),
  );
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);

  const refreshQuick = useCallback(() => {
    if (!MediaKeys) return;
    setMusicActive(safeRead(() => MediaKeys?.isMusicActive(), false));
    const v = safeRead(() => MediaKeys?.getVolume(), EMPTY_VOLUME);
    setVolume((prev) => (prev.current === v.current && prev.max === v.max ? prev : v));
  }, []);

  const refreshFull = useCallback(() => {
    if (!MediaKeys) return;
    setHasAccess(safeRead(() => MediaKeys?.hasNotificationAccess(), false));
    setNowPlaying(readNowPlaying());
    refreshQuick();
  }, [refreshQuick]);

  // Avisos do player (música trocou, pausou…) chegam na hora por evento.
  useEffect(() => {
    if (!MediaKeys) return;
    const sub = MediaKeys.addListener('onNowPlayingChange', (event) => {
      setNowPlaying(parseNowPlaying(event?.nowPlaying));
    });
    return () => sub.remove();
  }, []);

  useEffect(() => {
    const quick = setInterval(refreshQuick, POLL_MS);
    const full = setInterval(refreshFull, FULL_REFRESH_MS);
    const pending = timers.current;
    return () => {
      clearInterval(quick);
      clearInterval(full);
      pending.forEach(clearTimeout);
    };
  }, [refreshQuick, refreshFull]);

  // Voltando das Configurações (onde liberou o acesso) ou de outro app.
  useAppActive(refreshFull);

  /** O player demora um pouco pra reagir: confere logo depois. */
  const refreshSoon = useCallback(() => {
    timers.current.push(setTimeout(refreshFull, 300), setTimeout(refreshFull, 1000));
    if (timers.current.length > 20) timers.current.splice(0, timers.current.length - 20);
  }, [refreshFull]);

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
      setVolume(
        safeRead(() => (up ? MediaKeys?.volumeUp() : MediaKeys?.volumeDown()), EMPTY_VOLUME),
      );
    },
    [],
  );

  const playing = nowPlaying ? nowPlaying.isPlaying : musicActive;

  return {
    available,
    hasAccess,
    nowPlaying,
    playing,
    volume,
    playPause: run((m) => {
      m.playPause();
      // Resposta imediata no ícone; a próxima leitura confirma.
      setNowPlaying((np) => (np ? { ...np, isPlaying: !np.isPlaying } : np));
      setMusicActive((p) => !p);
    }),
    next: run((m) => m.next()),
    previous: run((m) => m.previous()),
    volumeUp: changeVolume(true),
    volumeDown: changeVolume(false),
    openAccessSettings: run((m) => m.openNotificationAccessSettings()),
    sendAction: (action: string) => run((m) => m.sendCustomAction(action))(),
  };
}
