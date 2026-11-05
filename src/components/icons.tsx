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

export const PlayIcon = make('M7.5 4.9v14.2a1 1 0 0 0 1.53.85l11.2-7.1a1 1 0 0 0 0-1.7L9.03 4.05A1 1 0 0 0 7.5 4.9z');
export const PauseIcon = make('M6 4.5h4.2v15H6zM13.8 4.5H18v15h-4.2z');
export const NextIcon = make('M4.5 5.8v12.4a.9.9 0 0 0 1.4.75l8.7-6.2a.9.9 0 0 0 0-1.5L5.9 5.05a.9.9 0 0 0-1.4.75zM16.5 5h3v14h-3z');
export const PreviousIcon = make('M19.5 5.8v12.4a.9.9 0 0 1-1.4.75l-8.7-6.2a.9.9 0 0 1 0-1.5l8.7-6.2a.9.9 0 0 1 1.4.75zM4.5 5h3v14h-3z');
export const MinusIcon = make('M5 10.75h14v2.5H5z');
export const PlusIcon = make('M10.75 5h2.5v5.75H19v2.5h-5.75V19h-2.5v-5.75H5v-2.5h5.75z');
export const BoltIcon = make('M13.5 2 4 14h6.5L9.5 22 20 9.5h-6.5z');
/** Grade de apps (como o botão do CarPlay/Android Auto). */
export const GridIcon = make(
  'M4 4h4v4H4zM10 4h4v4h-4zM16 4h4v4h-4zM4 10h4v4H4zM10 10h4v4h-4zM16 10h4v4h-4zM4 16h4v4H4zM10 16h4v4h-4zM16 16h4v4h-4z',
);
/** Painel (cards lado a lado). */
export const DashboardIcon = make('M3 4h11v16H3zM16 4h5v7h-5zM16 13h5v7h-5z');
/** Nota musical (quando não há capa). */
export const MusicIcon = make(
  'M20 3v12.5a3.5 3.5 0 1 1-2-3.16V7.4l-8 1.6v8.5a3.5 3.5 0 1 1-2-3.16V5.4z',
);
export const VolumeDownIcon = make('M5 9.5v5h3.5L13 19V5L8.5 9.5zM15.5 9a4 4 0 0 1 0 6l-1-1.2a2.4 2.4 0 0 0 0-3.6z');
export const VolumeUpIcon = make(
  'M3 9.5v5h3.5L11 19V5L6.5 9.5zM13.5 9a4 4 0 0 1 0 6l-1-1.2a2.4 2.4 0 0 0 0-3.6zM15.8 6.2a7.4 7.4 0 0 1 0 11.6l-1-1.2a5.8 5.8 0 0 0 0-9.2z',
);

/** Seta de navegação apontando para cima; gire com `rotation` (graus). */
export function NavArrowIcon({ size = 20, color, rotation = 0 }: IconProps & { rotation?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" style={{ transform: [{ rotate: `${rotation}deg` }] }}>
      <Path d="M12 2.5 20 21l-8-4.2L4 21z" fill={color} />
    </Svg>
  );
}

/** Bateria horizontal com o preenchimento proporcional ao nível (0 a 1). */
export function BatteryIcon({ level, color, width = 26 }: { level: number; color: string; width?: number }) {
  const height = width / 2;
  const fill = Math.max(0, Math.min(1, level));
  return (
    <Svg width={width} height={height} viewBox="0 0 30 15">
      <Rect x={1} y={1} width={25} height={13} rx={3.5} stroke={color} strokeOpacity={0.55} strokeWidth={1.6} fill="none" />
      <Rect x={27.2} y={5} width={1.8} height={5} rx={0.9} fill={color} fillOpacity={0.55} />
      {fill > 0 && <Rect x={3} y={3} width={21 * fill} height={9} rx={2} fill={color} />}
    </Svg>
  );
}
