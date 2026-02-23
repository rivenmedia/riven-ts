import z from "zod";

import { RetryItemDownload } from "./retry-item-download.event.ts";
import { RetryLibraryEvent } from "./retry-library.event.ts";

export const RivenInternalEvent = z.discriminatedUnion("type", [
  RetryLibraryEvent,
  RetryItemDownload,
]);

export type RivenInternalEvent = z.infer<typeof RivenInternalEvent>;
