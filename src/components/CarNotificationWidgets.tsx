// Widgets que vêm das notificações:
// - Próxima curva (Waze/Maps): seta, distância grande e a instrução;
// - WhatsApp: a última mensagem, com foto e horário.

import { Image } from 'expo-image';
import { StyleSheet, Text, View } from 'react-native';

import { colors, font, sizes, tabular } from '../config/theme';
import { type Chat, formatChatTime, initials } from '../lib/messages';
import type { Maneuver, NavInfo } from '../lib/navigation';
import { useAccent } from '../state/settings';
import {
  ChatIcon,
  FlagIcon,
  NavArrowIcon,
  RoundaboutIcon,
  StraightIcon,
  TurnLeftIcon,
  TurnRightIcon,
  UTurnIcon,
} from './icons';
import { Touch } from './Touch';

const GLYPH: Record<Maneuver, typeof StraightIcon> = {
  esquerda: TurnLeftIcon,
  direita: TurnRightIcon,
  retorno: UTurnIcon,
  rotatoria: RoundaboutIcon,
  chegada: FlagIcon,
  siga: StraightIcon,
};

/** Seta da manobra: a do próprio app (se mandou) ou a nossa, pelo texto. */
export function ManeuverArrow({ nav, size }: { nav: NavInfo; size: number }) {
  if (nav.iconUri) {
    return <Image source={nav.iconUri} style={{ width: size, height: size }} contentFit="contain" transition={0} />;
  }
  const Glyph = GLYPH[nav.maneuver];
  return <Glyph size={size} color={colors.text} />;
}

// ---------- Próxima curva (widget da coluna) ----------

export function NextTurnWidget({
  nav,
  hasAccess,
  onOpenAccess,
  onOpen,
}: {
  nav: NavInfo | null;
  hasAccess: boolean;
  onOpenAccess: () => void;
  onOpen: (key: string) => void;
}) {
  const accent = useAccent();
  if (!nav) {
    return (
      <View style={[styles.card, styles.row]}>
        <View style={[styles.arrowBox, styles.arrowIdle]}>
          <NavArrowIcon size={30} color={colors.text3} />
        </View>
        <View style={styles.flex1}>
          <Text style={font(16, '700', colors.text2)} numberOfLines={1} allowFontScaling={false}>
            {hasAccess ? 'Sem rota ativa' : 'Próxima curva'}
          </Text>
          <Text style={font(12, '500', colors.text3)} numberOfLines={2} allowFontScaling={false}>
            {hasAccess ? 'Inicie uma rota no Waze ou no Maps' : 'Libere o acesso a notificações'}
          </Text>
        </View>
        {!hasAccess && (
          <Touch onPress={onOpenAccess} accessibilityLabel="Ativar acesso a notificações" style={styles.smallButton}>
            <Text style={font(13, '800', '#000')}>Ativar</Text>
          </Touch>
        )}
      </View>
    );
  }
  return (
    <Touch onPress={() => onOpen(nav.key)} accessibilityLabel={`Abrir ${nav.appName}`} style={[styles.card, styles.row]}>
      <View style={[styles.arrowBox, { backgroundColor: accent.main }]}>
        <ManeuverArrow nav={nav} size={44} />
      </View>
      <View style={styles.flex1}>
        <Text style={[font(28, '800'), tabular]} numberOfLines={1} adjustsFontSizeToFit allowFontScaling={false}>
          {nav.distance}
        </Text>
        <Text style={font(13, '600', colors.text2)} numberOfLines={2} allowFontScaling={false}>
          {nav.instruction}
        </Text>
      </View>
    </Touch>
  );
}

// ---------- WhatsApp ----------

export function Avatar({ uri, name, size }: { uri: string | null; name: string; size: number }) {
  return (
    <View style={[styles.avatar, { width: size, height: size, borderRadius: size / 2 }]}>
      {uri ? (
        <Image source={uri} style={StyleSheet.absoluteFill} contentFit="cover" transition={0} />
      ) : (
        <Text style={font(Math.round(size * 0.38), '700', colors.text)} allowFontScaling={false}>
          {initials(name)}
        </Text>
      )}
    </View>
  );
}

export function MessagesWidget({
  chats,
  hasAccess,
  icon,
  now,
  onOpenAccess,
  onOpenMessages,
}: {
  chats: Chat[];
  hasAccess: boolean;
  /** Ícone do WhatsApp (do celular). */
  icon: string | null;
  now: number;
  onOpenAccess: () => void;
  onOpenMessages: () => void;
}) {
  const chat = chats[0];
  if (!chat) {
    return (
      <View style={[styles.card, styles.row]}>
        {icon ? <Image source={icon} style={styles.appIcon} contentFit="contain" /> : <ChatIcon size={30} color={colors.text3} />}
        <View style={styles.flex1}>
          <Text style={font(16, '700', colors.text2)} allowFontScaling={false}>
            WhatsApp
          </Text>
          <Text style={font(12, '500', colors.text3)} numberOfLines={2} allowFontScaling={false}>
            {hasAccess ? 'Nenhuma mensagem nova' : 'Libere o acesso a notificações'}
          </Text>
        </View>
        {!hasAccess && (
          <Touch onPress={onOpenAccess} accessibilityLabel="Ativar acesso a notificações" style={styles.smallButton}>
            <Text style={font(13, '800', '#000')}>Ativar</Text>
          </Touch>
        )}
      </View>
    );
  }
  const last = chat.messages[chat.messages.length - 1];
  const more = chats.length - 1;
  return (
    <Touch onPress={onOpenMessages} accessibilityLabel={`Mensagens de ${chat.name}`} style={[styles.card, styles.row]}>
      <View>
        <Avatar uri={chat.avatarUri} name={chat.name} size={46} />
        {icon ? <Image source={icon} style={styles.avatarBadge} contentFit="contain" /> : null}
      </View>
      <View style={styles.flex1}>
        <View style={styles.titleRow}>
          <Text style={[font(15, '700'), styles.flex1]} numberOfLines={1} allowFontScaling={false}>
            {chat.name}
          </Text>
          <Text style={[font(11, '600', colors.text3), tabular]} allowFontScaling={false}>
            {formatChatTime(last?.time || chat.postedAt, now)}
          </Text>
        </View>
        <Text style={font(13, '500', colors.text2)} numberOfLines={2} allowFontScaling={false}>
          {last?.sender ? `${last.sender}: ` : ''}
          {chat.lastText}
        </Text>
        {more > 0 && (
          <Text style={font(11, '700', colors.green)} allowFontScaling={false}>
            {more === 1 ? '+1 conversa' : `+${more} conversas`}
          </Text>
        )}
      </View>
    </Touch>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    minHeight: 0,
    borderRadius: sizes.cardRadius,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    padding: 14,
    overflow: 'hidden',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  flex1: {
    flex: 1,
  },
  arrowBox: {
    width: 62,
    height: 62,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  arrowIdle: {
    backgroundColor: colors.fill,
  },
  smallButton: {
    minHeight: 40,
    paddingHorizontal: 14,
    borderRadius: 20,
    backgroundColor: colors.text,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatar: {
    overflow: 'hidden',
    backgroundColor: '#2C6E5A',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarBadge: {
    position: 'absolute',
    right: -4,
    bottom: -4,
    width: 20,
    height: 20,
  },
  appIcon: {
    width: 40,
    height: 40,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
});
