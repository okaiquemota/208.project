// A seta do carro no mapa, em 3D (como a do Waze/CarPlay): duas faces com
// luz e sombra formando uma "quina" no meio, uma espessura embaixo e a sombra
// no chão. No modo 3D ela fica deitada, acompanhando a inclinação do mapa.

import { View } from 'react-native';
import Svg, { Defs, Ellipse, LinearGradient, Path, Stop } from 'react-native-svg';

export function CarArrow({ size, flat }: { size: number; flat?: boolean }) {
  return (
    <View style={{ width: size, height: size, transform: flat ? [] : [{ scaleY: 0.72 }] }}>
      <Svg width={size} height={size} viewBox="0 0 64 64">
        <Defs>
          <LinearGradient id="seta-esq" x1="0" y1="0" x2="1" y2="1">
            <Stop offset="0" stopColor="#9BEBFF" />
            <Stop offset="1" stopColor="#4CCFF5" />
          </LinearGradient>
          <LinearGradient id="seta-dir" x1="1" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor="#1DAEE6" />
            <Stop offset="1" stopColor="#0B86C0" />
          </LinearGradient>
        </Defs>
        {/* sombra no chão */}
        <Ellipse cx="32" cy="55" rx="20" ry="5" fill="#000" opacity={0.4} />
        {/* espessura (lados de baixo) */}
        <Path d="M9 50 L32 41 L32 46 L9 55 Z" fill="#0A6E9C" />
        <Path d="M55 50 L32 41 L32 46 L55 55 Z" fill="#075A82" />
        {/* faces de cima: clara (esquerda) e escura (direita) */}
        <Path d="M32 5 L9 50 L32 41 Z" fill="url(#seta-esq)" />
        <Path d="M32 5 L55 50 L32 41 Z" fill="url(#seta-dir)" />
        {/* contorno branco */}
        <Path d="M32 5 L55 50 L32 41 L9 50 Z" fill="none" stroke="#FFFFFF" strokeWidth={2.5} strokeLinejoin="round" />
      </Svg>
    </View>
  );
}
