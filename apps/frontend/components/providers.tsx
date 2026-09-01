"use client";

import { ThemeProvider, themes } from "@/components/providers/theme-provider";

import { ProgressProvider } from "@bprogress/next/app";

import { TooltipProvider } from "./_ui/tooltip";
import { Toaster } from "./toaster/toaster";

import type { PropsWithChildren } from "react";

export const Providers = ({ children }: Required<PropsWithChildren>) => (
  <ThemeProvider
    attribute="data-theme"
    defaultTheme="darkmatter"
    themes={Object.keys(themes)}
  >
    <ProgressProvider
      height="4px"
      color="var(--color-primary)"
      options={{ showSpinner: false }}
      shallowRouting
    >
      <Toaster />
      <TooltipProvider>{children}</TooltipProvider>
    </ProgressProvider>
  </ThemeProvider>
);
