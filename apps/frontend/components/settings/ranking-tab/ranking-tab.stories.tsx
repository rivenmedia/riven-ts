import { preview } from "#.storybook/preview.tsx";
import { RankingTab } from "#components/settings/ranking-tab/ranking-tab.tsx";

const meta = preview.meta({
  title: "Settings / RankingTab",
  component: RankingTab,
});

export const Balanced = meta.story({
  args: {
    selectedProfile: "balanced",
  },
});

export const BestQuality = meta.story({
  args: {
    selectedProfile: "best-quality",
  },
});

export const Custom = meta.story({
  args: {
    selectedProfile: "custom",
  },
});
