// Ajustes do app disponíveis em todas as telas (React Context).
// Carrega do celular na abertura e salva a cada mudança.

import { createContext, type ReactNode, useCallback, useContext, useMemo, useState } from 'react';

import { ACCENTS, parseSettings, type Settings } from '../lib/settings';
import { readText, writeText } from '../lib/storage';

const STORAGE_KEY = 'painel208.settings.v1';

type SettingsContextValue = {
  settings: Settings;
  /** Muda os ajustes a partir dos atuais (e salva). */
  update: (change: (current: Settings) => Settings) => void;
};

const SettingsContext = createContext<SettingsContextValue | null>(null);

export function SettingsProvider({ children, initial }: { children: ReactNode; initial?: Settings }) {
  const [settings, setSettings] = useState<Settings>(() => initial ?? parseSettings(readText(STORAGE_KEY)));

  const update = useCallback((change: (current: Settings) => Settings) => {
    setSettings((current) => {
      const next = change(current);
      if (next !== current) writeText(STORAGE_KEY, JSON.stringify(next));
      return next;
    });
  }, []);

  const value = useMemo(() => ({ settings, update }), [settings, update]);
  return <SettingsContext.Provider value={value}>{children}</SettingsContext.Provider>;
}

export function useSettings(): SettingsContextValue {
  const ctx = useContext(SettingsContext);
  if (!ctx) throw new Error('useSettings precisa estar dentro de <SettingsProvider>');
  return ctx;
}

/** Cor de destaque escolhida nos Ajustes ({ main, soft }). */
export function useAccent() {
  return ACCENTS[useSettings().settings.accent];
}
