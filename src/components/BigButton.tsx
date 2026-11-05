// Botão grande, pensado pra acertar de relance com o carro andando:
// no mínimo 64 dp, área de toque inteira, sem texto miúdo.

import type { ReactNode } from 'react';
import { Pressable, type StyleProp, StyleSheet, type ViewStyle } from 'react-native';

import { colors, sizes } from '../config/theme';

type Props = {
  onPress?: () => void;
  onLongPress?: () => void;
  disabled?: boolean;
  /** Destaque (fundo na cor de destaque), ex.: play quando está tocando. */
  active?: boolean;
  accessibilityLabel: string;
  style?: StyleProp<ViewStyle>;
  children: ReactNode;
};

export function BigButton({
  onPress,
  onLongPress,
  disabled,
  active,
  accessibilityLabel,
  style,
  children,
}: Props) {
  return (
    <Pressable
      onPress={onPress}
      onLongPress={onLongPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      accessibilityState={{ disabled: !!disabled }}
      // Área de toque um pouco maior que o desenho do botão.
      hitSlop={4}
      style={({ pressed }) => [
        styles.base,
        active && styles.active,
        pressed && styles.pressed,
        disabled && styles.disabled,
        style,
      ]}
    >
      {children}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    minWidth: sizes.minTouch,
    minHeight: sizes.minTouch,
    borderRadius: sizes.radius,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  active: {
    borderColor: colors.accent,
  },
  pressed: {
    backgroundColor: colors.accent,
    borderColor: colors.accent,
  },
  disabled: {
    opacity: 0.35,
  },
});
