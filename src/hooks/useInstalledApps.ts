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

/** Descobre os apps instalados da lista (mantém a ordem da lista). */
async function findInstalled(apps: CarApp[]): Promise<InstalledApp[]> {
  const icons = await Promise.all(apps.map((a) => loadIcon(a.package)));
  const found: InstalledApp[] = [];
  apps.forEach((app, i) => {
    const icon = icons[i];
    if (icon) found.push({ ...app, icon });
  });
  return found;
}

export function useInstalledApps(apps: CarApp[]) {
  const [installed, setInstalled] = useState<InstalledApp[]>([]);
  const [loading, setLoading] = useState(true);

  const apply = useCallback((found: InstalledApp[]) => {
    setInstalled(found);
    setLoading(false);
  }, []);

  const refresh = useCallback(() => {
    void findInstalled(apps).then(apply);
  }, [apps, apply]);

  useEffect(() => {
    let alive = true;
    void findInstalled(apps).then((found) => alive && apply(found));
    return () => {
      alive = false;
    };
  }, [apps, apply]);

  // Instalou ou desinstalou algo enquanto estava fora do painel: atualiza.
  useAppActive(refresh);

  const open = useCallback(
    (pkg: string) => {
      try {
        IntentLauncher.openApplication(pkg);
      } catch {
        // App removido nesse meio tempo: atualiza a lista em vez de mostrar erro.
        refresh();
      }
    },
    [refresh],
  );

  return { apps: installed, loading, open };
}
