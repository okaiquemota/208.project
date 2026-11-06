// Conversas do WhatsApp lidas das notificações: validação, horário curto e
// as respostas rápidas (um toque, sem digitar dirigindo).

export type ChatMessage = {
  /** Quem mandou (em grupo); null quando é a própria conversa. */
  sender: string | null;
  text: string;
  time: number;
};

export type Chat = {
  key: string;
  packageName: string;
  /** Nome do contato ou do grupo. */
  name: string;
  isGroup: boolean;
  /** Últimas mensagens, da mais antiga para a mais nova. */
  messages: ChatMessage[];
  lastText: string;
  postedAt: number;
  /** Foto (PNG), ou null. */
  avatarUri: string | null;
  canReply: boolean;
  canMarkRead: boolean;
};

/** Respostas rápidas (um toque). */
export const QUICK_REPLIES = [
  'Dirigindo, já respondo 🚗',
  'Chego em 10 min',
  'Ok 👍',
  'Te ligo depois',
] as const;

const str = (v: unknown) => (typeof v === 'string' ? v.trim() : '');
const num = (v: unknown) => (typeof v === 'number' && Number.isFinite(v) ? v : 0);

function parseMessage(raw: unknown): ChatMessage | null {
  if (typeof raw !== 'object' || raw === null) return null;
  const r = raw as Record<string, unknown>;
  const text = str(r.text);
  if (!text) return null;
  return { sender: str(r.sender) || null, text, time: num(r.time) };
}

/** Converte a lista do Kotlin; conversas sem nome ou sem texto saem. Mais recente primeiro. */
export function parseChats(raw: unknown): Chat[] {
  if (!Array.isArray(raw)) return [];
  const out: Chat[] = [];
  for (const item of raw) {
    if (typeof item !== 'object' || item === null) continue;
    const r = item as Record<string, unknown>;
    const key = str(r.key);
    const name = str(r.chat) || str(r.title);
    if (!key || !name) continue;
    const postedAt = num(r.postedAt);
    let messages = (Array.isArray(r.messages) ? r.messages : [])
      .map(parseMessage)
      .filter((m): m is ChatMessage => m !== null);
    if (messages.length === 0 && str(r.text)) messages = [{ sender: null, text: str(r.text), time: postedAt }];
    if (messages.length === 0) continue;
    const isGroup = r.isGroup === true;
    out.push({
      key,
      packageName: str(r.packageName),
      name,
      isGroup,
      // Na conversa individual o remetente é a própria pessoa: não repete o nome.
      messages: isGroup ? messages : messages.map((m) => (m.sender === name ? { ...m, sender: null } : m)),
      lastText: messages[messages.length - 1]?.text ?? '',
      postedAt,
      avatarUri: str(r.avatarUri) || null,
      canReply: r.canReply === true,
      canMarkRead: r.canMarkRead === true,
    });
  }
  return out.sort((a, b) => b.postedAt - a.postedAt);
}

const pad = (n: number) => String(n).padStart(2, '0');

/** "agora", "5 min", "14:32", "ontem" ou "06/11". */
export function formatChatTime(ms: number, now: number): string {
  if (!ms) return '';
  const diff = now - ms;
  if (diff < 60_000) return 'agora';
  if (diff < 60 * 60_000) return `${Math.floor(diff / 60_000)} min`;
  const d = new Date(ms);
  const today = new Date(now);
  if (d.toDateString() === today.toDateString()) return `${pad(d.getHours())}:${pad(d.getMinutes())}`;
  const yesterday = new Date(now - 24 * 60 * 60_000);
  if (d.toDateString() === yesterday.toDateString()) return 'ontem';
  return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}`;
}

/** Iniciais para quando não há foto ("Maria Silva" → "MS"). */
export function initials(name: string): string {
  const words = name
    .replace(/[^\p{L}\p{N}\s]/gu, ' ')
    .split(/\s+/)
    .filter(Boolean);
  const first = words[0]?.[0] ?? '?';
  const last = words.length > 1 ? (words[words.length - 1]?.[0] ?? '') : '';
  return (first + last).toUpperCase();
}
