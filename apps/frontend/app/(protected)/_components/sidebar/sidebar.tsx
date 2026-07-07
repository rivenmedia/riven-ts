import { Mountain } from "lucide-react";
import Link from "next/link";

import { ThemeSwitcher } from "@/components/theme-switcher";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn, getInitials } from "@/lib/utils";

import { LogOutButton } from "./_components/log-out-button";

import type { User } from "@/lib/auth/types";
import type { ComponentProps, ComponentType } from "react";

export interface SidebarItem {
  href: Extract<ComponentProps<typeof Link>["href"], string>;
  icon: ComponentType<React.SVGProps<SVGSVGElement>>;
  label: string;
}

interface SidebarProps {
  currentPath: string;
  items: SidebarItem[];
  user: User | undefined;
}

export function Sidebar({ currentPath, items, user }: SidebarProps) {
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
            const isCurrentPath = currentPath === item.href;

            return (
              <Tooltip key={item.href}>
                <TooltipTrigger asChild>
                  <Link
                    href={item.href}
                    className={cn(
                      "hover:bg-accent/80 group relative flex h-10 w-10 items-center justify-center rounded-md transition-colors",
                      isCurrentPath ? "bg-accent" : "",
                    )}
                    aria-label={item.label}
                    aria-current={isCurrentPath ? "page" : undefined}
                  >
                    <IconComponent className="size-5" />
                  </Link>
                </TooltipTrigger>
                <TooltipContent side="right">
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
          /> */}
          <ThemeSwitcher />
          {user ? (
            <>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Link
                    href="/profile"
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
                  </Link>
                </TooltipTrigger>
                <TooltipContent side="right">
                  <p className="font-medium">{user.name}</p>
                </TooltipContent>
              </Tooltip>
              <LogOutButton />
            </>
          ) : (
            <Link aria-label="Login" className="cursor-pointer" href="/login">
              <Avatar>
                <AvatarFallback className="bg-primary text-primary-foreground">
                  {getInitials("Guest")}
                </AvatarFallback>
              </Avatar>
            </Link>
          )}
        </div>
      </aside>
    </>
  );
}
