import { preview } from "@/.storybook/preview";

import { fn } from "storybook/test";

import { FilterPopover } from "./filter-popover";

const meta = preview.meta({
  title: "Components / FilterPopover",
  component: FilterPopover,
  args: {
    onApply: fn(),
  },
});

export const MovieFilters = meta.story({
  args: {
    mediaType: "movie",
  },
});

export const ShowFilters = meta.story({
  args: {
    mediaType: "show",
  },
});
