import { type TypedDocumentNode, gql } from "@apollo/client";

import { client } from "../../../graphql/apollo-client.ts";
import { logger } from "../../../utilities/logger/logger.ts";
import { scrapeItemProcessorSchema } from "./scrape-item.schema.ts";

import type {
  ScrapeMediaItemMutation,
  ScrapeMediaItemMutationVariables,
} from "./scrape-item.processor.typegen.ts";
import type { ParsedData } from "@repo/util-rank-torrent-name";

const SCRAPE_MEDIA_ITEM_MUTATION: TypedDocumentNode<
  ScrapeMediaItemMutation,
  ScrapeMediaItemMutationVariables
> = gql`
  mutation ScrapeMediaItem($input: ScrapeMediaItemMutationInput!) {
    scrapeMediaItem(input: $input) {
      item {
        ... on Node {
          id
        }
      }
      newStreamsCount
      errorCode
    }
  }
`;

export const scrapeItemProcessor = scrapeItemProcessorSchema.implementAsync(
  async function ({ job }) {
    const children = await job.getChildrenValues();

    const parsedResults = Object.values(children).reduce<
      Record<string, ParsedData>
    >((acc, scrapeResult) => Object.assign(acc, scrapeResult.results), {});

    const { data } = await client.mutate({
      mutation: SCRAPE_MEDIA_ITEM_MUTATION,
      variables: {
        input: {
          id: job.data.id,
          results: parsedResults,
        },
      },
    });

    if (!data?.scrapeMediaItem) {
      throw new Error("No data returned from scrapeMediaItem mutation");
    }

    switch (data.scrapeMediaItem.errorCode) {
      case "no_new_streams": {
        logger.warn(
          "No new streams found for media item with ID: " + job.data.id,
        );

        break;
      }
      case "incorrect_state": {
        logger.error("Incorrect state for media item with ID: " + job.data.id);

        break;
      }
      case "scrape_error": {
        logger.error("Scrape error for media item with ID: " + job.data.id);

        break;
      }
    }
  },
);
