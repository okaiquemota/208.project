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

/** "qui, 5 nov" */
export function formatDateShort(date: Date): string {
  return `${DIAS_SEMANA_CURTOS[date.getDay()]}, ${date.getDate()} ${MESES_CURTOS[date.getMonth()]}`;
}

/** Milissegundos até a próxima virada de minuto (para o relógio atualizar na hora certa). */
export function msUntilNextMinute(date: Date): number {
  return 60_000 - (date.getSeconds() * 1000 + date.getMilliseconds());
}
