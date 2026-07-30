import { ref } from "@mikro-orm/core";
import { DateTime } from "luxon";
import assert from "node:assert";

import { MediaEntryFactory } from "../../factories/media-entry.factory.ts";
import { StreamFactory } from "../../factories/stream.factory.ts";
import { BaseSeeder } from "../base.seeder.ts";
import { ScrapedShowSeeder } from "./scraped-show.seeder.ts";

import type { ScrapedShowSeederContext } from "./scraped-show.seeder.ts";
import type { EntityManager } from "@mikro-orm/core";
import type { Episode, Stream } from "@repo/util-plugin-sdk/dto/entities";

export type OngoingShowSeederContext = ScrapedShowSeederContext;

export class OngoingShowSeeder extends BaseSeeder<OngoingShowSeederContext> {
  #markEpisodeAsDownloaded(
    em: EntityManager,
    episode: Episode,
    stream: Stream,
  ) {
    em.persist(episode);

    episode.activeStream = ref(stream);
    episode.filesystemEntries.set([
      new MediaEntryFactory(em).makeEntity({
        mediaItem: episode,
        plugin: "test-plugin",
        provider: "test-provider",
      }),
    ]);
  }

  #setEpisodeReleaseDate(
    episode: Episode,
    finaleReleaseDate: DateTime,
    totalSeasonEpisodes: number,
    totalShowSeasons: number,
    seasonNumber: number,
  ) {
    episode.year = null;
    episode.releaseDate = finaleReleaseDate
      .minus({
        weeks: totalSeasonEpisodes - episode.number,
        years: totalShowSeasons - seasonNumber,
      })
      .toJSDate();
  }

  public async run(
    em: EntityManager,
    context: OngoingShowSeederContext = this.context,
  ) {
    await this.call(em, [ScrapedShowSeeder], context);

    assert.ok(
      context.streams[0],
      "Expected at least one stream to be present in context.streams",
    );

    const [activeStream] = context.streams;

    context.show.releaseDate = null; // Allow the subscriber to set the release date based on the first episode's release date
    context.show.status = "continuing";
    context.show.activeStream = ref(activeStream);

    const lastSeason = context.show.seasons.find(
      (season) => season.number === context.show.seasons.length,
    );

    assert.ok(
      lastSeason,
      "Expected to find the last season in context.show.seasons",
    );

    const finaleReleaseDate = DateTime.utc().plus({
      weeks: lastSeason.episodes.length - 2, // Offset ensures first episode is completed, second is indexed
    });

    const totalShowSeasons = context.show.seasons.length;

    for (const season of context.show.seasons) {
      season.year = null;
      season.releaseDate = null; // Allow the subscriber to set the release date based on the first episode's release date

      season.activeStream = ref(activeStream);

      const totalSeasonEpisodes = season.episodes.length;

      for (const episode of season.episodes) {
        if (season.number !== lastSeason.number) {
          this.#markEpisodeAsDownloaded(em, episode, activeStream);
        }

        this.#setEpisodeReleaseDate(
          episode,
          finaleReleaseDate,
          totalSeasonEpisodes,
          totalShowSeasons,
          season.number,
        );
      }
    }

    const [firstEpisode] = lastSeason.episodes;

    assert.ok(
      firstEpisode,
      "Expected to find the first episode in lastSeason.episodes",
    );

    this.#markEpisodeAsDownloaded(
      em,
      firstEpisode,
      new StreamFactory(em).makeOne(),
    );

    await em.flush();

    assert.ok(context.episodes, "Expected context.episodes to be defined");

    for (const episode of context.episodes) {
      if (episode.state === "unreleased") {
        context.show.nextAirDate = episode.releaseDate;

        break;
      }
    }

    assert.ok(
      context.show.state === "ongoing",
      `Expected show state to be "ongoing", got "${context.show.state}"`,
    );
  }
}
