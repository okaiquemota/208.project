// Área de toque com resposta visual: ao tocar, o botão afunda um pouco e
// volta com mola (Reanimated, roda na thread de interface, sem travar).
// Toque mínimo de 64 dp, mesmo quando o desenho do botão é menor (hitSlop
// completa a área).

import type { ReactNode } from 'react';
import { Pressable, type StyleProp, type ViewStyle } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';

import { sizes } from '../config/theme';
import { SPRING_PRESS_IN, SPRING_PRESS_OUT } from './motion';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

type Props = {
  onPress?: () => void;
  onLongPress?: () => void;
  delayLongPress?: number;
  disabled?: boolean;
  accessibilityLabel: string;
  accessibilityHint?: string;
  /** Tamanho visual do botão, para calcular quanto falta até 64 dp. */
  visualSize?: number;
  /** Quanto o botão encolhe ao tocar (0.94 = 6%). Cards grandes encolhem menos. */
  pressScale?: number;
  style?: StyleProp<ViewStyle>;
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
  pressScale = 0.94,
  style,
  children,
}: Props) {
  const slop = visualSize ? Math.max(0, Math.ceil((sizes.minTouch - visualSize) / 2)) : 0;
  const pressed = useSharedValue(0);
  const dim = disabled ? 0.35 : 1;
  const anim = useAnimatedStyle(() => ({
    transform: [{ scale: 1 - pressed.value * (1 - pressScale) }],
    opacity: dim * (1 - pressed.value * 0.2),
  }));

  return (
    <AnimatedPressable
      onPress={onPress}
      onLongPress={onLongPress}
      delayLongPress={delayLongPress}
      onPressIn={() => {
        pressed.value = withSpring(1, SPRING_PRESS_IN);
      }}
      onPressOut={() => {
        pressed.value = withSpring(0, SPRING_PRESS_OUT);
      }}
      disabled={disabled}
      hitSlop={slop}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      accessibilityHint={accessibilityHint}
      accessibilityState={{ disabled: !!disabled }}
      style={[style, anim]}
    >
      {children}
    </AnimatedPressable>
  );
}
