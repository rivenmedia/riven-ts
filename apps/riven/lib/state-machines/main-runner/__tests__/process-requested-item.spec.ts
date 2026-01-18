import { database } from "@repo/core-util-database/database";
import { RequestedItem } from "@repo/util-plugin-sdk/dto/entities/media-items/requested-item.entity";

import { expect, vi } from "vitest";

import { it } from "./helpers/test-context.ts";

import type { MediaItem } from "@repo/util-plugin-sdk/dto/entities/index";
import type { MediaItemCreationErrorConflictEvent } from "@repo/util-plugin-sdk/schemas/events/media-item.creation.error.conflict.event";
import type { MediaItemCreationSuccessEvent } from "@repo/util-plugin-sdk/schemas/events/media-item.creation.success.event";

it('processes the requested item when a "riven-plugin.media-item.requested" event is received', async ({
  actor,
}) => {
  const requestedId = "tt7654321";

  const pluginRunnerRef = actor
    .getSnapshot()
    .context.pluginRefs.get(Symbol.for("@repo/plugin-test"));

  vi.spyOn(pluginRunnerRef!, "send");

  actor.send({
    type: "riven-plugin.media-item.requested",
    item: {
      imdbId: requestedId,
    },
    plugin: Symbol.for("@repo/plugin-test"),
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

it('sends an conflict event when a "riven-plugin.media-item.requested" event is received for an item that already exists', async ({
  actor,
}) => {
  const requestedId = "tt1234567";

  const requestedItem = new RequestedItem();

  requestedItem.imdbId = requestedId;
  requestedItem.state = "Requested";

  await database.mediaItem.insert(requestedItem);

  actor.start();

  const pluginRunnerRef = actor
    .getSnapshot()
    .context.pluginRefs.get(Symbol.for("@repo/plugin-test"));

  vi.spyOn(pluginRunnerRef!, "send");

  actor.send({
    type: "riven-plugin.media-item.requested",
    item: {
      imdbId: requestedId,
    },
    plugin: Symbol.for("@repo/plugin-test"),
  });

  const expectedEvent = {
    type: "riven.media-item.creation.error.conflict",
    item: expect.objectContaining<Partial<MediaItem>>({
      imdbId: requestedId,
      id: 1,
    }) as never,
  } satisfies MediaItemCreationErrorConflictEvent;

  await vi.waitFor(() => {
    expect(actor).toHaveReceivedEvent(expectedEvent);
    expect(pluginRunnerRef).toHaveReceivedEvent(expectedEvent);
  });
});
