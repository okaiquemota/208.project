// Visual do painel, no estilo CarPlay / Android Auto: fundo preto, barra
// lateral, cards grandes bem arredondados, fonte Inter e poucas cores.
//
// Fundo preto puro: em tela AMOLED, pixel preto fica apagado (menos calor,
// menos bateria e menos burn-in).

import type { TextStyle } from 'react-native';

export const colors = {
  bg: '#000000',
  /** Fundo dos cards: "vidro" escuro e translúcido, como os widgets do CarPlay. */
  card: 'rgba(26,27,31,0.74)',
  /** Borda bem sutil dos cards (a "aresta" do vidro). */
  cardBorder: 'rgba(255,255,255,0.08)',
  /** Elementos dentro dos cards (botões secundários, trilhos). */
  fill: 'rgba(255,255,255,0.10)',
  fillPressed: 'rgba(255,255,255,0.22)',
  /** Botão principal claro (play/pause), como no CarPlay. */
  primaryButton: 'rgba(255,255,255,0.90)',
  track: 'rgba(255,255,255,0.16)',
  text: '#FFFFFF',
  text2: 'rgba(235,235,245,0.66)',
  text3: 'rgba(235,235,245,0.38)',
  /** Cor de destaque (velocímetro, botões de ação). */
  accent: '#0A84FF',
  accentSoft: '#64D2FF',
  green: '#30D158',
  orange: '#FF9F0A',
  red: '#FF453A',
} as const;

export const sizes = {
  /** Botão mínimo pra acertar dirigindo (dp). */
  minTouch: 64,
  cardRadius: 26,
  buttonRadius: 20,
  gap: 10,
  /** Margem da tela (além da margem reservada para o anti burn-in). */
  screenPadding: 6,
  /** Largura da barra lateral. */
  rail: 84,
} as const;

/** Família da fonte embutida pelo plugin expo-font (app.json). */
export const FONT = 'Inter';

type Weight = '300' | '400' | '500' | '600' | '700' | '800';

/** Estilo de texto padrão: Inter, tamanho, peso e cor. */
export function font(size: number, weight: Weight = '400', color: string = colors.text): TextStyle {
  return { fontFamily: FONT, fontSize: size, fontWeight: weight, color, includeFontPadding: false };
}

/** Números com largura fixa: "111" e "888" ocupam o mesmo espaço, nada treme. */
export const tabular: TextStyle = { fontVariant: ['tabular-nums'] };

/** Limite a partir do qual o velocímetro muda para a cor de alerta. */
export const SPEED_ALERT_KMH = 120;

/** Fim da escala do velocímetro. */
export const SPEED_MAX_KMH = 200;

/** Abaixo dessa largura (tela dividida com o Waze) o painel usa o layout compacto. */
export const COMPACT_BELOW_DP = 700;
