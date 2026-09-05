import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/_ui/dialog";

import { EntertainmentItem } from "../entertainment-item/entertainment-item";
import { formatDayTitle } from "../utilities/format-day-title";

import type { CalendarDay } from "../types";

export interface DayItemsListProps {
  day: CalendarDay;
  limit?: number;
  showMore?: boolean;
}

export function DayItemsList({
  day,
  limit = Infinity,
  showMore = false,
}: DayItemsListProps) {
  const itemsToShow = day.items.slice(0, limit);

  return (
    <div className="space-y-1.5">
      {itemsToShow.map((item) => (
        <EntertainmentItem
          key={item.itemId}
          item={item}
          compact={limit !== Infinity}
        />
      ))}
      {showMore && day.items.length > limit && (
        <Dialog>
          <DialogTrigger>
            <button
              className="text-muted-foreground hover:text-foreground w-full rounded-md px-2 py-1 text-left text-xs font-medium transition-colors hover:bg-white/5"
              type="button"
            >
              +{day.items.length - limit} more
            </button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="text-lg font-bold">
                {formatDayTitle(day.date)}
              </DialogTitle>
              <DialogDescription>
                {day.items.length} item{day.items.length === 1 ? "" : "s"}
              </DialogDescription>
            </DialogHeader>
            <div className="mt-4 max-h-96 space-y-2 overflow-y-auto">
              {day.items.map((item) => (
                <EntertainmentItem key={item.itemId} item={item} />
              ))}
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
