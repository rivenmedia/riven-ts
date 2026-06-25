import { fontMono, fontSansSerif, fontSerif } from "./fonts.ts";

import "@/lib/styles/themes/all.css";
import "./globals.css";

import { Providers } from "./providers.tsx";

import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Riven",
  description: "Riven",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`h-full antialiased ${fontSansSerif.variable} ${fontMono.variable} ${fontSerif.variable}`}
      suppressHydrationWarning
    >
      <head />
      <body className="min-h-full flex flex-col">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
