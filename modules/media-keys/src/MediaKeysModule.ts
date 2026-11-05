import { NativeModule, requireOptionalNativeModule } from 'expo';

import type { VolumeInfo } from './MediaKeys.types';

/** Funções que o lado Kotlin (MediaKeysModule.kt) expõe. */
declare class MediaKeysNativeModule extends NativeModule<{}> {
  playPause(): boolean;
  next(): boolean;
  previous(): boolean;
  volumeUp(): VolumeInfo;
  volumeDown(): VolumeInfo;
  getVolume(): VolumeInfo;
  isMusicActive(): boolean;
}

/**
 * O módulo nativo, ou null se ele não estiver no app (ex.: rodando no Expo Go
 * ou num build antigo). Com requireOptionalNativeModule o app não quebra:
 * quem usa confere se é null e desativa os botões.
 */
const MediaKeys = requireOptionalNativeModule<MediaKeysNativeModule>('MediaKeys');

export default MediaKeys;
export type { MediaKeysNativeModule };
