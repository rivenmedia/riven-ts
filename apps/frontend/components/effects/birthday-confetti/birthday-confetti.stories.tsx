import { preview } from "#.storybook/preview.tsx";

import { BirthdayConfetti } from "./birthday-confetti.tsx";

const meta = preview.meta({
  title: "Effects / BirthdayConfetti",
  component: BirthdayConfetti,
  parameters: {
    layout: "fullscreen",
    snapshot: {
      enabled: false,
    },
  },
});

export const Active = meta.story({
  args: { active: true },
});

export const Inactive = meta.story({
  args: { active: false },
});
