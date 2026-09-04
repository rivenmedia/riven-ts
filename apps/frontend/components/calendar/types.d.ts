import type { MediaItemType } from "@repo/util-plugin-sdk/dto/enums/media-item-type.enum";
import type { DateTime } from "luxon";
import type { UUID } from "node:crypto";
import type { ComponentType } from "react";

export interface EntertainmentItemData {
  itemId: UUID;
  tvdbId: string;
  tmdbId: string;
  showTitle: string;
  itemType: MediaItemType;
  airedAt: string;
  season?: number;
  episode?: number;
  lastState?: string;
}

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
