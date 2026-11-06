import { ArgsType, Field } from "type-graphql";

import type { ExternalIds } from "@repo/util-plugin-sdk/schemas/external-ids.type";

@ArgsType()
export class ExternalIdsArgs implements ExternalIds {
  @Field(() => String, { nullable: true })
  public imdbId: string | null = null;

  @Field(() => String, { nullable: true })
  public tmdbId: string | null = null;

  @Field(() => String, { nullable: true })
  public tvdbId: string | null = null;
}
