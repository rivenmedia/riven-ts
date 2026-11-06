"use client";

import { useRouter, useSelectedLayoutSegment } from "next/navigation";

import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "#components/_ui/tabs.tsx";
import { isFeatureEnabled } from "#lib/enabled-features.ts";

import type { PropsWithChildren } from "react";

interface TabSection {
  label: string;
}

const sections = {
  general: { label: "General" },
  plugins: { label: "Plugins" },
  ...(isFeatureEnabled("rankingTab") ? { ranking: { label: "Ranking" } } : {}),
} as const satisfies Record<string, TabSection>;

function isValidSection(value: string): value is keyof typeof sections {
  return value in sections;
}

/**
 * Tabs for switching between the settings routes, with the active route
 * rendered as the selected tab's panel.
 */
export function SettingsNav({ children }: PropsWithChildren) {
  const activeSegment = useSelectedLayoutSegment() ?? "";
  const router = useRouter();

  return (
    <Tabs
      value={activeSegment}
      onValueChange={(value) => {
        if (!isValidSection(value)) {
          throw new Error(`Invalid section: ${value}`);
        }

        router.push(`/settings/${value}`);
      }}
    >
      <TabsList className="mb-4 w-full justify-start">
        {Object.entries(sections).map(([segment, { label }]) => (
          <TabsTrigger key={segment} value={segment}>
            {label}
          </TabsTrigger>
        ))}
      </TabsList>
      <TabsContent value={activeSegment}>{children}</TabsContent>
    </Tabs>
  );
}
