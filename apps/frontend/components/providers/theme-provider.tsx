"use client";

import { ThemeProvider as NextThemesProvider } from "next-themes";

export const themes = {
  amberminimal: "Amber Minimal",
  amethysthaze: "Amethyst Haze",
  bubblegum: "Bubblegum",
  caffeine: "Caffeine",
  catppuccin: "Catppuccin",
  cyberpunk: "Cyberpunk",
  darkmatter: "Dark Matter",
  doom64: "Doom 64",
  galacticglitch: "Galactic Glitch",
  graphite: "Graphite",
  mochamousse: "Mocha Mousse",
  mono: "Mono",
  neobrutalism: "Neo Brutalism",
  solardusk: "Solar Dusk",
  "t3-chat": "T3 Chat",
} as const;

export function ThemeProvider({
  children,
  ...props
}: React.ComponentProps<typeof NextThemesProvider>) {
  return <NextThemesProvider {...props}>{children}</NextThemesProvider>;
}
