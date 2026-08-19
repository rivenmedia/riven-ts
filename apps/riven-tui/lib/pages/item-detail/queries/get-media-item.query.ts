import { gql } from "@apollo/client";

import type {
  RivenTuiGetMediaItemQuery,
  RivenTuiGetMediaItemQueryVariables,
} from "./get-media-item.query.typegen.ts";
import type { TypedDocumentNode } from "@apollo/client";

export const GET_MEDIA_ITEM: TypedDocumentNode<
  RivenTuiGetMediaItemQuery,
  RivenTuiGetMediaItemQueryVariables
> = gql`
  query RivenTuiGetMediaItem($mediaItemId: ID!) {
    mediaItemById(id: $mediaItemId) {
      ... on MediaItem {
        id
        fullTitle
        year
        state
        itemRequest {
          id
        }
        hasActiveStream
        mediaEntryCount
        childItemCount
        streamCount
        processorJobId
        subtitlesCount
      }
    }
  }
`;
