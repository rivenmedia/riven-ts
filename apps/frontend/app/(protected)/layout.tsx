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

import { Header } from "./_components/header";
import { Sidebar, type SidebarItem } from "./_components/sidebar/sidebar";

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
    <div className="bg-background relative grid h-screen w-screen grid-cols-1 overflow-hidden md:grid-cols-[auto_1fr]">
      <Sidebar items={sidebarItems} currentPath="" user={authData?.user} />
      <main className="relative overflow-hidden">
        <div
          className="size-full overflow-x-hidden overflow-y-scroll"
          style={{ scrollbarGutter: "stable" }}
        >
          <Header modifierKey={userAgentHeader?.includes("Mac") ? "⌘" : "⌃"} />
          <main
            // in:fly|global={{ y: 20, duration: 600, easing: cubicOut }}
            className="mt-4 flex flex-col gap-6 p-4 pb-24 md:mt-14 md:gap-8 md:p-8 md:px-16"
          >
            <div className="pointer-events-none fixed inset-0 z-0">
              <div className="absolute inset-0 bg-linear-to-b from-zinc-900 via-zinc-950 to-black"></div>
              <div className="bg-primary/5 absolute top-[-20%] left-[-10%] h-150 w-150 rounded-full blur-[120px]"></div>
              <div className="absolute right-[-5%] bottom-[-10%] h-125 w-125 rounded-full bg-blue-500/5 blur-[100px]"></div>
            </div>
            {children}
          </main>
        </div>
      </main>
      {/* <MobileNav /> */}
    </div>
  );
}
