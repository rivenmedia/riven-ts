"use client";

import { ImmersiveBackground } from "@/components/immersive-background/immersive-background";
import { PageShell } from "@/components/page-shell/page-shell";

import { usePathname } from "next/navigation";

import { Header } from "./header";
import { Sidebar } from "./sidebar/sidebar";

import type { SidebarItem } from "./sidebar/sidebar";
import type { User } from "@/lib/auth/types";
import type { PropsWithChildren } from "react";

interface PageWrapperProps {
  user: User | undefined;
  userAgentHeader: string | null;
  sidebarItems: SidebarItem[];
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
      <div
        className="size-full overflow-x-hidden overflow-y-scroll"
        style={{ scrollbarGutter: "stable" }}
      >
        <Header modifierKey={userAgentHeader?.includes("Mac") ? "⌘" : "⌃"} />
        <PageShell>
          <ImmersiveBackground />
          {children}
        </PageShell>
      </div>
      {/* <MobileNav /> */}
    </div>
  );
}
