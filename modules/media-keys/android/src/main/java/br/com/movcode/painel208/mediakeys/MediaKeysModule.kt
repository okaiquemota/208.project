package br.com.movcode.painel208.mediakeys

import android.content.Context
import android.media.AudioManager
import android.os.SystemClock
import android.view.KeyEvent
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition

/**
 * Controle de música para o Painel 208.
 *
 * Em vez de falar com um player específico, simulamos as teclas de mídia
 * (as mesmas de um fone Bluetooth ou do volante). O Android entrega a tecla
 * para o app que está tocando agora: Spotify, YouTube Music, Deezer etc.
 * Nada disso precisa de permissão especial.
 *
 * Para crescer: o "tocando agora" (título e capa) entra aqui depois, com um
 * NotificationListenerService + MediaSessionManager.getActiveSessions().
 */
class MediaKeysModule : Module() {
  override fun definition() = ModuleDefinition {
    Name("MediaKeys")

    // Teclas de mídia. Devolvem false se o AudioManager não estiver disponível.
    Function("playPause") { sendMediaKey(KeyEvent.KEYCODE_MEDIA_PLAY_PAUSE) }
    Function("next") { sendMediaKey(KeyEvent.KEYCODE_MEDIA_NEXT) }
    Function("previous") { sendMediaKey(KeyEvent.KEYCODE_MEDIA_PREVIOUS) }

    // Volume da música (STREAM_MUSIC), um passo por vez. Devolvem o volume novo.
    Function("volumeUp") { adjustMusicVolume(AudioManager.ADJUST_RAISE) }
    Function("volumeDown") { adjustMusicVolume(AudioManager.ADJUST_LOWER) }
    Function("getVolume") { musicVolume() }

    // true quando algum app está tocando áudio (usado para trocar o ícone play/pause).
    Function("isMusicActive") { audioManager?.isMusicActive ?: false }
  }

  private val audioManager: AudioManager?
    get() = appContext.reactContext?.getSystemService(Context.AUDIO_SERVICE) as? AudioManager

  /** Manda "apertar" e "soltar" a tecla, como um botão físico faria. */
  private fun sendMediaKey(keyCode: Int): Boolean {
    val am = audioManager ?: return false
    val now = SystemClock.uptimeMillis()
    am.dispatchMediaKeyEvent(KeyEvent(now, now, KeyEvent.ACTION_DOWN, keyCode, 0))
    am.dispatchMediaKeyEvent(KeyEvent(now, now, KeyEvent.ACTION_UP, keyCode, 0))
    return true
  }

  /**
   * Flag 0 = sem o popup de volume do sistema (nada de janela na frente
   * enquanto dirige). O nível aparece na barrinha do próprio app.
   */
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
}
