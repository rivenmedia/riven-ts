import preview from "@/.storybook/preview";
import { NotificationsProvider } from "@/components/providers/notifications-provider";

import {
  Home,
  LayoutDashboard,
  Library,
  Search,
  CalendarDays,
  User,
} from "lucide-react";
import { DateTime } from "luxon";

import { PageWrapper } from "./page-wrapper";

const meta = preview.meta({
  title: "Components / PageWrapper",
  component: PageWrapper,
  args: {
    children: <p>Page content</p>,
    sidebarItems: [
      { href: "/", icon: Home, label: "Home" },
      { href: "/dashboard", icon: LayoutDashboard, label: "Dashboard" },
      { href: "/library", icon: Library, label: "Library" },
      { href: "/explore", icon: Search, label: "Explore" },
      { href: "/calendar", icon: CalendarDays, label: "Calendar" },
      { href: "/profile", icon: User, label: "Profile" },
    ],
    user: {
      banned: false,
      createdAt: DateTime.now().toJSDate(),
      email: "user@example.com",
      id: "user-id-123",
      emailVerified: true,
      name: "User Name",
      updatedAt: DateTime.now().toJSDate(),
    },
    userAgentHeader: "",
  },
  decorators: [
    (Story) => (
      <NotificationsProvider>
        <Story />
      </NotificationsProvider>
    ),
  ],
  parameters: {
    layout: "fullscreen",
  },
});

export const Default = meta.story();
