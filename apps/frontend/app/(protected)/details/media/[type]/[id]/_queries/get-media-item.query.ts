import { gql } from "@apollo/client";

import type {
  GetMediaItemQuery,
  GetMediaItemQueryVariables,
} from "./get-media-item.query.typegen";
import type { TypedDocumentNode } from "@apollo/client";

export const GET_MEDIA_ITEM: TypedDocumentNode<
  GetMediaItemQuery,
  GetMediaItemQueryVariables
> = gql`
  query GetMediaItem($id: ID!) {
    tmdbItem(id: $id) {
      id
      backdropUrl
      # logo
      trailer {
        id
        name
        site
        key
        url
      }
      title
      posterUrl
      overview
      genres {
        id
        name
      }
      year
      runtime
      language
      certification
      # status
      # seasons {
      #   id
      #   name
      #   seasonNumber
      #   episodeCount
      #   completedCount
      #   image
      # }
      # totalFileCount
      # completedFileCount
      type
      # state
      # filesystemEntries {
      #   id
      #   fileSize {
      #     size
      #     units
      #   }
      #   createdAt
      #   type
      #   originalFilename
      #   plugin
      # }
      # mediaMetadata {
      #   subtitleTracks {
      #     language
      #   }
      #   qualitySource
      #   isRemux
      #   isProper
      #   isRepack
      #   bitRate
      #   duration
      #   containerFormat
      #   audioTracks {
      #     channels
      #     codec
      #   }
      #   fileName
      #   video {
      #     resolution {
      #       width
      #       height
      #       codec
      #       bitDepth
      #       hdrType
      #       frameRate
      #     }
      #   }
      # }
    }
  }
`;
