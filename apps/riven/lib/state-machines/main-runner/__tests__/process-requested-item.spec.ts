import { database } from "@repo/core-util-database/connection";
import { RequestedItem } from "@repo/util-plugin-sdk/dto/entities/media-items/requested-item.entity";

import { expect, vi } from "vitest";

import { it } from "./helpers/test-context.ts";

import type { MediaItem } from "@repo/util-plugin-sdk/dto/entities/index";
import type { MediaItemCreationAlreadyExistsEvent } from "@repo/util-plugin-sdk/program-to-plugin-events/media-item/creation/already-exists";
import type { MediaItemCreationSuccessEvent } from "@repo/util-plugin-sdk/program-to-plugin-events/media-item/creation/success";

it('processes the requested item when a "riven-plugin.media-item.requested" event is received', async ({
  actor,
}) => {
  const requestedId = "tt7654321";

  actor.start();

  const pluginRunnerRef = actor
    .getSnapshot()
    .context.pluginRefs.get(Symbol.for("Test"));

  vi.spyOn(pluginRunnerRef!, "send");

  actor.send({
    type: "riven-plugin.media-item.requested",
    item: {
      imdbId: requestedId,
    },
    plugin: Symbol.for("Test"),
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

it('sends an already-exists event when a "riven-plugin.media-item.requested" event is received for an item that already exists', async ({
  actor,
}) => {
  const requestedId = "tt1234567";

  await database.manager.insert(RequestedItem, {
    imdbId: requestedId,
    state: "Requested",
  });

  actor.start();

  const pluginRunnerRef = actor
    .getSnapshot()
    .context.pluginRefs.get(Symbol.for("Test"));

  vi.spyOn(pluginRunnerRef!, "send");

  actor.send({
    type: "riven-plugin.media-item.requested",
    item: {
      imdbId: requestedId,
    },
    plugin: Symbol.for("Test"),
  });

  const expectedEvent = {
    type: "riven.media-item.creation.already-exists",
    item: expect.objectContaining<Partial<MediaItem>>({
      imdbId: requestedId,
      id: 1,
    }) as never,
  } satisfies MediaItemCreationAlreadyExistsEvent;

  await vi.waitFor(() => {
    expect(actor).toHaveReceivedEvent(expectedEvent);
    expect(pluginRunnerRef).toHaveReceivedEvent(expectedEvent);
  });
});
