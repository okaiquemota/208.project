// Velocímetro em arco: 0 a 200 km/h, número grande no meio, direção embaixo.
// Acima de 120 km/h o arco e o número mudam para a cor de alerta.

import { StyleSheet, Text, View } from 'react-native';
import Svg, { G, Line, Path, Text as SvgText } from 'react-native-svg';

import { colors, SPEED_ALERT_KMH, SPEED_MAX_KMH, tabular } from '../config/theme';
import { formatKmh } from '../lib/format';
import {
  describeArc,
  GAUGE_END_DEG,
  GAUGE_START_DEG,
  gaugeTicks,
  polarToCartesian,
  speedToAngle,
} from '../lib/gauge';

type Props = {
  /** Velocidade em km/h, ou null quando não há leitura (mostra "--"). */
  speedKmh: number | null;
  /** Texto embaixo do número: a direção (N, NE…) ou um aviso curto. */
  caption: string | null;
  /** Lado do quadrado disponível, em dp. */
  size: number;
  /** Deixa tudo apagado (sem sinal). */
  dimmed?: boolean;
};

const TICK_STEP = 20;
const LABEL_STEP = 40;

export function Speedometer({ speedKmh, caption, size, dimmed }: Props) {
  if (size <= 0) return null;

  const stroke = Math.max(8, size * 0.055);
  const cx = size / 2;
  const cy = size / 2;
  const r = size / 2 - stroke / 2 - 4;

  const value = speedKmh ?? 0;
  const alert = speedKmh !== null && value > SPEED_ALERT_KMH;
  const arcColor = dimmed ? colors.textFaint : alert ? colors.alert : colors.accent;
  const valueAngle = speedToAngle(value, SPEED_MAX_KMH);
  const alertStart = speedToAngle(SPEED_ALERT_KMH, SPEED_MAX_KMH);

  const tickOuter = r - stroke * 0.9;
  const labelRadius = tickOuter - size * 0.075;
  const labelSize = Math.round(size * 0.045);

  const numberSize = Math.round(size * 0.27);
  // Direção (1–2 letras) em letra grande; avisos ("Procurando GPS…") menores.
  const isDirection = caption !== null && caption.length <= 2;
  const captionSize = Math.round(size * (isDirection ? 0.085 : 0.048));

  return (
    <View style={{ width: size, height: size }}>
      <Svg width={size} height={size}>
        {/* Trilho do arco inteiro */}
        <Path
          d={describeArc(cx, cy, r, GAUGE_START_DEG, GAUGE_END_DEG)}
          stroke={colors.track}
          strokeWidth={stroke}
          strokeLinecap="round"
          fill="none"
        />
        {/* Faixa de alerta (120–200) em linha fina por fora */}
        <Path
          d={describeArc(cx, cy, r + stroke / 2 + 3, alertStart, GAUGE_END_DEG)}
          stroke={colors.alert}
          strokeOpacity={0.45}
          strokeWidth={2}
          fill="none"
        />
        {/* Arco da velocidade atual */}
        {value > 0.5 && (
          <Path
            d={describeArc(cx, cy, r, GAUGE_START_DEG, valueAngle)}
            stroke={arcColor}
            strokeWidth={stroke}
            strokeLinecap="round"
            fill="none"
          />
        )}
        {/* Marcações e números da escala */}
        <G>
          {gaugeTicks(SPEED_MAX_KMH, TICK_STEP).map((v) => {
            const angle = speedToAngle(v, SPEED_MAX_KMH);
            const major = v % LABEL_STEP === 0;
            const p1 = polarToCartesian(cx, cy, tickOuter, angle);
            const p2 = polarToCartesian(cx, cy, tickOuter - (major ? size * 0.035 : size * 0.02), angle);
            const lp = polarToCartesian(cx, cy, labelRadius, angle);
            const tickColor = v > SPEED_ALERT_KMH ? colors.alert : colors.textDim;
            return (
              <G key={v}>
                <Line
                  x1={p1.x}
                  y1={p1.y}
                  x2={p2.x}
                  y2={p2.y}
                  stroke={tickColor}
                  strokeOpacity={major ? 0.9 : 0.5}
                  strokeWidth={major ? 2 : 1.5}
                />
                {major && (
                  <SvgText
                    x={lp.x}
                    y={lp.y + labelSize * 0.35}
                    fontSize={labelSize}
                    fill={colors.textDim}
                    textAnchor="middle"
                  >
                    {String(v)}
                  </SvgText>
                )}
              </G>
            );
          })}
        </G>
      </Svg>

      {/* Número e legenda por cima do SVG (Text do RN: suporta tabular-nums) */}
      <View pointerEvents="none" style={[StyleSheet.absoluteFill, styles.center]}>
        <Text
          style={[
            styles.number,
            tabular,
            {
              fontSize: numberSize,
              lineHeight: numberSize * 1.05,
              color: dimmed ? colors.textFaint : alert ? colors.alert : colors.text,
              marginTop: -numberSize * 0.15,
            },
          ]}
          allowFontScaling={false}
        >
          {speedKmh === null ? '--' : formatKmh(value)}
        </Text>
        <Text style={[styles.unit, { fontSize: Math.round(size * 0.05) }]} allowFontScaling={false}>
          km/h
        </Text>
      </View>
      {caption !== null && (
        <View pointerEvents="none" style={[styles.caption, { top: cy + r * 0.5 }]}>
          <Text
            style={[
              styles.captionText,
              {
                fontSize: captionSize,
                lineHeight: captionSize * 1.2,
                letterSpacing: isDirection ? 2 : 0,
                color: isDirection ? colors.text : colors.textDim,
              },
            ]}
            allowFontScaling={false}
            numberOfLines={1}
          >
            {caption}
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  center: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  number: {
    fontWeight: '700',
    includeFontPadding: false,
    textAlign: 'center',
  },
  unit: {
    color: colors.textDim,
    fontWeight: '500',
    letterSpacing: 1,
  },
  caption: {
    position: 'absolute',
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  captionText: {
    fontWeight: '700',
  },
});
