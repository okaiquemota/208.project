// Configurações do app (o que aparece na tela de início, cor, alerta…).
// O player de música não tem ajuste: é sempre automático (mostra o que toca).
//
// Ficam salvas no celular como JSON. Tudo aqui é puro: valores padrão,
// validação (um ajuste salvo errado nunca derruba o app) e as operações de
// mudar um ajuste.

/** Widgets que podem ocupar a coluna da direita da tela de início. */
export const SIDE_WIDGETS = [
  'velocidade',
  'viagem',
  'volume',
  'relogio',
  'calendario',
  'bateria',
  'clima',
  'bussola',
  'miniplayer',
  'atalhos',
  'curva',
  'mensagens',
] as const;
export type SideWidgetId = (typeof SIDE_WIDGETS)[number];

/** O que pode ocupar o card principal (o grande, à esquerda). */
export const MAIN_WIDGETS = ['player', 'mapa', 'velocidade'] as const;
export type MainWidgetId = (typeof MAIN_WIDGETS)[number];

/** Quantos widgets cabem na coluna da direita. */
export const SIDE_SLOTS = 3;

export const ACCENTS = {
  azul: { nome: 'Azul', main: '#0A84FF', soft: '#64D2FF' },
  ciano: { nome: 'Ciano', main: '#06B6D4', soft: '#67E8F9' },
  verde: { nome: 'Verde', main: '#30D158', soft: '#A7F3D0' },
  roxo: { nome: 'Roxo', main: '#BF5AF2', soft: '#E9B5FF' },
  laranja: { nome: 'Laranja', main: '#FF9F0A', soft: '#FFD60A' },
  rosa: { nome: 'Rosa', main: '#FF375F', soft: '#FF9FB3' },
} as const;
export type AccentId = keyof typeof ACCENTS;

/** Fundo da tela: papel de parede estilo CarPlay ou preto puro (AMOLED). */
export const BACKGROUNDS = ['papel', 'preto'] as const;
export type BackgroundId = (typeof BACKGROUNDS)[number];

/** Cores do mapa do Waze: escuro (noturno, como o CarPlay) ou claro (o original). */
export const MAP_THEMES = ['escuro', 'claro'] as const;
export type MapThemeId = (typeof MAP_THEMES)[number];

/** Opções do alerta de velocidade (km/h). 0 = desligado. */
export const SPEED_ALERT_OPTIONS = [0, 80, 100, 110, 120, 130, 140] as const;

export type Settings = {
  home: {
    main: MainWidgetId;
    /** Widgets da coluna da direita, de cima para baixo (null = vazio). */
    side: (SideWidgetId | null)[];
  };
  accent: AccentId;
  /** Fundo atrás dos cards. */
  background: BackgroundId;
  /** Acima disso o velocímetro fica laranja/vermelho. 0 = sem alerta. */
  speedAlertKmh: number;
  /** Cores do mapa do Waze. */
  mapTheme: MapThemeId;
};

export const DEFAULT_SETTINGS: Settings = {
  home: { main: 'player', side: ['velocidade', 'viagem', 'volume'] },
  accent: 'azul',
  background: 'papel',
  speedAlertKmh: 120,
  mapTheme: 'escuro',
};

/** Nome e descrição de cada widget (aparecem nos Ajustes). */
export const WIDGET_INFO: Record<SideWidgetId, { nome: string; descricao: string }> = {
  velocidade: { nome: 'Velocidade', descricao: 'Velocidade, bússola e sinal do GPS' },
  viagem: { nome: 'Viagem', descricao: 'Distância, tempo, média e máxima' },
  volume: { nome: 'Volume', descricao: 'Volume da música' },
  relogio: { nome: 'Relógio', descricao: 'Relógio de ponteiros e data' },
  calendario: { nome: 'Calendário', descricao: 'Dia de hoje e o mês' },
  bateria: { nome: 'Bateria', descricao: 'Carga e aviso de USB fraca' },
  clima: { nome: 'Clima', descricao: 'Temperatura onde você está' },
  bussola: { nome: 'Bússola', descricao: 'Direção e altitude' },
  miniplayer: { nome: 'Mini player', descricao: 'Música atual em tamanho pequeno' },
  atalhos: { nome: 'Atalhos', descricao: 'Quatro apps de acesso rápido' },
  curva: { nome: 'Próxima curva', descricao: 'Próxima manobra do Waze ou do Maps' },
  mensagens: { nome: 'WhatsApp', descricao: 'Última mensagem e resposta rápida' },
};

export const MAIN_INFO: Record<MainWidgetId, { nome: string }> = {
  player: { nome: 'Player de música' },
  mapa: { nome: 'Mapa ao vivo (Waze)' },
  velocidade: { nome: 'Velocidade grande' },
};

/** Widgets de altura fixa e baixa (os outros dividem o espaço que sobra). */
export const COMPACT_WIDGETS: readonly SideWidgetId[] = ['volume'];

const isOneOf = <T extends string>(list: readonly T[], v: unknown): v is T =>
  typeof v === 'string' && (list as readonly string[]).includes(v);

/** Lê o JSON salvo e devolve configurações válidas (o que estiver errado volta ao padrão). */
export function parseSettings(raw: string | null | undefined): Settings {
  let data: unknown = null;
  try {
    data = raw ? JSON.parse(raw) : null;
  } catch {
    data = null;
  }
  if (typeof data !== 'object' || data === null) return cloneDefaults();
  const d = data as Record<string, unknown>;
  const home = (typeof d.home === 'object' && d.home !== null ? d.home : {}) as Record<string, unknown>;

  const main = isOneOf(MAIN_WIDGETS, home.main) ? home.main : DEFAULT_SETTINGS.home.main;
  const side = normalizeSide(Array.isArray(home.side) ? home.side : DEFAULT_SETTINGS.home.side, main);

  const accent = isOneOf(Object.keys(ACCENTS) as AccentId[], d.accent) ? d.accent : DEFAULT_SETTINGS.accent;
  const background = isOneOf(BACKGROUNDS, d.background) ? d.background : DEFAULT_SETTINGS.background;
  const speed =
    typeof d.speedAlertKmh === 'number' && (SPEED_ALERT_OPTIONS as readonly number[]).includes(d.speedAlertKmh)
      ? d.speedAlertKmh
      : DEFAULT_SETTINGS.speedAlertKmh;

  const mapTheme = isOneOf(MAP_THEMES, d.mapTheme) ? d.mapTheme : DEFAULT_SETTINGS.mapTheme;

  return { home: { main, side }, accent, background, speedAlertKmh: speed, mapTheme };
}

const cloneDefaults = (): Settings => ({
  ...DEFAULT_SETTINGS,
  home: { ...DEFAULT_SETTINGS.home, side: [...DEFAULT_SETTINGS.home.side] },
});

/**
 * Deixa a coluna da direita sempre com SIDE_SLOTS posições, sem widgets
 * repetidos e sem o mini player quando o card principal já é o player.
 */
export function normalizeSide(list: readonly unknown[], main: MainWidgetId): (SideWidgetId | null)[] {
  const seen = new Set<SideWidgetId>();
  const out: (SideWidgetId | null)[] = [];
  for (let i = 0; i < SIDE_SLOTS; i++) {
    const v = list[i];
    if (isOneOf(SIDE_WIDGETS, v) && !seen.has(v) && !(v === 'miniplayer' && main === 'player')) {
      seen.add(v);
      out.push(v);
    } else {
      out.push(null);
    }
  }
  return out;
}

/** Widgets que podem ir numa posição (o mini player só quando o principal não é o player). */
export function sideOptions(main: MainWidgetId): SideWidgetId[] {
  return SIDE_WIDGETS.filter((w) => !(w === 'miniplayer' && main === 'player'));
}

/**
 * Coloca um widget numa posição da coluna. Se ele já estava em outra
 * posição, as duas trocam de lugar (assim nunca aparece repetido).
 */
export function setSideWidget(settings: Settings, index: number, widget: SideWidgetId | null): Settings {
  if (index < 0 || index >= SIDE_SLOTS) return settings;
  const side = [...settings.home.side];
  const previous = side[index] ?? null;
  if (widget !== null) {
    const other = side.indexOf(widget);
    if (other !== -1 && other !== index) side[other] = previous;
  }
  side[index] = widget;
  return { ...settings, home: { ...settings.home, side: normalizeSide(side, settings.home.main) } };
}

/** Troca o card principal (e tira o mini player da coluna se o principal virar o player). */
export function setMainWidget(settings: Settings, main: MainWidgetId): Settings {
  return { ...settings, home: { main, side: normalizeSide(settings.home.side, main) } };
}
