import { IndexerBaseItem } from "@repo/util-plugin-sdk/dto/types/indexer-base-item.type";
import { IndexerData } from "@repo/util-plugin-sdk/dto/types/indexer-data.type";
import { DataSourceMap } from "@repo/util-plugin-sdk/utilities/datasource-map";

import { gql } from "@apollo/client";
import assert from "node:assert";
import { ObjectType } from "type-graphql";
import { expect } from "vitest";

import { it } from "#__tests__/test-context.ts";

import type { ValidPlugin } from "#types/plugins.ts";
import type {
  IndexerDataResult,
  RivenQueryHandler,
} from "@repo/util-plugin-sdk/schemas/query-handlers/index";

@ObjectType({ implements: [IndexerData, IndexerBaseItem] })
class MovieIndexerData {}

@ObjectType({ implements: [IndexerData, IndexerBaseItem] })
class ShowIndexerData {}

const createItem = (id: string, type: "movie" | "show"): IndexerDataResult => ({
  id,
  title: `Title ${id}`,
  overview: "",
  genres: [],
  type,
  status: "unknown",
  isRequestable: true,
});

const createPlugin = (
  name: string,
  queryHandlers: ValidPlugin["config"]["queryHandlers"],
): [symbol, ValidPlugin] => {
  const symbol = Symbol(name);

  return [
    symbol,
    {
      status: "valid",
      dataSources: new DataSourceMap(),
      config: {
        name: symbol,
        version: "1.0.0",
        resolvers: [],
        hooks: {},
        queryHandlers,
        settingsSchema: undefined as never,
        validator: async () => Promise.resolve(true),
      },
    },
  ];
};

const searchHandler = (
  type: new () => object,
  mediaType: "movie" | "show",
  ids: string[],
): RivenQueryHandler<"search"> => ({
  type: type as never,
  mediaTypes: [mediaType],
  handler: async () =>
    Promise.resolve(ids.map((id) => createItem(id, mediaType))),
});

const SEARCH = gql`
  query Search($query: String!, $type: TopLevelMediaItemType) {
    search(query: $query, type: $type) {
      results {
        plugin
        item {
          __typename
          id
          type
        }
      }
      errors {
        plugin
        message
      }
    }
  }
`;

it("interleaves results from every plugin with a search handler", async ({
  gqlContext,
  gqlServer,
}) => {
  const { body } = await gqlServer.executeOperation(
    { query: SEARCH, variables: { query: "breaking" } },
    {
      contextValue: {
        ...gqlContext,
        plugins: new Map([
          createPlugin("movies", {
            search: searchHandler(MovieIndexerData, "movie", ["m1", "m2"]),
          }),
          createPlugin("shows", {
            search: searchHandler(ShowIndexerData, "show", ["s1"]),
          }),
          createPlugin("no-search", {}),
        ]),
      },
    },
  );

  assert.ok(body.kind === "single");

  expect(body.singleResult.errors).toBeUndefined();
  expect(body.singleResult.data?.["search"]).toMatchObject({
    results: [
      {
        plugin: "movies",
        item: { __typename: "MovieIndexerData", id: "m1", type: "movie" },
      },
      {
        plugin: "shows",
        item: { __typename: "ShowIndexerData", id: "s1", type: "show" },
      },
      {
        plugin: "movies",
        item: { __typename: "MovieIndexerData", id: "m2", type: "movie" },
      },
    ],
    errors: [],
  });
});

it("only calls plugins that support the requested type", async ({
  gqlContext,
  gqlServer,
}) => {
  const { body } = await gqlServer.executeOperation(
    { query: SEARCH, variables: { query: "breaking", type: "show" } },
    {
      contextValue: {
        ...gqlContext,
        plugins: new Map([
          createPlugin("movies", {
            search: searchHandler(MovieIndexerData, "movie", ["m1"]),
          }),
          createPlugin("shows", {
            search: searchHandler(ShowIndexerData, "show", ["s1"]),
          }),
        ]),
      },
    },
  );

  assert.ok(body.kind === "single");

  expect(body.singleResult.data?.["search"]).toMatchObject({
    results: [{ plugin: "shows" }],
  });
});

it("returns partial results when a plugin fails", async ({
  gqlContext,
  gqlServer,
}) => {
  const { body } = await gqlServer.executeOperation(
    { query: SEARCH, variables: { query: "breaking" } },
    {
      contextValue: {
        ...gqlContext,
        plugins: new Map([
          createPlugin("movies", {
            search: {
              ...searchHandler(MovieIndexerData, "movie", []),
              handler: async () => Promise.reject(new Error("Rate limited")),
            },
          }),
          createPlugin("shows", {
            search: searchHandler(ShowIndexerData, "show", ["s1"]),
          }),
        ]),
      },
    },
  );

  assert.ok(body.kind === "single");

  expect(body.singleResult.errors).toBeUndefined();
  expect(body.singleResult.data?.["search"]).toMatchObject({
    results: [{ plugin: "shows" }],
    errors: [{ plugin: "movies", message: "Rate limited" }],
  });
});
