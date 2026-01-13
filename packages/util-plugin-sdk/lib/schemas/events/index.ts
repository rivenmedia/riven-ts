import z from "zod";

import {
  ContentServiceRequestedEvent,
  ContentServiceRequestedEventHandler,
} from "./content-service-requested.event.ts";
import {
  CoreShutdownEvent,
  CoreShutdownEventHandler,
} from "./core.shutdown.event.ts";
import {
  CoreStartedEvent,
  CoreStartedEventHandler,
} from "./core.started.event.ts";
import {
  MediaItemCreationErrorConflictEvent,
  MediaItemCreationErrorConflictEventHandler,
} from "./media-item.creation.error.conflict.event.ts";
import {
  MediaItemCreationErrorEvent,
  MediaItemCreationErrorEventHandler,
} from "./media-item.creation.error.event.ts";
import {
  MediaItemCreationSuccessEvent,
  MediaItemCreationSuccessEventHandler,
} from "./media-item.creation.success.event.ts";
import {
  MediaItemDownloadRequestedEvent,
  MediaItemDownloadRequestedEventHandler,
} from "./media-item.download-requested.event.ts";
import {
  MediaItemDownloadErrorEvent,
  MediaItemDownloadErrorEventHandler,
} from "./media-item.download.error.event.ts";
import {
  MediaItemDownloadErrorIncorrectStateEvent,
  MediaItemDownloadErrorIncorrectStateEventHandler,
} from "./media-item.download.incorrect-state.event.ts";
import {
  MediaItemDownloadSuccessEvent,
  MediaItemDownloadSuccessEventHandler,
} from "./media-item.download.success.event.ts";
import {
  MediaItemIndexErrorEvent,
  MediaItemIndexErrorEventHandler,
} from "./media-item.index.error.event.ts";
import {
  MediaItemIndexErrorIncorrectStateEvent,
  MediaItemIndexErrorIncorrectStateEventHandler,
} from "./media-item.index.incorrect-state.event.ts";
import {
  MediaItemIndexRequestedEvent,
  MediaItemIndexRequestedEventHandler,
} from "./media-item.index.requested.event.ts";
import {
  MediaItemIndexSuccessEvent,
  MediaItemIndexSuccessEventHandler,
} from "./media-item.index.success.event.ts";
import {
  MediaItemScrapeRequestedEvent,
  MediaItemScrapeRequestedEventHandler,
} from "./media-item.scrape-requested.event.ts";
import {
  MediaItemScrapeErrorEvent,
  MediaItemScrapeErrorEventHandler,
} from "./media-item.scrape.error.event.ts";
import {
  MediaItemScrapeErrorIncorrectStateEvent,
  MediaItemScrapeErrorIncorrectStateEventHandler,
} from "./media-item.scrape.error.incorrect-state.event.ts";
import {
  MediaItemScrapeSuccessEvent,
  MediaItemScrapeSuccessEventHandler,
} from "./media-item.scrape.success.event.ts";

export const RivenEvent = z.discriminatedUnion("type", [
  CoreStartedEvent,
  MediaItemCreationSuccessEvent,
  MediaItemCreationErrorConflictEvent,
  MediaItemCreationErrorEvent,
  MediaItemIndexRequestedEvent,
  MediaItemIndexSuccessEvent,
  MediaItemIndexErrorIncorrectStateEvent,
  MediaItemIndexErrorEvent,
  ContentServiceRequestedEvent,
  CoreShutdownEvent,
  MediaItemScrapeRequestedEvent,
  MediaItemScrapeSuccessEvent,
  MediaItemScrapeErrorIncorrectStateEvent,
  MediaItemScrapeErrorEvent,
  MediaItemDownloadRequestedEvent,
  MediaItemDownloadErrorIncorrectStateEvent,
  MediaItemDownloadErrorEvent,
  MediaItemDownloadSuccessEvent,
]);

export type RivenEvent = z.infer<typeof RivenEvent>;

export const RivenEventHandler = {
  // Program lifecycle
  "riven.core.started": CoreStartedEventHandler,
  "riven.core.shutdown": CoreShutdownEventHandler,

  // Content services
  "riven.content-service.requested": ContentServiceRequestedEventHandler,

  // Item creation
  "riven.media-item.creation.error.conflict":
    MediaItemCreationErrorConflictEventHandler,
  "riven.media-item.creation.error": MediaItemCreationErrorEventHandler,
  "riven.media-item.creation.success": MediaItemCreationSuccessEventHandler,

  // Item indexing
  "riven.media-item.index.requested": MediaItemIndexRequestedEventHandler,
  "riven.media-item.index.error": MediaItemIndexErrorEventHandler,
  "riven.media-item.index.error.incorrect-state":
    MediaItemIndexErrorIncorrectStateEventHandler,
  "riven.media-item.index.success": MediaItemIndexSuccessEventHandler,

  // Item scraping
  "riven.media-item.scrape.requested": MediaItemScrapeRequestedEventHandler,
  "riven.media-item.scrape.error": MediaItemScrapeErrorEventHandler,
  "riven.media-item.scrape.error.incorrect-state":
    MediaItemScrapeErrorIncorrectStateEventHandler,
  "riven.media-item.scrape.success": MediaItemScrapeSuccessEventHandler,

  // Item downloading
  "riven.media-item.download.requested": MediaItemDownloadRequestedEventHandler,
  "riven.media-item.download.error": MediaItemDownloadErrorEventHandler,
  "riven.media-item.download.error.incorrect-state":
    MediaItemDownloadErrorIncorrectStateEventHandler,
  "riven.media-item.download.success": MediaItemDownloadSuccessEventHandler,
} as const satisfies Record<RivenEvent["type"], z.ZodFunction>;
