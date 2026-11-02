"use client";

import { useRouter, useSelectedLayoutSegment } from "next/navigation";

import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "#components/_ui/tabs.tsx";

import type { ReactNode } from "react";

const sections = [
  { segment: "general", label: "General" },
  { segment: "plugins", label: "Plugins" },
  { segment: "ranking", label: "Ranking" },
] as const;

export interface SettingsNavProps {
  /** The active section's route. */
  children: ReactNode;
}

/**
 * Tabs for switching between the settings routes, with the active route
 * rendered as the selected tab's panel.
 */
export function SettingsNav({ children }: SettingsNavProps) {
  const activeSegment = useSelectedLayoutSegment() ?? "";
  const router = useRouter();

  return (
    <Tabs
      value={activeSegment}
      onValueChange={(value) => {
        const section = sections.find(({ segment }) => segment === value);

        if (section) {
          router.push(`/settings/${section.segment}`);
        }
      }}
    >
      <TabsList className="mb-4 w-full justify-start">
        {sections.map(({ segment, label }) => (
          <TabsTrigger key={segment} value={segment}>
            {label}
          </TabsTrigger>
        ))}
      </TabsList>
      <TabsContent value={activeSegment}>{children}</TabsContent>
    </Tabs>
  );
}
