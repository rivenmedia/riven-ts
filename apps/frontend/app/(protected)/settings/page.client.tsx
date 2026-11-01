import { Suspense } from "react";

import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "#components/_ui/tabs.tsx";
import { ErrorFallback } from "#components/error-fallback/error-fallback.tsx";
import { PageShell } from "#components/page-shell/page-shell.tsx";
import { PluginsTab } from "#components/settings/plugins-tab/plugins-tab.tsx";
import { RankingTab } from "#components/settings/ranking-tab/ranking-tab.tsx";

import { DangerZone } from "./_components/danger-zone/danger-zone";
import { GeneralTab } from "./_components/general-tab/general-tab";

interface SettingsPageProps {
  canManageSettings: boolean;
}

/** Settings route with General, Plugins and Ranking tabs. */
export function SettingsPage({ canManageSettings }: SettingsPageProps) {
  return (
    <PageShell>
      <div className="mx-auto w-full max-w-5xl">
        <div className="mb-8">
          <h1 className="text-3xl font-semibold tracking-tight">Settings</h1>
          <p className="text-muted-foreground mt-1 text-sm">
            Configure Riven, plugins, and ranking preferences.
          </p>
        </div>
        <Tabs defaultValue="general">
          <TabsList className="mb-6 w-full justify-start">
            <TabsTrigger value="general">General</TabsTrigger>
            <TabsTrigger value="plugins">Plugins</TabsTrigger>
            <TabsTrigger value="ranking">Ranking</TabsTrigger>
          </TabsList>
          <TabsContent value="general">
            <ErrorFallback message="Failed to load settings">
              <Suspense fallback={<div>Loading...</div>}>
                <GeneralTab />
              </Suspense>
            </ErrorFallback>
            {canManageSettings && (
              <div className="mt-8">
                <DangerZone />
              </div>
            )}
          </TabsContent>
          <TabsContent value="plugins">
            <PluginsTab
              plugins={[
                {
                  title: "@repo/plugin-comet",
                  id: "example-plugin-1",
                  isEnabled: true,
                  fields: [
                    {
                      type: "text",
                      config: {
                        label: "API Key",
                        name: "apiKey",
                      },
                    },
                  ],
                },
                {
                  title: "@repo/plugin-stremthru",
                  id: "example-plugin-2",
                  isEnabled: false,
                  fields: [
                    {
                      type: "text",
                      config: {
                        label: "Example Field",
                        description: "This is an example field.",
                        name: "exampleField",
                      },
                    },
                  ],
                },
              ]}
            />
          </TabsContent>
          <TabsContent value="ranking">
            <RankingTab selectedProfile="balanced" />
          </TabsContent>
        </Tabs>
      </div>
    </PageShell>
  );
}
