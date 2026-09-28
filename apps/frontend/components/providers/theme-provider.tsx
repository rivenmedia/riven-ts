"use client";

import { createThemes } from "@wrksz/themes/client";

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
} as const satisfies Record<string, string>;

type Theme = keyof typeof themes;

const themeConfig = createThemes({
  attribute: "data-theme",
  defaultTheme: "darkmatter",
  themes: Object.keys(themes) as [Theme, ...Theme[]],
});

export const {
  ThemeProvider,
  useTheme,
  ThemedImage,
  useThemeEffect,
  useThemeValue,
} = themeConfig;
