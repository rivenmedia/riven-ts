import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { authClient } from "@/lib/auth/client";
import { cn, getInitials } from "@/lib/utils";

import { LogOut, Mountain } from "lucide-react";
import React, { useState } from "react";

import type { User } from "@/lib/auth/types";

interface SidebarItem {
  href: string;
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  label: string;
}

interface SidebarProps {
  currentPath: string;
  items: SidebarItem[];
  user: User | undefined;
}

export function Sidebar({ currentPath, items, user }: SidebarProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <aside className="bg-background/40 top-0 left-0 z-50 hidden h-screen w-14 flex-col items-center border-r border-white/5 backdrop-blur-md md:flex">
        <div className="flex h-18 w-full items-center justify-center">
          <div className="text-primary flex items-center justify-center">
            <Mountain className="size-5" />
          </div>
        </div>
        <nav
          className="mt-4 flex flex-col items-center gap-3.5"
          aria-label="Main Navigation"
        >
          {items.map((item) => {
            const IconComponent = item.icon;

            return (
              <Tooltip key={item.href}>
                <TooltipTrigger asChild>
                  <a
                    href={item.href}
                    className="hover:bg-accent/80 group relative flex h-10 w-10 items-center justify-center rounded-md transition-colors"
                    // class:bg-accent={page.url.pathname === item.href}
                    aria-label={item.label}
                    aria-current={
                      currentPath === item.href ? "page" : undefined
                    }
                  >
                    <IconComponent className="size-5" />
                  </a>
                </TooltipTrigger>
                <TooltipContent>
                  <p>{item.label}</p>
                </TooltipContent>
              </Tooltip>
            );
          })}
        </nav>

        <div className="mt-auto flex flex-col items-center gap-3.5 pb-4">
          {/* <NotificationCenter
            variant="ghost"
            side="right"
            align="end"
            className="hover:bg-accent/80 group rounded-md transition-colors"
          />
          <ThemeSwitcher /> */}
          {user ? (
            <>
              <Tooltip>
                <TooltipTrigger asChild>
                  <a
                    href={"/auth"}
                    className="cursor-pointer"
                    aria-label="Profile"
                  >
                    <Avatar>
                      {user.image && (
                        <AvatarImage src={user.image} alt={user.name} />
                      )}
                      <AvatarFallback className="bg-primary text-primary-foreground">
                        {getInitials(user.name)}
                      </AvatarFallback>
                    </Avatar>
                  </a>
                </TooltipTrigger>
                <TooltipContent>
                  <p className="font-medium">{user.name}</p>
                </TooltipContent>
              </Tooltip>

              <Button
                onClick={() => {
                  async function signOut() {
                    await authClient.signOut({
                      fetchOptions: {
                        onSuccess: () => {
                          // navigate(("/auth/login"));
                        },
                      },
                    });
                  }

                  void signOut();
                }}
                variant="ghost"
                size="icon"
                className="size-10 cursor-pointer rounded-md"
                aria-label="Logout"
              >
                <LogOut className="size-5" />
              </Button>
            </>
          ) : (
            <a
              href={"/auth/login"}
              className="cursor-pointer"
              aria-label="Login"
            >
              <Avatar>
                <AvatarFallback className="bg-primary text-primary-foreground">
                  {getInitials("Guest")}
                </AvatarFallback>
              </Avatar>
            </a>
          )}
        </div>
      </aside>
      {isOpen && (
        <>
          <div
            onClick={() => {
              setIsOpen(false);
            }}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                setIsOpen(false);
              }
            }}
            className="fixed inset-0 z-40 cursor-default md:hidden"
          ></div>

          <div
            // transition:fly={{ y: 10, duration: 200, easing: cubicOut }}
            className="fixed right-4 bottom-24 z-50 flex w-72 origin-bottom-right flex-col overflow-hidden rounded-2xl border border-white/10 bg-zinc-950/80 shadow-2xl shadow-black/50 backdrop-blur-xl md:hidden"
          >
            <div className="p-3">
              {user ? (
                <div className="mb-4 flex items-center justify-between px-2">
                  <a
                    href="/auth"
                    className="flex items-center gap-3"
                    onClick={() => {
                      setIsOpen(false);
                    }}
                  >
                    <Avatar className="size-8">
                      {user.image && (
                        <AvatarImage src={user.image} alt={user.name} />
                      )}
                      <AvatarFallback className="bg-primary text-primary-foreground text-xs">
                        {getInitials(user.name)}
                      </AvatarFallback>
                    </Avatar>
                    <p className="text-foreground/90 text-sm font-medium">
                      {user.username}
                    </p>
                  </a>

                  <div className="flex items-center gap-1">
                    {/* <ThemeSwitcher /> */}
                    <Button
                      onClick={() => {
                        async function login() {
                          await authClient.signOut({
                            fetchOptions: {
                              onSuccess: () => {
                                // ("/auth/login");
                              },
                            },
                          });
                        }

                        void login();
                      }}
                      variant="ghost"
                      size="icon"
                      className="text-muted-foreground hover:text-foreground size-8 rounded-full hover:bg-white/10"
                      aria-label="Logout"
                    >
                      <LogOut className="size-4" />
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="mb-4 flex items-center gap-3 px-2">
                  <Avatar className="size-8">
                    <AvatarFallback className="bg-primary text-primary-foreground">
                      {getInitials("Guest")}
                    </AvatarFallback>
                  </Avatar>
                  <p className="text-sm font-medium">Guest</p>
                </div>
              )}

              <nav
                className="flex flex-col gap-1"
                aria-label="Mobile Navigation"
              >
                {items.map((item) => (
                  <a
                    key={item.href}
                    href={item.href}
                    onClick={() => {
                      setIsOpen(false);
                    }}
                    className={cn(
                      "hover:text-foreground flex w-full items-center gap-3 rounded-xl px-4 py-2.5 text-sm font-medium transition-colors hover:bg-white/10",
                      currentPath === item.href
                        ? "text-primary bg-white/10"
                        : "text-muted-foreground",
                    )}
                    aria-current={
                      currentPath === item.href ? "page" : undefined
                    }
                  >
                    <item.icon className="size-4" />
                    <span>{item.label}</span>
                  </a>
                ))}
              </nav>
            </div>
          </div>
        </>
      )}
    </>
  );
}
