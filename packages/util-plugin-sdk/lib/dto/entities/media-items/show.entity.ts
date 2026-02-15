import {
  Collection,
  Entity,
  Enum,
  OneToMany,
  type Opt,
  Property,
} from "@mikro-orm/core";
import { Field, ObjectType } from "type-graphql";

import {
  ShowContentRating,
  ShowContentRatingEnum,
} from "../../enums/content-ratings.enum.ts";
import { ShowStatus } from "../../enums/show-status.enum.ts";
import { Season } from "./season.entity.ts";
import { ShowLikeMediaItem } from "./show-like.entity.ts";

@ObjectType()
@Entity()
export class Show extends ShowLikeMediaItem {
  @Field(() => ShowStatus.enum, { nullable: true })
  @Enum(() => ShowStatus.enum)
  status!: ShowStatus;

  @Field(() => String)
  @Property({ type: "json" })
  releaseData: object = {};

  @Field(() => [Season], { nullable: true })
  @OneToMany(() => Season, (season) => season.show)
  seasons = new Collection<Season>(this);

  @Field(() => ShowContentRatingEnum)
  declare contentRating: ShowContentRating;

  override type: Opt<"show"> = "show" as const;

  declare tvdbId: string;
  declare tmdbId?: never;
}
