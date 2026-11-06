// "Waze + música": abrir o app de navegação e o painel lado a lado com um
// toque (serviço de acessibilidade do módulo media-keys, só para dividir a
// tela). Sem o serviço ligado, abre o app do jeito normal.

import { useCallback, useState } from 'react';

import MediaKeys from '../../modules/media-keys';
import { useAppActive } from './useAppActive';

const readEnabled = () => {
  try {
    return MediaKeys?.isSplitServiceEnabled() ?? false;
  } catch {
    return false;
  }
};

export function useSplitScreen() {
  const [enabled, setEnabled] = useState(readEnabled);

  // Voltando das Configurações (onde ligou o serviço).
  useAppActive(() => setEnabled(readEnabled()));

  /**
   * Abre o app ao lado do painel. Devolve true se cuidou de tudo; false se
   * quem chamou deve abrir o app do jeito normal.
   */
  const openSplit = useCallback((pkg: string) => {
    try {
      const result = MediaKeys?.openSplitWith(pkg);
      return result === 'ao-lado' || result === 'dividindo';
    } catch {
      return false;
    }
  }, []);

  const openSettings = useCallback(() => {
    try {
      MediaKeys?.openAccessibilitySettings();
    } catch {
      // Sem o módulo: nada a fazer.
    }
  }, []);

  return { available: MediaKeys !== null, enabled, openSplit, openSettings };
}

export type SplitScreenState = ReturnType<typeof useSplitScreen>;
