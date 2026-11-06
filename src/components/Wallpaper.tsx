// Papel de parede atrás dos cards, no espírito do CarPlay: fundo bem escuro
// com duas ou três formas grandes e suaves na cor de destaque. Discreto de
// propósito — é o que dá profundidade aos cards translúcidos por cima.
// (Desenhado aqui em SVG; não usa imagem de ninguém.)

import { StyleSheet, useWindowDimensions } from 'react-native';
import Svg, { Circle, Defs, LinearGradient, Path, RadialGradient, Rect, Stop } from 'react-native-svg';

type Props = {
  /** Cor de destaque (formas principais). */
  main: string;
  /** Cor clara de destaque (faixa curva). */
  soft: string;
};

export function Wallpaper({ main, soft }: Props) {
  const { width: w, height: h } = useWindowDimensions();
  // Faixa curva que atravessa a tela (como as ondas do papel de parede do CarPlay).
  const band = `M ${-w * 0.05} ${h * 0.92} C ${w * 0.3} ${h * 0.55}, ${w * 0.55} ${h * 0.95}, ${w * 1.05} ${h * 0.18} L ${w * 1.05} ${h * 0.42} C ${w * 0.6} ${h * 1.1}, ${w * 0.3} ${h * 0.75}, ${-w * 0.05} ${h * 1.12} Z`;
  return (
    <Svg style={StyleSheet.absoluteFill} width={w} height={h} pointerEvents="none">
      <Defs>
        <RadialGradient id="wp-glow" cx="50%" cy="50%" r="50%">
          <Stop offset="0" stopColor={main} stopOpacity={0.42} />
          <Stop offset="1" stopColor={main} stopOpacity={0} />
        </RadialGradient>
        <RadialGradient id="wp-glow2" cx="50%" cy="50%" r="50%">
          <Stop offset="0" stopColor={soft} stopOpacity={0.16} />
          <Stop offset="1" stopColor={soft} stopOpacity={0} />
        </RadialGradient>
        <LinearGradient id="wp-band" x1="0" y1="1" x2="1" y2="0">
          <Stop offset="0" stopColor={soft} stopOpacity={0} />
          <Stop offset="0.5" stopColor={soft} stopOpacity={0.1} />
          <Stop offset="1" stopColor={main} stopOpacity={0.22} />
        </LinearGradient>
      </Defs>
      <Rect width={w} height={h} fill="#04060A" />
      <Circle cx={w * 0.72} cy={h * 1.05} r={h * 0.95} fill="url(#wp-glow)" />
      <Circle cx={w * 0.95} cy={h * 0.05} r={h * 0.6} fill="url(#wp-glow2)" />
      <Path d={band} fill="url(#wp-band)" />
    </Svg>
  );
}
