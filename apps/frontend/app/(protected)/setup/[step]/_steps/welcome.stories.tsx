import { preview } from "#.storybook/preview.tsx";

import { SetupWelcomeStep } from "./welcome.tsx";

const meta = preview.meta({
  title: "Setup / Welcome",
  component: SetupWelcomeStep,
});

export const Default = meta.story();
