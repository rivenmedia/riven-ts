import { Collection, type Hidden, type Opt } from "@mikro-orm/core";
import {
  Entity,
  Enum,
  OneToMany,
  PrimaryKey,
  Property,
  Unique,
} from "@mikro-orm/decorators/legacy";
import { IsNumberString, IsOptional, Matches } from "class-validator";
import { Field, ID, ObjectType } from "type-graphql";

import { DateTime } from "../../../helpers/dates.ts";
import { ItemRequestState } from "../../enums/item-request-state.enum.ts";
import { ItemRequestType } from "../../enums/item-request-type.enum.ts";
import { MediaItem } from "../media-items/media-item.entity.ts";
import { Season } from "../media-items/season.entity.ts";

@ObjectType()
@Entity()
export class ItemRequest {
  @Field(() => ID)
  @PrimaryKey({ defaultRaw: "gen_random_uuid()" })
  id!: string;

  @Field(() => String, { nullable: true })
  @Property()
  @Matches(/^tt\d+$/)
  @IsOptional()
  @Unique()
  imdbId?: string | null;

  @Field(() => String, { nullable: true })
  @Property()
  @IsNumberString()
  @IsOptional()
  @Unique()
  tmdbId?: string | null;

  @Field(() => String, { nullable: true })
  @Property()
  @IsNumberString()
  @IsOptional()
  @Unique()
  tvdbId?: string | null;

  @Field(() => ItemRequestType.enum)
  @Enum(() => ItemRequestType.enum)
  type!: ItemRequestType;

  @Field(() => String, { nullable: true })
  @Property()
  requestedBy!: string | null;

  @Field(() => String)
  @Property()
  externalRequestId?: string;

  @Field(() => Date)
  @Property()
  createdAt: Opt<Date> = DateTime.now().toJSDate();

  @Field(() => Date, { nullable: true })
  @Property()
  completedAt?: Opt<Date> | null;

  @Field(() => ItemRequestState.enum)
  @Enum(() => ItemRequestState.enum)
  state!: ItemRequestState;

  @Field(() => [Number], { nullable: true })
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
