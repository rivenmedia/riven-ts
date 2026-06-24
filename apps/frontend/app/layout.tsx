import "@/lib/styles/themes/all.css";
import "./fonts.ts";
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
      className="h-full antialiased font-sans"
      suppressHydrationWarning
    >
      <head />
      <body className="min-h-full flex flex-col">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
