// Cores, tamanhos e tipografia do painel.
//
// Fundo preto puro: em tela AMOLED, pixel preto fica apagado (menos calor,
// menos bateria e menos burn-in). Uma cor de destaque só (ciano). O laranja
// avermelhado aparece só como alerta (acima de 120 km/h, bateria descarregando).

import type { TextStyle } from 'react-native';

export const colors = {
  bg: '#000000',
  /** Fundo dos cards: quase preto, só pra separar as áreas. */
  surface: '#0B0C0E',
  border: '#1C1F24',
  text: '#F2F4F7',
  textDim: '#8B929C',
  textFaint: '#4B515A',
  accent: '#22D3EE',
  alert: '#FF5A36',
  /** Trilho do arco do velocímetro. */
  track: '#1A1D22',
} as const;

export const sizes = {
  /** Botão mínimo pra acertar dirigindo (dp). */
  minTouch: 64,
  radius: 14,
  gap: 10,
  /** Margem da tela (além da margem reservada para o anti burn-in). */
  screenPadding: 8,
} as const;

/** Números com largura fixa: "111" e "888" ocupam o mesmo espaço, nada treme. */
export const tabular: TextStyle = { fontVariant: ['tabular-nums'] };

/** Limite a partir do qual o velocímetro muda para a cor de alerta. */
export const SPEED_ALERT_KMH = 120;

/** Fundo da escala do velocímetro. */
export const SPEED_MAX_KMH = 200;
