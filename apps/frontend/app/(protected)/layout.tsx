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
import { headers } from "next/headers";

import { authClient } from "#lib/auth/client.ts";
import { isFeatureEnabled } from "#lib/enabled-features.ts";

import { PageWrapper } from "./_components/page-wrapper.tsx";

import type { SidebarItem } from "./_components/sidebar/sidebar.tsx";

export default async function ProtectedLayout({ children }: LayoutProps<"/">) {
  const headersList = await headers();
  const userAgentHeader = headersList.get("user-agent");
  const authData = await authClient.getSession({
    fetchOptions: {
      throw: true,
    },
  });
  const isAdmin = authData?.user.role === "admin";

  const sidebarItems: readonly SidebarItem[] = [
    { href: "/", icon: <Home />, label: "Home" },
    {
      href: "/dashboard",
      icon: <LayoutDashboard />,
      label: "Dashboard",
      hidden: !isFeatureEnabled("dashboardPage"),
    },
    { href: "/library", icon: <Library />, label: "Library" },
    { href: "/explore", icon: <Search />, label: "Explore" },
    {
      href: "/calendar",
      icon: <CalendarDays />,
      label: "Calendar",
      hidden: !isFeatureEnabled("calendarPage"),
    },
    { href: "/profile", icon: <User />, label: "Profile" },
    ...(isAdmin
      ? ([
          {
            href: "/settings",
            icon: <Settings />,
            label: "Settings",
            hidden: !isFeatureEnabled("settingsPage"),
          },
          {
            href: "/view-logs",
            icon: <FileClock />,
            label: "Logs",
            hidden: !isFeatureEnabled("logsPage"),
          },
        ] as const)
      : []),
  ];

  return (
    <PageWrapper
      sidebarItems={sidebarItems}
      user={authData?.user}
      userAgentHeader={userAgentHeader}
    >
      {children}
    </PageWrapper>
  );
}
