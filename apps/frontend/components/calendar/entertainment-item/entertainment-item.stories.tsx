import { preview } from "@/.storybook/preview";

import { EntertainmentItem } from "./entertainment-item";

import type { EntertainmentItemData } from "../types";

const meta = preview.meta({
  title: "Calendar / EntertainmentItem",
  component: EntertainmentItem,
});

const movie: EntertainmentItemData = {
  itemId: "0000-0000-0000-0000-0000",
  tvdbId: "",
  tmdbId: "603692",
  showTitle: "John Wick: Chapter 4",
  itemType: "movie",
  airedAt: "2023-03-24",
};

const episode: EntertainmentItemData = {
  itemId: "0000-0000-0000-0000-0001",
  tvdbId: "121361",
  tmdbId: "1399",
  showTitle: "Game of Thrones",
  itemType: "episode",
  airedAt: "2019-04-14",
  season: 8,
  episode: 1,
};

const show: EntertainmentItemData = {
  itemId: "0000-0000-0000-0000-0002",
  tvdbId: "371572",
  tmdbId: "94605",
  showTitle: "Arcane",
  itemType: "show",
  airedAt: "2024-11-09",
};

const completedEpisode: EntertainmentItemData = {
  ...episode,
  itemId: "0000-0000-0000-0000-0003",
  lastState: "Completed",
};

export const Movie = meta.story({
  args: { item: movie },
});

export const Episode = meta.story({
  args: { item: episode },
});

export const Show = meta.story({
  args: { item: show },
});

export const Completed = meta.story({
  args: { item: completedEpisode },
});

export const Compact = meta.story({
  args: { item: episode, compact: true },
});

export const AllTypesCompact = meta.story({
  render: () => (
    <div className="flex w-64 flex-col gap-1.5">
      <EntertainmentItem item={movie} compact />
      <EntertainmentItem item={episode} compact />
      <EntertainmentItem item={show} compact />
    </div>
  ),
});
