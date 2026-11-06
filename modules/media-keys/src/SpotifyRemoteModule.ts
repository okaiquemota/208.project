import { NativeModule, requireOptionalNativeModule } from 'expo';

/** Comandos do player do Spotify. */
export type SpotifyCommand = 'toggle' | 'next' | 'previous' | 'shuffle' | 'repeat' | 'like' | 'unlike';

export type SpotifyRemoteEvents = {
  /** Música mudou, pausou, curtiu…; state = null quando nada toca ou caiu a conexão. */
  onPlayerState: (event: { connected: boolean; state: unknown }) => void;
};

/** Funções do lado Kotlin (SpotifyModule.kt), pelo SDK oficial App Remote. */
declare class SpotifyRemoteNativeModule extends NativeModule<SpotifyRemoteEvents> {
  isInstalled(): boolean;
  isConnected(): boolean;
  connect(clientId: string, redirectUri: string): Promise<boolean>;
  disconnect(): Promise<boolean>;
  /** Dados crus; valide com parseSpotifyPage. */
  getRecommended(type: string): Promise<unknown>;
  getChildren(id: string, offset: number): Promise<unknown>;
  /** shuffle: true = aleatório, false = em ordem, null = como está. */
  play(id: string, shuffle: boolean | null): Promise<boolean>;
  getImage(raw: string): Promise<string | null>;
  /** O que está tocando agora (dados crus; valide com parseSpotifyPlayer). */
  getPlayerState(): unknown;
  playerCommand(command: SpotifyCommand): Promise<boolean>;
}

/** O módulo, ou null se o código nativo não estiver no build. */
const SpotifyRemote = requireOptionalNativeModule<SpotifyRemoteNativeModule>('SpotifyRemote');

export default SpotifyRemote;
export type { SpotifyRemoteNativeModule };
