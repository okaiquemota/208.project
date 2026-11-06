package br.com.movcode.painel208.mediakeys

import android.app.Notification
import android.service.notification.StatusBarNotification

/**
 * Guarda, na memória, as notificações que interessam ao painel:
 * - navegação (Waze, Maps…): a próxima curva e a distância;
 * - conversas do WhatsApp: as últimas mensagens de cada conversa.
 *
 * Quem preenche é o serviço de "Acesso a notificações"; quem lê é o módulo
 * CarNotifications. Nada é salvo em disco: some quando a notificação some.
 */
object CarNotificationsHub {
  val NAV_PACKAGES = setOf(
    "com.waze",
    "com.google.android.apps.maps",
    "com.google.android.apps.mapslite",
    "com.here.app.maps",
    "com.sygic.aura",
    "net.osmand",
    "net.osmand.plus",
  )
  val CHAT_PACKAGES = setOf("com.whatsapp", "com.whatsapp.w4b")

  private val lock = Any()
  private val nav = LinkedHashMap<String, StatusBarNotification>()
  private val chats = LinkedHashMap<String, StatusBarNotification>()

  /** Avisos para o módulo (navegação mudou / mensagens mudaram). */
  @Volatile var onNavigation: (() -> Unit)? = null
  @Volatile var onMessages: (() -> Unit)? = null

  /** O serviço conectou: começa do zero com o que já está na barra. */
  fun reset(active: Array<StatusBarNotification>?) {
    synchronized(lock) {
      nav.clear()
      chats.clear()
      active?.forEach { add(it) }
    }
    onNavigation?.invoke()
    onMessages?.invoke()
  }

  fun posted(sbn: StatusBarNotification) {
    val kind = synchronized(lock) { add(sbn) }
    when (kind) {
      Kind.NAV -> onNavigation?.invoke()
      Kind.CHAT -> onMessages?.invoke()
      null -> Unit
    }
  }

  fun removed(sbn: StatusBarNotification) {
    val (wasNav, wasChat) = synchronized(lock) {
      (nav.remove(sbn.key) != null) to (chats.remove(sbn.key) != null)
    }
    if (wasNav) onNavigation?.invoke()
    if (wasChat) onMessages?.invoke()
  }

  /** Notificações de navegação, a mais recente primeiro. */
  fun navigation(): List<StatusBarNotification> =
    synchronized(lock) { nav.values.sortedByDescending { it.postTime } }

  /** Conversas, a mais recente primeiro. */
  fun conversations(): List<StatusBarNotification> =
    synchronized(lock) { chats.values.sortedByDescending { it.postTime } }

  fun find(key: String): StatusBarNotification? = synchronized(lock) { chats[key] ?: nav[key] }

  private enum class Kind { NAV, CHAT }

  private fun add(sbn: StatusBarNotification): Kind? {
    val n = sbn.notification ?: return null
    if (n.flags and Notification.FLAG_GROUP_SUMMARY != 0) return null
    val pkg = sbn.packageName
    if (pkg in NAV_PACKAGES || n.category == Notification.CATEGORY_NAVIGATION) {
      nav.remove(sbn.key)
      nav[sbn.key] = sbn
      return Kind.NAV
    }
    if (pkg in CHAT_PACKAGES && isConversation(n)) {
      chats.remove(sbn.key)
      chats[sbn.key] = sbn
      return Kind.CHAT
    }
    return null
  }

  /** Mensagem de verdade (não chamada, backup, "WhatsApp Web ativo"…). */
  private fun isConversation(n: Notification): Boolean {
    if (n.flags and Notification.FLAG_ONGOING_EVENT != 0) return false
    val category = n.category
    if (category == Notification.CATEGORY_CALL || category == "missed_call") return false
    @Suppress("DEPRECATION")
    val messages = n.extras?.getParcelableArray(Notification.EXTRA_MESSAGES)
    return !messages.isNullOrEmpty() || category == Notification.CATEGORY_MESSAGE
  }
}
