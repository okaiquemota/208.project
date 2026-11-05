import { useEffect, useState } from 'react';

import { msUntilNextMinute } from '../lib/datetime';
import { useAppActive } from './useAppActive';

/**
 * Data/hora atual, atualizada exatamente na virada de cada minuto
 * (não precisa redesenhar a cada segundo só pra mostrar HH:MM).
 */
export function useClock(): Date {
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;
    const tick = () => {
      const d = new Date();
      setNow(d);
      timer = setTimeout(tick, msUntilNextMinute(d) + 50);
    };
    timer = setTimeout(tick, msUntilNextMinute(new Date()) + 50);
    return () => clearTimeout(timer);
  }, []);

  // Voltando de outro app, o timer pode ter atrasado: atualiza na hora.
  useAppActive(() => setNow(new Date()));

  return now;
}
