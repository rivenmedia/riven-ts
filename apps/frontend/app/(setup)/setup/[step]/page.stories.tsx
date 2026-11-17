import { preview } from "#.storybook/preview.tsx";
import {
  customProfile,
  defaultProfile,
} from "#app/(protected)/settings/ranking/_components/ranking-profiles.fixtures.ts";
import SetupStepPage from "#app/(setup)/setup/[step]/page.tsx";
import { createRankingProfilesHandler } from "#mocks/handlers/ranking-profiles.handler.ts";

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
  beforeEach({ msw }) {
    msw.use(createRankingProfilesHandler([defaultProfile, customProfile]));
  },
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
