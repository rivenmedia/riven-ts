import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/_ui/tabs";
import { PageShell } from "@/components/page-shell/page-shell";
import { DangerZone } from "@/components/settings/danger-zone/danger-zone";
import { GeneralTab } from "@/components/settings/general-tab/general-tab";
import { PluginsTab } from "@/components/settings/plugins-tab/plugins-tab";

import { useState } from "react";

export function SettingsPage() {
  const [activeTab, setActiveTab] = useState("general");

  const canManageSettings = true;

  return (
    <PageShell>
      <div className="mx-auto w-full max-w-5xl">
        <div className="mb-8">
          <h1 className="text-3xl font-semibold tracking-tight">Settings</h1>
          <p className="text-muted-foreground mt-1 text-sm">
            Configure Riven, plugins, and ranking preferences.
          </p>
        </div>
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-6 w-full justify-start">
            <TabsTrigger value="general">General</TabsTrigger>
            <TabsTrigger value="plugins">Plugins</TabsTrigger>
          </TabsList>
          <TabsContent value="general">
            <GeneralTab
              data={{
                enableNotifications: true,
                instanceName: "",
                logLevel: "DEBUG",
              }}
            />
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
        </Tabs>
      </div>
    </PageShell>
  );
}
