import { expect, it } from "vitest";

import { transformSeries } from "./transform-series.ts";

it("uses the english title translation if the series language is not english", () => {
  const result = transformSeries(
    {
      id: 1,
      tvdbId: "123",
    } as never,
    {
      originalLanguage: "jpn",
      firstAired: "2020-01-01",
      translations: {
        nameTranslations: [
          {
            name: "English Title",
            language: "eng",
          },
        ],
      },
    },
    [],
    "Europe/London",
  );

  expect(result.title).toBe("English Title");
});

it("uses the series title translation if the series language is in English", () => {
  const result = transformSeries(
    {
      id: 1,
      tvdbId: "123",
    } as never,
    {
      name: "Show Title",
      originalLanguage: "eng",
      firstAired: "2020-01-01",
    },
    [],
    "Europe/London",
  );

  expect(result.title).toBe("Show Title");
});

it("includes english translations in the aliases", () => {
  const result = transformSeries(
    {
      id: 1,
      tvdbId: "123",
    } as never,
    {
      name: "Show Title",
      slug: "show-title",
      originalLanguage: "eng",
      firstAired: "2020-01-01",
      translations: {
        nameTranslations: [
          {
            name: "Alternative English Title",
            language: "eng",
          },
        ],
      },
    },
    [],
    "Europe/London",
  );

  expect(result.aliases).toStrictEqual({
    eng: ["show-title", "alternative english title"],
  });
});

it("ignores translations that are identical to the main title", () => {
  const result = transformSeries(
    {
      id: 1,
      tvdbId: "123",
    } as never,
    {
      name: "Show Title",
      slug: "show-title",
      originalLanguage: "eng",
      firstAired: "2020-01-01",
      translations: {
        nameTranslations: [
          {
            name: "Show Title",
            language: "fra",
          },
        ],
      },
    },
    [],
    "Europe/London",
  );

  expect(result.aliases).toStrictEqual({
    eng: ["show-title"],
  });
});

it("normalises alias languages and names to lowercase", () => {
  const result = transformSeries(
    {
      id: 1,
      tvdbId: "123",
    } as never,
    {
      name: "Show Title",
      slug: "show-title",
      originalLanguage: "eng",
      firstAired: "2020-01-01",
      translations: {
        nameTranslations: [
          {
            name: "Titre De La Série",
            language: "FRA",
          },
          {
            name: "titre de la série",
            language: "fra",
          },
        ],
      },
    },
    [],
    "Europe/London",
  );

  expect(result.aliases).toStrictEqual({
    eng: ["show-title"],
    fra: ["titre de la série"],
  });
});
