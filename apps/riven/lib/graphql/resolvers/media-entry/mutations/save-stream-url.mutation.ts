import { MediaEntry } from "@repo/util-plugin-sdk/dto/entities";

import { Field, ObjectType } from "type-graphql";

import { MutationResponse } from "../../../interfaces/mutation-response.interface.ts";

import type { EntityManager } from "@mikro-orm/core";
import type { UUID } from "node:crypto";

@ObjectType({ implements: MutationResponse })
export class SaveStreamUrlMutationResponse extends MutationResponse {
  @Field(() => MediaEntry)
  item!: MediaEntry;
}

export async function saveStreamUrlMutation(
  em: EntityManager,
  id: UUID,
  url: string,
) {
  const entry = await em.findOneOrFail(MediaEntry, id);

  em.assign(entry, {
    streamUrl: url,
  });

  await em.flush();

  return entry;
}
