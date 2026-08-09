import { render } from "ink-testing-library";
import { describe, expect, it } from "vitest";

import { StateBadge, stateColor, stateLabel } from "./state-badge.tsx";

import type { MediaItemState } from "../types/__generated__/graphql.ts";

const ALL_STATES: MediaItemState[] = [
  "completed",
  "downloaded",
  "failed",
  "indexed",
  "partially_completed",
  "paused",
  "scraped",
  "unreleased",
];

describe(stateLabel, () => {
  it("has a human-readable label for every state", () => {
    expect.hasAssertions();

    for (const state of ALL_STATES) {
      expect(stateLabel(state).length).toBeGreaterThan(0);
    }
  });
});

describe(stateColor, () => {
  it("has a color for every state", () => {
    expect.hasAssertions();

    for (const state of ALL_STATES) {
      expect(stateColor(state).length).toBeGreaterThan(0);
    }
  });

  it("uses a different color for failed than completed", () => {
    expect(stateColor("failed")).not.toBe(stateColor("completed"));
  });
});

describe(StateBadge, () => {
  it("renders the label for the given state", () => {
    const { lastFrame } = render(<StateBadge state="partially_completed" />);

    expect(lastFrame()).toContain("Partially completed");
  });
});
