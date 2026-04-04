import { createInternalEventSchema } from "../utilities/create-internal-event-schema.ts";

export const RetryLibraryEvent = createInternalEventSchema("retry-library");

export type RetryLibraryEvent = typeof RetryLibraryEvent.infer;
