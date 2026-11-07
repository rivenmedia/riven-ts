import { TopLevelMediaItemType } from "@repo/util-plugin-sdk/dto/enums/top-level-media-item-type.enum";

import { InputType, Field, Int } from "type-graphql";

@InputType()
export class RequestItemInput {
  @Field(() => String)
  public requestedBy!: string;

  @Field(() => String, { nullable: true })
  public tmdbId?: string | null;

  @Field(() => String, { nullable: true })
  public imdbId?: string | null;

  @Field(() => String, { nullable: true })
  public tvdbId?: string | null;

  @Field(() => TopLevelMediaItemType.enum)
  public type!: TopLevelMediaItemType;

  @Field(() => [Int], { nullable: true })
  public requestedSeasons?: number[];
}
