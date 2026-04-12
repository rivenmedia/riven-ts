import { Field, InputType } from "type-graphql";

import { MediaRequestInput } from "./media-request.input.ts";

import type { ContentServiceRequestedResponse } from "@repo/util-plugin-sdk/schemas/events/content-service-requested.event";

type MovieRequest = ContentServiceRequestedResponse["movies"][number];

@InputType()
export class MovieRequestInput
  extends MediaRequestInput
  implements MovieRequest
{
  @Field(() => String, { nullable: true })
  tmdbId?: string;
}
