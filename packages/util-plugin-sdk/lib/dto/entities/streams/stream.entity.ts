import { Collection } from "@mikro-orm/core";
import {
  Entity,
  ManyToMany,
  PrimaryKey,
  Property,
  Unique,
} from "@mikro-orm/decorators/legacy";

import { MediaItem } from "../media-items/media-item.entity.ts";

import type { ParsedData } from "@repo/util-rank-torrent-name";

@Entity()
export class Stream {
  @PrimaryKey()
  id!: number;

  @Property()
  @Unique()
  infoHash!: string;

  @Property({ type: "json" })
  parsedData!: ParsedData;

  @ManyToMany(() => MediaItem, (mediaItem) => mediaItem.streams)
  parents = new Collection<MediaItem>(this);

  @ManyToMany(() => MediaItem, (mediaItem) => mediaItem.blacklistedStreams)
  blacklistedParents = new Collection<MediaItem>(this);
}
