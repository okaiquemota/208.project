// Armazenamento chave-valor no celular (SQLite, via expo-sqlite/kv-store).
// Leitura síncrona: o app já abre com os ajustes certos, sem "piscar".

import Storage from 'expo-sqlite/kv-store';

export function readText(key: string): string | null {
  try {
    return Storage.getItemSync(key);
  } catch {
    return null;
  }
}

export function writeText(key: string, value: string): void {
  try {
    Storage.setItemSync(key, value);
  } catch {
    // Falha rara de disco: o ajuste vale até fechar o app.
  }
}
