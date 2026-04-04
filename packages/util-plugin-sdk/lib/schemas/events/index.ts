import { type Type, type } from "arktype";

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
  ItemRequestCreateErrorConflictEvent,
  ItemRequestCreateErrorConflictEventHandler,
} from "./item-request.create.error.conflict.event.ts";
import {
  ItemRequestCreateErrorEvent,
  ItemRequestCreateErrorEventHandler,
} from "./item-request.create.error.event.ts";
import {
  ItemRequestCreateSuccessEvent,
  ItemRequestCreateSuccessEventHandler,
} from "./item-request.create.success.event.ts";
import {
  ItemRequestUpdateSuccessEvent,
  ItemRequestUpdateSuccessEventHandler,
} from "./item-request.update.success.event.ts";
import {
  MediaItemDownloadRequestedEvent,
  MediaItemDownloadRequestedEventHandler,
} from "./media-item.download-requested.event.ts";
import {
  MediaItemDownloadCacheCheckRequestedEvent,
  MediaItemDownloadCacheCheckRequestedEventHandler,
} from "./media-item.download.cache-check-requested.event.ts";
import {
  MediaItemDownloadErrorEvent,
  MediaItemDownloadErrorEventHandler,
} from "./media-item.download.error.event.ts";
import {
  MediaItemDownloadErrorIncorrectStateEvent,
  MediaItemDownloadErrorIncorrectStateEventHandler,
} from "./media-item.download.incorrect-state.event.ts";
import {
  MediaItemDownloadPartialSuccessEvent,
  MediaItemDownloadPartialSuccessEventHandler,
} from "./media-item.download.partial-success.event.ts";
import {
  MediaItemDownloadProviderListRequestedEvent,
  MediaItemDownloadProviderListRequestedEventHandler,
} from "./media-item.download.provider-list-requested.event.ts";
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
  MediaItemScrapeErrorNoNewStreamsEvent,
  MediaItemScrapeErrorNoNewStreamsEventHandler,
} from "./media-item.scrape.error.no-new-streams.event.ts";
import {
  MediaItemScrapeSuccessEvent,
  MediaItemScrapeSuccessEventHandler,
} from "./media-item.scrape.success.event.ts";
import {
  MediaItemStreamLinkRequestedEvent,
  MediaItemStreamLinkRequestedEventHandler,
} from "./media-item.stream-link-requested.event.ts";

export const RivenEvent = CoreStartedEvent.or(ItemRequestCreateSuccessEvent)
  .or(ItemRequestCreateErrorEvent)
  .or(ItemRequestCreateErrorConflictEvent)
  .or(ItemRequestUpdateSuccessEvent)
  .or(MediaItemIndexRequestedEvent)
  .or(MediaItemIndexSuccessEvent)
  .or(MediaItemIndexErrorIncorrectStateEvent)
  .or(MediaItemIndexErrorEvent)
  .or(ContentServiceRequestedEvent)
  .or(CoreShutdownEvent)
  .or(MediaItemScrapeRequestedEvent)
  .or(MediaItemScrapeSuccessEvent)
  .or(MediaItemScrapeErrorNoNewStreamsEvent)
  .or(MediaItemScrapeErrorIncorrectStateEvent)
  .or(MediaItemScrapeErrorEvent)
  .or(MediaItemDownloadRequestedEvent)
  .or(MediaItemDownloadCacheCheckRequestedEvent)
  .or(MediaItemDownloadErrorIncorrectStateEvent)
  .or(MediaItemDownloadErrorEvent)
  .or(MediaItemDownloadPartialSuccessEvent)
  .or(MediaItemDownloadProviderListRequestedEvent)
  .or(MediaItemDownloadSuccessEvent)
  .or(MediaItemStreamLinkRequestedEvent);

export type RivenEvent = typeof RivenEvent.infer;

export const RivenEventSchemaMap = new Map<RivenEvent["type"], Type>(
  RivenEvent.distribute((branch) => [branch.expression, branch]),
);

console.log({ RivenEventSchemaMap });

// export const RivenEventSchemaMap = new Map<RivenEvent["type"], Type>(
//   RivenEvent.distribute((option) => [
//     option.shape.type.value,
//     type(option.shape),
//   ]),
// );

export const RivenEventHandler = {
  // Program lifecycle
  "riven.core.started": CoreStartedEventHandler,
  "riven.core.shutdown": CoreShutdownEventHandler,

  // Content services
  "riven.content-service.requested": ContentServiceRequestedEventHandler,

  // Item request
  "riven.item-request.create.success": ItemRequestCreateSuccessEventHandler,
  "riven.item-request.create.error": ItemRequestCreateErrorEventHandler,
  "riven.item-request.create.error.conflict":
    ItemRequestCreateErrorConflictEventHandler,
  "riven.item-request.update.success": ItemRequestUpdateSuccessEventHandler,

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
  "riven.media-item.scrape.error.no-new-streams":
    MediaItemScrapeErrorNoNewStreamsEventHandler,
  "riven.media-item.scrape.success": MediaItemScrapeSuccessEventHandler,

  // Item downloading
  "riven.media-item.download.requested": MediaItemDownloadRequestedEventHandler,
  "riven.media-item.download.cache-check-requested":
    MediaItemDownloadCacheCheckRequestedEventHandler,
  "riven.media-item.download.error": MediaItemDownloadErrorEventHandler,
  "riven.media-item.download.error.incorrect-state":
    MediaItemDownloadErrorIncorrectStateEventHandler,
  "riven.media-item.download.partial-success":
    MediaItemDownloadPartialSuccessEventHandler,
  "riven.media-item.download.provider-list-requested":
    MediaItemDownloadProviderListRequestedEventHandler,
  "riven.media-item.download.success": MediaItemDownloadSuccessEventHandler,

  // Item streaming
  "riven.media-item.stream-link.requested":
    MediaItemStreamLinkRequestedEventHandler,
} as const;
