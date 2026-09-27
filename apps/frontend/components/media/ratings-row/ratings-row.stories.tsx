import { preview } from "@/.storybook/preview";

import { RatingsRow } from "./ratings-row";

const meta = preview.meta({
  title: "Media / RatingsRow",
  component: RatingsRow,
});

export const Default = meta.story({
  args: {
    loading: false,
    scores: [
      {
        name: "TMDB",
        score: "7.8",
        url: "https://www.themoviedb.org",
        image: "tmdb.svg",
      },
      {
        name: "IMDb",
        score: "8.1",
        url: "https://www.imdb.com",
        image: "imdb.svg",
      },
    ],
  },
});

export const Loading = meta.story({
  args: {
    loading: true,
    scores: null,
  },
});

export const Empty = meta.story({
  args: {
    loading: false,
    scores: [],
  },
});
