import { preview } from "@/.storybook/preview";

import { SetupQualityStep } from "./quality";

const meta = preview.meta({
  title: "Setup / Quality",
  component: SetupQualityStep,
  args: {
    generalSections: [
      {
        description: "General settings for quality",
        title: "General",
        fields: [
          {
            type: "text" as const,
            config: {
              label: "Instance Name",
              name: "instanceName",
            },
          },
        ],
      },
    ],
    profiles: [
      {
        label: "Balanced",
        description: "A good mix of quality and file size.",
        id: "balanced",
        enabled: true,
      },
      {
        label: "Best Quality",
        description: "Prioritise the highest resolution and bitrate.",
        id: "best-quality",
        enabled: false,
      },
    ],
  },
});

export const Default = meta.story();
