import { useEffect, useRef } from 'react';
import { AppState } from 'react-native';

/**
 * Chama `onActive` toda vez que o app volta para a frente
 * (ex.: depois de abrir o Waze e voltar pro painel).
 */
export function useAppActive(onActive: () => void) {
  const callback = useRef(onActive);
  callback.current = onActive;

  useEffect(() => {
    let previous = AppState.currentState;
    const sub = AppState.addEventListener('change', (next) => {
      if (previous !== 'active' && next === 'active') callback.current();
      previous = next;
    });
    return () => sub.remove();
  }, []);
}
