import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { dataService } from './services';
import type { Message, MessageThread, Notification } from './types';

interface PortalState {
  user: { name: string; company: string; email: string } | null;
  notifications: Notification[];
  threads: MessageThread[];
  loading: boolean;
  unreadNotifications: number;
  unreadMessages: number;
  setNotificationRead(id: string, read: boolean): Promise<void>;
  markAllNotificationsRead(): Promise<void>;
  openThread(threadId: string): Promise<void>;
  reply(threadId: string, body: string): Promise<void>;
}

const PortalContext = createContext<PortalState | null>(null);

function groupThreads(messages: Message[]): MessageThread[] {
  const byThread = new Map<string, Message[]>();
  for (const m of messages) byThread.set(m.threadId, [...(byThread.get(m.threadId) ?? []), m]);
  return [...byThread.entries()]
    .map(([threadId, msgs]) => {
      const sorted = msgs.sort((a, b) => a.sentOn.localeCompare(b.sentOn));
      return {
        threadId,
        subject: sorted[0].subject,
        messages: sorted,
        lastSentOn: sorted[sorted.length - 1].sentOn,
        unread: sorted.filter((m) => !m.read).length,
      };
    })
    .sort((a, b) => b.lastSentOn.localeCompare(a.lastSentOn));
}

/** Holds notifications and messages, which are needed app-wide (badges, dashboard). */
export function PortalProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<PortalState['user']>(null);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([dataService.getCurrentUser(), dataService.getNotifications(), dataService.getMessages()])
      .then(([u, n, m]) => {
        setUser(u);
        setNotifications(n.sort((a, b) => b.createdOn.localeCompare(a.createdOn)));
        setMessages(m);
      })
      .finally(() => setLoading(false));
  }, []);

  const setNotificationRead = useCallback(async (id: string, read: boolean) => {
    setNotifications((ns) => ns.map((n) => (n.id === id ? { ...n, read } : n)));
    await dataService.markNotificationRead(id, read);
  }, []);

  const markAllNotificationsRead = useCallback(async () => {
    const unread = notifications.filter((n) => !n.read);
    setNotifications((ns) => ns.map((n) => ({ ...n, read: true })));
    await Promise.all(unread.map((n) => dataService.markNotificationRead(n.id, true)));
  }, [notifications]);

  const openThread = useCallback(async (threadId: string) => {
    setMessages((ms) => ms.map((m) => (m.threadId === threadId ? { ...m, read: true } : m)));
    await dataService.markThreadRead(threadId);
  }, []);

  const threads = useMemo(() => groupThreads(messages), [messages]);

  const reply = useCallback(
    async (threadId: string, body: string) => {
      const thread = threads.find((t) => t.threadId === threadId);
      const sent = await dataService.sendReply(threadId, thread?.subject ?? '', body);
      setMessages((ms) => [...ms, sent]);
    },
    [threads],
  );

  const value: PortalState = {
    user,
    notifications,
    threads,
    loading,
    unreadNotifications: notifications.filter((n) => !n.read).length,
    unreadMessages: threads.reduce((sum, t) => sum + t.unread, 0),
    setNotificationRead,
    markAllNotificationsRead,
    openThread,
    reply,
  };

  return <PortalContext.Provider value={value}>{children}</PortalContext.Provider>;
}

export function usePortal() {
  const ctx = useContext(PortalContext);
  if (!ctx) throw new Error('usePortal must be used inside PortalProvider');
  return ctx;
}
