// Atalhos para o Waze de verdade (deep link oficial do Waze).

/** Destinos salvos no próprio Waze (Casa e Trabalho). */
export type WazeFavorite = 'home' | 'work';

/**
 * Deep link oficial do Waze que já começa a rota para Casa ou Trabalho
 * (os endereços salvos no app do Waze).
 */
export function wazeFavoriteUrl(favorite: WazeFavorite): string {
  return `https://waze.com/ul?favorite=${favorite}&navigate=yes&utm_source=painel208`;
}
