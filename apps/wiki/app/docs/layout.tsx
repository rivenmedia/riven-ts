import { DocsLayout } from "fumadocs-ui/layouts/docs";

import { source } from "@/lib/source";

import type { ReactNode } from "react";

export default function Layout({ children }: { children: ReactNode }) {
  return (
    <DocsLayout
      tree={source.pageTree}
      nav={{
        title: <span className="font-bold tracking-tight">Riven</span>,
      }}
      links={[
        { text: "Generator", url: "/generator" },
        {
          text: "GitHub",
          url: "https://github.com/rivenmedia/riven-ts",
          external: true,
        },
      ]}
    >
      {children}
    </DocsLayout>
  );
}
