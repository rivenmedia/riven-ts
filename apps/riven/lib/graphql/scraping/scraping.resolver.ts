import { MediaItem } from "@repo/util-plugin-sdk/dto/entities";

import { Arg, Ctx, Mutation, Resolver } from "type-graphql";

import {
  PersistScrapeResultsInput,
  persistScrapeResults,
} from "./utilities/persist-scrape-results.ts";

import type { ApolloServerContext } from "@repo/core-util-graphql-schema";

@Resolver()
export class ScrapingResolver {
  @Mutation(() => MediaItem)
  async persistScrapeResults(
    @Ctx() { em }: ApolloServerContext,
    @Arg("input", () => PersistScrapeResultsInput)
    input: PersistScrapeResultsInput,
  ): Promise<MediaItem> {
    return persistScrapeResults(input, em);
  }
}
