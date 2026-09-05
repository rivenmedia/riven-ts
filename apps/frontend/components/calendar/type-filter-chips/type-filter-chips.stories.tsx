import { preview } from "@/.storybook/preview";

import { Film, Tv } from "lucide-react";
import { useState } from "react";
import { expect, fn } from "storybook/test";

import { TypeFilterChips } from "./type-filter-chips";

import type { FilterOption } from "../types";

const options = [
  { id: "movies", label: "Movies", type: "movie", icon: Film },
  { id: "episodes", label: "Episodes", type: "episode", icon: Tv },
  { id: "shows", label: "Shows", type: "show", icon: Tv },
  { id: "seasons", label: "Seasons", type: "season", icon: Tv },
] as const satisfies readonly FilterOption[];

const meta = preview.meta({
  title: "Calendar / TypeFilterChips",
  component: TypeFilterChips,
  args: {
    options,
    onChange: fn(),
  },
  render: (args) => {
    const [filters, setFilters] = useState(args.filters);

    return (
      <TypeFilterChips
        {...args}
        filters={filters}
        onChange={(newFilters) => {
          setFilters(newFilters);

          args.onChange(newFilters);
        }}
      />
    );
  },
});

export const AllSelected = meta.story({
  args: {
    filters: {
      movie: true,
      episode: true,
      show: true,
      season: true,
    },
  },
});

AllSelected.test(
  "Toggles the filter when clicked",
  async ({ canvas, userEvent }) => {
    const movieFilter = canvas.getByRole("checkbox", { name: /movies/iu });

    await userEvent.click(movieFilter);

    await expect(movieFilter).not.toBeChecked();

    await userEvent.click(movieFilter);

    await expect(movieFilter).toBeChecked();
  },
);

export const SomeSelected = meta.story({
  args: {
    filters: {
      movie: true,
      episode: false,
      show: true,
      season: false,
    },
  },
});
