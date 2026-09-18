import { preview } from "@/.storybook/preview";

import { HomePage } from "./page.client";

import type { MediaItem } from "@repo/util-plugin-sdk/dto/entities";

const meta = preview.meta({
  title: "Pages / Home",
  component: HomePage,
  args: {
    nowPlaying: [
      {
        id: "603692",
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
        certification: "15",
        ratings: [
          {
            name: "imdb",
            image: "imdb.svg",
            score: "7.6",
            url: "https://www.imdb.com/title/tt10366206/",
          },
          {
            name: "rottentomatoes",
            image: "rottentomatoes_certified_fresh.svg",
            score: "94%",
            url: "https://www.rottentomatoes.com/m/john_wick_chapter_4",
          },
        ],
        logo: "https://image.tmdb.org/t/p/original/24dIhRKjLnYRanA2Mo0ycZfObUp.png",
      },
      {
        id: "94605",
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
        certification: "12A",
        ratings: [],
        logo: "https://image.tmdb.org/t/p/original/jXLNOzeEA8AoJy92dJTUUZXTMxK.png",
      },
      {
        id: "1291595",
        mediaType: "movie",
        title: "Insidious: Out of the Further",
        backdropPath:
          "https://image.tmdb.org/t/p/original/hD8y787ciNWQ2bn396YrSsOIzdN.jpg",
        releaseDate: "2026-08-21",
        voteAverage: 6.5,
        originalLanguage: "en",
        overview:
          "Gemma, a young mother raising her daughter in the house she grew up in, discovers she can travel into The Further, where she possesses an ability to bring what lives there back to the real world.",
        genreIds: [27],
        certification: "18",
        ratings: [],
        logo: "https://image.tmdb.org/t/p/original/iGjbP4jYzzbINDtd9kScypQOlmw.png",
      },
    ],
    trendingMoviesPromise: Promise.resolve<Partial<MediaItem>[]>([
      {
        id: "0000-0000-0000-0000-0000",
        posterPath: "",
        title: "Mivie",
        type: "movie",
        year: 2024,
      },
    ]),
    trendingShowsPromise: Promise.resolve<Partial<MediaItem>[]>([
      {
        id: "0000-0000-0000-0000-0000",
        posterPath: "",
        title: "Mivie",
        type: "show",
        year: 2024,
      },
    ]),
  },
  parameters: {
    layout: "fullscreen",
  },
});

export const Default = meta.story();
