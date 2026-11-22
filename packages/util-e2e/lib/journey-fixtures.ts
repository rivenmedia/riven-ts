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

const library = {
  movie: {
    tmdbId: 346_364,
    title: "It",
    releaseDate: "2017-09-08",
    year: 2017,
    posterUrl:
      "https://image.tmdb.org/t/p/w300/9E2y5Q7WlCVNEhP5GiVTjhEhx1o.jpg",
    state: "completed",
  },
  show: {
    tmdbId: 94_605,
    tvdbId: 371_028,
    title: "Arcane",
    firstAirDate: "2021-11-06",
    year: 2021,
    posterUrl:
      "https://image.tmdb.org/t/p/w300/fqldf2t8ztc9aiwn3k6mlX3tvRT.jpg",
    state: "indexed",
  },
} as const;

const { movie: libraryMovie, show: libraryShow } = library;

/**
 * The data a journey's mock scenario serves and its spec asserts on, keyed by journey.
 * Each journey adds its own entry, so the scenario and the spec share one source.
 */
export const journeyFixtures = {
  /** What the library lists, and the details of its movie */
  library,
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
  /** The details of items that haven't been requested, which come from the library's movie and show */
  mediaDetails: {
    unrequestedMovie: {
      ...libraryMovie,
      overview:
        "In a small town in Maine, seven children known as The Losers Club come face to face with life problems, bullies and a monster that takes the shape of a clown called Pennywise.",
      cast: [
        {
          tmdbId: 1_500_001,
          name: "Jaeden Martell",
          character: "Bill Denbrough",
        },
      ],
      recommendation: { tmdbId: 1_500_002, title: "Clown in a Cornfield" },
      similar: { tmdbId: 1_500_003, title: "It Chapter 2" },
    },
    unrequestedShow: {
      ...libraryShow,
      overview:
        "Amid the stark discord of twin cities Piltover and Zaun, two sisters fight on rival sides of a war between magic technologies and clashing convictions.",
      cast: [
        { tmdbId: 1_500_101, name: "Ella Purnell", character: "Jinx" },
        { tmdbId: 1_500_102, name: "Hailee Steinfeld", character: "Vi" },
      ],
    },
    season: {
      tvdbId: 1_886_658,
      number: 1,
      title: "Season 1",
    },
    episode: {
      tvdbId: 8_001_007,
      number: 7,
      title: "The Boy Savior",
      airDate: "2021-11-20",
      cast: [{ tmdbId: 1_500_102, name: "Hailee Steinfeld", character: "Vi" }],
    },
  },
} as const satisfies {
  library: {
    movie: JourneyMovie & { year: number; posterUrl: string; state: string };
    show: JourneyShow & { year: number; posterUrl: string; state: string };
  };
  home: {
    nowPlaying: JourneyMovie;
    trendingMoviesToday: JourneyMovie;
    trendingMoviesThisWeek: JourneyMovie;
    trendingShows: Record<"today" | "thisWeek", JourneyShow>;
  };
} & Record<string, unknown>;
