import { Collection } from "@mikro-orm/core";
import {
  Entity,
  Enum,
  OneToMany,
  PrimaryKey,
  Property,
  Unique,
} from "@mikro-orm/decorators/legacy";
import { IsNumberString, IsOptional, Matches } from "class-validator";
import { randomUUID } from "node:crypto";
import { Field, ID, ObjectType } from "type-graphql";

import { DateTime } from "../../../helpers/dates.ts";
import { ItemRequestState } from "../../enums/item-request-state.enum.ts";
import { ItemRequestType } from "../../enums/item-request-type.enum.ts";
import { MediaItem } from "../media-items/media-item.entity.ts";
import { Season } from "../media-items/season.entity.ts";

import type { Hidden, Opt } from "@mikro-orm/core";

@ObjectType()
@Entity()
export class ItemRequest {
  @Field(() => ID)
  @PrimaryKey({ type: "uuid" })
  public id = randomUUID();

  @Field(() => String, { nullable: true })
  @Property({ type: "varchar", length: 10 })
  @Matches(/^tt\d+$/u)
  @IsOptional()
  @Unique()
  public imdbId?: string | null;

  @Field(() => String, { nullable: true })
  @Property({ type: "varchar", length: 10 })
  @IsNumberString()
  @IsOptional()
  @Unique()
  public tmdbId?: string | null;

  @Field(() => String, { nullable: true })
  @Property({ type: "varchar", length: 10 })
  @IsNumberString()
  @IsOptional()
  @Unique()
  public tvdbId?: string | null;

  @Field(() => ItemRequestType.enum)
  @Enum(() => ItemRequestType.enum)
  public type!: ItemRequestType;

  @Field(() => String, { nullable: true })
  @Property()
  public requestedBy!: string | null;

  @Field(() => String)
  @Property()
  public externalRequestId?: string;

  @Field(() => Date)
  @Property()
  public createdAt: Opt<Date> = DateTime.utc().toJSDate();

  @Field(() => Date, { nullable: true })
  @Property()
  public completedAt?: Opt<Date> | null;

  @Field(() => ItemRequestState.enum)
  @Enum(() => ItemRequestState.enum)
  public state!: ItemRequestState;

  @Field(() => [Number], { nullable: true })
  @Property({ type: "json" })
  public seasons!: number[] | null;

  @Property({ persist: false, hidden: true, getter: true })
  public get externalIdsLabel(): Hidden<Opt<string[]>> {
    const externalIds = [
      this.imdbId ? `IMDB: ${this.imdbId}` : null,
      this.type === "movie" && this.tmdbId ? `TMDB: ${this.tmdbId}` : null,
      this.type === "show" && this.tvdbId ? `TVDB: ${this.tvdbId}` : null,
    ].filter((str) => str != null);

    return externalIds;
  }

  @OneToMany(() => MediaItem, (mediaItem) => mediaItem.itemRequest)
  public mediaItems = new Collection<MediaItem>(this);

  @OneToMany(() => Season, (mediaItem) => mediaItem.itemRequest, {
    where: {
      type: "season",
    },
  })
  public seasonItems = new Collection<Season>(this);

  @OneToMany(() => MediaItem, (mediaItem) => mediaItem.itemRequest, {
    where: {
      isRequested: true,
    },
  })
  public requestedItems = new Collection<MediaItem>(this);

  /**
   * Whether the item request is a partial request, i.e. a request for specific seasons of a show instead of the entire show.
   *
   * Defaults to `false` until indexer data is available, at which point it will be set to `true` for requests that specify a subset of seasons.
   *
   * Will **always** be `false` for movies, and special seasons are not included in the calculation.
   *
   * @default false
   */
  @Property({ default: false })
  public isPartialRequest!: Opt<boolean>;
}
