import "@/app/global.css";

import SearchDialog from "fumadocs-ui/components/dialog/search-default";
import { RootProvider } from "fumadocs-ui/provider/next";
import { Inter } from "next/font/google";

import type { ReactNode } from "react";
import type { FAQPage, Project, WithContext } from "schema-dts";

const inter = Inter({ subsets: ["latin"] });

const jsonLd: WithContext<FAQPage> = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: [
    {
      "@type": "Question",
      name: "What is Riven?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Riven is a media automation system that uses a virtual file system and debrid services to find, organize, and stream your media. It integrates with Plex, Jellyfin, and many other services.",
      },
    },
    {
      "@type": "Question",
      name: "What is riven-ts?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Riven-TS is the official TypeScript rewrite of Riven, featuring a modern plugin architecture, GraphQL API, and extensible design. It is the actively developed version going forward.",
      },
    },
    {
      "@type": "Question",
      name: "How do I get started with Riven?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Deploy Riven with Docker using our compose generator or follow the documentation at https://riven.tv/docs.",
      },
    },
  ],
};

const jsonLdProject: WithContext<Project> = {
  "@context": "https://schema.org",
  "@type": "Project",
  name: "Riven",
  brand: "Riven Media",
  url: "https://riven.tv",
  description:
    "Riven is a media automation system with a plugin architecture that uses debrid services and a virtual file system to manage your media library.",
  sameAs: ["https://github.com/rivenmedia", "https://discord.riven.tv"],
  foundingDate: "2023-12-03",
  contactPoint: [
    {
      "@type": "ContactPoint",
      email: "contact@riven.tv",
      contactType: "customer support",
      url: "mailto:contact@riven.tv",
      name: "Email Support",
    },
    {
      "@type": "ContactPoint",
      contactType: "customer support",
      url: "https://discord.riven.tv",
      name: "Discord Server",
    },
  ],
};

export const metadata = {
  title: {
    default: "Riven - Media Automation",
    template: "%s | Riven",
  },
  description:
    "Riven is a media automation system with a plugin architecture that uses debrid services and a virtual file system to manage your media library.",
  metadataBase: new URL(
    process.env["NEXT_PUBLIC_BASE_URL"] ?? "https://riven.tv",
  ),
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className={inter.className} suppressHydrationWarning>
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c"),
          }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(jsonLdProject).replace(/</g, "\\u003c"),
          }}
        />
      </head>
      <body className="flex min-h-screen flex-col">
        <RootProvider search={{ SearchDialog, options: { type: "static" } }}>
          {children}
        </RootProvider>
      </body>
    </html>
  );
}
