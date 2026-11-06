import { NativeModule, requireOptionalNativeModule } from 'expo';

/** Funções do lado Kotlin (SpotifyModule.kt), pelo SDK oficial App Remote. */
declare class SpotifyRemoteNativeModule extends NativeModule<{}> {
  isInstalled(): boolean;
  isConnected(): boolean;
  connect(clientId: string, redirectUri: string): Promise<boolean>;
  disconnect(): Promise<boolean>;
  /** Dados crus; valide com parseSpotifyPage. */
  getRecommended(type: string): Promise<unknown>;
  getChildren(id: string, offset: number): Promise<unknown>;
  play(id: string): Promise<boolean>;
  getImage(raw: string): Promise<string | null>;
}

/** O módulo, ou null se o código nativo não estiver no build. */
const SpotifyRemote = requireOptionalNativeModule<SpotifyRemoteNativeModule>('SpotifyRemote');

export default SpotifyRemote;
export type { SpotifyRemoteNativeModule };
