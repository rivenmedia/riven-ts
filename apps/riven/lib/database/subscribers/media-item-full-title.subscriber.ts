import {
  Episode,
  MediaItem,
  Movie,
  Season,
  Show,
} from "@repo/util-plugin-sdk/dto/entities";

import type {
  EntityDictionary,
  EntityName,
  EventArgs,
  EventSubscriber,
} from "@mikro-orm/core";

export class MediaItemFullTitleSubscriber implements EventSubscriber {
  getSubscribedEntities(): EntityName<MediaItem>[] {
    return [Movie, Show, Season, Episode];
  }

  async beforeCreate({
    entity,
    changeSet,
  }: EventArgs<MediaItem>): Promise<void> {
    await this.#setFullTitle(entity, changeSet?.payload);
  }

  async beforeUpdate({
    entity,
    changeSet,
  }: EventArgs<MediaItem>): Promise<void> {
    await this.#setFullTitle(entity, changeSet?.payload);
  }

  #setMovieOrShowFullTitle(
    item: Movie | Show,
    payload: EntityDictionary<Movie | Show>,
  ) {
    if (payload.title) {
      item.fullTitle = item.title;
    }
  }

  async #setSeasonFullTitle(item: Season, payload: EntityDictionary<Season>) {
    if (payload.number != null) {
      item.fullTitle = `${await item.show.loadProperty("fullTitle")} - S${item.number.toString().padStart(2, "0")}`;
    }
  }

  async #setEpisodeFullTitle(
    item: Episode,
    payload: EntityDictionary<Episode>,
  ) {
    if (payload.number != null || payload.title) {
      item.fullTitle = `${await item.season.loadProperty("fullTitle")}E${item.number.toString().padStart(2, "0")} - ${item.title}`;
    }
  }

  async #setFullTitle(
    item: MediaItem,
    payload: EntityDictionary<MediaItem> | undefined,
  ): Promise<void> {
    if (!payload) {
      return;
    }

    if (item instanceof Movie || item instanceof Show) {
      this.#setMovieOrShowFullTitle(
        item,
        payload as EntityDictionary<Movie | Show>,
      );
    }

    if (item instanceof Season) {
      await this.#setSeasonFullTitle(item, payload as EntityDictionary<Season>);
    }

    if (item instanceof Episode) {
      await this.#setEpisodeFullTitle(
        item,
        payload as EntityDictionary<Episode>,
      );
    }
  }
}
