import { gql } from "@apollo/client";

import type {
  RivenTuiGetMediaItemStreamsQuery,
  RivenTuiGetMediaItemStreamsQueryVariables,
} from "./get-media-item-streams.query.typegen.ts";
import type { TypedDocumentNode } from "@apollo/client";

export const GET_MEDIA_ITEM_STREAMS: TypedDocumentNode<
  RivenTuiGetMediaItemStreamsQuery,
  RivenTuiGetMediaItemStreamsQueryVariables
> = gql`
  query RivenTuiGetMediaItemStreams($mediaItemId: ID!) {
    mediaItemById(id: $mediaItemId) {
      ... on MediaItem {
        streams {
          infoHash
          parsedData
        }
      }
    }
  }
`;
