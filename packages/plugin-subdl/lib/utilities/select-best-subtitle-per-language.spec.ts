import { expect, it as baseIt } from "vitest";

import { selectBestSubtitlePerLanguage } from "./select-best-subtitle-per-language.ts";

import type { SubtitleResponse } from "../schemas/subtitle-response.schema.ts";
import type { ItemMetadata } from "./get-item-metadata.ts";

const it = baseIt.extend("metadata", (): ItemMetadata => ({
  type: "movie",
  tmdbId: "671",
  imdbId: "tt0241527",
  seasonNumber: undefined,
  episodeNumber: undefined,
}));

it("normalizes Brazilian Portuguese variants to one pt-BR subtitle", ({
  metadata,
}) => {
  const results: SubtitleResponse[] = [
    {
      release_name: "Release A",
      name: "Subtitle A",
      lang: "brazillian-portuguese",
      url: "/subtitle-a.zip",
    },
    {
      release_name: "Release B",
      name: "Subtitle B",
      lang: "brazillian portuguese",
      url: "/subtitle-b.zip",
    },
  ];

  const selected = selectBestSubtitlePerLanguage(results, metadata);

  expect([...selected.keys()]).toStrictEqual(["pt-BR"]);
  expect(selected.get("pt-BR")).toBe(results[0]);
});

it("normalizes correctly spelled Brazilian Portuguese variants too", ({
  metadata,
}) => {
  const results: SubtitleResponse[] = [
    {
      release_name: "Release A",
      name: "Subtitle A",
      lang: "Brazilian Portuguese",
      url: "/subtitle-a.zip",
    },
    {
      release_name: "Release B",
      name: "Subtitle B",
      lang: "Brazilian-Portuguese",
      url: "/subtitle-b.zip",
    },
  ];

  const selected = selectBestSubtitlePerLanguage(results, metadata);

  expect([...selected.keys()]).toStrictEqual(["pt-BR"]);
});

it.for([
  ["brasilian portuguese", "pt-BR"],
  ["Brazilian_Portuguese", "pt-BR"],
  ["Brazilian   Portuguese", "pt-BR"],
  ["Portuguese", "portuguese"],
  ["Australian Portuguese", "australian portuguese"],
  ["Brazilian Esperanto", "brazilian esperanto"],
] as const)(
  "maps language %s to %s",
  ([language, expectedLanguage], { metadata }) => {
    const selected = selectBestSubtitlePerLanguage(
      [
        {
          release_name: "Release A",
          name: "Subtitle A",
          lang: language,
          url: "/subtitle-a.zip",
        },
      ],
      metadata,
    );

    expect([...selected.keys()]).toStrictEqual([expectedLanguage]);
  },
);

const episodeSubtitle = (
  name: string,
  season: number | null,
  episode: number | null,
): SubtitleResponse => ({
  release_name: name,
  name,
  lang: "English",
  url: `/${name}.zip`,
  season,
  episode,
});

it("selects a subtitle for the requested episode when searching for an episode", () => {
  const results = [
    episodeSubtitle("other-episode", 3, 4),
    episodeSubtitle("other-season", 2, 5),
    episodeSubtitle("whole-season", 3, null),
    episodeSubtitle("requested-episode", 3, 5),
  ];

  const selected = selectBestSubtitlePerLanguage(results, {
    type: "tv",
    tmdbId: undefined,
    imdbId: "tt0944947",
    seasonNumber: 3,
    episodeNumber: 5,
  });

  expect([...selected]).toStrictEqual([["english", results[3]]]);
});

it("selects nothing when no subtitle is for the requested episode", () => {
  const selected = selectBestSubtitlePerLanguage(
    [episodeSubtitle("other-episode", 3, 4)],
    {
      type: "tv",
      tmdbId: undefined,
      imdbId: "tt0944947",
      seasonNumber: 3,
      episodeNumber: 5,
    },
  );

  expect(selected.size).toBe(0);
});

it("ignores the season and episode of subtitles for a movie", ({
  metadata,
}) => {
  const results = [episodeSubtitle("movie", 1, 1)];

  const selected = selectBestSubtitlePerLanguage(results, metadata);

  expect([...selected]).toStrictEqual([["english", results[0]]]);
});
