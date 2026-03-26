import { MikroORM } from "@mikro-orm/core";
import { TsMorphMetadataProvider } from "@mikro-orm/reflection";
import { test as baseTest } from "vitest";

export const test = baseTest.extend(
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
      Movie,
      Season,
      Show,
      Stream,
      SubtitleEntry,
    } = await import("../dto/entities/index.ts");

    const orm = new MikroORM({
      driver: SqliteDriver,
      metadataProvider: TsMorphMetadataProvider,
      dbName: ":memory:",
      debug: false,
      entities: [
        FileSystemEntry,
        MediaEntry,
        SubtitleEntry,
        Movie,
        Show,
        Season,
        Episode,
        ItemRequest,
        Stream,
      ],
    });

    await orm.schema.create();

    onCleanup(() => orm.close(true));

    return orm;
  },
);

test.afterEach(async ({ orm }) => {
  await orm.schema.clear();
});

export const it = test;
