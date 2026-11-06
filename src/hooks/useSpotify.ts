// Spotify por dentro do painel: conectar, navegar pelas listas que o Spotify
// monta para carro (tocados recentemente, feito para você, playlists…),
// abrir pastas, voltar e tocar. Usa o módulo nativo SpotifyRemote.

import { useCallback, useEffect, useState } from 'react';

import { SpotifyRemote } from '../../modules/media-keys';
import { SPOTIFY_CLIENT_ID, SPOTIFY_CONTENT_TYPE, SPOTIFY_REDIRECT_URI } from '../config/spotify';
import { parseSpotifyPage, type SpotifyItem, spotifyErrorMessage } from '../lib/spotify';
import { readText, writeText } from '../lib/storage';

/** Lembra que o usuário já conectou uma vez (aí reconecta sozinho). */
const LINKED_KEY = 'painel208.spotify.linked';

export type SpotifyStatus =
  /** Código nativo fora do build. */
  | 'indisponivel'
  /** App do Spotify não instalado. */
  | 'sem-app'
  | 'desconectado'
  | 'conectando'
  | 'conectado'
  | 'erro';

/** Uma "tela" da navegação: a lista inicial ou o que tem dentro de um item. */
export type SpotifyLevel = {
  title: string;
  /** O item que foi aberto (null na lista inicial). */
  parent: SpotifyItem | null;
  items: SpotifyItem[];
};

const errorCode = (e: unknown) =>
  typeof e === 'object' && e !== null && 'code' in e ? String((e as { code: unknown }).code) : null;

function initialStatus(): SpotifyStatus {
  if (!SpotifyRemote) return 'indisponivel';
  try {
    if (!SpotifyRemote.isInstalled()) return 'sem-app';
    return SpotifyRemote.isConnected() ? 'conectado' : 'desconectado';
  } catch {
    return 'desconectado';
  }
}

export function useSpotify() {
  const [status, setStatus] = useState<SpotifyStatus>(initialStatus);
  const [error, setError] = useState<string | null>(null);
  const [stack, setStack] = useState<SpotifyLevel[]>([]);
  const [loading, setLoading] = useState(false);
  const [images, setImages] = useState<Record<string, string | null>>({});

  const fail = useCallback((e: unknown) => {
    const code = errorCode(e);
    setError(spotifyErrorMessage(code));
    setStatus(code === 'ERR_DESCONECTADO' ? 'desconectado' : 'erro');
  }, []);

  const loadRoot = useCallback(async () => {
    if (!SpotifyRemote) return;
    setLoading(true);
    try {
      const page = parseSpotifyPage(await SpotifyRemote.getRecommended(SPOTIFY_CONTENT_TYPE));
      setStack([{ title: 'Início', parent: null, items: page.items }]);
    } catch (e) {
      fail(e);
    } finally {
      setLoading(false);
    }
  }, [fail]);

  const connect = useCallback(async () => {
    if (!SpotifyRemote) return;
    setStatus('conectando');
    setError(null);
    try {
      await SpotifyRemote.connect(SPOTIFY_CLIENT_ID, SPOTIFY_REDIRECT_URI);
      writeText(LINKED_KEY, '1');
      setStatus('conectado');
      await loadRoot();
    } catch (e) {
      fail(e);
    }
  }, [fail, loadRoot]);

  // Já conectou antes: reconecta sozinho. Já conectado: carrega a lista inicial.
  useEffect(() => {
    if (status === 'desconectado' && readText(LINKED_KEY) === '1') {
      void Promise.resolve().then(connect);
    } else if (status === 'conectado') {
      void Promise.resolve().then(loadRoot);
    }
    // Só na abertura da tela.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /** Abre um item (seção/pasta) ou toca, se for só tocável. */
  const open = useCallback(
    async (item: SpotifyItem) => {
      if (!SpotifyRemote) return;
      if (!item.hasChildren) {
        if (item.playable) {
          try {
            await SpotifyRemote.play(item.id);
          } catch (e) {
            fail(e);
          }
        }
        return;
      }
      setLoading(true);
      try {
        const page = parseSpotifyPage(await SpotifyRemote.getChildren(item.id, 0));
        setStack((s) => [...s, { title: item.title, parent: item, items: page.items }]);
      } catch (e) {
        fail(e);
      } finally {
        setLoading(false);
      }
    },
    [fail],
  );

  /** Toca um item (ex.: "Tocar tudo" de uma playlist aberta). */
  const play = useCallback(
    async (item: SpotifyItem) => {
      try {
        await SpotifyRemote?.play(item.id);
      } catch (e) {
        fail(e);
      }
    },
    [fail],
  );

  const back = useCallback(() => setStack((s) => (s.length > 1 ? s.slice(0, -1) : s)), []);

  // Capas dos itens da tela atual que ainda não foram carregadas.
  const current = stack[stack.length - 1] ?? null;
  const missing = (current?.items ?? [])
    .map((i) => i.image)
    .filter((raw): raw is string => !!raw && !(raw in images))
    .join('\n');
  useEffect(() => {
    if (!missing || !SpotifyRemote) return;
    let alive = true;
    const raws = missing.split('\n');
    void Promise.all(
      raws.map(async (raw) => {
        try {
          return [raw, await SpotifyRemote!.getImage(raw)] as const;
        } catch {
          return [raw, null] as const;
        }
      }),
    ).then((pairs) => {
      if (alive) setImages((prev) => ({ ...prev, ...Object.fromEntries(pairs) }));
    });
    return () => {
      alive = false;
    };
  }, [missing]);

  return { status, error, current, depth: stack.length, loading, images, connect, open, play, back };
}

export type SpotifyState = ReturnType<typeof useSpotify>;
