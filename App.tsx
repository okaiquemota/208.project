// Raiz do app: tela cheia (sem barra de status nem de navegação),
// tela sempre ligada e o painel.

import { NavigationBar } from 'expo-navigation-bar';
import { useKeepAwake } from 'expo-keep-awake';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { colors } from './src/config/theme';
import { DashboardScreen } from './src/screens/DashboardScreen';

export default function App() {
  // Mantém a tela acesa enquanto o painel estiver aberto.
  useKeepAwake();

  return (
    <SafeAreaProvider style={{ flex: 1, backgroundColor: colors.bg }}>
      <StatusBar hidden style="light" />
      <NavigationBar hidden />
      <DashboardScreen />
    </SafeAreaProvider>
  );
}
