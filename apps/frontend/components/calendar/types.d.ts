import type { CalendarDate } from "@internationalized/date";
import type { MediaItemType } from "@repo/util-plugin-sdk/dto/enums/media-item-type.enum";
import type { ComponentType } from "react";

export interface EntertainmentItemData {
  itemId: number;
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
  date: CalendarDate;
  dateKey: string;
  isCurrentMonth: boolean;
  items: EntertainmentItemData[];
}

export interface FilterOption {
  id: string;
  label: string;
  type: string;
  icon: ComponentType;
}
