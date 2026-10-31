import { preview } from "#.storybook/preview.tsx";
import { EntertainmentItem } from "#components/calendar/entertainment-item/entertainment-item.tsx";

import type { EntertainmentItemData } from "#components/calendar/types.d.ts";

const meta = preview.meta({
  title: "Calendar / EntertainmentItem",
  component: EntertainmentItem,
});

const movie: EntertainmentItemData = {
  id: "0000-0000-0000-0000-0000",
  primaryExternalId: "603692",
  title: "John Wick: Chapter 4",
  type: "movie",
  releaseDate: "2023-03-24",
  state: "indexed",
};

const episode: EntertainmentItemData = {
  id: "0000-0000-0000-0000-0001",
  primaryExternalId: "121361",
  title: "Game of Thrones",
  type: "episode",
  releaseDate: "2019-04-14",
  seasonNumber: 8,
  number: 1,
  state: "indexed",
};

const show: EntertainmentItemData = {
  id: "0000-0000-0000-0000-0002",
  primaryExternalId: "371572",
  title: "Arcane",
  type: "show",
  releaseDate: "2024-11-09",
  state: "indexed",
};

const completedEpisode: EntertainmentItemData = {
  ...episode,
  id: "0000-0000-0000-0000-0003",
  state: "completed",
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
