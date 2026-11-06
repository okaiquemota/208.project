// Relógio e data em português, sem depender de Intl.
// (O motor JavaScript do app pode vir sem os dados de idioma completos,
// então montamos os textos na mão com as listas abaixo.)

export const DIAS_SEMANA = [
  'domingo',
  'segunda-feira',
  'terça-feira',
  'quarta-feira',
  'quinta-feira',
  'sexta-feira',
  'sábado',
] as const;

export const DIAS_SEMANA_CURTOS = ['dom', 'seg', 'ter', 'qua', 'qui', 'sex', 'sáb'] as const;

export const MESES = [
  'janeiro',
  'fevereiro',
  'março',
  'abril',
  'maio',
  'junho',
  'julho',
  'agosto',
  'setembro',
  'outubro',
  'novembro',
  'dezembro',
] as const;

export const MESES_CURTOS = [
  'jan',
  'fev',
  'mar',
  'abr',
  'mai',
  'jun',
  'jul',
  'ago',
  'set',
  'out',
  'nov',
  'dez',
] as const;

/** Completa com zero à esquerda: 7 → "07". */
export const pad2 = (n: number) => (n < 10 ? `0${n}` : String(n));

/** "14:05" (24 horas, hora local do aparelho). */
export function formatClock(date: Date): string {
  return `${pad2(date.getHours())}:${pad2(date.getMinutes())}`;
}

/** "quinta-feira, 5 de novembro" */
export function formatDateLong(date: Date): string {
  return `${DIAS_SEMANA[date.getDay()]}, ${date.getDate()} de ${MESES[date.getMonth()]}`;
}

/** "quinta-feira" */
export function formatWeekday(date: Date): string {
  return DIAS_SEMANA[date.getDay()] as string;
}

/** "5 de novembro" */
export function formatDayMonth(date: Date): string {
  return `${date.getDate()} de ${MESES[date.getMonth()]}`;
}

/** "qui, 5 nov" */
export function formatDateShort(date: Date): string {
  return `${DIAS_SEMANA_CURTOS[date.getDay()]}, ${date.getDate()} ${MESES_CURTOS[date.getMonth()]}`;
}

/** Milissegundos até a próxima virada de minuto (para o relógio atualizar na hora certa). */
export function msUntilNextMinute(date: Date): number {
  return 60_000 - (date.getSeconds() * 1000 + date.getMilliseconds());
}

/** Iniciais dos dias da semana, começando no domingo. */
export const INICIAIS_SEMANA = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S'] as const;

/**
 * Grade do mês para o widget de calendário: semanas (domingo a sábado),
 * com null nos espaços antes do dia 1 e depois do último dia.
 */
export function monthGrid(date: Date): (number | null)[][] {
  const year = date.getFullYear();
  const month = date.getMonth();
  const firstWeekday = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells: (number | null)[] = [];
  for (let i = 0; i < firstWeekday; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);
  while (cells.length % 7 !== 0) cells.push(null);
  const weeks: (number | null)[][] = [];
  for (let i = 0; i < cells.length; i += 7) weeks.push(cells.slice(i, i + 7));
  return weeks;
}
