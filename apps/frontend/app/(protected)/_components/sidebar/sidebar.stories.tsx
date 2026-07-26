import { preview } from "@/.storybook/preview";

import {
  CalendarDays,
  FileClock,
  Home,
  LayoutDashboard,
  Library,
  Search,
  Settings,
  User,
} from "lucide-react";
import { DateTime } from "luxon";

import { Sidebar } from "./sidebar";

const meta = preview.meta({
  title: "Components / Media / Sidebar",
  component: Sidebar,
  args: {
    currentPath: "/",
    items: [
      { href: "/", icon: Home, label: "Home" },
      { href: "/dashboard", icon: LayoutDashboard, label: "Dashboard" },
      { href: "/library", icon: Library, label: "Library" },
      { href: "/explore", icon: Search, label: "Explore" },
      { href: "/calendar", icon: CalendarDays, label: "Calendar" },
      { href: "/profile", icon: User, label: "Profile" },
      { href: "/settings", icon: Settings, label: "Settings" },
      { href: "/logs", icon: FileClock, label: "Logs" },
    ],
  },
  parameters: {
    layout: "fullscreen",
  },
});

export const LoggedIn = meta.story({
  args: {
    user: {
      id: "1",
      banned: false,
      name: "John Doe",
      createdAt: DateTime.now().toJSDate(),
      updatedAt: DateTime.now().toJSDate(),
      email: "email@example.com",
      emailVerified: false,
    },
  },
});

export const LoggedOut = meta.story({
  args: {
    user: undefined,
  },
});
