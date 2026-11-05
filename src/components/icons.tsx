// Ícones desenhados em SVG (sem pacote de fontes de ícones).
// Todos usam a mesma grade 24×24 e recebem tamanho e cor.

import Svg, { Path, Rect } from 'react-native-svg';

type IconProps = { size?: number; color: string };

const make = (d: string) =>
  function Icon({ size = 32, color }: IconProps) {
    return (
      <Svg width={size} height={size} viewBox="0 0 24 24">
        <Path d={d} fill={color} />
      </Svg>
    );
  };

export const PlayIcon = make('M8 5.1v13.8a1 1 0 0 0 1.5.86l10.9-6.9a1 1 0 0 0 0-1.72L9.5 4.24A1 1 0 0 0 8 5.1z');
export const PauseIcon = make('M6 5h4v14H6zM14 5h4v14h-4z');
export const NextIcon = make('M5 6.2v11.6a.8.8 0 0 0 1.24.66L14.5 12.7a.8.8 0 0 0 0-1.4L6.24 5.54A.8.8 0 0 0 5 6.2zM16 6h2.5v12H16z');
export const PreviousIcon = make('M19 6.2v11.6a.8.8 0 0 1-1.24.66L9.5 12.7a.8.8 0 0 1 0-1.4l8.26-5.76A.8.8 0 0 1 19 6.2zM5.5 6H8v12H5.5z');
export const MinusIcon = make('M5 10.75h14v2.5H5z');
export const PlusIcon = make('M10.75 5h2.5v5.75H19v2.5h-5.75V19h-2.5v-5.75H5v-2.5h5.75z');
export const BoltIcon = make('M13.5 2 4 14h6.5L9.5 22 20 9.5h-6.5z');

/** Bateria horizontal com o preenchimento proporcional ao nível (0 a 1). */
export function BatteryIcon({
  level,
  color,
  width = 30,
}: {
  level: number;
  color: string;
  width?: number;
}) {
  const height = width / 2;
  const fill = Math.max(0, Math.min(1, level));
  // Grade 30×15: corpo 26×13 + polo 2×5.
  return (
    <Svg width={width} height={height} viewBox="0 0 30 15">
      <Rect x={1} y={1} width={25} height={13} rx={2.5} stroke={color} strokeWidth={1.6} fill="none" />
      <Rect x={27} y={5} width={2} height={5} rx={1} fill={color} />
      {fill > 0 && <Rect x={3} y={3} width={21 * fill} height={9} rx={1.2} fill={color} />}
    </Svg>
  );
}
