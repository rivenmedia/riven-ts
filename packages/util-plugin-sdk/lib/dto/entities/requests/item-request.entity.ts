import {
  Entity,
  Enum,
  type Opt,
  PrimaryKey,
  Property,
  Unique,
} from "@mikro-orm/core";
import { IsNumberString, IsOptional, Matches } from "class-validator";
import { Field, ID, ObjectType } from "type-graphql";

import { DateTime } from "../../../helpers/dates.ts";
import { ItemRequestState } from "../../enums/item-request-state.enum.ts";
import { ItemRequestType } from "../../enums/item-request-type.enum.ts";

@ObjectType()
@Entity()
export class ItemRequest {
  @Field(() => ID)
  @PrimaryKey()
  id!: Opt<number>;

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

  @Field()
  @Enum(() => ItemRequestType.enum)
  type!: ItemRequestType;

  @Field()
  @Property()
  requestedBy!: string;

  @Field()
  @Property()
  externalRequestId?: string;

  @Field(() => Date)
  @Property()
  createdAt: Opt<Date> = DateTime.now().toJSDate();

  @Field(() => Date, { nullable: true })
  @Property()
  completedAt?: Opt<Date> | null;

  @Field()
  @Enum(() => ItemRequestState.enum)
  state!: ItemRequestState;

  @Property({ persist: false, hidden: true })
  get externalIdsLabel(): Opt<string[]> {
    const externalIds = [
      this.imdbId ? `IMDB: ${this.imdbId}` : null,
      this.type === "movie" && this.tmdbId ? `TMDB: ${this.tmdbId}` : null,
      this.type === "show" && this.tvdbId ? `TVDB: ${this.tvdbId}` : null,
    ].filter((str) => str != null);

    return externalIds;
  }
}
