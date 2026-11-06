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
/** Seta de voltar (navegação em listas). */
export const BackIcon = make('M15.7 4.3a1 1 0 0 1 0 1.4L9.41 12l6.3 6.3a1 1 0 1 1-1.42 1.4l-7-7a1 1 0 0 1 0-1.4l7-7a1 1 0 0 1 1.42 0z');
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

/** Rota (distância percorrida). */
export const RouteIcon = make(
  'M6 3a3 3 0 0 1 1 5.83V15a2 2 0 0 0 4 0V9a4 4 0 0 1 8 0v6.17A3 3 0 1 1 17 15.17V9a2 2 0 0 0-4 0v6a4 4 0 0 1-8 0V8.83A3 3 0 0 1 6 3z',
);
/** Relógio (tempo em movimento). */
export const ClockIcon = make(
  'M12 2a10 10 0 1 1 0 20 10 10 0 0 1 0-20zm0 2a8 8 0 1 0 0 16 8 8 0 0 0 0-16zm1 3v4.6l3.2 1.9-1 1.7L11 12.7V7z',
);
/** Mostrador (velocidade média). */
export const GaugeIcon = make(
  'M12 4a10 10 0 0 1 10 10c0 1.9-.53 3.68-1.45 5.2l-1.7-1.05A8 8 0 1 0 4 14c0 1.52.42 2.95 1.15 4.15l-1.7 1.05A9.96 9.96 0 0 1 2 14 10 10 0 0 1 12 4zm4.95 4.64 1.41 1.41-4.6 4.6a2 2 0 1 1-1.41-1.41z',
);
/** Pico (velocidade máxima). */
export const PeakIcon = make('M3 19 10 7l4 6 2.5-4L21 19h-2.4l-2.1-3.4-2.4 3.8-4.2-6.3L5.3 19z');

/** Sinal do GPS em barrinhas (0 a 4), como o sinal do celular. */
export function SignalBars({ bars, color, size = 18 }: { bars: number; color: string; size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      {[0, 1, 2, 3].map((i) => (
        <Rect
          key={i}
          x={2 + i * 5.5}
          y={18 - i * 4.5}
          width={4}
          height={4 + i * 4.5}
          rx={1}
          fill={color}
          fillOpacity={i < bars ? 1 : 0.22}
        />
      ))}
    </Svg>
  );
}

/** Casa (tela de início). */
export const HomeIcon = make('M12 3.2 2.5 11h2.7v9.3h5.3v-6h3v6h5.3V11h2.7z');
/** Engrenagem (ajustes). */
export const GearIcon = make(
  'M19.4 13a7.6 7.6 0 0 0 0-2l2.1-1.6-2-3.5-2.5 1a7.3 7.3 0 0 0-1.7-1L15 3.3h-4l-.4 2.6a7.3 7.3 0 0 0-1.7 1l-2.5-1-2 3.5L6.6 11a7.6 7.6 0 0 0 0 2l-2.2 1.6 2 3.5 2.5-1a7.3 7.3 0 0 0 1.7 1l.4 2.6h4l.4-2.6a7.3 7.3 0 0 0 1.7-1l2.5 1 2-3.5zM13 15.4A3.4 3.4 0 1 1 13 8.6a3.4 3.4 0 0 1 0 6.8z',
);
/** Rosa dos ventos (bússola). */
export const CompassIcon = make(
  'M12 2a10 10 0 1 1 0 20 10 10 0 0 1 0-20zm0 2a8 8 0 1 0 0 16 8 8 0 0 0 0-16zm3.8 4.2-2 5.6-5.6 2 2-5.6zm-3.8 3a.8.8 0 1 0 0 1.6.8.8 0 0 0 0-1.6z',
);
/** Montanha (altitude). */
export const MountainIcon = make('M2 19 9 7l3.6 6.2L15 9.5 22 19z');
/** Sinal de "ok" (marcado). */
export const CheckIcon = make('M9.5 16.2 5.3 12l-1.4 1.4 5.6 5.6 11-11-1.4-1.4z');

type WeatherIconName = 'sol' | 'lua' | 'parcial' | 'nublado' | 'neblina' | 'garoa' | 'chuva' | 'tempestade' | 'neve';

/** Ícones do clima, coloridos. */
export function WeatherGlyph({ name, size = 48 }: { name: WeatherIconName; size?: number }) {
  const sun = <Path d="M12 7a5 5 0 1 1 0 10 5 5 0 0 1 0-10z" fill="#FFD60A" />;
  const rays = (
    <Path
      d="M11 1h2v3h-2zM11 20h2v3h-2zM1 11h3v2H1zM20 11h3v2h-3zM4.2 5.6l1.4-1.4 2.1 2.1-1.4 1.4zM16.3 17.7l1.4-1.4 2.1 2.1-1.4 1.4zM4.2 18.4l2.1-2.1 1.4 1.4-2.1 2.1zM16.3 6.3l2.1-2.1 1.4 1.4-2.1 2.1z"
      fill="#FFD60A"
    />
  );
  const cloud = (color: string) => (
    <Path d="M7 19a4.5 4.5 0 0 1-.6-8.96A6 6 0 0 1 18 10.5a4.25 4.25 0 0 1-.5 8.5z" fill={color} />
  );
  const drops = (color: string, long = true) => (
    <Path
      d={long ? 'M8 20.5l-1 2.5M12 20.5l-1 2.5M16 20.5l-1 2.5' : 'M8 20.5l-.5 1.3M12 20.5l-.5 1.3M16 20.5l-.5 1.3'}
      stroke={color}
      strokeWidth={1.8}
      strokeLinecap="round"
    />
  );
  let content;
  switch (name) {
    case 'sol':
      content = (
        <>
          {rays}
          {sun}
        </>
      );
      break;
    case 'lua':
      content = <Path d="M14.5 3a9 9 0 1 0 6.5 13.8A7.5 7.5 0 0 1 14.5 3z" fill="#E5E5EA" />;
      break;
    case 'parcial':
      content = (
        <>
          <Path d="M9 3a5 5 0 0 1 4.9 4A6 6 0 0 0 8 10.3 5 5 0 0 1 9 3z" fill="#FFD60A" />
          {cloud('#E5E5EA')}
        </>
      );
      break;
    case 'nublado':
      content = cloud('#C7C7CC');
      break;
    case 'neblina':
      content = (
        <Path d="M3 9h18v2H3zM5 13h14v2H5zM3 17h18v2H3z" fill="#AEAEB2" />
      );
      break;
    case 'garoa':
      content = (
        <>
          <Path d="M7 16a4 4 0 0 1-.5-7.97A5.5 5.5 0 0 1 17.1 8 3.9 3.9 0 0 1 17 16z" fill="#C7C7CC" />
          {drops('#64D2FF', false)}
        </>
      );
      break;
    case 'chuva':
      content = (
        <>
          <Path d="M7 16a4 4 0 0 1-.5-7.97A5.5 5.5 0 0 1 17.1 8 3.9 3.9 0 0 1 17 16z" fill="#AEAEB2" />
          {drops('#0A84FF')}
        </>
      );
      break;
    case 'tempestade':
      content = (
        <>
          <Path d="M7 15a4 4 0 0 1-.5-7.97A5.5 5.5 0 0 1 17.1 7 3.9 3.9 0 0 1 17 15z" fill="#8E8E93" />
          <Path d="M12.5 14 9 19h3l-1 4 4-6h-3l1.5-3z" fill="#FFD60A" />
        </>
      );
      break;
    case 'neve':
      content = (
        <>
          <Path d="M7 16a4 4 0 0 1-.5-7.97A5.5 5.5 0 0 1 17.1 8 3.9 3.9 0 0 1 17 16z" fill="#E5E5EA" />
          <Path d="M7 19h2v2H7zM11 20h2v2h-2zM15 19h2v2h-2z" fill="#FFFFFF" />
        </>
      );
      break;
  }
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      {content}
    </Svg>
  );
}

/** Seta circular (zerar). */
export const ResetIcon = make(
  'M12 5V2L7.5 6.5 12 11V7.5a5.5 5.5 0 1 1-5.5 5.5H4a8 8 0 1 0 8-8z',
);
/** Calendário. */
export const CalendarIcon = make('M7 2h2v2h6V2h2v2h3v17H4V4h3zm-1 7v10h12V9z');
