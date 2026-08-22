import { JetBrains_Mono, Merriweather, Oxanium } from "next/font/google";

export const fontSansSerif = Oxanium({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

export const fontMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  display: "swap",
});

export const fontSerif = Merriweather({
  subsets: ["latin"],
  variable: "--font-serif",
  display: "swap",
});
