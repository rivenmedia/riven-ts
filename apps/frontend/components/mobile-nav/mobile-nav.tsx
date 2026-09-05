import { cn } from "@/lib/utils";

import { ChevronLeft, Menu, Search, X } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";

import { Button } from "../_ui/button";
import { NotificationCenter } from "../notification-center/notification-center";

import type { AppRoutes } from "../../.next/dev/types/routes";

const MAIN_PAGES = new Set<string>([
  "/",
  "/explore",
  "/dashboard",
  "/library",
  "/settings",
  "/calendar",
  "/logs",
  // "/auth",
] satisfies AppRoutes[]);

export function MobileNav() {
  const pathname = usePathname();
  const router = useRouter();
  const isMainPage = MAIN_PAGES.has(pathname);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  return (
    <>
      {!isMainPage && (
        <button
          // transition:fly={{ y: -20, duration: 400, easing: cubicOut }}
          onClick={() => {
            if (globalThis.history.length > 1) {
              router.back();
            } else {
              router.push("/");
            }
          }}
          aria-label="Go back"
          className="fixed top-4 left-4 z-60 flex h-10 w-10 items-center justify-center rounded-full border border-white/5 bg-white/5 shadow-lg backdrop-blur-xl transition-all duration-300 hover:bg-white/10 active:scale-95 md:hidden"
        >
          <ChevronLeft className="size-5 text-white/70" />
        </button>
      )}
      <div className="fixed right-0 bottom-6 left-0 z-60 flex justify-center px-4 md:hidden slide-out-from-bottom-5 slide-in-from-top-5 duration-400 ease-[easeOutCubic]">
        <div className="flex h-11 w-full max-w-md items-center gap-2 rounded-full border border-white/5 bg-white/5 p-1 pl-4 shadow-lg backdrop-blur-xl transition-all duration-300 focus-within:border-white/10 focus-within:bg-black/40 focus-within:ring-1 focus-within:ring-white/20 hover:bg-white/10">
          <Search className="size-4 shrink-0 text-white/50" />

          <button
            // onclick={() => (searchModalOpen = true)}
            aria-label="Open search"
            className="h-full flex-1 bg-transparent text-left text-sm font-medium text-white/40 outline-none"
          >
            Search...
          </button>

          <div className="h-5 w-px bg-white/10" />

          <div className="flex items-center gap-0.5 pr-0.5">
            <NotificationCenter
              buttonProps={{
                className:
                  "flex h-9 w-9 items-center justify-center rounded-full text-white/50 transition-all hover:bg-white/10 hover:text-white",
                variant: "ghost",
              }}
              popoverProps={{
                align: "end",
                side: "top",
                sideOffset: 20,
              }}
            />

            <Button
              variant="ghost"
              size="icon"
              className="flex h-9 w-9 items-center justify-center rounded-full text-white/50 transition-all hover:bg-white/10 hover:text-white"
              onClick={() => {
                setIsSidebarOpen(!isSidebarOpen);
              }}
            >
              <div className="relative flex size-5 items-center justify-center">
                <div
                  className={cn(
                    "absolute inset-0 flex items-center justify-center transition-all duration-300 ease-in-out",
                    isSidebarOpen && "opacity-0 rotate-90 scale-0",
                  )}
                >
                  <Menu className="size-5" />
                </div>
                <div
                  className={cn(
                    "absolute inset-0 flex items-center justify-center transition-all duration-300 ease-in-out",
                    !isSidebarOpen && "opacity-0 -rotate-90 scale-0",
                  )}
                >
                  <X className="size-5" />
                </div>
              </div>
            </Button>
          </div>
        </div>
      </div>
    </>
  );
}
