import { DateTime } from "luxon";
import assert from "node:assert";

import { EpisodeFactory } from "../../factories/episode.factory.ts";
import { SeasonFactory } from "../../factories/season.factory.ts";
import { ShowItemRequestFactory } from "../../factories/show-item-request.factory.ts";
import { ShowFactory } from "../../factories/show.factory.ts";
import { BaseSeeder } from "../base.seeder.ts";

import type { EntityManager } from "@mikro-orm/core";
import type { Episode, Season, Show } from "@repo/util-plugin-sdk/dto/entities";

export interface IndexedShowSeederContext {
  show: Show;
  seasons?: Season[];
  episodes?: Episode[];
}

export class IndexedShowSeeder extends BaseSeeder<IndexedShowSeederContext> {
  readonly #episodesPerSeason = 10;
  readonly #seasonCount = 6;

  public async run(
    em: EntityManager,
    context: IndexedShowSeederContext = this.context,
  ) {
    const releaseDate = DateTime.utc().minus({ years: 1 }).toISO();
    const indexedAt = DateTime.utc().toJSDate();

    const itemRequest = await new ShowItemRequestFactory(em).createOne();

    assert.ok(itemRequest.tvdbId, "Expected item request to have a tvdbId");

    context.show = await new ShowFactory(em).createOne({
      releaseDate: null, // Allow the subscriber to set the release date based on the first episode's release date
      indexedAt,
      tvdbId: itemRequest.tvdbId,
      itemRequest,
    });

    let absoluteEpisodeNumber = 1;

    for (
      let seasonNumber = 1;
      seasonNumber <= this.#seasonCount;
      seasonNumber += 1
    ) {
      const season = await new SeasonFactory(em).createOne({
        tvdbId: itemRequest.tvdbId,
        number: seasonNumber,
        releaseDate: null, // Allow the subscriber to set the release date based on the first episode's release date
        show: context.show,
        itemRequest,
        indexedAt,
      });

      context.seasons ??= [];
      context.seasons.push(season);

      for (
        let episodeNumber = 1;
        episodeNumber <= this.#episodesPerSeason;
        episodeNumber += 1
      ) {
        const episode = new EpisodeFactory(em).makeEntity({
          tvdbId: itemRequest.tvdbId,
          number: episodeNumber,
          absoluteNumber: absoluteEpisodeNumber,
          releaseDate,
          itemRequest,
          indexedAt,
        });

        season.episodes.add(episode);
        context.show.episodes.add(episode);

        absoluteEpisodeNumber += 1;
      }

      context.episodes ??= [];
      context.episodes.push(...season.episodes);
    }

    assert.ok(context.seasons?.length);
    assert.ok(context.episodes?.length);

    itemRequest.mediaItems.add(
      context.show,
      ...context.seasons,
      ...context.episodes,
    );

    await em.flush();

    assert.ok(
      itemRequest.state === "processing",
      `Expected item request state to be "processing", got "${itemRequest.state}"`,
    );

    assert.ok(
      context.show.state === "indexed",
      `Expected show state to be "indexed", got "${context.show.state}"`,
    );
  }
}
