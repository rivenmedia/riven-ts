import { Show } from "@repo/util-plugin-sdk/dto/entities";

import { DateTime } from "luxon";

import type { EventArgs, EventSubscriber } from "@mikro-orm/core";

/**
 * Subscriber that updates the `nextAirDate` of a `Show` when an `Episode` transitions from "unreleased" to "indexed".
 */
export class ShowNextAirDateSubscriber implements EventSubscriber<Show> {
  public getSubscribedEntities() {
    return [Show];
  }

  public async beforeUpsert({ entity }: EventArgs<Show>) {
    if (
      entity.nextAirDate &&
      DateTime.fromJSDate(entity.nextAirDate) > DateTime.now()
    ) {
      return;
    }

    if (entity.episodes.length === 0) {
      return;
    }

    const nextAiringEpisode = await entity.getNextAiringEpisode();

    entity.nextAirDate = nextAiringEpisode?.releaseDate ?? null;
  }
}
