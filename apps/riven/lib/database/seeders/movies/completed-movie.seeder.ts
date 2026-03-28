import { type EntityManager, ref } from "@mikro-orm/core";
import assert from "node:assert";

import { MediaEntryFactory } from "../../factories/media-entry.factory.ts";
import { BaseSeeder } from "../base.seeder.ts";
import {
  ScrapedMovieSeeder,
  type ScrapedMovieSeederContext,
} from "./scraped-movie.seeder.ts";

export type CompletedMovieSeederContext = ScrapedMovieSeederContext;

export class CompletedMovieSeeder extends BaseSeeder<CompletedMovieSeederContext> {
  async run(
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
    context.movie.filesystemEntries.set([
      new MediaEntryFactory(em).makeEntity({ mediaItem: context.movie }),
    ]);

    await em.flush();

    assert(
      context.movie.state === "completed",
      `Expected movie state to be "completed", got "${context.movie.state}"`,
    );
  }
}
