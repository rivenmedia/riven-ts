import { expect, it } from "vitest";

import { formatEpisodeDetails } from "./format-episode-details.ts";
import { formatSeasonTitle } from "./format-season-title.ts";
import { parseNumberParam } from "./parse-number-param.ts";

it.for([
  [0, "Specials"],
  [1, "Season 1"],
  [12, "Season 12"],
] as const)("titles season %i as %s", ([seasonNumber, title]) => {
  expect(formatSeasonTitle(seasonNumber)).toBe(title);
});

it.for([
  ["0", 0],
  ["7", 7],
  ["12", 12],
] as const)("parses the route param %j as %i", ([param, expected]) => {
  expect(parseNumberParam(param)).toBe(expected);
});

it.for(["-1", "1.5", "one", "Infinity"])(
  "rejects the route param %j",
  (param) => {
    expect(parseNumberParam(param)).toBeNull();
  },
);

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
