// Acumulador da viagem: distância, tempo em movimento, média e máxima.
//
// O GPS do celular "treme": parado no semáforo ele pode dizer que você andou
// alguns metros, dentro de garagem ele pula, em túnel ele some. Por isso cada
// leitura passa pelas regras abaixo antes de entrar na conta.
//
// Ideia central: guardamos uma "âncora", que é o último ponto confiável.
// A distância é sempre medida da âncora até o ponto novo. Leituras ruins
// não movem a âncora, então o ruído delas nunca entra na soma.

import { bearingDegrees, distanceMeters, msToKmh, normalizeDegrees } from './geo';

/** Uma leitura do GPS, já no formato que interessa pra viagem. */
export type GpsFix = {
  latitude: number;
  longitude: number;
  /** Raio de incerteza em metros (quanto menor, melhor). */
  accuracy: number | null;
  /** Velocidade informada pelo GPS em m/s (pode vir null ou negativa). */
  speed: number | null;
  /** Direção do movimento em graus (0 = norte). */
  heading: number | null;
  /** Horário da leitura em milissegundos. */
  timestamp: number;
};

/** Regras contra ruído. Ficam num objeto só para os testes e ajustes. */
export type TripRules = {
  /** Abaixo disso conta como parado (não soma distância nem tempo). */
  stoppedBelowKmh: number;
  /** Precisão pior que isso (em metros) não soma distância. */
  maxAccuracyM: number;
  /** Intervalo maior que isso entre leituras não liga os pontos (túnel, garagem). */
  maxGapMs: number;
  /** Saltos acima dessa velocidade são descartados. */
  maxJumpKmh: number;
  /** Deslocamento mínimo (m) para calcular a direção pelos pontos. */
  minBearingDistanceM: number;
};

export const DEFAULT_RULES: TripRules = {
  stoppedBelowKmh: 3,
  maxAccuracyM: 35,
  maxGapMs: 10_000,
  maxJumpKmh: 250,
  minBearingDistanceM: 5,
};

export type TripState = {
  /** Distância percorrida em metros. */
  distanceM: number;
  /** Tempo em movimento em milissegundos. */
  movingMs: number;
  /** Velocidade máxima em km/h. */
  maxKmh: number;
  /** Velocidade atual em km/h (0 quando parado). */
  speedKmh: number;
  /** Direção atual em graus, ou null se ainda não sabemos. */
  headingDeg: number | null;
  /** Último ponto confiável: base para medir a distância. */
  anchor: GpsFix | null;
  /** Horário da última leitura aceita (boa ou não), para medir o tempo. */
  lastTimestamp: number | null;
};

export function createTrip(): TripState {
  return {
    distanceM: 0,
    movingMs: 0,
    maxKmh: 0,
    speedKmh: 0,
    headingDeg: null,
    anchor: null,
    lastTimestamp: null,
  };
}

/**
 * Zera os contadores (distância, tempo, máxima), mas mantém a âncora,
 * a velocidade e a direção atuais: a contagem recomeça dali mesmo.
 */
export function resetTrip(state: TripState): TripState {
  return { ...state, distanceM: 0, movingMs: 0, maxKmh: 0 };
}

/** Velocidade média em km/h, considerando só o tempo em movimento. */
export function averageKmh(state: TripState): number {
  if (state.movingMs <= 0) return 0;
  return msToKmh(state.distanceM / (state.movingMs / 1000));
}

const isFiniteNumber = (n: number | null | undefined): n is number =>
  typeof n === 'number' && Number.isFinite(n);

/** A velocidade do GPS só vale se existir e não for negativa. */
const validSpeedMs = (fix: GpsFix): number | null =>
  isFiniteNumber(fix.speed) && fix.speed >= 0 ? fix.speed : null;

/** Precisão desconhecida (null) é tratada como ruim, por segurança. */
export const isAccurate = (fix: GpsFix, rules: TripRules = DEFAULT_RULES) =>
  isFiniteNumber(fix.accuracy) && fix.accuracy <= rules.maxAccuracyM;

/**
 * Processa uma leitura nova do GPS e devolve o estado atualizado.
 * Não altera o estado recebido (função pura).
 */
export function addFix(state: TripState, fix: GpsFix, rules: TripRules = DEFAULT_RULES): TripState {
  // Leitura repetida ou fora de ordem: ignora.
  if (state.lastTimestamp !== null && fix.timestamp <= state.lastTimestamp) {
    return state;
  }

  const accurate = isAccurate(fix, rules);
  const reportedMs = validSpeedMs(fix);
  const anchor = state.anchor;

  // Intervalo desde a última leitura (para o tempo) e desde a âncora (para a distância).
  const sinceLastMs = state.lastTimestamp === null ? null : fix.timestamp - state.lastTimestamp;
  const sinceAnchorMs = anchor === null ? null : fix.timestamp - anchor.timestamp;
  const anchorConnected = sinceAnchorMs !== null && sinceAnchorMs <= rules.maxGapMs;

  // Distância e velocidade calculadas a partir da âncora (só se o ponto for bom).
  const segmentM = anchor !== null && accurate && anchorConnected ? distanceMeters(anchor, fix) : null;
  const derivedKmh =
    segmentM !== null && sinceAnchorMs !== null && sinceAnchorMs > 0
      ? msToKmh(segmentM / (sinceAnchorMs / 1000))
      : null;

  // Regra do salto: se o GPS (ou o cálculo) diz que passamos de 250 km/h, é erro.
  const reportedKmh = reportedMs === null ? null : msToKmh(reportedMs);
  if (
    (reportedKmh !== null && reportedKmh > rules.maxJumpKmh) ||
    (derivedKmh !== null && derivedKmh > rules.maxJumpKmh)
  ) {
    return state;
  }

  // Velocidade atual: a do GPS quando existe; senão, distância / tempo.
  // Sem nenhuma das duas (ponto impreciso e sem velocidade), mantém a anterior.
  let speedKmh: number;
  if (reportedKmh !== null) speedKmh = reportedKmh;
  else if (derivedKmh !== null) speedKmh = derivedKmh;
  else if (anchor === null || !anchorConnected) speedKmh = 0;
  else speedKmh = state.speedKmh;

  const moving = speedKmh >= rules.stoppedBelowKmh;

  // Tempo em movimento: só conta intervalos curtos (sem buraco de sinal) e em movimento.
  const gapOk = sinceLastMs !== null && sinceLastMs <= rules.maxGapMs;
  const movingMs = state.movingMs + (moving && gapOk && sinceLastMs !== null ? sinceLastMs : 0);

  // Distância: só soma com ponto bom, ligado à âncora e em movimento.
  const distanceM = state.distanceM + (moving && segmentM !== null ? segmentM : 0);

  // Direção: parado, mantém a última (parado o GPS aponta pra qualquer lado).
  let headingDeg = state.headingDeg;
  if (moving) {
    const h = fix.heading;
    if (isFiniteNumber(h) && h > 0 && h < 360) {
      headingDeg = normalizeDegrees(h);
    } else if (anchor !== null && segmentM !== null && segmentM >= rules.minBearingDistanceM) {
      headingDeg = bearingDegrees(anchor, fix);
    } else if (h === 0) {
      headingDeg = 0;
    }
  }

  // Âncora: só pontos bons viram âncora. Se a âncora antiga ficou velha demais
  // (túnel), o ponto novo começa um trecho novo, sem ligar os dois.
  const nextAnchor = accurate ? fix : anchorConnected ? anchor : null;

  // Máxima: só com velocidade confiável (do GPS ou de pontos bons).
  const maxKmh = reportedKmh !== null || derivedKmh !== null ? Math.max(state.maxKmh, speedKmh) : state.maxKmh;

  return {
    distanceM,
    movingMs,
    maxKmh,
    speedKmh: moving ? speedKmh : 0,
    headingDeg,
    anchor: nextAnchor,
    lastTimestamp: fix.timestamp,
  };
}
