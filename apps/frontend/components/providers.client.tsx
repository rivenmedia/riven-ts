"use client";

import { TooltipProvider } from "@repo/util-ui/components/_ui/tooltip.tsx";
import { Toaster } from "@repo/util-ui/components/toaster/toaster.tsx";

import { ProgressProvider } from "@bprogress/next/app";

import { NotificationsProvider } from "./providers/notifications-provider.tsx";

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
