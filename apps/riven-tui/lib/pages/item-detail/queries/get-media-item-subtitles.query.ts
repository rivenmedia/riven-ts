import { gql } from "@apollo/client";

import type {
  RivenTuiGetMediaItemSubtitlesQuery,
  RivenTuiGetMediaItemSubtitlesQueryVariables,
} from "./get-media-item-subtitles.query.typegen.ts";
import type { TypedDocumentNode } from "@apollo/client";

export const GET_MEDIA_ITEM_SUBTITLES: TypedDocumentNode<
  RivenTuiGetMediaItemSubtitlesQuery,
  RivenTuiGetMediaItemSubtitlesQueryVariables
> = gql`
  query RivenTuiGetMediaItemSubtitles($mediaItemId: ID!) {
    mediaItemById(id: $mediaItemId) {
      ... on MediaItem {
        subtitles {
          language
          fileHash
          sourceId
          sourceProvider
        }
      }
    }
  }
`;
