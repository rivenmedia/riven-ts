"use client";

import { usePathname } from "next/navigation";

import { Header } from "./header";
import { Sidebar, type SidebarItem } from "./sidebar/sidebar";

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
      {/* <MobileNav /> */}
    </div>
  );
}
