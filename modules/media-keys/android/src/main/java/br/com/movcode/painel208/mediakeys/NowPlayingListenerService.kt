package br.com.movcode.painel208.mediakeys

import android.service.notification.NotificationListenerService
import android.service.notification.StatusBarNotification

/**
 * Serviço de "Acesso a notificações".
 *
 * 1. Com ele liberado, o Android deixa o painel ler as sessões de mídia dos
 *    outros apps (música, artista, capa, progresso do Spotify etc.).
 * 2. Ele também recebe as notificações: guardamos só as de navegação (próxima
 *    curva do Waze/Maps) e as conversas do WhatsApp, em CarNotificationsHub.
 *
 * O usuário libera em Configurações → Notificações → Acesso a notificações.
 */
class NowPlayingListenerService : NotificationListenerService() {
  override fun onListenerConnected() {
    super.onListenerConnected()
    instance = this
    CarNotificationsHub.reset(safeActive())
    onConnected?.invoke()
  }

  override fun onListenerDisconnected() {
    instance = null
    super.onListenerDisconnected()
  }

  override fun onNotificationPosted(sbn: StatusBarNotification?) {
    sbn?.let { CarNotificationsHub.posted(it) }
  }

  override fun onNotificationRemoved(sbn: StatusBarNotification?) {
    sbn?.let { CarNotificationsHub.removed(it) }
  }

  private fun safeActive(): Array<StatusBarNotification>? =
    try {
      activeNotifications
    } catch (e: Exception) {
      null
    }

  companion object {
    /** Chamado quando o acesso é liberado e o serviço conecta. */
    @Volatile
    var onConnected: (() -> Unit)? = null

    /** O serviço conectado agora (null se o acesso não estiver liberado). */
    @Volatile
    var instance: NowPlayingListenerService? = null
  }
}
