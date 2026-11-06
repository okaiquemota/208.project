import { parseSpotifyPage, spotifyErrorMessage } from '../src/lib/spotify';

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
