import { ItemRequest } from "@repo/util-plugin-sdk/dto/entities";

import { randomUUID } from "node:crypto";
import { expect } from "vitest";

import { movieAlternativeTitlesHandler } from "../../__generated__/handlers/movieAlternativeTitlesHandler.ts";
import { movieDetailsHandler } from "../../__generated__/handlers/movieDetailsHandler.ts";
import { it as baseIt } from "../../__tests__/tmdb.test-context.ts";
import { indexTMDBMediaItem } from "../index-tmdb-media-item.ts";

const it = baseIt.extend("item", ({}) => {
  const item = new ItemRequest();

  item.id = randomUUID();
  item.type = "movie";
  item.tmdbId = "603";

  return item;
});

it.beforeEach(({ server }) => {
  server.use(
    movieDetailsHandler({
      id: 603,
      title: "The Matrix",
      genres: [],
    }),
  );
});

it("maps the alternative titles to aliases keyed by country", async ({
  item,
  dataSourceMap,
  settings,
  server,
  logger,
}) => {
  server.use(
    movieAlternativeTitlesHandler({
      id: 603,
      titles: [
        { iso_3166_1: "US", title: "Matrix", type: "" },
        { iso_3166_1: "US", title: "The Matrix 1", type: "" },
        { iso_3166_1: "FR", title: "Matrix", type: "" },
      ],
    }),
  );

  const result = await indexTMDBMediaItem({
    dataSources: dataSourceMap,
    event: { item },
    logger,
    settings,
  });

  expect(result?.item.aliases).toStrictEqual({
    us: ["matrix", "the matrix 1"],
    fr: ["matrix"],
  });
});

it("ignores alternative titles that are identical to the main title", async ({
  item,
  dataSourceMap,
  settings,
  server,
  logger,
}) => {
  server.use(
    movieAlternativeTitlesHandler({
      id: 603,
      titles: [{ iso_3166_1: "GB", title: "The Matrix", type: "" }],
    }),
  );

  const result = await indexTMDBMediaItem({
    dataSources: dataSourceMap,
    event: { item },
    logger,
    settings,
  });

  expect(result?.item.aliases).toStrictEqual({});
});

it("ignores alternative titles without a title or country", async ({
  item,
  dataSourceMap,
  settings,
  server,
  logger,
}) => {
  server.use(
    movieAlternativeTitlesHandler({
      id: 603,
      titles: [
        { iso_3166_1: "US", title: "", type: "" },
        { iso_3166_1: "", title: "Matrix", type: "" },
        { title: "Matrix", type: "" },
      ],
    }),
  );

  const result = await indexTMDBMediaItem({
    dataSources: dataSourceMap,
    event: { item },
    logger,
    settings,
  });

  expect(result?.item.aliases).toStrictEqual({});
});

it("deduplicates alternative titles case-insensitively", async ({
  item,
  dataSourceMap,
  settings,
  server,
  logger,
}) => {
  server.use(
    movieAlternativeTitlesHandler({
      id: 603,
      titles: [
        { iso_3166_1: "US", title: "Matrix", type: "" },
        { iso_3166_1: "us", title: "MATRIX", type: "" },
      ],
    }),
  );

  const result = await indexTMDBMediaItem({
    dataSources: dataSourceMap,
    event: { item },
    logger,
    settings,
  });

  expect(result?.item.aliases).toStrictEqual({
    us: ["matrix"],
  });
});
