import z from "zod";

import { ShutdownEvent, ShutdownEventHandler } from "./core/shutdown.ts";
import { CoreStartedEvent, CoreStartedEventHandler } from "./core/started.ts";
import {
  ContentServiceRequestedEvent,
  ContentServiceRequestedEventHandler,
} from "./media-item/content-service-requested.ts";
import {
  MediaItemCreationAlreadyExistsEvent,
  MediaItemCreationAlreadyExistsEventHandler,
} from "./media-item/creation/already-exists.ts";
import {
  MediaItemCreationErrorEvent,
  MediaItemCreationErrorEventHandler,
} from "./media-item/creation/error.ts";
import {
  MediaItemCreationSuccessEvent,
  MediaItemCreationSuccessEventHandler,
} from "./media-item/creation/success.ts";
import {
  MediaItemIndexRequestedEvent,
  MediaItemIndexRequestedEventHandler,
} from "./media-item/index-requested.ts";
import {
  MediaItemIndexAlreadyExistsEvent,
  MediaItemIndexAlreadyExistsEventHandler,
} from "./media-item/index/already-exists.ts";
import {
  MediaItemIndexErrorEvent,
  MediaItemIndexErrorEventHandler,
} from "./media-item/index/error.ts";
import {
  MediaItemIndexSuccessEvent,
  MediaItemIndexSuccessEventHandler,
} from "./media-item/index/success.ts";
import {
  MediaItemScrapeRequestedEvent,
  MediaItemScrapeRequestedEventHandler,
} from "./media-item/scrape-requested.ts";

export const RivenEvent = z.discriminatedUnion("type", [
  CoreStartedEvent,
  MediaItemCreationSuccessEvent,
  MediaItemCreationAlreadyExistsEvent,
  MediaItemCreationErrorEvent,
  MediaItemIndexRequestedEvent,
  MediaItemIndexSuccessEvent,
  MediaItemIndexAlreadyExistsEvent,
  MediaItemIndexErrorEvent,
  ContentServiceRequestedEvent,
  ShutdownEvent,
  MediaItemScrapeRequestedEvent,
]);

export type RivenEvent = z.infer<typeof RivenEvent>;

export const RivenEventHandler = {
  "riven.core.started": CoreStartedEventHandler,
  "riven.media-item.creation.already-exists":
    MediaItemCreationAlreadyExistsEventHandler,
  "riven.media-item.creation.error": MediaItemCreationErrorEventHandler,
  "riven.media-item.creation.success": MediaItemCreationSuccessEventHandler,
  "riven.media-item.index.requested": MediaItemIndexRequestedEventHandler,
  "riven.content-service.requested": ContentServiceRequestedEventHandler,
  "riven.core.shutdown": ShutdownEventHandler,
  "riven.media-item.index.already-exists":
    MediaItemIndexAlreadyExistsEventHandler,
  "riven.media-item.index.error": MediaItemIndexErrorEventHandler,
  "riven.media-item.index.success": MediaItemIndexSuccessEventHandler,
  "riven.media-item.scrape.requested": MediaItemScrapeRequestedEventHandler,
} as const satisfies Record<RivenEvent["type"], z.ZodFunction>;
