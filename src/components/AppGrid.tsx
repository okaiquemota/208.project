// Grade de ícones grandes, como a tela inicial do CarPlay (direto sobre o papel de parede). Cada item é um app
// (ícone real) ou um atalho interno (ex.: Ajustes, com ícone desenhado).

import { Image } from 'expo-image';
import type { ReactNode } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import Animated from 'react-native-reanimated';

import { colors, font, sizes } from '../config/theme';
import { enterItem } from './motion';
import { Touch } from './Touch';

export type GridTile = {
  key: string;
  label: string;
  /** Ícone do app ("data:image/png;base64,…") ou um desenho pronto. */
  icon: string | ReactNode | null;
  onPress: () => void;
};

type Props = {
  tiles: GridTile[];
  columns: number;
  emptyText?: string;
};

const ICON = 72;

export function AppGrid({ tiles, columns, emptyText }: Props) {
  if (tiles.length === 0) {
    return (
      <View style={[styles.card, styles.empty]}>
        <Text allowFontScaling={false} style={font(17, '600', colors.text2)}>{emptyText ?? 'Nada para mostrar'}</Text>
      </View>
    );
  }

  // Divide em linhas para centralizar a última, que pode ficar incompleta.
  const rows: GridTile[][] = [];
  for (let i = 0; i < tiles.length; i += columns) rows.push(tiles.slice(i, i + columns));

  return (
    <View style={styles.card}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {rows.map((row, r) => (
          <View key={r} style={styles.row}>
            {row.map((tile, c) => (
              <Animated.View key={tile.key} entering={enterItem(r * columns + c)}>
                <Touch onPress={tile.onPress} accessibilityLabel={`Abrir ${tile.label}`} style={styles.item}>
                  <View style={styles.iconBox}>
                    {typeof tile.icon === 'string' ? (
                      <Image source={tile.icon} style={styles.icon} contentFit="contain" transition={0} />
                    ) : (
                      tile.icon
                    )}
                  </View>
                  <Text style={font(14, '600')} numberOfLines={1} allowFontScaling={false}>
                    {tile.label}
                  </Text>
                </Touch>
              </Animated.View>
            ))}
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  // Como no CarPlay: os ícones ficam direto sobre o papel de parede, sem card.
  card: {
    flex: 1,
    borderRadius: sizes.cardRadius,
    overflow: 'hidden',
  },
  scroll: {
    flexGrow: 1,
    justifyContent: 'space-evenly',
    paddingVertical: 18,
    gap: 12,
  },
  empty: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'center',
  },
  item: {
    width: 128,
    alignItems: 'center',
    gap: 10,
    paddingVertical: 6,
    borderRadius: sizes.buttonRadius,
  },
  iconBox: {
    width: ICON,
    height: ICON,
    alignItems: 'center',
    justifyContent: 'center',
  },
  icon: {
    width: ICON,
    height: ICON,
  },
});
