import { gql } from "@apollo/client";

import type {
  GetCalendarDataQuery,
  GetCalendarDataQueryVariables,
} from "./get-calendar-data.query.typegen";
import type { TypedDocumentNode } from "@apollo/client";

export const GET_CALENDAR_DATA: TypedDocumentNode<
  GetCalendarDataQuery,
  GetCalendarDataQueryVariables
> = gql`
  query GetCalendarData($from: DateTimeISO!, $to: DateTimeISO!) {
    calendar(from: $from, to: $to) {
      ... on MediaItem {
        id
        title
        releaseDate
        type
        primaryExternalId
      }

      ... on Season {
        number
      }

      ... on Episode {
        number
        seasonNumber
      }
    }
  }
`;
