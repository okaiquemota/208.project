// Config plugin do Painel 208.
//
// Uso no app.json:
//   ["./plugins/withCarLauncher", {
//     "apps": [{ "label": "Waze", "package": "com.waze", "tipo": "navegacao" }, ...],
//     "asHomeLauncher": false,
//     "sensorLandscape": true
//   }]
//
// O que ele faz no `npx expo prebuild` (que gera a pasta android/):
// 1. Declara os pacotes da lista em <queries> no AndroidManifest (Android 11+),
//    e também uma consulta que enxerga todos os apps de música instalados.
// 2. Repassa a lista para `extra.carApps`, que o app lê com expo-constants.
//    Assim a lista de atalhos existe num lugar só.
// 3. asHomeLauncher: true → o app pode virar a tela inicial do celular.
// 4. sensorLandscape: true → paisagem pelos dois lados (USB à esquerda ou à direita).

const { withAndroidManifest } = require('expo/config-plugins');
const {
  normalizeApps,
  addPackageQueries,
  addIntentQuery,
  MEDIA_BROWSER_ACTION,
  setHomeLauncher,
  setSensorLandscape,
} = require('./carLauncherManifest');

/** @type {import('expo/config-plugins').ConfigPlugin<{apps?: {label?: string, package: string, tipo?: string}[], asHomeLauncher?: boolean, sensorLandscape?: boolean}>} */
const withCarLauncher = (config, props = {}) => {
  const apps = normalizeApps(props.apps);
  const asHomeLauncher = props.asHomeLauncher === true;
  const sensorLandscape = props.sensorLandscape === true;

  // Lista para o JavaScript (Constants.expoConfig.extra.carApps).
  config.extra = { ...(config.extra || {}), carApps: apps };

  return withAndroidManifest(config, (modConfig) => {
    let manifest = modConfig.modResults;
    manifest = addPackageQueries(
      manifest,
      apps.map((a) => a.package),
    );
    // Enxergar todos os apps de música instalados, mesmo os fora da lista.
    manifest = addIntentQuery(manifest, MEDIA_BROWSER_ACTION);
    manifest = setHomeLauncher(manifest, asHomeLauncher);
    manifest = setSensorLandscape(manifest, sensorLandscape);
    modConfig.modResults = manifest;
    return modConfig;
  });
};

module.exports = withCarLauncher;
