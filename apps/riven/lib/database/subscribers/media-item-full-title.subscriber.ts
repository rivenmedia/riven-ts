import {
  Episode,
  MediaItem,
  Movie,
  Season,
  Show,
} from "@repo/util-plugin-sdk/dto/entities";

import type { EntityName, EventArgs, EventSubscriber } from "@mikro-orm/core";

export class MediaItemFullTitleSubscriber implements EventSubscriber {
  getSubscribedEntities(): EntityName<MediaItem>[] {
    return [Movie, Show, Season, Episode];
  }

  async beforeCreate({ entity }: EventArgs<MediaItem>): Promise<void> {
    await this.#setFullTitle(entity);
  }

  async beforeUpdate({ entity }: EventArgs<MediaItem>): Promise<void> {
    await this.#setFullTitle(entity);
  }

  async #setFullTitle(item: MediaItem): Promise<void> {
    if (item instanceof Movie || item instanceof Show) {
      item.fullTitle = item.title;
    }

    if (item instanceof Season) {
      item.fullTitle = `${await item.show.loadProperty("fullTitle")} - S${item.number.toString().padStart(2, "0")}`;
    }

    if (item instanceof Episode) {
      item.fullTitle = `${await item.season.loadProperty("fullTitle")}E${item.number.toString().padStart(2, "0")} - ${item.title}`;
    }
  }
}
