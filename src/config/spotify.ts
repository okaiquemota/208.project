// Cadastro do Painel 208 no Spotify (developer.spotify.com).
//
// O Client ID identifica o app; não é senha (o "Client secret" é que nunca
// deve aparecer aqui). O Redirect URI precisa ser igual ao cadastrado.
// No Spotify também ficam cadastrados o pacote (br.com.movcode.painel208) e
// o SHA-1 do certificado que assina o APK.

export const SPOTIFY_CLIENT_ID = '6ab3cc91795347f0b79ab8e4a4516e52';
export const SPOTIFY_REDIRECT_URI = 'painel208://spotify-callback';

/** Tipo de conteúdo pedido ao Spotify: as listas que ele monta para carros. */
export const SPOTIFY_CONTENT_TYPE = 'automotive';

/** Pacote do app do Spotify no Android. */
export const SPOTIFY_PACKAGE = 'com.spotify.music';
