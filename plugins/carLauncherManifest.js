// Funções que mexem no AndroidManifest (no formato de objeto que o Expo usa).
// Ficam separadas do plugin para poder testar sem rodar o prebuild.
//
// Formato: cada tag XML vira um objeto, os atributos ficam em `$`
// e os filhos ficam em listas. Ex.: <package android:name="com.waze"/>
// vira { $: { 'android:name': 'com.waze' } }.

const PACKAGE_RE = /^[A-Za-z][\w]*(\.[A-Za-z_][\w]*)+$/;
const TIPOS = ['navegacao', 'musica', 'comunicacao', 'outro'];

const ACTION_MAIN = 'android.intent.action.MAIN';
const CATEGORY_HOME = 'android.intent.category.HOME';
const CATEGORY_DEFAULT = 'android.intent.category.DEFAULT';

/** Valida a lista de apps do app.json: tira inválidos e repetidos. */
function normalizeApps(apps) {
  if (!Array.isArray(apps)) return [];
  const seen = new Set();
  const out = [];
  for (const item of apps) {
    if (!item || typeof item !== 'object') continue;
    const pkg = item.package;
    if (typeof pkg !== 'string' || !PACKAGE_RE.test(pkg)) {
      throw new Error(`[withCarLauncher] pacote inválido na lista de apps: ${JSON.stringify(pkg)}`);
    }
    if (seen.has(pkg)) continue;
    seen.add(pkg);
    const label = typeof item.label === 'string' && item.label.trim() ? item.label.trim() : pkg;
    const tipo = TIPOS.includes(item.tipo) ? item.tipo : 'outro';
    out.push({ label, package: pkg, tipo });
  }
  return out;
}

/**
 * Android 11+: um app só "enxerga" outros apps que ele declara em <queries>.
 * Sem isso, getApplicationIconAsync e openApplication não acham o Waze etc.
 */
function addPackageQueries(androidManifest, packages) {
  const manifest = androidManifest.manifest;
  if (!Array.isArray(manifest.queries) || manifest.queries.length === 0) {
    manifest.queries = [{}];
  }
  const queries = manifest.queries[0];
  if (!Array.isArray(queries.package)) queries.package = [];
  const existing = new Set(queries.package.map((p) => p && p.$ && p.$['android:name']));
  for (const pkg of packages) {
    if (!existing.has(pkg)) {
      queries.package.push({ $: { 'android:name': pkg } });
      existing.add(pkg);
    }
  }
  return androidManifest;
}

function findMainActivity(androidManifest) {
  const app = androidManifest.manifest.application && androidManifest.manifest.application[0];
  const activities = (app && app.activity) || [];
  const main = activities.find((a) => a.$ && a.$['android:name'] === '.MainActivity');
  if (!main) throw new Error('[withCarLauncher] MainActivity não encontrada no AndroidManifest');
  return main;
}

const hasCategory = (filter, name) =>
  Array.isArray(filter.category) && filter.category.some((c) => c.$ && c.$['android:name'] === name);

/**
 * Liga/desliga o app como tela inicial (launcher).
 * Liga: adiciona MAIN + HOME + DEFAULT na MainActivity (o Android passa a oferecer
 * o Painel 208 como app de início). Desliga: remove esse intent-filter.
 * O filtro LAUNCHER normal continua, então o ícone segue na gaveta de apps.
 */
function setHomeLauncher(androidManifest, enabled) {
  const main = findMainActivity(androidManifest);
  const filters = Array.isArray(main['intent-filter']) ? main['intent-filter'] : [];
  const withoutHome = filters.filter((f) => !hasCategory(f, CATEGORY_HOME));
  if (enabled) {
    withoutHome.push({
      action: [{ $: { 'android:name': ACTION_MAIN } }],
      category: [{ $: { 'android:name': CATEGORY_HOME } }, { $: { 'android:name': CATEGORY_DEFAULT } }],
    });
  }
  main['intent-filter'] = withoutHome;
  return androidManifest;
}

/**
 * Paisagem pelos dois lados (sensorLandscape): funciona com o celular
 * deitado com a entrada USB tanto à esquerda quanto à direita.
 */
function setSensorLandscape(androidManifest, enabled) {
  if (!enabled) return androidManifest;
  const main = findMainActivity(androidManifest);
  main.$['android:screenOrientation'] = 'sensorLandscape';
  return androidManifest;
}

module.exports = {
  normalizeApps,
  addPackageQueries,
  setHomeLauncher,
  setSensorLandscape,
  CATEGORY_HOME,
};
