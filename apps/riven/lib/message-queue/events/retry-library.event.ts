import { createInternalEventSchema } from "../utilities/create-internal-event-schema.ts";

import type z from "zod";

export const RetryLibraryEvent = createInternalEventSchema("retry-library");

export type RetryLibraryEvent = z.infer<typeof RetryLibraryEvent>;
