import { createContext, useContext, useMemo } from "react";

import type { PropsWithChildren } from "react";

export interface Notification {
  id: string;
  title: string;
  message: string;
  timestamp: string;
  type: "movie" | "show" | "season" | "episode";
  severity: "success" | "warning" | "error";
  year?: number;
  duration?: number;
  imdb_id?: string;
  read: boolean;
  count: number;
  dedupeKey: string | null;
}

export interface NotificationsContextValue {
  notifications: Notification[];
  reconnect: () => void;
  unreadCount: number;
  connectionStatus: "connected" | "disconnected" | "connecting" | "error";
  markAsRead: (notificationId: string) => void;
  markAllAsRead: () => void;
  clear: () => void;
  remove: (notificationId: string) => void;
}

export const NotificationsContext = createContext<
  NotificationsContextValue | undefined
>(undefined);

export function NotificationsProvider({ children }: PropsWithChildren) {
  const value = useMemo<NotificationsContextValue>(
    () => ({
      notifications: [],
      clear: () => {},
      markAllAsRead: () => {},
      markAsRead: () => {},
      remove: () => {},
      reconnect: () => {},
      unreadCount: 0,
      connectionStatus: "connected",
    }),
    [],
  );

  return (
    <NotificationsContext.Provider value={value}>
      {children}
    </NotificationsContext.Provider>
  );
}

export function useNotificationsContext() {
  const context = useContext(NotificationsContext);

  if (!context) {
    throw new Error(
      "useNotificationsContext must be used within a NotificationsProvider",
    );
  }

  return context;
}
