import { gql } from "@apollo/client";

import type {
  RivenTuiGetMediaItemFilesQuery,
  RivenTuiGetMediaItemFilesQueryVariables,
} from "./get-media-item-files.query.typegen.ts";
import type { TypedDocumentNode } from "@apollo/client";

export const GET_MEDIA_ITEM_FILES: TypedDocumentNode<
  RivenTuiGetMediaItemFilesQuery,
  RivenTuiGetMediaItemFilesQueryVariables
> = gql`
  query RivenTuiGetMediaItemFiles($mediaItemId: ID!) {
    mediaItemById(id: $mediaItemId) {
      ... on MediaItem {
        mediaEntries {
          id
          fileSize(units: gigabyte) {
            size
            units
          }
          originalFilename
          provider
          plugin
        }
      }
    }
  }
`;
