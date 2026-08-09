import type { LibraryItem } from "../hooks/use-library-items.ts";
import type { MediaItemDetail } from "../hooks/use-media-item.ts";

let idCounter = 0;

function nextId(): LibraryItem["id"] {
  idCounter += 1;

  return `00000000-0000-0000-0000-${idCounter.toString().padStart(12, "0")}`;
}

export function buildLibraryItem(
  overrides: Partial<LibraryItem> = {},
): LibraryItem {
  return {
    __typename: "Movie",
    id: nextId(),
    fullTitle: "Example Movie (2020)",
    state: "completed",
    ...overrides,
  };
}

type MovieDetail = Extract<MediaItemDetail, { __typename: "Movie" }>;
type ShowDetail = Extract<MediaItemDetail, { __typename: "Show" }>;
type SeasonDetail = Extract<MediaItemDetail, { __typename: "Season" }>;
type EpisodeDetail = Extract<MediaItemDetail, { __typename: "Episode" }>;

const COMMON_DETAIL_FIELDS = {
  fullTitle: "Example Title",
  title: "Example Title",
  state: "completed",
  year: 2020,
  rating: 8.1,
  releaseDate: "2020-01-01T00:00:00.000Z",
  genres: ["Drama"],
  network: null,
  country: "US",
  language: "en",
  isAnime: false,
  expectedFileCount: 1,
  scrapedAt: "2020-01-02T00:00:00.000Z",
  scrapedTimes: 1,
  failedScrapeAttempts: 0,
  indexedAt: "2020-01-01T00:00:00.000Z",
  streams: [],
  blacklistedStreams: [],
  filesystemEntries: [],
  subtitles: [],
} satisfies Omit<
  MovieDetail,
  "__typename" | "id" | "movieContentRating" | "runtime" | "tmdbId"
>;

export function buildMovieDetail(
  overrides: Partial<MovieDetail> = {},
): MovieDetail {
  return {
    ...COMMON_DETAIL_FIELDS,
    __typename: "Movie",
    id: nextId(),
    tmdbId: "12345",
    movieContentRating: "PG_13",
    runtime: 120,
    ...overrides,
  };
}

export function buildShowDetail(
  overrides: Partial<ShowDetail> = {},
): ShowDetail {
  return {
    ...COMMON_DETAIL_FIELDS,
    __typename: "Show",
    id: nextId(),
    tvdbId: "6789",
    showContentRating: "TV_14",
    status: "continuing",
    seasons: [],
    ...overrides,
  };
}

export function buildSeasonDetail(
  overrides: Partial<SeasonDetail> = {},
): SeasonDetail {
  return {
    ...COMMON_DETAIL_FIELDS,
    __typename: "Season",
    id: nextId(),
    tvdbId: "6789",
    showContentRating: "TV_14",
    number: 1,
    totalEpisodes: 0,
    show: { __typename: "Show", id: nextId(), title: "Example Show" },
    episodes: [],
    ...overrides,
  };
}

export function buildEpisodeDetail(
  overrides: Partial<EpisodeDetail> = {},
): EpisodeDetail {
  return {
    ...COMMON_DETAIL_FIELDS,
    __typename: "Episode",
    id: nextId(),
    tvdbId: "6789",
    showContentRating: "TV_14",
    number: 1,
    absoluteNumber: 1,
    show: { __typename: "Show", id: nextId(), title: "Example Show" },
    season: { __typename: "Season", id: nextId(), number: 1 },
    ...overrides,
  };
}
