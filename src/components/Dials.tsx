// Mostradores desenhados em SVG, no espírito dos widgets do CarPlay/iPhone
// e dos painéis analógicos de carro: marcações finas, ponteiros, anéis.
// Nada de degradê ou brilho: preto, branco e uma cor de detalhe.

import type { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';
import Svg, { Circle, G, Line, Path, Text as SvgText } from 'react-native-svg';

import { colors, FONT } from '../config/theme';
import { describeArc, polarToCartesian } from '../lib/gauge';

// ---------- Mostrador com marcações (velocímetro) ----------

type TickDialProps = {
  size: number;
  /** Ângulo inicial e final ("de relógio": 0 = topo). */
  startDeg: number;
  endDeg: number;
  /** Quantas marcações. */
  count: number;
  /** Quantas estão acesas (a partir do início). */
  lit: number;
  /** A partir de qual marcação a cor é de alerta (Infinity = nunca). */
  alertFrom: number;
  litColor: string;
  alertColor?: string;
  /** Uma marcação maior a cada N. */
  majorEvery?: number;
  /** Números da escala nas marcações maiores (ex.: 0, 40, 80…). */
  labels?: string[];
  children?: ReactNode;
};

export function TickDial({
  size,
  startDeg,
  endDeg,
  count,
  lit,
  alertFrom,
  litColor,
  alertColor = colors.red,
  majorEvery = 0,
  labels,
  children,
}: TickDialProps) {
  if (size <= 0) return null;
  const c = size / 2;
  const outer = size / 2 - 2;
  const minorLen = size * 0.05;
  const majorLen = size * 0.085;
  const labelR = outer - majorLen - size * 0.075;
  const step = count > 1 ? (endDeg - startDeg) / (count - 1) : 0;

  return (
    <View style={{ width: size, height: size }}>
      <Svg width={size} height={size}>
        {Array.from({ length: count }, (_, i) => {
          const angle = startDeg + step * i;
          const major = majorEvery > 0 && i % majorEvery === 0;
          const p1 = polarToCartesian(c, c, outer, angle);
          const p2 = polarToCartesian(c, c, outer - (major ? majorLen : minorLen), angle);
          const on = i < lit;
          const stroke = on ? (i >= alertFrom ? alertColor : litColor) : i >= alertFrom ? 'rgba(255,69,58,0.35)' : 'rgba(255,255,255,0.18)';
          return (
            <Line
              key={i}
              x1={p1.x}
              y1={p1.y}
              x2={p2.x}
              y2={p2.y}
              stroke={stroke}
              strokeWidth={major ? Math.max(2.4, size * 0.012) : Math.max(1.6, size * 0.008)}
              strokeLinecap="round"
            />
          );
        })}
        {labels &&
          majorEvery > 0 &&
          labels.map((text, k) => {
            const angle = startDeg + step * k * majorEvery;
            const p = polarToCartesian(c, c, labelR, angle);
            const fs = Math.round(size * 0.05);
            return (
              <SvgText
                key={text + k}
                x={p.x}
                y={p.y + fs * 0.35}
                fontSize={fs}
                fontFamily={FONT}
                fontWeight="600"
                fill="rgba(235,235,245,0.45)"
                textAnchor="middle"
              >
                {text}
              </SvgText>
            );
          })}
      </Svg>
      <View pointerEvents="none" style={[StyleSheet.absoluteFill, styles.center]}>
        {children}
      </View>
    </View>
  );
}

// ---------- Relógio analógico ----------

export function AnalogClock({ size, date, accent }: { size: number; date: Date; accent: string }) {
  if (size <= 0) return null;
  const c = size / 2;
  const r = size / 2 - 1;
  const h = date.getHours() % 12;
  const m = date.getMinutes();
  const s = date.getSeconds();
  const hourDeg = (h + m / 60) * 30;
  const minDeg = (m + s / 60) * 6;
  const secDeg = s * 6;
  const hand = (deg: number, len: number, tail: number) => {
    const a = polarToCartesian(c, c, len, deg);
    const b = polarToCartesian(c, c, tail, deg + 180);
    return { x1: b.x, y1: b.y, x2: a.x, y2: a.y };
  };
  const fs = Math.round(size * 0.12);
  const numR = r * 0.66;

  return (
    <Svg width={size} height={size}>
      <Circle cx={c} cy={c} r={r} fill="#000" stroke="rgba(255,255,255,0.12)" strokeWidth={1} />
      {Array.from({ length: 60 }, (_, i) => {
        const big = i % 5 === 0;
        const p1 = polarToCartesian(c, c, r - size * 0.03, i * 6);
        const p2 = polarToCartesian(c, c, r - size * (big ? 0.1 : 0.055), i * 6);
        return (
          <Line
            key={i}
            x1={p1.x}
            y1={p1.y}
            x2={p2.x}
            y2={p2.y}
            stroke={big ? colors.text : 'rgba(255,255,255,0.35)'}
            strokeWidth={big ? 2 : 1}
            strokeLinecap="round"
          />
        );
      })}
      {['12', '3', '6', '9'].map((n, k) => {
        const p = polarToCartesian(c, c, numR, k * 90);
        return (
          <SvgText key={n} x={p.x} y={p.y + fs * 0.36} fontSize={fs} fontFamily={FONT} fontWeight="600" fill={colors.text} textAnchor="middle">
            {n}
          </SvgText>
        );
      })}
      <Line {...hand(hourDeg, r * 0.48, r * 0.08)} stroke={colors.text} strokeWidth={size * 0.045} strokeLinecap="round" />
      <Line {...hand(minDeg, r * 0.74, r * 0.08)} stroke={colors.text} strokeWidth={size * 0.03} strokeLinecap="round" />
      <Line {...hand(secDeg, r * 0.82, r * 0.16)} stroke={accent} strokeWidth={Math.max(1.4, size * 0.012)} strokeLinecap="round" />
      <Circle cx={c} cy={c} r={size * 0.03} fill={accent} />
      <Circle cx={c} cy={c} r={size * 0.012} fill="#000" />
    </Svg>
  );
}

// ---------- Bússola (o mostrador gira; o marcador fica em cima) ----------

const POINTS = ['N', 'L', 'S', 'O'];

export function CompassDial({ size, heading, accent }: { size: number; heading: number | null; accent: string }) {
  if (size <= 0) return null;
  const c = size / 2;
  const r = size / 2 - 2;
  const rot = -(heading ?? 0);
  const fs = Math.round(size * 0.13);
  return (
    <Svg width={size} height={size}>
      <G rotation={rot} origin={`${c}, ${c}`}>
        {Array.from({ length: 72 }, (_, i) => {
          const deg = i * 5;
          const big = deg % 30 === 0;
          const p1 = polarToCartesian(c, c, r, deg);
          const p2 = polarToCartesian(c, c, r - size * (big ? 0.09 : 0.045), deg);
          return (
            <Line
              key={i}
              x1={p1.x}
              y1={p1.y}
              x2={p2.x}
              y2={p2.y}
              stroke={big ? colors.text : 'rgba(255,255,255,0.3)'}
              strokeWidth={big ? 1.8 : 1}
              strokeLinecap="round"
            />
          );
        })}
        {POINTS.map((p, k) => {
          const pt = polarToCartesian(c, c, r - size * 0.21, k * 90);
          return (
            <SvgText
              key={p}
              x={pt.x}
              y={pt.y + fs * 0.36}
              fontSize={fs}
              fontFamily={FONT}
              fontWeight="700"
              fill={p === 'N' ? colors.red : colors.text}
              textAnchor="middle"
              rotation={-rot}
              origin={`${pt.x}, ${pt.y}`}
            >
              {p}
            </SvgText>
          );
        })}
      </G>
      {/* Marcador fixo: para onde o carro aponta */}
      <Path d={`M ${c} ${size * 0.02} l ${size * 0.045} ${size * 0.08} h ${-size * 0.09} z`} fill={accent} />
      {heading === null && <Circle cx={c} cy={c} r={size * 0.04} fill="rgba(255,255,255,0.3)" />}
    </Svg>
  );
}

// ---------- Anel (bateria) ----------

export function RingGauge({
  size,
  ratio,
  color,
  stroke = 8,
  children,
}: {
  size: number;
  ratio: number;
  color: string;
  stroke?: number;
  children?: ReactNode;
}) {
  if (size <= 0) return null;
  const c = size / 2;
  const r = size / 2 - stroke / 2;
  const v = Math.max(0, Math.min(1, ratio));
  return (
    <View style={{ width: size, height: size }}>
      <Svg width={size} height={size}>
        <Circle cx={c} cy={c} r={r} stroke="rgba(255,255,255,0.14)" strokeWidth={stroke} fill="none" />
        {v >= 0.999 ? (
          <Circle cx={c} cy={c} r={r} stroke={color} strokeWidth={stroke} fill="none" />
        ) : v > 0.005 ? (
          <Path d={describeArc(c, c, r, 0, v * 360)} stroke={color} strokeWidth={stroke} strokeLinecap="round" fill="none" />
        ) : null}
      </Svg>
      <View pointerEvents="none" style={[StyleSheet.absoluteFill, styles.center]}>
        {children}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  center: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});
