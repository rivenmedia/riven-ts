import { expect, vi } from "vitest";

import { it } from "./helpers/test-context.ts";

import type { RequestedItem } from "@repo/util-plugin-sdk/dto/entities/media-items/requested-item.entity";
import type { MediaItemCreationSuccessEvent } from "@repo/util-plugin-sdk/program-to-plugin-events/media-item/creation/success";

it('processes the requested item when a "riven-plugin.media-item.requested" event is received', async ({
  actor,
}) => {
  const requestedId = "tt7654321";

  actor.start();

  const pluginRunnerRef = actor
    .getSnapshot()
    .context.pluginRefs.get(Symbol.for("Plugin: Test"));

  vi.spyOn(pluginRunnerRef!, "send");

  actor.send({
    type: "riven-plugin.media-item.requested",
    item: {
      imdbId: requestedId,
    },
    plugin: Symbol.for("Plugin: Test"),
  });

  const expectedEvent = {
    type: "riven.media-item.creation.success",
    item: expect.objectContaining<Partial<RequestedItem>>({
      imdbId: requestedId,
      state: "Requested",
      id: 1,
    }) as never,
  } satisfies MediaItemCreationSuccessEvent;

  await vi.waitFor(() => {
    expect(actor).toHaveReceivedEvent(expectedEvent);
    expect(pluginRunnerRef).toHaveReceivedEvent(expectedEvent);
  });
});
