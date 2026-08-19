import { gql } from "@apollo/client";

import type {
  RivenTuiGetMediaItemProcessingDataQuery,
  RivenTuiGetMediaItemProcessingDataQueryVariables,
} from "./get-media-item-processing-data.query.typegen.ts";
import type { TypedDocumentNode } from "@apollo/client";

export const GET_MEDIA_ITEM_PROCESSING_DATA: TypedDocumentNode<
  RivenTuiGetMediaItemProcessingDataQuery,
  RivenTuiGetMediaItemProcessingDataQueryVariables
> = gql`
  query RivenTuiGetMediaItemProcessingData($mediaItemId: ID!) {
    mediaItemById(id: $mediaItemId) {
      ... on MediaItem {
        nextScrapeAttemptAt
      }
    }
  }
`;
