import {
  detailLayout,
  HIGHLIGHTS_TAB,
  isFolder,
  splitRoot,
  splitSection, parseSpotifyPage, spotifyErrorMessage } from '../src/lib/spotify';

describe('spotify: listas', () => {
  it('lê os itens e descarta os sem id', () => {
    const page = parseSpotifyPage({
      total: 3,
      offset: 0,
      items: [
        { id: 'a', uri: 'spotify:playlist:1', title: 'Curtidas', subtitle: '120 músicas', playable: true, hasChildren: false, image: 'spotify:image:x' },
        { id: 'b', title: 'Feito para você', hasChildren: true },
        { title: 'sem id' },
        null,
      ],
    });
    expect(page.items).toEqual([
      { id: 'a', uri: 'spotify:playlist:1', title: 'Curtidas', subtitle: '120 músicas', playable: true, hasChildren: false, image: 'spotify:image:x' },
      { id: 'b', uri: '', title: 'Feito para você', subtitle: '', playable: false, hasChildren: true, image: null },
    ]);
    expect(page.total).toBe(3);
  });

  it('resposta estranha vira lista vazia', () => {
    expect(parseSpotifyPage(null)).toEqual({ items: [], total: 0, offset: 0 });
    expect(parseSpotifyPage({ items: 'x' }).items).toEqual([]);
  });
});

describe('spotify: erros em português', () => {
  it('traduz os erros conhecidos do SDK', () => {
    expect(spotifyErrorMessage('CouldNotFindSpotifyApp')).toMatch(/Instale/);
    expect(spotifyErrorMessage('NotLoggedInException')).toMatch(/Entre na sua conta/);
    expect(spotifyErrorMessage('UserNotAuthorizedException')).toMatch(/SHA-1/);
  });

  it('erro desconhecido tem mensagem genérica', () => {
    expect(spotifyErrorMessage('Qualquer')).toMatch(/Tente de novo/);
    expect(spotifyErrorMessage(undefined)).toMatch(/Tente de novo/);
  });
});

describe('organização da escolha', () => {
  const item = (id: string, playable: boolean, hasChildren: boolean) => ({
    id, uri: `spotify:${id}`, title: id, subtitle: '', playable, hasChildren, image: null,
  });
  const secao = item('recentes', false, true);
  const playlist = item('pl', true, true);
  const musica = item('mus', true, false);

  it('pasta é o que só abre', () => {
    expect(isFolder(secao)).toBe(true);
    expect(isFolder(playlist)).toBe(false);
    expect(isFolder(musica)).toBe(false);
  });

  it('raiz: seções viram abas, o resto fica solto', () => {
    expect(splitRoot([secao, playlist, musica])).toEqual({ tabs: [secao], loose: [playlist, musica] });
    expect(HIGHLIGHTS_TAB).toBe('__destaques');
  });

  it('aba: capas soltas e fileiras', () => {
    expect(splitSection([playlist, secao, musica])).toEqual({ tiles: [playlist, musica], shelves: [secao] });
  });

  it('dentro de uma playlist: faixas; dentro de uma pasta de playlists: capas', () => {
    expect(detailLayout([musica, musica, playlist])).toBe('faixas');
    expect(detailLayout([playlist, playlist, musica])).toBe('capas');
    expect(detailLayout([])).toBe('faixas');
  });
});
