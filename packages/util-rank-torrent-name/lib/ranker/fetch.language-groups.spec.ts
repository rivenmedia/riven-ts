import { expect } from "vitest";

import { parse } from "../parser/parse.ts";
import { it } from "./__tests__/fetch.test-context.ts";
import { checkFetch } from "./fetch.ts";
import { createSettings } from "./ranking-settings.schema.ts";

it("expands language groups in the excluded languages", ({ rankingModel }) => {
  const settings = createSettings({ languages: { exclude: ["anime"] } });
  const data = parse("Movie.2024.JAPANESE.1080p.BluRay.x264-GROUP");

  expect(data.languages).toStrictEqual(["ja"]);

  const result = checkFetch(data, settings, rankingModel);

  expect(result.fetch).toBe(false);
  expect(result.failedChecks).toContain("lang_ja");
});

it("accepts a release in a required language", ({ rankingModel }) => {
  const settings = createSettings({ languages: { required: ["fr"] } });
  const data = parse("Movie.2024.FRENCH.1080p.BluRay.x264-GROUP");

  expect(checkFetch(data, settings, rankingModel).fetch).toBe(true);
});

it("rejects a release whose languages are all outside the required languages", ({
  rankingModel,
}) => {
  const settings = createSettings({ languages: { required: ["de"] } });
  const data = parse("Movie.2024.FRENCH.1080p.BluRay.x264-GROUP");
  const result = checkFetch(data, settings, rankingModel);

  expect(result.fetch).toBe(false);
  expect(result.failedChecks).toContain("missing_required_language");
});

it.for([
  { allowEnglishInLanguages: true, fetch: true },
  { allowEnglishInLanguages: false, fetch: false },
])(
  "keeps excluded languages alongside English when allowEnglishInLanguages is $allowEnglishInLanguages",
  ({ allowEnglishInLanguages, fetch }, { rankingModel }) => {
    const settings = createSettings({
      languages: { exclude: ["fr"] },
      options: { allowEnglishInLanguages },
    });
    const data = parse("Movie.2024.FRENCH.ENGLISH.1080p.BluRay.x264-GROUP");

    expect(data.languages).toStrictEqual(expect.arrayContaining(["en", "fr"]));
    expect(checkFetch(data, settings, rankingModel).fetch).toBe(fetch);
  },
);
