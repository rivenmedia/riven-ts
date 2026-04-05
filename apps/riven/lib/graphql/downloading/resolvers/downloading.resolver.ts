import { MediaItem } from "@repo/util-plugin-sdk/dto/entities";

import { Arg, Ctx, Mutation, Resolver } from "type-graphql";

import {
  PersistDownloadResultsInput,
  persistDownloadResults,
} from "../mutations/persist-download-results.ts";

import type { ApolloServerContext } from "@repo/core-util-graphql-schema";

@Resolver()
export class DownloadingResolver {
  @Mutation(() => MediaItem)
  async persistDownloadResults(
    @Ctx() { em }: ApolloServerContext,
    @Arg("input", () => PersistDownloadResultsInput)
    input: PersistDownloadResultsInput,
  ) {
    return persistDownloadResults(input, em);
  }
}
