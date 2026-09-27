import { Button } from "@/components/_ui/button";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/_ui/tabs";

import { SinglePluginTab } from "./_components/single-plugin-tab";

import type { SettingFieldProps } from "../setting-field/setting-field";

export interface PluginTab {
  title: string;
  id: string;
  isEnabled: boolean;
  fields: readonly [SettingFieldProps, ...SettingFieldProps[]];
}

export interface PluginsTabProps {
  plugins: PluginTab[];
}

export function PluginsTab({ plugins }: PluginsTabProps) {
  if (plugins.length === 0) {
    return (
      <p className="text-muted-foreground text-sm">No plugins registered.</p>
    );
  }

  if (!plugins[0]) {
    throw new Error("No valid plugin found.");
  }

  return (
    <div className="flex gap-6">
      <Tabs
        defaultValue={plugins[0].id}
        orientation="vertical"
        className="w-full gap-4"
      >
        <TabsList variant="line">
          {plugins.map((plugin) => (
            <TabsTrigger key={plugin.id} asChild value={plugin.id}>
              <Button key={plugin.title} variant="ghost" type="button">
                {plugin.title}
              </Button>
            </TabsTrigger>
          ))}
        </TabsList>
        {plugins.map((plugin) => (
          <TabsContent
            key={plugin.id}
            value={plugin.id}
            className="gap-4 flex flex-col"
          >
            <SinglePluginTab plugin={plugin} />
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}
