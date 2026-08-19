import { gql } from "@apollo/client";

import type {
  RivenTuiGetMediaItemActiveStreamQuery,
  RivenTuiGetMediaItemActiveStreamQueryVariables,
} from "./get-media-item-active-stream.query.typegen.ts";
import type { TypedDocumentNode } from "@apollo/client";

export const GET_MEDIA_ITEM_ACTIVE_STREAM: TypedDocumentNode<
  RivenTuiGetMediaItemActiveStreamQuery,
  RivenTuiGetMediaItemActiveStreamQueryVariables
> = gql`
  query RivenTuiGetMediaItemActiveStream($mediaItemId: ID!) {
    mediaItemById(id: $mediaItemId) {
      ... on MediaItem {
        activeStream {
          infoHash
          parsedData
        }
      }
    }
  }
`;
