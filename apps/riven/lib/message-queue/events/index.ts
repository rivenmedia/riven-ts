import z from "zod";

import { RequestContentServicesEvent } from "./request-content-services.event.ts";
import { RetryItemDownload } from "./retry-item-download.event.ts";
import { RetryLibraryEvent } from "./retry-library.event.ts";

export const RivenInternalEvent = z.discriminatedUnion("type", [
  RetryLibraryEvent,
  RetryItemDownload,
  RequestContentServicesEvent,
]);

export type RivenInternalEvent = z.infer<typeof RivenInternalEvent>;
