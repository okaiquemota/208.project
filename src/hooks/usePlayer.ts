// Junta as duas fontes do player numa só, no formato que o card já usa:
// - a sessão de mídia do Android (qualquer app de música);
// - a conexão direta com o Spotify (capa grande, coração, aleatório, repetir,
//   e funciona mesmo sem o "Acesso a notificações").
// Qual vale em cada momento é decidido por shouldUseSpotify (src/lib).

import { useMemo } from 'react';

import { shouldUseSpotify, spotifyCommandOf, spotifyToNowPlaying } from '../lib/spotifyPlayer';
import type { MediaState } from './useMedia';
import type { SpotifyState } from './useSpotify';

export function usePlayer(media: MediaState, spotify: Pick<SpotifyState, 'player' | 'command'>): MediaState {
  const { player, command } = spotify;
  const useSpotify = shouldUseSpotify(media.nowPlaying, player);

  return useMemo(() => {
    if (!useSpotify || !player) return media;
    const nowPlaying = spotifyToNowPlaying(player);
    return {
      ...media,
      available: true,
      hasAccess: true,
      nowPlaying,
      playing: nowPlaying.isPlaying,
      playPause: () => command('toggle'),
      next: () => command('next'),
      previous: () => command('previous'),
      sendAction: (action: string) => {
        const cmd = spotifyCommandOf(action);
        if (cmd) command(cmd);
        else media.sendAction(action);
      },
    };
  }, [useSpotify, player, media, command]);
}
