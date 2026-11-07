import { preview } from "#.storybook/preview.tsx";
import { RatingsRow } from "#components/media/ratings-row/ratings-row.tsx";

const meta = preview.meta({
  title: "Media / RatingsRow",
  component: RatingsRow,
});

export const Default = meta.story({
  args: {
    loading: false,
    scores: new Map([
      [
        "TMDB",
        {
          name: "TMDB",
          score: "7.8",
          url: "https://www.themoviedb.org",
          logo: "tmdb.svg",
        },
      ],
      [
        "IMDb",
        {
          name: "IMDb",
          score: "8.1",
          url: "https://www.imdb.com",
          logo: "imdb.svg",
        },
      ],
    ]),
  },
});

export const Loading = meta.story({
  args: {
    loading: true,
    scores: new Map(),
  },
});

export const Empty = meta.story({
  args: {
    loading: false,
    scores: new Map(),
  },
});
