package br.com.movcode.painel208.mediakeys

import android.app.ActivityOptions
import android.app.Notification
import android.app.PendingIntent
import android.app.Person
import android.app.RemoteInput
import android.content.Context
import android.content.Intent
import android.graphics.Bitmap
import android.graphics.Canvas
import android.graphics.drawable.Icon
import android.os.Build
import android.os.Bundle
import android.service.notification.StatusBarNotification
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition
import java.io.File
import java.io.FileOutputStream

private const val NAV_ICON_PX = 128
private const val AVATAR_PX = 96
private const val MAX_MESSAGES = 6
private const val MAX_FILES = 40

/**
 * Próxima curva e WhatsApp no painel, lidos das notificações.
 *
 * - Navegação: o Waze e o Maps mostram a próxima manobra numa notificação
 *   (distância, rua e uma seta). Mandamos os textos e a seta para o JavaScript,
 *   que entende a distância e a instrução.
 * - WhatsApp: cada conversa com mensagem nova tem uma notificação com as
 *   últimas mensagens, a foto e os botões "Responder" e "Marcar como lida".
 *   Usamos esses mesmos botões para responder sem abrir o WhatsApp.
 *
 * Precisa do mesmo "Acesso a notificações" do player.
 */
class CarNotificationsModule : Module() {
  override fun definition() = ModuleDefinition {
    Name("CarNotifications")

    Events("onNavigationChange", "onMessagesChange")

    OnStartObserving {
      CarNotificationsHub.onNavigation = { sendEvent("onNavigationChange", emptyMap<String, Any>()) }
      CarNotificationsHub.onMessages = { sendEvent("onMessagesChange", emptyMap<String, Any>()) }
    }

    OnStopObserving {
      CarNotificationsHub.onNavigation = null
      CarNotificationsHub.onMessages = null
    }

    /** Notificações de navegação (dados crus; o JavaScript escolhe e interpreta). */
    Function("getNavigation") {
      val ctx = context ?: return@Function emptyList<Map<String, Any?>>()
      CarNotificationsHub.navigation().map { navEntry(ctx, it) }
    }

    /** Conversas do WhatsApp com mensagem nova, a mais recente primeiro. */
    Function("getMessages") {
      val ctx = context ?: return@Function emptyList<Map<String, Any?>>()
      CarNotificationsHub.conversations().map { chatEntry(ctx, it) }
    }

    /** Abre o que a notificação abre (a conversa no WhatsApp, a rota no Waze…). */
    Function("openNotification") { key: String ->
      val ctx = context ?: return@Function false
      val intent = CarNotificationsHub.find(key)?.notification?.contentIntent ?: return@Function false
      send(ctx, intent, null)
    }

    /** Responde a conversa pelo botão "Responder" da própria notificação. */
    Function("reply") { key: String, text: String ->
      val ctx = context ?: return@Function false
      val n = CarNotificationsHub.find(key)?.notification ?: return@Function false
      val action = replyAction(n) ?: return@Function false
      val inputs = action.remoteInputs ?: return@Function false
      val results = Bundle().apply { inputs.forEach { putCharSequence(it.resultKey, text) } }
      val fill = Intent().addFlags(Intent.FLAG_RECEIVER_FOREGROUND)
      RemoteInput.addResultsToIntent(inputs, fill, results)
      if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.P) {
        RemoteInput.setResultsSource(fill, RemoteInput.SOURCE_FREE_FORM_INPUT)
      }
      send(ctx, action.actionIntent, fill)
    }

    /** "Marcar como lida" da própria notificação. */
    Function("markRead") { key: String ->
      val ctx = context ?: return@Function false
      val n = CarNotificationsHub.find(key)?.notification ?: return@Function false
      val action = markReadAction(n) ?: return@Function false
      send(ctx, action.actionIntent, null)
    }
  }

  private val context: Context?
    get() = appContext.reactContext

  // ---------- Leitura ----------

  private fun text(extras: Bundle?, key: String): String =
    extras?.getCharSequence(key)?.toString()?.trim().orEmpty()

  private fun navEntry(ctx: Context, sbn: StatusBarNotification): Map<String, Any?> {
    val n = sbn.notification
    val ex = n.extras
    return mapOf(
      "key" to sbn.key,
      "packageName" to sbn.packageName,
      "appName" to appLabel(ctx, sbn.packageName),
      "title" to text(ex, Notification.EXTRA_TITLE),
      "text" to text(ex, Notification.EXTRA_TEXT),
      "subText" to text(ex, Notification.EXTRA_SUB_TEXT),
      "bigText" to text(ex, Notification.EXTRA_BIG_TEXT),
      "postedAt" to sbn.postTime.toDouble(),
      "iconUri" to iconFile(ctx, n.getLargeIcon(), "nav", NAV_ICON_PX),
    )
  }

  private fun chatEntry(ctx: Context, sbn: StatusBarNotification): Map<String, Any?> {
    val n = sbn.notification
    val ex = n.extras
    @Suppress("DEPRECATION")
    val raw = ex?.getParcelableArray(Notification.EXTRA_MESSAGES).orEmpty()
    val messages = raw.mapNotNull { it as? Bundle }.mapNotNull { b ->
      val body = b.getCharSequence("text")?.toString() ?: return@mapNotNull null
      val sender = b.getCharSequence("sender")?.toString()
        ?: if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.P) {
          @Suppress("DEPRECATION")
          (b.getParcelable("sender_person") as? Person)?.name?.toString()
        } else {
          null
        }
      mapOf("sender" to sender, "text" to body, "time" to b.getLong("time").toDouble())
    }.takeLast(MAX_MESSAGES)
    return mapOf(
      "key" to sbn.key,
      "packageName" to sbn.packageName,
      "chat" to text(ex, Notification.EXTRA_CONVERSATION_TITLE).ifEmpty { text(ex, Notification.EXTRA_TITLE) },
      "title" to text(ex, Notification.EXTRA_TITLE),
      "text" to text(ex, Notification.EXTRA_TEXT),
      "isGroup" to (ex?.getBoolean(Notification.EXTRA_IS_GROUP_CONVERSATION) ?: false),
      "messages" to messages,
      "postedAt" to sbn.postTime.toDouble(),
      "avatarUri" to iconFile(ctx, n.getLargeIcon(), "avatar", AVATAR_PX),
      "canReply" to (replyAction(n) != null),
      "canMarkRead" to (markReadAction(n) != null),
    )
  }

  private fun replyAction(n: Notification): Notification.Action? =
    n.actions?.firstOrNull { a -> a.remoteInputs?.any { it.allowFreeFormInput } == true }

  private fun markReadAction(n: Notification): Notification.Action? =
    n.actions?.firstOrNull { a ->
      (Build.VERSION.SDK_INT >= Build.VERSION_CODES.P &&
        a.semanticAction == Notification.Action.SEMANTIC_ACTION_MARK_AS_READ) ||
        Regex("lida|lido|read", RegexOption.IGNORE_CASE).containsMatchIn(a.title ?: "")
    }

  private fun appLabel(ctx: Context, pkg: String): String =
    try {
      val pm = ctx.packageManager
      @Suppress("DEPRECATION")
      pm.getApplicationLabel(pm.getApplicationInfo(pkg, 0)).toString()
    } catch (e: Exception) {
      pkg
    }

  /**
   * Ícone grande da notificação (seta da manobra, foto do contato) salvo em
   * PNG. O nome do arquivo vem do conteúdo: a mesma seta não é salva de novo.
   */
  private fun iconFile(ctx: Context, icon: Icon?, folder: String, px: Int): String? {
    if (icon == null) return null
    return try {
      val drawable = icon.loadDrawable(ctx) ?: return null
      val bmp = Bitmap.createBitmap(px, px, Bitmap.Config.ARGB_8888)
      val canvas = Canvas(bmp)
      drawable.setBounds(0, 0, px, px)
      drawable.draw(canvas)
      val pixels = IntArray(px * px)
      bmp.getPixels(pixels, 0, px, 0, 0, px, px)
      val name = "${folder}_${Integer.toHexString(pixels.contentHashCode())}.png"
      val dir = File(ctx.cacheDir, "notificacoes").apply { mkdirs() }
      val file = File(dir, name)
      if (!file.exists()) {
        FileOutputStream(file).use { bmp.compress(Bitmap.CompressFormat.PNG, 100, it) }
        // Limpa os mais antigos.
        dir.listFiles()?.sortedByDescending { it.lastModified() }?.drop(MAX_FILES)?.forEach { it.delete() }
      }
      "file://${file.absolutePath}"
    } catch (e: Exception) {
      null
    }
  }

  // ---------- Ações ----------

  /**
   * Dispara um botão de outra app. No Android 14+, abrir uma tela a partir de
   * outro app precisa da nossa permissão explícita (o painel está na frente).
   */
  private fun send(ctx: Context, intent: PendingIntent, fill: Intent?): Boolean =
    try {
      val options =
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.UPSIDE_DOWN_CAKE) {
          @Suppress("DEPRECATION")
          ActivityOptions.makeBasic()
            .setPendingIntentBackgroundActivityStartMode(ActivityOptions.MODE_BACKGROUND_ACTIVITY_START_ALLOWED)
            .toBundle()
        } else {
          null
        }
      intent.send(ctx, 0, fill, null, null, null, options)
      true
    } catch (e: Exception) {
      false
    }
}
