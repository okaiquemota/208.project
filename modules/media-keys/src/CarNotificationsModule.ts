import { NativeModule, requireOptionalNativeModule } from 'expo';

export type CarNotificationsEvents = {
  /** A notificação de navegação mudou (leia de novo com getNavigation). */
  onNavigationChange: (event: object) => void;
  /** Chegou, mudou ou sumiu uma conversa (leia de novo com getMessages). */
  onMessagesChange: (event: object) => void;
};

/** Funções do lado Kotlin (CarNotificationsModule.kt). Dados crus: valide em src/lib. */
declare class CarNotificationsNativeModule extends NativeModule<CarNotificationsEvents> {
  getNavigation(): unknown;
  getMessages(): unknown;
  /** Abre o que a notificação abre (conversa, rota…). */
  openNotification(key: string): boolean;
  /** Responde pelo botão "Responder" da notificação. */
  reply(key: string, text: string): boolean;
  markRead(key: string): boolean;
}

/** O módulo, ou null se o código nativo não estiver no build. */
const CarNotifications = requireOptionalNativeModule<CarNotificationsNativeModule>('CarNotifications');

export default CarNotifications;
export type { CarNotificationsNativeModule };
