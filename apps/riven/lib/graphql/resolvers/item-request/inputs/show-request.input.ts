import { Field, InputType, Int } from "type-graphql";

import { MediaRequestInput } from "./media-request.input.ts";

import type { ContentServiceRequestedResponse } from "@repo/util-plugin-sdk/schemas/events/content-service-requested.event";

type ShowRequest = ContentServiceRequestedResponse["shows"][number];

@InputType()
export class ShowRequestInput extends MediaRequestInput implements ShowRequest {
  @Field(() => [Int], { nullable: true })
  seasons?: number[] | null;

  @Field(() => String, { nullable: true })
  tvdbId?: string;
}
