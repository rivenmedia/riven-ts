import { preview } from "@/.storybook/preview";

import { SetupWelcomeStep } from "./welcome";

const meta = preview.meta({
  title: "Setup / Welcome",
  component: SetupWelcomeStep,
});

export const Default = meta.story();
