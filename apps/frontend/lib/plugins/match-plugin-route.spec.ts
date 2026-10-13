import { expect, it } from "vitest";

import { matchPluginRoute } from "./match-plugin-route.ts";

it("matches the index route when there are no segments", () => {
  expect(
    matchPluginRoute({ "": "index", settings: "settings" }, []),
  ).toStrictEqual({
    route: "",
    page: "index",
    params: {},
  });
});

it("matches static routes", () => {
  expect(
    matchPluginRoute({ "": "index", "lists/popular": "popular" }, [
      "lists",
      "popular",
    ]),
  ).toStrictEqual({ route: "lists/popular", page: "popular", params: {} });
});

it("extracts dynamic segments as params", () => {
  expect(
    matchPluginRoute({ "[type]/[id]": "details" }, ["movie", "123"]),
  ).toStrictEqual({
    route: "[type]/[id]",
    page: "details",
    params: { type: "movie", id: "123" },
  });
});

it("extracts catch-all segments as params", () => {
  expect(
    matchPluginRoute({ "browse/[...path]": "browse" }, ["browse", "a", "b"]),
  ).toStrictEqual({
    route: "browse/[...path]",
    page: "browse",
    params: { path: ["a", "b"] },
  });
});

it("requires at least one segment for a catch-all", () => {
  expect(
    matchPluginRoute({ "browse/[...path]": "browse" }, ["browse"]),
  ).toBeUndefined();
});

it.for([
  ["there are too few segments", ["movie"]],
  ["there are too many segments", ["movie", "123", "extra"]],
  ["a static segment differs", ["show", "123"]],
] as const)("returns undefined when %s", ([, segments]) => {
  expect(matchPluginRoute({ "movie/[id]": "movie" }, segments)).toBeUndefined();
});

const overlappingPages = {
  "movie/[...rest]": "catch-all",
  "movie/[id]": "dynamic",
  "movie/popular": "static",
};

it.for([
  ["static over dynamic", ["movie", "popular"], "static"],
  ["dynamic over catch-all", ["movie", "123"], "dynamic"],
  ["catch-all when nothing else matches", ["movie", "1", "2"], "catch-all"],
] as const)("prefers %s", ([, segments, expected]) => {
  expect(matchPluginRoute(overlappingPages, segments)?.page).toBe(expected);
});

it("prefers the route that is more specific at the earliest segment", () => {
  expect(
    matchPluginRoute({ "[type]/popular": "a", "movie/[id]": "b" }, [
      "movie",
      "popular",
    ])?.page,
  ).toBe("b");
});

it("prefers the first route when routes are equally specific", () => {
  expect(matchPluginRoute({ "[a]": "a", "[b]": "b" }, ["value"])).toStrictEqual(
    {
      route: "[a]",
      page: "a",
      params: { a: "value" },
    },
  );
});
