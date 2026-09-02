import { preview } from "@/.storybook/preview";

import { Film, Tv } from "lucide-react";

import { TypeFilterChips } from "./type-filter-chips";

import type { FilterOption } from "../types";

const options: FilterOption[] = [
  { id: "movies", label: "Movies", type: "movie", icon: Film },
  { id: "episodes", label: "Episodes", type: "episode", icon: Tv },
  { id: "shows", label: "Shows", type: "show", icon: Tv },
  { id: "seasons", label: "Seasons", type: "season", icon: Tv },
];

const meta = preview.meta({
  title: "Calendar / TypeFilterChips",
  component: TypeFilterChips,
});

export const AllSelected = meta.story({
  args: {
    options,
    filters: { movie: true, episode: true, show: true, season: true },
  },
});

export const SomeSelected = meta.story({
  args: {
    options,
    filters: { movie: true, episode: false, show: true, season: false },
  },
});
