// Módulo local "media-keys": teclas de mídia e volume do Android.
// Pode ser null se o código nativo não estiver no build (veja src/MediaKeysModule.ts).
export { default } from './src/MediaKeysModule';
export type { MediaKeysNativeModule } from './src/MediaKeysModule';
export * from './src/MediaKeys.types';

// Spotify por dentro (playlists, tocados recentemente…). Também pode ser null.
export { default as SpotifyRemote } from './src/SpotifyRemoteModule';
