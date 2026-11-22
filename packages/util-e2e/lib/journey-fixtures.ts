interface JourneyMovie {
  tmdbId: number;
  title: string;
  /** TMDB's `YYYY-MM-DD` release date */
  releaseDate: string;
}

interface JourneyShow {
  tmdbId: number;
  tvdbId: number;
  title: string;
  /** TMDB's `YYYY-MM-DD` first air date */
  firstAirDate: string;
}

/**
 * The data a journey's mock scenario serves and its spec asserts on, keyed by journey.
 * Each journey adds its own entry, so the scenario and the spec share one source.
 */
export const journeyFixtures = {
  /** What the home page shows from TMDB */
  home: {
    nowPlaying: {
      tmdbId: 603_692,
      title: "John Wick: Chapter 4",
      releaseDate: "2023-03-24",
    },
    trendingMoviesToday: {
      tmdbId: 299_534,
      title: "Avengers: Endgame",
      releaseDate: "2019-04-24",
    },
    trendingMoviesThisWeek: {
      tmdbId: 1_368_337,
      title: "The Odyssey",
      releaseDate: "2026-07-17",
    },
    trendingShows: {
      today: {
        tmdbId: 1396,
        tvdbId: 81_189,
        title: "Breaking Bad",
        firstAirDate: "2008-01-20",
      },
      thisWeek: {
        tmdbId: 94_605,
        tvdbId: 371_028,
        title: "Arcane",
        firstAirDate: "2024-11-09",
      },
    },
  },
} as const satisfies {
  home: {
    nowPlaying: JourneyMovie;
    trendingMoviesToday: JourneyMovie;
    trendingMoviesThisWeek: JourneyMovie;
    trendingShows: Record<"today" | "thisWeek", JourneyShow>;
  };
} & Record<string, unknown>;
