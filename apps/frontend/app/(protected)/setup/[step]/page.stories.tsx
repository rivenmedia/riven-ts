import { preview } from "#.storybook/preview.tsx";

import SetupStepPage from "./page.tsx";

const meta = preview.meta({
  title: "Pages / Setup",
  component: SetupStepPage,
});

export const Welcome = meta.story({
  parameters: {
    nextjs: {
      navigation: {
        pathname: "/setup/welcome",
        segments: [["step", "welcome"]],
      },
    },
  },
});

export const Quality = meta.story({
  parameters: {
    nextjs: {
      navigation: {
        pathname: "/setup/quality",
        segments: [["step", "quality"]],
      },
    },
  },
});

export const Review = meta.story({
  parameters: {
    nextjs: {
      navigation: {
        pathname: "/setup/review",
        segments: [["step", "review"]],
      },
    },
  },
});
