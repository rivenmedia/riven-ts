import { preview } from "@/.storybook/preview";

import { BirthdayConfetti } from "./birthday-confetti";

const meta = preview.meta({
  title: "Effects / BirthdayConfetti",
  component: BirthdayConfetti,
  parameters: {
    layout: "fullscreen",
  },
  tags: ["!snapshot"],
});

export const Active = meta.story({
  args: { active: true },
});

export const Inactive = meta.story({
  args: { active: false },
});
