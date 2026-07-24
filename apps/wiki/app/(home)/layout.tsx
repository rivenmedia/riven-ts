import { HomeLayout } from "fumadocs-ui/layouts/home";

import type { ReactNode } from "react";

export default function Layout({ children }: { children: ReactNode }) {
  return (
    <HomeLayout
      nav={{
        title: <span className="font-bold tracking-tight">Riven</span>,
      }}
      links={[
        { text: "Docs", url: "/docs" },
        { text: "Generator", url: "/generator" },
        {
          text: "GitHub",
          url: "https://github.com/rivenmedia/riven-ts",
          external: true,
        },
        {
          text: "Discord",
          url: "https://discord.riven.tv",
          external: true,
        },
      ]}
    >
      {children}
    </HomeLayout>
  );
}
