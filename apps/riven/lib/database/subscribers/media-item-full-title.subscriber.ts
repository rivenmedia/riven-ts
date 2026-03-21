import {
  Episode,
  MediaItem,
  Movie,
  Season,
  Show,
} from "@repo/util-plugin-sdk/dto/entities";

import type { EventArgs, EventSubscriber } from "@mikro-orm/core";

export class MediaItemFullTitleSubscriber implements EventSubscriber {
  beforeCreate({ entity }: EventArgs<MediaItem>): void | Promise<void> {
    if (entity instanceof MediaItem) {
      this.#setFullTitle(entity);
    }
  }

  beforeUpdate({ entity }: EventArgs<MediaItem>): void | Promise<void> {
    if (entity instanceof MediaItem) {
      this.#setFullTitle(entity);
    }
  }

  #setFullTitle(item: MediaItem): void {
    if (item instanceof Movie || item instanceof Show) {
      item.fullTitle = item.title;
    }

    if (item instanceof Season) {
      item.fullTitle = `${item.show.getProperty("fullTitle")} - S${item.number.toString().padStart(2, "0")}`;
    }

    if (item instanceof Episode) {
      item.fullTitle = `${item.season.getProperty("fullTitle")}E${item.number.toString().padStart(2, "0")} - ${item.title}`;
    }
  }
}
