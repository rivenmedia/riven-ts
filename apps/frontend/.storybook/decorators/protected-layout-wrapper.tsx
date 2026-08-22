import { PageWrapper } from "@/app/(protected)/_components/page-wrapper";

import {
  CalendarDays,
  FileClock,
  Home,
  LayoutDashboard,
  Library,
  Search,
  Settings,
  UserIcon,
} from "lucide-react";
import { DateTime } from "luxon";
import { HttpResponse, http } from "msw";
import { useParameter } from "storybook/internal/preview-api";

import type { MswAddonParameters } from "../addons/msw";
import type { User } from "@/lib/auth/types";
import type { Decorator } from "@storybook/nextjs-vite";

export const ProtectedLayoutWrapper: Decorator = (Story) => {
  const mswParams = useParameter<MswAddonParameters>("msw");
  const user: User = {
    banned: false,
    createdAt: DateTime.now().toJSDate(),
    updatedAt: DateTime.now().toJSDate(),
    email: "",
    emailVerified: true,
    id: "1",
    name: "Admin",
    role: "admin",
  };

  mswParams?.handlers?.push(
    http.get("**/api/auth/get-session", () =>
      HttpResponse.json<{ user: User }>({ user }),
    ),
  );

  return (
    <PageWrapper
      sidebarItems={[
        { href: "/", icon: Home, label: "Home" },
        { href: "/dashboard", icon: LayoutDashboard, label: "Dashboard" },
        { href: "/library", icon: Library, label: "Library" },
        { href: "/explore", icon: Search, label: "Explore" },
        { href: "/calendar", icon: CalendarDays, label: "Calendar" },
        { href: "/profile", icon: UserIcon, label: "Profile" },
        { href: "/settings", icon: Settings, label: "Settings" },
        { href: "/logs", icon: FileClock, label: "Logs" },
      ]}
      user={user}
      userAgentHeader={null}
    >
      <Story />
    </PageWrapper>
  );
};
