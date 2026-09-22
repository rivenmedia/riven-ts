import preview from "@/.storybook/preview";

import TrendingMoviesPage from "./page";

const meta = preview.meta({
  title: "Pages / Trending / Movies",
  component: TrendingMoviesPage,
});

export const Default = meta.story();
