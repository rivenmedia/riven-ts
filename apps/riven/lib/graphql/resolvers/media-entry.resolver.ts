import { MediaEntry } from "@repo/util-plugin-sdk/dto/entities";

import { Arg, ID, Mutation, Resolver } from "type-graphql";

import { CoreContext } from "../decorators/core-context.ts";

import type { UUID } from "node:crypto";

@Resolver(() => MediaEntry)
export class MediaEntryResolver {
  @Mutation(() => MediaEntry)
  async saveStreamUrl(
    @CoreContext() { em }: CoreContext,
    @Arg("id", () => ID) id: UUID,
    @Arg("url", () => String) url: string,
  ): Promise<MediaEntry> {
    return em.getRepository(MediaEntry).saveStreamPermalink(id, url);
  }
}
