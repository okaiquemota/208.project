import { useEffect, useState } from 'react';

/**
 * Date.now() atualizado a cada `intervalMs` enquanto `active` for true.
 * Usado pela barra de progresso da música (só o card do player redesenha).
 */
export function useNow(intervalMs: number, active: boolean): number {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    if (!active) return;
    const id = setInterval(() => setNow(Date.now()), intervalMs);
    return () => clearInterval(id);
  }, [intervalMs, active]);

  // Pausado, a barra não anda: o horário da última renderização basta.
  return now;
}
