"use client";

import { ProgressProvider } from "@bprogress/next/app";
import { ToastContainer } from "react-toastify";

import { ThemeProvider, themes } from "@/components/providers/theme-provider";

import { TooltipProvider } from "./ui/tooltip";

import type { PropsWithChildren } from "react";

export const Providers = ({ children }: Required<PropsWithChildren>) => {
  return (
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
        <ToastContainer />
        <TooltipProvider>{children}</TooltipProvider>
      </ProgressProvider>
    </ThemeProvider>
  );
};
