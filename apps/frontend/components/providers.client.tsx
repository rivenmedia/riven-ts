"use client";

import { ProgressProvider } from "@bprogress/next/app";

import { TooltipProvider } from "./_ui/tooltip";
import { NotificationsProvider } from "./providers/notifications-provider";
import { Toaster } from "./toaster/toaster";

import type { PropsWithChildren } from "react";

export function ClientProviders({ children }: PropsWithChildren) {
  return (
    <NotificationsProvider>
      <ProgressProvider
        height="4px"
        color="var(--color-primary)"
        options={{ showSpinner: false }}
        shallowRouting
      >
        <Toaster />
        <TooltipProvider>{children}</TooltipProvider>
      </ProgressProvider>
    </NotificationsProvider>
  );
}
