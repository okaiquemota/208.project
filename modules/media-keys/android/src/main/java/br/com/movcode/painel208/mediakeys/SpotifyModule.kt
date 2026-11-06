package br.com.movcode.painel208.mediakeys

import android.content.Context
import android.graphics.Bitmap
import android.os.Handler
import android.os.Looper
import com.spotify.android.appremote.api.ConnectionParams
import com.spotify.android.appremote.api.Connector
import com.spotify.android.appremote.api.SpotifyAppRemote
import com.spotify.protocol.types.Image
import com.spotify.protocol.types.ImageUri
import com.spotify.protocol.types.ListItem
import com.spotify.protocol.types.ListItems
import expo.modules.kotlin.Promise
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition
import java.io.File
import java.io.FileOutputStream

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

  override fun definition() = ModuleDefinition {
    Name("SpotifyRemote")

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
      if (remote?.isConnected == true) {
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
      remote?.let { SpotifyAppRemote.disconnect(it) }
      remote = null
      true
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
      remote?.let { SpotifyAppRemote.disconnect(it) }
      remote = null
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
