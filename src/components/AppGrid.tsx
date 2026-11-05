// Tela "Apps": grade de ícones grandes com o ícone real de cada app instalado,
// como a tela inicial do CarPlay.

import { Image } from 'expo-image';
import { StyleSheet, Text, View } from 'react-native';

import { colors, font, sizes } from '../config/theme';
import type { InstalledApp } from '../hooks/useInstalledApps';
import { Touch } from './Touch';

type Props = {
  apps: InstalledApp[];
  loading: boolean;
  onOpen: (pkg: string) => void;
  columns: number;
};

const ICON = 76;

export function AppGrid({ apps, loading, onOpen, columns }: Props) {
  if (!loading && apps.length === 0) {
    return (
      <View style={[styles.card, styles.empty]}>
        <Text style={font(17, '600', colors.text2)}>Nenhum app da lista está instalado</Text>
      </View>
    );
  }

  // Divide em linhas para centralizar a última, que pode ficar incompleta.
  const rows: InstalledApp[][] = [];
  for (let i = 0; i < apps.length; i += columns) rows.push(apps.slice(i, i + columns));

  return (
    <View style={styles.card}>
      {rows.map((row, r) => (
        <View key={r} style={styles.row}>
          {row.map((app) => (
            <Touch
              key={app.package}
              onPress={() => onOpen(app.package)}
              accessibilityLabel={`Abrir ${app.label}`}
              style={styles.item}
            >
              <Image source={app.icon} style={styles.icon} contentFit="contain" transition={0} />
              <Text style={font(14, '600')} numberOfLines={1} allowFontScaling={false}>
                {app.label}
              </Text>
            </Touch>
          ))}
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    borderRadius: sizes.cardRadius,
    backgroundColor: colors.card,
    paddingVertical: 18,
    justifyContent: 'space-evenly',
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
  icon: {
    width: ICON,
    height: ICON,
  },
});
