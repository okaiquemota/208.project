// Spotify por dentro do painel: conectar, escolher música como no Spotify do
// CarPlay (abas de seções, fileiras de capas, playlist aberta com Tocar e
// Aleatório) e acompanhar o player do Spotify (música, capa grande, curtida,
// aleatório, repetir, de onde está tocando). Usa o módulo nativo SpotifyRemote.

import { useCallback, useEffect, useState } from 'react';

import { type SpotifyCommand, SpotifyRemote } from '../../modules/media-keys';
import { SPOTIFY_CLIENT_ID, SPOTIFY_CONTENT_TYPE, SPOTIFY_REDIRECT_URI } from '../config/spotify';
import {
  HIGHLIGHTS_TAB,
  parseSpotifyPage,
  type SpotifyItem,
  spotifyErrorMessage,
  splitRoot,
  splitSection,
} from '../lib/spotify';
import { parseSpotifyPlayer, type SpotifyPlayerState } from '../lib/spotifyPlayer';
import { readText, writeText } from '../lib/storage';

/** Lembra que o usuário já conectou uma vez (aí reconecta sozinho). */
const LINKED_KEY = 'painel208.spotify.linked';
/** Quantas capas cada fileira mostra. */
const SHELF_MAX = 20;

export type SpotifyStatus =
  /** Código nativo fora do build. */
  | 'indisponivel'
  /** App do Spotify não instalado. */
  | 'sem-app'
  | 'desconectado'
  | 'conectando'
  | 'conectado'
  | 'erro';

/** Uma fileira de capas (title null = grade sem título). */
export type SpotifyShelf = {
  id: string;
  title: string | null;
  items: SpotifyItem[];
  loading: boolean;
};

/** Um item aberto (playlist, álbum, pasta) com o que tem dentro. */
export type SpotifyDetail = {
  item: SpotifyItem;
  items: SpotifyItem[];
};

const errorCode = (e: unknown) =>
  typeof e === 'object' && e !== null && 'code' in e ? String((e as { code: unknown }).code) : null;

/** Texto original do erro do Spotify (ajuda a descobrir o que falta no cadastro). */
const errorText = (e: unknown) =>
  typeof e === 'object' && e !== null && 'message' in e ? String((e as { message: unknown }).message).slice(0, 200) : null;

function readPlayer(): SpotifyPlayerState | null {
  try {
    return parseSpotifyPlayer(SpotifyRemote?.getPlayerState());
  } catch {
    return null;
  }
}

function initialStatus(): SpotifyStatus {
  if (!SpotifyRemote) return 'indisponivel';
  try {
    if (!SpotifyRemote.isInstalled()) return 'sem-app';
    return SpotifyRemote.isConnected() ? 'conectado' : 'desconectado';
  } catch {
    return 'desconectado';
  }
}

const children = async (id: string) => parseSpotifyPage(await SpotifyRemote!.getChildren(id, 0)).items;

export function useSpotify() {
  const [status, setStatus] = useState<SpotifyStatus>(initialStatus);
  const [error, setError] = useState<string | null>(null);
  const [errorDetail, setErrorDetail] = useState<string | null>(null);
  const [tabs, setTabs] = useState<SpotifyItem[]>([]);
  const [tabId, setTabId] = useState<string | null>(null);
  const [content, setContent] = useState<Record<string, SpotifyShelf[]>>({});
  const [details, setDetails] = useState<SpotifyDetail[]>([]);
  const [loading, setLoading] = useState(false);
  const [images, setImages] = useState<Record<string, string | null>>({});
  const [player, setPlayer] = useState<SpotifyPlayerState | null>(readPlayer);

  // Player do Spotify: cada mudança chega por evento do Kotlin.
  useEffect(() => {
    if (!SpotifyRemote) return;
    const sub = SpotifyRemote.addListener('onPlayerState', (event) => {
      setPlayer(parseSpotifyPlayer(event?.state));
      if (event && event.connected === false) setStatus('desconectado');
    });
    return () => sub.remove();
  }, []);

  const fail = useCallback((e: unknown) => {
    const code = errorCode(e);
    setError(spotifyErrorMessage(code));
    setErrorDetail([code, errorText(e)].filter(Boolean).join(': ') || null);
    setStatus(code === 'ERR_DESCONECTADO' ? 'desconectado' : 'erro');
  }, []);

  /** Carrega o conteúdo de uma aba: capas soltas + fileiras (cada uma com suas capas). */
  const loadTab = useCallback(
    async (tab: SpotifyItem, loose: SpotifyItem[]) => {
      if (!SpotifyRemote) return;
      if (tab.id === HIGHLIGHTS_TAB) {
        setContent((c) => ({ ...c, [tab.id]: [{ id: `${tab.id}#grade`, title: null, items: loose, loading: false }] }));
        return;
      }
      setLoading(true);
      try {
        const { tiles, shelves } = splitSection(await children(tab.id));
        const initial: SpotifyShelf[] = [
          ...(tiles.length ? [{ id: `${tab.id}#grade`, title: null, items: tiles, loading: false }] : []),
          ...shelves.map((s) => ({ id: s.id, title: s.title, items: [], loading: true })),
        ];
        setContent((c) => ({ ...c, [tab.id]: initial }));
        // Fileiras em paralelo; cada uma aparece quando chega.
        await Promise.all(
          shelves.map(async (shelf) => {
            let items: SpotifyItem[] = [];
            try {
              items = (await children(shelf.id)).slice(0, SHELF_MAX);
            } catch {
              items = [];
            }
            setContent((c) => ({
              ...c,
              [tab.id]: (c[tab.id] ?? []).map((s) => (s.id === shelf.id ? { ...s, items, loading: false } : s)),
            }));
          }),
        );
      } catch (e) {
        fail(e);
      } finally {
        setLoading(false);
      }
    },
    [fail],
  );

  /** Lista inicial: as abas (e a aba "Destaques" com o que vier solto). */
  const loadRoot = useCallback(async () => {
    if (!SpotifyRemote) return;
    setLoading(true);
    try {
      const page = parseSpotifyPage(await SpotifyRemote.getRecommended(SPOTIFY_CONTENT_TYPE));
      const { tabs: folders, loose } = splitRoot(page.items);
      const all: SpotifyItem[] = [
        ...(loose.length
          ? [{ id: HIGHLIGHTS_TAB, uri: '', title: 'Destaques', subtitle: '', playable: false, hasChildren: true, image: null }]
          : []),
        ...folders,
      ];
      setTabs(all);
      setContent({});
      setDetails([]);
      const first = all[0];
      setTabId(first?.id ?? null);
      if (first) await loadTab(first, loose);
    } catch (e) {
      fail(e);
    } finally {
      setLoading(false);
    }
  }, [fail, loadTab]);

  const connect = useCallback(async () => {
    if (!SpotifyRemote) return;
    setStatus('conectando');
    setError(null);
    setErrorDetail(null);
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

  /** Troca de aba (carrega na primeira vez). */
  const selectTab = useCallback(
    (id: string) => {
      setTabId(id);
      setDetails([]);
      const tab = tabs.find((t) => t.id === id);
      if (tab && !content[id]) void loadTab(tab, []);
    },
    [tabs, content, loadTab],
  );

  /** Toca um item: shuffle true = aleatório, false = em ordem, null = como está. */
  const playItem = useCallback(
    async (item: SpotifyItem, shuffle: boolean | null = null) => {
      try {
        await SpotifyRemote?.play(item.id, shuffle);
      } catch (e) {
        fail(e);
      }
    },
    [fail],
  );

  /** Abre um item (playlist, álbum, pasta) ou toca, se for só tocável. */
  const open = useCallback(
    async (item: SpotifyItem) => {
      if (!SpotifyRemote) return;
      if (!item.hasChildren) {
        if (item.playable) await playItem(item);
        return;
      }
      setLoading(true);
      try {
        const items = await children(item.id);
        setDetails((d) => [...d, { item, items }]);
      } catch (e) {
        fail(e);
      } finally {
        setLoading(false);
      }
    },
    [fail, playItem],
  );

  const back = useCallback(() => setDetails((d) => d.slice(0, -1)), []);

  /** Comando no player do Spotify (tocar/pausar, pular, curtir, aleatório…). */
  const command = useCallback(
    (cmd: SpotifyCommand) => {
      if (!SpotifyRemote) return;
      // Resposta imediata no botão de tocar; o Spotify confirma em seguida.
      if (cmd === 'toggle') setPlayer((p) => (p ? { ...p, isPaused: !p.isPaused } : p));
      SpotifyRemote.playerCommand(cmd).catch(fail);
    },
    [fail],
  );

  // O que está na tela agora: a playlist aberta ou as fileiras da aba.
  const detail = details[details.length - 1] ?? null;
  const shelves = tabId ? (content[tabId] ?? []) : [];

  // Capas que ainda não foram carregadas (só as que estão na tela).
  const visible = detail ? [detail.item, ...detail.items] : shelves.flatMap((s) => s.items);
  const missing = visible
    .map((i) => i.image)
    .filter((raw): raw is string => !!raw && !(raw in images))
    .filter((raw, i, all) => all.indexOf(raw) === i)
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

  return {
    status,
    error,
    /** Código e texto original do erro (em letra pequena, para diagnóstico). */
    errorDetail,
    /** Abas do topo (seções do Spotify). */
    tabs,
    tabId,
    /** Fileiras da aba escolhida. */
    shelves,
    /** Item aberto (playlist, álbum…), ou null. */
    detail,
    depth: details.length,
    loading,
    images,
    /** Música do Spotify agora (null se desconectado ou nada carregado). */
    player: status === 'conectado' ? player : null,
    connect,
    selectTab,
    open,
    playItem,
    back,
    command,
  };
}

export type SpotifyState = ReturnType<typeof useSpotify>;
