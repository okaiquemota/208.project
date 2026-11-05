// Atalhos: descobre quais apps da lista estão instalados e pega o ícone real.
// Os que não estão instalados simplesmente não aparecem.

import * as IntentLauncher from 'expo-intent-launcher';
import { useCallback, useEffect, useState } from 'react';

import type { CarApp } from '../lib/carApps';
import { useAppActive } from './useAppActive';

export type InstalledApp = CarApp & {
  /** Ícone em "data:image/png;base64,…", pronto pra usar no <Image>. */
  icon: string;
};

/** Pega o ícone; se o app não existir, devolve null (a função rejeita ou devolve ""). */
async function loadIcon(pkg: string): Promise<string | null> {
  try {
    const icon = await IntentLauncher.getApplicationIconAsync(pkg);
    return icon ? icon : null;
  } catch {
    return null;
  }
}

export function useInstalledApps(apps: CarApp[]) {
  const [installed, setInstalled] = useState<InstalledApp[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    const icons = await Promise.all(apps.map((a) => loadIcon(a.package)));
    const found: InstalledApp[] = [];
    apps.forEach((app, i) => {
      const icon = icons[i];
      if (icon) found.push({ ...app, icon });
    });
    setInstalled(found);
    setLoading(false);
  }, [apps]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  // Instalou ou desinstalou algo enquanto estava fora do painel: atualiza.
  useAppActive(() => void refresh());

  const open = useCallback(
    (pkg: string) => {
      try {
        IntentLauncher.openApplication(pkg);
      } catch {
        // App removido nesse meio tempo: atualiza a lista em vez de mostrar erro.
        void refresh();
      }
    },
    [refresh],
  );

  return { apps: installed, loading, open };
}
