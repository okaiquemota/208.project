import { formatChatTime, initials, parseChats } from '../src/lib/messages';

describe('parseChats', () => {
  const raw = [
    {
      key: 'a',
      packageName: 'com.whatsapp',
      chat: 'Maria',
      title: 'Maria',
      text: 'Já saiu?',
      isGroup: false,
      messages: [
        { sender: 'Maria', text: 'Oi', time: 100 },
        { sender: 'Maria', text: 'Já saiu?', time: 200 },
      ],
      postedAt: 200,
      avatarUri: 'file:///m.png',
      canReply: true,
      canMarkRead: true,
    },
    {
      key: 'b',
      packageName: 'com.whatsapp',
      chat: 'Família',
      isGroup: true,
      messages: [{ sender: 'João', text: 'Chegando', time: 300 }],
      postedAt: 300,
    },
    { key: 'c', chat: '', text: 'sem nome' },
    { key: 'd', chat: 'Vazio', messages: [] },
    null,
  ];

  it('lê, ordena (mais recente primeiro) e descarta o inválido', () => {
    const chats = parseChats(raw);
    expect(chats.map((c) => c.key)).toEqual(['b', 'a']);
  });

  it('conversa individual não repete o nome em cada mensagem', () => {
    const maria = parseChats(raw).find((c) => c.key === 'a')!;
    expect(maria.messages.every((m) => m.sender === null)).toBe(true);
    expect(maria.lastText).toBe('Já saiu?');
    expect(maria.canReply).toBe(true);
  });

  it('grupo mantém quem mandou', () => {
    const fam = parseChats(raw).find((c) => c.key === 'b')!;
    expect(fam.messages[0]?.sender).toBe('João');
    expect(fam.canReply).toBe(false);
    expect(fam.avatarUri).toBeNull();
  });

  it('sem lista de mensagens usa o texto da notificação', () => {
    const [c] = parseChats([{ key: 'x', title: 'Ana', text: 'Bom dia', postedAt: 5 }]);
    expect(c?.messages).toEqual([{ sender: null, text: 'Bom dia', time: 5 }]);
  });

  it('não é lista: vazio', () => {
    expect(parseChats(undefined)).toEqual([]);
  });
});

describe('formatChatTime', () => {
  const now = new Date(2026, 10, 6, 14, 32).getTime();
  it('formatos curtos', () => {
    expect(formatChatTime(now - 20_000, now)).toBe('agora');
    expect(formatChatTime(now - 5 * 60_000, now)).toBe('5 min');
    expect(formatChatTime(new Date(2026, 10, 6, 9, 5).getTime(), now)).toBe('09:05');
    expect(formatChatTime(new Date(2026, 10, 5, 22, 0).getTime(), now)).toBe('ontem');
    expect(formatChatTime(new Date(2026, 9, 30, 8, 0).getTime(), now)).toBe('30/10');
    expect(formatChatTime(0, now)).toBe('');
  });
});

describe('initials', () => {
  it('iniciais do nome', () => {
    expect(initials('Maria Silva')).toBe('MS');
    expect(initials('João')).toBe('J');
    expect(initials('🚗 Grupo da Viagem')).toBe('GV');
    expect(initials('')).toBe('?');
  });
});
