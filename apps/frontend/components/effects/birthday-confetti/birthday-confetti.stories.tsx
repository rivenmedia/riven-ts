import { BirthdayConfetti } from "@repo/util-ui/components/effects/birthday-confetti/birthday-confetti.tsx";

import { preview } from "#.storybook/preview.tsx";

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
