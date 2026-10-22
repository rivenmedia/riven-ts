import { preview } from "#.storybook/preview.tsx";
import { SetupWelcomeStep } from "#app/(protected)/setup/[step]/_steps/welcome.tsx";

const meta = preview.meta({
  title: "Setup / Welcome",
  component: SetupWelcomeStep,
});

export const Default = meta.story();
