import { preview } from "@/.storybook/preview";

import { BirthdayConfetti } from "./birthday-confetti";

const meta = preview.meta({
  title: "Effects / BirthdayConfetti",
  tags: ["!snapshot"],
  component: BirthdayConfetti,
  parameters: {
    layout: "fullscreen",
  },
});

export const Active = meta.story({
  args: { active: true },
});

export const Inactive = meta.story({
  args: { active: false },
});
