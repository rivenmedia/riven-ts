import { expect, it } from "vitest";

import { formatEpisodeDetails } from "./format-episode-details.ts";

it("formats the air date and runtime of an episode", () => {
  expect(
    formatEpisodeDetails({ airDate: "2008-01-20T02:00:00Z", runtime: 58 }),
  ).toStrictEqual(["20 Jan 2008", "58m"]);
});

it("formats the air date as a calendar date in UTC", () => {
  expect(
    formatEpisodeDetails({ airDate: "2008-01-20T23:30:00Z" }),
  ).toStrictEqual(["20 Jan 2008"]);
});

it("omits missing episode details", () => {
  expect(formatEpisodeDetails({ airDate: null, runtime: 0 })).toStrictEqual([]);
  expect(formatEpisodeDetails({ runtime: 42 })).toStrictEqual(["42m"]);
});
