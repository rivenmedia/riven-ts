import { ref } from "@mikro-orm/core";
import assert from "node:assert";

import { MediaEntryFactory } from "../../factories/media-entry.factory.ts";
import { BaseSeeder } from "../base.seeder.ts";
import { ScrapedMovieSeeder } from "./scraped-movie.seeder.ts";

import type { ScrapedMovieSeederContext } from "./scraped-movie.seeder.ts";
import type { EntityData, EntityManager } from "@mikro-orm/core";
import type { MediaEntry } from "@repo/util-plugin-sdk/dto/entities";

export interface CompletedMovieSeederContext extends ScrapedMovieSeederContext {
  mediaEntries?: EntityData<MediaEntry>[];
}

export class CompletedMovieSeeder extends BaseSeeder<CompletedMovieSeederContext> {
  public async run(
    em: EntityManager,
    context: CompletedMovieSeederContext = this.context,
  ) {
    await this.call(em, [ScrapedMovieSeeder], context);

    assert(
      context.streams[0],
      "Expected at least one stream to be present in context.streams",
    );

    em.persist(context.movie);

    context.movie.activeStream = ref(context.streams[0]);

    context.mediaEntries ??= [{ mediaItem: context.movie }];
    context.movie.filesystemEntries.set(
      context.mediaEntries.map((entry) =>
        new MediaEntryFactory(em).makeEntity({
          ...entry,
          mediaItem: ref(context.movie),
        }),
      ),
    );

    await em.flush();

    assert(
      context.movie.state === "completed",
      `Expected movie state to be "completed", got "${context.movie.state}"`,
    );
  }
}
