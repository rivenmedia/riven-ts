import { describe, expect, it } from "vitest";

import { ACTIONS, getActionsFor } from "./registry.ts";

describe(getActionsFor, () => {
  it("only returns actions that apply to the given media item type", () => {
    expect.hasAssertions();

    for (const action of getActionsFor("Movie")) {
      expect(action.appliesTo).toContain("Movie");
    }
  });

  it("excludes actions that don't apply to the given type", () => {
    const episodeActions = getActionsFor("Episode");

    expect(episodeActions.map((action) => action.id)).not.toContain(
      "remove-request",
    );
  });
});

describe("action.run", () => {
  it("resolves with a success result describing the target", async () => {
    const [action] = ACTIONS;

    expect.assert(action);

    const result = await action.run({
      id: "movie-1",
      title: "Example Movie",
      type: "Movie",
    });

    expect(result.status).toBe("success");
    expect(result.message).toContain("Example Movie");
  });
});
