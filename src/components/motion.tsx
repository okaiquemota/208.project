// Movimento do app: molas e entradas padronizadas (Reanimated). Tudo roda
// na thread de interface, então anima liso mesmo com o JavaScript ocupado.
//
// Regras: rápido (≤ 350 ms), com mola suave no lugar de "liga/desliga", e
// nada que pisque ou distraia dirigindo.

import { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  Easing,
  FadeIn,
  FadeInDown,
  FadeInRight,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withSpring,
  withTiming,
  type WithSpringConfig,
} from 'react-native-reanimated';

/** Botão afundando (rápido e firme). */
export const SPRING_PRESS_IN: WithSpringConfig = { damping: 20, stiffness: 520, mass: 0.6 };
/** Botão voltando (com um leve balanço). */
export const SPRING_PRESS_OUT: WithSpringConfig = { damping: 12, stiffness: 300, mass: 0.6 };
/** Mola geral (indicadores que deslizam, cards). */
export const SPRING_SOFT: WithSpringConfig = { damping: 18, stiffness: 220, mass: 0.8 };

/** Itens de lista/grade entrando em sequência (até 10 com atraso). */
export const enterItem = (index: number) => FadeInDown.duration(320).delay(Math.min(index, 10) * 35);

/** Texto que troca (música nova): entra deslizando da direita. */
export const enterText = FadeInRight.duration(280);
/** Tela nova (troca de página na barra lateral). */
export const enterPage = FadeIn.duration(240);

/** Escala que "pulsa" quando `value` muda (ex.: coração ao curtir). */
export function usePop(value: unknown) {
  const scale = useSharedValue(1);
  useEffect(() => {
    scale.value = withSequence(withTiming(1.28, { duration: 120 }), withSpring(1, SPRING_PRESS_OUT));
  }, [value, scale]);
  return useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));
}

/**
 * Barrinhas de equalizador ("está tocando"). Paradas quando pausado.
 * Usadas no item que está tocando nas listas e no player.
 */
export function PlayingBars({ color, playing, size = 14 }: { color: string; playing: boolean; size?: number }) {
  return (
    <View style={[styles.bars, { height: size, gap: Math.max(1, size / 7) }]}>
      {[0, 1, 2].map((i) => (
        <Bar key={i} index={i} color={color} playing={playing} size={size} />
      ))}
    </View>
  );
}

function Bar({ index, color, playing, size }: { index: number; color: string; playing: boolean; size: number }) {
  const h = useSharedValue(0.4);
  useEffect(() => {
    if (!playing) {
      h.value = withTiming(0.3, { duration: 200 });
      return;
    }
    const dur = [420, 340, 500][index] ?? 400;
    h.value = withDelay(
      index * 90,
      withRepeat(
        withSequence(
          withTiming(1, { duration: dur, easing: Easing.inOut(Easing.quad) }),
          withTiming(0.25, { duration: dur, easing: Easing.inOut(Easing.quad) }),
        ),
        -1,
        true,
      ),
    );
  }, [playing, index, h]);
  const style = useAnimatedStyle(() => ({ height: h.value * size }));
  return <Animated.View style={[{ width: Math.max(2, size / 5), backgroundColor: color, borderRadius: 1 }, style]} />;
}

const styles = StyleSheet.create({
  bars: {
    flexDirection: 'row',
    alignItems: 'flex-end',
  },
});
