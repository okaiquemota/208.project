package br.com.movcode.painel208.mediakeys

import android.accessibilityservice.AccessibilityService
import android.content.Intent
import android.os.Handler
import android.os.Looper
import android.view.accessibility.AccessibilityEvent

/**
 * Serviço de acessibilidade do Painel 208, só para montar a tela dividida
 * com um toque: abre o app de navegação (Waze), divide a tela e coloca o
 * painel na outra metade — como o painel do CarPlay (mapa + música).
 *
 * Ele NÃO lê o conteúdo da tela nem o que você digita (canRetrieveWindowContent
 * é false e ignoramos os eventos). Só usa o comando "dividir tela" do Android.
 */
class SplitScreenService : AccessibilityService() {
  private val handler = Handler(Looper.getMainLooper())

  override fun onServiceConnected() {
    super.onServiceConnected()
    instance = this
  }

  override fun onDestroy() {
    if (instance === this) instance = null
    super.onDestroy()
  }

  override fun onAccessibilityEvent(event: AccessibilityEvent?) = Unit

  override fun onInterrupt() = Unit

  /**
   * Waze (ou outro app) à esquerda e o painel à direita:
   * 1. abre o app em tela cheia;
   * 2. pede ao Android para dividir a tela (o app vai para a esquerda);
   * 3. abre o painel na outra metade.
   */
  fun splitWith(packageName: String): Boolean {
    val launch = packageManager.getLaunchIntentForPackage(packageName) ?: return false
    val panel = packageManager.getLaunchIntentForPackage(this.packageName) ?: return false
    return try {
      launch.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
      startActivity(launch)
      handler.postDelayed({
        performGlobalAction(GLOBAL_ACTION_TOGGLE_SPLIT_SCREEN)
        handler.postDelayed({
          try {
            panel.addFlags(
              Intent.FLAG_ACTIVITY_LAUNCH_ADJACENT or
                Intent.FLAG_ACTIVITY_NEW_TASK or
                Intent.FLAG_ACTIVITY_REORDER_TO_FRONT,
            )
            startActivity(panel)
          } catch (e: Exception) {
            // Se não der, o Android mostra os recentes para escolher a outra metade.
          }
        }, SECOND_STEP_MS)
      }, FIRST_STEP_MS)
      true
    } catch (e: Exception) {
      false
    }
  }

  companion object {
    /** Tempo para o app abrir antes de dividir a tela. */
    private const val FIRST_STEP_MS = 900L
    /** Tempo para a divisão terminar antes de abrir o painel ao lado. */
    private const val SECOND_STEP_MS = 900L

    /** O serviço ligado agora (null se não foi liberado nas Configurações). */
    @Volatile
    var instance: SplitScreenService? = null
  }
}
