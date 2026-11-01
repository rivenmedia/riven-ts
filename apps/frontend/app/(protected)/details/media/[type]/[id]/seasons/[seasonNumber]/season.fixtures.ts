import type { CastMember } from "#app/_types/__generated__/graphql.ts";
import type { GetSeasonQuery } from "./_queries/get-season.query.typegen.ts";

type Show = GetSeasonQuery["tmdbItem"];
type Season = NonNullable<Show["season"]>;

export const show = {
  __typename: "TmdbIndexerData",
  id: "371028",
  type: "show",
  title: "Arcane",
  backdropUrl:
    "https://image.tmdb.org/t/p/original/sYXLeu5usz6yEz0k00FYvtEdodD.jpg",
  logo: null,
} as const satisfies Omit<Show, "season">;

const episodes = [
  ["Welcome to the Playground", "2021-11-06T00:00:00.000Z"],
  ["Some Mysteries Are Better Left Unsolved", "2021-11-06T00:00:00.000Z"],
  ["The Base Violence Necessary for Change", "2021-11-06T00:00:00.000Z"],
  ["Happy Progress Day!", "2021-11-13T00:00:00.000Z"],
  ["Everybody Wants to Be My Enemy", "2021-11-13T00:00:00.000Z"],
  ["When These Walls Come Tumbling Down", "2021-11-13T00:00:00.000Z"],
  ["The Boy Savior", "2021-11-20T00:00:00.000Z"],
  ["Oil and Water", "2021-11-20T00:00:00.000Z"],
  ["The Monster You Created", "2021-11-20T00:00:00.000Z"],
] as const;

export const season = {
  __typename: "IndexerSeason",
  id: "1886658",
  number: 1,
  title: "Season 1",
  overview:
    "Raised in the undercity of Zaun, sisters Vi and Powder find themselves on opposite sides of a conflict between the city's haves and have-nots.",
  posterUrl:
    "https://artworks.thetvdb.com/banners/v4/season/830385/posters/6187fabf54442.jpg",
  episodes: episodes.map(([title, airDate], index) => ({
    __typename: "IndexerEpisode",
    id: `episode-${String(index + 1)}`,
    number: index + 1,
    seasonNumber: 1,
    title,
    overview:
      "Two sisters fight on rival sides of a war between magic technologies and clashing convictions.",
    airDate,
    runtime: 40,
    posterUrl: null,
  })),
} as const satisfies Season;

export const cast = [
  {
    __typename: "CastMember",
    id: "1360990",
    name: "Hailee Steinfeld",
    character: "Vi",
    profileUrl:
      "https://artworks.thetvdb.com/banners/v4/actor/327453/photo/673b757403cbb.jpg",
  },
  {
    __typename: "CastMember",
    id: "1381717",
    name: "Ella Purnell",
    character: "Jinx",
    profileUrl:
      "https://artworks.thetvdb.com/banners/v4/actor/599610/photo/673af66279aeb.jpg",
  },
] as const satisfies CastMember[];
