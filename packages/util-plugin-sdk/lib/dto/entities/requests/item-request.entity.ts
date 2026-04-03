import { Collection, type Hidden, type Opt } from "@mikro-orm/core";
import {
  Entity,
  Enum,
  OneToMany,
  PrimaryKey,
  Property,
  Unique,
} from "@mikro-orm/decorators/es";

import { DateTime } from "../../../helpers/dates.ts";
import { ItemRequestState } from "../../enums/item-request-state.enum.ts";
import { ItemRequestType } from "../../enums/item-request-type.enum.ts";
import { MediaItem } from "../media-items/media-item.entity.ts";
import { Season } from "../media-items/season.entity.ts";

@Entity()
export class ItemRequest {
  @PrimaryKey()
  id!: number;

  @Property()
  @Unique()
  imdbId?: string | null;

  @Property()
  @Unique()
  tmdbId?: string | null;

  @Property()
  @Unique()
  tvdbId?: string | null;

  @Enum(() => ItemRequestType.enum)
  type!: ItemRequestType;

  @Property()
  requestedBy!: string | null;

  @Property()
  externalRequestId?: string;

  @Property()
  createdAt: Opt<Date> = DateTime.now().toJSDate();

  @Property()
  completedAt?: Opt<Date> | null;

  @Enum(() => ItemRequestState.enum)
  state!: ItemRequestState;

  @Property({ type: "json" })
  seasons!: number[] | null;

  @Property({ persist: false, hidden: true, getter: true })
  get externalIdsLabel(): Hidden<Opt<string[]>> {
    const externalIds = [
      this.imdbId ? `IMDB: ${this.imdbId}` : null,
      this.type === "movie" && this.tmdbId ? `TMDB: ${this.tmdbId}` : null,
      this.type === "show" && this.tvdbId ? `TVDB: ${this.tvdbId}` : null,
    ].filter((str) => str != null);

    return externalIds;
  }

  @OneToMany(() => MediaItem, (mediaItem) => mediaItem.itemRequest)
  mediaItems = new Collection<MediaItem>(this);

  @OneToMany(() => Season, (mediaItem) => mediaItem.itemRequest, {
    where: {
      type: "season",
    },
  })
  seasonItems = new Collection<Season>(this);

  @OneToMany(() => MediaItem, (mediaItem) => mediaItem.itemRequest, {
    where: {
      isRequested: true,
    },
  })
  requestedItems = new Collection<MediaItem>(this);
}
