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
  );

  expect(result.title).toBe("Show Title");
});
