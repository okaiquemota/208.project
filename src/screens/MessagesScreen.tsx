// Mensagens do WhatsApp no painel, no estilo do CarPlay:
// - à esquerda, as conversas com mensagem nova;
// - à direita, a conversa aberta, com as últimas mensagens e respostas
//   rápidas de um toque (nada de digitar dirigindo).
// Responder usa o botão "Responder" da própria notificação do WhatsApp.
// Na tela dividida mostra uma coluna só (lista ou conversa).

import { Image } from 'expo-image';
import { useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import Animated from 'react-native-reanimated';

import { Avatar } from '../components/CarNotificationWidgets';
import { BackIcon, ChatIcon, CheckIcon } from '../components/icons';
import { enterItem, enterText } from '../components/motion';
import { Touch } from '../components/Touch';
import { colors, font, sizes, tabular } from '../config/theme';
import type { CarNotificationsState } from '../hooks/useCarNotifications';
import { useNow } from '../hooks/useNow';
import { type Chat, formatChatTime, QUICK_REPLIES } from '../lib/messages';

type Props = {
  notifications: Pick<CarNotificationsState, 'chats' | 'open' | 'reply' | 'markRead'>;
  hasAccess: boolean;
  onOpenAccess: () => void;
  /** Ícone do WhatsApp (do celular). */
  icon: string | null;
  compact: boolean;
};

export function MessagesScreen({ notifications, hasAccess, onOpenAccess, icon, compact }: Props) {
  const { chats } = notifications;
  const now = useNow(30_000, true);
  const [selectedKey, setSelectedKey] = useState<string | null>(null);
  /** Última resposta enviada em cada conversa (para mostrar "Enviado"). */
  const [sent, setSent] = useState<Record<string, string>>({});
  const [failed, setFailed] = useState<string | null>(null);

  // Conversa aberta: a escolhida, se ainda existir; senão a mais recente (fora do compacto).
  const selected = chats.find((c) => c.key === selectedKey) ?? (compact ? null : (chats[0] ?? null));

  if (!hasAccess || chats.length === 0) {
    return (
      <View style={[styles.card, styles.center]}>
        {icon ? <Image source={icon} style={styles.bigIcon} contentFit="contain" /> : <ChatIcon size={48} color={colors.text3} />}
        <Text allowFontScaling={false} style={font(20, '800')}>{hasAccess ? 'Nenhuma mensagem nova' : 'Mensagens do WhatsApp'}</Text>
        <Text allowFontScaling={false} style={[font(14, '500', colors.text2), styles.centerText]}>
          {hasAccess
            ? 'As mensagens novas aparecem aqui, com resposta rápida.'
            : 'Para mostrar as mensagens aqui, libere o acesso a notificações.'}
        </Text>
        {!hasAccess && (
          <Touch onPress={onOpenAccess} accessibilityLabel="Ativar acesso a notificações" style={styles.whiteButton}>
            <Text allowFontScaling={false} style={font(15, '800', '#000')}>Ativar</Text>
          </Touch>
        )}
      </View>
    );
  }

  const sendReply = (chat: Chat, text: string) => {
    if (notifications.reply(chat.key, text)) {
      setSent((s) => ({ ...s, [chat.key]: text }));
      setFailed(null);
    } else {
      setFailed(chat.key);
    }
  };

  const list = (
    <View style={[styles.card, styles.listCard]}>
      <Text style={[font(12, '800', colors.text2), styles.header]} allowFontScaling={false}>
        WHATSAPP
      </Text>
      <ScrollView contentContainerStyle={styles.list} showsVerticalScrollIndicator={false}>
        {chats.map((c, i) => {
          const active = selected?.key === c.key;
          return (
            <Animated.View key={c.key} entering={enterItem(i)}>
              <Touch
                onPress={() => setSelectedKey(c.key)}
                accessibilityLabel={`Conversa com ${c.name}`}
                style={[styles.row, active && styles.rowActive]}
              >
                <Avatar uri={c.avatarUri} name={c.name} size={44} />
                <View style={styles.flex1}>
                  <View style={styles.titleRow}>
                    <Text style={[font(15, '700'), styles.flex1]} numberOfLines={1} allowFontScaling={false}>
                      {c.name}
                    </Text>
                    <Text style={[font(11, '600', colors.text3), tabular]} allowFontScaling={false}>
                      {formatChatTime(c.postedAt, now)}
                    </Text>
                  </View>
                  <Text style={font(13, '500', colors.text2)} numberOfLines={1} allowFontScaling={false}>
                    {sent[c.key] ? `Você: ${sent[c.key]}` : c.lastText}
                  </Text>
                </View>
              </Touch>
            </Animated.View>
          );
        })}
      </ScrollView>
    </View>
  );

  const detail = selected ? (
    <View style={[styles.card, styles.detailCard]}>
      <View style={styles.detailHeader}>
        {compact && (
          <Touch onPress={() => setSelectedKey(null)} accessibilityLabel="Voltar" visualSize={40} style={styles.roundButton}>
            <BackIcon size={22} color={colors.text} />
          </Touch>
        )}
        <Avatar uri={selected.avatarUri} name={selected.name} size={40} />
        <Text style={[font(18, '800'), styles.flex1]} numberOfLines={1} allowFontScaling={false}>
          {selected.name}
        </Text>
        {selected.canMarkRead && (
          <Touch
            onPress={() => notifications.markRead(selected.key)}
            accessibilityLabel="Marcar como lida"
            style={styles.ghostButton}
          >
            <CheckIcon size={18} color={colors.text} />
            {!compact && <Text allowFontScaling={false} style={font(13, '700')}>Lida</Text>}
          </Touch>
        )}
        <Touch
          onPress={() => notifications.open(selected.key)}
          accessibilityLabel="Abrir no WhatsApp"
          style={styles.whiteButtonSmall}
        >
          <Text allowFontScaling={false} style={font(13, '800', '#000')}>Abrir</Text>
        </Touch>
      </View>

      <ScrollView style={styles.flex1} contentContainerStyle={styles.bubbles} showsVerticalScrollIndicator={false}>
        {selected.messages.slice(-4).map((m, i) => (
          <Animated.View key={`${selected.key}-${m.time}-${i}`} entering={enterItem(i)} style={styles.bubble}>
            {m.sender ? (
              <Text style={font(12, '700', colors.green)} numberOfLines={1} allowFontScaling={false}>
                {m.sender}
              </Text>
            ) : null}
            <Text style={font(16, '500')} numberOfLines={4} allowFontScaling={false}>
              {m.text}
            </Text>
          </Animated.View>
        ))}
        {sent[selected.key] ? (
          <Animated.View key={`enviado-${sent[selected.key]}`} entering={enterText} style={[styles.bubble, styles.bubbleMine]}>
            <Text style={font(16, '500')} allowFontScaling={false}>
              {sent[selected.key]}
            </Text>
            <Text allowFontScaling={false} style={[font(11, '700', 'rgba(255,255,255,0.7)'), styles.sentLabel]}>Enviado ✓</Text>
          </Animated.View>
        ) : null}
        {failed === selected.key ? (
          <Text allowFontScaling={false} style={font(13, '700', colors.orange)}>Não deu para responder daqui. Toque em Abrir.</Text>
        ) : null}
      </ScrollView>

      {selected.canReply ? (
        <View style={styles.replies}>
          {QUICK_REPLIES.map((text) => (
            <Touch key={text} onPress={() => sendReply(selected, text)} accessibilityLabel={`Responder: ${text}`} style={styles.reply}>
              <Text style={font(14, '700')} numberOfLines={1} adjustsFontSizeToFit allowFontScaling={false}>
                {text}
              </Text>
            </Touch>
          ))}
        </View>
      ) : (
        <Text allowFontScaling={false} style={[font(13, '600', colors.text3), styles.noReply]}>
          Esta conversa não aceita resposta rápida. Toque em Abrir.
        </Text>
      )}
    </View>
  ) : null;

  if (compact) return selected ? detail : list;
  return (
    <>
      {list}
      {detail}
    </>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: sizes.cardRadius,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    overflow: 'hidden',
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    padding: 24,
  },
  centerText: {
    textAlign: 'center',
    maxWidth: 420,
  },
  bigIcon: {
    width: 64,
    height: 64,
  },
  flex1: {
    flex: 1,
  },
  listCard: {
    flex: 1,
    paddingTop: 14,
  },
  header: {
    paddingHorizontal: 16,
    marginBottom: 6,
  },
  list: {
    paddingHorizontal: 8,
    paddingBottom: 10,
    gap: 2,
  },
  row: {
    minHeight: sizes.minTouch + 4,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 8,
    borderRadius: 16,
  },
  rowActive: {
    backgroundColor: colors.fill,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  detailCard: {
    flex: 1.6,
    padding: 14,
    gap: 10,
  },
  detailHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  roundButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.fill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ghostButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    minHeight: 40,
    paddingHorizontal: 12,
    borderRadius: 20,
    backgroundColor: colors.fill,
  },
  whiteButton: {
    minHeight: 52,
    paddingHorizontal: 26,
    borderRadius: 26,
    backgroundColor: colors.text,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 6,
  },
  whiteButtonSmall: {
    minHeight: 40,
    paddingHorizontal: 16,
    borderRadius: 20,
    backgroundColor: colors.text,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bubbles: {
    gap: 6,
    paddingVertical: 2,
  },
  bubble: {
    alignSelf: 'flex-start',
    maxWidth: '88%',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 14,
    borderTopLeftRadius: 4,
    backgroundColor: 'rgba(255,255,255,0.10)',
  },
  bubbleMine: {
    alignSelf: 'flex-end',
    borderTopLeftRadius: 14,
    borderTopRightRadius: 4,
    backgroundColor: '#1F7A4D',
  },
  sentLabel: {
    alignSelf: 'flex-end',
    marginTop: 2,
  },
  replies: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  reply: {
    flexGrow: 1,
    flexBasis: '45%',
    minHeight: 52,
    paddingHorizontal: 12,
    borderRadius: 16,
    backgroundColor: colors.fill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  noReply: {
    textAlign: 'center',
  },
});
