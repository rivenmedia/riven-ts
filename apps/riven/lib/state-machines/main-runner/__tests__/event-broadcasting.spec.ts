import { expect, vi } from "vitest";

import { it } from "./helpers/test-context.ts";

import type { RivenEvent } from "@repo/util-plugin-sdk/events";

const testCases = {
  "riven.core.started": {
    type: "riven.core.started",
  },
  "riven.media-item.creation.already-exists": {
    type: "riven.media-item.creation.already-exists",
    item: {
      id: 1,
      imdbId: "tt1234567",
    },
  },
  "riven.media-item.creation.error": {
    error: new Error("Test error"),
    item: {
      imdbId: "tt1234567",
    },
    type: "riven.media-item.creation.error",
  },
  "riven.media-item.creation.success": {
    item: {
      id: 1,
      imdbId: "tt1234567",
      state: "Requested",
    },
    type: "riven.media-item.creation.success",
  },
} satisfies {
  [Event in RivenEvent["type"]]: Extract<RivenEvent, { type: Event }>;
};

it.for(Object.values(testCases))(
  "broadcasts the $type event to all plugins",
  (event, { actor }) => {
    actor.start();

    const pluginRunnerRef = actor
      .getSnapshot()
      .context.pluginRefs.get(Symbol.for("@repo/plugin-test"));

    vi.spyOn(pluginRunnerRef!, "send");

    actor.send(event);

    actor.getSnapshot().context.pluginRefs.forEach((pluginRef) => {
      expect(pluginRef).toHaveReceivedEvent(event);
    });
  },
);

it.for(
  PluginToProgramEvent.options.map(
    (option) => option.shape.type.values.values().next().value!,
  ),
)('does not forward the "%s" event to plugins', (event, { actor }) => {
  actor.start();

  const pluginRunnerRef = actor
    .getSnapshot()
    .context.pluginRefs.get(Symbol.for("@repo/plugin-test"));

  vi.spyOn(pluginRunnerRef!, "send");

  actor.send({
    type: event,
  } as never);

  actor.getSnapshot().context.pluginRefs.forEach((pluginRef) => {
    expect(pluginRef.send).not.toHaveBeenCalled();
  });
});
