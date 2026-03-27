import { MikroORM } from "@mikro-orm/core";
import { TsMorphMetadataProvider } from "@mikro-orm/reflection";
import { test as baseTest } from "vitest";

export const test = baseTest
  .extend(
    "orm",
    { scope: "worker" },
    // eslint-disable-next-line no-empty-pattern
    async ({}, { onCleanup }) => {
      const { SqliteDriver } = await import("@mikro-orm/sqlite");
      const {
        Episode,
        FileSystemEntry,
        ItemRequest,
        MediaEntry,
        MediaItem,
        Movie,
        Season,
        Show,
        SubtitleEntry,
        Stream,
      } = await import("../dto/entities/index.ts");

      const entities = [
        FileSystemEntry,
        MediaEntry,
        SubtitleEntry,
        MediaItem,
        Movie,
        Show,
        Season,
        Episode,
        ItemRequest,
        Stream,
      ];

      const orm = await MikroORM.init({
        driver: SqliteDriver,
        metadataProvider: TsMorphMetadataProvider,
        dbName: ":memory:",
        debug: false,
        entities,
      });

      await orm.schema.create();

      onCleanup(() => orm.close(true));

      return orm;
    },
  )
  .extend("em", ({ orm }) => orm.em.fork());

test.afterEach(async ({ orm }) => {
  await orm.schema.clear();
});

export const it = test;
