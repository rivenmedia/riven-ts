"use client";

import { ImmersiveBackground } from "@repo/util-ui/components/immersive-background/immersive-background.tsx";
import { PageShell } from "@repo/util-ui/components/page-shell/page-shell.tsx";

import { usePathname } from "next/navigation";

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
      <PageShell className="z-1">
        <ImmersiveBackground />
        <main>{children}</main>
      </PageShell>
      {/* <MobileNav /> */}
    </div>
  );
}
