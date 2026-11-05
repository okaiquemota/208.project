import { useEffect, useState } from 'react';

import { BURN_IN_INTERVAL_MS, burnInOffset, type Offset } from '../lib/burnIn';

/** Deslocamento atual da interface; muda sozinho a cada minuto. */
export function useBurnInShift(): Offset {
  const [step, setStep] = useState(0);

  useEffect(() => {
    const id = setInterval(() => setStep((s) => s + 1), BURN_IN_INTERVAL_MS);
    return () => clearInterval(id);
  }, []);

  return burnInOffset(step);
}
