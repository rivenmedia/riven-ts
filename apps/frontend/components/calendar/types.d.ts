import type {
  MediaItem,
  MediaItemType,
} from "#app/_types/__generated__/graphql.ts";
import type { DateTime } from "luxon";
import type { ComponentType, HTMLAttributes } from "react";

export type EntertainmentItemData = Pick<
  MediaItem,
  "id" | "primaryExternalId" | "title" | "type" | "releaseDate" | "state"
> &
  (
    | {
        type: "season";
        number: number;
      }
    | {
        type: "episode";
        number: number;
        seasonNumber: number;
      }
    | {
        type: "movie" | "show";
        number?: never;
        seasonNumber?: never;
      }
  );

export interface CalendarDay {
  date: DateTime;
  dateKey: string;
  isCurrentMonth: boolean;
  items: EntertainmentItemData[];
}

export interface FilterOption {
  id: string;
  label: string;
  type: MediaItemType;
  icon: ComponentType<HTMLAttributes>;
}
