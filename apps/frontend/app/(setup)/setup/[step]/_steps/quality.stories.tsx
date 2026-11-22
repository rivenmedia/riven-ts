import { preview } from "#.storybook/preview.tsx";
import { SetupQualityStep } from "#app/(setup)/setup/[step]/_steps/quality.tsx";

const meta = preview.meta({
  title: "Setup / Quality",
  component: SetupQualityStep,
  args: {
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
