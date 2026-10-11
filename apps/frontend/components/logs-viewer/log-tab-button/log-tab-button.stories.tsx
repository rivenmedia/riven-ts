import { fn } from "storybook/test";

import { preview } from "#.storybook/preview.tsx";
import { Tabs, TabsList, TabsTrigger } from "#components/_ui/tabs.tsx";

import { LogTabButton } from "./log-tab-button.tsx";

const meta = preview.meta({
  title: "Logs Viewer / LogTabButton",
  component: LogTabButton,
  args: {
    name: "Live Logs",
    onClick: fn(),
  },
});

export const Active = meta.story({
  render: (args) => (
    <Tabs value="live-logs">
      <TabsList>
        <TabsTrigger value="live-logs" asChild>
          <LogTabButton {...args} />
        </TabsTrigger>
      </TabsList>
    </Tabs>
  ),
});

export const Inactive = meta.story({
  render: (args) => (
    <Tabs value="not-live-logs">
      <TabsList>
        <TabsTrigger value="live-logs" asChild>
          <LogTabButton {...args} />
        </TabsTrigger>
      </TabsList>
    </Tabs>
  ),
});
