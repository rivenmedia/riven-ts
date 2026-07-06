import { authClient } from "@/lib/auth/client";

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

import { PageWrapper } from "./_components/page-wrapper";

import type { SidebarItem } from "./_components/sidebar/sidebar";

export default async function ProtectedLayout({ children }: LayoutProps<"/">) {
  const headersList = await headers();
  const userAgentHeader = headersList.get("user-agent");
  const authData = await authClient.getSession({
    fetchOptions: {
      throw: true,
    },
  });
  const isAdmin = authData?.user.role === "admin";

  const sidebarItems: SidebarItem[] = [
    { href: "/", icon: Home, label: "Home" },
    { href: "/dashboard", icon: LayoutDashboard, label: "Dashboard" },
    { href: "/library", icon: Library, label: "Library" },
    { href: "/explore", icon: Search, label: "Explore" },
    { href: "/calendar", icon: CalendarDays, label: "Calendar" },
    { href: "/profile", icon: User, label: "Profile" },
    ...(isAdmin
      ? ([
          { href: "/settings", icon: Settings, label: "Settings" },
          { href: "/logs", icon: FileClock, label: "Logs" },
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
