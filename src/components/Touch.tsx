// Área de toque com resposta visual (encolhe e escurece um pouco ao tocar),
// usada nos botões do painel. Toque mínimo de 64 dp, mesmo quando o desenho
// do botão é menor (hitSlop completa a área).

import type { ReactNode } from 'react';
import { Pressable, type StyleProp, type ViewStyle } from 'react-native';

import { sizes } from '../config/theme';

type Props = {
  onPress?: () => void;
  onLongPress?: () => void;
  delayLongPress?: number;
  disabled?: boolean;
  accessibilityLabel: string;
  accessibilityHint?: string;
  /** Tamanho visual do botão, para calcular quanto falta até 64 dp. */
  visualSize?: number;
  style?: StyleProp<ViewStyle>;
  pressedStyle?: StyleProp<ViewStyle>;
  children: ReactNode;
};

export function Touch({
  onPress,
  onLongPress,
  delayLongPress,
  disabled,
  accessibilityLabel,
  accessibilityHint,
  visualSize,
  style,
  pressedStyle,
  children,
}: Props) {
  const slop = visualSize ? Math.max(0, Math.ceil((sizes.minTouch - visualSize) / 2)) : 0;
  return (
    <Pressable
      onPress={onPress}
      onLongPress={onLongPress}
      delayLongPress={delayLongPress}
      disabled={disabled}
      hitSlop={slop}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      accessibilityHint={accessibilityHint}
      accessibilityState={{ disabled: !!disabled }}
      style={({ pressed }) => [
        style,
        disabled && { opacity: 0.35 },
        pressed && { opacity: 0.7, transform: [{ scale: 0.96 }] },
        pressed && pressedStyle,
      ]}
    >
      {children}
    </Pressable>
  );
}
