import { preview } from "@/.storybook/preview";

import { SetupReviewStep } from "./review";

const meta = preview.meta({
  title: "Setup / Review",
  component: SetupReviewStep,
});

export const Ready = meta.story({
  args: {
    blockers: [],
    enabledProfileCount: 1,
    readyToComplete: true,
    validPluginCount: 3,
  },
});

export const Blocked = meta.story({
  args: {
    blockers: ["No plugins enabled"],
    enabledProfileCount: 1,
    readyToComplete: false,
    validPluginCount: 0,
  },
});
