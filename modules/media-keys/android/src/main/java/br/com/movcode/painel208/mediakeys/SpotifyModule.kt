package br.com.movcode.painel208.mediakeys

import android.content.Context
import android.graphics.Bitmap
import android.os.Handler
import android.os.Looper
import com.spotify.android.appremote.api.ConnectionParams
import com.spotify.android.appremote.api.Connector
import com.spotify.android.appremote.api.SpotifyAppRemote
import com.spotify.protocol.client.CallResult
import com.spotify.protocol.client.Subscription
import com.spotify.protocol.types.Empty
import com.spotify.protocol.types.Image
import com.spotify.protocol.types.ImageUri
import com.spotify.protocol.types.ListItem
import com.spotify.protocol.types.ListItems
import com.spotify.protocol.types.PlayerState
import expo.modules.kotlin.Promise
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition
import java.io.File
import java.io.FileOutputStream
import java.util.concurrent.Executors

private const val PAGE_SIZE = 50

/**
 * Spotify dentro do Painel 208, pelo SDK oficial "App Remote".
 *
 * Ele conversa direto com o app do Spotify instalado no celular (não usa a
 * internet do nosso lado) e dá acesso às listas que o Spotify monta para
 * carro: tocados recentemente, feito para você, playlists, pastas… — o mesmo
 * tipo de navegação do Android Auto. Precisa de conta Premium e do app
 * cadastrado em developer.spotify.com (Client ID, pacote e SHA-1).
 *
 * As listas vêm como "itens": cada um pode ser tocado (playable) e/ou aberto
 * (hasChildren). Guardamos os itens por id para o JavaScript só passar o id.
 */
class SpotifyModule : Module() {
  private val mainHandler = Handler(Looper.getMainLooper())
  private var remote: SpotifyAppRemote? = null
  private val itemsById = HashMap<String, ListItem>()
  private val imageCache = HashMap<String, String>()

  // ---- Player (o que está tocando no Spotify) ----
  // Tudo abaixo é mexido só na thread principal (os avisos do SDK chegam nela).
  private var playerSub: Subscription<PlayerState>? = null
  private var state: PlayerState? = null
  private var stateAt = 0L
  private var trackUri: String? = null
  /** Música atual está nas Curtidas (null = ainda não sabemos). */
  private var liked: Boolean? = null
  private var canLike = true
  /** Capa grande da música atual: identificador → (arquivo, cor média). */
  private var artRaw: String? = null
  private var art: Pair<String, String>? = null
  private var artLoading: String? = null
  /** Último estado montado (lido pelo JavaScript ao abrir). */
  @Volatile private var lastPlayer: Map<String, Any?>? = null
  /** Salvar capas fora da thread principal. */
  private val io = Executors.newSingleThreadExecutor()

  override fun definition() = ModuleDefinition {
    Name("SpotifyRemote")

    /** A música do Spotify mudou (ou pausou, curtiu, aleatório…). */
    Events("onPlayerState")

    Function("isInstalled") {
      context?.let { SpotifyAppRemote.isSpotifyInstalled(it) } ?: false
    }
    Function("isConnected") { remote?.isConnected == true }

    /** Conecta ao app do Spotify. Na primeira vez o Spotify pede a autorização. */
    AsyncFunction("connect") { clientId: String, redirectUri: String, promise: Promise ->
      val ctx = context
      if (ctx == null) {
        promise.reject("ERR_SEM_CONTEXTO", "App não está pronto", null)
        return@AsyncFunction
      }
      remote?.takeIf { it.isConnected }?.let { r ->
        // Já conectado (ex.: o JavaScript recarregou): garante o player ligado.
        mainHandler.post { if (playerSub == null) startPlayer(r) else emitPlayer() }
        promise.resolve(true)
        return@AsyncFunction
      }
      val params = ConnectionParams.Builder(clientId)
        .setRedirectUri(redirectUri)
        .showAuthView(true)
        .build()
      mainHandler.post {
        SpotifyAppRemote.connect(ctx, params, object : Connector.ConnectionListener {
          override fun onConnected(appRemote: SpotifyAppRemote) {
            remote = appRemote
            startPlayer(appRemote)
            promise.resolve(true)
          }

          override fun onFailure(error: Throwable) {
            remote = null
            // O nome da exceção vira o código (o JavaScript traduz para português).
            promise.reject(error.javaClass.simpleName, error.message ?: "Falha ao conectar", error)
          }
        })
      }
    }

    AsyncFunction("disconnect") {
      mainHandler.post { stopPlayer(false) }
      remote?.let { SpotifyAppRemote.disconnect(it) }
      remote = null
      true
    }

    /** O que está tocando no Spotify agora (null se nada ou desconectado). */
    Function("getPlayerState") { lastPlayer }

    /**
     * Comandos do player: toggle (tocar/pausar), next, previous, shuffle,
     * repeat, like (curtir) e unlike (descurtir).
     */
    AsyncFunction("playerCommand") { command: String, promise: Promise ->
      mainHandler.post { runCommand(command, promise) }
    }

    /** Listas iniciais (as mesmas que o Spotify mostra em carros). */
    AsyncFunction("getRecommended") { type: String, promise: Promise ->
      val r = connected(promise) ?: return@AsyncFunction
      r.contentApi.getRecommendedContentItems(type)
        .setResultCallback { list -> promise.resolve(toMaps(list)) }
        .setErrorCallback { e -> promise.reject("ERR_SPOTIFY", e.message ?: "Erro do Spotify", e) }
    }

    /** O que tem dentro de um item (ex.: as playlists de uma seção). */
    AsyncFunction("getChildren") { id: String, offset: Int, promise: Promise ->
      val r = connected(promise) ?: return@AsyncFunction
      val item = itemsById[id]
      if (item == null) {
        promise.reject("ERR_ITEM", "Item não encontrado (abra a lista de novo)", null)
        return@AsyncFunction
      }
      r.contentApi.getChildrenOfItem(item, PAGE_SIZE, offset)
        .setResultCallback { list -> promise.resolve(toMaps(list)) }
        .setErrorCallback { e -> promise.reject("ERR_SPOTIFY", e.message ?: "Erro do Spotify", e) }
    }

    /** Toca um item (playlist, álbum, mix, música…). */
    AsyncFunction("play") { id: String, promise: Promise ->
      val r = connected(promise) ?: return@AsyncFunction
      val item = itemsById[id]
      if (item == null) {
        promise.reject("ERR_ITEM", "Item não encontrado (abra a lista de novo)", null)
        return@AsyncFunction
      }
      r.contentApi.playContentItem(item)
        .setResultCallback { promise.resolve(true) }
        .setErrorCallback { e -> promise.reject("ERR_SPOTIFY", e.message ?: "Erro do Spotify", e) }
    }

    /** Capa de um item, salva em arquivo ("file://…"). */
    AsyncFunction("getImage") { raw: String, promise: Promise ->
      imageCache[raw]?.let {
        promise.resolve(it)
        return@AsyncFunction
      }
      val r = connected(promise) ?: return@AsyncFunction
      val ctx = context
      if (ctx == null) {
        promise.resolve(null)
        return@AsyncFunction
      }
      r.imagesApi.getImage(ImageUri(raw), Image.Dimension.MEDIUM)
        .setResultCallback { bmp ->
          val uri = saveImage(ctx, raw, bmp)
          if (uri != null) imageCache[raw] = uri
          promise.resolve(uri)
        }
        .setErrorCallback { promise.resolve(null) }
    }

    OnDestroy {
      playerSub?.cancel()
      playerSub = null
      remote?.let { SpotifyAppRemote.disconnect(it) }
      remote = null
      io.shutdown()
    }
  }

  // ---------- Player ----------

  /** Passa a receber cada mudança do player do Spotify. */
  private fun startPlayer(r: SpotifyAppRemote) {
    playerSub?.cancel()
    playerSub = r.playerApi.subscribeToPlayerState()
      .setEventCallback { s -> onPlayerState(s) }
    // Se a conexão cair (Spotify fechado, por exemplo), avisamos o JavaScript.
    playerSub?.setErrorCallback { stopPlayer(remote?.isConnected == true) }
  }

  private fun stopPlayer(connected: Boolean) {
    playerSub?.cancel()
    playerSub = null
    state = null
    trackUri = null
    liked = null
    lastPlayer = null
    if (!connected) remote = null
    sendEvent("onPlayerState", mapOf("connected" to connected, "state" to null))
  }

  private fun onPlayerState(s: PlayerState) {
    state = s
    stateAt = System.currentTimeMillis()
    val track = s.track
    if (track?.uri != trackUri) {
      trackUri = track?.uri
      liked = null
      canLike = true
      track?.uri?.let { loadLibraryState(it) }
    }
    val raw = track?.imageUri?.raw
    if (raw != null && raw != artRaw && raw != artLoading) loadArtwork(raw)
    emitPlayer()
  }

  private fun emitPlayer() {
    lastPlayer = playerMap()
    sendEvent("onPlayerState", mapOf("connected" to true, "state" to lastPlayer))
  }

  private fun playerMap(): Map<String, Any?>? {
    val s = state ?: return null
    val t = s.track ?: return null
    val artists = t.artists?.mapNotNull { it?.name }?.filter { it.isNotBlank() }.orEmpty()
    val raw = t.imageUri?.raw
    val cover = if (raw != null && raw == artRaw) art else null
    val rules = s.playbackRestrictions
    return mapOf(
      "uri" to t.uri,
      "title" to (t.name ?: ""),
      "artist" to (if (artists.isNotEmpty()) artists.joinToString(", ") else t.artist?.name ?: ""),
      "album" to (t.album?.name ?: ""),
      "durationMs" to t.duration.toDouble(),
      "positionMs" to s.playbackPosition.toDouble(),
      "capturedAt" to stateAt.toDouble(),
      "playbackSpeed" to s.playbackSpeed.toDouble(),
      "isPaused" to s.isPaused,
      "shuffle" to (s.playbackOptions?.isShuffling ?: false),
      "repeat" to (s.playbackOptions?.repeatMode ?: 0),
      "canSkipNext" to (rules?.canSkipNext ?: true),
      "canSkipPrev" to (rules?.canSkipPrev ?: true),
      "canToggleShuffle" to (rules?.canToggleShuffle ?: true),
      "canRepeat" to ((rules?.canRepeatContext ?: true) || (rules?.canRepeatTrack ?: true)),
      "isEpisode" to t.isEpisode,
      "liked" to liked,
      "canLike" to canLike,
      "artworkUri" to cover?.first,
      "artworkColor" to cover?.second,
    )
  }

  /** Confere se a música está nas Curtidas (para acender o coração). */
  private fun loadLibraryState(uri: String) {
    val r = remote ?: return
    r.userApi.getLibraryState(uri)
      .setResultCallback { st ->
        if (uri == trackUri) {
          liked = st.isAdded
          canLike = st.canAdd
          emitPlayer()
        }
      }
      .setErrorCallback { /* sem coração aceso; não atrapalha o resto */ }
  }

  /** Capa grande (720 px) da música, salva em arquivo, com a cor média. */
  private fun loadArtwork(raw: String) {
    val r = remote ?: return
    val ctx = context ?: return
    artLoading = raw
    r.imagesApi.getImage(ImageUri(raw), Image.Dimension.LARGE)
      .setResultCallback { bmp ->
        io.execute {
          val result = try {
            val dir = File(ctx.cacheDir, "spotify-player").apply { mkdirs() }
            dir.listFiles()?.forEach { it.delete() }
            val file = File(dir, "capa_${Integer.toHexString(raw.hashCode())}.jpg")
            FileOutputStream(file).use { bmp.compress(Bitmap.CompressFormat.JPEG, 90, it) }
            val pixel = Bitmap.createScaledBitmap(bmp, 1, 1, true).getPixel(0, 0)
            "file://${file.absolutePath}" to String.format("#%06X", 0xFFFFFF and pixel)
          } catch (e: Exception) {
            null
          }
          mainHandler.post {
            if (artLoading == raw) artLoading = null
            if (result != null) {
              artRaw = raw
              art = result
              if (state?.track?.imageUri?.raw == raw) emitPlayer()
            }
          }
        }
      }
      .setErrorCallback { mainHandler.post { if (artLoading == raw) artLoading = null } }
  }

  private fun runCommand(command: String, promise: Promise) {
    val r = connected(promise) ?: return
    val uri = trackUri
    val call: CallResult<Empty>? = when (command) {
      "toggle" -> if (state?.isPaused != false) r.playerApi.resume() else r.playerApi.pause()
      "next" -> r.playerApi.skipNext()
      "previous" -> r.playerApi.skipPrevious()
      "shuffle" -> r.playerApi.toggleShuffle()
      "repeat" -> r.playerApi.toggleRepeat()
      "like" -> uri?.let { r.userApi.addToLibrary(it) }
      "unlike" -> uri?.let { r.userApi.removeFromLibrary(it) }
      else -> null
    }
    if (call == null) {
      promise.reject("ERR_COMANDO", "Comando indisponível: $command", null)
      return
    }
    // Curtir: acende/apaga o coração na hora; a conferência vem depois.
    if ((command == "like" || command == "unlike") && uri != null) {
      liked = command == "like"
      emitPlayer()
    }
    call
      .setResultCallback {
        if ((command == "like" || command == "unlike") && uri != null) loadLibraryState(uri)
        promise.resolve(true)
      }
      .setErrorCallback { e ->
        if ((command == "like" || command == "unlike") && uri != null) loadLibraryState(uri)
        promise.reject("ERR_SPOTIFY", e.message ?: "Erro do Spotify", e)
      }
  }

  private val context: Context?
    get() = appContext.reactContext

  private fun connected(promise: Promise): SpotifyAppRemote? {
    val r = remote
    if (r == null || !r.isConnected) {
      promise.reject("ERR_DESCONECTADO", "Spotify não está conectado", null)
      return null
    }
    return r
  }

  private fun toMaps(list: ListItems): Map<String, Any?> {
    val items = (list.items ?: emptyArray()).map { item ->
      itemsById[item.id] = item
      mapOf(
        "id" to item.id,
        "uri" to item.uri,
        "title" to item.title,
        "subtitle" to item.subtitle,
        "playable" to item.playable,
        "hasChildren" to item.hasChildren,
        "image" to item.imageUri?.raw,
      )
    }
    return mapOf("total" to list.total, "offset" to list.offset, "items" to items)
  }

  private fun saveImage(ctx: Context, raw: String, bmp: Bitmap): String? =
    try {
      val dir = File(ctx.cacheDir, "spotify").apply { mkdirs() }
      val file = File(dir, "img_${Integer.toHexString(raw.hashCode())}.jpg")
      FileOutputStream(file).use { bmp.compress(Bitmap.CompressFormat.JPEG, 88, it) }
      "file://${file.absolutePath}"
    } catch (e: Exception) {
      null
    }
}
