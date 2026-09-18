import { preview } from "@/.storybook/preview";

import { DateTime } from "luxon";
import { useMemo } from "react";
import { expect, fn, userEvent, waitFor, within } from "storybook/test";

import {
  NotificationsContext,
  NotificationsProvider,
} from "../providers/notifications-provider";
import { NotificationCenter } from "./notification-center";

import type {
  NotificationsContextValue,
  Notification,
} from "../providers/notifications-provider";

const meta = preview.meta({
  title: "Components / NotificationCenter",
  component: NotificationCenter,
  decorators: [
    (Story) => (
      <NotificationsProvider>
        <Story />
      </NotificationsProvider>
    ),
  ],
  play: async ({ canvas }) => {
    const button = canvas.getByRole("button", {
      name: "Open notification center",
    });

    await userEvent.click(button, { skipHover: true });
  },
});

export const Default = meta.story();

export const WithNotifications = meta.story({
  decorators: [
    (Story) => {
      const notifications = useMemo<Notification[]>(
        () => [
          {
            count: 1,
            dedupeKey: null,
            duration: 120,
            id: "1",
            imdb_id: "tt1234567",
            message: "A new movie has been added to your watchlist.",
            read: false,
            severity: "success",
            timestamp: DateTime.now().toISO(),
            title: "New Movie Added",
            type: "movie",
            year: 2023,
          },
          {
            count: 1,
            dedupeKey: null,
            duration: 120,
            id: "2",
            imdb_id: "tt1234567",
            message: "A new show has been added to your watchlist.",
            read: false,
            severity: "success",
            timestamp: DateTime.now().minus({ hours: 2, minutes: 19 }).toISO(),
            title: "New Show Added",
            type: "show",
            year: 2023,
          },
          {
            count: 1,
            dedupeKey: null,
            duration: 120,
            id: "3",
            imdb_id: "tt1234567",
            message: "A new season has been added to your watchlist.",
            read: false,
            severity: "success",
            timestamp: DateTime.now()
              .minus({ days: 2, hours: 3, minutes: 15 })
              .toISO(),
            title: "New Season Added",
            type: "season",
            year: 2023,
          },
          {
            count: 1,
            dedupeKey: null,
            duration: 120,
            id: "4",
            imdb_id: "tt1234567",
            message: "A new episode has been added to your watchlist.",
            read: false,
            severity: "success",
            timestamp: DateTime.now().minus({ weeks: 2 }).toISO(),
            title: "New Episode Added",
            type: "episode",
            year: 2023,
          },
        ],
        [],
      );

      const value = useMemo<NotificationsContextValue>(
        () => ({
          clear: fn().mockName("clear"),
          markAllAsRead: fn().mockName("markAllAsRead"),
          markAsRead: fn().mockName("markAsRead"),
          remove: fn().mockName("remove"),
          reconnect: fn().mockName("reconnect"),
          notifications,
          unreadCount: notifications.filter(({ read }) => !read).length,
          connectionStatus: "connected",
        }),
        [notifications],
      );

      return (
        <NotificationsContext.Provider value={value}>
          <Story />
        </NotificationsContext.Provider>
      );
    },
  ],
});

WithNotifications.test(
  'Shows a toast when the "Mark all as read" button is clicked',
  async ({ canvasElement }) => {
    const body = within(canvasElement.ownerDocument.body);
    const dialog = within(
      body.getByRole("dialog", {
        name: /notifications/iu,
      }),
    );

    const button = dialog.getByRole("button", {
      name: /mark all as read/iu,
    });

    await userEvent.click(button);

    const toastContainer = within(
      body.getByRole("region", { name: /notifications/iu }),
    );

    await waitFor(async () => {
      const toastItem = toastContainer.getByRole("listitem");

      await expect(toastItem).toHaveTextContent(
        /all notifications marked as read/iu,
      );
    });
  },
);

WithNotifications.test(
  'Shows a toast when the "Clear all notifications" button is clicked',
  async ({ canvasElement }) => {
    const body = within(canvasElement.ownerDocument.body);
    const dialog = within(
      body.getByRole("dialog", {
        name: /notifications/iu,
      }),
    );

    const button = dialog.getByRole("button", {
      name: /clear all notifications/iu,
    });

    await userEvent.click(button);

    const toastContainer = within(
      body.getByRole("region", { name: /notifications/iu }),
    );

    await waitFor(async () => {
      const toastItem = toastContainer.getByRole("listitem");

      await expect(toastItem).toHaveTextContent(/all notifications cleared/iu);
    });
  },
);

export const ErroredConnectionStatus = meta.story({
  decorators: [
    (Story) => {
      const value = useMemo<NotificationsContextValue>(
        () => ({
          clear: fn().mockName("clear"),
          markAllAsRead: fn().mockName("markAllAsRead"),
          markAsRead: fn().mockName("markAsRead"),
          remove: fn().mockName("remove"),
          reconnect: fn().mockName("reconnect"),
          notifications: [],
          unreadCount: 0,
          connectionStatus: "error",
        }),
        [],
      );

      return (
        <NotificationsContext.Provider value={value}>
          <Story />
        </NotificationsContext.Provider>
      );
    },
  ],
});
