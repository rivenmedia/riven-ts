"use client";

import { usePathname } from "next/navigation";

import { ImmersiveBackground } from "#components/immersive-background/immersive-background.tsx";
import { PageShell } from "#components/page-shell/page-shell.tsx";

import { Header } from "./header.tsx";
import { Sidebar } from "./sidebar/sidebar.tsx";

import type { User } from "#lib/auth/types.ts";
import type { SidebarItem } from "./sidebar/sidebar.tsx";
import type { PropsWithChildren } from "react";

interface PageWrapperProps {
  user: User | undefined;
  userAgentHeader: string | null;
  sidebarItems: readonly SidebarItem[];
}

export function PageWrapper({
  children,
  sidebarItems,
  user,
  userAgentHeader,
}: PropsWithChildren<PageWrapperProps>) {
  const pathname = usePathname();

  return (
    <div className="bg-background relative grid h-screen w-screen grid-cols-1 overflow-hidden md:grid-cols-[auto_1fr]">
      <Sidebar items={sidebarItems} currentPath={pathname} user={user} />
      <Header modifierKey={userAgentHeader?.includes("Mac") ? "⌘" : "⌃"} />
      <PageShell>
        <ImmersiveBackground />
        {children}
      </PageShell>
      {/* <MobileNav /> */}
    </div>
  );
}
