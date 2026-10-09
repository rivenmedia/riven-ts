import { gql } from "@apollo/client";

import type {
  GetMediaItemQuery,
  GetMediaItemQueryVariables,
} from "./get-media-item.query.typegen.ts";
import type { TypedDocumentNode } from "@apollo/client";

export const GET_MEDIA_ITEM: TypedDocumentNode<
  GetMediaItemQuery,
  GetMediaItemQueryVariables
> = gql`
  query GetMediaItem($id: ID!) {
    mediaDetails(id: $id) {
      totalFileCount
      completedFileCount
      details {
        id
        backdropPath
        logo
        trailer {
          id
          name
          site
          key
          url
        }
        title
        posterPath
        overview
        recommendations {
          id
          title
          posterPath
          type
          year
        }
        similar {
          id
          title
          posterPath
          type
          year
        }
        genres {
          id
          name
        }
        cast {
          id
          name
          character
          profilePath
        }
        year
        formattedRuntime
        originalLanguage
        certification
        status
        seasons {
          id
          name
          seasonNumber
          episodeCount
          completedCount
          image
        }
      }
      type
      state
      filesystemEntries {
        id
        fileSize {
          size
          units
        }
        createdAt
        type
        originalFilename
        plugin
      }
      mediaMetadata {
        subtitleTracks {
          language
        }
        qualitySource
        isRemux
        isProper
        isRepack
        bitRate
        duration
        containerFormat
        audioTracks {
          channels
          codec
        }
        fileName
        video {
          resolution {
            width
            height
            codec
            bitDepth
            hdrType
            frameRate
          }
        }
      }
    }
  }
`;
