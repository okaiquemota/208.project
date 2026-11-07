// Configurações do app (o que aparece na tela de início, cor, alerta…).
// O player de música não tem ajuste: é sempre automático (mostra o que toca).
//
// Ficam salvas no celular como JSON. Tudo aqui é puro: valores padrão,
// validação (um ajuste salvo errado nunca derruba o app) e as operações de
// mudar um ajuste.

/** Widgets que podem ocupar a coluna da direita da tela de início. */
export const SIDE_WIDGETS = [
  'miniplayer',
  'velocidade',
  'viagem',
  'curva',
  'mensagens',
  'volume',
  'brilho',
  'relogio',
  'calendario',
  'bateria',
  'clima',
  'bussola',
  'atalhos',
] as const;
export type SideWidgetId = (typeof SIDE_WIDGETS)[number];

/**
 * O que pode ocupar o card principal (o grande, à esquerda). "mapamusica"
 * ocupa a tela toda: metade mapa 3D, metade player (sem a coluna da direita).
 */
export const MAIN_WIDGETS = ['mapamusica', 'player', 'mapa', 'velocidade'] as const;
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

/** Cores do mapa 3D: escuro (noturno, como o CarPlay) ou claro (de dia). */
export const MAP_THEMES = ['escuro', 'claro'] as const;
export type MapThemeId = (typeof MAP_THEMES)[number];

/** Brilho do painel: 'auto' = o do celular; número = fração (0,1 a 1). */
export type Brightness = 'auto' | number;
export const BRIGHTNESS_OPTIONS: readonly Brightness[] = ['auto', 0.2, 0.4, 0.6, 0.8, 1];
export const BRIGHTNESS_MIN = 0.1;

/** Próximo degrau de brilho (botões − e + do widget), de 10 em 10%. */
export function stepBrightness(current: number, up: boolean): number {
  const next = Math.round((current + (up ? 0.1 : -0.1)) * 10) / 10;
  return Math.max(BRIGHTNESS_MIN, Math.min(1, next));
}

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
  /** Cores do mapa 3D. */
  mapTheme: MapThemeId;
  /** Brilho do painel enquanto ele está aberto. */
  brightness: Brightness;
};

export const DEFAULT_SETTINGS: Settings = {
  home: { main: 'player', side: ['velocidade', 'viagem', 'volume'] },
  accent: 'azul',
  background: 'papel',
  speedAlertKmh: 120,
  mapTheme: 'escuro',
  brightness: 'auto',
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
  miniplayer: { nome: 'Player de música', descricao: 'Música atual com tocar/pausar e próxima' },
  brilho: { nome: 'Brilho', descricao: 'Brilho da tela do painel' },
  atalhos: { nome: 'Atalhos', descricao: 'Quatro apps de acesso rápido' },
  curva: { nome: 'Próxima curva', descricao: 'Próxima manobra do Waze ou do Maps' },
  mensagens: { nome: 'WhatsApp', descricao: 'Última mensagem e resposta rápida' },
};

export const MAIN_INFO: Record<MainWidgetId, { nome: string }> = {
  mapamusica: { nome: 'Mapa + música (metade cada)' },
  player: { nome: 'Player de música' },
  mapa: { nome: 'Mapa 3D' },
  velocidade: { nome: 'Velocidade grande' },
};

/** Widgets de altura fixa e baixa (os outros dividem o espaço que sobra). */
export const COMPACT_WIDGETS: readonly SideWidgetId[] = ['volume', 'brilho'];

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
  const brightness: Brightness =
    typeof d.brightness === 'number' && d.brightness >= BRIGHTNESS_MIN && d.brightness <= 1
      ? Math.round(d.brightness * 10) / 10
      : 'auto';

  return { home: { main, side }, accent, background, speedAlertKmh: speed, mapTheme, brightness };
}

const cloneDefaults = (): Settings => ({
  ...DEFAULT_SETTINGS,
  home: { ...DEFAULT_SETTINGS.home, side: [...DEFAULT_SETTINGS.home.side] },
});

/** Deixa a coluna da direita sempre com SIDE_SLOTS posições e sem widgets repetidos. */
export function normalizeSide(list: readonly unknown[], main: MainWidgetId): (SideWidgetId | null)[] {
  const seen = new Set<SideWidgetId>();
  const out: (SideWidgetId | null)[] = [];
  for (let i = 0; i < SIDE_SLOTS; i++) {
    const v = list[i];
    if (isOneOf(SIDE_WIDGETS, v) && !seen.has(v)) {
      seen.add(v);
      out.push(v);
    } else {
      out.push(null);
    }
  }
  return out;
}

/** Widgets que podem ir numa posição (todos; o player pequeno também, mesmo com o player grande). */
export function sideOptions(main: MainWidgetId): SideWidgetId[] {
  void main;
  return [...SIDE_WIDGETS];
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

/** Troca o card principal. */
export function setMainWidget(settings: Settings, main: MainWidgetId): Settings {
  return { ...settings, home: { main, side: normalizeSide(settings.home.side, main) } };
}
