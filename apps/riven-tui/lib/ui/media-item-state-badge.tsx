import { Text } from "ink";

import type { MediaItemState } from "../types/__generated__/graphql.ts";
import type { TextProps } from "ink";

const STATE_LABELS = {
  completed: "Completed",
  downloaded: "Downloaded",
  failed: "Failed",
  indexed: "Indexed",
  partially_completed: "Partially completed",
  paused: "Paused",
  scraped: "Scraped",
  unreleased: "Unreleased",
} as const satisfies Record<MediaItemState, string>;

const STATE_COLORS = {
  completed: "green",
  downloaded: "cyan",
  failed: "red",
  indexed: "gray",
  partially_completed: "yellow",
  paused: "gray",
  scraped: "blue",
  unreleased: "magenta",
} as const satisfies Record<MediaItemState, TextProps["color"]>;

function stateLabel(
  state: MediaItemState,
  isRequested: boolean | undefined,
): string {
  if (isRequested === false) {
    return "Unrequested";
  }

  return STATE_LABELS[state];
}

function stateColor(
  state: MediaItemState,
  isRequested: boolean | undefined,
): NonNullable<TextProps["color"]> {
  if (isRequested === false) {
    return "gray";
  }

  return STATE_COLORS[state];
}

export interface MediaItemStateBadgeProps {
  state: MediaItemState;
  isRequested?: boolean | undefined;
}

export function MediaItemStateBadge({
  state,
  isRequested,
}: MediaItemStateBadgeProps) {
  return (
    <Text bold color={stateColor(state, isRequested)}>
      {stateLabel(state, isRequested)}
    </Text>
  );
}
