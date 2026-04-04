import { type } from "arktype";

import { RequestContentServicesEvent } from "./request-content-services.event.ts";
import { RetryItemDownload } from "./retry-item-download.event.ts";
import { RetryLibraryEvent } from "./retry-library.event.ts";

export const RivenInternalEvent = type
  .or(RetryLibraryEvent)
  .or(RetryItemDownload)
  .or(RequestContentServicesEvent);

export type RivenInternalEvent = typeof RivenInternalEvent.infer;
