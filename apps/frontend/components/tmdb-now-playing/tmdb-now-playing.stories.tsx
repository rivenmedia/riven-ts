import { preview } from "@/.storybook/preview";

import { TmdbNowPlaying } from "./tmdb-now-playing";

const meta = preview.meta({
  title: "Components / TmdbNowPlaying",
  component: TmdbNowPlaying,
  args: {
    data: [
      {
        id: 603_692,
        mediaType: "movie",
        title: "John Wick: Chapter 4",
        backdropPath:
          "https://image.tmdb.org/t/p/original/i3OTGmLNOZIo4SRQLVfLjeWegB6.jpg",
        releaseDate: "2023-03-24",
        voteAverage: 7.8,
        originalLanguage: "en",
        overview:
          "With the price on his head ever increasing, John Wick uncovers a path to defeating The High Table.",
        genreIds: [28, 53],
      },
      {
        id: 94_605,
        mediaType: "tv",
        title: "Arcane",
        backdropPath:
          "https://image.tmdb.org/t/p/original/sYXLeu5usz6yEz0k00FYvtEdodD.jpg",
        firstAirDate: "2024-11-09",
        voteAverage: 9.1,
        originalLanguage: "en",
        overview:
          "Amid the stark discord of twin cities Piltover and Zaun, two sisters fight on rival sides of a war.",
        genreIds: [16, 10_759],
      },
    ],
  },
});

export const Default = meta.story();
