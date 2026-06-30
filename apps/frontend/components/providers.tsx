"use client";

import { ThemeProvider } from "@/components/providers/theme-provider";

import { ProgressProvider } from "@bprogress/next/app";
import { ToastContainer } from "react-toastify";

import type { PropsWithChildren } from "react";

export const Providers = ({ children }: Required<PropsWithChildren>) => {
  return (
    <ThemeProvider
      attribute="data-theme"
      defaultTheme="darkmatter"
      themes={[
        "amberminimal",
        "amethysthaze",
        "bubblegum",
        "caffeine",
        "catppuccin",
        "cyberpunk",
        "darkmatter",
        "doom64",
        "galacticglitch",
        "graphite",
        "mochamousse",
        "mono",
        "neobrutalism",
        "solardusk",
        "t3-chat",
      ]}
    >
      <ProgressProvider
        height="4px"
        color="#fffd00"
        options={{ showSpinner: false }}
        shallowRouting
      >
        <ToastContainer />
        {children}
      </ProgressProvider>
    </ThemeProvider>
  );
};
