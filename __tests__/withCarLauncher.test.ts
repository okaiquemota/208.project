// Testa as funções do config plugin que mexem no AndroidManifest.
// O manifest de exemplo imita o que o `expo prebuild` gera.

/* eslint-disable @typescript-eslint/no-require-imports */
const {
  normalizeApps,
  addPackageQueries,
  setHomeLauncher,
  setSensorLandscape,
  CATEGORY_HOME,
} = require('../plugins/carLauncherManifest');

type Node = { $?: Record<string, string>; [k: string]: unknown };

function sampleManifest() {
  return {
    manifest: {
      $: { 'xmlns:android': 'http://schemas.android.com/apk/res/android' },
      queries: [
        {
          intent: [
            {
              action: [{ $: { 'android:name': 'android.intent.action.VIEW' } }],
              data: [{ $: { 'android:scheme': 'https' } }],
            },
          ],
        },
      ],
      application: [
        {
          $: { 'android:name': '.MainApplication' },
          activity: [
            {
              $: { 'android:name': '.MainActivity', 'android:screenOrientation': 'landscape' },
              'intent-filter': [
                {
                  action: [{ $: { 'android:name': 'android.intent.action.MAIN' } }],
                  category: [{ $: { 'android:name': 'android.intent.category.LAUNCHER' } }],
                },
              ],
            },
          ],
        },
      ],
    },
  };
}

const mainActivity = (m: ReturnType<typeof sampleManifest>) =>
  m.manifest.application[0]!.activity[0]! as unknown as {
    $: Record<string, string>;
    'intent-filter': { category?: Node[] }[];
  };

const homeFilters = (m: ReturnType<typeof sampleManifest>) =>
  mainActivity(m)['intent-filter'].filter((f) =>
    (f.category ?? []).some((c) => c.$?.['android:name'] === CATEGORY_HOME),
  );

describe('withCarLauncher: lista de apps', () => {
  it('remove repetidos e usa o pacote como nome se faltar', () => {
    expect(
      normalizeApps([
        { label: 'Waze', package: 'com.waze' },
        { package: 'com.waze' },
        { package: 'com.whatsapp' },
      ]),
    ).toEqual([
      { label: 'Waze', package: 'com.waze', tipo: 'outro' },
      { label: 'com.whatsapp', package: 'com.whatsapp', tipo: 'outro' },
    ]);
  });

  it('mantém o tipo válido e troca tipo desconhecido por "outro"', () => {
    expect(
      normalizeApps([
        { label: 'Waze', package: 'com.waze', tipo: 'navegacao' },
        { label: 'X', package: 'com.x.y', tipo: 'jogo' },
      ]),
    ).toEqual([
      { label: 'Waze', package: 'com.waze', tipo: 'navegacao' },
      { label: 'X', package: 'com.x.y', tipo: 'outro' },
    ]);
  });

  it('pacote inválido derruba o prebuild com mensagem clara', () => {
    expect(() => normalizeApps([{ label: 'X', package: 'waze' }])).toThrow(/pacote inválido/);
  });

  it('sem lista não quebra', () => {
    expect(normalizeApps(undefined)).toEqual([]);
  });
});

describe('withCarLauncher: <queries>', () => {
  it('adiciona os pacotes no <queries> existente sem apagar o que já tinha', () => {
    const m = sampleManifest();
    addPackageQueries(m, ['com.waze', 'com.spotify.music']);
    const q = m.manifest.queries[0] as unknown as { intent: unknown[]; package: Node[] };
    expect(q.intent).toHaveLength(1);
    expect(q.package.map((p) => p.$?.['android:name'])).toEqual(['com.waze', 'com.spotify.music']);
  });

  it('rodar duas vezes não duplica (prebuild repetido)', () => {
    const m = sampleManifest();
    addPackageQueries(m, ['com.waze']);
    addPackageQueries(m, ['com.waze', 'com.whatsapp']);
    const q = m.manifest.queries[0] as unknown as { package: Node[] };
    expect(q.package.map((p) => p.$?.['android:name'])).toEqual(['com.waze', 'com.whatsapp']);
  });

  it('cria o <queries> se ele não existir', () => {
    const m = sampleManifest() as { manifest: Record<string, unknown> };
    delete m.manifest.queries;
    addPackageQueries(m, ['com.waze']);
    expect(m.manifest.queries).toEqual([{ package: [{ $: { 'android:name': 'com.waze' } }] }]);
  });
});

describe('withCarLauncher: tela inicial (asHomeLauncher)', () => {
  it('desligado (padrão): não adiciona HOME', () => {
    const m = sampleManifest();
    setHomeLauncher(m, false);
    expect(homeFilters(m)).toHaveLength(0);
    expect(mainActivity(m)['intent-filter']).toHaveLength(1);
  });

  it('ligado: adiciona MAIN + HOME + DEFAULT e mantém o LAUNCHER', () => {
    const m = sampleManifest();
    setHomeLauncher(m, true);
    const filters = homeFilters(m);
    expect(filters).toHaveLength(1);
    expect(filters[0]!.category!.map((c) => c.$?.['android:name'])).toEqual([
      'android.intent.category.HOME',
      'android.intent.category.DEFAULT',
    ]);
    expect(mainActivity(m)['intent-filter']).toHaveLength(2);
  });

  it('ligar duas vezes não duplica, e desligar depois remove', () => {
    const m = sampleManifest();
    setHomeLauncher(m, true);
    setHomeLauncher(m, true);
    expect(homeFilters(m)).toHaveLength(1);
    setHomeLauncher(m, false);
    expect(homeFilters(m)).toHaveLength(0);
  });
});

describe('withCarLauncher: orientação', () => {
  it('sensorLandscape troca a orientação da MainActivity', () => {
    const m = sampleManifest();
    setSensorLandscape(m, true);
    expect(mainActivity(m).$['android:screenOrientation']).toBe('sensorLandscape');
  });

  it('desligado mantém a do app.json', () => {
    const m = sampleManifest();
    setSensorLandscape(m, false);
    expect(mainActivity(m).$['android:screenOrientation']).toBe('landscape');
  });
});
