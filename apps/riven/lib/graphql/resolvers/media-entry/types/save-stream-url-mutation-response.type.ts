import { MediaEntry } from "@repo/util-plugin-sdk/dto/entities";

import { Field, ObjectType } from "type-graphql";

import { MutationResponse } from "../../interfaces/mutation-response.interface.ts";

@ObjectType({ implements: MutationResponse })
export class SaveStreamUrlMutationResponse extends MutationResponse {
  @Field(() => MediaEntry)
  item!: MediaEntry;
}
