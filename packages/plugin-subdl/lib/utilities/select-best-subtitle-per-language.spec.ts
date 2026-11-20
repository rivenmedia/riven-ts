import { expect, it } from "vitest";

import { selectBestSubtitlePerLanguage } from "./select-best-subtitle-per-language.ts";

import type { SubtitleResponse } from "../schemas/subtitle-response.schema.ts";
import type { ItemMetadata } from "./get-item-metadata.ts";

const metadata: ItemMetadata = {
  type: "movie",
  tmdbId: "671",
  imdbId: "tt0241527",
  seasonNumber: undefined,
  episodeNumber: undefined,
};

it("normalizes Brazilian Portuguese variants to one pt-BR subtitle", () => {
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

it("normalizes correctly spelled Brazilian Portuguese variants too", () => {
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

it.each([
  ["brasilian portuguese", "pt-BR"],
  ["Brazilian_Portuguese", "pt-BR"],
  ["Brazilian   Portuguese", "pt-BR"],
  ["Portuguese", "portuguese"],
  ["Australian Portuguese", "australian portuguese"],
  ["Brazilian Esperanto", "brazilian esperanto"],
])("maps language %s to %s", (language, expectedLanguage) => {
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
});
