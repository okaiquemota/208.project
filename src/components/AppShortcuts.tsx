// Grade de atalhos com o ícone real de cada app instalado.

import { Image } from 'expo-image';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { colors, sizes } from '../config/theme';
import type { InstalledApp } from '../hooks/useInstalledApps';

type Props = {
  apps: InstalledApp[];
  loading: boolean;
  onOpen: (pkg: string) => void;
};

const ICON = 44;

export function AppShortcuts({ apps, loading, onOpen }: Props) {
  if (!loading && apps.length === 0) {
    return (
      <View style={[styles.row, styles.empty]}>
        <Text style={styles.emptyText}>Nenhum app da lista está instalado</Text>
      </View>
    );
  }

  return (
    <View style={styles.row}>
      {apps.map((app) => (
        <Pressable
          key={app.package}
          onPress={() => onOpen(app.package)}
          accessibilityRole="button"
          accessibilityLabel={`Abrir ${app.label}`}
          style={({ pressed }) => [styles.item, pressed && styles.pressed]}
        >
          <Image source={app.icon} style={styles.icon} contentFit="contain" transition={0} />
          <Text
            style={styles.label}
            numberOfLines={1}
            adjustsFontSizeToFit
            minimumFontScale={0.8}
            allowFontScaling={false}
          >
            {app.label}
          </Text>
        </Pressable>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    gap: sizes.gap,
    minHeight: 84,
  },
  item: {
    flex: 1,
    maxWidth: 110,
    minWidth: sizes.minTouch,
    minHeight: 84,
    borderRadius: sizes.radius,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingHorizontal: 2,
  },
  pressed: {
    borderColor: colors.accent,
    backgroundColor: colors.border,
  },
  icon: {
    width: ICON,
    height: ICON,
  },
  label: {
    color: colors.textDim,
    fontSize: 11.5,
    fontWeight: '600',
  },
  empty: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    color: colors.textFaint,
    fontSize: 14,
  },
});
