import { Field, ID, InputType } from "type-graphql";

import type { UUID } from "node:crypto";

@InputType()
export class StartManualScrapeInput {
  @Field(() => ID)
  mediaItemId!: UUID;

  @Field(() => ID)
  infoHash!: string;
}
