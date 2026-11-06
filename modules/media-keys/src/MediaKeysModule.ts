import { NativeModule, requireOptionalNativeModule } from 'expo';

import type { MediaKeysEvents, NowPlayingInfo, VolumeInfo } from './MediaKeys.types';

/** Funções que o lado Kotlin (MediaKeysModule.kt) expõe. */
declare class MediaKeysNativeModule extends NativeModule<MediaKeysEvents> {
  // Controles: usam o player direto com acesso liberado; senão, teclas de mídia.
  playPause(): boolean;
  next(): boolean;
  previous(): boolean;
  seekTo(positionMs: number): boolean;
  sendCustomAction(action: string): boolean;

  volumeUp(): VolumeInfo;
  volumeDown(): VolumeInfo;
  getVolume(): VolumeInfo;
  isMusicActive(): boolean;

  // "Tocando agora" (precisa do Acesso a notificações).
  hasNotificationAccess(): boolean;
  openNotificationAccessSettings(): boolean;
  /** Dados crus do Kotlin; valide com parseNowPlaying antes de usar. */
  getNowPlaying(): Record<string, unknown> | null;

  // Qualquer app de música (dados crus; valide com parseMediaApps/parseSessions).
  getMediaApps(): unknown[];
  getSessions(): unknown[];
  setPreferredPlayer(packageName: string | null): boolean;

  // Tela dividida.
  openAdjacent(packageName: string): boolean;
  isInMultiWindow(): boolean;
}

/**
 * O módulo nativo, ou null se ele não estiver no app (ex.: rodando no Expo Go
 * ou num build antigo). Com requireOptionalNativeModule o app não quebra:
 * quem usa confere se é null e desativa os botões.
 */
const MediaKeys = requireOptionalNativeModule<MediaKeysNativeModule>('MediaKeys');

export default MediaKeys;
export type { MediaKeysNativeModule, NowPlayingInfo };
