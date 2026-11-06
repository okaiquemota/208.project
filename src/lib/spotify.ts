// Spotify por dentro: validação das listas que vêm do Kotlin e tradução dos
// erros do SDK para mensagens em português.

export type SpotifyItem = {
  id: string;
  uri: string;
  title: string;
  subtitle: string;
  /** Dá para tocar (playlist, álbum, música…). */
  playable: boolean;
  /** Dá para abrir (seção ou pasta com mais itens dentro). */
  hasChildren: boolean;
  /** Identificador da capa (pedir com getImage), ou null. */
  image: string | null;
};

export type SpotifyPage = {
  items: SpotifyItem[];
  total: number;
  offset: number;
};

const str = (v: unknown) => (typeof v === 'string' ? v : '');
const num = (v: unknown) => (typeof v === 'number' && Number.isFinite(v) ? v : 0);

/** Converte a resposta do Kotlin numa lista segura (itens sem id saem). */
export function parseSpotifyPage(raw: unknown): SpotifyPage {
  if (typeof raw !== 'object' || raw === null) return { items: [], total: 0, offset: 0 };
  const r = raw as Record<string, unknown>;
  const list = Array.isArray(r.items) ? r.items : [];
  const items: SpotifyItem[] = [];
  for (const it of list) {
    if (typeof it !== 'object' || it === null) continue;
    const i = it as Record<string, unknown>;
    const id = str(i.id);
    if (!id) continue;
    items.push({
      id,
      uri: str(i.uri),
      title: str(i.title),
      subtitle: str(i.subtitle),
      playable: i.playable === true,
      hasChildren: i.hasChildren === true,
      image: str(i.image) || null,
    });
  }
  return { items, total: num(r.total) || items.length, offset: num(r.offset) };
}

/**
 * Mensagem em português para cada erro do SDK do Spotify (o Kotlin manda o
 * nome da exceção como código).
 */
export function spotifyErrorMessage(code: string | undefined | null): string {
  switch (code) {
    case 'CouldNotFindSpotifyApp':
      return 'Instale o app do Spotify no celular.';
    case 'NotLoggedInException':
      return 'Entre na sua conta no app do Spotify e tente de novo.';
    case 'UserNotAuthorizedException':
      return 'O Spotify não autorizou o Painel 208. Confira o cadastro (pacote e SHA-1) e se sua conta está em "User Management".';
    case 'AuthenticationFailedException':
      return 'A autorização falhou. Confira o Client ID e o Redirect URI no cadastro do Spotify.';
    case 'UnsupportedFeatureVersionException':
      return 'Atualize o app do Spotify.';
    case 'OfflineModeException':
      return 'O Spotify está no modo offline.';
    case 'SpotifyConnectionTerminatedException':
    case 'SpotifyRemoteServiceException':
      return 'A conexão com o Spotify caiu. Toque para conectar de novo.';
    case 'ERR_DESCONECTADO':
      return 'Spotify desconectado. Toque para conectar.';
    default:
      return 'Não deu para falar com o Spotify agora. Tente de novo.';
  }
}
