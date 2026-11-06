// Próxima curva e conversas do WhatsApp, vindas das notificações (módulo
// CarNotifications). Precisa do mesmo "Acesso a notificações" do player.

import { useCallback, useEffect, useState } from 'react';

import { CarNotifications } from '../../modules/media-keys';
import { type Chat, parseChats } from '../lib/messages';
import { type NavInfo, pickNavigation } from '../lib/navigation';
import { useAppActive } from './useAppActive';

function readNav(): NavInfo | null {
  try {
    return pickNavigation(CarNotifications?.getNavigation());
  } catch {
    return null;
  }
}

function readChats(): Chat[] {
  try {
    return parseChats(CarNotifications?.getMessages());
  } catch {
    return [];
  }
}

const safe = (run: () => boolean | undefined) => {
  try {
    return run() ?? false;
  } catch {
    return false;
  }
};

export function useCarNotifications() {
  const [navigation, setNavigation] = useState<NavInfo | null>(readNav);
  const [chats, setChats] = useState<Chat[]>(readChats);

  useEffect(() => {
    if (!CarNotifications) return;
    const a = CarNotifications.addListener('onNavigationChange', () => setNavigation(readNav()));
    const b = CarNotifications.addListener('onMessagesChange', () => setChats(readChats()));
    return () => {
      a.remove();
      b.remove();
    };
  }, []);

  // Voltando de outro app (ex.: depois de liberar o acesso).
  useAppActive(() => {
    setNavigation(readNav());
    setChats(readChats());
  });

  const open = useCallback((key: string) => safe(() => CarNotifications?.openNotification(key)), []);
  const reply = useCallback((key: string, text: string) => safe(() => CarNotifications?.reply(key, text)), []);
  const markRead = useCallback((key: string) => safe(() => CarNotifications?.markRead(key)), []);

  return { available: CarNotifications !== null, navigation, chats, open, reply, markRead };
}

export type CarNotificationsState = ReturnType<typeof useCarNotifications>;
