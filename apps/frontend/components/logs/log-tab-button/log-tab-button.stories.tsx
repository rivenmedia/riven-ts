import { preview } from "@/.storybook/preview";

import { fn } from "storybook/test";

import { LogTabButton } from "./log-tab-button";

const meta = preview.meta({
  title: "Logs / LogTabButton",
  component: LogTabButton,
  args: {
    name: "Live Logs",
    onclick: fn(),
  },
});

export const Active = meta.story({
  args: {
    isActive: true,
  },
});

export const Inactive = meta.story({
  args: {
    isActive: false,
  },
});
