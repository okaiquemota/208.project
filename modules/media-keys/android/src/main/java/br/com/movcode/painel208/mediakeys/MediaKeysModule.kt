package br.com.movcode.painel208.mediakeys

import android.content.ComponentName
import android.content.Context
import android.content.Intent
import android.net.Uri
import android.content.pm.PackageManager
import android.graphics.Bitmap
import android.graphics.Canvas
import android.graphics.Color
import android.media.AudioManager
import android.media.MediaMetadata
import android.media.session.MediaController
import android.media.session.MediaSessionManager
import android.media.session.PlaybackState
import android.os.Build
import android.os.Handler
import android.os.Looper
import android.os.SystemClock
import android.provider.Settings
import android.view.KeyEvent
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition
import java.io.File
import java.io.FileOutputStream

private const val NOW_PLAYING_EVENT = "onNowPlayingChange"
private const val ARTWORK_MAX_PX = 600
private const val ACTION_ICON_PX = 96
private const val MAX_CUSTOM_ACTIONS = 4

/**
 * Música no Painel 208.
 *
 * Dois níveis:
 * 1. Sem nenhuma liberação: simulamos as teclas de mídia (as mesmas de um fone
 *    Bluetooth). O Android entrega a tecla para o player ativo.
 * 2. Com "Acesso a notificações" liberado: lemos a sessão de mídia do player
 *    (Spotify, YT Music, Deezer…) → título, artista, capa, progresso, e
 *    controlamos o player direto (tocar, pausar, pular, avançar na música).
 *
 * Também abre outro app "ao lado" (tela dividida), para o Waze ocupar a
 * outra metade da tela.
 */
class MediaKeysModule : Module() {
  private val mainHandler = Handler(Looper.getMainLooper())
  private var observing = false
  private var sessionsListenerAdded = false
  private val watched = mutableListOf<Pair<MediaController, MediaController.Callback>>()

  // Cache da capa: só regrava o arquivo quando a música muda.
  private var lastArtKey: String? = null
  private var lastArt: Pair<String, String>? = null

  private val sessionsListener =
    MediaSessionManager.OnActiveSessionsChangedListener { list ->
      watchControllers(list ?: emptyList())
      emitNowPlaying()
    }

  override fun definition() = ModuleDefinition {
    Name("MediaKeys")
    Events(NOW_PLAYING_EVENT)

    // Controles: usam o player direto quando há acesso; senão, teclas de mídia.
    Function("playPause") {
      val c = activeController()
      if (c != null) {
        if (c.playbackState?.state == PlaybackState.STATE_PLAYING) c.transportControls.pause()
        else c.transportControls.play()
        true
      } else {
        sendMediaKey(KeyEvent.KEYCODE_MEDIA_PLAY_PAUSE)
      }
    }
    Function("next") {
      activeController()?.transportControls?.skipToNext()?.let { true }
        ?: sendMediaKey(KeyEvent.KEYCODE_MEDIA_NEXT)
    }
    Function("previous") {
      activeController()?.transportControls?.skipToPrevious()?.let { true }
        ?: sendMediaKey(KeyEvent.KEYCODE_MEDIA_PREVIOUS)
    }
    // Botões extras do próprio player (no Spotify: curtir, aleatório, repetir…).
    Function("sendCustomAction") { action: String ->
      val c = activeController() ?: return@Function false
      c.transportControls.sendCustomAction(action, null)
      true
    }
    Function("seekTo") { positionMs: Double ->
      val c = activeController() ?: return@Function false
      c.transportControls.seekTo(positionMs.toLong().coerceAtLeast(0))
      true
    }

    // Volume da música (STREAM_MUSIC), sem o popup do sistema.
    Function("volumeUp") { adjustMusicVolume(AudioManager.ADJUST_RAISE) }
    Function("volumeDown") { adjustMusicVolume(AudioManager.ADJUST_LOWER) }
    Function("getVolume") { musicVolume() }
    Function("isMusicActive") { audioManager?.isMusicActive ?: false }

    // "Tocando agora"
    Function("hasNotificationAccess") { hasNotificationAccess() }
    Function("openNotificationAccessSettings") { openNotificationAccessSettings() }
    Function("getNowPlaying") { nowPlaying() }

    // Qualquer app de música
    Function("getMediaApps") { mediaApps() }
    Function("getSessions") { sessionList() }
    Function("setPreferredPlayer") { packageName: String? ->
      preferredPackage = packageName
      mainHandler.post { emitNowPlaying() }
      true
    }

    // Tela dividida
    Function("openAdjacent") { packageName: String -> openAdjacent(packageName) }
    /** Abre um link (ex.: rota do Waze) no app indicado, ao lado se estiver em tela dividida. */
    Function("openUrlAdjacent") { url: String, packageName: String? -> openUrlAdjacent(url, packageName) }
    Function("isInMultiWindow") { appContext.currentActivity?.isInMultiWindowMode ?: false }

    /** O serviço "Waze + música" (acessibilidade) está ligado? */
    Function("isSplitServiceEnabled") { SplitScreenService.instance != null }

    /** Abre a tela de Acessibilidade do Android (para ligar o serviço). */
    Function("openAccessibilitySettings") {
      val ctx = context ?: return@Function false
      try {
        ctx.startActivity(Intent(Settings.ACTION_ACCESSIBILITY_SETTINGS).addFlags(Intent.FLAG_ACTIVITY_NEW_TASK))
        true
      } catch (e: Exception) {
        false
      }
    }

    /**
     * Abre um app (ex.: Waze) e o painel lado a lado, com o app à esquerda.
     * Devolve "ao-lado" (já estava dividida: só abriu na outra metade),
     * "dividindo" (montando a tela dividida) ou "sem-servico" (serviço desligado).
     */
    Function("openSplitWith") { packageName: String ->
      val inSplit = appContext.currentActivity?.isInMultiWindowMode ?: false
      when {
        inSplit -> if (openAdjacent(packageName)) "ao-lado" else "erro"
        SplitScreenService.instance?.splitWith(packageName) == true -> "dividindo"
        SplitScreenService.instance == null -> "sem-servico"
        else -> "erro"
      }
    }

    OnStartObserving(NOW_PLAYING_EVENT) {
      observing = true
      NowPlayingListenerService.onConnected = { mainHandler.post { startWatching(); emitNowPlaying() } }
      startWatching()
    }
    OnStopObserving(NOW_PLAYING_EVENT) {
      observing = false
      stopWatching()
    }
    OnDestroy {
      observing = false
      NowPlayingListenerService.onConnected = null
      stopWatching()
    }
  }

  private val context: Context?
    get() = appContext.reactContext

  private val audioManager: AudioManager?
    get() = context?.getSystemService(Context.AUDIO_SERVICE) as? AudioManager

  private val sessionManager: MediaSessionManager?
    get() = context?.getSystemService(Context.MEDIA_SESSION_SERVICE) as? MediaSessionManager

  private fun listenerComponent(ctx: Context) = ComponentName(ctx, NowPlayingListenerService::class.java)

  // ---------- Teclas de mídia e volume ----------

  /** Manda "apertar" e "soltar" a tecla, como um botão físico faria. */
  private fun sendMediaKey(keyCode: Int): Boolean {
    val am = audioManager ?: return false
    val now = SystemClock.uptimeMillis()
    am.dispatchMediaKeyEvent(KeyEvent(now, now, KeyEvent.ACTION_DOWN, keyCode, 0))
    am.dispatchMediaKeyEvent(KeyEvent(now, now, KeyEvent.ACTION_UP, keyCode, 0))
    return true
  }

  private fun adjustMusicVolume(direction: Int): Map<String, Int> {
    val am = audioManager ?: return mapOf("current" to 0, "max" to 0)
    try {
      am.adjustStreamVolume(AudioManager.STREAM_MUSIC, direction, 0)
    } catch (e: SecurityException) {
      // Alguns modos "Não perturbe" bloqueiam a mudança de volume. Ignoramos.
    }
    return musicVolume()
  }

  private fun musicVolume(): Map<String, Int> {
    val am = audioManager ?: return mapOf("current" to 0, "max" to 0)
    return mapOf(
      "current" to am.getStreamVolume(AudioManager.STREAM_MUSIC),
      "max" to am.getStreamMaxVolume(AudioManager.STREAM_MUSIC),
    )
  }

  // ---------- Acesso a notificações ----------

  private fun hasNotificationAccess(): Boolean {
    val ctx = context ?: return false
    val enabled = Settings.Secure.getString(ctx.contentResolver, "enabled_notification_listeners")
      ?: return false
    return enabled.split(":").any { ComponentName.unflattenFromString(it)?.packageName == ctx.packageName }
  }

  /** Abre a tela onde o usuário libera o acesso (direto no Painel 208, se o Android deixar). */
  private fun openNotificationAccessSettings(): Boolean {
    val ctx = context ?: return false
    val activity = appContext.currentActivity
    val intents = mutableListOf<Intent>()
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.R) {
      intents.add(
        Intent(Settings.ACTION_NOTIFICATION_LISTENER_DETAIL_SETTINGS).putExtra(
          Settings.EXTRA_NOTIFICATION_LISTENER_COMPONENT_NAME,
          listenerComponent(ctx).flattenToString(),
        ),
      )
    }
    intents.add(Intent(Settings.ACTION_NOTIFICATION_LISTENER_SETTINGS))
    for (intent in intents) {
      try {
        if (activity != null) {
          activity.startActivity(intent)
        } else {
          ctx.startActivity(intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK))
        }
        return true
      } catch (e: Exception) {
        // Tenta a próxima opção (alguns aparelhos não têm a tela de detalhe).
      }
    }
    return false
  }

  // ---------- Sessões de mídia ----------

  private fun sessions(): List<MediaController> {
    val ctx = context ?: return emptyList()
    if (!hasNotificationAccess()) return emptyList()
    val msm = sessionManager ?: return emptyList()
    return try {
      msm.getActiveSessions(listenerComponent(ctx)).filter { it.packageName != ctx.packageName }
    } catch (e: SecurityException) {
      emptyList()
    }
  }

  /** Player escolhido pelo usuário (null = automático). */
  @Volatile
  private var preferredPackage: String? = null

  private fun isPlaying(c: MediaController) = c.playbackState?.state == PlaybackState.STATE_PLAYING

  /**
   * Qual player o painel mostra e controla:
   * 1. o preferido, se estiver tocando;
   * 2. qualquer um que esteja tocando;
   * 3. o preferido, mesmo pausado;
   * 4. o mais recente.
   */
  private fun activeController(): MediaController? {
    val list = sessions()
    val pref = preferredPackage
    return list.firstOrNull { it.packageName == pref && isPlaying(it) }
      ?: list.firstOrNull { isPlaying(it) }
      ?: list.firstOrNull { it.packageName == pref }
      ?: list.firstOrNull()
  }

  /** Sessões de mídia abertas agora (um item por app). */
  private fun sessionList(): List<Map<String, Any?>> {
    val ctx = context ?: return emptyList()
    return sessions().distinctBy { it.packageName }.map { c ->
      mapOf(
        "packageName" to c.packageName,
        "appName" to appLabel(ctx, c.packageName),
        "isPlaying" to isPlaying(c),
        "title" to (c.metadata?.getString(MediaMetadata.METADATA_KEY_TITLE) ?: ""),
        "artist" to (c.metadata?.getString(MediaMetadata.METADATA_KEY_ARTIST) ?: ""),
      )
    }
  }

  /**
   * Apps de música/áudio instalados: os que oferecem um MediaBrowserService
   * (é assim que o Android Auto descobre os apps de mídia). Só entram os que
   * podem ser abertos pela tela inicial.
   */
  private fun mediaApps(): List<Map<String, Any?>> {
    val ctx = context ?: return emptyList()
    val pm = ctx.packageManager
    val intent = Intent("android.media.browse.MediaBrowserService")
    val infos =
      if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
        pm.queryIntentServices(intent, PackageManager.ResolveInfoFlags.of(0))
      } else {
        @Suppress("DEPRECATION")
        pm.queryIntentServices(intent, 0)
      }
    return infos
      .mapNotNull { it.serviceInfo?.packageName }
      .distinct()
      .filter { it != ctx.packageName && pm.getLaunchIntentForPackage(it) != null }
      .map { pkg -> mapOf("packageName" to pkg, "label" to appLabel(ctx, pkg)) }
      .sortedBy { (it["label"] as String).lowercase() }
  }

  private fun startWatching() {
    val ctx = context ?: return
    if (!observing || !hasNotificationAccess()) return
    val msm = sessionManager ?: return
    if (!sessionsListenerAdded) {
      try {
        msm.addOnActiveSessionsChangedListener(sessionsListener, listenerComponent(ctx), mainHandler)
        sessionsListenerAdded = true
      } catch (e: SecurityException) {
        return
      }
    }
    watchControllers(sessions())
  }

  private fun stopWatching() {
    if (sessionsListenerAdded) {
      try {
        sessionManager?.removeOnActiveSessionsChangedListener(sessionsListener)
      } catch (e: Exception) {
        // Já removido.
      }
      sessionsListenerAdded = false
    }
    watchControllers(emptyList())
  }

  /** Acompanha mudança de música e de play/pause em cada player ativo. */
  private fun watchControllers(list: List<MediaController>) {
    synchronized(watched) {
      watched.forEach { (controller, callback) -> controller.unregisterCallback(callback) }
      watched.clear()
      if (!observing) return
      for (controller in list) {
        val callback = object : MediaController.Callback() {
          override fun onMetadataChanged(metadata: MediaMetadata?) = emitNowPlaying()
          override fun onPlaybackStateChanged(state: PlaybackState?) = emitNowPlaying()
          override fun onSessionDestroyed() = emitNowPlaying()
        }
        controller.registerCallback(callback, mainHandler)
        watched.add(controller to callback)
      }
    }
  }

  private fun emitNowPlaying() {
    if (!observing) return
    sendEvent(NOW_PLAYING_EVENT, mapOf("nowPlaying" to nowPlaying()))
  }

  /** Foto do que está tocando agora (ou null se não houver acesso ou player). */
  private fun nowPlaying(): Map<String, Any?>? {
    val ctx = context ?: return null
    val c = activeController() ?: return null
    val md = c.metadata
    val st = c.playbackState

    val title = md?.getString(MediaMetadata.METADATA_KEY_TITLE)
      ?: md?.getString(MediaMetadata.METADATA_KEY_DISPLAY_TITLE)
      ?: ""
    val artist = md?.getString(MediaMetadata.METADATA_KEY_ARTIST)
      ?: md?.getString(MediaMetadata.METADATA_KEY_ALBUM_ARTIST)
      ?: md?.getString(MediaMetadata.METADATA_KEY_DISPLAY_SUBTITLE)
      ?: ""
    val album = md?.getString(MediaMetadata.METADATA_KEY_ALBUM) ?: ""
    val durationMs = md?.getLong(MediaMetadata.METADATA_KEY_DURATION) ?: 0L
    val playing = st?.state == PlaybackState.STATE_PLAYING

    // Posição: a sessão informa a posição num instante; projetamos até agora.
    var positionMs = st?.position ?: 0L
    if (st != null && playing && st.lastPositionUpdateTime > 0) {
      positionMs += ((SystemClock.elapsedRealtime() - st.lastPositionUpdateTime) * st.playbackSpeed).toLong()
    }
    if (durationMs > 0) positionMs = positionMs.coerceAtMost(durationMs)

    val art = artwork(ctx, md, "$title|$artist|$album")
    // Alguns players informam um link da capa em alta resolução.
    val remoteArt = listOf(
      md?.getString(MediaMetadata.METADATA_KEY_ALBUM_ART_URI),
      md?.getString(MediaMetadata.METADATA_KEY_ART_URI),
      md?.getString(MediaMetadata.METADATA_KEY_DISPLAY_ICON_URI),
    ).firstOrNull { it != null && (it.startsWith("https://") || it.startsWith("http://")) }

    val actions = st?.customActions.orEmpty().take(MAX_CUSTOM_ACTIONS).map { a ->
      mapOf(
        "action" to a.action,
        "name" to a.name.toString(),
        "iconUri" to actionIcon(ctx, c.packageName, a.icon),
      )
    }

    return mapOf(
      "packageName" to c.packageName,
      "appName" to appLabel(ctx, c.packageName),
      "title" to title,
      "artist" to artist,
      "album" to album,
      "durationMs" to durationMs.toDouble(),
      "positionMs" to positionMs.coerceAtLeast(0).toDouble(),
      "capturedAt" to System.currentTimeMillis().toDouble(),
      "playbackSpeed" to (st?.playbackSpeed ?: 1f).toDouble(),
      "isPlaying" to playing,
      "artworkUri" to art?.first,
      "artworkColor" to art?.second,
      "artworkRemoteUri" to remoteArt,
      "customActions" to actions,
    )
  }

  private val actionIconCache = mutableMapOf<String, String?>()

  /**
   * Desenha o ícone de um botão extra do player (ele mora nos recursos do app
   * do player) num PNG. Ícones escuros viram brancos, para aparecer no fundo
   * escuro; ícones coloridos (ex.: coração verde de "curtido") ficam como são.
   */
  @Synchronized
  private fun actionIcon(ctx: Context, packageName: String, resId: Int): String? {
    if (resId == 0) return null
    val key = "$packageName:$resId"
    if (actionIconCache.containsKey(key)) return actionIconCache[key]
    val result = try {
      val res = ctx.packageManager.getResourcesForApplication(packageName)
      @Suppress("DEPRECATION")
      val drawable = res.getDrawable(resId, null)
      val bmp = Bitmap.createBitmap(ACTION_ICON_PX, ACTION_ICON_PX, Bitmap.Config.ARGB_8888)
      drawable.setBounds(0, 0, ACTION_ICON_PX, ACTION_ICON_PX)
      drawable.draw(Canvas(bmp))
      if (isDarkIcon(bmp)) {
        bmp.eraseColor(Color.TRANSPARENT)
        drawable.mutate().setTint(Color.WHITE)
        drawable.draw(Canvas(bmp))
      }
      val dir = File(ctx.cacheDir, "acoes").apply { mkdirs() }
      val file = File(dir, "${packageName.replace('.', '_')}_$resId.png")
      FileOutputStream(file).use { bmp.compress(Bitmap.CompressFormat.PNG, 100, it) }
      "file://${file.absolutePath}"
    } catch (e: Exception) {
      null
    }
    actionIconCache[key] = result
    return result
  }

  /** O ícone é quase todo preto/cinza escuro? (pensado para fundo claro) */
  private fun isDarkIcon(bmp: Bitmap): Boolean {
    var sum = 0.0
    var count = 0
    val step = 4
    for (y in 0 until bmp.height step step) {
      for (x in 0 until bmp.width step step) {
        val px = bmp.getPixel(x, y)
        if (Color.alpha(px) < 128) continue
        sum += (0.299 * Color.red(px) + 0.587 * Color.green(px) + 0.114 * Color.blue(px)) / 255.0
        count++
      }
    }
    return count > 0 && sum / count < 0.35
  }

  private fun appLabel(ctx: Context, packageName: String): String =
    try {
      val pm = ctx.packageManager
      pm.getApplicationLabel(pm.getApplicationInfo(packageName, 0)).toString()
    } catch (e: Exception) {
      packageName
    }

  /**
   * Salva a capa num arquivo (o JavaScript mostra com <Image>) e calcula a cor
   * média dela, usada para tingir o fundo do card, como no CarPlay/Spotify.
   */
  @Synchronized
  private fun artwork(ctx: Context, md: MediaMetadata?, trackKey: String): Pair<String, String>? {
    val original = md?.getBitmap(MediaMetadata.METADATA_KEY_ALBUM_ART)
      ?: md?.getBitmap(MediaMetadata.METADATA_KEY_ART)
      ?: md?.getBitmap(MediaMetadata.METADATA_KEY_DISPLAY_ICON)
      ?: return null
    val key = "$trackKey|${original.width}x${original.height}|${original.generationId}"
    if (key == lastArtKey) return lastArt

    return try {
      val bmp =
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O && original.config == Bitmap.Config.HARDWARE) {
          original.copy(Bitmap.Config.ARGB_8888, false)
        } else {
          original
        }
      val scale = minOf(1f, ARTWORK_MAX_PX.toFloat() / maxOf(bmp.width, bmp.height))
      val scaled =
        if (scale < 1f) {
          Bitmap.createScaledBitmap(bmp, (bmp.width * scale).toInt(), (bmp.height * scale).toInt(), true)
        } else {
          bmp
        }

      val dir = File(ctx.cacheDir, "nowplaying").apply { mkdirs() }
      dir.listFiles()?.forEach { it.delete() }
      val file = File(dir, "capa_${Integer.toHexString(key.hashCode())}.jpg")
      FileOutputStream(file).use { scaled.compress(Bitmap.CompressFormat.JPEG, 90, it) }

      val pixel = Bitmap.createScaledBitmap(bmp, 1, 1, true).getPixel(0, 0)
      val color = String.format("#%06X", 0xFFFFFF and pixel)

      val result = "file://${file.absolutePath}" to color
      lastArtKey = key
      lastArt = result
      result
    } catch (e: Exception) {
      null
    }
  }

  // ---------- Tela dividida ----------

  /**
   * Abre outro app "ao lado". Se o Painel 208 já estiver em tela dividida, o
   * app abre na outra metade. Se não estiver, o Android abre em tela cheia.
   */
  private fun openUrlAdjacent(url: String, packageName: String?): Boolean {
    val activity = appContext.currentActivity ?: return false
    val intent = Intent(Intent.ACTION_VIEW, Uri.parse(url)).apply {
      if (packageName != null) setPackage(packageName)
      addFlags(Intent.FLAG_ACTIVITY_LAUNCH_ADJACENT or Intent.FLAG_ACTIVITY_NEW_TASK)
    }
    return try {
      activity.startActivity(intent)
      true
    } catch (e: Exception) {
      false
    }
  }

  private fun openAdjacent(packageName: String): Boolean {
    val activity = appContext.currentActivity ?: return false
    val intent = activity.packageManager.getLaunchIntentForPackage(packageName) ?: return false
    intent.addFlags(Intent.FLAG_ACTIVITY_LAUNCH_ADJACENT or Intent.FLAG_ACTIVITY_NEW_TASK)
    return try {
      activity.startActivity(intent)
      true
    } catch (e: Exception) {
      false
    }
  }
}
