import { useEffect, useEffectEvent } from 'react';
import { AppState } from 'react-native';

/**
 * Chama `onActive` toda vez que o app volta para a frente
 * (ex.: depois de abrir o Waze e voltar pro painel).
 */
export function useAppActive(onActive: () => void) {
  // useEffectEvent: sempre chama a versão mais nova de onActive sem
  // precisar recriar a inscrição no AppState a cada renderização.
  const handleActive = useEffectEvent(onActive);

  useEffect(() => {
    let previous = AppState.currentState;
    const sub = AppState.addEventListener('change', (next) => {
      if (previous !== 'active' && next === 'active') handleActive();
      previous = next;
    });
    return () => sub.remove();
  }, []);
}
