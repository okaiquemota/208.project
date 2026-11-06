// A seta do carro no mapa, como a do Waze/CarPlay: azul com borda branca e
// uma sombra no chão. No 3D ela fica "deitada" (achatada), acompanhando a
// inclinação do mapa.

import { View } from 'react-native';
import Svg, { Ellipse, Path } from 'react-native-svg';

export function CarArrow({ size, flat }: { size: number; flat?: boolean }) {
  return (
    <View style={{ width: size, height: size, transform: flat ? [] : [{ scaleY: 0.78 }] }}>
      <Svg width={size} height={size} viewBox="0 0 48 48">
        <Ellipse cx="24" cy="40" rx="14" ry="4" fill="#000" opacity={0.35} />
        <Path d="M24 4 L40 40 L24 32 L8 40 Z" fill="#33CCFF" stroke="#FFFFFF" strokeWidth={3} strokeLinejoin="round" />
      </Svg>
    </View>
  );
}
