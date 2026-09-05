import { preview } from "@/.storybook/preview";

import { LiveLogLine } from "./live-log-line";

const meta = preview.meta({
  title: "Logs Viewer / LiveLogLine",
  component: LiveLogLine,
});

export const Default = meta.story({
  args: {
    line: "[2024-06-12 10:32:01] Riven started successfully on port 8080",
  },
});

export const LongLine = meta.story({
  args: {
    line: "[2024-06-12 10:32:05] Processing 42 items from queue: John Wick Chapter 4, The Batman, Dune Part Two, Oppenheimer, Everything Everywhere All at Once...",
  },
});
