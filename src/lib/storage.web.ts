// Versão para a prévia no navegador (o app de verdade é só Android e usa storage.ts).

export function readText(key: string): string | null {
  try {
    return globalThis.localStorage?.getItem(key) ?? null;
  } catch {
    return null;
  }
}

export function writeText(key: string, value: string): void {
  try {
    globalThis.localStorage?.setItem(key, value);
  } catch {
    // Sem armazenamento: vale até fechar a página.
  }
}
