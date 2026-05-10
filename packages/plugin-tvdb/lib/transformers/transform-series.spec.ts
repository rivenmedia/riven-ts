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

it("includes non-English aliases and excludes English translations", () => {
  const result = transformSeries(
    {
      id: 1,
      tvdbId: "123",
    } as never,
    {
      name: "Show Title",
      originalLanguage: "eng",
      firstAired: "2020-01-01",
      translations: {
        nameTranslations: [
          { name: "Titre", language: "fra" },
          { name: "Título", language: "spa" },
          { name: "Show Title", language: "deu" }, // same as main title, should be excluded
          { name: "English Alias", language: "eng", isAlias: true }, // eng alias ignored in findEnglishShowTitle
        ],
      },
    },
    [],
    "Europe/London",
  );

  expect(result.aliases).toEqual(
    expect.objectContaining({
      fra: ["Titre"],
      spa: ["Título"],
    }),
  );
  // "deu" translation identical to main title should be excluded
  expect(result.aliases).not.toHaveProperty("deu");
});

it("parses content rating from USA content ratings", () => {
  const result = transformSeries(
    {
      id: 1,
      tvdbId: "123",
    } as never,
    {
      name: "Show Title",
      originalLanguage: "eng",
      firstAired: "2020-01-01",
      contentRatings: [
        { country: "gbr", name: "15" },
        { country: "usa", name: "TV-MA" },
      ],
    },
    [],
    "Europe/London",
  );

  expect(result.contentRating).toBe("tv-ma");
});

it("defaults content rating to unknown when no USA rating", () => {
  const result = transformSeries(
    {
      id: 1,
      tvdbId: "123",
    } as never,
    {
      name: "Show Title",
      originalLanguage: "eng",
      firstAired: "2020-01-01",
      contentRatings: [{ country: "gbr", name: "15" }],
    },
    [],
    "Europe/London",
  );

  expect(result.contentRating).toBe("unknown");
});

it("transforms episodes with aired dates and timezone", () => {
  const result = transformSeries(
    {
      id: 1,
      tvdbId: "123",
    } as never,
    {
      name: "Show Title",
      originalLanguage: "eng",
      firstAired: "2020-01-01",
      airsTime: "20:00",
    },
    [
      {
        seasonNumber: 1,
        number: 1,
        name: "Pilot",
        aired: "2020-01-15",
        absoluteNumber: 1,
        runtime: 42,
      },
    ],
    "America/New_York",
  );

  expect(result.seasons[1]).toBeDefined();
  expect(result.seasons[1].episodes).toHaveLength(1);
  expect(result.seasons[1].episodes[0]).toEqual(
    expect.objectContaining({
      number: 1,
      title: "Pilot",
      absoluteNumber: 1,
      runtime: 42,
    }),
  );
  // airedAt should be set (UTC conversion of 2020-01-15 20:00 EST)
  expect(result.seasons[1].episodes[0].airedAt).toBeTruthy();
});
