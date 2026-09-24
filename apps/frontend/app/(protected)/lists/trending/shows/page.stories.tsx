import preview from "@/.storybook/preview";

import TrendingShowsPage from "./page";

const meta = preview.meta({
  title: "Pages / Trending / Shows",
  component: TrendingShowsPage,
});

export const Default = meta.story();
