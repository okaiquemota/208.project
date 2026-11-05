package br.com.movcode.painel208.mediakeys

import android.service.notification.NotificationListenerService

/**
 * Serviço de "Acesso a notificações".
 *
 * Ele não precisa fazer nada com as notificações em si: o Android só deixa um
 * app ler as sessões de mídia dos outros (música, artista, capa, progresso do
 * Spotify etc.) se o app tiver um serviço destes liberado pelo usuário em
 * Configurações → Notificações → Acesso a notificações.
 *
 * Quando o usuário libera, o Android conecta o serviço; avisamos o módulo
 * para ele começar a acompanhar as sessões na hora.
 */
class NowPlayingListenerService : NotificationListenerService() {
  override fun onListenerConnected() {
    super.onListenerConnected()
    onConnected?.invoke()
  }

  companion object {
    /** Chamado quando o acesso é liberado e o serviço conecta. */
    @Volatile
    var onConnected: (() -> Unit)? = null
  }
}
