import { preview } from "@/.storybook/preview";

import { PluginsTab } from "./plugins-tab";

const meta = preview.meta({
  title: "Settings / PluginsTab",
  component: PluginsTab,
});

export const Default = meta.story({
  args: {
    plugins: [
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
    ],
  },
});
